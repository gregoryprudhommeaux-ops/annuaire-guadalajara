import React from 'react';
import type { User } from 'firebase/auth';
import type { UrgentPost, UserProfile, Language } from '../../types';
import type { HomeLandingCopy } from '../../copy/homeLanding';
import { activityCategoryLabel } from '../../constants';

type Props = {
  copy: HomeLandingCopy;
  lang: Language;
  posts: UrgentPost[];
  allProfiles: UserProfile[];
  user: User | null;
  onSeeAll: () => void;
  onPost: () => void;
  onCreateProfile: () => void;
  onOpenPost: (post: UrgentPost) => void;
};

function titleFromPost(text: string, max = 72): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function cityForAuthor(authorId: string, allProfiles: UserProfile[]): string {
  const p = allProfiles.find((x) => x.uid === authorId);
  return (p?.city || '').trim();
}

/** Opportunités (données = besoins urgents existants ; structure prête pour d’autres sources). */
export default function OpportunitiesSection({
  copy,
  lang,
  posts,
  allProfiles,
  user,
  onSeeAll,
  onPost,
  onCreateProfile,
  onOpenPost,
}: Props) {
  const slice = posts.slice(0, 5);

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white px-4 py-5 shadow-sm sm:px-6"
      aria-labelledby="home-opportunities-title"
    >
      <h2
        id="home-opportunities-title"
        className="text-base font-bold tracking-tight text-stone-900 sm:text-lg"
      >
        {copy.opportunitiesTitle}
      </h2>

      {slice.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-stone-500">{copy.opportunitiesEmpty}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {slice.map((post) => {
            const city = cityForAuthor(post.authorId, allProfiles);
            const typeLabel =
              post.sector?.trim() || copy.opportunityTypeUrgent;
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
                <p className="text-sm font-semibold leading-snug text-stone-900">
                  {titleFromPost(post.text)}
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                  {activityCategoryLabel(typeLabel, lang) || typeLabel}
                </p>
                <p className="mt-2 text-xs text-stone-600">
                  {post.authorName}
                  {post.authorCompany ? ` · ${post.authorCompany}` : ''}
                </p>
                {city ? (
                  <p className="mt-1 text-xs text-stone-500">{city}</p>
                ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 flex flex-col gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:flex-wrap sm:items-start">
        <button
          type="button"
          onClick={onSeeAll}
          className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
        >
          {copy.opportunitiesSeeAll}
        </button>
        <div className="flex min-w-0 flex-col gap-1 sm:ml-1">
          <button
            type="button"
            onClick={user ? onPost : onCreateProfile}
            className="min-h-[44px] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
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
