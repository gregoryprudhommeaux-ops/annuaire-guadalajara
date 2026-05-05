import type { Language } from '@/types';

/** Normalise pour comparaison (accents, casse). */
export function normalizeLocationToken(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const MEXICO_COUNTRY_TOKENS = new Set([
  'mexique',
  'mexico',
  'mexiko',
  'mx',
  'estados unidos mexicanos',
  'united mexican states',
]);

/**
 * Indique si la valeur « pays » correspond au Mexique (tolère orthographe / langue).
 */
export function countryMeansMexico(country: string): boolean {
  const n = normalizeLocationToken(country);
  if (!n) return false;
  if (MEXICO_COUNTRY_TOKENS.has(n)) return true;
  return n.includes('mexic');
}

/**
 * Entités fédérales du Mexique (noms usuels, sans accent après normalisation).
 * Si l’état correspond, le pays d’implantation doit être le Mexique.
 */
const MEXICAN_STATE_NORM = new Set([
  'aguascalientes',
  'baja california',
  'baja california sur',
  'campeche',
  'chiapas',
  'chihuahua',
  'ciudad de mexico',
  'coahuila',
  'coahuila de zaragoza',
  'colima',
  'durango',
  'guanajuato',
  'guerrero',
  'hidalgo',
  'jalisco',
  'mexico',
  'michoacan',
  'michoacan de ocampo',
  'morelos',
  'nayarit',
  'nuevo leon',
  'oaxaca',
  'puebla',
  'queretaro',
  'queretaro de arteaga',
  'quintana roo',
  'san luis potosi',
  'sinaloa',
  'sonora',
  'tabasco',
  'tamaulipas',
  'tlaxcala',
  'veracruz',
  'veracruz de ignacio de la llave',
  'yucatan',
  'zacatecas',
]);

const MEXICAN_STATE_ALIASES = new Set(['cdmx', 'df', 'distrito federal', 'edomex', 'estado de mexico']);

export function stateImpliesMexico(state: string): boolean {
  const n = normalizeLocationToken(state);
  if (!n) return false;
  if (MEXICAN_STATE_NORM.has(n)) return true;
  if (MEXICAN_STATE_ALIASES.has(n)) return true;
  return false;
}

export function canonicalMexicoCountryForUi(lang: Language): string {
  if (lang === 'es') return 'México';
  if (lang === 'en') return 'Mexico';
  return 'Mexique';
}
