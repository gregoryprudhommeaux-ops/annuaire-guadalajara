import { useLanguage } from '@/i18n/LanguageProvider';
import { pickLang } from '@/lib/uiLocale';
import {
  clampText,
  getInitials,
  getVisibleNeeds,
  normalizeCompanyName,
  normalizeSectorName,
} from '../utils/memberCard';
import '../network.css';

type MemberCardProps = {
  slug: string;
  fullName: string;
  companyName?: string;
  sector?: string;
  bio?: string;
  photoUrl?: string;
  needs?: string[];
};

export function MemberCard({
  slug,
  fullName,
  companyName,
  sector,
  bio,
  photoUrl,
  needs = [],
}: MemberCardProps) {
  const { lang } = useLanguage();
  const safeBio = clampText(bio, 240);
  const visibleNeeds = getVisibleNeeds(needs, 3);
  const chips =
    visibleNeeds.length > 0
      ? visibleNeeds
      : [
          pickLang(
            'Aucun besoin structuré renseigné',
            'Sin necesidades estructuradas',
            'No structured needs listed',
            lang
          ),
        ];

  const companyLine =
    normalizeCompanyName(companyName) ||
    pickLang('Entreprise non renseignée', 'Empresa no indicada', 'Company not specified', lang);
  const sectorLine =
    normalizeSectorName(sector) ||
    pickLang('Secteur non renseigné', 'Sector no indicado', 'Sector not specified', lang);
  const bioLine =
    safeBio ||
    pickLang('Présentation à compléter.', 'Completa tu presentación.', 'Add a short bio.', lang);

  return (
    <article className="member-card">
      <div className="member-card__header">
        <div className="member-card__identity">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={fullName}
              className="member-card__avatarImage"
              loading="lazy"
            />
          ) : (
            <div className="member-card__avatarFallback" aria-hidden="true">
              {getInitials(fullName)}
            </div>
          )}

          <div className="member-card__identityText">
            <h3 className="member-card__name">{fullName}</h3>
            <p className="member-card__company">{companyLine}</p>
            <p className="member-card__sector">{sectorLine}</p>
          </div>
        </div>
      </div>

      <p className="member-card__bio">{bioLine}</p>

      <div className="member-card__needsBlock">
        <p className="member-card__label">
          {pickLang('BESOINS ACTUELS', 'NECESIDADES ACTUALES', 'CURRENT NEEDS', lang)}
        </p>

        <div className="member-card__chips">
          {chips.map((need, i) => (
            <span key={`${need}-${i}`} className="member-card__chip">
              {need}
            </span>
          ))}
        </div>
      </div>

      <div className="member-card__footer">
        <a href={`/network/member/${encodeURIComponent(slug)}`} className="member-card__link">
          {pickLang('Voir le profil', 'Ver perfil', 'View profile', lang)}
        </a>
      </div>
    </article>
  );
}
