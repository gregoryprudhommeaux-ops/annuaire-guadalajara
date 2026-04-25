import React from 'react';
import { cn } from '@/lib/cn';

export type StatsBadgeVariant = 'primary' | 'neutral';

const variantClass: Record<StatsBadgeVariant, string> = {
  primary: 'border-[#01696f]/15 bg-[#e6f5f5]/80 text-[#0a4f54]',
  neutral: 'border-slate-200/90 bg-slate-50 text-slate-600',
};

type Props = {
  children: React.ReactNode;
  className?: string;
  variant?: StatsBadgeVariant;
  /** Désactiver l’uppercase (ex. libellés longs de métriques). */
  caps?: boolean;
};

/**
 * Pastille type pill, uppercase discret, alignée sur la palette stats.
 */
export function StatsBadge({ children, className, variant = 'primary', caps = true }: Props) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide',
        caps && 'uppercase',
        variantClass[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
