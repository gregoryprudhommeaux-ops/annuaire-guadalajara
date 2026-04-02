import React from 'react';
import { cn } from '../../cn';

export type FieldBadgeProps = {
  tone?: 'required' | 'recommended' | 'optional';
  children: React.ReactNode;
  className?: string;
};

export function FieldBadge({ tone = 'optional', children, className }: FieldBadgeProps) {
  const styles = {
    required: 'border-rose-200 bg-rose-50 text-rose-700',
    recommended: 'border-teal-200 bg-teal-50 text-teal-700',
    optional: 'border-slate-200 bg-slate-50 text-slate-600',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        styles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
