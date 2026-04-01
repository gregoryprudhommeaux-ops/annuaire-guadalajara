import type { Language } from '../types';

/** Indicatif par défaut (Mexique) — aligné sur l’usage principal de l’annuaire. */
export const DEFAULT_PHONE_DIAL = '+52';

type DialRow = { dial: string; fr: string; es: string; en: string };

const ROWS: DialRow[] = [
  { dial: '+52', fr: 'Mexique', es: 'México', en: 'Mexico' },
  { dial: '+1', fr: 'États-Unis / Canada', es: 'EE. UU. / Canadá', en: 'US / Canada' },
  { dial: '+33', fr: 'France', es: 'Francia', en: 'France' },
  { dial: '+34', fr: 'Espagne', es: 'España', en: 'Spain' },
  { dial: '+32', fr: 'Belgique', es: 'Bélgica', en: 'Belgium' },
  { dial: '+41', fr: 'Suisse', es: 'Suiza', en: 'Switzerland' },
  { dial: '+352', fr: 'Luxembourg', es: 'Luxemburgo', en: 'Luxembourg' },
  { dial: '+351', fr: 'Portugal', es: 'Portugal', en: 'Portugal' },
  { dial: '+39', fr: 'Italie', es: 'Italia', en: 'Italy' },
  { dial: '+49', fr: 'Allemagne', es: 'Alemania', en: 'Germany' },
  { dial: '+44', fr: 'Royaume-Uni', es: 'Reino Unido', en: 'United Kingdom' },
  { dial: '+31', fr: 'Pays-Bas', es: 'Países Bajos', en: 'Netherlands' },
  { dial: '+45', fr: 'Danemark', es: 'Dinamarca', en: 'Denmark' },
  { dial: '+46', fr: 'Suède', es: 'Suecia', en: 'Sweden' },
  { dial: '+47', fr: 'Norvège', es: 'Noruega', en: 'Norway' },
  { dial: '+358', fr: 'Finlande', es: 'Finlandia', en: 'Finland' },
  { dial: '+353', fr: 'Irlande', es: 'Irlanda', en: 'Ireland' },
  { dial: '+43', fr: 'Autriche', es: 'Austria', en: 'Austria' },
  { dial: '+48', fr: 'Pologne', es: 'Polonia', en: 'Poland' },
  { dial: '+420', fr: 'République tchèque', es: 'República Checa', en: 'Czech Republic' },
  { dial: '+36', fr: 'Hongrie', es: 'Hungría', en: 'Hungary' },
  { dial: '+40', fr: 'Roumanie', es: 'Rumania', en: 'Romania' },
  { dial: '+7', fr: 'Russie / Kazakhstan', es: 'Rusia / Kazajistán', en: 'Russia / Kazakhstan' },
  { dial: '+81', fr: 'Japon', es: 'Japón', en: 'Japan' },
  { dial: '+82', fr: 'Corée du Sud', es: 'Corea del Sur', en: 'South Korea' },
  { dial: '+86', fr: 'Chine', es: 'China', en: 'China' },
  { dial: '+852', fr: 'Hong Kong', es: 'Hong Kong', en: 'Hong Kong' },
  { dial: '+65', fr: 'Singapour', es: 'Singapur', en: 'Singapore' },
  { dial: '+61', fr: 'Australie', es: 'Australia', en: 'Australia' },
  { dial: '+64', fr: 'Nouvelle-Zélande', es: 'Nueva Zelanda', en: 'New Zealand' },
  { dial: '+91', fr: 'Inde', es: 'India', en: 'India' },
  { dial: '+54', fr: 'Argentine', es: 'Argentina', en: 'Argentina' },
  { dial: '+55', fr: 'Brésil', es: 'Brasil', en: 'Brazil' },
  { dial: '+56', fr: 'Chili', es: 'Chile', en: 'Chile' },
  { dial: '+57', fr: 'Colombie', es: 'Colombia', en: 'Colombia' },
  { dial: '+51', fr: 'Pérou', es: 'Perú', en: 'Peru' },
  { dial: '+593', fr: 'Équateur', es: 'Ecuador', en: 'Ecuador' },
  { dial: '+598', fr: 'Uruguay', es: 'Uruguay', en: 'Uruguay' },
  { dial: '+58', fr: 'Venezuela', es: 'Venezuela', en: 'Venezuela' },
  { dial: '+506', fr: 'Costa Rica', es: 'Costa Rica', en: 'Costa Rica' },
  { dial: '+507', fr: 'Panama', es: 'Panamá', en: 'Panama' },
  { dial: '+502', fr: 'Guatemala', es: 'Guatemala', en: 'Guatemala' },
  { dial: '+503', fr: 'Salvador', es: 'El Salvador', en: 'El Salvador' },
  { dial: '+504', fr: 'Honduras', es: 'Honduras', en: 'Honduras' },
  { dial: '+505', fr: 'Nicaragua', es: 'Nicaragua', en: 'Nicaragua' },
];

const BY_DIAL = new Map(ROWS.map((r) => [r.dial, r]));

/** Plus long d’abord pour découper correctement (+352 avant +35). */
export function phoneDialOptionsLongestFirst(): DialRow[] {
  return [...ROWS].sort((a, b) => b.dial.length - a.dial.length);
}

export function dialLabelForLang(dial: string, lang: Language): string {
  const r = BY_DIAL.get(dial);
  if (!r) return dial;
  const name = lang === 'es' ? r.es : lang === 'en' ? r.en : r.fr;
  return `${name} (${dial})`;
}

export function isKnownPhoneDial(d: string): boolean {
  return BY_DIAL.has(d);
}

export function splitStoredPhone(stored: string | undefined | null): { dial: string; local: string } {
  const s = (stored ?? '').replace(/\s/g, '');
  if (!s) return { dial: DEFAULT_PHONE_DIAL, local: '' };
  for (const { dial } of phoneDialOptionsLongestFirst()) {
    if (s.startsWith(dial)) {
      return { dial, local: s.slice(dial.length) };
    }
  }
  return { dial: DEFAULT_PHONE_DIAL, local: s.replace(/^\+/, '') };
}

export function mergePhoneDialLocal(dial: string, local: string): string {
  const d = dial.startsWith('+') ? dial : `+${dial.replace(/\D/g, '')}`;
  const digits = local.replace(/\D/g, '');
  if (!digits) return '';
  return `${d}${digits}`;
}

/** +52 en tête, puis le reste trié par indicatif (liste déroulante formulaire). */
export function phoneDialRowsOrderedForUi(): DialRow[] {
  const mx = ROWS.find((r) => r.dial === DEFAULT_PHONE_DIAL);
  const rest = ROWS.filter((r) => r.dial !== DEFAULT_PHONE_DIAL).sort((a, b) =>
    a.dial.localeCompare(b.dial, undefined, { numeric: true })
  );
  return mx ? [mx, ...rest] : rest;
}
