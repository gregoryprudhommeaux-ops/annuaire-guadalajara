import { useLanguage } from '@/i18n/LanguageProvider';

export type NetworkSortMode = 'recent' | 'alphabetical' | 'default';

export type SortSelectProps = {
  id?: string;
  value: NetworkSortMode;
  onChange: (value: NetworkSortMode) => void;
  className?: string;
};

export function SortSelect({
  id = 'sort-members',
  value,
  onChange,
  className = 'network-select',
}: SortSelectProps) {
  const { t } = useLanguage();

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as NetworkSortMode)}
      className={className}
    >
      <option value="recent">{t('membersSortOptionRecent')}</option>
      <option value="alphabetical">{t('membersSortOptionAlphabetical')}</option>
      <option value="default">{t('membersSortOptionDefault')}</option>
    </select>
  );
}
