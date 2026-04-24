import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/i18n/LanguageProvider';

export type FinalCtaProps = {
  isAuthenticated: boolean;
};

export function FinalCta({ isAuthenticated }: FinalCtaProps) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight text-[var(--fn-fg)]">
            {isAuthenticated
              ? t('marketing.publicHome.final.titleAuthenticated')
              : t('marketing.publicHome.final.titleVisitor')}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--fn-muted)]">
            {isAuthenticated
              ? t('marketing.publicHome.final.leadAuthenticated')
              : t('marketing.publicHome.final.leadVisitor')}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link to={isAuthenticated ? '/profile/edit' : '/inscription'} className="w-full sm:w-auto">
            <Button variant="primary" fullWidth trailingIcon={<ArrowRight className="h-4 w-4" />}>
              {isAuthenticated
                ? t('marketing.publicHome.primaryAuthenticated')
                : t('marketing.publicHome.primaryVisitor')}
            </Button>
          </Link>
          <Link to={isAuthenticated ? '/network' : '#comment-ca-marche'} className="w-full sm:w-auto">
            <Button variant="secondary" fullWidth>
              {isAuthenticated
                ? t('marketing.publicHome.secondaryAuthenticated')
                : t('marketing.publicHome.final.learnMore')}
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

