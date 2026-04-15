import type { CompatibilityMember } from '../types/compatibility';

/**
 * Ligne d’annuaire dont les champs correspondent déjà à ceux du scoring compatibilité.
 * (Le `DirectoryMember` de `NetworkPage.tsx` est un autre contrat : `profileUid`, `needs`, etc.)
 */
export type DirectoryMember = {
  id?: string;
  slug?: string;
  fullName?: string;
  companyName?: string;
  sector?: string;
  city?: string;
  currentNeeds?: string[];
  helpOfferText?: string;
  lookingForText?: string;
  passions?: string[];
  openness?: string[];
  keywords?: string[] | string;
};

export function mapDirectoryMemberToCompatibilityMember(
  member: DirectoryMember
): CompatibilityMember {
  return {
    id: member.id,
    slug: member.slug,
    fullName: member.fullName,
    companyName: member.companyName,
    sector: member.sector,
    city: member.city,
    currentNeeds: member.currentNeeds ?? [],
    helpOfferText: member.helpOfferText ?? '',
    lookingForText: member.lookingForText ?? '',
    passions: member.passions ?? [],
    openness: member.openness ?? [],
    keywords: member.keywords ?? [],
  };
}
