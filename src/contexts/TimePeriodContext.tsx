import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { format, startOfDay, subDays } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';

export type TimePeriod = 'today' | '7d' | '30d' | '90d' | 'all';

export interface TimePeriodContextType {
  period: TimePeriod;
  setPeriod: (p: TimePeriod) => void;
  /** null => all time */
  getDateFilter: () => Date | null;
  /** Ex: "15 mars 2026 → 14 avril 2026" */
  getPeriodLabel: () => string;
}

const Ctx = createContext<TimePeriodContextType | null>(null);

export function TimePeriodProvider({
  children,
  defaultPeriod = '30d',
}: {
  children: React.ReactNode;
  defaultPeriod?: TimePeriod;
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
    const now = new Date();
    const start = getDateFilter();
    if (!start) return format(now, 'd MMMM yyyy', { locale: frLocale });
    return `${format(start, 'd MMMM yyyy', { locale: frLocale })} → ${format(now, 'd MMMM yyyy', { locale: frLocale })}`;
  }, [getDateFilter]);

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

