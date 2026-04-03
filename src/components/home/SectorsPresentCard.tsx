import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n/useTranslation';

export type SectorsPresentCardProps = {
  sectors: string[];
  className?: string;
};

/**
 * Secteurs déjà représentés — libellés localisés côté parent (ex. `activityCategoryLabel`).
 * Textes d’en-tête : `home.sectors.*` (decks FR / ES / EN).
 */
export function SectorsPresentCard({ sectors, className }: SectorsPresentCardProps) {
  const { t } = useTranslation();

  if (!sectors.length) return null;

  return (
    <section
      aria-labelledby="sectors-present-title"
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6',
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
        {t('home.sectors.eyebrow')}
      </p>
      <h2
        id="sectors-present-title"
        className="mt-2 text-lg font-semibold text-slate-900"
      >
        {t('home.sectors.title')}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{t('home.sectors.description')}</p>

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

export default SectorsPresentCard;
