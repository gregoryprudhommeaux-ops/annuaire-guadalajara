import type { AppLanguage } from './types';
import { fr } from './locales/fr';
import { es } from './locales/es';
import { en } from './locales/en';

type WidenStrings<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly WidenStrings<U>[]
    : T extends object
      ? { [K in keyof T]: WidenStrings<T[K]> }
      : T;

export type Dictionary = WidenStrings<typeof fr>;

export const dictionaries: Record<AppLanguage, Dictionary> = {
  fr: fr as Dictionary,
  es: es as Dictionary,
  en: en as Dictionary,
};
