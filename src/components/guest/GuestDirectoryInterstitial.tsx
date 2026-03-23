import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '../../cn';

type TFn = (key: string) => string;

type Props = {
  hiddenCount: number;
  onJoin: () => void;
  t: TFn;
  className?: string;
};

/** Bandeau après les N premières fiches pour inviter à créer un profil. */
export function GuestDirectoryInterstitial({ hiddenCount, onJoin, t, className }: Props) {
  if (hiddenCount <= 0) return null;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/90 p-6 text-center shadow-sm',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 overflow-hidden rounded-t-xl opacity-25">
        <div className="grid grid-cols-2 gap-3 px-4 pt-2">
          <div className="h-7 rounded-lg bg-slate-200 blur-sm" />
          <div className="h-7 rounded-lg bg-slate-200 blur-sm" />
        </div>
      </div>

      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
        <Lock className="h-5 w-5 text-blue-700" strokeWidth={2} aria-hidden />
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-900">
        {t('guestInterstitialHeadline').replace(/\{\{count\}\}/g, String(hiddenCount))}
      </p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">{t('guestInterstitialBody')}</p>

      <button
        type="button"
        onClick={onJoin}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        {t('guestInterstitialCta')}
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>

      <p className="mt-3 text-[11px] text-slate-400">{t('guestInterstitialFinePrint')}</p>
    </div>
  );
}
