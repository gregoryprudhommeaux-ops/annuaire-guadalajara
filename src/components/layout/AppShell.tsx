import React from 'react';
import type { BottomNavItem } from '@/components/layout/BottomNav';
import { BottomNav } from '@/components/layout/BottomNav';
import type { AppHeaderProps } from '@/components/layout/AppHeader';
import { AppHeader } from '@/components/layout/AppHeader';
import { cn } from '@/lib/cn';

type BaseShellProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Simple API (preferred): pass auth state, header stays compact. */
export type AppShellSimpleProps = BaseShellProps & {
  isLoggedIn?: boolean;
  headerRightSlot?: React.ReactNode;
};

/** Advanced API (compat): fully configure header + bottom nav. */
export type AppShellAdvancedProps = BaseShellProps & {
  header: AppHeaderProps;
  showBottomNav?: boolean;
  bottomNavItems?: BottomNavItem[];
};

export type AppShellProps = AppShellSimpleProps | AppShellAdvancedProps;

export default function AppShell(props: AppShellProps) {
  const children = props.children;
  const className = props.className;
  const contentClassName = props.contentClassName;

  const isAdvanced = 'header' in props;
  const isLoggedIn = isAdvanced ? Boolean(props.header.user) : Boolean(props.isLoggedIn);
  const header: AppHeaderProps = isAdvanced
    ? props.header
    : {
        user: isLoggedIn ? { displayName: 'Membre' } : null,
        rightSlot: props.headerRightSlot,
      };

  const showBottomNav = isAdvanced ? Boolean(props.showBottomNav) : isLoggedIn;
  const bottomNavItems = isAdvanced ? props.bottomNavItems : undefined;

  return (
    <div className={cn('min-h-[100dvh] bg-[rgb(var(--fn-bg))] text-[rgb(var(--fn-fg))]', className)}>
      <AppHeader {...header} />

      <main
        className={cn(
          'mx-auto w-full max-w-[var(--fn-page-max)] px-[var(--fn-page-pad)] pt-4 pb-8 sm:pt-6',
          showBottomNav && 'pb-[calc(var(--fn-bottomnav-h)+env(safe-area-inset-bottom)+16px)]',
          contentClassName
        )}
      >
        {children}
      </main>

      {showBottomNav ? <BottomNav items={bottomNavItems} /> : null}
    </div>
  );
}

