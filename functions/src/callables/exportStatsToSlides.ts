import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { defineString } from 'firebase-functions/params';
import { google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';
import { getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { isCallerAdmin } from '../lib/admin';
import type { UiLang, VitrineStats } from './vitrineTypes';
import { buildVitrineExportBundle, localeForLang } from './vitrineExportBundle';
import { createVitrineScratchPresentation } from './createVitrineScratchPresentation';

const SLIDES_EXPORT_FOLDER_ID = defineString('GOOGLE_SLIDES_EXPORT_FOLDER_ID', { default: '' });

// Optional: run Drive/Slides operations as a real Google user (OAuth) instead of the
// Cloud Functions service account (avoids service-account Drive quota issues).
const GOOGLE_OAUTH_CLIENT_ID = defineString('GOOGLE_OAUTH_CLIENT_ID', { default: '' });
const GOOGLE_OAUTH_CLIENT_SECRET = defineString('GOOGLE_OAUTH_CLIENT_SECRET', { default: '' });
const GOOGLE_OAUTH_REFRESH_TOKEN = defineString('GOOGLE_OAUTH_REFRESH_TOKEN', { default: '' });

type VitrineTemplateConfig = {
  /** `scratch` = deck généré par l’API Slides sans copier le master. */
  export_mode?: 'template' | 'scratch';
  template_id?: string;
  templateId?: string;
  /** Optional override per UI language. */
  template_id_by_lang?: Partial<Record<'fr' | 'en' | 'es', string>>;
  language?: 'fr' | 'en' | 'es' | 'multi';
  nonDeriveRules?: { fixedSlideCount?: number; fixedOrder?: boolean; fixedTitles?: boolean };
  placeholders: {
    text: string[];
    images: Array<{ shapeText: string; kind: 'sectors_bar' | 'growth_line' | 'needs_bar' }>;
  };
  fallbackPolicy: { dash: string; emptyList: string; unknown: string };
};

function loadVitrineTemplateConfig(): VitrineTemplateConfig {
  // Firebase deploy uploads the `functions/` directory. Keep a copy under `functions/config/`.
  const p = path.resolve(__dirname, '../../config/vitrine-template.json');
  const raw = fs.readFileSync(p, 'utf8');
  const parsed = JSON.parse(raw) as VitrineTemplateConfig;
  const mode = String(parsed?.export_mode ?? 'template')
    .trim()
    .toLowerCase();
  if (mode !== 'scratch') {
    const templateId = String(parsed?.template_id ?? parsed?.templateId ?? '').trim();
    if (!templateId) {
      throw new Error('Template config: template_id manquant (ou définissez export_mode à "scratch").');
    }
  }
  return parsed;
}

function toMillis(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  if (v instanceof Timestamp) return v.toMillis();
  const t = v as { toDate?: () => Date } | undefined;
  if (t?.toDate) {
    try {
      return t.toDate().getTime();
    } catch {
      return 0;
    }
  }
  return 0;
}

function isoDay(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function sanitizeStringArray(raw: unknown, limit: number): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    if (typeof x !== 'string') continue;
    const s = x.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

function getGoogleAuth(scopes: string[]) {
  return new google.auth.GoogleAuth({ scopes });
}

const GOOGLE_SCOPES = [
  // Needed to create/copy the presentation file in Drive.
  'https://www.googleapis.com/auth/drive',
  // Needed to batchUpdate Slides content.
  'https://www.googleapis.com/auth/presentations',
] as const;

function getEffectiveAuth() {
  const clientId = String(GOOGLE_OAUTH_CLIENT_ID.value() ?? '').trim();
  const clientSecret = String(GOOGLE_OAUTH_CLIENT_SECRET.value() ?? '').trim();
  const refreshToken = String(GOOGLE_OAUTH_REFRESH_TOKEN.value() ?? '').trim();
  if (clientId && clientSecret && refreshToken) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: refreshToken });
    return oauth2;
  }
  return getGoogleAuth([...GOOGLE_SCOPES]);
}

function getDrive(auth: any) {
  return google.drive({ version: 'v3', auth });
}

function getSlides(auth: any) {
  return google.slides({ version: 'v1', auth });
}

async function loadVitrineStats(): Promise<VitrineStats> {
  const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
  const [usersSnap, requestsSnap] = await Promise.all([
    db.collection('users').get(),
    db
      .collection('member_requests')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()
      .catch(() => null),
  ]);

  const nowMs = Date.now();
  const d30 = nowMs - 30 * 24 * 3600 * 1000;
  const d60 = nowMs - 60 * 24 * 3600 * 1000;

  const bySector = new Map<string, number>();
  const regByDay = new Map<string, number>();
  const passionToMembers = new Map<string, Set<string>>();
  const passionToSectors = new Map<string, Set<string>>();

  let totalMembers = 0;
  let newMembersLast30d = 0;
  let prevNewMembers30d = 0;
  let profileViewsCumul = 0;
  let contactClicksCumul = 0;

  // Needs: we reuse the same categories used by the UI.
  const NEED_LABELS: Record<string, string> = {
    partners: 'Partenaires commerciaux',
    distributors: 'Distributeurs / importateurs',
    clients: 'Clients',
    suppliers: 'Fournisseurs',
    investors: 'Investisseurs / financement',
    experts: 'Experts locaux',
    talent: 'Recrutement / talent',
    visibility: 'Visibilité',
    other: 'Autres besoins',
  };
  const needsCount = new Map<string, number>();

  const highlightedToCategory = (id: string): string => {
    const key = id.trim().toUpperCase();
    if (key === 'NEED_PARTNERS') return 'partners';
    if (key === 'NEED_CLIENTS') return 'clients';
    if (key === 'NEED_DISTRIB') return 'distributors';
    if (key === 'NEED_SUPPLIERS') return 'suppliers';
    if (key === 'NEED_INVESTORS') return 'investors';
    if (key === 'NEED_HR') return 'talent';
    if (key === 'NEED_VISIBILITY') return 'visibility';
    if (key === 'NEED_MENTOR' || key === 'NEED_ECOSYSTEM' || key === 'NEED_RESEARCH') return 'experts';
    return 'other';
  };

  const recentMembersAll: Array<{ uid: string; createdAtMs: number; sector: string; primaryNeed: string }> = [];

  for (const doc of usersSnap.docs) {
    const d = doc.data() as Record<string, unknown>;
    // Do not count admin as a member.
    if (String(d.role ?? '').trim().toLowerCase() === 'admin') continue;

    totalMembers += 1;

    const createdAtMs = toMillis(d.createdAt);
    if (createdAtMs > 0) {
      if (createdAtMs >= d30) newMembersLast30d += 1;
      if (createdAtMs < d30 && createdAtMs >= d60) prevNewMembers30d += 1;
      const day = isoDay(createdAtMs);
      if (day) regByDay.set(day, (regByDay.get(day) ?? 0) + 1);
    }

    const sector = String(d.activityCategory ?? (d as any).sector ?? '—').trim() || '—';
    bySector.set(sector, (bySector.get(sector) ?? 0) + 1);

    // Passions / affinités (IDs uniquement ici).
    const passions = sanitizeStringArray((d as any).passionIds, 10);
    if (passions.length) {
      for (const pid of passions) {
        if (!passionToMembers.has(pid)) passionToMembers.set(pid, new Set());
        if (!passionToSectors.has(pid)) passionToSectors.set(pid, new Set());
        passionToMembers.get(pid)!.add(doc.id);
        passionToSectors.get(pid)!.add(sector);
      }
    }

    const v = Number((d as any).publicProfileViewCount ?? (d as any).profileViewCount ?? (d as any).profileViews ?? 0) || 0;
    const c = Number((d as any).publicContactClickCount ?? (d as any).contactClickCount ?? (d as any).contactClicks ?? 0) || 0;
    if (v > 0) profileViewsCumul += Math.max(0, Math.floor(v));
    if (c > 0) contactClicksCumul += Math.max(0, Math.floor(c));

    const ids = Array.isArray((d as any).highlightedNeeds) ? ((d as any).highlightedNeeds as unknown[]) : [];
    const seen = new Set<string>();
    for (const raw of ids) {
      const s = String(raw ?? '').trim();
      if (!s) continue;
      const cat = highlightedToCategory(s);
      if (seen.has(cat)) continue;
      seen.add(cat);
      needsCount.set(cat, (needsCount.get(cat) ?? 0) + 1);
    }

    // Recent members slide (keep lightweight, 4 latest by createdAt)
    const primaryNeedCat = ids.map((x) => highlightedToCategory(String(x ?? ''))).find(Boolean) as string | undefined;
    const primaryNeed = primaryNeedCat ? primaryNeedCat : '';
    recentMembersAll.push({ uid: doc.id, createdAtMs: createdAtMs || 0, sector, primaryNeed });
  }

  const topSectors = Array.from(bySector.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const sortedDays = Array.from(regByDay.keys()).sort();
  let cumul = 0;
  const growthCumulative = sortedDays.map((date) => {
    cumul += regByDay.get(date) ?? 0;
    return { date, count: cumul };
  });

  const needs = Array.from(needsCount.entries())
    .map(([key, count]) => ({ key, label: NEED_LABELS[key] ?? key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topPassions = Array.from(passionToSectors.entries())
    .map(([passionId, sectors]) => ({
      passionId,
      memberCount: passionToMembers.get(passionId)?.size ?? 0,
      sectorCount: sectors.size,
    }))
    .sort((a, b) => b.sectorCount - a.sectorCount || b.memberCount - a.memberCount)
    .slice(0, 8);

  const recentMembers = recentMembersAll
    .filter((m) => m.createdAtMs > 0)
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .slice(0, 4);

  const recentRequests: Array<{ id: string; createdAtMs: number; expiresAtMs: number; title: string }> = [];
  if (requestsSnap) {
    for (const doc of requestsSnap.docs) {
      const d = doc.data() as Record<string, unknown>;
      const createdAtMs = toMillis(d.createdAt) || (typeof d.createdAt === 'number' ? d.createdAt : 0);
      const expiresAtMs = toMillis(d.expiresAt) || (typeof d.expiresAt === 'number' ? d.expiresAt : 0);
      if (!createdAtMs || !expiresAtMs) continue;
      if (expiresAtMs <= nowMs) continue;
      const sector = typeof d.sector === 'string' ? d.sector.trim() : '';
      const pos = typeof d.productOrService === 'string' ? d.productOrService.trim() : '';
      const text = typeof d.text === 'string' ? d.text.trim() : '';
      const title = [pos, sector].filter(Boolean).join(' — ') || text.slice(0, 140) || 'Demande réseau';
      recentRequests.push({ id: doc.id, createdAtMs, expiresAtMs, title });
      if (recentRequests.length >= 5) break;
    }
  }

  return {
    totalMembers,
    newMembersLast30d,
    prevNewMembers30d,
    profileViewsCumul,
    contactClicksCumul,
    topSectors,
    growthCumulative,
    needs,
    topPassions,
    recentMembers,
    recentRequests,
  };
}

function slidesUrl(presentationId: string, opts?: { templateId?: string; lang?: string }): string {
  const base = `https://docs.google.com/presentation/d/${presentationId}/edit`;
  const qp = new URLSearchParams();
  if (opts?.templateId) qp.set('templateId', opts.templateId);
  if (opts?.lang) qp.set('lang', opts.lang);
  const s = qp.toString();
  return s ? `${base}?${s}` : base;
}

function setToken(tokens: Map<string, string>, key: string, value: unknown) {
  const v = value === undefined || value === null ? '' : String(value);
  tokens.set(`{{${key}}}`, v);
}

function flattenTokens(
  tokens: Map<string, string>,
  value: unknown,
  prefix: string,
  arrayLimits: Record<string, number>
) {
  if (value == null) return;
  if (typeof value !== 'object') {
    setToken(tokens, prefix, value);
    return;
  }
  if (Array.isArray(value)) {
    const lim = arrayLimits[prefix] ?? value.length;
    for (let i = 0; i < Math.min(value.length, lim); i++) {
      flattenTokens(tokens, value[i], `${prefix}.${i}`, arrayLimits);
    }
    return;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    flattenTokens(tokens, v, `${prefix}.${k}`, arrayLimits);
  }
}

async function copyTemplatePresentation(
  drive: ReturnType<typeof google.drive>,
  templateId: string,
  title: string,
  folderId: string
): Promise<string> {
  const res = await drive.files.copy({
    fileId: templateId,
    requestBody: {
      name: title,
      ...(folderId ? { parents: [folderId] } : {}),
    },
    fields: 'id',
  });
  const id = res.data.id;
  if (!id) throw new Error('Drive copy: id manquant');
  return id;
}

async function fillPresentation(
  slides: ReturnType<typeof google.slides>,
  presentationId: string,
  stats: VitrineStats,
  lang: UiLang
) {
  const cfg = loadVitrineTemplateConfig();
  const dash = cfg.fallbackPolicy?.dash ?? '—';
  const listDash = cfg.fallbackPolicy?.emptyList ?? '—';
  const bundle = buildVitrineExportBundle(stats, lang, listDash);

  // ---------------------------------------------------------------------------
  // Token map: legacy {{KPI_*}} + VitrineData-style placeholders.
  // We rewrite whole text boxes/table cells so styled runs cannot break matching.
  // ---------------------------------------------------------------------------
  const tokenMap = new Map<string, string>();
  tokenMap.set('{{DOC_TITLE}}', bundle.docTitle);
  tokenMap.set('{{MONTH_TITLE}}', bundle.month);
  tokenMap.set('{{EXTRACT_DATE_LONG}}', bundle.extractDateLong);
  tokenMap.set('{{FOOTER_DATE_LONG}}', bundle.extractDateLong);
  tokenMap.set('{{FOOTER_SOURCE}}', bundle.footerSource);
  tokenMap.set('{{KPI_MEMBERS}}', bundle.kpiMembers);
  tokenMap.set('{{KPI_NEW_30D}}', bundle.kpiNew);
  tokenMap.set('{{KPI_PROFILE_VIEWS}}', bundle.kpiViews);
  tokenMap.set('{{KPI_CONTACT_CLICKS}}', bundle.kpiClicks);
  tokenMap.set('{{KPI_POTENTIAL_CONNECTIONS}}', bundle.kpiPotentialConnections);
  tokenMap.set('{{AFFINITIES_LIST}}', bundle.affinitiesList || dash);
  tokenMap.set('{{AFFINITIES_INSIGHTS}}', bundle.affinitiesInsights || dash);
  tokenMap.set('{{SECTORS_LIST}}', bundle.sectorsList || dash);
  tokenMap.set('{{GROWTH_SUMMARY}}', bundle.growthSummary || dash);
  tokenMap.set('{{RECENT_ACTIVITY_LIST}}', bundle.recentActivityList || dash);
  tokenMap.set('{{MOST_SOUGHT_LIST}}', bundle.mostSoughtList || dash);
  tokenMap.set('{{ACTIVE_OPPS_LIST}}', bundle.activeOppsList || dash);
  tokenMap.set('{{ACTIVE_OPPS_WHY}}', bundle.activeOppsWhy || dash);
  tokenMap.set('{{RECENT_REQUESTS_LIST}}', bundle.recentRequestsList || dash);
  tokenMap.set('{{RECENT_REQUESTS_WHY}}', bundle.recentRequestsWhy || dash);
  tokenMap.set('{{CTA_CARDS}}', bundle.ctaCards || dash);

  const vitrineDataLike = {
    report_month_year_fr: bundle.month,
    extraction_date_fr_long: bundle.extractDateLong,
    hero_stats: {
      members_count: bundle.kpiMembers,
      active_opportunities_count: stats.recentRequests.length ? String(stats.recentRequests.length) : '0',
      month_growth_percent: '',
      sectors_count: String(stats.topSectors.length || 0),
    },
    indicators: {
      active_decision_makers: bundle.kpiMembers,
      new_this_month: bundle.kpiNew,
      profile_views: bundle.kpiViews,
      introductions_started: bundle.kpiClicks,
      potential_connections: bundle.kpiPotentialConnections,
    },
    affinities: stats.topPassions.slice(0, 5).map((p) => ({
      name: p.passionId,
      badge: '',
      members: p.memberCount,
      sectors_or_universes: p.sectorCount,
      sectors_or_universes_label: 'secteurs',
      insight: '',
    })),
    sectors: stats.topSectors.slice(0, 8).map((s) => ({ name: s.name, count: s.value })),
    recent_activity: stats.recentMembers.slice(0, 4).map((m) => ({
      sector: m.sector,
      need: m.primaryNeed,
      relative_date: m.createdAtMs ? new Date(m.createdAtMs).toLocaleDateString(localeForLang(lang)) : '',
    })),
    top_requested_opportunities: stats.needs.slice(0, 8).map((n) => ({ category: n.label, count: n.count })),
    active_opportunities: stats.needs.slice(0, 6).map((n) => ({ category: n.label, badge: '', requests: n.count, insight: '', url: '' })),
    footer: {
      website: 'franconetwork.app',
      date_value: bundle.extractDateLong,
      source: bundle.footerSource,
    },
  };

  const tokens = new Map<string, string>();
  const arrayLimits: Record<string, number> = {
    affinities: 5,
    sectors: 8,
    recent_activity: 4,
    top_requested_opportunities: 6,
    active_opportunities: 6,
    cta_blocks: 3,
  };
  for (const [k, v] of Object.entries(vitrineDataLike)) {
    flattenTokens(tokens, v, k, arrayLimits);
  }
  for (const [token, value] of tokens.entries()) {
    if (!value) continue;
    tokenMap.set(token, value);
  }

  const pres = await slides.presentations.get({ presentationId });
  const requests: any[] = buildWholeShapeReplaceRequests(pres.data, tokenMap);
  requests.push(
    {
      replaceAllShapesWithImage: {
        imageUrl: bundle.chartSectors,
        replaceMethod: 'CENTER_INSIDE',
        containsText: { text: '{{CHART_SECTORS}}', matchCase: true },
      },
    },
    {
      replaceAllShapesWithImage: {
        imageUrl: bundle.chartGrowth,
        replaceMethod: 'CENTER_INSIDE',
        containsText: { text: '{{CHART_GROWTH}}', matchCase: true },
      },
    },
    {
      replaceAllShapesWithImage: {
        imageUrl: bundle.chartNeeds,
        replaceMethod: 'CENTER_INSIDE',
        containsText: { text: '{{CHART_NEEDS}}', matchCase: true },
      },
    }
  );

  await slides.presentations.batchUpdate({
    presentationId,
    requestBody: { requests },
  });
}

/** Concatenate text runs only (same as Slides “logical” text for placeholders split across runs). */
function shapeTextFromTextElements(textElements: any[] | undefined): string {
  if (!Array.isArray(textElements)) return '';
  let out = '';
  for (const te of textElements) {
    const tr = te?.textRun;
    const content = typeof tr?.content === 'string' ? tr.content : '';
    if (content) out += content;
  }
  return out;
}

function collectTextFromPresentation(pres: any): string {
  const out: string[] = [];
  const slides = pres?.slides ?? [];
  for (const s of slides) {
    const pageElements = s?.pageElements ?? [];
    for (const pe of pageElements) {
      collectTextFromPageElement(pe, out);
    }
  }
  return out.join('');
}

function collectTextFromPageElement(pe: any, out: string[]) {
  const shape = pe?.shape;
  const textElements = shape?.text?.textElements;
  if (Array.isArray(textElements)) {
    const t = shapeTextFromTextElements(textElements);
    if (t) out.push(t);
  }
  const table = pe?.table;
  const rows = table?.tableRows;
  if (Array.isArray(rows)) {
    for (const row of rows) {
      const cells = row?.tableCells;
      if (!Array.isArray(cells)) continue;
      for (const cell of cells) {
        const te = cell?.text?.textElements;
        if (Array.isArray(te)) {
          const t = shapeTextFromTextElements(te);
          if (t) out.push(t);
        }
      }
    }
  }
  const children = pe?.elementGroup?.children ?? pe?.group?.children;
  if (Array.isArray(children)) {
    for (const ch of children) collectTextFromPageElement(ch, out);
  }
}

type TableCellLoc = { rowIndex: number; columnIndex: number };

/** Shapes that only hold chart tokens still need a rewrite so one text run contains `{{CHART_*}}` (API image replace matches contiguous shape text poorly across runs). */
const CHART_PLACEHOLDER_MARKERS = ['{{CHART_SECTORS}}', '{{CHART_GROWTH}}', '{{CHART_NEEDS}}'] as const;

function applyReplacementsLongestFirst(text: string, tokenMap: Map<string, string>): string {
  const keys = Array.from(tokenMap.keys()).sort((a, b) => b.length - a.length);
  let out = text;
  for (const key of keys) {
    const val = tokenMap.get(key);
    if (val === undefined) continue;
    if (!key) continue;
    if (!out.includes(key)) continue;
    out = out.split(key).join(val);
  }
  return out;
}

/**
 * Google Slides `replaceAllText` often fails when a placeholder is split across multiple styled
 * text runs. Rewriting the whole text box / table cell fixes that.
 */
function buildWholeShapeReplaceRequests(
  pres: any,
  tokenMap: Map<string, string>
): any[] {
  const requests: any[] = [];
  const slides = pres?.slides ?? [];
  for (const s of slides) {
    const pageElements = s?.pageElements ?? [];
    for (const pe of pageElements) {
      walkPageElementForText(pe, tokenMap, requests);
    }
  }
  return requests;
}

function walkPageElementForText(pe: any, tokenMap: Map<string, string>, requests: any[]) {
  const objectId = typeof pe?.objectId === 'string' ? pe.objectId : '';
  if (!objectId) {
    const children = pe?.elementGroup?.children ?? pe?.group?.children;
    if (Array.isArray(children)) {
      for (const ch of children) walkPageElementForText(ch, tokenMap, requests);
    }
    return;
  }

  const shape = pe?.shape;
  const textElements = shape?.text?.textElements;
  if (Array.isArray(textElements)) {
    const before = shapeTextFromTextElements(textElements);
    const after = applyReplacementsLongestFirst(before, tokenMap);
    const needsChartMerge = CHART_PLACEHOLDER_MARKERS.some((m) => before.includes(m));
    if (after !== before || needsChartMerge) {
      requests.push({
        deleteText: {
          objectId,
          textRange: { type: 'ALL' },
        },
      });
      requests.push({
        insertText: {
          objectId,
          insertionIndex: 0,
          text: after,
        },
      });
    }
  }

  const table = pe?.table;
  const rows = table?.tableRows;
  if (Array.isArray(rows)) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const cells = row?.tableCells;
      if (!Array.isArray(cells)) continue;
      for (let c = 0; c < cells.length; c++) {
        const cell = cells[c];
        const te = cell?.text?.textElements;
        if (!Array.isArray(te)) continue;
        const before = shapeTextFromTextElements(te);
        const after = applyReplacementsLongestFirst(before, tokenMap);
        const needsChartMerge = CHART_PLACEHOLDER_MARKERS.some((m) => before.includes(m));
        if (after === before && !needsChartMerge) continue;
        const cellLocation: TableCellLoc = { rowIndex: r, columnIndex: c };
        requests.push({
          deleteText: {
            objectId,
            cellLocation,
            textRange: { type: 'ALL' },
          },
        });
        requests.push({
          insertText: {
            objectId,
            cellLocation,
            insertionIndex: 0,
            text: after,
          },
        });
      }
    }
  }

  const children = pe?.elementGroup?.children ?? pe?.group?.children;
  if (Array.isArray(children)) {
    for (const ch of children) walkPageElementForText(ch, tokenMap, requests);
  }
}

function extractPlaceholders(text: string): string[] {
  const re = /\{\{[^}]{1,120}\}\}/g;
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    found.add(m[0] ?? '');
    if (found.size > 500) break;
  }
  return Array.from(found).sort();
}

export const exportStatsToSlides = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }
    const ok = await isCallerAdmin(request.auth.uid, request.auth.token.email ?? null);
    if (!ok) {
      throw new HttpsError('permission-denied', 'Réservé aux admins.');
    }

    try {
      const cfg = loadVitrineTemplateConfig();
      const rawLang = String(request.data?.lang ?? 'fr').trim().toLowerCase();
      const lang: UiLang = rawLang === 'en' ? 'en' : rawLang === 'es' ? 'es' : 'fr';
      const exportMode =
        String(cfg.export_mode ?? 'template')
          .trim()
          .toLowerCase() === 'scratch'
          ? 'scratch'
          : 'template';

      const stats = await loadVitrineStats();
      const listDash = cfg.fallbackPolicy?.emptyList ?? '—';
      const bundle = buildVitrineExportBundle(stats, lang, listDash);
      const title = bundle.docTitle;

      const perLangRaw = String(cfg.template_id_by_lang?.[lang] ?? '').trim();
      const baseRaw = String(cfg.template_id ?? cfg.templateId ?? '').trim();
      const templateId = perLangRaw || baseRaw;
      const folderId = String(SLIDES_EXPORT_FOLDER_ID.value() ?? '').trim();

      const auth = getEffectiveAuth();
      const drive = getDrive(auth);
      const slides = getSlides(auth);

      let presentationId: string;
      if (exportMode === 'scratch') {
        presentationId = await createVitrineScratchPresentation(slides, drive, title, folderId, bundle, lang);
      } else {
        if (!templateId) {
          throw new Error('Template Slides manquant (config/vitrine-template.json).');
        }
        presentationId = await copyTemplatePresentation(drive, templateId, title, folderId);
        await fillPresentation(slides, presentationId, stats, lang);
      }

      const url =
        exportMode === 'scratch'
          ? slidesUrl(presentationId, { lang })
          : slidesUrl(presentationId, { templateId, lang });

      const pres = await slides.presentations.get({ presentationId });
      const text = collectTextFromPresentation(pres.data);
      const leftover = extractPlaceholders(text);
      logger.info('Slides deck generated', { presentationId, templateId, lang, exportMode });
      return {
        ok: true,
        presentationId,
        url,
        debug: {
          templateId: exportMode === 'scratch' ? undefined : templateId,
          lang,
          exportMode,
          leftoverPlaceholders: leftover,
        },
      };
    } catch (err) {
      const anyErr = err as any;
      const status = Number(anyErr?.response?.status ?? anyErr?.code ?? 0) || undefined;
      const apiMessage =
        anyErr?.response?.data?.error?.message ??
        anyErr?.response?.data?.error_description ??
        anyErr?.errors?.[0]?.message ??
        undefined;
      const apiReason =
        anyErr?.response?.data?.error?.errors?.[0]?.reason ??
        anyErr?.errors?.[0]?.reason ??
        undefined;
      const debug = {
        status,
        apiMessage,
        apiReason,
        name: typeof anyErr?.name === 'string' ? anyErr.name : undefined,
        message: typeof anyErr?.message === 'string' ? anyErr.message : undefined,
        hint:
          apiReason === 'accessNotConfigured' || String(apiMessage ?? '').includes('has not been used')
            ? 'Activer Google Drive API + Google Slides API dans Google Cloud du projet.'
            : undefined,
      };
      logger.error('exportStatsToSlides failed', { debug, err: anyErr });
      throw new HttpsError('internal', 'Export Slides échoué.', debug);
    }
  }
);

