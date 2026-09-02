import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '../../cn';
import type { Language } from '../../types';

type TFn = (key: string) => string;

const LA_MESA_URL: Record<Language, string> = {
  fr: 'https://lamesasecreta.com/fr',
  es: 'https://lamesasecreta.com/es',
  en: 'https://lamesasecreta.com/en',
};

export type OnboardingIntroBannerProps = {
  t: TFn;
  lang?: Language;
  className?: string;
};

/**
 * Bandeau « comment ça marche » + vivier LA MESA — clés `onboardingIntro*` / `onboardingLaMesa*`.
 */
export function OnboardingIntroBanner({ t, lang = 'fr', className }: OnboardingIntroBannerProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <section
        className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5"
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

      <aside
        className="rounded-2xl border border-[#01696f]/25 bg-[#01696f]/[0.04] p-4 sm:p-5"
        aria-labelledby="onboarding-lamesa-title"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#01696f]">
          {t('onboardingLaMesaEyebrow')}
        </p>
        <p id="onboarding-lamesa-title" className="mt-1 text-sm font-semibold text-slate-900">
          {t('onboardingLaMesaTitle')}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{t('onboardingLaMesaBody')}</p>
        <a
          href={LA_MESA_URL[lang]}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#01696f] underline-offset-2 hover:underline"
        >
          {t('onboardingLaMesaLinkLabel')}
          <ExternalLink size={14} aria-hidden className="shrink-0" />
        </a>
      </aside>
    </div>
  );
}

export default OnboardingIntroBanner;
