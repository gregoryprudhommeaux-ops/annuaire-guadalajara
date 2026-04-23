import React from 'react';
import { cn } from '@/lib/cn';

export type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
};

export function SectionTitle({ eyebrow, title, subtitle, className }: SectionTitleProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">{title}</h2>
      {subtitle ? (
        <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
}

