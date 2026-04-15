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
    label: {
      fr: 'Sport, nature & aventure',
      es: 'Deporte, naturaleza y aventura',
      en: 'Sport, nature & adventure',
    },
    emoji: '🌿',
    options: [
      { id: 'golf', label: { fr: 'Golf', es: 'Golf', en: 'Golf' } },
      { id: 'peche', label: { fr: 'Pêche', es: 'Pesca', en: 'Fishing' } },
      { id: 'padel', label: { fr: 'Padel', es: 'Pádel', en: 'Padel' } },
      { id: 'petanque', label: { fr: 'Pétanque', es: 'Petanca', en: 'Pétanque' } },
      { id: 'randonnee', label: { fr: 'Randonnée', es: 'Senderismo', en: 'Hiking' } },
      { id: 'surf', label: { fr: 'Surf', es: 'Surf', en: 'Surf' } },
      { id: 'tennis', label: { fr: 'Tennis', es: 'Tenis', en: 'Tennis' } },
      { id: 'foot', label: { fr: 'Foot', es: 'Fútbol', en: 'Soccer' } },
      { id: 'rugby', label: { fr: 'Rugby', es: 'Rugby', en: 'Rugby' } },
      { id: 'baseball', label: { fr: 'Baseball', es: 'Béisbol', en: 'Baseball' } },
      { id: 'cyclisme', label: { fr: 'Cyclisme', es: 'Ciclismo', en: 'Cycling' } },
      { id: 'yoga', label: { fr: 'Yoga', es: 'Yoga', en: 'Yoga' } },
      { id: 'meditation', label: { fr: 'Méditation', es: 'Meditación', en: 'Meditation' } },
      { id: 'natation', label: { fr: 'Natation', es: 'Natación', en: 'Swimming' } },
      { id: 'plongee', label: { fr: 'Plongée', es: 'Buceo', en: 'Diving' } },
      { id: 'escalade', label: { fr: 'Escalade', es: 'Escalada', en: 'Climbing' } },
      { id: 'camping', label: { fr: 'Camping', es: 'Camping', en: 'Camping' } },
      { id: 'voyage', label: { fr: 'Voyage', es: 'Viaje', en: 'Travel' } },
      { id: 'moto', label: { fr: 'Moto', es: 'Moto', en: 'Motorcycling' } },
    ],
  },
  {
    id: 'gastronomie',
    label: { fr: 'Gastronomie', es: 'Gastronomía', en: 'Food & drink' },
    emoji: '🍷',
    options: [
      { id: 'cuisine', label: { fr: 'Cuisine', es: 'Cocina', en: 'Cooking' } },
      { id: 'vins', label: { fr: 'Vins', es: 'Vinos', en: 'Wine' } },
      { id: 'patisserie', label: { fr: 'Pâtisserie', es: 'Repostería', en: 'Pastry' } },
    ],
  },
  {
    id: 'jeux',
    label: { fr: 'Jeux', es: 'Juegos', en: 'Games' },
    emoji: '🎮',
    options: [
      { id: 'video_games', label: { fr: 'Jeux vidéo', es: 'Videojuegos', en: 'Video games' } },
      { id: 'poker', label: { fr: 'Poker', es: 'Póker', en: 'Poker' } },
      { id: 'tarot', label: { fr: 'Tarot', es: 'Tarot', en: 'Tarot' } },
      { id: 'bridge', label: { fr: 'Bridge', es: 'Bridge', en: 'Bridge' } },
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

/** Minimum pour une fiche publiable (aligné sur `profilePublicationRules`). */
export const MIN_PASSIONS = 1;

export const MAX_PASSIONS = 5;

/**
 * Anciens ids encore présents en base : conservés pour l’affichage et la désélection,
 * mais plus proposés dans le sélecteur (voir {@link PASSION_OPTION_ID_SET}).
 */
const DEPRECATED_PASSION_LABELS: Record<string, TriLabel> = {
  gastronomie: { fr: 'Gastronomie', es: 'Gastronomía', en: 'Gastronomy' },
  mixologie: { fr: 'Mixologie', es: 'Mixología', en: 'Mixology' },
};

const ALL_ACTIVE_OPTION_IDS = PASSIONS_CATEGORIES.flatMap((c) => c.options.map((o) => o.id));
export const PASSION_OPTION_ID_SET = new Set(ALL_ACTIVE_OPTION_IDS);

export const KNOWN_PASSION_ID_SET = new Set([
  ...PASSION_OPTION_ID_SET,
  ...Object.keys(DEPRECATED_PASSION_LABELS),
]);

/** Libellé d’une passion à partir de son id (langue courante). */
export function getPassionLabel(id: string, lang: PassionLocale): string {
  for (const cat of PASSIONS_CATEGORIES) {
    const found = cat.options.find((o) => o.id === id);
    if (found) return found.label[lang];
  }
  const legacy = DEPRECATED_PASSION_LABELS[id];
  if (legacy) return legacy[lang];
  return id;
}

/** Emoji de la catégorie pour une passion donnée. */
export function getPassionEmoji(id: string): string {
  for (const cat of PASSIONS_CATEGORIES) {
    const found = cat.options.find((o) => o.id === id);
    if (found) return cat.emoji;
  }
  if (DEPRECATED_PASSION_LABELS[id]) return '🍷';
  return '🎯';
}

/** Libellé de catégorie (FR / ES / EN). */
export function getPassionCategoryLabel(categoryId: string, lang: PassionLocale): string {
  const cat = PASSIONS_CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.label[lang] : categoryId;
}

/**
 * Garde uniquement les ids connus, sans doublons, max {@link MAX_PASSIONS} (ordre conservé).
 * Le minimum pour publication est {@link MIN_PASSIONS} (vérifié ailleurs).
 * Les anciennes fiches avec `hobby` (texte libre) ne sont pas converties automatiquement.
 */
export function sanitizePassionIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    if (typeof x !== 'string' || out.length >= MAX_PASSIONS) break;
    if (!KNOWN_PASSION_ID_SET.has(x) || seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}
