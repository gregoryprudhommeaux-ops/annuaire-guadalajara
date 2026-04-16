import type { KeyboardEvent } from 'react';
import { useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { cn } from '@/lib/cn';
import type { UserProfile } from '@/types';
import { normalizedTargetKeywords } from '@/types';
import { formatPersonName } from '@/shared/utils/formatPersonName';
import { computeMemberMatch } from '../utils/memberSignalMatch';
import { MemberIdentity } from './MemberIdentity';
import { MemberDescription } from './MemberDescription';
import { NeedsSection } from './NeedsSection';
import { ProfileMatchBox } from './ProfileMatchBox';
import { LinkToProfile } from './LinkToProfile';
import '../network.css';

type MemberCardProps = {
  /** Identifiant Firestore — route `/profil/:id`. */
  profileUid: string;
  fullName: string;
  companyName?: string;
  sector?: string;
  bio?: string;
  photoUrl?: string;
  needs?: string[];
  contactPreferenceCta?: string;
  onOpen?: () => void;
  /** Profil session : sert au `computeMemberMatch(bio, keywords, needs)` (champ `bio` Firestore). */
  viewerProfile?: UserProfile | null;
};

export function MemberCard({
  profileUid,
  fullName,
  companyName,
  sector,
  bio,
  photoUrl,
  needs = [],
  contactPreferenceCta: _cta,
  onOpen,
  viewerProfile,
}: MemberCardProps) {
  void _cta;
  const { t } = useLanguage();
  const displayName = formatPersonName(fullName);
  const cardLabel = t('network.memberCard.cardAria', { name: displayName || fullName });

  const match = useMemo(() => {
    if (!viewerProfile?.uid || viewerProfile.uid === profileUid) {
      return {
        isRelevant: false,
        score: 0,
        matchedNeeds: [] as string[],
        matchedSignals: [] as string[],
        reason: '',
      };
    }
    const viewerBio =
      (viewerProfile.bio ?? '').trim() || (viewerProfile.memberBio ?? '').trim();
    const base = computeMemberMatch(
      viewerBio,
      normalizedTargetKeywords(viewerProfile),
      needs
    );
    return {
      ...base,
      reason: base.isRelevant
        ? t('network.memberCard.matchReasonForNeeds', { needs: base.matchedNeeds.join(', ') })
        : '',
    };
  }, [viewerProfile, profileUid, needs, t]);

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

  const member = {
    fullName,
    companyName,
    sector,
    photoUrl,
    bio,
  };

  return (
    <article
      className={cn(
        'member-card rounded-[24px] border border-slate-200 bg-white p-4',
        onOpen && 'member-card--interactive'
      )}
      onClick={onOpen ? () => activate() : undefined}
      onKeyDown={onKeyDownCard}
      tabIndex={onOpen ? 0 : undefined}
      role={onOpen ? 'button' : undefined}
      aria-label={onOpen ? cardLabel : undefined}
    >
      <MemberIdentity member={member} />
      <MemberDescription member={member} />
      <NeedsSection needs={needs} />

      {match.isRelevant ? (
        <ProfileMatchBox
          title={
            match.score >= 80
              ? t('network.memberCard.matchTitleStrong')
              : t('network.memberCard.matchTitleSoft')
          }
          matchedNeeds={match.matchedNeeds}
          reason={match.reason}
        />
      ) : null}

      <LinkToProfile memberId={profileUid} label={t('common.viewProfile')} />
    </article>
  );
}
