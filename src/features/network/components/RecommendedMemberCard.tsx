import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageProvider';
import { pickLang } from '@/lib/uiLocale';
export type RecommendedMemberCardProps = {
  slug: string;
  fullName: string;
  companyName?: string;
  sector?: string;
  compatibilityLevel: string;
  reasons: string[];
};

export function RecommendedMemberCard({
  slug,
  fullName,
  companyName,
  sector,
  compatibilityLevel,
  reasons,
}: RecommendedMemberCardProps) {
  const { lang } = useLanguage();
  const profilPath = `/profil/${encodeURIComponent(slug)}`;

  return (
    <article className="recommended-card">
      <div className="recommended-card__top">
        <span className="recommended-card__level">{compatibilityLevel}</span>
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

      <div className="recommended-card__footer">
        <Link to={profilPath} className="recommended-card__link">
          {pickLang('Voir le profil', 'Ver perfil', 'View profile', lang)}
        </Link>
      </div>
    </article>
  );
}
