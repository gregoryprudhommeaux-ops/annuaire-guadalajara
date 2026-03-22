import type { UserProfile } from '../types';

/** Valeurs du select « Localisation » (homepage). */
export type LocationFilterKey = '' | 'centro' | 'zapopan' | 'providencia' | 'other';

/** Filtre « Type de profil » : onglet entreprises vs membres. */
export type ProfileTypeFilterKey = '' | 'company' | 'member';

export function profileMatchesLocationFilter(
  p: UserProfile,
  key: LocationFilterKey
): boolean {
  if (!key) return true;
  const city = (p.city || '').toLowerCase().trim();
  const hood = (p.neighborhood || '').toLowerCase().trim();

  if (key === 'zapopan') {
    return city.includes('zapopan');
  }
  if (key === 'providencia') {
    return hood.includes('providencia') || city.includes('providencia');
  }
  if (key === 'centro') {
    const isGdl = city.includes('guadalajara');
    const isProv = hood.includes('providencia') || city.includes('providencia');
    return isGdl && !isProv;
  }
  if (key === 'other') {
    const isZap = city.includes('zapopan');
    const isProv = hood.includes('providencia') || city.includes('providencia');
    const isGdlCentro = city.includes('guadalajara') && !isProv;
    return !isZap && !isProv && !isGdlCentro;
  }
  return true;
}
