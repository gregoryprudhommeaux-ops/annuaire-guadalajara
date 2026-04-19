import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { format, startOfDay, subDays } from 'date-fns';
import { fr as frLocale, es as esLocale, enUS } from 'date-fns/locale';
import type { Language } from '@/types';

export type TimePeriod = 'today' | '7d' | '30d' | '90d' | 'all';

export interface TimePeriodContextType {
  period: TimePeriod;
  setPeriod: (p: TimePeriod) => void;
  /** null => all time */
  getDateFilter: () => Date | null;
  /** Plage affichée selon la locale UI (FR / ES / EN). */
  getPeriodLabel: () => string;
}

const Ctx = createContext<TimePeriodContextType | null>(null);

function dateFnsLocaleForUi(lang: Language | undefined) {
  if (lang === 'es') return esLocale;
  if (lang === 'en') return enUS;
  return frLocale;
}

export function TimePeriodProvider({
  children,
  defaultPeriod = '30d',
  uiLang,
}: {
  children: React.ReactNode;
  defaultPeriod?: TimePeriod;
  /** Langue de l’interface pour les libellés de dates (pills admin). */
  uiLang?: Language;
}) {
  const [period, setPeriod] = useState<TimePeriod>(defaultPeriod);

  const getDateFilter = useCallback((): Date | null => {
    const now = new Date();
    if (period === 'today') return startOfDay(now);
    if (period === '7d') return subDays(now, 7);
    if (period === '30d') return subDays(now, 30);
    if (period === '90d') return subDays(now, 90);
    return null;
  }, [period]);

  const getPeriodLabel = useCallback((): string => {
    const loc = dateFnsLocaleForUi(uiLang);
    const now = new Date();
    const start = getDateFilter();
    if (!start) return format(now, 'd MMMM yyyy', { locale: loc });
    return `${format(start, 'd MMMM yyyy', { locale: loc })} → ${format(now, 'd MMMM yyyy', { locale: loc })}`;
  }, [getDateFilter, uiLang]);

  const value = useMemo<TimePeriodContextType>(
    () => ({ period, setPeriod, getDateFilter, getPeriodLabel }),
    [period, getDateFilter, getPeriodLabel]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTimePeriod(): TimePeriodContextType {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTimePeriod must be used within TimePeriodProvider');
  return v;
}

