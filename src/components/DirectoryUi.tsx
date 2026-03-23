/**
 * Blocs UI annuaire : fun fact sombre, actions opportunités, barre d’onglets (fond slate-100).
 */

import React from 'react';
import { cn } from '../cn';

// ─── 1. Fun fact réseau ───

export const FunFactBlock: React.FC<{
  text: string;
  /** Titre du bloc (i18n), même gabarit que le titre « lancement » (text-sm font-semibold) */
  badgeLabel?: string;
  className?: string;
  /** Ex. bouton replier sur mobile */
  headerRight?: React.ReactNode;
  /** Classes pour le paragraphe (ex. line-clamp) */
  bodyClassName?: string;
  /** Pour aria-controls sur le bouton replier */
  bodyId?: string;
  /** Id stable pour aria-labelledby (évite doublons si plusieurs blocs) */
  titleId?: string;
}> = ({
  text,
  badgeLabel = '✨ Fun fact du réseau',
  className,
  headerRight,
  bodyClassName,
  bodyId,
  titleId = 'home-fun-fact-title',
}) => (
  <div className={cn('rounded-xl bg-slate-900 px-4 py-4', className)}>
    <div className="mb-2 flex items-start justify-between gap-3">
      <h2
        id={titleId}
        className="min-w-0 flex-1 text-sm font-semibold leading-snug tracking-normal text-white break-words hyphens-auto"
      >
        {badgeLabel}
      </h2>
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
  <div className={cn('mt-3 flex gap-2 items-stretch', className)}>
    <button
      type="button"
      onClick={onSeeAll}
      className={cn(
        'flex min-h-0 flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 py-2 text-center text-[11px] font-medium leading-snug text-slate-700 transition-colors',
        'break-words hyphens-auto',
        'hover:border-slate-400 hover:bg-slate-100',
        'sm:h-10 sm:px-3 sm:py-0 sm:text-sm sm:leading-normal'
      )}
    >
      {seeAllLabel}
    </button>
    <button
      type="button"
      onClick={onPost}
      className={cn(
        'flex min-h-0 flex-1 items-center justify-center rounded-lg bg-blue-600 px-2 py-2 text-center text-[11px] font-medium leading-snug text-white transition-colors',
        'break-words hyphens-auto',
        'hover:bg-blue-700',
        'sm:h-10 sm:px-3 sm:py-0 sm:text-sm sm:leading-normal'
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
