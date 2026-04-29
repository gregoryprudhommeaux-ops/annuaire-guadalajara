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

const SLIDES_EXPORT_FOLDER_ID = defineString('GOOGLE_SLIDES_EXPORT_FOLDER_ID', { default: '' });

// Optional: run Drive/Slides operations as a real Google user (OAuth) instead of the
// Cloud Functions service account (avoids service-account Drive quota issues).
const GOOGLE_OAUTH_CLIENT_ID = defineString('GOOGLE_OAUTH_CLIENT_ID', { default: '' });
const GOOGLE_OAUTH_CLIENT_SECRET = defineString('GOOGLE_OAUTH_CLIENT_SECRET', { default: '' });
const GOOGLE_OAUTH_REFRESH_TOKEN = defineString('GOOGLE_OAUTH_REFRESH_TOKEN', { default: '' });

type VitrineStats = {
  totalMembers: number;
  newMembersLast30d: number;
  prevNewMembers30d: number;
  profileViewsCumul: number;
  contactClicksCumul: number;
  topSectors: Array<{ name: string; value: number }>;
  growthCumulative: Array<{ date: string; count: number }>;
  needs: Array<{ key: string; label: string; count: number }>;
  topPassions: Array<{ passionId: string; memberCount: number; sectorCount: number }>;
  recentMembers: Array<{ uid: string; createdAtMs: number; sector: string; primaryNeed: string }>;
  recentRequests: Array<{ id: string; createdAtMs: number; expiresAtMs: number; title: string }>;
};

type VitrineTemplateConfig = {
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
  const templateId = String(parsed?.template_id ?? parsed?.templateId ?? '').trim();
  if (!templateId) throw new Error('Template config: template_id manquant.');
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

type UiLang = 'fr' | 'en' | 'es';

function localeForLang(lang: UiLang): string {
  return lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-US' : 'fr-FR';
}

function monthTitle(now: Date, lang: UiLang): string {
  return now.toLocaleDateString(localeForLang(lang), { month: 'long', year: 'numeric' });
}

function longDate(now: Date, lang: UiLang): string {
  return now.toLocaleDateString(localeForLang(lang), { day: 'numeric', month: 'long', year: 'numeric' });
}

function slidesUrl(presentationId: string): string {
  return `https://docs.google.com/presentation/d/${presentationId}/edit`;
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

// NOTE: non-derive rule — we no longer generate slides from scratch in code.

function quickChartUrl(config: unknown, width: number, height: number): string {
  // QuickChart returns a public PNG image from a URL-encoded Chart.js config.
  // This is reliably fetchable by Google Slides for replaceAllShapesWithImage.
  const c = encodeURIComponent(JSON.stringify(config));
  return `https://quickchart.io/chart?format=png&backgroundColor=white&width=${width}&height=${height}&c=${c}`;
}

function chartUrlBar(labels: string[], values: number[], colors: string[]): string {
  const safe = values.length ? values : [0];
  const safeLabels = labels.length ? labels : ['—'];
  const palette = colors.length ? colors : ['#01696f'];
  const cfg = {
    type: 'bar',
    data: {
      labels: safeLabels,
      datasets: [
        {
          data: safe,
          backgroundColor: safe.map((_: number, i: number) => palette[i % palette.length]),
          borderWidth: 0,
          barThickness: 16,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      scales: {
        x: { ticks: { color: '#475569', font: { size: 12 } }, grid: { color: '#e2e8f0' } },
        y: { ticks: { color: '#0f172a', font: { size: 12 } }, grid: { display: false } },
      },
    },
  };
  return quickChartUrl(cfg, 820, 380);
}

function chartUrlLine(points: number[]): string {
  const safe = points.length ? points : [0, 1];
  const cfg = {
    type: 'line',
    data: {
      labels: safe.map((_: number, i: number) => String(i + 1)),
      datasets: [
        {
          data: safe,
          borderColor: '#01696f',
          backgroundColor: 'rgba(1,105,111,0.15)',
          fill: false,
          tension: 0.25,
          pointRadius: 3,
          pointBackgroundColor: '#01696f',
        },
      ],
    },
    options: {
      responsive: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { ticks: { color: '#475569', font: { size: 12 } }, grid: { color: '#e2e8f0' } },
      },
    },
  };
  return quickChartUrl(cfg, 820, 300);
}

async function fillPresentation(
  slides: ReturnType<typeof google.slides>,
  presentationId: string,
  stats: VitrineStats,
  lang: UiLang
) {
  const cfg = loadVitrineTemplateConfig();
  const now = new Date();
  const month = monthTitle(now, lang);
  const extractDateLong = longDate(now, lang);

  const docTitle =
    lang === 'en'
      ? `FrancoNetwork - Network showcase - ${month}`
      : lang === 'es'
        ? `FrancoNetwork - Vitrina de red - ${month}`
        : `FrancoNetwork - Vitrine réseau - ${month}`;

  const kpiMembers = String(stats.totalMembers);
  const kpiNew = String(stats.newMembersLast30d);
  const kpiViews = String(stats.profileViewsCumul);
  const kpiClicks = String(stats.contactClicksCumul);
  const kpiPotentialConnections =
    stats.totalMembers > 1 ? String((stats.totalMembers * (stats.totalMembers - 1)) / 2) : '0';

  const sectorsLabels = stats.topSectors.map((s) => s.name);
  const sectorsValues = stats.topSectors.map((s) => s.value);
  const sectorColors = ['#01696f', '#1f5f5b', '#3a7c78', '#5aa19c', '#0f766e', '#115e59', '#0b4a46', '#083b38'];

  const growthPoints = stats.growthCumulative.map((p) => p.count);
  const needsLabels = stats.needs.map((n) => n.label);
  const needsValues = stats.needs.map((n) => n.count);
  const needsColors = ['#01696f', '#0f766e', '#1f5f5b', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#64748b'];

  const chartSectors = chartUrlBar(sectorsLabels, sectorsValues, sectorColors.slice(0, Math.max(1, sectorsValues.length)));
  const chartGrowth = chartUrlLine(growthPoints.length ? growthPoints : [0, 1]);
  const chartNeeds = chartUrlBar(needsLabels, needsValues, needsColors.slice(0, Math.max(1, needsValues.length)));

  const dash = cfg.fallbackPolicy?.dash ?? '—';
  const listDash = cfg.fallbackPolicy?.emptyList ?? '—';

  const affinitiesList =
    stats.topPassions.length === 0
      ? listDash
      : stats.topPassions
          .slice(0, 8)
          .map((p) => `• ${p.passionId} — ${p.memberCount} membres · ${p.sectorCount} secteurs`)
          .join('\n');

  const affinitiesInsights =
    lang === 'en'
      ? '• Existing relationship groundwork\n• Signals of trust and conviviality\n• A network conducive to durable connections\n\nConclusion: shared interests accelerate meaningful exchanges.'
      : lang === 'es'
        ? '• Base de relaciones ya existente\n• Señales de confianza y convivencia\n• Una red propicia a conexiones duraderas\n\nConclusión: los puntos en común aceleran los intercambios.'
        : '• Une base de relations déjà existante\n• Des signaux de confiance et de convivialité\n• Un réseau propice aux connexions durables\n\nConclusion : des points communs favorisent des échanges plus rapides.';

  const sectorsList =
    stats.topSectors.length === 0
      ? listDash
      : stats.topSectors.map((s) => `• ${s.name} — ${s.value}`).join('\n');

  const growthSummary =
    lang === 'en'
      ? `• ${stats.newMembersLast30d} new (30 days)\n• ${stats.totalMembers} decision-makers already visible\n\nConclusion: measurable growth momentum.`
      : lang === 'es'
        ? `• ${stats.newMembersLast30d} nuevos (30 días)\n• ${stats.totalMembers} decisores ya visibles\n\nConclusión: una dinámica de crecimiento medible.`
        : `• ${stats.newMembersLast30d} nouveaux (30 jours)\n• ${stats.totalMembers} décideurs déjà visibles\n\nConclusion : une dynamique de croissance mesurable.`;

  const recentActivityList =
    stats.recentMembers.length === 0
      ? listDash
      : stats.recentMembers
          .map((m) => {
            const when = m.createdAtMs ? new Date(m.createdAtMs).toLocaleDateString('fr-FR') : '';
            const need = m.primaryNeed ? ` — besoin: ${m.primaryNeed}` : '';
            return `• ${when} — ${m.sector}${need}`;
          })
          .join('\n');

  const mostSoughtList =
    stats.needs.length === 0
      ? listDash
      : stats.needs
          .slice(0, 8)
          .map((n) => `• ${n.label} — ${n.count}`)
          .join('\n');

  const activeOppsList = mostSoughtList;

  const activeOppsWhy =
    lang === 'en'
      ? '• Needs already expressed by the community\n• Joining helps you appear at the right moment\n\nConclusion: the network enables concrete opportunities.'
      : lang === 'es'
        ? '• Necesidades ya expresadas por la comunidad\n• Inscribirse ayuda a aparecer en el momento adecuado\n\nConclusión: la red facilita oportunidades concretas.'
        : '• Des besoins déjà exprimés par la communauté\n• Une inscription permet d’apparaître au bon moment\n\nConclusion : le réseau facilite des opportunités concrètes.';

  const recentRequestsList =
    stats.recentRequests.length === 0
      ? listDash
      : stats.recentRequests
          .slice(0, 5)
          .map((r) => {
            const when = r.createdAtMs ? new Date(r.createdAtMs).toLocaleDateString('fr-FR') : '';
            return `• ${when} — ${r.title}`;
          })
          .join('\n');

  const recentRequestsWhy =
    lang === 'en'
      ? '• Genuine expressed needs\n• Already-active opportunities\n• A community that takes action\n\nConclusion: the network already connects concrete projects.'
      : lang === 'es'
        ? '• Necesidades realmente expresadas\n• Oportunidades ya activas\n• Una comunidad en acción\n\nConclusión: la red ya conecta proyectos concretos.'
        : '• Des besoins réellement exprimés\n• Des opportunités déjà actives\n• Une communauté qui passe à l’action\n\nConclusion : le réseau sert déjà à connecter des projets concrets.';

  const ctaCards =
    lang === 'en'
      ? '• Complete your profile\n• Respond to a request\n• Join and activate the network'
      : lang === 'es'
        ? '• Completar su perfil\n• Responder a una solicitud\n• Unirse y activar la red'
        : '• Compléter son profil\n• Répondre à une demande\n• Rejoindre et activer le réseau';

  const footerSource =
    lang === 'en'
      ? 'Source: directory aggregates'
      : lang === 'es'
        ? 'Fuente: agregados del directorio'
        : 'Source : agrégats annuaire';

  // We rely on placeholders if present. If not present, the deck will still be created,
  // but will remain empty until a template is provided.
  const requests: any[] = [
    { replaceAllText: { containsText: { text: '{{DOC_TITLE}}', matchCase: true }, replaceText: docTitle } },
    { replaceAllText: { containsText: { text: '{{MONTH_TITLE}}', matchCase: true }, replaceText: month } },
    { replaceAllText: { containsText: { text: '{{EXTRACT_DATE_LONG}}', matchCase: true }, replaceText: extractDateLong } },
    { replaceAllText: { containsText: { text: '{{FOOTER_DATE_LONG}}', matchCase: true }, replaceText: extractDateLong } },
    { replaceAllText: { containsText: { text: '{{FOOTER_SOURCE}}', matchCase: true }, replaceText: footerSource } },
    { replaceAllText: { containsText: { text: '{{KPI_MEMBERS}}', matchCase: true }, replaceText: kpiMembers } },
    { replaceAllText: { containsText: { text: '{{KPI_NEW_30D}}', matchCase: true }, replaceText: kpiNew } },
    { replaceAllText: { containsText: { text: '{{KPI_PROFILE_VIEWS}}', matchCase: true }, replaceText: kpiViews } },
    { replaceAllText: { containsText: { text: '{{KPI_CONTACT_CLICKS}}', matchCase: true }, replaceText: kpiClicks } },
    { replaceAllText: { containsText: { text: '{{KPI_POTENTIAL_CONNECTIONS}}', matchCase: true }, replaceText: kpiPotentialConnections } },
    { replaceAllText: { containsText: { text: '{{AFFINITIES_LIST}}', matchCase: true }, replaceText: affinitiesList || dash } },
    { replaceAllText: { containsText: { text: '{{AFFINITIES_INSIGHTS}}', matchCase: true }, replaceText: affinitiesInsights || dash } },
    { replaceAllText: { containsText: { text: '{{SECTORS_LIST}}', matchCase: true }, replaceText: sectorsList || dash } },
    { replaceAllText: { containsText: { text: '{{GROWTH_SUMMARY}}', matchCase: true }, replaceText: growthSummary || dash } },
    { replaceAllText: { containsText: { text: '{{RECENT_ACTIVITY_LIST}}', matchCase: true }, replaceText: recentActivityList || dash } },
    { replaceAllText: { containsText: { text: '{{MOST_SOUGHT_LIST}}', matchCase: true }, replaceText: mostSoughtList || dash } },
    { replaceAllText: { containsText: { text: '{{ACTIVE_OPPS_LIST}}', matchCase: true }, replaceText: activeOppsList || dash } },
    { replaceAllText: { containsText: { text: '{{ACTIVE_OPPS_WHY}}', matchCase: true }, replaceText: activeOppsWhy || dash } },
    { replaceAllText: { containsText: { text: '{{RECENT_REQUESTS_LIST}}', matchCase: true }, replaceText: recentRequestsList || dash } },
    { replaceAllText: { containsText: { text: '{{RECENT_REQUESTS_WHY}}', matchCase: true }, replaceText: recentRequestsWhy || dash } },
    { replaceAllText: { containsText: { text: '{{CTA_CARDS}}', matchCase: true }, replaceText: ctaCards || dash } },
    {
      replaceAllShapesWithImage: {
        imageUrl: chartSectors,
        replaceMethod: 'CENTER_INSIDE',
        containsText: { text: '{{CHART_SECTORS}}', matchCase: true },
      },
    },
    {
      replaceAllShapesWithImage: {
        imageUrl: chartGrowth,
        replaceMethod: 'CENTER_INSIDE',
        containsText: { text: '{{CHART_GROWTH}}', matchCase: true },
      },
    },
    {
      replaceAllShapesWithImage: {
        imageUrl: chartNeeds,
        replaceMethod: 'CENTER_INSIDE',
        containsText: { text: '{{CHART_NEEDS}}', matchCase: true },
      },
    },
  ];

  await slides.presentations.batchUpdate({
    presentationId,
    requestBody: { requests },
  });
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
      const now = new Date();
      const rawLang = String(request.data?.lang ?? 'fr').trim().toLowerCase();
      const lang: UiLang = rawLang === 'en' ? 'en' : rawLang === 'es' ? 'es' : 'fr';

      const month = monthTitle(now, lang);
      const title =
        lang === 'en'
          ? `FrancoNetwork - Network showcase - ${month}`
          : lang === 'es'
            ? `FrancoNetwork - Vitrina de red - ${month}`
            : `FrancoNetwork - Vitrine réseau - ${month}`;

      const perLangRaw = String(cfg.template_id_by_lang?.[lang] ?? '').trim();
      const baseRaw = String(cfg.template_id ?? cfg.templateId ?? '').trim();
      const templateId = perLangRaw || baseRaw;
      const folderId = String(SLIDES_EXPORT_FOLDER_ID.value() ?? '').trim();

      if (!templateId) {
        throw new Error('Template Slides manquant (config/vitrine-template.json).');
      }

      const stats = await loadVitrineStats();

      const auth = getEffectiveAuth();
      const drive = getDrive(auth);
      const slides = getSlides(auth);

      // Non-derive rule: always copy the master template deck and only replace placeholders.
      const presentationId = await copyTemplatePresentation(drive, templateId, title, folderId);
      await fillPresentation(slides, presentationId, stats, lang);

      const url = slidesUrl(presentationId);
      logger.info('Slides deck generated', { presentationId, templateId, lang });
      return { ok: true, presentationId, url, debug: { templateId, lang } };
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

