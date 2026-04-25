import React from 'react';
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import { cn } from '@/lib/cn';

type TFn = (key: string, params?: Record<string, string | number>) => string;

type Props = { t: TFn };

export function AdminPeriodPills({ t }: Props) {
  const { period, setPeriod, getPeriodLabel } = useTimePeriod();
  const items: Array<{ key: typeof period; labelKey: string }> = [
    { key: 'today', labelKey: 'adminTimePeriodToday' },
    { key: '7d', labelKey: 'adminTimePeriod7d' },
    { key: '30d', labelKey: 'adminTimePeriod30d' },
    { key: '90d', labelKey: 'adminTimePeriod90d' },
    { key: 'all', labelKey: 'adminTimePeriodAll' },
  ];
  return (
    <div className="admin-toolbar" aria-label={t('adminTimeToolbarAria')}>
      <div className="admin-period">
        <div className="admin-period__pills" role="group" aria-label={t('adminTimePeriodGroupAria')}>
          {items.map((p) => (
            <button
              key={p.key}
              type="button"
              className={cn('admin-pill', p.key === period && 'is-active')}
              onClick={() => setPeriod(p.key)}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
        <span className="admin-period__range" aria-label={t('adminTimeSelectedAria')}>
          {getPeriodLabel()}
        </span>
      </div>
    </div>
  );
}
