import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Star } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import ProfileAvatar from '@/components/ProfileAvatar';
import { cn } from '@/lib/cn';
import { formatPersonName } from '@/shared/utils/formatPersonName';

export type RecommendedMemberCardProps = {
  slug: string;
  fullName: string;
  companyName?: string;
  sector?: string;
  photoURL?: string;
  compatibilityLevel: string;
  /** Nombre d’étoiles pleines sur 5. */
  starCount: number;
  reasons: string[];
  isSaved: boolean;
  onToggleSave: () => void;
  onMarkKnown: () => void;
};

function CompatibilityStars({ count, label }: { count: number; label: string }) {
  return (
    <div className="recommended-card__stars" role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={15}
          strokeWidth={1.6}
          className={cn(
            'recommended-card__star',
            i < count ? 'recommended-card__star--on' : 'recommended-card__star--off'
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function RecommendedMemberCard({
  slug,
  fullName,
  companyName,
  sector,
  photoURL,
  compatibilityLevel,
  starCount,
  reasons,
  isSaved,
  onToggleSave,
  onMarkKnown,
}: RecommendedMemberCardProps) {
  const { t } = useLanguage();
  const displayName = formatPersonName(fullName);
  const profilPath = `/profil/${encodeURIComponent(slug)}`;
  const starsLabel = t('network.scoreLabel', { score: starCount });

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <article className="recommended-card">
      <Link
        to={profilPath}
        className="recommended-card__overlayLink"
        aria-label={t('network.recommendedCard.openProfileAria', { name: displayName })}
      />
      <div className="recommended-card__top">
        <div className="recommended-card__identity">
          <div className="recommended-card__avatar">
            <ProfileAvatar
              photoURL={photoURL}
              fullName={displayName || fullName}
              className="recommended-card__avatarInner"
              imgClassName="recommended-card__avatarImg"
              iconSize={22}
            />
          </div>
          <div className="recommended-card__topMeta">
            <span className="recommended-card__level">{compatibilityLevel}</span>
            <CompatibilityStars count={starCount} label={starsLabel} />
          </div>
        </div>
      </div>

      <div className="recommended-card__content">
        <h3 className="recommended-card__name" title={displayName || fullName}>
          {displayName || fullName}
        </h3>

        {companyName ? (
          <p className="recommended-card__company" title={companyName}>
            {companyName}
          </p>
        ) : null}

        {sector ? <p className="recommended-card__sector">{sector}</p> : null}

        {reasons.length ? (
          <div className="recommended-card__reasons">
            {reasons.map((reason, i) => (
              <span key={`${reason}-${i}`} className="recommended-card__reasonChip">
                {reason}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="recommended-card__toolbar">
        <button
          type="button"
          className={cn('recommended-card__toolBtn', isSaved && 'recommended-card__toolBtn--active')}
          onClick={(e) => {
            stop(e);
            onToggleSave();
          }}
          aria-pressed={isSaved}
          aria-label={
            isSaved ? t('network.recommendedCard.savedAria') : t('network.recommendedCard.saveAria')
          }
        >
          {isSaved ? (
            <BookmarkCheck size={15} className="recommended-card__toolIcon" aria-hidden />
          ) : (
            <Bookmark size={15} className="recommended-card__toolIcon" aria-hidden />
          )}
          <span>
            {isSaved ? t('network.recommendedCard.labelSaved') : t('network.recommendedCard.labelFollow')}
          </span>
        </button>
        <button
          type="button"
          className="recommended-card__toolBtn recommended-card__toolBtn--muted"
          onClick={(e) => {
            stop(e);
            onMarkKnown();
          }}
          aria-label={t('network.recommendedCard.hideRecoAria')}
        >
          {t('network.recommendedCard.alreadyKnow')}
        </button>
      </div>

      <div className="recommended-card__footer">
        <Link to={profilPath} className="recommended-card__link" onClick={stop}>
          {t('network.recommendedCard.viewProfile')}
        </Link>
      </div>
    </article>
  );
}
