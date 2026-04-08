import type { Language } from '../types';

export function uiLocale(lang: Language): string {
  if (lang === 'fr') return 'fr-FR';
  if (lang === 'es') return 'es-MX';
  return 'en-US';
}

/** Chaîne selon la langue UI (hors objet `TRANSLATIONS`). */
export function pickLang(fr: string, es: string, en: string, lang: Language): string {
  if (lang === 'fr') return fr;
  if (lang === 'es') return es;
  return en;
}

/** Pour `localeCompare` / tri cohérent avec la langue UI. */
export function sortLocale(lang: Language): string {
  if (lang === 'fr') return 'fr';
  if (lang === 'es') return 'es';
  return 'en';
}

/** Horodatage profil (`lastSeen` ms) pour affichage admin uniquement. */
export function formatProfileLastSeen(ts: number | undefined, lang: Language): string | null {
  if (ts === undefined || ts === null || !Number.isFinite(ts) || ts <= 0) return null;
  return new Intl.DateTimeFormat(uiLocale(lang), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(ts));
}
