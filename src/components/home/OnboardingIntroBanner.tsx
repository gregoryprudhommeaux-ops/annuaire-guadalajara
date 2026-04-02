import React from 'react';
import { cn } from '../../cn';

type TFn = (key: string) => string;

export type OnboardingIntroBannerProps = {
  t: TFn;
  className?: string;
};

/**
 * Bandeau « comment ça marche » — clés `onboardingIntro*` dans `TRANSLATIONS` / `EN_STRINGS`.
 */
export function OnboardingIntroBanner({ t, className }: OnboardingIntroBannerProps) {
  return (
    <section
      className={cn('rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5', className)}
      aria-labelledby="onboarding-intro-title"
    >
      <p id="onboarding-intro-title" className="text-sm font-semibold text-slate-900">
        {t('onboardingIntroTitle')}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{t('onboardingIntroDescription')}</p>

      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700 marker:font-medium marker:text-slate-600">
        <li>{t('onboardingIntroStep1')}</li>
        <li>{t('onboardingIntroStep2')}</li>
        <li>{t('onboardingIntroStep3')}</li>
      </ol>
    </section>
  );
}

export default OnboardingIntroBanner;
