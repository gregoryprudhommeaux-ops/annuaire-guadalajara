import type { ReactNode } from 'react';
import { useId } from 'react';
import { ArrowDownUp, Bookmark, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { NetworkSortMode } from './SortSelect';
import { SortSelect } from './SortSelect';
import '../results-toolbar.css';

export type ResultsToolbarProps = {
  /** Nombre de fiches affichées après filtres (grille). */
  totalCount: number;
  /** Ex. `GeoCitySelector` + bouton « Revenir à… » — laisser vide si absent. */
  locationSlot?: ReactNode;
  sortValue: NetworkSortMode;
  onSortChange: (value: NetworkSortMode) => void;
  sortSelectId?: string;
  savedCount: number;
  savedActive: boolean;
  onToggleSaved: () => void;
  savedTitle: string;
  savedDescription: string;
  className?: string;
};

export function ResultsToolbar({
  totalCount,
  locationSlot,
  sortValue,
  onSortChange,
  sortSelectId,
  savedCount,
  savedActive,
  onToggleSaved,
  savedTitle,
  savedDescription,
  className,
}: ResultsToolbarProps) {
  const { t } = useLanguage();
  const genId = useId();
  const sortId = sortSelectId ?? `results-toolbar-sort-${genId}`;
  const disabledSaved = savedCount === 0;

  return (
    <div className={cn('results-toolbar', className)}>
      <div className="results-toolbar__bar" role="region" aria-label={t('network.explorer.resultsToolbarAria')}>
        <div className="results-toolbar__countSlot">
          <span className="results-toolbar__count" aria-live="polite">
            {t('network.explorer.resultsCount', { count: totalCount })}
          </span>
        </div>

        {locationSlot ? <div className="results-toolbar__location">{locationSlot}</div> : null}

        <div className="results-toolbar__field results-toolbar__field--sort">
          <label htmlFor={sortId} className="results-toolbar__label">
            {t('membersSortLabel')}
          </label>
          <div className="results-toolbar__selectShell">
            <ArrowDownUp className="results-toolbar__selectLeadIcon" size={18} strokeWidth={2} aria-hidden />
            <SortSelect
              id={sortId}
              value={sortValue}
              onChange={onSortChange}
              className="results-toolbar__select"
            />
            <ChevronDown className="results-toolbar__selectChevron" size={18} strokeWidth={2} aria-hidden />
          </div>
        </div>

        <div className="results-toolbar__field results-toolbar__field--saved">
          <button
            type="button"
            className={cn(
              'results-toolbar__savedBtn',
              savedActive && 'results-toolbar__savedBtn--active',
              disabledSaved && 'results-toolbar__savedBtn--disabled'
            )}
            aria-pressed={savedActive}
            aria-disabled={disabledSaved}
            disabled={disabledSaved}
            aria-label={
              disabledSaved
                ? t('network.savedPanel.titleEmpty')
                : `${savedTitle} — ${t('network.savedPanel.openAria', { count: savedCount })}`
            }
            title={savedDescription}
            onClick={() => {
              if (disabledSaved) return;
              onToggleSaved();
            }}
          >
            <span className="results-toolbar__savedIconWrap" aria-hidden>
              <Bookmark className="results-toolbar__savedIcon" size={20} strokeWidth={2} />
            </span>
            <span className="results-toolbar__savedBadge" aria-hidden>
              {savedCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
