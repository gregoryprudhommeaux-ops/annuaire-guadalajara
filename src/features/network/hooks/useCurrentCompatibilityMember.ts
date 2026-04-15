import { useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { UserProfile } from '@/types';
import type { CompatibilityMember } from '../types/compatibility';
import { userProfileToCompatibilityMember } from '../utils/compatibilityFromProfile';
import type { RawProfile } from '../utils/mapProfileToCompatibilityMember';
import { mapProfileToCompatibilityMember } from '../utils/mapProfileToCompatibilityMember';

export type UseCurrentCompatibilityMemberArgs = {
  /**
   * Profil session Firestore — **même objet** que l’édition `/profile/edit` (`MainApp` state `profile`).
   * Prioritaire sur `currentProfile`.
   */
  profile?: UserProfile | null;
  /** Fallback (tests, intégrations) si aucun `UserProfile` n’est disponible. */
  currentProfile?: RawProfile | null;
};

/**
 * Membre « courant » pour le moteur de compatibilité, dérivé du profil connecté sans fetch supplémentaire.
 */
export function useCurrentCompatibilityMember({
  profile,
  currentProfile,
}: UseCurrentCompatibilityMemberArgs): CompatibilityMember | null {
  const { lang } = useLanguage();

  return useMemo(() => {
    if (profile) return userProfileToCompatibilityMember(profile, lang);
    return mapProfileToCompatibilityMember(currentProfile ?? undefined);
  }, [profile, currentProfile, lang]);
}
