import React from 'react';
import type { User } from 'firebase/auth';
import type { UrgentPost, UserProfile, Language } from '../../types';
import type { HomeLandingCopy } from '../../copy/homeLanding';
import { activityCategoryLabel } from '../../constants';
import { cn } from '../../cn';
import AiTranslatedFreeText from '../AiTranslatedFreeText';
import { OpportunityActions } from '../DirectoryUi';
import { cardPad } from '../../lib/pageLayout';
import { Trash2 } from 'lucide-react';

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
  /** Admin ou auteur : affiche une icône pour demander la suppression (confirmation dans App). */
  isAdmin?: boolean;
  onRequestDeleteOpportunity?: (post: UrgentPost) => void;
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
  isAdmin = false,
  onRequestDeleteOpportunity,
}: Props) {
  const slice = posts.slice(0, 5);
  const hasPosts = slice.length > 0;
  const canDeleteOpportunity = (post: UrgentPost): boolean => {
    if (!onRequestDeleteOpportunity) return false;
    if (isAdmin) return true;
    return !!user && !!post.authorId && post.authorId === user.uid;
  };
  /** Même gabarit que SearchBlock / MembersCountBlock (colonne gauche, état vide). */
  const sidebarEmptyStyle = compactLayout && !hasPosts;

  return (
    <section
      className={cn(
        'min-w-0 shadow-sm',
        sidebarEmptyStyle
          ? cn('rounded-xl border border-slate-200 bg-slate-50/95 shadow-sm', cardPad)
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
            ? 'mb-4 text-sm font-semibold text-slate-700'
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
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">
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
                  'relative flex flex-col rounded-xl border border-stone-100 bg-stone-50/60 p-3 transition-colors',
                  canOpenProfile && 'hover:border-stone-200 hover:bg-stone-50'
                )}
              >
                {canDeleteOpportunity(post) ? (
                  <button
                    type="button"
                    aria-label={t('deleteOpportunityAria')}
                    title={t('deleteOpportunityAria')}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRequestDeleteOpportunity!(post);
                    }}
                    className="absolute right-2 top-2 z-10 rounded-lg border border-stone-200/80 bg-white/95 p-1.5 text-stone-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                  </button>
                ) : null}
                {canOpenProfile ? (
                  <button
                    type="button"
                    onClick={() => onOpenPost(post)}
                    className={cn('flex flex-col text-left', canDeleteOpportunity(post) && 'pr-9')}
                  >
                    {cardBody}
                  </button>
                ) : (
                  <div className={cn('flex flex-col text-left cursor-default', canDeleteOpportunity(post) && 'pr-9')}>
                    {cardBody}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : sidebarEmptyStyle ? (
        <p className="text-[13px] leading-snug text-slate-600 break-words hyphens-auto">
          {t('opportunitiesEmpty')}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-snug text-stone-500">{t('opportunitiesEmpty')}</p>
      )}

      <div
        className={cn(
          hasPosts ? 'mt-5 border-t border-stone-100 pt-4' : 'mt-4',
          !user && !sidebarEmptyStyle && 'space-y-1'
        )}
      >
        <OpportunityActions
          className={cn('mt-0', user && 'sm:gap-3')}
          onSeeAll={onSeeAll}
          onPost={user ? onPost : onCreateProfile}
          seeAllLabel={copy.opportunitiesSeeAll}
          postLabel={copy.opportunitiesPost}
        />
        {!user ? (
          <span
            className={cn(
              'block text-[10px] leading-snug text-slate-500 sm:text-xs',
              !sidebarEmptyStyle && (compactLayout ? 'text-left' : 'text-center sm:text-left')
            )}
          >
            {copy.opportunitiesMembersOnly}
          </span>
        ) : null}
      </div>
    </section>
  );
}
