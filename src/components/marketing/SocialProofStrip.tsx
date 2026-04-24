import React from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageProvider';

export type SocialProofStripProps = {
  memberCount?: number;
  sectors?: string[];
};

export function SocialProofStrip({ memberCount, sectors }: SocialProofStripProps) {
  const { t } = useLanguage();
  const chips = (sectors ?? []).slice(0, 6);
  const chipClass =
    'inline-flex items-center rounded-full border border-[var(--fn-border)] bg-[var(--fn-surface-2)] px-3 py-1.5 text-[11px] font-semibold text-[var(--fn-muted)] transition-colors hover:bg-[var(--fn-surface)] hover:text-[var(--fn-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]';
  return (
    <Card>
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-[var(--fn-fg)]">
            {t('marketing.socialProof.title')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--fn-muted)]">
            {typeof memberCount === 'number' && memberCount > 0
              ? t('marketing.socialProof.subtitleWithCount', { count: memberCount })
              : t('marketing.socialProof.subtitleFallback')}
          </p>
        </div>

        {chips.length ? (
          <div className="flex flex-wrap gap-2">
            {chips.map((s) => (
              <Link
                key={s}
                to={`/network?sector=${encodeURIComponent(s)}`}
                className={chipClass}
              >
                {s}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {['Conseil', 'Industrie', 'Tech', 'Services', 'Immobilier', 'Commerce'].map((s) => (
              <Link
                key={s}
                to={`/network?sector=${encodeURIComponent(s)}`}
                className={chipClass}
              >
                {s}
              </Link>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

