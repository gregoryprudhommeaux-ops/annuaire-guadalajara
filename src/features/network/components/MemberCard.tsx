import type { KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageProvider';
import ProfileAvatar from '@/components/ProfileAvatar';
import { cn } from '@/lib/cn';
import { pickLang } from '@/lib/uiLocale';
import {
  clampText,
  getVisibleNeeds,
  normalizeCompanyName,
  normalizeSectorName,
} from '../utils/memberCard';
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
  onOpen,
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

  const profilPath = `/profil/${encodeURIComponent(profileUid)}`;
  const cardLabel = pickLang(`Profil de ${fullName}`, `Perfil de ${fullName}`, `Profile: ${fullName}`, lang);

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
              fullName={fullName}
              className="member-card__avatarInner"
              imgClassName="member-card__avatarImg"
            />
          </div>

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
