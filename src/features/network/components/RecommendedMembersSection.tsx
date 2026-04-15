import { RecommendedMemberCard } from './RecommendedMemberCard';
import {
  type CompatibilityMember,
  type CompatibilityReason,
  computeCompatibilityScore,
  getCompatibilityLevel,
  getCompatibilityReasons,
} from '../utils/memberCompatibility';
import { useLanguage } from '@/i18n/LanguageProvider';
import { pickLang } from '@/lib/uiLocale';
import { activityCategoryLabel } from '@/constants';
import type { Language } from '@/types';
import '../network-recommendations.css';

type RecommendedMembersSectionProps = {
  currentUser?: CompatibilityMember | null;
  members: CompatibilityMember[];
};

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

export function RecommendedMembersSection({ currentUser, members }: RecommendedMembersSectionProps) {
  const { lang: L } = useLanguage();

  if (!currentUser) return null;

  const recommended = members
    .map((member) => {
      const score = computeCompatibilityScore(currentUser, member);
      const level = getCompatibilityLevel(score);

      return {
        member,
        score,
        level,
        reasons: getCompatibilityReasons(currentUser, member),
      };
    })
    .filter((item) => item.level && item.member.slug)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

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
        {recommended.map(({ member, level, reasons }) => (
          <RecommendedMemberCard
            key={member.id ?? member.slug}
            slug={member.slug!}
            fullName={member.fullName ?? pickLang('Profil', 'Perfil', 'Profile', L)}
            companyName={member.companyName}
            sector={
              member.sector ? activityCategoryLabel(member.sector, L) : undefined
            }
            compatibilityLevel={localizedCompatibilityLevel(level!, L)}
            reasons={reasons.map((r) => localizedCompatibilityReason(r, L))}
          />
        ))}
      </div>
    </section>
  );
}
