import React from 'react';
import { cn } from '@/lib/cn';

export type MarketingSectionProps = React.HTMLAttributes<HTMLElement> & {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export function MarketingSection({
  id,
  eyebrow,
  title,
  lead,
  right,
  className,
  children,
  ...props
}: MarketingSectionProps) {
  return (
    <section id={id} className={cn('py-2', className)} {...props}>
      {(eyebrow || title || lead || right) && (
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fn-muted-2)]">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--fn-fg)] sm:text-xl">
                {title}
              </h2>
            ) : null}
            {lead ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--fn-muted)]">{lead}</p>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}

      {children}
    </section>
  );
}

