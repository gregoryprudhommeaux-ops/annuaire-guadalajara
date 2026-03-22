import React from 'react';
import { Zap } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { UrgentPost, UserProfile, Language } from '../../types';
import type { HomeLandingCopy } from '../../copy/homeLanding';
import { activityCategoryLabel } from '../../constants';
import { cn } from '../../cn';

type TFn = (key: string) => string;

type Props = {
  copy: HomeLandingCopy;
  t: TFn;
  lang: Language;
  posts: UrgentPost[];
  allProfiles: UserProfile[];
  user: User | null;
  onSeeAll: () => void;
  onPost: () => void;
  onCreateProfile: () => void;
  onOpenPost: (post: UrgentPost) => void;
  /** Colonne étroite (sous la recherche) : une seule colonne de cartes. */
  compactLayout?: boolean;
};

function titleFromPost(text: string, max = 72): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function cityForAuthor(authorId: string, allProfiles: UserProfile[]): string {
  const p = allProfiles.find((x) => x.uid === authorId);
  return (p?.city || '').trim();
}

/** Opportunités (données = besoins urgents existants ; structure prête pour d’autres sources). */
export default function OpportunitiesSection({
  copy,
  t,
  lang,
  posts,
  allProfiles,
  user,
  onSeeAll,
  onPost,
  onCreateProfile,
  onOpenPost,
  compactLayout = false,
}: Props) {
  const slice = posts.slice(0, 5);
  const hasPosts = slice.length > 0;

  return (
    <section
      className={cn(
        'min-w-0 rounded-2xl border border-stone-200 bg-white shadow-sm',
        hasPosts ? 'px-4 py-5 sm:px-6' : 'p-5'
      )}
      aria-labelledby="home-opportunities-title"
    >
      <h2
        id="home-opportunities-title"
        className="text-base font-bold tracking-tight text-stone-900 break-words hyphens-auto sm:text-lg"
      >
        {copy.opportunitiesTitle}
      </h2>

      {hasPosts ? (
        <ul
          className={cn(
            'mt-4 grid grid-cols-1 gap-3',
            !compactLayout && 'md:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {slice.map((post) => {
            const city = cityForAuthor(post.authorId, allProfiles);
            const typeLabel = post.sector?.trim() || copy.opportunityTypeUrgent;
            return (
              <li
                key={post.id}
                className="flex flex-col rounded-xl border border-stone-100 bg-stone-50/60 p-3 transition-colors hover:border-stone-200 hover:bg-stone-50"
              >
                <button
                  type="button"
                  onClick={() => onOpenPost(post)}
                  className="flex flex-col text-left"
                >
                  <p className="text-sm font-semibold leading-snug text-stone-900 break-words">
                    {titleFromPost(post.text)}
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                    {activityCategoryLabel(typeLabel, lang) || typeLabel}
                  </p>
                  <p className="mt-2 text-xs text-stone-600">
                    {post.authorName}
                    {post.authorCompany ? ` · ${post.authorCompany}` : ''}
                  </p>
                  {city ? <p className="mt-1 text-xs text-stone-500">{city}</p> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-3 flex flex-col items-center text-center">
          <Zap className="h-8 w-8 shrink-0 text-[#D1D5DB]" strokeWidth={1.25} aria-hidden />
          <p className="mt-2 max-w-sm text-sm text-stone-500">{t('opportunitiesEmpty')}</p>
        </div>
      )}

      <div
        className={cn(
          'flex flex-row flex-wrap items-start gap-3',
          hasPosts ? 'mt-5 border-t border-stone-100 pt-4' : 'mt-4'
        )}
      >
        <button
          type="button"
          onClick={onSeeAll}
          className="min-h-[44px] max-w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
        >
          {copy.opportunitiesSeeAll}
        </button>
        <div className="flex min-w-0 flex-col gap-1">
          <button
            type="button"
            onClick={user ? onPost : onCreateProfile}
            className="min-h-[44px] max-w-full rounded-lg bg-blue-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            {copy.opportunitiesPost}
          </button>
          {!user && (
            <span className="text-center text-xs text-stone-400 sm:text-left">
              {copy.opportunitiesMembersOnly}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
