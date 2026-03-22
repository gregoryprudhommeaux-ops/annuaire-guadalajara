import React from 'react';
import type { User } from 'firebase/auth';
import type { UrgentPost, UserProfile, Language } from '../../types';
import type { HomeLandingCopy } from '../../copy/homeLanding';
import { activityCategoryLabel } from '../../constants';
import { cn } from '../../cn';
import AiTranslatedFreeText from '../AiTranslatedFreeText';

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

function cityForAuthor(authorId: string | undefined, allProfiles: UserProfile[]): string {
  if (!authorId) return '';
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
  /** Même gabarit que SearchBlock / MembersCountBlock (colonne gauche, état vide). */
  const sidebarEmptyStyle = compactLayout && !hasPosts;

  return (
    <section
      className={cn(
        'min-w-0 shadow-sm',
        sidebarEmptyStyle
          ? 'rounded-xl border border-gray-200 bg-[#F7F7F9] p-4 lg:p-5'
          : hasPosts
            ? 'rounded-2xl border border-stone-200 bg-white px-4 py-5 sm:px-6'
            : 'rounded-2xl border border-stone-200 bg-white p-5'
      )}
      aria-labelledby="home-opportunities-title"
    >
      <h2
        id="home-opportunities-title"
        className={cn(
          'break-words hyphens-auto',
          sidebarEmptyStyle
            ? 'mb-4 text-sm font-semibold text-gray-700'
            : 'text-base font-bold tracking-tight text-stone-900 sm:text-lg'
        )}
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
            const canOpenProfile = !!user && !!post.authorId;
            const city = canOpenProfile ? cityForAuthor(post.authorId, allProfiles) : '';
            const typeLabel = post.sector?.trim() || copy.opportunityTypeUrgent;
            const cardBody = (
              <>
                <div className="line-clamp-3 min-w-0 break-words text-sm font-semibold leading-snug text-stone-900">
                  <AiTranslatedFreeText
                    lang={lang}
                    t={t}
                    text={post.text}
                    as="span"
                    omitAiDisclaimer
                    className="font-semibold leading-snug"
                  />
                </div>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                  {activityCategoryLabel(typeLabel, lang) || typeLabel}
                </p>
                {user ? (
                  <p className="mt-2 text-xs text-stone-600">
                    {post.authorName
                      ? `${post.authorName}${post.authorCompany ? ` · ${post.authorCompany}` : ''}`
                      : '—'}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-stone-500">{t('opportunityAuthorHiddenGuest')}</p>
                )}
                {city ? <p className="mt-1 text-xs text-stone-500">{city}</p> : null}
              </>
            );
            return (
              <li
                key={post.id}
                className={cn(
                  'flex flex-col rounded-xl border border-stone-100 bg-stone-50/60 p-3 transition-colors',
                  canOpenProfile && 'hover:border-stone-200 hover:bg-stone-50'
                )}
              >
                {canOpenProfile ? (
                  <button
                    type="button"
                    onClick={() => onOpenPost(post)}
                    className="flex flex-col text-left"
                  >
                    {cardBody}
                  </button>
                ) : (
                  <div className="flex flex-col text-left cursor-default">{cardBody}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : sidebarEmptyStyle ? (
        <p className="text-[13px] leading-snug text-gray-600 break-words hyphens-auto">
          {t('opportunitiesEmpty')}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-snug text-stone-500">{t('opportunitiesEmpty')}</p>
      )}

      <div
        className={cn(
          'flex w-full gap-2 sm:gap-3',
          hasPosts ? 'mt-5 border-t border-stone-100 pt-4' : 'mt-4',
          user ? 'flex-row flex-nowrap items-stretch' : 'flex-row flex-wrap items-start',
          sidebarEmptyStyle && !user && 'flex-col items-stretch',
          compactLayout && !sidebarEmptyStyle && 'justify-start',
          sidebarEmptyStyle && user && 'justify-start'
        )}
      >
        {user ? (
          <>
            <button
              type="button"
              onClick={onSeeAll}
              className={cn(
                'flex min-h-[44px] min-w-0 flex-1 items-center justify-center rounded-lg px-2 py-2.5 text-center text-xs font-semibold leading-snug transition-colors sm:px-3 sm:text-sm',
                sidebarEmptyStyle
                  ? 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                  : 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50'
              )}
            >
              {copy.opportunitiesSeeAll}
            </button>
            <button
              type="button"
              onClick={onPost}
              className={cn(
                'flex min-h-[44px] min-w-0 flex-1 items-center justify-center rounded-lg px-2 py-2.5 text-center text-xs font-semibold leading-snug text-white transition-colors sm:px-3 sm:text-sm',
                sidebarEmptyStyle ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-700 hover:bg-blue-800'
              )}
            >
              {copy.opportunitiesPost}
            </button>
          </>
        ) : sidebarEmptyStyle ? (
          <>
            <div className="flex min-w-0 w-full flex-row gap-2">
              <button
                type="button"
                onClick={onSeeAll}
                className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-2.5 text-center text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-50 sm:px-3 sm:text-sm"
              >
                {copy.opportunitiesSeeAll}
              </button>
              <button
                type="button"
                onClick={onCreateProfile}
                className="min-h-[44px] min-w-0 flex-1 rounded-lg bg-blue-600 px-2 py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:px-3 sm:text-sm"
              >
                {copy.opportunitiesPost}
              </button>
            </div>
            <span className="text-left text-xs text-gray-500">{copy.opportunitiesMembersOnly}</span>
          </>
        ) : (
          <>
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
                onClick={onCreateProfile}
                className="min-h-[44px] max-w-full rounded-lg bg-blue-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                {copy.opportunitiesPost}
              </button>
              <span
                className={cn(
                  'text-xs text-stone-400',
                  compactLayout ? 'text-left' : 'text-center sm:text-left'
                )}
              >
                {copy.opportunitiesMembersOnly}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
