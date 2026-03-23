import React from 'react';
import type { HomeLandingCopy } from '../../copy/homeLanding';
import { cn } from '../../cn';
import { pagePadX } from '../../lib/pageLayout';

type Props = {
  copy: HomeLandingCopy;
  onCreateProfile: () => void;
  onExploreMembers: () => void;
  authBusy: boolean;
  className?: string;
};

/** Hero — promesse principale + CTA + 3 étapes (accueil visiteurs). */
export default function HeroSection({
  copy,
  onCreateProfile,
  onExploreMembers,
  authBusy,
  className,
}: Props) {
  return (
    <section
      className={cn(
        'flex h-full min-h-0 flex-col rounded-2xl border border-stone-200/80 bg-stone-50/80 py-5 sm:py-6 lg:py-7',
        pagePadX,
        className
      )}
      aria-labelledby="home-hero-title"
    >
      <div className="flex min-h-0 w-full flex-1 flex-col justify-between gap-5">
        <div className="min-w-0">
          <h1
            id="home-hero-title"
            className="text-xl font-bold tracking-tight text-stone-900 break-words sm:text-2xl sm:leading-snug"
          >
            {copy.heroTitle}
          </h1>
          <p className="mt-2 text-sm leading-snug text-stone-600 break-words hyphens-auto sm:text-[15px] sm:leading-relaxed">
            {copy.heroSubtitle}
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:mt-5">
            <button
              type="button"
              onClick={onCreateProfile}
              disabled={authBusy}
              className="min-h-[44px] w-full rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {authBusy ? copy.ctaPrimaryBusy : copy.ctaPrimary}
            </button>
            <button
              type="button"
              onClick={onExploreMembers}
              className="min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 sm:w-auto"
            >
              {copy.ctaSecondary}
            </button>
          </div>
        </div>

        <ol className="flex flex-col gap-2 border-t border-stone-200/80 pt-4 sm:flex-row sm:gap-4 sm:pt-4 lg:pt-5">
          {copy.steps.map((label, i) => (
            <li
              key={i}
              className="flex min-w-0 flex-1 items-start gap-2 text-xs leading-snug text-stone-600 sm:text-[13px]"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-blue-700 shadow-sm ring-1 ring-stone-200"
                aria-hidden
              >
                {i + 1}
              </span>
              <span className="min-w-0 break-words pt-0.5 hyphens-auto">{label}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
