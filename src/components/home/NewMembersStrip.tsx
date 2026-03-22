import React from 'react';
import type { UserProfile } from '../../types';
import type { HomeLandingCopy } from '../../copy/homeLanding';
import { formatHomeBadge } from '../../copy/homeLanding';
import { activityCategoryLabel } from '../../constants';
import type { Language } from '../../types';
import { cn } from '../../cn';

function memberInitials(p: UserProfile): string {
  const n = (p.fullName || p.companyName || '?').trim();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[parts.length - 1][0];
    if (a && b) return (a + b).toUpperCase();
  }
  return n.slice(0, 2).toUpperCase() || '?';
}

type Props = {
  copy: HomeLandingCopy;
  lang: Language;
  profiles: UserProfile[];
  totalNewThisWeek: number;
  onSeeAll: () => void;
  className?: string;
};

/** Bandeau « nouveaux membres cette semaine » — cartes compactes + lien vers liste récente. */
export default function NewMembersStrip({
  copy,
  lang,
  profiles,
  totalNewThisWeek,
  onSeeAll,
  className,
}: Props) {
  const display = profiles.slice(0, 4);

  return (
    <section
      className={cn(
        'flex min-h-0 min-w-0 flex-col rounded-2xl border border-stone-200 bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-5',
        className
      )}
      aria-labelledby="home-new-members-title"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2
            id="home-new-members-title"
            className="text-base font-bold tracking-tight text-stone-900 break-words hyphens-auto sm:text-lg"
          >
            {copy.newMembersTitle}
          </h2>
          {totalNewThisWeek > 0 && (
            <p className="mt-1 inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              {formatHomeBadge(copy.newMembersBadge, totalNewThisWeek)}
            </p>
          )}
        </div>
      </div>

      {display.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500 break-words hyphens-auto">{copy.newMembersEmpty}</p>
      ) : (
        <ul className="mt-4 grid min-h-0 grid-cols-1 content-start gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {display.map((p) => (
            <li
              key={p.uid}
              className="flex gap-2.5 rounded-xl border border-stone-100 bg-stone-50/80 p-2.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[10px] font-bold text-blue-800 ring-1 ring-stone-200">
                {p.photoURL ? (
                  <img
                    src={p.photoURL}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span aria-hidden>{memberInitials(p)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900">{p.fullName}</p>
                <p className="truncate text-xs text-stone-600">{p.companyName}</p>
                <p className="mt-1 truncate text-xs text-stone-500">
                  {activityCategoryLabel(p.activityCategory, lang)}
                  {p.city ? ` · ${p.city}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-stone-100 pt-3">
        <button
          type="button"
          onClick={onSeeAll}
          className="text-sm font-semibold text-blue-700 underline-offset-2 hover:text-blue-800 hover:underline"
        >
          {copy.newMembersSeeAll}
        </button>
      </div>
    </section>
  );
}
