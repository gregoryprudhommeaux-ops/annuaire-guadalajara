import React from 'react';
import type { CompanyActivitySlot, Language } from '@/types';
import { ProfileFieldHint } from '@/features/profile/components/ProfileFieldHint';

export type ProfileEditCompanyActivityCountryRoleProps = {
  slot: CompanyActivitySlot;
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  profileEditFrUx: boolean;
  labels: {
    country: string;
    roleInCompany: string;
  };
  help: {
    country: string;
    roleInCompany: string;
  };
  workFunctionOptions: readonly string[];
  workFunctionLabel: (opt: string, lang: Language) => string;
  updateSlot: (slotId: string, patch: Partial<CompanyActivitySlot>) => void;
};

export default function ProfileEditCompanyActivityCountryRole({
  slot,
  lang,
  t,
  pickLang,
  profileEditFrUx,
  labels,
  help,
  workFunctionOptions,
  workFunctionLabel,
  updateSlot,
}: ProfileEditCompanyActivityCountryRoleProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="space-y-1 md:col-span-2">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.country : t('country')}
          <span className="text-red-500 font-semibold" aria-hidden>
            {' *'}
          </span>
        </label>
        <input
          value={slot.country ?? ''}
          placeholder={pickLang('Mexique', 'México', 'Mexico', lang)}
          onChange={(e) => updateSlot(slot.id, { country: e.target.value })}
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        />
        <ProfileFieldHint>{profileEditFrUx ? help.country : t('profileFormCountryFootnote')}</ProfileFieldHint>
      </div>

      <div className="space-y-1 md:col-span-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.roleInCompany : t('workFunction')}
          <span className="text-red-500 font-semibold" aria-hidden>
            {' *'}
          </span>
        </label>
        <select
          value={slot.positionCategory || ''}
          onChange={(e) => updateSlot(slot.id, { positionCategory: e.target.value })}
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        >
          <option value="">{t('selectWorkFunction')}</option>
          {workFunctionOptions.map((opt) => (
            <option key={opt} value={opt}>
              {workFunctionLabel(opt, lang)}
            </option>
          ))}
        </select>
        <ProfileFieldHint>{profileEditFrUx ? help.roleInCompany : t('workFunctionHint')}</ProfileFieldHint>
      </div>
    </div>
  );
}

