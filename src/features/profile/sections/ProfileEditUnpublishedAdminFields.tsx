import React from 'react';
import type { Language } from '@/types';
import { cn } from '@/lib/cn';

type TFn = (key: string) => string;

export type ProfileEditUnpublishedAdminFieldsProps = {
  lang: Language;
  t: TFn;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  profileEditFrUx: boolean;
  labels: {
    gender: string;
    nationality: string;
    hostDelegations: string;
  };
  help: {
    genderFr: string;
  };
  formDraftT: any;
  formDraftC: any;
  formAdminPrivate: any;
  nationalityOptions: readonly { code: string }[];
  nationalityLabel: (code: string, lang: Language) => string;
  ProfileFieldHint: React.ComponentType<{ children: React.ReactNode }>;
};

export default function ProfileEditUnpublishedAdminFields({
  lang,
  t,
  pickLang,
  isEditProfileRoute,
  profileEditFrUx,
  labels,
  help,
  formDraftT,
  formDraftC,
  formAdminPrivate,
  nationalityOptions,
  nationalityLabel,
  ProfileFieldHint,
}: ProfileEditUnpublishedAdminFieldsProps) {
  return (
    <div className={cn('profile-form-grid-2', isEditProfileRoute && 'profile-grid-2')}>
      <div className="profile-form-block--dense space-y-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.gender : t('genderStatLabel')}
        </label>
        <select
          name="genderStat"
          defaultValue={formDraftT?.genderStat ?? formAdminPrivate.genderStat ?? ''}
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        >
          <option value="">{t('genderStatSelectPlaceholder')}</option>
          <option value="male">{t('genderStatMale')}</option>
          <option value="female">{t('genderStatFemale')}</option>
          <option value="other">{t('genderStatOther')}</option>
          <option value="prefer_not_say">{t('genderStatPreferNotSay')}</option>
        </select>
        <ProfileFieldHint>
          {pickLang(help.genderFr, 'Solo con fines estadísticos.', 'For internal statistics only.', lang)}
        </ProfileFieldHint>
      </div>

      <div className="profile-form-block--dense space-y-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.nationality : t('nationalityLabel')}
        </label>
        <select
          name="nationality"
          defaultValue={formDraftT?.nationality ?? formAdminPrivate.nationality ?? ''}
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        >
          <option value="">{t('nationalitySelectPlaceholder')}</option>
          {nationalityOptions.map((o) => (
            <option key={o.code} value={o.code}>
              {nationalityLabel(o.code, lang)}
            </option>
          ))}
        </select>
        <ProfileFieldHint>{t('nationalityHint')}</ProfileFieldHint>
      </div>

      <div className="profile-form-block--dense sm:col-span-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-3 sm:px-4 sm:py-3">
          <div
            className={cn(
              'flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-8',
              isEditProfileRoute && 'inline-checkboxes'
            )}
          >
            <label className="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg py-0.5 pr-1 hover:bg-stone-100/80">
              <input
                type="checkbox"
                name="openToEventSponsoring"
                defaultChecked={
                  formDraftC?.openToEventSponsoring ?? formAdminPrivate.openToEventSponsoring === true
                }
                className="h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <span className="text-sm font-medium text-stone-800">{t('contactPrefsOpenEventSponsoring')}</span>
            </label>
            <label className="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg py-0.5 pr-1 hover:bg-stone-100/80">
              <input
                type="checkbox"
                name="acceptsDelegationVisits"
                defaultChecked={
                  formDraftC?.acceptsDelegationVisits ?? formAdminPrivate.acceptsDelegationVisits === true
                }
                className="h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <span className="text-sm font-medium text-stone-800">
                {profileEditFrUx ? labels.hostDelegations : t('acceptsDelegationVisitsLabel')}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

