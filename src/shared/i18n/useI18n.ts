/**
 * Alias du contexte langue existant (`LanguageProvider`).
 * Évite un second état de langue : une seule source de vérité.
 */
export type { TranslateParams } from '@/i18n/LanguageProvider';
export { useLanguage as useI18n } from '@/i18n/LanguageProvider';
