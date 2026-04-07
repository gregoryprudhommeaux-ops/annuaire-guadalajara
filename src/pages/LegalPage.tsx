import React from 'react';
import type { Language } from '../types';
import { LEGAL_PRIVACY_PARAGRAPHS, LEGAL_TERMS_PARAGRAPHS } from '../legal/footerLegalContent';
import { pageSectionPad } from '../lib/pageLayout';

type Props = {
  lang: Language;
  t: (key: string) => string;
  mode: 'privacy' | 'terms';
};

export function LegalPage({ lang, t, mode }: Props) {
  const title = mode === 'terms' ? t('legalTermsTitle') : t('legalPrivacyTitle');
  const paragraphs = mode === 'terms' ? LEGAL_TERMS_PARAGRAPHS[lang] : LEGAL_PRIVACY_PARAGRAPHS[lang];

  return (
    <div className="min-h-[60vh] bg-stone-50">
      <div className={pageSectionPad}>
        <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          <header className="border-b border-stone-100 px-4 py-4 sm:px-6">
            <h1 className="text-lg font-bold leading-snug text-stone-900 sm:text-xl">{title}</h1>
          </header>
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="space-y-4 text-sm leading-relaxed text-stone-600">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-pretty">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

