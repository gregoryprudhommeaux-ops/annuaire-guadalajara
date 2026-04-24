import React from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { useLanguage } from '@/i18n/LanguageProvider';

export function HowItWorks() {
  const { t } = useLanguage();
  const STEPS = [
    {
      k: '1',
      title: t('marketing.publicHome.how.step1Title'),
      body: t('marketing.publicHome.how.step1Body'),
    },
    {
      k: '2',
      title: t('marketing.publicHome.how.step2Title'),
      body: t('marketing.publicHome.how.step2Body'),
    },
    {
      k: '3',
      title: t('marketing.publicHome.how.step3Title'),
      body: t('marketing.publicHome.how.step3Body'),
    },
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {STEPS.map((s) => (
        <Card key={s.k}>
          <CardBody>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fn-muted-2)]">
              {t('marketing.publicHome.how.stepLabel', { n: s.k })}
            </p>
            <p className="mt-2 text-[15px] font-semibold tracking-tight text-[var(--fn-fg)]">{s.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--fn-muted)]">{s.body}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

