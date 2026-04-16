import { useLanguage } from '@/i18n/LanguageProvider';
import { getCleanPreviewText } from '@/features/network/utils/memberProfilePreview';

export type MemberDescriptionMember = {
  bio?: string;
};

export function MemberDescription({ member }: { member: MemberDescriptionMember }) {
  const { t } = useLanguage();
  const bioFull = (member.bio ?? '').replace(/\s+/g, ' ').trim();
  const bioFallback = t('network.memberCard.bioIncomplete');
  const bioPreview = getCleanPreviewText(member.bio, bioFallback, 210);

  return (
    <p className="member-card__bio" title={bioFull.length > 210 ? bioFull : undefined}>
      {bioPreview}
    </p>
  );
}
