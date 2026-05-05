import { countryMeansMexico, normalizeLocationToken } from '@/lib/profileLocationConsistency';

/** Même forme que `GeoKey` — évite une dépendance circulaire avec `geoDirectory`. */
export type MetroGeoInput = { country: string; state: string; city: string };

/**
 * Pays canonique dans les clés `geoId` (évite Mexique / México / Mexico en doublon).
 */
export const CANONICAL_COUNTRY_MEXICO = 'Mexico';

/**
 * Clé canonique unique pour toute la ZMG dans `geoId` / filtres (tri alphabétique cohérent).
 * Libellé affiché : `network.explorer.metroGuadalajaraZmg`.
 */
export const METRO_GUADALAJARA_ZMG_CITY_KEY = 'Grand Guadalajara';

function canonicalizeCountryForGeo(country: string): string {
  const c = String(country ?? '').trim();
  if (!c) return c;
  if (countryMeansMexico(c)) return CANONICAL_COUNTRY_MEXICO;
  return c;
}

/**
 * Noms de municipalités / villes de la ZMG de Guadalajara (INEGI), forme normalisée
 * (sans accents, minuscules), pour regrouper le « grand Guadalajara » sans filtrer par district.
 */
const GUADALAJARA_ZMG_CITIES_NORMALIZED = new Set([
  'guadalajara',
  'zapopan',
  'tlaquepaque',
  'san pedro tlaquepaque',
  'tonala',
  'tlajomulco',
  'tlajomulco de zuniga',
  'el salto',
  'juanacatlan',
  'ixtlahuacan de los membrillos',
  'zapotlanejo',
  'acatlan de juarez',
]);

function cityPartOfGuadalajaraZMG(cityNormalized: string): boolean {
  if (!cityNormalized) return false;
  return GUADALAJARA_ZMG_CITIES_NORMALIZED.has(cityNormalized);
}

/**
 * Regroupe les entrées « métropole » pour le réseau / annuaire : une ligne de filtre au lieu d’une par municipalité.
 * À étendre (Monterrey, CDMX, …) avec la même logique : liste de villes → une clé canonique + i18n.
 */
export function collapseGeoForDirectory(g: MetroGeoInput): MetroGeoInput {
  const country = canonicalizeCountryForGeo(g.country);
  const stateRaw = String(g.state ?? '').trim();
  const cityRaw = String(g.city ?? '').trim();
  const stateN = normalizeLocationToken(stateRaw);
  const cityN = normalizeLocationToken(cityRaw);

  if (!countryMeansMexico(g.country)) {
    return { country, state: stateRaw, city: cityRaw };
  }

  if (stateN === 'jalisco' && cityPartOfGuadalajaraZMG(cityN)) {
    return {
      country: CANONICAL_COUNTRY_MEXICO,
      state: 'Jalisco',
      city: METRO_GUADALAJARA_ZMG_CITY_KEY,
    };
  }

  return { country, state: stateRaw, city: cityRaw };
}

export function isGuadalajaraZmgCanonicalGeo(g: MetroGeoInput): boolean {
  return (
    normalizeLocationToken(g.city) === normalizeLocationToken(METRO_GUADALAJARA_ZMG_CITY_KEY) &&
    normalizeLocationToken(g.state) === 'jalisco' &&
    normalizeLocationToken(g.country) === 'mexico'
  );
}

/** Texte additionnel pour la recherche (synonymes hors libellé affiché). */
export function metroGeoSearchExtra(g: MetroGeoInput): string {
  if (isGuadalajaraZmgCanonicalGeo(g)) {
    return [
      'guadalajara',
      'zapopan',
      'tlaquepaque',
      'tlajomulco',
      'zmg',
      'jalisco',
      'metropolitan',
      'metropolitain',
      'agglomeration',
      'aglomeracion',
    ].join(' ');
  }
  return '';
}
