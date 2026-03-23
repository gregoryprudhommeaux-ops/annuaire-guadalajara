import React from 'react';
import type { UserProfile } from '../../types';
import type { HomeLandingCopy } from '../../copy/homeLanding';
import { formatHomeBadge } from '../../copy/homeLanding';
import { activityCategoryLabel } from '../../constants';
import type { Language } from '../../types';
import { cn } from '../../cn';
import { pickLang } from '../../lib/uiLocale';
import ProfileAvatar from '../ProfileAvatar';

type Props = {
  copy: HomeLandingCopy;
  lang: Language;
  profiles: UserProfile[];
  totalNewThisWeek: number;
  onSeeAll: () => void;
  /** Ouvre la fiche (ex. modal annuaire). */
  onOpenProfile?: (p: UserProfile) => void;
  className?: string;
};

/** Bandeau « nouveaux membres cette semaine » — cartes compactes + lien vers liste récente. */
export default function NewMembersStrip({
  copy,
  lang,
  profiles,
  totalNewThisWeek,
  onSeeAll,
  onOpenProfile,
  className,
}: Props) {
  const display = profiles.slice(0, 4);

  return (
    <section
      className={cn(
        'flex min-h-0 min-w-0 flex-col rounded-2xl border border-stone-200 bg-white px-4 py-4 text-left shadow-sm sm:px-6 sm:py-5',
        className
      )}
      aria-labelledby="home-new-members-title"
    >
      <div className="min-w-0">
        <h2
          id="home-new-members-title"
          className="text-base font-bold tracking-tight text-stone-900 break-words hyphens-auto sm:text-lg"
        >
          {copy.newMembersTitle}
        </h2>
        {totalNewThisWeek > 0 && (
          <p className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            {formatHomeBadge(copy.newMembersBadge, totalNewThisWeek)}
          </p>
        )}
      </div>

      {display.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500 break-words hyphens-auto">{copy.newMembersEmpty}</p>
      ) : (
        <ul className="mt-4 grid min-h-0 grid-cols-1 content-start gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {display.map((p) => {
            const cardInner = (
              <>
                <div className="flex h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-stone-200 sm:h-12 sm:w-12">
                  <ProfileAvatar
                    photoURL={p.photoURL}
                    fullName={p.fullName}
                    className="h-full w-full bg-white"
                    initialsClassName="text-[11px] font-bold text-blue-800 sm:text-xs"
                    iconSize={18}
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900 sm:text-[15px]">
                    {p.fullName}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-stone-600 sm:text-sm">
                    {p.companyName}
                  </p>
                  <p className="mt-1 line-clamp-2 text-left text-[11px] leading-snug text-stone-500 sm:text-xs">
                    {activityCategoryLabel(p.activityCategory, lang)}
                    {p.city ? ` · ${p.city}` : ''}
                  </p>
                </div>
              </>
            );
            return (
              <li key={p.uid} className="min-w-0 justify-self-stretch">
                {onOpenProfile ? (
                  <button
                    type="button"
                    onClick={() => onOpenProfile(p)}
                    className="flex w-full min-h-[4.5rem] items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/80 p-3 text-left transition-colors hover:border-stone-200 hover:bg-stone-100/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 sm:min-h-[4.75rem]"
                    aria-label={pickLang(
                      `Ouvrir la fiche de ${p.fullName}`,
                      `Abrir la ficha de ${p.fullName}`,
                      `Open profile: ${p.fullName}`,
                      lang
                    )}
                  >
                    {cardInner}
                  </button>
                ) : (
                  <div className="flex min-h-[4.5rem] items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/80 p-3 sm:min-h-[4.75rem]">
                    {cardInner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 border-t border-stone-100 pt-2.5 sm:mt-4 sm:pt-3">
        <button
          type="button"
          onClick={onSeeAll}
          className="block w-full text-left text-sm font-semibold text-blue-700 underline-offset-2 hover:text-blue-800 hover:underline sm:inline sm:w-auto"
        >
          {copy.newMembersSeeAll}
        </button>
      </div>
    </section>
  );
}
