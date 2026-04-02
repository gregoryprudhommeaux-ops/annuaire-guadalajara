import React from 'react';
import { cn } from '../../cn';
import { FIRST_50_MEMBER_TARGET } from '../../constants';

type TFn = (key: string) => string;

export type First50BannerProps = {
  t: TFn;
  currentCount?: number;
  targetCount?: number;
  className?: string;
};

/**
 * Bandeau objectif « premiers membres » — textes `first50*` dans `TRANSLATIONS` / `EN_STRINGS`.
 */
export function First50Banner({
  t,
  currentCount = 0,
  targetCount = FIRST_50_MEMBER_TARGET,
  className,
}: First50BannerProps) {
  const safeTarget = Math.max(1, targetCount);
  const safeCurrent = Math.max(0, Math.min(currentCount, safeTarget));
  const percent = Math.round((safeCurrent / safeTarget) * 100);

  return (
    <section
      className={cn(
        'rounded-2xl border border-teal-200 bg-teal-50 p-5 sm:p-6',
        className
      )}
      aria-labelledby="first-50-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            {t('first50Eyebrow')}
          </p>
          <h2
            id="first-50-title"
            className="mt-2 text-xl font-semibold tracking-tight text-slate-900"
          >
            {t('first50Title')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">{t('first50Description')}</p>
        </div>

        <div className="min-w-[180px] rounded-xl border border-teal-200 bg-white px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-slate-600">{t('first50ProgressLabel')}</span>
            <span className="text-lg font-semibold text-slate-900">
              {safeCurrent}/{safeTarget}
            </span>
          </div>
          <div
            className="mt-3 h-2 rounded-full bg-teal-100"
            role="progressbar"
            aria-valuenow={safeCurrent}
            aria-valuemin={0}
            aria-valuemax={safeTarget}
            aria-label={t('first50ProgressLabel')}
          >
            <div
              className="h-2 rounded-full bg-teal-600 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default First50Banner;
