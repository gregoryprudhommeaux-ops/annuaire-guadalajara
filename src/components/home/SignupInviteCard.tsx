import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, LogIn } from 'lucide-react';
import { cn } from '../../cn';
import type { Language } from '../../types';
import { pickLang } from '../../lib/uiLocale';
import { getSignupJoinUrl } from '../../lib/siteUrls';

type Props = {
  lang: Language;
  t: (key: string) => string;
  onOpenAuth: () => void;
  authBusy: boolean;
  className?: string;
};

/**
 * Page d’entrée minimale pour partager un lien d’inscription (sans la landing complète).
 */
export default function SignupInviteCard({ lang, t, onOpenAuth, authBusy, className }: Props) {
  const joinUrl = useMemo(() => getSignupJoinUrl(), []);
  const [copied, setCopied] = useState(false);

  const handleCopyJoin = () => {
    void navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-lg flex-col items-center rounded-2xl border border-stone-200 bg-white px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12',
        className
      )}
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-md">
        <LogIn size={28} strokeWidth={2} aria-hidden />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-[1.65rem]">
        {t('signupPageTitle')}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-[15px]">{t('signupPageSubtitle')}</p>
      <button
        type="button"
        onClick={onOpenAuth}
        disabled={authBusy}
        className="mt-8 w-full max-w-sm rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {authBusy
          ? pickLang('Connexion…', 'Conexión…', 'Signing in…', lang)
          : t('signupPageOpenAuth')}
      </button>
      <p className="mt-6 text-xs text-stone-500">{t('signupPageHint')}</p>

      <div className="mt-6 w-full max-w-sm rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-left">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
          {t('signupPageShareLinkLabel')}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate text-left text-xs text-stone-800">{joinUrl}</code>
          <button
            type="button"
            onClick={handleCopyJoin}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-100"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
            {copied ? t('signupPageJoinLinkCopied') : t('signupPageCopyJoinLink')}
          </button>
        </div>
      </div>

      <Link
        to="/"
        className="mt-4 text-sm font-medium text-blue-700 underline decoration-blue-600/40 underline-offset-2 hover:text-blue-900"
      >
        {t('signupPageBrowseFullSite')}
      </Link>
    </div>
  );
}
