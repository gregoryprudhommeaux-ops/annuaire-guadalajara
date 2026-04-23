import React from 'react';
import type { CompanyActivitySlot, EmployeeCountRange, Language } from '@/types';
import { cn } from '@/lib/cn';

export type ProfileEditCompanyActivityCreationEmployeeProps = {
  slot: CompanyActivitySlot;
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  profileEditFrUx: boolean;
  labels: {
    employeeRange: string;
  };
  employeeCountRanges: readonly EmployeeCountRange[];
  employeeCountToSelectDefault: (v: CompanyActivitySlot['employeeCount']) => string;
  updateSlot: (slotId: string, patch: Partial<CompanyActivitySlot>) => void;
};

export default function ProfileEditCompanyActivityCreationEmployee({
  slot,
  lang,
  t,
  pickLang,
  isEditProfileRoute,
  profileEditFrUx,
  labels,
  employeeCountRanges,
  employeeCountToSelectDefault,
  updateSlot,
}: ProfileEditCompanyActivityCreationEmployeeProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', isEditProfileRoute && 'profile-grid-2')}>
      <div className="space-y-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {t('creationYear')}
        </label>
        <input
          type="number"
          value={slot.creationYear ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            updateSlot(slot.id, { creationYear: v === '' ? undefined : Number(v) });
          }}
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        />
      </div>

      <div className="space-y-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.employeeRange : t('employeeCount')}{' '}
          <span className="text-[10px] font-normal normal-case text-stone-400">
            {t('employeeCountOptional')}
          </span>
        </label>
        <select
          value={employeeCountToSelectDefault(slot.employeeCount)}
          onChange={(e) =>
            updateSlot(slot.id, {
              employeeCount: e.target.value === '' ? '' : (e.target.value as EmployeeCountRange),
            })
          }
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        >
          <option value="">
            {pickLang('— Choisir une fourchette —', '— Elegir un rango —', '— Choose a range —', lang)}
          </option>
          {employeeCountRanges.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

