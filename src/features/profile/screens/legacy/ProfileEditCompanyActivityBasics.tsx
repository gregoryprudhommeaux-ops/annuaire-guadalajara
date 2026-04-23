import React from 'react';
import type { CompanyActivitySlot, Language } from '@/types';

export type ProfileEditCompanyActivityBasicsProps = {
  idx: number;
  slot: CompanyActivitySlot;
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  profileEditFrUx: boolean;
  labels: {
    companyName: string;
    companyWebsite: string;
    sector: string;
  };
  activityCategories: readonly string[];
  activityCategoryLabel: (c: string, lang: Language) => string;
  updateSlot: (slotId: string, patch: Partial<CompanyActivitySlot>) => void;
};

export default function ProfileEditCompanyActivityBasics({
  idx,
  slot,
  lang,
  t,
  pickLang,
  profileEditFrUx,
  labels,
  activityCategories,
  activityCategoryLabel,
  updateSlot,
}: ProfileEditCompanyActivityBasicsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
            {profileEditFrUx ? labels.companyName : t('companyName')}
            <span className="text-red-500 font-semibold" aria-hidden>
              {' *'}
            </span>
          </label>
          <input
            id={idx === 0 ? 'profile-completion-companyName' : undefined}
            value={slot.companyName}
            onChange={(e) => updateSlot(slot.id, { companyName: e.target.value })}
            className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
          />
        </div>
        <div className="space-y-1">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
            {profileEditFrUx ? labels.companyWebsite : t('website')}
            <span className="text-red-500 font-semibold" aria-hidden>
              {' *'}
            </span>
          </label>
          <input
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://..."
            value={slot.website ?? ''}
            onChange={(e) => updateSlot(slot.id, { website: e.target.value })}
            className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.sector : t('activityCategory')}
          <span className="text-red-500 font-semibold" aria-hidden>
            {' *'}
          </span>
        </label>
        <select
          value={slot.activityCategory || ''}
          onChange={(e) => updateSlot(slot.id, { activityCategory: e.target.value || undefined })}
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        >
          <option value="">{pickLang('— Secteur —', '— Sector —', '— Sector —', lang)}</option>
          {activityCategories.map((c) => (
            <option key={c} value={c}>
              {activityCategoryLabel(c, lang)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

