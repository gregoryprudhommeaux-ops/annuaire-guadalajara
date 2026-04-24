import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/i18n/LanguageProvider';

export type PublicHeroProps = {
  isAuthenticated: boolean;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
};

export function PublicHero({
  isAuthenticated,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  onPrimaryClick,
  onSecondaryClick,
}: PublicHeroProps) {
  const { t } = useLanguage();
  return (
    <Card className="overflow-hidden">
      <CardBody className="space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--fn-fg)] sm:text-3xl">
            {t('marketing.publicHome.heroTitle')}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--fn-muted)] sm:text-[15px]">
            {t('marketing.publicHome.heroLead')}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to={primaryHref}
            onClick={(e) => {
              if (onPrimaryClick) {
                onPrimaryClick();
                // If the handler is provided for visitors, keep them on page (auth modal).
                if (!isAuthenticated && primaryHref === '/') e.preventDefault();
              }
            }}
            className="w-full sm:w-auto"
          >
            <Button
              variant="primary"
              fullWidth
              trailingIcon={<ArrowRight className="h-4 w-4" />}
            >
              {primaryLabel}
            </Button>
          </Link>
          <Link to={secondaryHref} onClick={onSecondaryClick} className="w-full sm:w-auto">
            <Button
              variant="secondary"
              fullWidth
              leadingIcon={<Compass className="h-4 w-4" />}
            >
              {secondaryLabel}
            </Button>
          </Link>
        </div>

        <div className={cn('grid gap-2 sm:grid-cols-3', isAuthenticated && 'sm:grid-cols-3')}>
          {[
            {
              k: t('marketing.publicHome.pill1Title'),
              v: t('marketing.publicHome.pill1Body'),
            },
            {
              k: t('marketing.publicHome.pill2Title'),
              v: t('marketing.publicHome.pill2Body'),
            },
            {
              k: t('marketing.publicHome.pill3Title'),
              v: t('marketing.publicHome.pill3Body'),
            },
          ].map((x) => (
            <div
              key={x.k}
              className="rounded-[var(--fn-radius-sm)] border border-[var(--fn-border)] bg-[var(--fn-surface-2)] px-3 py-3"
            >
              <p className="text-[13px] font-semibold text-[var(--fn-fg)]">{x.k}</p>
              <p className="mt-1 text-[12px] leading-snug text-[var(--fn-muted)]">{x.v}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

