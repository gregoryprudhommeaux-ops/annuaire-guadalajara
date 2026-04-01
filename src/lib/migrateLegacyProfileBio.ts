import { deleteField, doc, updateDoc, type Firestore } from 'firebase/firestore';
import type { UserProfile } from '../types';
import { normalizeProfileCompanyActivities, slotsToFirestoreList } from './companyActivities';

/** Ancienne fiche : un seul champ `bio` — on le duplique vers `memberBio` et les descriptions d’activité. */
export function profileNeedsLegacyBioMigration(p: UserProfile): boolean {
  const bio = String(p.bio ?? '').trim();
  if (!bio) return false;
  if (String(p.memberBio ?? '').trim()) return false;
  return true;
}

/**
 * Écrit `memberBio`, recopie le texte dans chaque ligne `activityDescription` vide,
 * supprime `bio` / `bioTranslations`. Idempotent si `memberBio` est déjà renseigné.
 */
export async function migrateLegacyBioToMemberAndActivity(
  db: Firestore,
  uid: string,
  p: UserProfile
): Promise<UserProfile | null> {
  if (!profileNeedsLegacyBioMigration(p)) return null;

  const bio = String(p.bio ?? '').trim();
  const slots = normalizeProfileCompanyActivities(p).map((slot) => ({
    ...slot,
    activityDescription:
      String(slot.activityDescription ?? '').trim() || bio || undefined,
  }));
  const companyActivities = slotsToFirestoreList(slots);

  const ref = doc(db, 'users', uid);
  const patch: Record<string, unknown> = {
    memberBio: bio,
    companyActivities,
    bio: deleteField(),
    bioTranslations: deleteField(),
  };
  if (p.bioTranslations && Object.keys(p.bioTranslations).length > 0) {
    patch.memberBioTranslations = p.bioTranslations;
  } else {
    patch.memberBioTranslations = deleteField();
  }

  await updateDoc(ref, patch);

  const next: UserProfile = {
    ...p,
    memberBio: bio,
    memberBioTranslations:
      p.bioTranslations && Object.keys(p.bioTranslations).length > 0
        ? p.bioTranslations
        : undefined,
    companyActivities,
    bio: undefined,
    bioTranslations: undefined,
  };
  return next;
}
