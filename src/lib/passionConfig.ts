/**
 * Source unique de vérité pour toutes les passions du réseau.
 * (Équivalent TS de lib/passions.config.js)
 */

/** Aligné sur `Language` du projet (évite d’importer `types` → dépendance circulaire). */
export type PassionLocale = 'fr' | 'es' | 'en';

type TriLabel = { fr: string; es: string; en: string };

export interface PassionOption {
  id: string;
  label: TriLabel;
}

export interface PassionCategory {
  id: string;
  label: TriLabel;
  emoji: string;
  options: PassionOption[];
}

export const PASSIONS_CATEGORIES: PassionCategory[] = [
  {
    id: 'sport_nature',
    label: { fr: 'Sport & Nature', es: 'Deporte y naturaleza', en: 'Sport & nature' },
    emoji: '🌿',
    options: [
      { id: 'golf', label: { fr: 'Golf', es: 'Golf', en: 'Golf' } },
      { id: 'peche', label: { fr: 'Pêche', es: 'Pesca', en: 'Fishing' } },
      { id: 'randonnee', label: { fr: 'Randonnée', es: 'Senderismo', en: 'Hiking' } },
      { id: 'surf', label: { fr: 'Surf', es: 'Surf', en: 'Surf' } },
      { id: 'tennis', label: { fr: 'Tennis', es: 'Tenis', en: 'Tennis' } },
      { id: 'cyclisme', label: { fr: 'Cyclisme', es: 'Ciclismo', en: 'Cycling' } },
      { id: 'yoga', label: { fr: 'Yoga', es: 'Yoga', en: 'Yoga' } },
      { id: 'natation', label: { fr: 'Natation', es: 'Natación', en: 'Swimming' } },
    ],
  },
  {
    id: 'gastronomie',
    label: { fr: 'Gastronomie', es: 'Gastronomía', en: 'Food & drink' },
    emoji: '🍷',
    options: [
      { id: 'cuisine', label: { fr: 'Cuisine', es: 'Cocina', en: 'Cooking' } },
      { id: 'vins', label: { fr: 'Vins', es: 'Vinos', en: 'Wine' } },
      { id: 'gastronomie', label: { fr: 'Gastronomie', es: 'Gastronomía', en: 'Gastronomy' } },
      { id: 'mixologie', label: { fr: 'Mixologie', es: 'Mixología', en: 'Mixology' } },
      { id: 'patisserie', label: { fr: 'Pâtisserie', es: 'Repostería', en: 'Pastry' } },
    ],
  },
  {
    id: 'culture_arts',
    label: { fr: 'Culture & Arts', es: 'Cultura y arte', en: 'Culture & arts' },
    emoji: '🎭',
    options: [
      { id: 'musique', label: { fr: 'Musique', es: 'Música', en: 'Music' } },
      { id: 'cinema', label: { fr: 'Cinéma', es: 'Cine', en: 'Film' } },
      { id: 'litterature', label: { fr: 'Littérature', es: 'Literatura', en: 'Literature' } },
      { id: 'art', label: { fr: 'Art', es: 'Arte', en: 'Art' } },
      { id: 'photographie', label: { fr: 'Photographie', es: 'Fotografía', en: 'Photography' } },
      { id: 'theatre', label: { fr: 'Théâtre', es: 'Teatro', en: 'Theatre' } },
    ],
  },
  {
    id: 'voyage_aventure',
    label: { fr: 'Voyage & Aventure', es: 'Viaje y aventura', en: 'Travel & adventure' },
    emoji: '✈️',
    options: [
      { id: 'voyage', label: { fr: 'Voyage', es: 'Viaje', en: 'Travel' } },
      { id: 'moto', label: { fr: 'Moto', es: 'Moto', en: 'Motorcycling' } },
      { id: 'plongee', label: { fr: 'Plongée', es: 'Buceo', en: 'Diving' } },
      { id: 'escalade', label: { fr: 'Escalade', es: 'Escalada', en: 'Climbing' } },
      { id: 'camping', label: { fr: 'Camping', es: 'Camping', en: 'Camping' } },
    ],
  },
  {
    id: 'tech_business',
    label: { fr: 'Tech & Business', es: 'Tech y negocios', en: 'Tech & business' },
    emoji: '🚀',
    options: [
      { id: 'startups', label: { fr: 'Startups', es: 'Startups', en: 'Startups' } },
      { id: 'ia', label: { fr: 'Intelligence Artificielle', es: 'Inteligencia artificial', en: 'Artificial intelligence' } },
      { id: 'investissement', label: { fr: 'Investissement', es: 'Inversión', en: 'Investing' } },
      { id: 'crypto', label: { fr: 'Crypto / Web3', es: 'Cripto / Web3', en: 'Crypto / Web3' } },
      { id: 'ecommerce', label: { fr: 'E-commerce', es: 'Comercio electrónico', en: 'E-commerce' } },
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

/** Libellé de catégorie (FR / ES / EN). */
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
