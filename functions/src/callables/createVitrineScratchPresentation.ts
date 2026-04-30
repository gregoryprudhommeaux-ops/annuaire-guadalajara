import { google } from 'googleapis';
import type { UiLang } from './vitrineTypes';
import type { VitrineExportBundle } from './vitrineExportBundle';

const EMU_PER_IN = 914400;
const PAGE_W = 10 * EMU_PER_IN;
const PAGE_H = 5.625 * EMU_PER_IN;
const PAD = 0.45 * EMU_PER_IN;

function emu(magnitude: number) {
  return { magnitude: Math.round(magnitude), unit: 'EMU' as const };
}

/** Google Slides API: custom objectId length must be ≥ 5. */
function scratchShapeId(slideIndex: number, kind: 'title' | 'body' | 'img'): string {
  return `vn_s${slideIndex}_${kind}`;
}

function transform(translateX: number, translateY: number) {
  return {
    scaleX: 1,
    scaleY: 1,
    translateX: Math.round(translateX),
    translateY: Math.round(translateY),
    unit: 'EMU' as const,
  };
}

function slideSectionTitles(lang: UiLang): string[] {
  if (lang === 'en') {
    return [
      'FrancoNetwork · Network showcase',
      'Key indicators',
      'Network affinities',
      'What affinities reveal',
      'Sectors represented',
      'Network growth',
      'Recent activity',
      'Most sought opportunities',
      'Active opportunities',
      'Why it matters',
      'Recent requests',
      'Why it is important',
      'Take action',
      'Source & date',
    ];
  }
  if (lang === 'es') {
    return [
      'FrancoNetwork · Vitrina de red',
      'Indicadores clave',
      'Afinidades de la red',
      'Lo que revelan',
      'Sectores representados',
      'Crecimiento de la red',
      'Actividad reciente',
      'Oportunidades más buscadas',
      'Oportunidades activas',
      'Por qué es útil',
      'Solicitudes recientes',
      'Por qué es importante',
      'Pasar a la acción',
      'Fuente y fecha',
    ];
  }
  return [
    'FrancoNetwork · Vitrine réseau',
    'Indicateurs clés',
    'Affinités du réseau',
    'Ce que ces affinités révèlent',
    'Secteurs représentés',
    'Croissance du réseau',
    'Activité récente',
    'Opportunités les plus recherchées',
    'Opportunités actives',
    'Pourquoi c’est utile',
    'Demandes récentes',
    'Pourquoi c’est important',
    'Passer à l’action',
    'Source & date',
  ];
}

function kpiBody(b: VitrineExportBundle, lang: UiLang): string {
  if (lang === 'en') {
    return [
      `Members: ${b.kpiMembers}`,
      `New (30d): ${b.kpiNew}`,
      `Profile views: ${b.kpiViews}`,
      `Contact clicks: ${b.kpiClicks}`,
      `Potential connections: ${b.kpiPotentialConnections}`,
    ].join('\n');
  }
  if (lang === 'es') {
    return [
      `Miembros: ${b.kpiMembers}`,
      `Nuevos (30 días): ${b.kpiNew}`,
      `Vistas de perfil: ${b.kpiViews}`,
      `Clics de contacto: ${b.kpiClicks}`,
      `Conexiones potenciales: ${b.kpiPotentialConnections}`,
    ].join('\n');
  }
  return [
    `Membres: ${b.kpiMembers}`,
    `Nouveaux (30 jours): ${b.kpiNew}`,
    `Vues de profil: ${b.kpiViews}`,
    `Clics contact: ${b.kpiClicks}`,
    `Connexions potentielles: ${b.kpiPotentialConnections}`,
  ].join('\n');
}

function footerBody(b: VitrineExportBundle, lang: UiLang): string {
  if (lang === 'en') {
    return `${b.footerSource}\nfranconetwork.app\n${b.extractDateLong}`;
  }
  if (lang === 'es') {
    return `${b.footerSource}\nfranconetwork.app\n${b.extractDateLong}`;
  }
  return `${b.footerSource}\nfranconetwork.app\n${b.extractDateLong}`;
}

async function moveDriveFileToFolder(
  drive: ReturnType<typeof google.drive>,
  fileId: string,
  folderId: string
) {
  if (!folderId) return;
  const meta = await drive.files.get({ fileId, fields: 'parents' });
  const prev = (meta.data.parents ?? []).filter(Boolean).join(',');
  await drive.files.update({
    fileId,
    addParents: folderId,
    ...(prev ? { removeParents: prev } : {}),
    fields: 'id,parents',
  });
}

function pushTextBox(
  requests: any[],
  pageObjectId: string,
  objectId: string,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string
) {
  requests.push({
    createShape: {
      objectId,
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId,
        size: { width: emu(w), height: emu(h) },
        transform: transform(x, y),
      },
    },
  });
  requests.push({
    insertText: {
      objectId,
      insertionIndex: 0,
      text,
    },
  });
}

function pushImage(
  requests: any[],
  pageObjectId: string,
  objectId: string,
  url: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  requests.push({
    createImage: {
      objectId,
      url,
      elementProperties: {
        pageObjectId,
        size: { width: emu(w), height: emu(h) },
        transform: transform(x, y),
      },
    },
  });
}

export async function createVitrineScratchPresentation(
  slides: ReturnType<typeof google.slides>,
  drive: ReturnType<typeof google.drive>,
  title: string,
  folderId: string,
  bundle: VitrineExportBundle,
  lang: UiLang
): Promise<string> {
  const createRes = await slides.presentations.create({
    requestBody: { title },
  });
  const presentationId = createRes.data.presentationId;
  if (!presentationId) throw new Error('presentations.create: id manquant');

  await moveDriveFileToFolder(drive, presentationId, folderId);

  const pres = await slides.presentations.get({ presentationId });
  const s0 = pres.data.slides?.[0]?.objectId;
  if (!s0) throw new Error('Scratch deck: première slide introuvable.');

  const requests: any[] = [];

  const s0Elements = pres.data.slides?.[0]?.pageElements ?? [];
  for (const pe of s0Elements) {
    const oid = pe?.objectId;
    if (typeof oid === 'string') requests.push({ deleteObject: { objectId: oid } });
  }

  for (let i = 1; i < 14; i += 1) {
    requests.push({
      createSlide: {
        objectId: `vn_slide_${i}`,
        insertionIndex: i,
        slideLayoutReference: { predefinedLayout: 'BLANK' },
      },
    });
  }

  const pageIds = [s0, ...Array.from({ length: 13 }, (_, i) => `vn_slide_${i + 1}`)];
  const titles = slideSectionTitles(lang);

  const tw = PAGE_W - 2 * PAD;
  const titleH = 0.55 * EMU_PER_IN;
  const bodyTop = PAD + titleH + 0.15 * EMU_PER_IN;
  const bodyH = PAGE_H - bodyTop - PAD;

  // 0 cover
  pushTextBox(requests, pageIds[0], scratchShapeId(0, 'title'), PAD, PAD, tw, titleH, bundle.docTitle);
  pushTextBox(requests, pageIds[0], scratchShapeId(0, 'body'), PAD, bodyTop, tw, bodyH * 0.35, `${bundle.extractDateLong}\n${bundle.month}`);

  // 1 KPIs
  pushTextBox(requests, pageIds[1], scratchShapeId(1, 'title'), PAD, PAD, tw, titleH, titles[1]);
  pushTextBox(requests, pageIds[1], scratchShapeId(1, 'body'), PAD, bodyTop, tw, bodyH, kpiBody(bundle, lang));

  // 2 affinities
  pushTextBox(requests, pageIds[2], scratchShapeId(2, 'title'), PAD, PAD, tw, titleH, titles[2]);
  pushTextBox(requests, pageIds[2], scratchShapeId(2, 'body'), PAD, bodyTop, tw, bodyH, bundle.affinitiesList);

  // 3 insights
  pushTextBox(requests, pageIds[3], scratchShapeId(3, 'title'), PAD, PAD, tw, titleH, titles[3]);
  pushTextBox(requests, pageIds[3], scratchShapeId(3, 'body'), PAD, bodyTop, tw, bodyH, bundle.affinitiesInsights);

  // 4 sectors + chart
  pushTextBox(requests, pageIds[4], scratchShapeId(4, 'title'), PAD, PAD, tw, titleH, titles[4]);
  const textH4 = bodyH * 0.38;
  pushTextBox(requests, pageIds[4], scratchShapeId(4, 'body'), PAD, bodyTop, tw, textH4, bundle.sectorsList);
  const imgY4 = bodyTop + textH4 + 0.12 * EMU_PER_IN;
  const imgH = bodyH * 0.52;
  pushImage(requests, pageIds[4], scratchShapeId(4, 'img'), bundle.chartSectors, PAD, imgY4, tw, imgH);

  // 5 growth + chart
  pushTextBox(requests, pageIds[5], scratchShapeId(5, 'title'), PAD, PAD, tw, titleH, titles[5]);
  const textH5 = bodyH * 0.32;
  pushTextBox(requests, pageIds[5], scratchShapeId(5, 'body'), PAD, bodyTop, tw, textH5, bundle.growthSummary);
  const imgY5 = bodyTop + textH5 + 0.12 * EMU_PER_IN;
  pushImage(requests, pageIds[5], scratchShapeId(5, 'img'), bundle.chartGrowth, PAD, imgY5, tw, imgH);

  // 6 recent
  pushTextBox(requests, pageIds[6], scratchShapeId(6, 'title'), PAD, PAD, tw, titleH, titles[6]);
  pushTextBox(requests, pageIds[6], scratchShapeId(6, 'body'), PAD, bodyTop, tw, bodyH, bundle.recentActivityList);

  // 7 most sought + needs chart
  pushTextBox(requests, pageIds[7], scratchShapeId(7, 'title'), PAD, PAD, tw, titleH, titles[7]);
  const textH7 = bodyH * 0.38;
  pushTextBox(requests, pageIds[7], scratchShapeId(7, 'body'), PAD, bodyTop, tw, textH7, bundle.mostSoughtList);
  const imgY7 = bodyTop + textH7 + 0.12 * EMU_PER_IN;
  pushImage(requests, pageIds[7], scratchShapeId(7, 'img'), bundle.chartNeeds, PAD, imgY7, tw, imgH);

  // 8 active list
  pushTextBox(requests, pageIds[8], scratchShapeId(8, 'title'), PAD, PAD, tw, titleH, titles[8]);
  pushTextBox(requests, pageIds[8], scratchShapeId(8, 'body'), PAD, bodyTop, tw, bodyH, bundle.activeOppsList);

  // 9 why active
  pushTextBox(requests, pageIds[9], scratchShapeId(9, 'title'), PAD, PAD, tw, titleH, titles[9]);
  pushTextBox(requests, pageIds[9], scratchShapeId(9, 'body'), PAD, bodyTop, tw, bodyH, bundle.activeOppsWhy);

  // 10 recent requests
  pushTextBox(requests, pageIds[10], scratchShapeId(10, 'title'), PAD, PAD, tw, titleH, titles[10]);
  pushTextBox(requests, pageIds[10], scratchShapeId(10, 'body'), PAD, bodyTop, tw, bodyH, bundle.recentRequestsList);

  // 11 why requests
  pushTextBox(requests, pageIds[11], scratchShapeId(11, 'title'), PAD, PAD, tw, titleH, titles[11]);
  pushTextBox(requests, pageIds[11], scratchShapeId(11, 'body'), PAD, bodyTop, tw, bodyH, bundle.recentRequestsWhy);

  // 12 CTA
  pushTextBox(requests, pageIds[12], scratchShapeId(12, 'title'), PAD, PAD, tw, titleH, titles[12]);
  pushTextBox(requests, pageIds[12], scratchShapeId(12, 'body'), PAD, bodyTop, tw, bodyH, bundle.ctaCards);

  // 13 footer
  pushTextBox(requests, pageIds[13], scratchShapeId(13, 'title'), PAD, PAD, tw, titleH, titles[13]);
  pushTextBox(requests, pageIds[13], scratchShapeId(13, 'body'), PAD, bodyTop, tw, bodyH, footerBody(bundle, lang));

  await slides.presentations.batchUpdate({
    presentationId,
    requestBody: { requests },
  });

  return presentationId;
}
