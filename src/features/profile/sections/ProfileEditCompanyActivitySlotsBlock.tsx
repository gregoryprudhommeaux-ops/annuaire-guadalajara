import React from 'react';
import type { CompanyActivitySlot, EmployeeCountRange, Language } from '@/types';

import ProfileEditCompanyActivitySlotCard from '@/features/profile/screens/legacy/ProfileEditCompanyActivitySlotCard';
import ProfileEditCompanyActivityBasics from '@/features/profile/screens/legacy/ProfileEditCompanyActivityBasics';
import ProfileEditCompanyActivityLocation from '@/features/profile/screens/legacy/ProfileEditCompanyActivityLocation';
import ProfileEditCompanyActivityCountryRole from '@/features/profile/screens/legacy/ProfileEditCompanyActivityCountryRole';
import ProfileEditCompanyActivityArrivalYear from '@/features/profile/screens/legacy/ProfileEditCompanyActivityArrivalYear';
import ProfileEditCompanyActivityCreationEmployee from '@/features/profile/screens/legacy/ProfileEditCompanyActivityCreationEmployee';
import ProfileEditCompanyActivityKindStatus from '@/features/profile/screens/legacy/ProfileEditCompanyActivityKindStatus';
import ProfileEditCompanyActivityDescription from '@/features/profile/screens/legacy/ProfileEditCompanyActivityDescription';

export type ProfileEditCompanyActivitySlotsBlockProps = {
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  profileEditFrUx: boolean;

  slots: CompanyActivitySlot[];
  setSlots: React.Dispatch<React.SetStateAction<CompanyActivitySlot[]>>;
  emptySlot: () => CompanyActivitySlot;

  collapsedById: Record<string, boolean | undefined>;
  setCollapsedById: React.Dispatch<React.SetStateAction<Record<string, boolean | undefined>>>;

  updateSlot: (slotId: string, patch: Partial<CompanyActivitySlot>) => void;

  labels: {
    companyName: string;
    companyWebsite: string;
    sector: string;
    city: string;
    district: string;
    state: string;
    country: string;
    roleInCompany: string;
    arrivalYearInMexico: string;
    employeeRange: string;
    companyType: string;
    professionalStatus: string;
    typicalClientSizes: string;
    activityDescription: string;
  };
  help: {
    country: string;
    roleInCompany: string;
    arrivalYearInMexico: string;
    activityDescription: string;
  };

  activityCategories: readonly string[];
  activityCategoryLabel: (c: string, lang: Language) => string;

  cities: readonly string[];
  cityOptionLabel: (c: string, lang: Language) => string;

  workFunctionOptions: readonly string[];
  workFunctionLabel: (opt: string, lang: Language) => string;

  employeeCountRanges: readonly EmployeeCountRange[];
  employeeCountToSelectDefault: (v: CompanyActivitySlot['employeeCount']) => string;

  TypicalClientSizesDropdown: React.ComponentType<{
    fieldId: string;
    value: string[];
    onChange: (next: string[]) => void;
    lang: Language;
    emptyLabel: string;
    maxHint: string;
  }>;

  icons: {
    Trash2: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    ChevronDown: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    ChevronRight: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    Plus: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  };
};

export default function ProfileEditCompanyActivitySlotsBlock({
  lang,
  t,
  pickLang,
  isEditProfileRoute,
  profileEditFrUx,
  slots,
  setSlots,
  emptySlot,
  collapsedById,
  setCollapsedById,
  updateSlot,
  labels,
  help,
  activityCategories,
  activityCategoryLabel,
  cities,
  cityOptionLabel,
  workFunctionOptions,
  workFunctionLabel,
  employeeCountRanges,
  employeeCountToSelectDefault,
  TypicalClientSizesDropdown,
  icons,
}: ProfileEditCompanyActivitySlotsBlockProps) {
  const { Trash2, ChevronDown, ChevronRight, Plus } = icons;
  const L = labels;
  const H = help;

  return (
    <>
      <p className="mb-3 text-xs font-medium text-stone-700">
        {slots
          .map((s) => s.companyName.trim())
          .filter(Boolean)
          .join(' | ') || pickLang('—', '—', '—', lang)}
      </p>

      <div className="space-y-4">
        {slots.map((slot, idx) => {
          const collapsed = collapsedById[slot.id] === true;
          return (
            <ProfileEditCompanyActivitySlotCard
              key={slot.id}
              collapsed={collapsed}
              onToggleCollapsed={() =>
                setCollapsedById((p) => ({
                  ...p,
                  [slot.id]: !(p[slot.id] === true),
                }))
              }
              title={
                <>
                  {t('profileFormCompanyActivityBlockTitle')} {idx + 1}
                </>
              }
              subtitle={slot.companyName.trim() ? slot.companyName.trim() : undefined}
              canRemove={slots.length > 1}
              onRemove={() =>
                setSlots((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== slot.id)))
              }
              removeIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
              removeLabel={t('profileFormRemoveCompanyActivity')}
              leadingToggleIcon={<ChevronDown className="h-4 w-4" aria-hidden />}
              trailingToggleIcon={<ChevronRight className="h-4 w-4" aria-hidden />}
            >
              {!collapsed ? (
                <div className="space-y-4 border-t border-stone-100 pt-3">
                  <ProfileEditCompanyActivityBasics
                    idx={idx}
                    slot={slot}
                    lang={lang}
                    t={t}
                    pickLang={pickLang}
                    profileEditFrUx={profileEditFrUx}
                    labels={{
                      companyName: L.companyName,
                      companyWebsite: L.companyWebsite,
                      sector: L.sector,
                    }}
                    activityCategories={activityCategories}
                    activityCategoryLabel={activityCategoryLabel}
                    updateSlot={updateSlot}
                  />

                  <ProfileEditCompanyActivityLocation
                    slot={slot}
                    lang={lang}
                    t={t}
                    pickLang={pickLang}
                    profileEditFrUx={profileEditFrUx}
                    isEditProfileRoute={isEditProfileRoute}
                    labels={{
                      city: L.city,
                      district: L.district,
                      state: L.state,
                    }}
                    cities={cities}
                    cityOptionLabel={cityOptionLabel}
                    updateSlot={updateSlot}
                  />

                  <ProfileEditCompanyActivityCountryRole
                    slot={slot}
                    lang={lang}
                    t={t}
                    pickLang={pickLang}
                    profileEditFrUx={profileEditFrUx}
                    labels={{
                      country: L.country,
                      roleInCompany: L.roleInCompany,
                    }}
                    help={{
                      country: H.country,
                      roleInCompany: H.roleInCompany,
                    }}
                    workFunctionOptions={workFunctionOptions}
                    workFunctionLabel={workFunctionLabel}
                    updateSlot={updateSlot}
                  />

                  {idx === 0 ? (
                    <ProfileEditCompanyActivityArrivalYear
                      slot={slot}
                      t={t}
                      profileEditFrUx={profileEditFrUx}
                      label={L.arrivalYearInMexico}
                      hintFr={H.arrivalYearInMexico}
                      hintFallback={t('profileFormArrivalRegionHint')}
                      updateSlot={updateSlot}
                    />
                  ) : null}

                  <ProfileEditCompanyActivityCreationEmployee
                    slot={slot}
                    lang={lang}
                    t={t}
                    pickLang={pickLang}
                    isEditProfileRoute={isEditProfileRoute}
                    profileEditFrUx={profileEditFrUx}
                    labels={{ employeeRange: L.employeeRange }}
                    employeeCountRanges={employeeCountRanges}
                    employeeCountToSelectDefault={employeeCountToSelectDefault}
                    updateSlot={updateSlot}
                  />

                  <ProfileEditCompanyActivityKindStatus
                    slot={slot}
                    lang={lang}
                    t={t}
                    pickLang={pickLang}
                    isEditProfileRoute={isEditProfileRoute}
                    profileEditFrUx={profileEditFrUx}
                    labels={{
                      companyType: L.companyType,
                      professionalStatus: L.professionalStatus,
                      typicalClientSizes: L.typicalClientSizes,
                    }}
                    updateSlot={updateSlot}
                    TypicalClientSizesDropdown={TypicalClientSizesDropdown}
                  />

                  <ProfileEditCompanyActivityDescription
                    idx={idx}
                    slot={slot}
                    lang={lang}
                    t={t}
                    pickLang={pickLang}
                    profileEditFrUx={profileEditFrUx}
                    labelFr={L.activityDescription}
                    hintFr={H.activityDescription}
                    hintFallback={t('profileFormActivityDescriptionHint')}
                    updateSlot={updateSlot}
                  />
                </div>
              ) : null}
            </ProfileEditCompanyActivitySlotCard>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setSlots((prev) => [...prev, emptySlot()])}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white py-2.5 text-xs font-semibold text-stone-700 hover:border-stone-400 hover:bg-stone-50"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t('profileFormAddCompanyActivity')}
      </button>
    </>
  );
}

