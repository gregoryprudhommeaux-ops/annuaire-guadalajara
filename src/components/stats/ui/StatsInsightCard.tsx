import React from 'react';
import { cn } from '@/lib/cn';

type Props = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Panneau éditorial (bloc « pourquoi », insights) : même logique de carte, fond accent très léger.
 */
export function StatsInsightCard({ children, className, ...rest }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-[#e6f5f5]/35 p-4 shadow-sm sm:p-5',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
