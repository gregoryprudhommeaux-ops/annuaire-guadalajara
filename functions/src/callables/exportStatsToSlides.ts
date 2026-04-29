import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { defineString } from 'firebase-functions/params';
import { google } from 'googleapis';
import { getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { isCallerAdmin } from '../lib/admin';

const SLIDES_TEMPLATE_ID = defineString('GOOGLE_SLIDES_TEMPLATE_ID', { default: '' });
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

function monthTitleFr(now: Date): string {
  const m = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return m;
}

function slidesUrl(presentationId: string): string {
  return `https://docs.google.com/presentation/d/${presentationId}/edit`;
}

async function createPresentationFromScratch(
  drive: ReturnType<typeof google.drive>,
  title: string,
  folderId: string
): Promise<string> {
  // Creating a Slides file is a Drive operation. With service accounts, using Drive API is
  // the most reliable way to create the file, then we can update it via Slides API.
  const res = await drive.files.create({
    requestBody: {
      name: title,
      mimeType: 'application/vnd.google-apps.presentation',
      ...(folderId ? { parents: [folderId] } : {}),
    },
    fields: 'id',
  });
  const id = res.data.id;
  if (!id) throw new Error('Drive create: id manquant');
  return id;
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

type Pt = { x: number; y: number };
type SizePt = { w: number; h: number };

const THEME = {
  brand: { teal: '#01696f', slate: '#0f172a', muted: '#475569', border: '#e2e8f0' },
};

function rgbFromHex(hex: string) {
  const h = hex.replace('#', '').trim();
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { red: ((n >> 16) & 255) / 255, green: ((n >> 8) & 255) / 255, blue: (n & 255) / 255 };
}

function ptRect(pos: Pt, size: SizePt) {
  return {
    transform: {
      scaleX: 1,
      scaleY: 1,
      translateX: pos.x,
      translateY: pos.y,
      unit: 'PT',
    },
    size: {
      width: { magnitude: size.w, unit: 'PT' },
      height: { magnitude: size.h, unit: 'PT' },
    },
  };
}

async function buildScratchDeck(slides: ReturnType<typeof google.slides>, presentationId: string) {
  const pres = await slides.presentations.get({ presentationId });
  const existingSlideIds = (pres.data.slides ?? []).map((s) => s.objectId).filter(Boolean) as string[];

  const requests: any[] = [];
  for (const sid of existingSlideIds) {
    requests.push({ deleteObject: { objectId: sid } });
  }

  const slideIds = {
    cover: 's_cover',
    kpi: 's_kpi',
    sectors: 's_sectors',
    growth: 's_growth',
    needs: 's_needs',
    opportunities: 's_opps',
    members: 's_members',
    requests: 's_requests',
    affinities: 's_affinities',
    cta: 's_cta',
  };

  const createBlankSlide = (objectId: string) =>
    requests.push({ createSlide: { objectId, slideLayoutReference: { predefinedLayout: 'BLANK' } } });

  createBlankSlide(slideIds.cover);
  createBlankSlide(slideIds.kpi);
  createBlankSlide(slideIds.sectors);
  createBlankSlide(slideIds.growth);
  createBlankSlide(slideIds.needs);
  createBlankSlide(slideIds.opportunities);
  createBlankSlide(slideIds.members);
  createBlankSlide(slideIds.requests);
  createBlankSlide(slideIds.affinities);
  createBlankSlide(slideIds.cta);

  const addTextBox = (
    slideObjectId: string,
    shapeId: string,
    pos: Pt,
    size: SizePt,
    text: string,
    fontSize: number,
    bold = false,
    colorHex = THEME.brand.slate
  ) => {
    requests.push({
      createShape: {
        objectId: shapeId,
        shapeType: 'TEXT_BOX',
        elementProperties: { pageObjectId: slideObjectId, ...ptRect(pos, size) },
      },
    });
    requests.push({ insertText: { objectId: shapeId, insertionIndex: 0, text } });
    requests.push({
      updateTextStyle: {
        objectId: shapeId,
        textRange: { type: 'ALL' },
        style: {
          fontFamily: 'Inter',
          fontSize: { magnitude: fontSize, unit: 'PT' },
          bold,
          foregroundColor: { opaqueColor: { rgbColor: rgbFromHex(colorHex) } },
        },
        fields: 'fontFamily,fontSize,bold,foregroundColor',
      },
    });
  };

  const addCard = (slideObjectId: string, shapeId: string, pos: Pt, size: SizePt) => {
    requests.push({
      createShape: {
        objectId: shapeId,
        shapeType: 'ROUND_RECTANGLE',
        elementProperties: { pageObjectId: slideObjectId, ...ptRect(pos, size) },
      },
    });
    requests.push({
      updateShapeProperties: {
        objectId: shapeId,
        shapeProperties: {
          shapeBackgroundFill: { solidFill: { color: { rgbColor: rgbFromHex('#ffffff') } } },
          outline: {
            outlineFill: { solidFill: { color: { rgbColor: rgbFromHex(THEME.brand.border) } } },
            weight: { magnitude: 1, unit: 'PT' },
          },
        },
        fields: 'shapeBackgroundFill,outline',
      },
    });
  };

  const addChartPlaceholder = (slideObjectId: string, shapeId: string, pos: Pt, size: SizePt, placeholderText: string) => {
    requests.push({
      createShape: {
        objectId: shapeId,
        shapeType: 'RECTANGLE',
        elementProperties: { pageObjectId: slideObjectId, ...ptRect(pos, size) },
      },
    });
    requests.push({ insertText: { objectId: shapeId, insertionIndex: 0, text: placeholderText } });
    requests.push({
      updateShapeProperties: {
        objectId: shapeId,
        shapeProperties: {
          shapeBackgroundFill: { solidFill: { color: { rgbColor: rgbFromHex('#f8fafc') } } },
          outline: {
            outlineFill: { solidFill: { color: { rgbColor: rgbFromHex(THEME.brand.border) } } },
            weight: { magnitude: 1, unit: 'PT' },
          },
        },
        fields: 'shapeBackgroundFill,outline',
      },
    });
  };

  // Cover
  addTextBox(slideIds.cover, 't_title', { x: 48, y: 72 }, { w: 620, h: 60 }, '{{TITLE}}', 28, true, THEME.brand.slate);
  addTextBox(slideIds.cover, 't_subtitle', { x: 48, y: 130 }, { w: 620, h: 40 }, '{{SUBTITLE}}', 14, false, THEME.brand.muted);

  // KPI
  addTextBox(slideIds.kpi, 'kpi_h', { x: 48, y: 40 }, { w: 640, h: 30 }, 'Indicateurs clés', 14, true, THEME.brand.teal);

  const cardW = 300;
  const cardH = 110;
  const gap = 20;
  const y0 = 90;
  const x0 = 48;

  const card = (idx: number, id: string, label: string, valuePlaceholder: string) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = x0 + col * (cardW + gap);
    const y = y0 + row * (cardH + gap);
    addCard(slideIds.kpi, `card_${id}`, { x, y }, { w: cardW, h: cardH });
    addTextBox(slideIds.kpi, `card_${id}_val`, { x: x + 16, y: y + 18 }, { w: cardW - 32, h: 32 }, valuePlaceholder, 26, true, THEME.brand.teal);
    addTextBox(slideIds.kpi, `card_${id}_lab`, { x: x + 16, y: y + 56 }, { w: cardW - 32, h: 40 }, label, 12, true, THEME.brand.slate);
  };

  card(0, 'members', 'Membres dans le réseau', '{{KPI_MEMBERS}}');
  card(1, 'new', 'Nouveaux (30 jours)', '{{KPI_NEW_30D}}');
  card(2, 'views', 'Vues profils (cumul)', '{{KPI_VIEWS}}');
  card(3, 'clicks', 'Clics contact (cumul)', '{{KPI_CLICKS}}');

  // Secteurs
  addTextBox(slideIds.sectors, 'sec_h', { x: 48, y: 32 }, { w: 640, h: 30 }, 'Secteurs représentés', 14, true, THEME.brand.teal);
  addTextBox(slideIds.sectors, 'sec_s', { x: 48, y: 62 }, { w: 640, h: 18 }, 'Top secteurs (lecture agrégée).', 11, false, THEME.brand.muted);
  addChartPlaceholder(slideIds.sectors, 'ch_sectors', { x: 48, y: 98 }, { w: 620, h: 360 }, '{{CHART_SECTORS}}');

  // Croissance
  addTextBox(slideIds.growth, 'gro_h', { x: 48, y: 32 }, { w: 640, h: 30 }, 'Croissance du réseau', 14, true, THEME.brand.teal);
  addTextBox(slideIds.growth, 'gro_s', { x: 48, y: 62 }, { w: 640, h: 18 }, 'Inscrits cumulés (tout historique).', 11, false, THEME.brand.muted);
  addChartPlaceholder(slideIds.growth, 'ch_growth', { x: 48, y: 110 }, { w: 620, h: 300 }, '{{CHART_GROWTH}}');

  // Besoins
  addTextBox(slideIds.needs, 'need_h', { x: 48, y: 32 }, { w: 640, h: 30 }, 'Besoins & opportunités', 14, true, THEME.brand.teal);
  addTextBox(slideIds.needs, 'need_s', { x: 48, y: 62 }, { w: 640, h: 18 }, 'Catégories les plus recherchées.', 11, false, THEME.brand.muted);
  addChartPlaceholder(slideIds.needs, 'ch_needs', { x: 48, y: 98 }, { w: 620, h: 360 }, '{{CHART_NEEDS}}');

  // Opportunités (liste)
  addTextBox(slideIds.opportunities, 'opp_h', { x: 48, y: 32 }, { w: 640, h: 30 }, 'Opportunités actives (liste)', 14, true, THEME.brand.teal);
  addTextBox(slideIds.opportunities, 'opp_s', { x: 48, y: 62 }, { w: 640, h: 18 }, 'Même info que le graphe, en format éditable.', 11, false, THEME.brand.muted);
  addTextBox(slideIds.opportunities, 'opp_list', { x: 48, y: 100 }, { w: 620, h: 420 }, '{{OPPORTUNITIES_LIST}}', 12, false, THEME.brand.slate);

  // Derniers inscrits
  addTextBox(slideIds.members, 'mem_h', { x: 48, y: 32 }, { w: 640, h: 30 }, 'Derniers inscrits', 14, true, THEME.brand.teal);
  addTextBox(slideIds.members, 'mem_s', { x: 48, y: 62 }, { w: 640, h: 18 }, '4 derniers profils (agrégé, sans email).', 11, false, THEME.brand.muted);
  addTextBox(slideIds.members, 'mem_list', { x: 48, y: 100 }, { w: 620, h: 420 }, '{{RECENT_MEMBERS_LIST}}', 12, false, THEME.brand.slate);

  // Demandes récentes
  addTextBox(slideIds.requests, 'req_h', { x: 48, y: 32 }, { w: 640, h: 30 }, 'Demandes récentes', 14, true, THEME.brand.teal);
  addTextBox(slideIds.requests, 'req_s', { x: 48, y: 62 }, { w: 640, h: 18 }, '5 dernières demandes actives.', 11, false, THEME.brand.muted);
  addTextBox(slideIds.requests, 'req_list', { x: 48, y: 100 }, { w: 620, h: 420 }, '{{RECENT_REQUESTS_LIST}}', 12, false, THEME.brand.slate);

  // Affinités
  addTextBox(slideIds.affinities, 'aff_h', { x: 48, y: 32 }, { w: 640, h: 30 }, 'Affinités (passions)', 14, true, THEME.brand.teal);
  addTextBox(slideIds.affinities, 'aff_s', { x: 48, y: 62 }, { w: 640, h: 18 }, 'Top passions (IDs, à renommer si besoin).', 11, false, THEME.brand.muted);
  addTextBox(slideIds.affinities, 'aff_list', { x: 48, y: 100 }, { w: 620, h: 420 }, '{{TOP_PASSIONS_LIST}}', 12, false, THEME.brand.slate);

  // CTA / conclusion
  addTextBox(slideIds.cta, 'cta_h', { x: 48, y: 72 }, { w: 640, h: 40 }, 'Conclusion', 18, true, THEME.brand.slate);
  addTextBox(
    slideIds.cta,
    'cta_body',
    { x: 48, y: 120 },
    { w: 640, h: 300 },
    '• Le réseau grandit et les opportunités sont déjà concrètes.\n• Vous pouvez trier/éditer/supprimer les slides pour faire une version PDF finale.\n\n{{TITLE}}',
    12,
    false,
    THEME.brand.muted
  );

  await slides.presentations.batchUpdate({ presentationId, requestBody: { requests } });
}

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
  stats: VitrineStats
) {
  const now = new Date();
  const month = monthTitleFr(now);

  const title = `FrancoNetwork · Vitrine réseau · ${month}`;
  const subtitle = `Découvrez la communauté en chiffres — ${month}`;
  const kpiMembers = String(stats.totalMembers);
  const kpiNew = String(stats.newMembersLast30d);
  const kpiViews = String(stats.profileViewsCumul);
  const kpiClicks = String(stats.contactClicksCumul);

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

  const opportunitiesList =
    stats.needs.length === 0
      ? '—'
      : stats.needs
          .slice(0, 12)
          .map((n, i) => `• ${n.label} — ${n.count}`)
          .join('\n');

  const recentMembersList =
    stats.recentMembers.length === 0
      ? '—'
      : stats.recentMembers
          .map((m) => {
            const when = m.createdAtMs ? new Date(m.createdAtMs).toISOString().slice(0, 10) : '';
            const need = m.primaryNeed ? ` (need: ${m.primaryNeed})` : '';
            return `• ${when} — ${m.sector}${need}`;
          })
          .join('\n');

  const recentRequestsList =
    stats.recentRequests.length === 0
      ? '—'
      : stats.recentRequests
          .map((r) => {
            const when = r.createdAtMs ? new Date(r.createdAtMs).toISOString().slice(0, 10) : '';
            return `• ${when} — ${r.title}`;
          })
          .join('\n');

  const topPassionsList =
    stats.topPassions.length === 0
      ? '—'
      : stats.topPassions
          .map((p) => `• ${p.passionId} — ${p.memberCount} membres, ${p.sectorCount} secteurs`)
          .join('\n');

  // We rely on placeholders if present. If not present, the deck will still be created,
  // but will remain empty until a template is provided.
  const requests: any[] = [
    { replaceAllText: { containsText: { text: '{{TITLE}}', matchCase: true }, replaceText: title } },
    { replaceAllText: { containsText: { text: '{{SUBTITLE}}', matchCase: true }, replaceText: subtitle } },
    { replaceAllText: { containsText: { text: '{{KPI_MEMBERS}}', matchCase: true }, replaceText: kpiMembers } },
    { replaceAllText: { containsText: { text: '{{KPI_NEW_30D}}', matchCase: true }, replaceText: kpiNew } },
    { replaceAllText: { containsText: { text: '{{KPI_VIEWS}}', matchCase: true }, replaceText: kpiViews } },
    { replaceAllText: { containsText: { text: '{{KPI_CLICKS}}', matchCase: true }, replaceText: kpiClicks } },
    { replaceAllText: { containsText: { text: '{{OPPORTUNITIES_LIST}}', matchCase: true }, replaceText: opportunitiesList } },
    { replaceAllText: { containsText: { text: '{{RECENT_MEMBERS_LIST}}', matchCase: true }, replaceText: recentMembersList } },
    { replaceAllText: { containsText: { text: '{{RECENT_REQUESTS_LIST}}', matchCase: true }, replaceText: recentRequestsList } },
    { replaceAllText: { containsText: { text: '{{TOP_PASSIONS_LIST}}', matchCase: true }, replaceText: topPassionsList } },
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
      const now = new Date();
      const month = monthTitleFr(now);
      const title = `FrancoNetwork · Vitrine réseau · ${month}`;
      const templateId = String(SLIDES_TEMPLATE_ID.value() ?? '').trim();
      const folderId = String(SLIDES_EXPORT_FOLDER_ID.value() ?? '').trim();

      const stats = await loadVitrineStats();

      const auth = getEffectiveAuth();
      const drive = getDrive(auth);
      const slides = getSlides(auth);

      const presentationId = templateId
        ? await copyTemplatePresentation(drive, templateId, title, folderId)
        : await createPresentationFromScratch(drive, title, folderId);

      if (!templateId) {
        await buildScratchDeck(slides, presentationId);
      }
      await fillPresentation(slides, presentationId, stats);

      const url = slidesUrl(presentationId);
      logger.info('Slides deck generated', { presentationId });
      return { ok: true, presentationId, url };
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

