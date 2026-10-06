import React from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';

const SUITE_URL = 'https://nextstep-suite.vercel.app/';

export function SuiteCredit({
  className = 'text-xs text-stone-400',
  linkClassName = 'font-medium underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-700',
}: {
  className?: string;
  linkClassName?: string;
}) {
  const { t } = useLanguage();
  return (
    <p className={className}>
      {t('footer.suiteLead')}{' '}
      <a href={SUITE_URL} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        {t('footer.suiteName')}
      </a>
    </p>
  );
}
