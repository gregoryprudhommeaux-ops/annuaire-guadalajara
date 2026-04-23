import React from 'react';
import { Card, CardBody } from '@/components/ui/Card';

export type SocialProofStripProps = {
  memberCount?: number;
  sectors?: string[];
};

export function SocialProofStrip({ memberCount, sectors }: SocialProofStripProps) {
  const chips = (sectors ?? []).slice(0, 6);
  return (
    <Card>
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-[var(--fn-fg)]">
            Un écosystème business qui se connaît — et se recommande.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--fn-muted)]">
            {typeof memberCount === 'number' && memberCount > 0
              ? `${memberCount}+ profils visibles · Guadalajara · FR/ES/EN`
              : `Guadalajara · FR/ES/EN · profils structurés`}
          </p>
        </div>

        {chips.length ? (
          <div className="flex flex-wrap gap-2">
            {chips.map((s) => (
              <span
                key={s}
                className="rounded-full border border-[var(--fn-border)] bg-[var(--fn-surface-2)] px-3 py-1.5 text-[11px] font-semibold text-[var(--fn-muted)]"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {['Conseil', 'Industrie', 'Tech', 'Services', 'Immobilier', 'Commerce'].map((s) => (
              <span
                key={s}
                className="rounded-full border border-[var(--fn-border)] bg-[var(--fn-surface-2)] px-3 py-1.5 text-[11px] font-semibold text-[var(--fn-muted)]"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

