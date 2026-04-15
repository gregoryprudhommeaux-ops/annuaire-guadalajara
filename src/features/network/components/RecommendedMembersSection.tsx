import { useCallback, useEffect, useMemo, useState } from 'react';
import { RecommendedMemberCard } from './RecommendedMemberCard';
import {
  type CompatibilityMember,
  type CompatibilityReason,
  compatibilityStarCount,
  computeCompatibilityScore,
  getCompatibilityLevel,
  getCompatibilityReasons,
} from '../utils/memberCompatibility';
import { loadRecommendationPrefs, saveRecommendationPrefs } from '../utils/recommendationPreferences';
import { useLanguage } from '@/i18n/LanguageProvider';
import { pickLang } from '@/lib/uiLocale';
import { activityCategoryLabel } from '@/constants';
import type { Language } from '@/types';
import '../network-recommendations.css';

type RecommendedMembersSectionProps = {
  currentUser?: CompatibilityMember | null;
  members: CompatibilityMember[];
};

function memberUid(m: CompatibilityMember): string {
  return (m.id ?? m.slug ?? '').trim();
}

function localizedCompatibilityLevel(level: string, lang: Language): string {
  switch (level) {
    case 'Très pertinent':
      return pickLang('Très pertinent', 'Muy pertinente', 'Highly relevant', lang);
    case 'Pertinent':
      return pickLang('Pertinent', 'Pertinente', 'Relevant', lang);
    case 'À explorer':
      return pickLang('À explorer', 'Para explorar', 'Worth exploring', lang);
    default:
      return level;
  }
}

function localizedCompatibilityReason(reason: CompatibilityReason, lang: Language): string {
  switch (reason) {
    case 'Besoin compatible':
      return pickLang('Besoin compatible', 'Necesidad afín', 'Aligned need', lang);
    case 'Peut vous aider':
      return pickLang('Peut vous aider', 'Puede ayudarte', 'Can help you', lang);
    case 'Même secteur':
      return pickLang('Même secteur', 'Mismo sector', 'Same sector', lang);
    case 'Même ville':
      return pickLang('Même ville', 'Misma ciudad', 'Same city', lang);
    case 'Passion commune':
      return pickLang('Passion commune', 'Pasión compartida', 'Shared passion', lang);
    case 'Ouvert au mentorat':
      return pickLang('Ouvert au mentorat', 'Abierto a mentoría', 'Open to mentoring', lang);
    case 'Mots-clés proches':
      return pickLang('Mots-clés proches', 'Palabras clave afines', 'Similar keywords', lang);
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}

type RecoPrefsState = { known: Set<string>; saved: Set<string> };

export function RecommendedMembersSection({ currentUser, members }: RecommendedMembersSectionProps) {
  const { lang: L } = useLanguage();
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

  const aria = pickLang(
    'Profils recommandés pour vous',
    'Perfiles recomendados para ti',
    'Recommended profiles for you',
    L
  );

  return (
    <section className="recommended-section" aria-label={aria}>
      <div className="recommended-section__header">
        <p className="recommended-section__eyebrow">
          {pickLang('RECOMMANDATIONS', 'RECOMENDACIONES', 'RECOMMENDATIONS', L)}
        </p>
        <h2 className="recommended-section__title">
          {pickLang(
            'Profils recommandés pour vous',
            'Perfiles recomendados para ti',
            'Recommended profiles for you',
            L
          )}
        </h2>
        <p className="recommended-section__text">
          {pickLang(
            'Basé sur vos besoins actuels, votre activité et vos centres d’intérêt.',
            'Basado en tus necesidades actuales, tu actividad y tus intereses.',
            'Based on your current needs, your activity, and your interests.',
            L
          )}
        </p>
      </div>

      <div className="recommended-section__grid">
        {recommended.map(({ member, uid, score, level, reasons }) => (
          <RecommendedMemberCard
            key={uid}
            slug={member.slug!}
            fullName={member.fullName ?? pickLang('Profil', 'Perfil', 'Profile', L)}
            companyName={member.companyName}
            sector={member.sector ? activityCategoryLabel(member.sector, L) : undefined}
            photoURL={member.photoURL}
            compatibilityLevel={localizedCompatibilityLevel(level!, L)}
            starCount={compatibilityStarCount(score)}
            reasons={reasons.map((r) => localizedCompatibilityReason(r, L))}
            isSaved={recoPrefs.saved.has(uid)}
            onToggleSave={() => toggleSave(uid)}
            onMarkKnown={() => markKnown(uid)}
          />
        ))}
      </div>
    </section>
  );
}
