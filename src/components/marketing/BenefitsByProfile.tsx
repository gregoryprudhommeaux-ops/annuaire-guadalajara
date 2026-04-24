import React from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { useLanguage } from '@/i18n/LanguageProvider';

export function BenefitsByProfile() {
  const { t } = useLanguage();
  const PROFILES = [
    {
      title: t('marketing.publicHome.benefits.profile1Title'),
      items: [
        t('marketing.publicHome.benefits.profile1Item1'),
        t('marketing.publicHome.benefits.profile1Item2'),
        t('marketing.publicHome.benefits.profile1Item3'),
      ],
    },
    {
      title: t('marketing.publicHome.benefits.profile2Title'),
      items: [
        t('marketing.publicHome.benefits.profile2Item1'),
        t('marketing.publicHome.benefits.profile2Item2'),
        t('marketing.publicHome.benefits.profile2Item3'),
      ],
    },
    {
      title: t('marketing.publicHome.benefits.profile3Title'),
      items: [
        t('marketing.publicHome.benefits.profile3Item1'),
        t('marketing.publicHome.benefits.profile3Item2'),
        t('marketing.publicHome.benefits.profile3Item3'),
      ],
    },
    {
      title: t('marketing.publicHome.benefits.profile4Title'),
      items: [
        t('marketing.publicHome.benefits.profile4Item1'),
        t('marketing.publicHome.benefits.profile4Item2'),
        t('marketing.publicHome.benefits.profile4Item3'),
      ],
    },
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PROFILES.map((p) => (
        <Card key={p.title}>
          <CardBody>
            <p className="text-[15px] font-semibold tracking-tight text-[var(--fn-fg)]">{p.title}</p>
            <ul className="mt-3 space-y-2">
              {p.items.map((it) => (
                <li key={it} className="flex gap-2 text-sm leading-relaxed text-[var(--fn-muted)]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--fn-muted-2)]" aria-hidden />
                  <span className="min-w-0">{it}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

