import React from 'react';
import { cn } from '../../cn';

type TFn = (key: string) => string;

export type SectorsProofSectionProps = {
  sectors: string[];
  t: TFn;
  className?: string;
};

/**
 * Preuve sociale secteurs — libellés déjà localisés (ex. `activityCategoryLabel`).
 * Clés `sectorsProof*` dans `TRANSLATIONS` / `EN_STRINGS`.
 */
export function SectorsProofSection({ sectors, t, className }: SectorsProofSectionProps) {
  if (!sectors.length) return null;

  return (
    <section
      aria-labelledby="sectors-proof-title"
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6',
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
        {t('sectorsProofEyebrow')}
      </p>
      <h2 id="sectors-proof-title" className="mt-2 text-lg font-semibold text-slate-900">
        {t('sectorsProofTitle')}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{t('sectorsProofDescription')}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {sectors.map((sector, index) => (
          <span
            key={`${index}-${sector}`}
            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
          >
            {sector}
          </span>
        ))}
      </div>
    </section>
  );
}

export default SectorsProofSection;
