import { useLanguage } from '@/i18n/LanguageProvider';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SavedMembersPanelProps = {
  title: string;
  count: number;
  description: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
};

export function SavedMembersPanel({
  title,
  count,
  description,
  onClick,
  active = false,
  className,
}: SavedMembersPanelProps) {
  const { t } = useLanguage();
  const disabled = count === 0;

  return (
    <button
      type="button"
      className={cn('network-saved-panel', active && 'network-saved-panel--active', className)}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={
        disabled
          ? t('network.savedPanel.titleEmpty')
          : t('network.savedPanel.openAria', { count })
      }
    >
      <span className="network-saved-panel__iconWrap" aria-hidden>
        <Bookmark size={20} className="network-saved-panel__icon" strokeWidth={2} />
      </span>
      <span className="network-saved-panel__body">
        <span className="network-saved-panel__titleRow">
          <span className="network-saved-panel__title">{title}</span>
          <span className="network-saved-panel__count">{count}</span>
        </span>
        <span className="network-saved-panel__description">{description}</span>
      </span>
    </button>
  );
}
