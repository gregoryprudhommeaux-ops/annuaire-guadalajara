import React, { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n/useTranslation';

type BenefitItem = {
  key: string;
  title: string;
  description: string;
};

export type WhyJoinSectionProps = {
  className?: string;
};

/**
 * Bloc « pourquoi rejoindre » — clés plates `whyJoin*` dans `TRANSLATIONS` / `EN_STRINGS`
 * (équivalent logique de `home.whyJoin` dans les decks `fr` / `es` / `EN`).
 */
export function WhyJoinSection({ className }: WhyJoinSectionProps) {
  const { t } = useTranslation();

  const items = useMemo<BenefitItem[]>(
    () => [
      {
        key: '1',
        title: t('whyJoinItem1Title'),
        description: t('whyJoinItem1Description'),
      },
      {
        key: '2',
        title: t('whyJoinItem2Title'),
        description: t('whyJoinItem2Description'),
      },
      {
        key: '3',
        title: t('whyJoinItem3Title'),
        description: t('whyJoinItem3Description'),
      },
    ],
    [t]
  );

  return (
    <section
      aria-labelledby="why-join-title"
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6',
        className
      )}
    >
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          {t('whyJoinEyebrow')}
        </p>
        <h2
          id="why-join-title"
          className="mt-2 text-xl font-semibold tracking-tight text-slate-900"
        >
          {t('whyJoinTitle')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t('whyJoinDescription')}</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default WhyJoinSection;
