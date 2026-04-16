import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type NetworkToolbarProps = {
  children: ReactNode;
  className?: string;
};

export function NetworkToolbar({ children, className }: NetworkToolbarProps) {
  return <div className={cn('network-toolbar', className)}>{children}</div>;
}
