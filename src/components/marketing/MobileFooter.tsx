import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageProvider';

export function MobileFooter() {
  const { t } = useLanguage();
  return (
    <footer className="pb-8 pt-4">
      <div className="border-t border-[var(--fn-border)] pt-5">
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-[var(--fn-fg)]">FrancoNetwork</p>
          <p className="text-xs leading-relaxed text-[var(--fn-muted)]">
            {t('footer.tagline')}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to="/privacy"
            className="min-h-[36px] rounded-[var(--fn-radius-sm)] border border-[var(--fn-border)] bg-[var(--fn-surface)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--fn-muted)] outline-none transition-colors hover:bg-[var(--fn-surface-2)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]"
          >
            {t('footer.privacy')}
          </Link>
          <Link
            to="/terms"
            className="min-h-[36px] rounded-[var(--fn-radius-sm)] border border-[var(--fn-border)] bg-[var(--fn-surface)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--fn-muted)] outline-none transition-colors hover:bg-[var(--fn-surface-2)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]"
          >
            {t('footer.terms')}
          </Link>
        </div>

        <p className="mt-4 text-[11px] text-[var(--fn-muted-2)]">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}

