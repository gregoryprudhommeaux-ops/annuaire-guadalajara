import type { UserProfile } from '../types';

/** Valeurs du select « Lieux » — uniquement niveau ville (pas quartier). */
export type LocationFilterKey = '' | 'guadalajara' | 'zapopan' | 'other';

/** Filtre « Type de profil » : onglet entreprises vs membres. */
export type ProfileTypeFilterKey = '' | 'company' | 'member';

export function profileMatchesLocationFilter(
  p: UserProfile,
  key: LocationFilterKey
): boolean {
  if (!key) return true;
  const city = (p.city || '').toLowerCase().trim();

  if (key === 'zapopan') {
    return city.includes('zapopan');
  }
  if (key === 'guadalajara') {
    return city.includes('guadalajara');
  }
  if (key === 'other') {
    const isZap = city.includes('zapopan');
    const isGdl = city.includes('guadalajara');
    return !isZap && !isGdl;
  }
  return true;
}
