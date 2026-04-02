import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/cn';

export type ProfileEmptyStateKind = 'needs' | 'help' | 'generic';

export type ProfileEmptyStateProps = {
  kind: ProfileEmptyStateKind;
  className?: string;
};

/**
 * État vide pour une zone de fiche membre — clés plates `memberCardEmpty*`
 * (aligné sur `memberCard.empty` dans les decks `fr` / `es` / `EN`).
 */
export function ProfileEmptyState({ kind, className }: ProfileEmptyStateProps) {
  const { t } = useTranslation();

  const text =
    kind === 'needs'
      ? t('memberCardEmptyNeeds')
      : kind === 'help'
        ? t('memberCardEmptyHelp')
        : t('memberCardEmptyGeneric');

  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3',
        className
      )}
    >
      <p className="text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

export default ProfileEmptyState;
