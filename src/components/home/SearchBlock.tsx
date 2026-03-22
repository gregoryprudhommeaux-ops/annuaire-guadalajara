import React from 'react';
import { Search } from 'lucide-react';
import { ACTIVITY_CATEGORIES, activityCategoryLabel } from '../../constants';
import type { Language } from '../../types';
import type { LocationFilterKey, ProfileTypeFilterKey } from '../../lib/directoryFilters';

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
};

const selectClass =
  'h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none transition-shadow focus:ring-2 focus:ring-blue-600 focus:ring-offset-0';

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
}: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-[#F7F7F9] p-4 shadow-sm lg:p-5">
      {/* [SEARCH] Titre du bloc */}
      <h2 className="mb-4 hyphens-auto text-sm font-semibold text-gray-700 break-words">
        {t('searchBlockTitle')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* [SEARCH] Ligne 1 - Input + bouton */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0">
          <div className="relative min-w-0 flex-1 sm:flex sm:min-h-[44px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400"
              size={18}
              aria-hidden
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder={t('searchDirectoryPlaceholder')}
              aria-label={t('searchDirectoryPlaceholder')}
              className="min-h-[44px] w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none transition-shadow focus:ring-2 focus:ring-blue-600 sm:min-h-0 sm:rounded-r-none sm:border-r-0 sm:py-2"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] shrink-0 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:rounded-l-none sm:px-4"
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
              <option value="centro">{t('filterLocationCentro')}</option>
              <option value="zapopan">{t('filterLocationZapopan')}</option>
              <option value="providencia">{t('filterLocationProvidencia')}</option>
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
              className="text-xs text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
            >
              {t('clearFilters')}
            </button>
          </div>
        )}

        {/* [SEARCH] Découvrir un profil au hasard */}
        <button
          type="button"
          onClick={onRandomProfile}
          disabled={randomDisabled}
          className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-gray-300 bg-transparent px-4 text-sm font-medium text-gray-700 transition-colors hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {randomDisabled ? t('randomProfileEmpty') : t('randomProfile')}
        </button>
      </form>
    </div>
  );
}
