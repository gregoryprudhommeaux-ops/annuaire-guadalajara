import React from 'react';
import type { CompanyActivitySlot, Language } from '@/types';
import { cn } from '@/lib/cn';

export type ProfileEditCompanyActivityLocationProps = {
  slot: CompanyActivitySlot;
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  profileEditFrUx: boolean;
  isEditProfileRoute: boolean;
  labels: {
    city: string;
    district: string;
    state: string;
  };
  cities: readonly string[];
  cityOptionLabel: (c: string, lang: Language) => string;
  updateSlot: (slotId: string, patch: Partial<CompanyActivitySlot>) => void;
};

export default function ProfileEditCompanyActivityLocation({
  slot,
  lang,
  t,
  pickLang,
  profileEditFrUx,
  isEditProfileRoute,
  labels,
  cities,
  cityOptionLabel,
  updateSlot,
}: ProfileEditCompanyActivityLocationProps) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-4 md:grid-cols-3', isEditProfileRoute && 'profile-grid-3')}
    >
      <div className="space-y-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.city : t('city')}
          <span className="text-red-500 font-semibold" aria-hidden>
            {' *'}
          </span>
        </label>
        <select
          value={slot.city || ''}
          onChange={(e) => updateSlot(slot.id, { city: e.target.value })}
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        >
          <option value="">{pickLang('— Ville —', '— Ciudad —', '— City —', lang)}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {cityOptionLabel(c, lang)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.district : t('neighborhood')}
        </label>
        <input
          value={slot.neighborhood ?? ''}
          onChange={(e) => updateSlot(slot.id, { neighborhood: e.target.value })}
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        />
      </div>
      <div className="space-y-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.state : t('state')}
          <span className="text-red-500 font-semibold" aria-hidden>
            {' *'}
          </span>
        </label>
        <input
          value={slot.state ?? ''}
          placeholder={pickLang('Jalisco', 'Jalisco', 'Jalisco', lang)}
          onChange={(e) => updateSlot(slot.id, { state: e.target.value })}
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        />
      </div>
    </div>
  );
}

