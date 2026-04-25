import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/cn';

const base =
  'inline-flex min-h-[2.5rem] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#01696f] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#01696f] motion-safe:hover:border-slate-300 motion-safe:hover:bg-slate-50';

type Props = LinkProps & { className?: string; children: React.ReactNode };

export function StatsSecondaryButton({ className, children, ...rest }: Props) {
  return (
    <Link className={cn(base, className)} {...rest}>
      {children}
    </Link>
  );
}
