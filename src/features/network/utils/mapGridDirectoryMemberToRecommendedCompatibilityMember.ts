import type { RecommendedCompatibilityMember } from './compatibilityFromProfile';

/** Sous-ensemble des champs grille annuaire (`DirectoryMember` dans `NetworkPage.tsx`). */
export type GridDirectoryMemberRow = {
  profileUid: string;
  slug?: string;
  fullName: string;
  companyName?: string;
  sector?: string;
  needs?: string[];
  photoUrl?: string;
  locationKey?: string;
};

export function mapGridDirectoryMemberToRecommendedCompatibilityMember(
  m: GridDirectoryMemberRow
): RecommendedCompatibilityMember {
  const uid = m.profileUid.trim();
  const slug = (m.slug ?? uid).trim() || uid;
  return {
    id: uid,
    slug,
    fullName: m.fullName,
    companyName: m.companyName,
    sector: m.sector,
    city: m.locationKey,
    currentNeeds: m.needs ?? [],
    helpOfferText: '',
    lookingForText: '',
    passions: [],
    openness: [],
    keywords: [],
    photoURL: m.photoUrl?.trim() || undefined,
  };
}
