import React from 'react';
import { cn } from '@/lib/cn';

export type CardProps<T extends React.ElementType = 'div'> = {
  as?: T;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className'>;

export function Card<T extends React.ElementType = 'div'>({ as, className, ...props }: CardProps<T>) {
  const Tag = (as ?? 'div') as React.ElementType;
  return (
    <Tag
      className={cn(
        'rounded-[18px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]',
        className
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-5', className)} {...props} />;
}

