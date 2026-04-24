import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Radar, Sparkles } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/i18n/LanguageProvider';

export type FeaturedOpportunitiesProps = {
  isAuthenticated: boolean;
  requestsHref?: string;
  radarHref?: string;
};

export function FeaturedOpportunities({
  isAuthenticated,
  requestsHref = '/requests',
  radarHref = '/radar',
}: FeaturedOpportunitiesProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <SectionTitle
          title={t('marketing.publicHome.featured.title')}
          subtitle={t('marketing.publicHome.featured.subtitle')}
        />
        <Link to={isAuthenticated ? requestsHref : '/inscription'} className={cn('hidden sm:block')}>
          <Button variant="ghost" trailingIcon={<ArrowRight className="h-4 w-4" />}>
            {t('marketing.publicHome.featured.see')}
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardBody className="flex h-full flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                  <Sparkles className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                  {t('marketing.publicHome.featured.card1.eyebrow')}
                </p>
                <p className="mt-3 text-[15px] font-semibold tracking-tight text-[var(--text)]">
                  {t('marketing.publicHome.featured.card1.title')}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {t('marketing.publicHome.featured.card1.body')}
                </p>
              </div>
            </div>
            <div className="mt-auto pt-1">
              <Link to={isAuthenticated ? requestsHref : '/inscription'} className="block">
                <Button variant="secondary" fullWidth trailingIcon={<ArrowRight className="h-4 w-4" />}>
                  {isAuthenticated
                    ? t('marketing.publicHome.featured.card1.ctaAuthenticated')
                    : t('marketing.publicHome.featured.card1.ctaVisitor')}
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex h-full flex-col gap-3">
            <div className="min-w-0">
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                <Radar className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                {t('marketing.publicHome.featured.card2.eyebrow')}
              </p>
              <p className="mt-3 text-[15px] font-semibold tracking-tight text-[var(--text)]">
                {t('marketing.publicHome.featured.card2.title')}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {t('marketing.publicHome.featured.card2.body')}
              </p>
            </div>
            <div className="mt-auto pt-1">
              <Link to={isAuthenticated ? radarHref : '/inscription'} className="block">
                <Button variant="secondary" fullWidth trailingIcon={<ArrowRight className="h-4 w-4" />}>
                  {isAuthenticated
                    ? t('marketing.publicHome.featured.card2.ctaAuthenticated')
                    : t('marketing.publicHome.featured.card2.ctaVisitor')}
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="sm:hidden">
        <Link to={isAuthenticated ? requestsHref : '/inscription'} className="block">
          <Button variant="ghost" fullWidth trailingIcon={<ArrowRight className="h-4 w-4" />}>
            {t('marketing.publicHome.featured.seeAllMobile')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

