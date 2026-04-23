import React from 'react';
import type { CompanyActivitySlot, CommunityCompanyKind, CommunityMemberStatus, Language } from '@/types';
import { cn } from '@/lib/cn';

export type ProfileEditCompanyActivityKindStatusProps = {
  slot: CompanyActivitySlot;
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  profileEditFrUx: boolean;
  labels: {
    companyType: string;
    professionalStatus: string;
    typicalClientSizes: string;
  };
  updateSlot: (slotId: string, patch: Partial<CompanyActivitySlot>) => void;
  TypicalClientSizesDropdown: React.ComponentType<{
    fieldId: string;
    value: string[];
    onChange: (next: string[]) => void;
    lang: Language;
    emptyLabel: string;
    maxHint: string;
  }>;
};

export default function ProfileEditCompanyActivityKindStatus({
  slot,
  lang,
  t,
  pickLang,
  isEditProfileRoute,
  profileEditFrUx,
  labels,
  updateSlot,
  TypicalClientSizesDropdown,
}: ProfileEditCompanyActivityKindStatusProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-3', isEditProfileRoute && 'profile-grid-3')}>
      <div className="space-y-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.companyType : t('profileFormCompanyType')}
          <span className="text-red-500 font-semibold" aria-hidden>
            {' *'}
          </span>
        </label>
        <select
          required
          value={slot.communityCompanyKind ?? ''}
          onChange={(e) =>
            updateSlot(slot.id, {
              communityCompanyKind: (e.target.value as CommunityCompanyKind) || undefined,
            })
          }
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        >
          <option value="" disabled>
            {pickLang('— Choisir —', '— Elegir —', '— Choose —', lang)}
          </option>
          <option value="startup">Startup</option>
          <option value="pme">PME / SME</option>
          <option value="corporate">Corporate</option>
          <option value="independent">{pickLang('Indépendant', 'Independiente', 'Independent', lang)}</option>
          <option value="association">{pickLang('Association', 'Asociación', 'Association', lang)}</option>
          <option value="nonprofit">{pickLang('Non profit', 'Sin fines de lucro', 'Non-profit', lang)}</option>
          <option value="club">{pickLang('Club', 'Club', 'Club', lang)}</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.professionalStatus : t('profileFormProfessionalStatus')}
          <span className="text-red-500 font-semibold" aria-hidden>
            {' *'}
          </span>
        </label>
        <select
          required
          value={slot.communityMemberStatus ?? ''}
          onChange={(e) =>
            updateSlot(slot.id, {
              communityMemberStatus: (e.target.value as CommunityMemberStatus) || undefined,
            })
          }
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        >
          <option value="" disabled>
            {pickLang('— Choisir —', '— Elegir —', '— Choose —', lang)}
          </option>
          <option value="freelance">Freelance</option>
          <option value="employee">{pickLang('Salarié', 'Asalariado', 'Employee', lang)}</option>
          <option value="owner">
            {pickLang('Dirigeant / fondateur', 'Director / fundador', 'Owner / founder', lang)}
          </option>
          <option value="volunteer">{pickLang('Bénévole', 'Voluntario(a)', 'Volunteer', lang)}</option>
        </select>
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`typicalClientSizes-${slot.id}`}
          className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
        >
          {profileEditFrUx ? labels.typicalClientSizes : t('contactPrefsClientSizeLabel')}
        </label>
        <TypicalClientSizesDropdown
          fieldId={`typicalClientSizes-${slot.id}`}
          value={slot.typicalClientSizes ?? []}
          onChange={(next) =>
            updateSlot(slot.id, { typicalClientSizes: next as CompanyActivitySlot['typicalClientSizes'] })
          }
          lang={lang}
          emptyLabel={t('contactPrefsClientSizeEmpty')}
          maxHint={t('contactPrefsClientSizeMaxHint')}
        />
        <p className="mt-1 text-[10px] text-stone-400">{t('contactPrefsClientSizeHint')}</p>
      </div>
    </div>
  );
}

