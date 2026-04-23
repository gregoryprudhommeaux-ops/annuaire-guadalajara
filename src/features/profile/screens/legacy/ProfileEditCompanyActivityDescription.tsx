import React from 'react';
import type { CompanyActivitySlot, Language } from '@/types';
import { ProfileFieldHint } from '@/features/profile/components/ProfileFieldHint';

export type ProfileEditCompanyActivityDescriptionProps = {
  idx: number;
  slot: CompanyActivitySlot;
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  profileEditFrUx: boolean;
  labelFr: string;
  hintFr: string;
  hintFallback: string;
  updateSlot: (slotId: string, patch: Partial<CompanyActivitySlot>) => void;
};

export default function ProfileEditCompanyActivityDescription({
  idx,
  slot,
  lang,
  t,
  pickLang,
  profileEditFrUx,
  labelFr,
  hintFr,
  hintFallback,
  updateSlot,
}: ProfileEditCompanyActivityDescriptionProps) {
  return (
    <div className="space-y-1">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
        {profileEditFrUx ? labelFr : t('profileFormActivityDescriptionLabel')}
        <span className="text-red-500 font-semibold" aria-hidden>
          {' *'}
        </span>
      </label>
      <textarea
        id={idx === 0 ? 'profile-completion-activityDescription' : undefined}
        value={slot.activityDescription ?? ''}
        onChange={(e) => updateSlot(slot.id, { activityDescription: e.target.value })}
        rows={4}
        maxLength={4000}
        placeholder={pickLang(
          'Décrivez l’activité de cette entreprise sur ce marché…',
          'Describe la actividad de esta empresa en este mercado…',
          'Describe this company’s activity in this market…',
          lang
        )}
        className="min-h-[90px] w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
      />
      <ProfileFieldHint>{profileEditFrUx ? hintFr : hintFallback}</ProfileFieldHint>
    </div>
  );
}

