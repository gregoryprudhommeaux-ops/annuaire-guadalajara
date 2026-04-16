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
import { loadRecommendationPrefs, saveRecommendationPrefs } from '../utils/recommendationPreferences';
import { useLanguage } from '@/i18n/LanguageProvider';
import { activityCategoryLabel } from '@/constants';
import type { Language } from '@/types';
import '../network-recommendations.css';

type RecommendedMembersSectionProps = {
  currentUser?: CompatibilityMember | null;
  members: RecommendedCompatibilityMember[];
};

function memberUid(m: Pick<CompatibilityMember, 'id' | 'slug'>): string {
  return (m.id ?? m.slug ?? '').trim();
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

export function RecommendedMembersSection({ currentUser, members }: RecommendedMembersSectionProps) {
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

    return members
      .map((member) => {
        const uid = memberUid(member);
        const score = computeCompatibilityScore(currentUser, member);
        const level = getCompatibilityLevel(score);

        return {
          member,
          uid,
          score,
          level,
          reasons: getCompatibilityReasons(currentUser, member),
        };
      })
      .filter(
        (item) =>
          item.level &&
          item.uid &&
          item.member.slug &&
          !recoPrefs.known.has(item.uid)
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [currentUser, members, recoPrefs.known]);

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
        {recommended.map(({ member, uid, score, level, reasons }) => (
          <RecommendedMemberCard
            key={uid}
            slug={member.slug!}
            fullName={member.fullName ?? t('network.profileFallback')}
            companyName={member.companyName}
            sector={member.sector ? activityCategoryLabel(member.sector, L) : undefined}
            photoURL={member.photoURL}
            compatibilityLevel={localizedCompatibilityLevel(level!, t)}
            starCount={compatibilityStarCount(score)}
            reasons={reasons.map((r) => localizeCompatibilityReason(r, t))}
            isSaved={recoPrefs.saved.has(uid)}
            onToggleSave={() => toggleSave(uid)}
            onMarkKnown={() => markKnown(uid)}
          />
        ))}
      </div>
    </section>
  );
}
