import type { GeoKey } from '@/lib/geoDirectory';
import { metroPickerLabelKey } from '@/lib/metroAreas';

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/** Métropoles : libellé court dédié marque (header, accroches). Sinon → traduction métro sans suffixe (…). */
const METRO_BRAND_I18N: Partial<Record<string, string>> = {
  'network.explorer.metroGuadalajaraZmg': 'network.explorer.brandPlaceGuadalajara',
  'network.explorer.metroValleMexico': 'network.explorer.brandPlaceCdMx',
  'network.explorer.metroMonterrey': 'network.explorer.brandPlaceMonterrey',
};

const TRAILING_PAREN = /\s*\([^)]*\)\s*$/u;

function shortenMetroLabel(translated: string): string {
  return translated.replace(TRAILING_PAREN, '').trim() || translated;
}

/**
 * Nom court affiché pour la zone réseau (filtre géo ou profil visiteur en secours).
 */
export function directoryBrandPlaceLabel(geo: GeoKey | null, t: TranslateFn): string {
  const fallback = t('network.explorer.defaultBrandPlace');
  if (!geo?.city?.trim() || !geo?.state?.trim()) {
    return fallback;
  }
  const mk = metroPickerLabelKey(geo);
  if (mk) {
    const brandKey = METRO_BRAND_I18N[mk];
    if (brandKey) return t(brandKey);
    return shortenMetroLabel(t(mk)) || fallback;
  }
  return geo.city.trim() || fallback;
}
