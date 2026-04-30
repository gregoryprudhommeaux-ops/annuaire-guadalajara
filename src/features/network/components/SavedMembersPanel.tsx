import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Bookmark, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 719px)');
    const apply = () => setCollapsed(mq.matches);
    apply();
    // Safari < 14 fallback
    if ('addEventListener' in mq) {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, []);

  return (
    <button
      type="button"
      className={cn(
        'network-saved-panel',
        active && 'network-saved-panel--active',
        disabled && 'opacity-55',
        className
      )}
      onClick={() => {
        if (disabled) {
          setCollapsed((v) => !v);
        } else {
          onClick();
        }
      }}
      aria-disabled={disabled}
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
          <span className="flex items-center gap-2">
            <span className="network-saved-panel__count">{count}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed((v) => !v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setCollapsed((v) => !v);
                }
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              aria-label={collapsed ? 'Déplier' : 'Replier'}
            >
              {collapsed ? <ChevronDown size={16} aria-hidden /> : <ChevronUp size={16} aria-hidden />}
            </span>
          </span>
        </span>
        {!collapsed ? <span className="network-saved-panel__description">{description}</span> : null}
      </span>
    </button>
  );
}
