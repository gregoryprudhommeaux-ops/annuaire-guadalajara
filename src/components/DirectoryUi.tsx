/**
 * Blocs UI annuaire : fun fact sombre, actions opportunités, barre d’onglets (fond slate-100).
 */

import React from 'react';
import { cn } from '../cn';

// ─── 1. Fun fact réseau ───

export const FunFactBlock: React.FC<{
  text: string;
  /** Libellé du badge (i18n) */
  badgeLabel?: string;
  className?: string;
  /** Ex. bouton replier sur mobile */
  headerRight?: React.ReactNode;
  /** Classes pour le paragraphe (ex. line-clamp) */
  bodyClassName?: string;
  /** Pour aria-controls sur le bouton replier */
  bodyId?: string;
}> = ({
  text,
  badgeLabel = 'Fun fact du réseau',
  className,
  headerRight,
  bodyClassName,
  bodyId,
}) => (
  <div className={cn('space-y-2 rounded-xl bg-slate-900 px-4 py-4', className)}>
    <div className="flex items-start justify-between gap-2">
      <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
        {badgeLabel}
      </span>
      {headerRight}
    </div>
    <p id={bodyId} className={cn('text-sm leading-relaxed text-slate-200', bodyClassName)}>
      {text}
    </p>
  </div>
);

// ─── 2. Opportunités : deux boutons même hauteur ───

export const OpportunityActions: React.FC<{
  onSeeAll?: () => void;
  onPost?: () => void;
  seeAllLabel?: string;
  postLabel?: string;
  className?: string;
}> = ({
  onSeeAll,
  onPost,
  seeAllLabel = 'Toutes les opportunités',
  postLabel = 'Poster une opportunité',
  className,
}) => (
  <div className={cn('mt-3 flex gap-2', className)}>
    <button
      type="button"
      onClick={onSeeAll}
      className={cn(
        'h-10 flex-1 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 transition-colors',
        'hover:border-slate-400 hover:bg-slate-100'
      )}
    >
      {seeAllLabel}
    </button>
    <button
      type="button"
      onClick={onPost}
      className={cn(
        'h-10 flex-1 rounded-lg bg-blue-600 text-sm font-medium text-white transition-colors',
        'hover:bg-blue-700'
      )}
    >
      {postLabel}
    </button>
  </div>
);

// ─── 3. Onglets listing ───

export type DirectoryTabItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

export type DirectoryTabBarProps = {
  tabs: DirectoryTabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
};

/** Barre d’onglets listing (alias : `TabBar`). */
export const DirectoryTabBar: React.FC<DirectoryTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => (
  <div
    className={cn(
      'flex min-w-0 flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 sm:flex-nowrap',
      className
    )}
  >
    {tabs.map((tab) => {
      const isActive = tab.id === activeTab;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex min-w-0 flex-1 basis-[calc(50%-2px)] items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-center text-[11px] font-semibold transition-colors sm:basis-auto sm:text-sm',
            isActive
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
          )}
          aria-pressed={isActive}
        >
          <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4" aria-hidden>
            {tab.icon}
          </span>
          <span className="min-w-0 truncate leading-tight">{tab.label}</span>
        </button>
      );
    })}
  </div>
);

/** Alias nom court (spec design). */
export { DirectoryTabBar as TabBar };
