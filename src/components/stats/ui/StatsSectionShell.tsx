import React from 'react';
import { cn } from '@/lib/cn';

export type StatsSectionTone = 'default' | 'muted';

const toneClass: Record<StatsSectionTone, string> = {
  default: 'bg-white',
  /** Très léger off-white pour rythmer la page sans casser l’unité. */
  muted: 'bg-[#f9fafb]',
};

type Props = {
  children: React.ReactNode;
  className?: string;
  tone?: StatsSectionTone;
  /** Bordure / ombre (sections pleine largeur en carte). */
  variant?: 'raised' | 'flat';
};

/**
 * Conteneur de section type « carte » : même rayon, bordure, ombre, fond.
 */
export function StatsSectionShell({
  children,
  className,
  tone = 'default',
  variant = 'raised',
}: Props) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200/90',
        toneClass[tone],
        variant === 'raised' && 'shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
