import type { Language } from '../types';

/** Langue par défaut pour les communications internes (emails). */
export const DEFAULT_COMMUNICATION_LANGUAGE: Language = 'es';

const STORAGE_KEY = 'fn:pendingCommunicationLanguage';

/** Liste exhaustive des langues acceptées pour les emails. */
export const COMMUNICATION_LANGUAGES: {
  code: Language;
  label: string;
  flag: string;
}[] = [
  { code: 'es', label: 'Español', flag: '🇲🇽' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

function isLanguage(value: unknown): value is Language {
  return value === 'fr' || value === 'es' || value === 'en';
}

/**
 * Préférence saisie au moment de l'inscription (avant que le doc `users/{uid}`
 * existe). Consommée au premier enregistrement de profil dans `App.tsx`.
 */
export function setPendingCommunicationLanguage(lang: Language): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* localStorage indisponible : on ignore, fallback ES côté server. */
  }
}

export function getPendingCommunicationLanguage(): Language | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(v) ? v : null;
  } catch {
    return null;
  }
}

export function clearPendingCommunicationLanguage(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/**
 * Renvoie la langue effective pour un profil. Garantit toujours une valeur
 * `Language` valide même si le champ est absent ou corrompu.
 */
export function resolveCommunicationLanguage(
  value: unknown,
  fallback: Language = DEFAULT_COMMUNICATION_LANGUAGE
): Language {
  return isLanguage(value) ? value : fallback;
}
