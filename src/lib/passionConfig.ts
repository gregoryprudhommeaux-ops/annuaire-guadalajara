/**
 * Source unique de vérité pour toutes les passions du réseau.
 * (Équivalent TS de lib/passions.config.js)
 */

/** Aligné sur `Language` du projet (évite d’importer `types` → dépendance circulaire). */
export type PassionLocale = 'fr' | 'es';

export interface PassionOption {
  id: string;
  label: { fr: string; es: string };
}

export interface PassionCategory {
  id: string;
  label: { fr: string; es: string };
  emoji: string;
  options: PassionOption[];
}

export const PASSIONS_CATEGORIES: PassionCategory[] = [
  {
    id: 'sport_nature',
    label: { fr: 'Sport & Nature', es: 'Deporte y naturaleza' },
    emoji: '🌿',
    options: [
      { id: 'golf', label: { fr: 'Golf', es: 'Golf' } },
      { id: 'peche', label: { fr: 'Pêche', es: 'Pesca' } },
      { id: 'randonnee', label: { fr: 'Randonnée', es: 'Senderismo' } },
      { id: 'surf', label: { fr: 'Surf', es: 'Surf' } },
      { id: 'tennis', label: { fr: 'Tennis', es: 'Tenis' } },
      { id: 'cyclisme', label: { fr: 'Cyclisme', es: 'Ciclismo' } },
      { id: 'yoga', label: { fr: 'Yoga', es: 'Yoga' } },
      { id: 'natation', label: { fr: 'Natation', es: 'Natación' } },
    ],
  },
  {
    id: 'gastronomie',
    label: { fr: 'Gastronomie', es: 'Gastronomía' },
    emoji: '🍷',
    options: [
      { id: 'cuisine', label: { fr: 'Cuisine', es: 'Cocina' } },
      { id: 'vins', label: { fr: 'Vins', es: 'Vinos' } },
      { id: 'gastronomie', label: { fr: 'Gastronomie', es: 'Gastronomía' } },
      { id: 'mixologie', label: { fr: 'Mixologie', es: 'Mixología' } },
      { id: 'patisserie', label: { fr: 'Pâtisserie', es: 'Repostería' } },
    ],
  },
  {
    id: 'culture_arts',
    label: { fr: 'Culture & Arts', es: 'Cultura y arte' },
    emoji: '🎭',
    options: [
      { id: 'musique', label: { fr: 'Musique', es: 'Música' } },
      { id: 'cinema', label: { fr: 'Cinéma', es: 'Cine' } },
      { id: 'litterature', label: { fr: 'Littérature', es: 'Literatura' } },
      { id: 'art', label: { fr: 'Art', es: 'Arte' } },
      { id: 'photographie', label: { fr: 'Photographie', es: 'Fotografía' } },
      { id: 'theatre', label: { fr: 'Théâtre', es: 'Teatro' } },
    ],
  },
  {
    id: 'voyage_aventure',
    label: { fr: 'Voyage & Aventure', es: 'Viaje y aventura' },
    emoji: '✈️',
    options: [
      { id: 'voyage', label: { fr: 'Voyage', es: 'Viaje' } },
      { id: 'moto', label: { fr: 'Moto', es: 'Moto' } },
      { id: 'plongee', label: { fr: 'Plongée', es: 'Buceo' } },
      { id: 'escalade', label: { fr: 'Escalade', es: 'Escalada' } },
      { id: 'camping', label: { fr: 'Camping', es: 'Camping' } },
    ],
  },
  {
    id: 'tech_business',
    label: { fr: 'Tech & Business', es: 'Tech y negocios' },
    emoji: '🚀',
    options: [
      { id: 'startups', label: { fr: 'Startups', es: 'Startups' } },
      { id: 'ia', label: { fr: 'Intelligence Artificielle', es: 'Inteligencia artificial' } },
      { id: 'investissement', label: { fr: 'Investissement', es: 'Inversión' } },
      { id: 'crypto', label: { fr: 'Crypto / Web3', es: 'Cripto / Web3' } },
      { id: 'ecommerce', label: { fr: 'E-commerce', es: 'Comercio electrónico' } },
    ],
  },
];

export const MAX_PASSIONS = 3;

const ALL_OPTION_IDS = PASSIONS_CATEGORIES.flatMap((c) => c.options.map((o) => o.id));
export const PASSION_OPTION_ID_SET = new Set(ALL_OPTION_IDS);

/** Libellé d’une passion à partir de son id (langue courante). */
export function getPassionLabel(id: string, lang: PassionLocale): string {
  for (const cat of PASSIONS_CATEGORIES) {
    const found = cat.options.find((o) => o.id === id);
    if (found) return found.label[lang];
  }
  return id;
}

/** Emoji de la catégorie pour une passion donnée. */
export function getPassionEmoji(id: string): string {
  for (const cat of PASSIONS_CATEGORIES) {
    const found = cat.options.find((o) => o.id === id);
    if (found) return cat.emoji;
  }
  return '🎯';
}

/** Libellé de catégorie (FR / ES). */
export function getPassionCategoryLabel(categoryId: string, lang: PassionLocale): string {
  const cat = PASSIONS_CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.label[lang] : categoryId;
}

/**
 * Garde uniquement les ids connus, sans doublons, max {@link MAX_PASSIONS} (ordre conservé).
 * Les anciennes fiches avec `hobby` (texte libre) ne sont pas converties automatiquement.
 */
export function sanitizePassionIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    if (typeof x !== 'string' || out.length >= MAX_PASSIONS) break;
    if (!PASSION_OPTION_ID_SET.has(x) || seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}
