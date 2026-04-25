import type { Language, MemberNetworkRequest } from '@/types';

const EMAIL_LIKE = /[^\s@]+@[^\s@]+|@/g;
const URL_LIKE = /https?:\/\/\S+/gi;

function stripUnsafeFragment(s: string, max: number): string {
  const oneLine = s.replace(/\s+/g, ' ').trim();
  if (!oneLine) return '';
  return oneLine
    .replace(EMAIL_LIKE, '')
    .replace(URL_LIKE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function sanitizePublicRequestLocation(zone: string | undefined, lang: Language): string {
  const t = stripUnsafeFragment(zone ?? '', 48);
  if (t) return t;
  return lang === 'en' ? 'Network' : lang === 'es' ? 'En la red' : 'Réseau';
}

type SearchIntentKey =
  | 'distributor_food'
  | 'distributor'
  | 'partner'
  | 'supplier_packaging'
  | 'supplier'
  | 'investment'
  | 'expert_tax'
  | 'expert'
  | 'softlanding'
  | 'default';

const INTENT_LABEL: Record<SearchIntentKey, Record<Language, string>> = {
  distributor_food: {
    fr: 'Recherche distributeur alimentaire',
    en: 'Seeks a food & beverage distributor',
    es: 'Busca distribuidor de alimentos',
  },
  distributor: {
    fr: 'Recherche distributeur',
    en: 'Seeks a distributor',
    es: 'Busca distribuidor',
  },
  partner: {
    fr: 'Recherche partenaire commercial',
    en: 'Seeks a commercial partner',
    es: 'Busca socio comercial',
  },
  supplier_packaging: {
    fr: 'Recherche fournisseur packaging',
    en: 'Seeks a packaging supplier',
    es: 'Busca proveedor de packaging',
  },
  supplier: {
    fr: 'Recherche fournisseur',
    en: 'Seeks a supplier',
    es: 'Busca proveedor',
  },
  investment: {
    fr: 'Recherche appui financement',
    en: 'Seeks funding support',
    es: 'Busca apoyo de financiamiento',
  },
  expert_tax: {
    fr: 'Recherche expert en fiscalité transfrontalière',
    en: 'Seeks a cross-border tax expert',
    es: 'Busca experto fiscal transfronterizo',
  },
  expert: {
    fr: 'Recherche expert local',
    en: 'Seeks a local expert',
    es: 'Busca experto local',
  },
  softlanding: {
    fr: "Recherche appui à l'implantation locale",
    en: 'Seeks on-the-ground setup support',
    es: 'Busca apoyo de implantación local',
  },
  default: {
    fr: 'Recherche connexion business',
    en: 'Seeks a business connection',
    es: 'Busca conexión de negocio',
  },
};

function detectIntent(
  sector: string | undefined,
  productOrService: string | undefined
): SearchIntentKey {
  const s = `${sector ?? ''} ${productOrService ?? ''}`.toLowerCase();

  if (/(distribut|import|revend|aliment|agro|bever|boisson|fromage|boulanger|food|marché|retail|gms)/i.test(s)) {
    if (/(aliment|agro|bever|food|boisson|fromage|boulange)/i.test(s)) return 'distributor_food';
    return 'distributor';
  }
  if (/(fourni|fournis|fourniss|sourcing|approvisionn|matièr|materi)/i.test(s)) {
    if (/emball|pack|carton|étiqu|label|packag/i.test(s)) return 'supplier_packaging';
    return 'supplier';
  }
  if (/(parten|commerc|stratég|joint-venture|jv|co-?brand|marché client)/i.test(s)) return 'partner';
  if (/(invest|finance|funding|levé|levee|capital|crédit|banc|private equity)/i.test(s)) {
    return 'investment';
  }
  if (/(fisc|transfront|fiscal|double imposition|double négoci|tax|impôt|droit des affaires|comptab)/i.test(s)) {
    return 'expert_tax';
  }
  if (/(expert|mentor|prestata|conseil|avoc|comptab|compliance)/i.test(s)) {
    if (/(fisc|fiscal|tax|transfront|frontière)/i.test(s)) return 'expert_tax';
    return 'expert';
  }
  if (/(implant|implantation|bureau|représent|onshore|soft-?land|lancement locale|bureau de liaison)/i.test(s)) {
    return 'softlanding';
  }
  return 'default';
}

/**
 * Génère une libellé **anonyme** (sans texte membre, sans sociétés) pour un flux public type vitrine.
 */
export function formatPublicRequestLabel(
  r: Pick<MemberNetworkRequest, 'sector' | 'zone' | 'productOrService'>,
  lang: Language
): { main: string; location: string; line: string } {
  const key = detectIntent(r.sector, r.productOrService);
  const main = INTENT_LABEL[key][lang] ?? INTENT_LABEL.default[lang];
  const location = sanitizePublicRequestLocation(r.zone, lang);
  return {
    main,
    location,
    line: `${main} — ${location}`,
  };
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Heures / jours / semaines, court, pour une ligne de flux (i18n FR, EN, ES).
 */
export function getRequestFeedRelativeTime(createdAtMs: number, lang: Language, nowMs: number = Date.now()): string {
  const c = new Date(createdAtMs);
  if (!Number.isFinite(createdAtMs) || nowMs - createdAtMs < 0) {
    return lang === 'en' ? 'Recently' : lang === 'es' ? 'Reciente' : 'Récemment';
  }
  const diff = nowMs - createdAtMs;
  const diffM = Math.floor(diff / 60000);
  const diffH = Math.floor(diff / 3600000);
  const s0 = startOfDay(c);
  const s1 = startOfDay(new Date(nowMs));
  const dayDiff = Math.round((s1.getTime() - s0.getTime()) / 86400000);
  const sameLocalDay = dayDiff === 0;
  const yesterday = dayDiff === 1;

  if (lang === 'en') {
    if (diffM < 1) return 'Just now';
    if (diffM < 60) return `${diffM} min ago`;
    if (sameLocalDay && diffH < 6) return `${diffH} h ago`;
    if (sameLocalDay) return 'Today';
    if (yesterday) return 'Yesterday';
    if (dayDiff < 7) return `${dayDiff} days ago`;
    const w = Math.max(1, Math.floor(dayDiff / 7));
    if (dayDiff < 32) return `${w} wk${w > 1 ? 's' : ''} ago`;
    const m = Math.max(1, Math.floor(dayDiff / 30));
    return `${m} mo${m > 1 ? 's' : ''} ago`;
  }
  if (lang === 'es') {
    if (diffM < 1) return 'Ahora';
    if (diffM < 60) { return `Hace ${diffM} min`; }
    if (sameLocalDay && diffH < 6) { return `Hace ${diffH} h`; }
    if (sameLocalDay) return 'Hoy';
    if (yesterday) return 'Ayer';
    if (dayDiff < 7) { return `Hace ${dayDiff} día${dayDiff > 1 ? 's' : ''}`; }
    const w = Math.max(1, Math.floor(dayDiff / 7));
    if (dayDiff < 32) { return `Hace ${w} semana${w > 1 ? 's' : ''}`; }
    const m = Math.max(1, Math.floor(dayDiff / 30));
    return `Hace ${m} mes${m > 1 ? 'es' : ''}`;
  }
  if (diffM < 1) { return "À l'instant"; }
  if (diffM < 60) { return `Il y a ${diffM} min`; }
  if (sameLocalDay && diffH < 6) { return `Il y a ${diffH} h`; }
  if (sameLocalDay) { return "Aujourd'hui"; }
  if (yesterday) { return 'Hier'; }
  if (dayDiff < 7) { return `Il y a ${dayDiff} jours`; }
  const w = Math.max(1, Math.floor(dayDiff / 7));
  if (dayDiff < 32) { return w === 1 ? 'Il y a 1 sem.' : `Il y a ${w} sem.`; }
  const m = Math.max(1, Math.floor(dayDiff / 30));
  return m === 1 ? 'Il y a 1 mois' : `Il y a ${m} mois`;
}

const MS_48H = 48 * 60 * 60 * 1000;

export function isRequestNewish(createdAtMs: number, nowMs: number = Date.now()): boolean {
  if (!Number.isFinite(createdAtMs)) return false;
  return nowMs - createdAtMs >= 0 && nowMs - createdAtMs < MS_48H;
}
