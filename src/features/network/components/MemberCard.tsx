import type { KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageProvider';
import ProfileAvatar from '@/components/ProfileAvatar';
import { cn } from '@/lib/cn';
import { pickLang } from '@/lib/uiLocale';
import { formatPersonName } from '@/shared/utils/formatPersonName';
import { getVisibleNeeds, normalizeCompanyName, normalizeSectorName } from '../utils/memberCard';
import { getCleanPreviewText } from '@/features/network/utils/memberProfilePreview';
import '../network.css';

type MemberCardProps = {
  /** Identifiant Firestore — obligatoire : la route `/profil/:id` attend l’UID, pas un slug de nom. */
  profileUid: string;
  fullName: string;
  companyName?: string;
  sector?: string;
  bio?: string;
  photoUrl?: string;
  needs?: string[];
  /** Préférence de contact courte (optionnel) — affichée en second plan si présente. */
  contactPreferenceCta?: string;
  /** Ouvre la fiche en modal (ex. `setSelectedProfile` dans l’app). */
  onOpen?: () => void;
};

export function MemberCard({
  profileUid,
  fullName,
  companyName,
  sector,
  bio,
  photoUrl,
  needs = [],
  contactPreferenceCta,
  onOpen,
}: MemberCardProps) {
  const { lang } = useLanguage();
  const displayName = formatPersonName(fullName);
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
  const profilPath = `/profil/${encodeURIComponent(profileUid)}`;
  const cardLabel = pickLang(
    `Profil de ${displayName}`,
    `Perfil de ${displayName}`,
    `Profile: ${displayName}`,
    lang
  );
  const bioFull = (bio ?? '').replace(/\s+/g, ' ').trim();
  const bioFallback = pickLang(
    'Présentation à compléter.',
    'Presentación por completar.',
    'Profile presentation to be completed.',
    lang
  );
  const bioPreview = getCleanPreviewText(bio, bioFallback, 210);

  const activate = () => {
    onOpen?.();
  };

  const onKeyDownCard = (e: KeyboardEvent<HTMLElement>) => {
    if (!onOpen) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  };

  return (
    <article
      className={cn('member-card', onOpen && 'member-card--interactive')}
      onClick={onOpen ? () => activate() : undefined}
      onKeyDown={onKeyDownCard}
      tabIndex={onOpen ? 0 : undefined}
      role={onOpen ? 'button' : undefined}
      aria-label={onOpen ? cardLabel : undefined}
    >
      <div className="member-card__header">
        <div className="member-card__identity">
          <div className="member-card__avatar">
            <ProfileAvatar
              photoURL={photoUrl}
              fullName={displayName || fullName}
              className="member-card__avatarInner"
              imgClassName="member-card__avatarImg"
            />
          </div>

          <div className="member-card__identityText">
            <h3 className="member-card__name" title={displayName || fullName}>
              {displayName || fullName}
            </h3>
            <p className="member-card__company" title={companyLine}>
              {companyLine}
            </p>
            <p className="member-card__sector">{sectorLine}</p>
          </div>
        </div>
      </div>

      <p className="member-card__bio" title={bioFull.length > 210 ? bioFull : undefined}>
        {bioPreview}
      </p>

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
        <Link
          to={profilPath}
          className="member-card__link"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {pickLang('Voir le profil', 'Ver perfil', 'View profile', lang)}
        </Link>
      </div>
    </article>
  );
}
