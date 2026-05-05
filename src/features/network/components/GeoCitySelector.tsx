import React, { useMemo } from 'react';
import type { GeoIndex, GeoKey } from '@/lib/geoDirectory';

export type GeoCitySelectorValue = {
  country: string;
  state: string;
  city: string;
};

export function GeoCitySelector({
  index,
  value,
  onChange,
}: {
  index: GeoIndex;
  value: GeoCitySelectorValue;
  onChange: (next: GeoCitySelectorValue) => void;
}) {
  const states = useMemo(() => {
    if (!value.country) return [];
    return index.statesByCountry.get(value.country) ?? [];
  }, [index.statesByCountry, value.country]);

  const cities = useMemo(() => {
    if (!value.country || !value.state) return [];
    return index.citiesByCountryState.get(`${value.country}||${value.state}`) ?? [];
  }, [index.citiesByCountryState, value.country, value.state]);

  const selectBase =
    'h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#01696f]/30';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className={selectBase}
        value={value.country}
        onChange={(e) => {
          const country = e.target.value;
          const nextStates = index.statesByCountry.get(country) ?? [];
          const state = nextStates[0] ?? '';
          const nextCities = state ? index.citiesByCountryState.get(`${country}||${state}`) ?? [] : [];
          const city = nextCities[0] ?? '';
          onChange({ country, state, city });
        }}
      >
        <option value="">Pays</option>
        {index.countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        className={selectBase}
        value={value.state}
        disabled={!value.country}
        onChange={(e) => {
          const state = e.target.value;
          const nextCities = value.country ? index.citiesByCountryState.get(`${value.country}||${state}`) ?? [] : [];
          const city = nextCities[0] ?? '';
          onChange({ country: value.country, state, city });
        }}
      >
        <option value="">{value.country ? 'État/Région' : 'État/Région'}</option>
        {states.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        className={selectBase}
        value={value.city}
        disabled={!value.country || !value.state}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
      >
        <option value="">{value.state ? 'Ville' : 'Ville'}</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

export function geoValueFromKey(g: GeoKey | null): GeoCitySelectorValue {
  return { country: g?.country ?? '', state: g?.state ?? '', city: g?.city ?? '' };
}

