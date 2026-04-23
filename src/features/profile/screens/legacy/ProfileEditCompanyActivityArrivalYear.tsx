import React from 'react';
import type { CompanyActivitySlot } from '@/types';
import { ProfileFieldHint } from '@/features/profile/components/ProfileFieldHint';

export type ProfileEditCompanyActivityArrivalYearProps = {
  slot: CompanyActivitySlot;
  t: (key: string) => string;
  profileEditFrUx: boolean;
  label: string;
  hintFr: string;
  hintFallback: string;
  updateSlot: (slotId: string, patch: Partial<CompanyActivitySlot>) => void;
};

export default function ProfileEditCompanyActivityArrivalYear({
  slot,
  t,
  profileEditFrUx,
  label,
  hintFr,
  hintFallback,
  updateSlot,
}: ProfileEditCompanyActivityArrivalYearProps) {
  return (
    <div className="space-y-1">
      <label
        className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
        htmlFor="profile-arrival-year"
      >
        {profileEditFrUx ? label : t('arrivalYear')}
      </label>
      <input
        id="profile-arrival-year"
        type="number"
        value={slot.arrivalYear ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          updateSlot(slot.id, { arrivalYear: v === '' ? undefined : Number(v) });
        }}
        className="h-10 w-full max-w-xs rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
      />
      <ProfileFieldHint>{profileEditFrUx ? hintFr : hintFallback}</ProfileFieldHint>
    </div>
  );
}

