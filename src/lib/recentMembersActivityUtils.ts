import { needOptionLabel, sanitizeHighlightedNeeds } from '@/needOptions';
import type { Language } from '@/types';
import type { UserProfile } from '@/types';

/** Date depuis un Timestamp Firestore ou champs hétérogènes. */
export function toCreatedDate(
  v: UserProfile['createdAt'] | unknown
): Date | null {
  if (v == null) return null;
  const t = v as { toDate?: () => Date };
  if (typeof t.toDate === 'function') {
    try {
      return t.toDate();
    } catch {
      return null;
    }
  }
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  return null;
}

type RelativeCopy = {
  today: string;
  yesterday: string;
  daysAgo: (n: number) => string;
  weeksAgo: (n: number) => string;
  monthsAgo: (n: number) => string;
};

function tRelative(lang: Language): RelativeCopy {
  if (lang === 'en') {
    return {
      today: 'Joined today',
      yesterday: 'Joined yesterday',
      daysAgo: (n) => `Joined ${n} day${n === 1 ? '' : 's'} ago`,
      weeksAgo: (n) => `Joined ${n} week${n === 1 ? '' : 's'} ago`,
      monthsAgo: (n) => `Joined ${n} month${n === 1 ? '' : 's'} ago`,
    };
  }
  if (lang === 'es') {
    return {
      today: 'Inscrito hoy',
      yesterday: 'Inscrito ayer',
      daysAgo: (n) => `Hace ${n} día${n === 1 ? '' : 's'}`,
      weeksAgo: (n) => `Hace ${n} semana${n === 1 ? '' : 's'}`,
      monthsAgo: (n) => `Hace ${n} mes${n === 1 ? '' : 'es'}`,
    };
  }
  return {
    today: "Inscrit aujourd'hui",
    yesterday: 'Inscrit hier',
    daysAgo: (n) =>
      n === 1 ? "Inscrit il y a 1 jour" : `Inscrit il y a ${n} jours`,
    weeksAgo: (n) =>
      n === 1 ? 'Inscrit il y a 1 semaine' : `Inscrit il y a ${n} semaines`,
    monthsAgo: (n) => `Inscrit il y a ${n} mois`,
  };
}

/**
 * Libellé type « Inscrit il y a X jours » à partir d’un `Timestamp` Firestore.
 * Comportement calqué sur le spec produit, avec i18n FR / EN / ES.
 */
export function getRelativeTimeLabel(
  createdAt: UserProfile['createdAt'],
  lang: Language,
  now: Date = new Date()
): string {
  const created = toCreatedDate(createdAt);
  if (!created) return tRelative(lang).today;
  const t = tRelative(lang);
  const diffMs = now.getTime() - created.getTime();
  const diffInDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) return t.today;
  if (diffInDays === 0) return t.today;
  if (diffInDays === 1) return t.yesterday;
  if (diffInDays < 7) return t.daysAgo(diffInDays);

  if (diffInDays < 30) {
    const w = Math.max(1, Math.floor(diffInDays / 7));
    return t.weeksAgo(w);
  }
  const months = Math.max(1, Math.floor(diffInDays / 30));
  return t.monthsAgo(months);
}

/** Secteur affichable : 1ʳᵉ activité, sinon activité de tête, sinon cible libre. */
export function getMemberSectorKey(profile: UserProfile): string {
  const slot0 = profile.companyActivities?.[0];
  return String(
    slot0?.activityCategory ?? profile.activityCategory ?? (profile.targetSectors?.[0] ?? '')
  ).trim();
}

const NEED_RECHERCHE: Record<string, Record<Language, string>> = {
  NEED_DISTRIB: {
    fr: 'Recherche distributeur local',
    en: 'Seeks a local distributor',
    es: 'Busca distribuidor local',
  },
  NEED_PARTNERS: {
    fr: 'Recherche partenaires commerciaux',
    en: 'Seeks commercial partners',
    es: 'Busca socios comerciales',
  },
  NEED_SUPPLIERS: {
    fr: 'Recherche fournisseurs',
    en: 'Seeks suppliers',
    es: 'Busca proveedores',
  },
  NEED_INVESTORS: {
    fr: 'Recherche investisseurs',
    en: 'Seeks investors',
    es: 'Busca inversores',
  },
  NEED_SERVICE_PROV: {
    fr: 'Recherche experts locaux',
    en: 'Seeks on-the-ground experts',
    es: 'Busca expertos locales',
  },
  NEED_MENTOR: {
    fr: 'Recherche experts locaux',
    en: 'Seeks advisors & mentors',
    es: 'Busca asesoría y mentoría',
  },
};

const FALLBACK_NEED: Record<Language, string> = {
  fr: 'Recherche connexions business',
  en: 'Seeks business connections',
  es: 'Busca conexiones de negocio',
};

/**
 * Ligne type « Recherche … » d’après le 1er besoin mis en avant, `primaryNeed` en base, ou repli.
 */
export function getPrimaryNeedLine(profile: UserProfile, lang: Language): string {
  const primary = (profile as { primaryNeed?: string }).primaryNeed;
  if (typeof primary === 'string' && primary.trim() !== '') {
    return primary.trim();
  }

  const [first] = sanitizeHighlightedNeeds(profile.highlightedNeeds);
  if (first) {
    const spec = NEED_RECHERCHE[first];
    if (spec) return spec[lang];
    const L = needOptionLabel(first, lang);
    if (lang === 'fr') return `Recherche : ${L}`;
    if (lang === 'en') return `Seeks: ${L}`;
    return `Busca: ${L}`;
  }

  return FALLBACK_NEED[lang];
}
