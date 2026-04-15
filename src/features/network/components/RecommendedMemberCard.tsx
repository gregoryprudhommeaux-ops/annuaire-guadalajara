import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Star } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import ProfileAvatar from '@/components/ProfileAvatar';
import { pickLang } from '@/lib/uiLocale';
import { cn } from '@/lib/cn';

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
  const { lang } = useLanguage();
  const profilPath = `/profil/${encodeURIComponent(slug)}`;
  const starsLabel = pickLang(
    `Pertinence : ${starCount} sur 5`,
    `Pertinencia: ${starCount} de 5`,
    `Relevance: ${starCount} of 5`,
    lang
  );

  return (
    <article className="recommended-card">
      <div className="recommended-card__top">
        <div className="recommended-card__identity">
          <div className="recommended-card__avatar">
            <ProfileAvatar
              photoURL={photoURL}
              fullName={fullName}
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
        <h3 className="recommended-card__name">{fullName}</h3>

        {companyName ? <p className="recommended-card__company">{companyName}</p> : null}

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
          onClick={onToggleSave}
          aria-pressed={isSaved}
          aria-label={
            isSaved
              ? pickLang('Retirer des profils suivis', 'Quitar de guardados', 'Remove from saved', lang)
              : pickLang(
                  'Sauvegarder pour plus tard',
                  'Guardar para más tarde',
                  'Save for later',
                  lang
                )
          }
        >
          {isSaved ? (
            <BookmarkCheck size={15} className="recommended-card__toolIcon" aria-hidden />
          ) : (
            <Bookmark size={15} className="recommended-card__toolIcon" aria-hidden />
          )}
          <span>
            {isSaved
              ? pickLang('Enregistré', 'Guardado', 'Saved', lang)
              : pickLang('Suivre', 'Seguir', 'Save', lang)}
          </span>
        </button>
        <button
          type="button"
          className="recommended-card__toolBtn recommended-card__toolBtn--muted"
          onClick={onMarkKnown}
          aria-label={pickLang(
            'Ne plus me recommander ce profil',
            'No recomendar este perfil',
            'Stop recommending this profile',
            lang
          )}
        >
          {pickLang('Je le connais déjà', 'Ya lo conozco', 'I already know them', lang)}
        </button>
      </div>

      <div className="recommended-card__footer">
        <Link to={profilPath} className="recommended-card__link">
          {pickLang('Voir le profil', 'Ver perfil', 'View profile', lang)}
        </Link>
      </div>
    </article>
  );
}
