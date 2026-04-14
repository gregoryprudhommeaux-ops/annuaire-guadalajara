import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { ACTIVITY_CATEGORIES, activityCategoryLabel } from '../../constants';
import type { Language } from '../../types';
import type { LocationFilterKey, ProfileTypeFilterKey } from '../../lib/directoryFilters';
import { cardPad } from '../../lib/pageLayout';
import { cn } from '../../cn';

type TFn = (key: string) => string;

type Props = {
  lang: Language;
  t: TFn;
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (v: string) => void;
  filterProfileType: ProfileTypeFilterKey;
  onFilterProfileTypeChange: (v: ProfileTypeFilterKey) => void;
  filterLocation: LocationFilterKey;
  onFilterLocationChange: (v: LocationFilterKey) => void;
  onSearchSubmit: () => void;
  onClearFilters: () => void;
  onRandomProfile: () => void;
  randomDisabled: boolean;
  showClearFilters: boolean;
  /** Masquer le bouton « contact à rencontrer » (ex. bloc centré onglet Secteurs — bouton reste dans la colonne gauche). */
  hideRandomButton?: boolean;
  /** Fusionné sur la `<section>` racine (ex. variante embarquée dans la colonne `/network`). */
  className?: string;
};

const randomBtnClass = cn(
  'random-profile-button flex min-h-[44px] w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors',
  'hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
  'disabled:pointer-events-none disabled:opacity-40'
);

const selectClass =
  'h-11 min-h-[44px] w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-shadow focus:ring-2 focus:ring-blue-700 focus:ring-offset-0';

const searchComboInputClass =
  'h-11 min-h-[44px] w-full min-w-0 border-0 bg-transparent py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400';

/** Bouton isolé pour la colonne gauche quand le bloc recherche est affiché au centre (onglet Secteurs). */
export function DirectoryRandomProfileButton({
  t,
  onRandomProfile,
  randomDisabled,
}: {
  t: TFn;
  onRandomProfile: () => void;
  randomDisabled: boolean;
}) {
  return (
    <button type="button" onClick={onRandomProfile} disabled={randomDisabled} className={randomBtnClass}>
      {randomDisabled ? t('randomProfileEmpty') : t('randomProfileSuggest')}
    </button>
  );
}

/** Bloc recherche + filtres (structure sémantique type landing : section / header / barre / astuce). */
export default function SearchBlock({
  lang,
  t,
  searchTerm,
  onSearchTermChange,
  filterCategory,
  onFilterCategoryChange,
  filterProfileType,
  onFilterProfileTypeChange,
  filterLocation,
  onFilterLocationChange,
  onSearchSubmit,
  onClearFilters,
  onRandomProfile,
  randomDisabled,
  showClearFilters,
  hideRandomButton = false,
  className,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // If there are active filters/search, expand on mobile so users see what’s applied.
    if (showClearFilters) setMobileOpen(true);
  }, [showClearFilters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <section
      className={cn(
        'search-section min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm',
        cardPad,
        className
      )}
    >
      <header className="search-header mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2 className="hyphens-auto break-words text-base font-bold tracking-tight text-slate-800 sm:text-lg">
            {t('searchBlockTitle')}
          </h2>
          <p className="text-sm leading-snug text-slate-600">{t('searchBlockSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            'mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full p-2 text-slate-500 transition-colors sm:hidden',
            'hover:bg-slate-200/60 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
          )}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? t('close') : t('searchButton')}
        >
          {mobileOpen ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
        </button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="search-bar space-y-3">
          <div
            className={cn(
              'flex min-h-[44px] w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm',
              'transition-shadow focus-within:ring-2 focus-within:ring-blue-700 focus-within:ring-offset-0'
            )}
          >
            <div className="relative flex min-w-0 flex-1 items-center">
              <Search
                className="pointer-events-none absolute left-3 h-4 w-4 shrink-0 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                placeholder={t('searchDirectoryPlaceholderExamples')}
                aria-label={t('searchDirectoryPlaceholder')}
                className={searchComboInputClass}
              />
            </div>
            <button
              type="submit"
              className={cn(
                'btn-primary shrink-0 border-l border-blue-800/30 bg-blue-700 px-4 text-sm font-semibold text-white transition-colors sm:px-6',
                'hover:bg-blue-800 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-700'
              )}
            >
              {t('searchButton')}
            </button>
          </div>

          <div
            className={cn(
              'search-filters grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3',
              !mobileOpen && 'hidden sm:grid'
            )}
          >
            <select
              id="filter-sector"
              value={filterCategory}
              onChange={(e) => onFilterCategoryChange(e.target.value)}
              className={selectClass}
              aria-label={t('filterSectorLabel')}
            >
              <option value="">{t('filterSectorDefault')}</option>
              {ACTIVITY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {activityCategoryLabel(c, lang)}
                </option>
              ))}
            </select>
            <select
              id="filter-profile-type"
              value={filterProfileType}
              onChange={(e) => onFilterProfileTypeChange(e.target.value as ProfileTypeFilterKey)}
              className={selectClass}
              aria-label={t('filterTypeLabel')}
            >
              <option value="">{t('filterTypeDefault')}</option>
              <option value="company">{t('filterTypeCompany')}</option>
              <option value="member">{t('filterTypeMember')}</option>
            </select>
            <select
              id="filter-location"
              value={filterLocation}
              onChange={(e) => onFilterLocationChange(e.target.value as LocationFilterKey)}
              className={selectClass}
              aria-label={t('filterLocationLabel')}
            >
              <option value="">{t('filterLocationDefault')}</option>
              <option value="guadalajara">{t('filterLocationGuadalajara')}</option>
              <option value="zapopan">{t('filterLocationZapopan')}</option>
              <option value="other">{t('filterLocationOther')}</option>
            </select>
          </div>
        </div>

        {showClearFilters && (
          <div className="flex justify-start sm:justify-end">
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              {t('clearFilters')}
            </button>
          </div>
        )}

        {!hideRandomButton && (
          <div className="space-y-2">
            <p className="search-helper text-xs leading-relaxed text-slate-500">{t('searchHelperTip')}</p>
            <div className={cn(!mobileOpen && 'hidden sm:block')}>
              <DirectoryRandomProfileButton
                t={t}
                onRandomProfile={onRandomProfile}
                randomDisabled={randomDisabled}
              />
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
