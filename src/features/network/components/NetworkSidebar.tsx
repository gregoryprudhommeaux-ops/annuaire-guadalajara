import { useLanguage } from '@/i18n/LanguageProvider';
import { cn } from '@/lib/cn';
import { LaunchProgressCard } from './LaunchProgressCard';
import '../network.css';

export type NetworkOption = {
  label: string;
  value: string;
};

export type NetworkSidebarLaunchProgress = {
  currentCount: number;
  targetCount: number;
  inviteUrl?: string;
  whatsappUrl?: string;
  emailUrl?: string;
  defaultOpen?: boolean;
} | null;

export type NetworkSidebarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitSearch: () => void;
  sectorOptions: NetworkOption[];
  profileOptions: NetworkOption[];
  locationOptions: NetworkOption[];
  selectedSector: string;
  selectedProfile: string;
  selectedLocation: string;
  onSectorChange: (value: string) => void;
  onProfileChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSuggestContact: () => void;
  suggestContactDisabled?: boolean;
  showClearFilters?: boolean;
  onClearFilters?: () => void;
  launchProgress?: NetworkSidebarLaunchProgress;
  className?: string;
};

export function NetworkSidebar({
  query,
  onQueryChange,
  onSubmitSearch,
  sectorOptions,
  profileOptions,
  locationOptions,
  selectedSector,
  selectedProfile,
  selectedLocation,
  onSectorChange,
  onProfileChange,
  onLocationChange,
  onSuggestContact,
  suggestContactDisabled = false,
  showClearFilters = false,
  onClearFilters,
  launchProgress,
  className,
}: NetworkSidebarProps) {
  const { t } = useLanguage();

  const searchEyebrow = t('network.search.eyebrow');
  const searchAria = t('network.search.memberCompanyNeedAria');

  return (
    <aside className={cn('network-sidebar', className)}>
      <section className="network-panel network-search-panel">
        <div className="network-panel__header">
          <p className="network-panel__eyebrow">{searchEyebrow}</p>
          <h2 className="network-panel__title">{t('searchBlockTitle')}</h2>
          <p className="network-panel__text">{t('searchBlockSubtitle')}</p>
        </div>

        <form
          className="network-search-panel__form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitSearch();
          }}
        >
          <div className="network-search-panel__searchRow">
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="network-input"
              placeholder={t('searchDirectoryPlaceholderExamples')}
              aria-label={searchAria}
            />
            <button type="submit" className="network-primary-btn">
              {t('searchButton')}
            </button>
          </div>
        </form>

        <div className="network-search-panel__filters">
          <select
            value={selectedSector}
            onChange={(e) => onSectorChange(e.target.value)}
            className="network-select"
            aria-label={t('filterSectorLabel')}
          >
            {sectorOptions.map((option) => (
              <option key={option.value || '__all-sector'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={selectedProfile}
            onChange={(e) => onProfileChange(e.target.value)}
            className="network-select"
            aria-label={t('filterTypeLabel')}
          >
            {profileOptions.map((option) => (
              <option key={option.value || '__all-profile'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="network-select"
            aria-label={t('filterLocationLabel')}
          >
            {locationOptions.map((option) => (
              <option key={option.value || '__all-loc'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <p className="network-search-panel__tip">{t('searchHelperTip')}</p>

        {showClearFilters && onClearFilters ? (
          <button type="button" className="network-clear-filters" onClick={onClearFilters}>
            {t('clearFilters')}
          </button>
        ) : null}

        <button
          type="button"
          className="network-secondary-btn"
          onClick={onSuggestContact}
          disabled={suggestContactDisabled}
        >
          {suggestContactDisabled ? t('randomProfileEmpty') : t('randomProfileSuggest')}
        </button>
      </section>

      {launchProgress ? (
        <LaunchProgressCard
          currentCount={launchProgress.currentCount}
          targetCount={launchProgress.targetCount}
          inviteUrl={launchProgress.inviteUrl}
          whatsappUrl={launchProgress.whatsappUrl}
          emailUrl={launchProgress.emailUrl}
          defaultOpen={launchProgress.defaultOpen ?? false}
        />
      ) : null}
    </aside>
  );
}
