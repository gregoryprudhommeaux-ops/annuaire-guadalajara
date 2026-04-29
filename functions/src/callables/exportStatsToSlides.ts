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

type VitrineStats = {
  totalMembers: number;
  newMembersLast30d: number;
  prevNewMembers30d: number;
  profileViewsCumul: number;
  contactClicksCumul: number;
  topSectors: Array<{ name: string; value: number }>;
  growthCumulative: Array<{ date: string; count: number }>;
  needs: Array<{ key: string; label: string; count: number }>;
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

function getGoogleAuth(scopes: string[]) {
  return new google.auth.GoogleAuth({ scopes });
}

const GOOGLE_SCOPES = [
  // Needed to create/copy the presentation file in Drive.
  'https://www.googleapis.com/auth/drive',
  // Needed to batchUpdate Slides content.
  'https://www.googleapis.com/auth/presentations',
] as const;

function getDrive() {
  const auth = getGoogleAuth([...GOOGLE_SCOPES]);
  return google.drive({ version: 'v3', auth });
}

function getSlides() {
  const auth = getGoogleAuth([...GOOGLE_SCOPES]);
  return google.slides({ version: 'v1', auth });
}

async function loadVitrineStats(): Promise<VitrineStats> {
  const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
  const snap = await db.collection('users').get();

  const nowMs = Date.now();
  const d30 = nowMs - 30 * 24 * 3600 * 1000;
  const d60 = nowMs - 60 * 24 * 3600 * 1000;

  const bySector = new Map<string, number>();
  const regByDay = new Map<string, number>();

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

  for (const doc of snap.docs) {
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

  return {
    totalMembers,
    newMembersLast30d,
    prevNewMembers30d,
    profileViewsCumul,
    contactClicksCumul,
    topSectors,
    growthCumulative,
    needs,
  };
}

function monthTitleFr(now: Date): string {
  const m = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return m;
}

function slidesUrl(presentationId: string): string {
  return `https://docs.google.com/presentation/d/${presentationId}/edit`;
}

async function createPresentationFromScratch(title: string, folderId: string): Promise<string> {
  // Creating a Slides file is a Drive operation. With service accounts, using Drive API is
  // the most reliable way to create the file, then we can update it via Slides API.
  const drive = getDrive();
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

async function copyTemplatePresentation(templateId: string, title: string, folderId: string): Promise<string> {
  const drive = getDrive();
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

async function buildScratchDeck(presentationId: string) {
  const slides = getSlides();
  const pres = await slides.presentations.get({ presentationId });
  const existingSlideIds = (pres.data.slides ?? []).map((s) => s.objectId).filter(Boolean) as string[];

  const requests: any[] = [];
  for (const sid of existingSlideIds) {
    requests.push({ deleteObject: { objectId: sid } });
  }

  const slideIds = {
    cover: 's_cover',
    kpi: 's_kpi',
    charts: 's_charts',
  };

  const createBlankSlide = (objectId: string) =>
    requests.push({ createSlide: { objectId, slideLayoutReference: { predefinedLayout: 'BLANK' } } });

  createBlankSlide(slideIds.cover);
  createBlankSlide(slideIds.kpi);
  createBlankSlide(slideIds.charts);

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

  // Charts
  addTextBox(slideIds.charts, 'charts_h', { x: 48, y: 32 }, { w: 640, h: 30 }, 'Graphes & catégories', 14, true, THEME.brand.teal);
  addTextBox(slideIds.charts, 'charts_s1', { x: 48, y: 62 }, { w: 640, h: 18 }, 'Secteurs, croissance et opportunités les plus recherchées.', 11, false, THEME.brand.muted);

  addChartPlaceholder(slideIds.charts, 'ch_sectors', { x: 48, y: 96 }, { w: 620, h: 170 }, '{{CHART_SECTORS}}');
  addChartPlaceholder(slideIds.charts, 'ch_growth', { x: 48, y: 280 }, { w: 620, h: 150 }, '{{CHART_GROWTH}}');
  addChartPlaceholder(slideIds.charts, 'ch_needs', { x: 48, y: 446 }, { w: 620, h: 170 }, '{{CHART_NEEDS}}');

  await slides.presentations.batchUpdate({ presentationId, requestBody: { requests } });
}

function chartUrlBar(labels: string[], values: number[], colors: string[]): string {
  // Google Image Charts: horizontal bar chart
  const chd = `t:${values.map((v) => Math.max(0, Math.round(v))).join(',')}`;
  const chl = labels.map((s) => encodeURIComponent(s)).join('|');
  const chco = colors.map((c) => c.replace('#', '')).join('|');
  const url =
    `https://chart.googleapis.com/chart?cht=bhs&chs=780x360&chd=${encodeURIComponent(chd)}` +
    `&chco=${encodeURIComponent(chco)}&chxt=x,y&chxl=1:|${chl}&chbh=22` +
    `&chds=0,${Math.max(1, ...values)}&chma=40,10,20,10&chxs=0,555555,12,0,t,555555|1,555555,12,0,l,555555`;
  return url;
}

function chartUrlLine(points: number[]): string {
  const max = Math.max(1, ...points);
  const chd = `t:${points.map((v) => Math.max(0, Math.round(v))).join(',')}`;
  return (
    `https://chart.googleapis.com/chart?cht=lc&chs=780x300&chd=${encodeURIComponent(chd)}` +
    `&chco=01696f&chds=0,${max}&chxt=y&chxr=0,0,${max}` +
    `&chm=o,01696f,0,-1,6&chls=3`
  );
}

async function fillPresentation(presentationId: string, stats: VitrineStats) {
  const slides = getSlides();
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

  // We rely on placeholders if present. If not present, the deck will still be created,
  // but will remain empty until a template is provided.
  const requests: any[] = [
    { replaceAllText: { containsText: { text: '{{TITLE}}', matchCase: true }, replaceText: title } },
    { replaceAllText: { containsText: { text: '{{SUBTITLE}}', matchCase: true }, replaceText: subtitle } },
    { replaceAllText: { containsText: { text: '{{KPI_MEMBERS}}', matchCase: true }, replaceText: kpiMembers } },
    { replaceAllText: { containsText: { text: '{{KPI_NEW_30D}}', matchCase: true }, replaceText: kpiNew } },
    { replaceAllText: { containsText: { text: '{{KPI_VIEWS}}', matchCase: true }, replaceText: kpiViews } },
    { replaceAllText: { containsText: { text: '{{KPI_CLICKS}}', matchCase: true }, replaceText: kpiClicks } },
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

      const presentationId = templateId
        ? await copyTemplatePresentation(templateId, title, folderId)
        : await createPresentationFromScratch(title, folderId);

      if (!templateId) {
        await buildScratchDeck(presentationId);
      }
      await fillPresentation(presentationId, stats);

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

