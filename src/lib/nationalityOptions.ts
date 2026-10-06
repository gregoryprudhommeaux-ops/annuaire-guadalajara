import type { Language } from '../types';

export type NationalityOption = { code: string; fr: string; es: string; en: string };

/** Nationalités les plus fréquentes dans la communauté — toujours en tête de liste. */
export const PRIORITY_NATIONALITY_CODES = ['MX', 'FR', 'CH', 'BE', 'CA'] as const;

const PRIORITY_INDEX = new Map(
  PRIORITY_NATIONALITY_CODES.map((code, index) => [code, index] as const)
);

/** Codes ISO 3166-1 alpha-2 ; libellés alignés sur les formulaires européens courants. */
const NATIONALITY_OPTIONS_RAW: NationalityOption[] = [
  { code: 'MX', fr: 'Mexique', es: 'México', en: 'Mexico' },
  { code: 'FR', fr: 'France', es: 'Francia', en: 'France' },
  { code: 'CH', fr: 'Suisse', es: 'Suiza', en: 'Switzerland' },
  { code: 'BE', fr: 'Belgique', es: 'Bélgica', en: 'Belgium' },
  { code: 'CA', fr: 'Canada', es: 'Canadá', en: 'Canada' },
  { code: 'DE', fr: 'Allemagne', es: 'Alemania', en: 'Germany' },
  { code: 'ES', fr: 'Espagne', es: 'España', en: 'Spain' },
  { code: 'IT', fr: 'Italie', es: 'Italia', en: 'Italy' },
  { code: 'GB', fr: 'Royaume-Uni', es: 'Reino Unido', en: 'United Kingdom' },
  { code: 'LU', fr: 'Luxembourg', es: 'Luxemburgo', en: 'Luxembourg' },
  { code: 'NL', fr: 'Pays-Bas', es: 'Países Bajos', en: 'Netherlands' },
  { code: 'AT', fr: 'Autriche', es: 'Austria', en: 'Austria' },
  { code: 'PT', fr: 'Portugal', es: 'Portugal', en: 'Portugal' },
  { code: 'IE', fr: 'Irlande', es: 'Irlanda', en: 'Ireland' },
  { code: 'SE', fr: 'Suède', es: 'Suecia', en: 'Sweden' },
  { code: 'NO', fr: 'Norvège', es: 'Noruega', en: 'Norway' },
  { code: 'DK', fr: 'Danemark', es: 'Dinamarca', en: 'Denmark' },
  { code: 'FI', fr: 'Finlande', es: 'Finlandia', en: 'Finland' },
  { code: 'PL', fr: 'Pologne', es: 'Polonia', en: 'Poland' },
  { code: 'CZ', fr: 'Tchéquie', es: 'Chequia', en: 'Czechia' },
  { code: 'RO', fr: 'Roumanie', es: 'Rumania', en: 'Romania' },
  { code: 'GR', fr: 'Grèce', es: 'Grecia', en: 'Greece' },
  { code: 'HU', fr: 'Hongrie', es: 'Hungría', en: 'Hungary' },
  { code: 'US', fr: 'États-Unis', es: 'Estados Unidos', en: 'United States' },
  { code: 'BR', fr: 'Brésil', es: 'Brasil', en: 'Brazil' },
  { code: 'AR', fr: 'Argentine', es: 'Argentina', en: 'Argentina' },
  { code: 'CO', fr: 'Colombie', es: 'Colombia', en: 'Colombia' },
  { code: 'CL', fr: 'Chili', es: 'Chile', en: 'Chile' },
  { code: 'PE', fr: 'Pérou', es: 'Perú', en: 'Peru' },
  { code: 'MA', fr: 'Maroc', es: 'Marruecos', en: 'Morocco' },
  { code: 'DZ', fr: 'Algérie', es: 'Argelia', en: 'Algeria' },
  { code: 'TN', fr: 'Tunisie', es: 'Túnez', en: 'Tunisia' },
  { code: 'SN', fr: 'Sénégal', es: 'Senegal', en: 'Senegal' },
  { code: 'CI', fr: "Côte d'Ivoire", es: 'Costa de Marfil', en: "Côte d'Ivoire" },
  { code: 'CM', fr: 'Cameroun', es: 'Camerún', en: 'Cameroon' },
  { code: 'JP', fr: 'Japon', es: 'Japón', en: 'Japan' },
  { code: 'CN', fr: 'Chine', es: 'China', en: 'China' },
  { code: 'IN', fr: 'Inde', es: 'India', en: 'India' },
  { code: 'KR', fr: 'Corée du Sud', es: 'Corea del Sur', en: 'South Korea' },
  { code: 'AU', fr: 'Australie', es: 'Australia', en: 'Australia' },
  { code: 'NZ', fr: 'Nouvelle-Zélande', es: 'Nueva Zelanda', en: 'New Zealand' },
  { code: 'IL', fr: 'Israël', es: 'Israel', en: 'Israel' },
  { code: 'TR', fr: 'Turquie', es: 'Turquía', en: 'Türkiye' },
  { code: 'RU', fr: 'Russie', es: 'Rusia', en: 'Russia' },
  { code: 'UA', fr: 'Ukraine', es: 'Ucrania', en: 'Ukraine' },
];

function labelFor(option: NationalityOption, lang: Language): string {
  if (lang === 'fr') return option.fr;
  if (lang === 'es') return option.es;
  return option.en;
}

/** Priorité MX / FR / CH / BE / CA, puis le reste alphabétique dans la langue demandée. */
export function sortNationalityOptions(
  options: NationalityOption[],
  lang: Language = 'fr'
): NationalityOption[] {
  return [...options].sort((a, b) => {
    const pa = PRIORITY_INDEX.has(a.code) ? PRIORITY_INDEX.get(a.code)! : Number.POSITIVE_INFINITY;
    const pb = PRIORITY_INDEX.has(b.code) ? PRIORITY_INDEX.get(b.code)! : Number.POSITIVE_INFINITY;
    if (pa !== pb) return pa - pb;
    return labelFor(a, lang).localeCompare(labelFor(b, lang), lang);
  });
}

/** Liste prête pour les selects : priorités en tête, reste alphabétique (FR). */
export const NATIONALITY_OPTIONS: NationalityOption[] = sortNationalityOptions(
  NATIONALITY_OPTIONS_RAW,
  'fr'
);

export function nationalityLabel(code: string | undefined | null, lang: Language): string {
  if (!code?.trim()) return '';
  const row = NATIONALITY_OPTIONS.find((o) => o.code === code.trim().toUpperCase());
  if (!row) return code;
  return labelFor(row, lang);
}
