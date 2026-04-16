import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type SortPanelProps = {
  title: string;
  /** Id du `<select>` associé (accessibilité). */
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

export function SortPanel({ title, children, htmlFor = 'sort-members', className }: SortPanelProps) {
  return (
    <div className={cn('network-sort-panel network-toolbar__sort', className)}>
      <label htmlFor={htmlFor}>{title}</label>
      {children}
    </div>
  );
}
