import React from 'react';
import { DirectoryTabBar, type DirectoryTabBarProps } from '../DirectoryUi';
import { cn } from '../../cn';

export type DirectoryTabsSectionProps = DirectoryTabBarProps & {
  children: React.ReactNode;
  /** Classes du conteneur sticky (fond, z-index). */
  stickyWrapClassName?: string;
};

/**
 * Barre d’onglets annuaire + zone de contenu (listings par `viewMode`).
 */
export function DirectoryTabsSection({
  tabs,
  activeTab,
  onTabChange,
  className,
  stickyWrapClassName,
  children,
}: DirectoryTabsSectionProps) {
  return (
    <>
      <div
        className={cn(
          'sticky top-24 z-40 w-full min-w-0 bg-slate-50 py-2 sm:top-16',
          stickyWrapClassName
        )}
      >
        <DirectoryTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          className={className}
        />
      </div>
      <div className="w-full min-w-0 space-y-6">{children}</div>
    </>
  );
}

export default DirectoryTabsSection;
