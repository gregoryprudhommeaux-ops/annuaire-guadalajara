import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n/useTranslation';

export type WhyJoinSectionProps = {
  className?: string;
};

/**
 * Bloc « pourquoi rejoindre » — clés imbriquées `home.whyJoin.*` (decks FR / ES / EN).
 */
export function WhyJoinSection({ className }: WhyJoinSectionProps) {
  const { t } = useTranslation();

  const items = useMemo(
    () => [
      {
        id: '1',
        title: t('home.whyJoin.item1Title'),
        description: t('home.whyJoin.item1Description'),
      },
      {
        id: '2',
        title: t('home.whyJoin.item2Title'),
        description: t('home.whyJoin.item2Description'),
      },
      {
        id: '3',
        title: t('home.whyJoin.item3Title'),
        description: t('home.whyJoin.item3Description'),
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
          {t('home.whyJoin.eyebrow')}
        </p>
        <h2
          id="why-join-title"
          className="mt-2 text-xl font-semibold tracking-tight text-slate-900"
        >
          {t('home.whyJoin.title')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t('home.whyJoin.description')}</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
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
