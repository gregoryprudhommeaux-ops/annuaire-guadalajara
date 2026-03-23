import React from 'react';
import { Search } from 'lucide-react';
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
  /** Masquer « Découvrir un profil au hasard » (ex. bloc centré onglet Secteurs — bouton reste dans la colonne gauche). */
  hideRandomButton?: boolean;
};

const randomBtnClass =
  'flex min-h-[44px] w-full items-center justify-center rounded-lg border border-slate-300 bg-transparent px-4 text-sm font-medium text-slate-700 transition-colors hover:border-blue-700 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40';

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
      {randomDisabled ? t('randomProfileEmpty') : t('randomProfile')}
    </button>
  );
}

const selectClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-shadow focus:ring-2 focus:ring-blue-700 focus:ring-offset-0';

/** [SEARCH] Bloc recherche + filtres (colonne annuaire). */
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
}: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <div
      className={cn(
        'min-w-0 rounded-xl border border-slate-200 bg-slate-50/95 shadow-sm',
        cardPad
      )}
    >
      {/* [SEARCH] Titre du bloc */}
      <h2 className="mb-4 hyphens-auto break-words text-sm font-semibold text-slate-700">
        {t('searchBlockTitle')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* [SEARCH] Ligne 1 - Input + bouton */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0">
          <div className="relative min-w-0 flex-1 sm:flex sm:min-h-[44px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400"
              size={18}
              aria-hidden
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder={t('searchDirectoryPlaceholder')}
              aria-label={t('searchDirectoryPlaceholder')}
              className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition-shadow focus:ring-2 focus:ring-blue-700 sm:min-h-0 sm:rounded-r-none sm:border-r-0 sm:py-2"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] shrink-0 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-800 sm:rounded-l-none sm:px-4"
          >
            {t('searchButton')}
          </button>
        </div>

        {/* [SEARCH] Ligne 2 - Filtres (sans titres : le libellé visible = 1re option) */}
        <div className="flex flex-col gap-2 md:flex-row md:gap-2">
          <div className="min-w-0 flex-1">
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
          </div>
          <div className="min-w-0 flex-1">
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
          </div>
          <div className="min-w-0 flex-1">
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

        {/* [SEARCH] Effacer les filtres */}
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

        {/* [SEARCH] Découvrir un profil au hasard */}
        {!hideRandomButton && (
          <DirectoryRandomProfileButton
            t={t}
            onRandomProfile={onRandomProfile}
            randomDisabled={randomDisabled}
          />
        )}
      </form>
    </div>
  );
}
