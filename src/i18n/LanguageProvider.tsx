import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { EN_STRINGS } from './en';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { getNestedString, interpolate } from '@/shared/i18n/nested';

export type TranslateParams = Record<string, string | number>;

export type LanguageContextValue = {
  lang: Language;
  setLang: React.Dispatch<React.SetStateAction<Language>>;
  /** Clés plates (`login`) ou imbriquées (`home.marketing.heroTitle`) ; interpolation optionnelle. */
  t: (key: string, params?: TranslateParams) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const LANG_STORAGE_KEY = 'fn.lang';

function isLanguage(value: unknown): value is Language {
  return value === 'fr' || value === 'es' || value === 'en';
}

function readStoredLanguage(): Language | null {
  try {
    const v = window.localStorage.getItem(LANG_STORAGE_KEY);
    return isLanguage(v) ? v : null;
  } catch {
    return null;
  }
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'fr';
    return readStoredLanguage() ?? 'fr';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore (private mode / disabled storage)
    }
  }, [lang]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LANG_STORAGE_KEY) return;
      if (isLanguage(e.newValue) && e.newValue !== lang) setLang(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [lang]);

  const t = useCallback(
    (key: string, params?: TranslateParams) => {
      const dict = dictionaries[lang] as Record<string, unknown>;
      const dictFr = dictionaries.fr as Record<string, unknown>;

      if (key.includes('.')) {
        const primary = getNestedString(dict, key);
        const fallback = getNestedString(dictFr, key);
        const nested = primary ?? fallback;
        if (nested !== undefined) {
          if (import.meta.env.DEV && primary === undefined && fallback !== undefined) {
            console.warn(`[i18n] Missing "${key}" for locale "${lang}" — using French fallback`);
          }
          return interpolate(nested, params);
        }
        if (import.meta.env.DEV) {
          console.warn(`[i18n] Missing nested key: ${key}`);
        }
      }

      const row = TRANSLATIONS[key];
      if (row) {
        const text =
          lang === 'fr'
            ? row.fr
            : lang === 'es'
              ? row.es
              : row.en ?? EN_STRINGS[key] ?? row.fr;
        return interpolate(text, params);
      }

      if (lang === 'en') {
        const flat = EN_STRINGS[key];
        if (flat) return interpolate(flat, params);
      }

      return interpolate(key, params);
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
