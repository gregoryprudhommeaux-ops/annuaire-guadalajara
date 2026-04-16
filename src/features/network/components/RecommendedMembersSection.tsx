import { useCallback, useEffect, useMemo, useState } from 'react';
import { RecommendedMemberCard } from './RecommendedMemberCard';
import type { CompatibilityMember } from '../types/compatibility';
import {
  compatibilityStarCount,
  computeCompatibilityScore,
  getCompatibilityLevel,
  getCompatibilityReasons,
} from '../utils/memberCompatibility';
import { localizeCompatibilityReason } from '../utils/localizeCompatibilityReason';
import type { RecommendedCompatibilityMember } from '../utils/compatibilityFromProfile';
import { computeMemberMatch } from '../utils/memberSignalMatch';
import { loadRecommendationPrefs, saveRecommendationPrefs } from '../utils/recommendationPreferences';
import { useLanguage } from '@/i18n/LanguageProvider';
import { activityCategoryLabel } from '@/constants';
import type { UserProfile } from '@/types';
import { normalizedTargetKeywords } from '@/types';
import '../network-recommendations.css';

type RecommendedMembersSectionProps = {
  currentUser?: CompatibilityMember | null;
  members: RecommendedCompatibilityMember[];
  /** Profil session — bio / mots-clés pour le matching « évident » (encart vert). */
  viewerProfile?: UserProfile | null;
};

function memberUid(m: Pick<CompatibilityMember, 'id' | 'slug'>): string {
  return (m.id ?? m.slug ?? '').trim();
}

function viewerBioForMatch(p: UserProfile | null | undefined): string {
  if (!p) return '';
  return (p.bio ?? '').trim() || (p.memberBio ?? '').trim();
}

function localizedCompatibilityLevel(level: string, t: (k: string) => string): string {
  switch (level) {
    case 'Très pertinent':
      return t('network.compatLevel.veryRelevant');
    case 'Pertinent':
      return t('network.compatLevel.relevant');
    case 'À explorer':
      return t('network.compatLevel.explore');
    default:
      return level;
  }
}

type RecoPrefsState = { known: Set<string>; saved: Set<string> };

export function RecommendedMembersSection({
  currentUser,
  members,
  viewerProfile,
}: RecommendedMembersSectionProps) {
  const { lang: L, t } = useLanguage();
  const viewerUid = (currentUser?.id ?? currentUser?.slug ?? '').trim();

  const [recoPrefs, setRecoPrefs] = useState<RecoPrefsState>({ known: new Set(), saved: new Set() });

  useEffect(() => {
    if (!viewerUid) {
      setRecoPrefs({ known: new Set(), saved: new Set() });
      return;
    }
    const loaded = loadRecommendationPrefs(viewerUid);
    setRecoPrefs({
      known: new Set(loaded.knownUids),
      saved: new Set(loaded.savedUids),
    });
  }, [viewerUid]);

  const updateRecoPrefs = useCallback(
    (updater: (prev: RecoPrefsState) => RecoPrefsState) => {
      if (!viewerUid) return;
      setRecoPrefs((prev) => {
        const next = updater(prev);
        saveRecommendationPrefs(viewerUid, {
          knownUids: [...next.known],
          savedUids: [...next.saved],
        });
        return next;
      });
    },
    [viewerUid]
  );

  const toggleSave = useCallback(
    (uid: string) => {
      updateRecoPrefs((prev) => {
        const saved = new Set(prev.saved);
        if (saved.has(uid)) saved.delete(uid);
        else saved.add(uid);
        return { known: new Set(prev.known), saved };
      });
    },
    [updateRecoPrefs]
  );

  const markKnown = useCallback(
    (uid: string) => {
      updateRecoPrefs((prev) => {
        const known = new Set(prev.known);
        known.add(uid);
        return { known, saved: new Set(prev.saved) };
      });
    },
    [updateRecoPrefs]
  );

  const recommended = useMemo(() => {
    if (!currentUser) return [];

    const viewerBio = viewerBioForMatch(viewerProfile);
    const viewerKw = viewerProfile ? normalizedTargetKeywords(viewerProfile) : [];

    return members
      .map((member) => {
        const uid = memberUid(member);
        const score = computeCompatibilityScore(currentUser, member);
        const level = getCompatibilityLevel(score);
        const evident =
          viewerProfile?.uid && uid !== viewerProfile.uid
            ? computeMemberMatch(viewerBio, viewerKw, member.currentNeeds ?? [])
            : {
                isRelevant: false,
                score: 0,
                matchedNeeds: [] as string[],
                matchedSignals: [] as string[],
                reason: '',
              };

        return {
          member,
          uid,
          score,
          level,
          reasons: getCompatibilityReasons(currentUser, member),
          evident,
        };
      })
      .filter(
        (item) =>
          item.level &&
          item.uid &&
          item.member.slug &&
          !recoPrefs.known.has(item.uid)
      )
      .sort((a, b) => {
        const ea = a.evident.isRelevant ? 1 : 0;
        const eb = b.evident.isRelevant ? 1 : 0;
        if (eb !== ea) return eb - ea;
        if (a.evident.isRelevant && b.evident.isRelevant && b.evident.score !== a.evident.score) {
          return b.evident.score - a.evident.score;
        }
        return b.score - a.score;
      })
      .slice(0, 4);
  }, [currentUser, members, recoPrefs.known, viewerProfile]);

  if (!currentUser || !viewerUid) return null;

  if (!recommended.length) return null;

  const aria = t('network.recommendations.aria');

  return (
    <section
      id="network-recommendations-anchor"
      className="recommended-section"
      aria-label={aria}
    >
      <div className="recommended-section__header">
        <p className="recommended-section__eyebrow">
          {t('network.recommendations.eyebrow')}
        </p>
        <h2 className="recommended-section__title">
          {t('network.recommendations.title')}
        </h2>
        <p className="recommended-section__text">
          {t('network.recommendations.subtitle')}
        </p>
      </div>

      <div className="recommended-section__grid">
        {recommended.map(({ member, uid, score, level, reasons, evident }) => {
          const isEvident = evident.isRelevant;
          const compatStars = compatibilityStarCount(score);
          const starCount = isEvident
            ? evident.score >= 80
              ? 5
              : Math.max(4, compatStars)
            : compatStars;
          const compatibilityLevel = isEvident
            ? t('network.compatLevel.evidentClient')
            : localizedCompatibilityLevel(level!, t);
          const evidentMatch = isEvident
            ? {
                title:
                  evident.score >= 80
                    ? t('network.memberCard.matchTitleStrong')
                    : t('network.memberCard.matchTitleSoft'),
                matchedNeeds: evident.matchedNeeds,
                reason: t('network.memberCard.matchReasonForNeeds', {
                  needs: evident.matchedNeeds.join(', '),
                }),
              }
            : null;

          return (
            <RecommendedMemberCard
              key={uid}
              slug={member.slug!}
              fullName={member.fullName ?? t('network.profileFallback')}
              companyName={member.companyName}
              sector={member.sector ? activityCategoryLabel(member.sector, L) : undefined}
              photoURL={member.photoURL}
              compatibilityLevel={compatibilityLevel}
              starCount={starCount}
              reasons={reasons.map((r) => localizeCompatibilityReason(r, t))}
              isSaved={recoPrefs.saved.has(uid)}
              onToggleSave={() => toggleSave(uid)}
              onMarkKnown={() => markKnown(uid)}
              evidentMatch={evidentMatch}
            />
          );
        })}
      </div>
    </section>
  );
}
