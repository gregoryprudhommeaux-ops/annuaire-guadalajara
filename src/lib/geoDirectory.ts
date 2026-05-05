import type { Language, UserProfile } from '@/types';

export type GeoKey = {
  country: string;
  state: string;
  city: string;
};

function clean(s: unknown): string {
  return String(s ?? '').trim();
}

export function normalizeGeo(p: Pick<UserProfile, 'country' | 'state' | 'city'>): GeoKey | null {
  const country = clean(p.country);
  const state = clean(p.state);
  const city = clean(p.city);
  if (!country || !state || !city) return null;
  return { country, state, city };
}

export function geoId(g: GeoKey): string {
  return `${g.country}||${g.state}||${g.city}`.toLowerCase();
}

export function geoLabel(g: GeoKey): string {
  return `${g.city} · ${g.state}`;
}

export type GeoIndex = {
  countries: string[];
  statesByCountry: Map<string, string[]>;
  citiesByCountryState: Map<string, string[]>;
  geoById: Map<string, GeoKey>;
};

/** Libellé pour une ligne du sélecteur « ville seule » : ville seule si unique, sinon précision état / pays. */
export function geoPickerOptionLabel(g: GeoKey, all: GeoKey[]): string {
  const id = geoId(g);
  const cityL = g.city.toLowerCase();
  const dupCity = all.some((x) => geoId(x) !== id && x.city.toLowerCase() === cityL);
  if (!dupCity) return g.city;
  const dupCityState = all.some(
    (x) =>
      geoId(x) !== id &&
      x.city.toLowerCase() === cityL &&
      x.state.toLowerCase() === g.state.toLowerCase()
  );
  if (!dupCityState) return `${g.city} · ${g.state}`;
  return `${g.city} · ${g.state} · ${g.country}`;
}

export type GeoPickerOption = {
  id: string;
  label: string;
  /** Texte pour filtrer (ville, état, pays). */
  search: string;
  geo: GeoKey;
};

export function buildGeoPickerOptions(index: GeoIndex, sortLocale: Language = 'fr'): GeoPickerOption[] {
  const all = Array.from(index.geoById.values());
  if (all.length === 0) return [];

  const options: GeoPickerOption[] = all.map((geo) => {
    const id = geoId(geo);
    return {
      id,
      label: geoPickerOptionLabel(geo, all),
      search: `${geo.city} ${geo.state} ${geo.country}`.toLowerCase(),
      geo,
    };
  });

  const loc = sortLocale === 'es' ? 'es' : sortLocale === 'en' ? 'en' : 'fr';
  options.sort((a, b) => {
    const c = a.geo.city.localeCompare(b.geo.city, loc, { sensitivity: 'base' });
    if (c !== 0) return c;
    const s = a.geo.state.localeCompare(b.geo.state, loc, { sensitivity: 'base' });
    if (s !== 0) return s;
    return a.geo.country.localeCompare(b.geo.country, loc, { sensitivity: 'base' });
  });

  return options;
}

export function buildGeoIndex(profiles: Array<Pick<UserProfile, 'country' | 'state' | 'city'>>): GeoIndex {
  const countriesSet = new Set<string>();
  const statesByCountry = new Map<string, Set<string>>();
  const citiesByCountryState = new Map<string, Set<string>>();
  const geoById = new Map<string, GeoKey>();

  for (const p of profiles) {
    const g = normalizeGeo(p);
    if (!g) continue;
    countriesSet.add(g.country);
    const kCountry = g.country;
    const kState = `${g.country}||${g.state}`;
    if (!statesByCountry.has(kCountry)) statesByCountry.set(kCountry, new Set());
    statesByCountry.get(kCountry)!.add(g.state);
    if (!citiesByCountryState.has(kState)) citiesByCountryState.set(kState, new Set());
    citiesByCountryState.get(kState)!.add(g.city);
    geoById.set(geoId(g), g);
  }

  const countries = Array.from(countriesSet).sort((a, b) => a.localeCompare(b));
  const statesByCountryOut = new Map<string, string[]>();
  const citiesByCountryStateOut = new Map<string, string[]>();

  countries.forEach((c) => {
    const states = Array.from(statesByCountry.get(c) ?? []).sort((a, b) => a.localeCompare(b));
    statesByCountryOut.set(c, states);
    states.forEach((s) => {
      const k = `${c}||${s}`;
      const cities = Array.from(citiesByCountryState.get(k) ?? []).sort((a, b) => a.localeCompare(b));
      citiesByCountryStateOut.set(k, cities);
    });
  });

  return {
    countries,
    statesByCountry: statesByCountryOut,
    citiesByCountryState: citiesByCountryStateOut,
    geoById,
  };
}

