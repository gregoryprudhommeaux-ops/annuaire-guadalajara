import type { AppLanguage } from './types';
import { fr } from './locales/fr';
import { es } from './locales/es';
import { en } from './locales/en';

export const dictionaries: Record<AppLanguage, typeof fr> = {
  fr,
  es,
  en,
};
