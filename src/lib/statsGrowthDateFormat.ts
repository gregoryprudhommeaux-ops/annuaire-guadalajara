import type { Language } from '@/types';

const LOCALE: Record<Language, string> = { fr: 'fr-FR', en: 'en-GB', es: 'es-MX' };

/**
 * Parse clé de jour `YYYY-MM-DD` (UTC-safe pour l’affichage local).
 */
export function parseStatsDayKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/**
 * Axe / ticks : "24 mars", "1 avr." (FR) — équivalents en EN/ES.
 */
export function formatGrowthAxisDate(dateKey: string, lang: Language): string {
  const d = parseStatsDayKey(dateKey);
  if (Number.isNaN(d.getTime())) return dateKey;
  const l = LOCALE[lang] ?? 'fr-FR';
  return d.toLocaleDateString(l, { day: 'numeric', month: 'short' });
}

/**
 * Tooltip : date longue lisible.
 */
export function formatGrowthTooltipDate(dateKey: string, lang: Language): string {
  const d = parseStatsDayKey(dateKey);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString(LOCALE[lang] ?? 'fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
