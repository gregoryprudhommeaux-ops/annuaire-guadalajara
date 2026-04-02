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
      if (!row) return key;
      if (lang === 'en') return EN_STRINGS[key] ?? row.fr;
      return row[lang];
    },
    [lang]
  );
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
