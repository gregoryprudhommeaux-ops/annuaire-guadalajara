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
import { EN, EN_STRINGS } from './en';
import { ES } from './es';
import { FR } from './fr';

function stringAtNestedPath(root: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = root;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export type LanguageContextValue = {
  lang: Language;
  setLang: React.Dispatch<React.SetStateAction<Language>>;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('fr');

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: string) => {
      const row = TRANSLATIONS[key];
      if (row) {
        if (lang === 'en') return EN_STRINGS[key] ?? row.fr;
        return row[lang];
      }
      if (key.includes('.')) {
        const root =
          lang === 'en'
            ? (EN as Record<string, unknown>)
            : lang === 'es'
              ? (ES as Record<string, unknown>)
              : (FR as Record<string, unknown>);
        const nested = stringAtNestedPath(root, key);
        if (nested !== undefined) return nested;
      }
      return key;
    },
    [lang]
  );
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
