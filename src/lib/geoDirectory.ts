import type { UserProfile } from '@/types';

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

