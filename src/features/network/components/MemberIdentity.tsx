import ProfileAvatar from '@/components/ProfileAvatar';
import { useLanguage } from '@/i18n/LanguageProvider';
import { activityCategoryLabel } from '@/constants';
import type { Language } from '@/types';
import { formatPersonName } from '@/shared/utils/formatPersonName';
import { normalizeCompanyName } from '../utils/memberCard';

export type MemberIdentityMember = {
  fullName: string;
  companyName?: string;
  /** Clé secteur ou libellé déjà formaté (ex. « Secteur A · Secteur B »). */
  sector?: string;
  photoUrl?: string;
};

export function MemberIdentity({ member }: { member: MemberIdentityMember }) {
  const { lang, t } = useLanguage();
  const displayName = formatPersonName(member.fullName);
  const companyLine =
    normalizeCompanyName(member.companyName) || t('network.memberCard.companyUnknown');
  const sectorLine =
    (member.sector ? activityCategoryLabel(member.sector, lang as Language) : '') ||
    t('network.memberCard.sectorUnknown');

  return (
    <div className="member-card__header">
      <div className="member-card__identity">
        <div className="member-card__avatar">
          <ProfileAvatar
            photoURL={member.photoUrl}
            fullName={displayName || member.fullName}
            className="member-card__avatarInner"
            imgClassName="member-card__avatarImg"
          />
        </div>

        <div className="member-card__identityText">
          <h3 className="member-card__name" title={displayName || member.fullName}>
            {displayName || member.fullName}
          </h3>
          <p className="member-card__company" title={companyLine}>
            {companyLine}
          </p>
          <p className="member-card__sector">{sectorLine}</p>
        </div>
      </div>
    </div>
  );
}
