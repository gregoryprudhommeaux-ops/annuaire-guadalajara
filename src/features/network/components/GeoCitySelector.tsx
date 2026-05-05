import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildGeoPickerOptions, geoId, type GeoIndex, type GeoKey } from '@/lib/geoDirectory';
import { useLanguage } from '@/i18n/LanguageProvider';

export type GeoCitySelectorValue = {
  country: string;
  state: string;
  city: string;
};

const INPUT_CLASS =
  'network-geo-combobox__input h-10 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 shadow-sm placeholder:font-normal placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#01696f]/30';

type GeoCitySelectorProps = {
  index: GeoIndex;
  value: GeoCitySelectorValue;
  onChange: (next: GeoCitySelectorValue) => void;
  id?: string;
};

export function GeoCitySelector({ index, value, onChange, id = 'network-geo-city' }: GeoCitySelectorProps) {
  const { lang, t } = useLanguage();
  const options = useMemo(() => buildGeoPickerOptions(index, lang, t), [index, lang, t]);
  const labelById = useMemo(() => new Map(options.map((o) => [o.id, o.label])), [options]);

  const placeholder = t('network.explorer.cityPlaceholder');
  const ariaLabel = t('network.explorer.cityAriaLabel');
  const noLocations = t('network.explorer.noLocationsYet');

  const selectedId = useMemo(() => {
    if (!value.country || !value.state || !value.city) return '';
    const idKey = geoId({ country: value.country, state: value.state, city: value.city });
    return index.geoById.has(idKey) ? idKey : '';
  }, [value.country, value.state, value.city, index.geoById]);

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = `${id}-listbox`;

  useEffect(() => {
    setInputValue(selectedId ? (labelById.get(selectedId) ?? '') : '');
  }, [selectedId, labelById]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      const trimmed = inputValue.trim();
      if (!trimmed) {
        onChange({ country: '', state: '', city: '' });
        setInputValue('');
        return;
      }
      const exact = options.find((o) => o.label.toLowerCase() === trimmed.toLowerCase());
      if (exact) {
        onChange({ country: exact.geo.country, state: exact.geo.state, city: exact.geo.city });
        setInputValue(exact.label);
        return;
      }
      setInputValue(selectedId ? (labelById.get(selectedId) ?? '') : '');
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, inputValue, options, onChange, selectedId, labelById]);

  const filtered = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.search.includes(q) || o.geo.city.toLowerCase().startsWith(q)
    );
  }, [options, inputValue]);

  const pick = (geo: GeoKey, label: string) => {
    onChange({ country: geo.country, state: geo.state, city: geo.city });
    setInputValue(label);
    setOpen(false);
  };

  const revertToSelection = () => {
    setInputValue(selectedId ? (labelById.get(selectedId) ?? '') : '');
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      revertToSelection();
      return;
    }
    if (e.key === 'Enter') {
      if (filtered.length === 1) {
        e.preventDefault();
        const o = filtered[0];
        pick(o.geo, o.label);
        return;
      }
      const exact = filtered.find((o) => o.label.toLowerCase() === inputValue.trim().toLowerCase());
      if (exact) {
        e.preventDefault();
        pick(exact.geo, exact.label);
      }
    }
  };

  if (options.length === 0) {
    return (
      <input
        id={id}
        type="text"
        disabled
        className={INPUT_CLASS}
        placeholder={noLocations}
        value=""
        readOnly
        aria-disabled="true"
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <div
      ref={wrapRef}
      className="network-geo-combobox relative w-full min-w-0 sm:min-w-[12rem] sm:flex-1"
    >
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        autoComplete="off"
        className={INPUT_CLASS}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
      />
      {open && filtered.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="network-geo-combobox__list absolute left-0 right-0 top-full z-[80] mt-1 max-h-[min(16rem,50vh)] overflow-y-auto overscroll-contain rounded-xl border border-stone-200 bg-white py-1 shadow-lg sm:max-h-60"
        >
          {filtered.map((o) => (
            <li key={o.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={o.id === selectedId}
                className="w-full px-3 py-2.5 text-left text-sm font-semibold leading-snug text-stone-800 hover:bg-stone-50 focus:bg-stone-50 focus:outline-none sm:py-2"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o.geo, o.label)}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function geoValueFromKey(g: GeoKey | null): GeoCitySelectorValue {
  return { country: g?.country ?? '', state: g?.state ?? '', city: g?.city ?? '' };
}
