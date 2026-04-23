import React from 'react';
import type { Language, UserProfile } from '@/types';
import { cn } from '@/lib/cn';
import { ProfileFieldHint } from '@/features/profile/components/ProfileFieldHint';

export type ProfileEditPersonContactBlockProps = {
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  profileEditFrUx: boolean;
  labels: {
    fullName: string;
    email: string;
    linkedinUrl: string;
    countryDialCode: string;
    phoneWhatsapp: string;
  };
  help: { phoneWhatsapp: string };
  formDraftT: (Partial<UserProfile> & { whatsappDial?: string; whatsappLocal?: string }) | null;
  profile: UserProfile | null;
  editingProfile: UserProfile | null;
  userEmail: string | null;
  profileWhatsappDialDefault: string;
  profileWhatsappLocalDefault: string;
  phoneDialRowsOrderedForUi: () => Array<{ dial: string }>;
  dialLabelForLang: (dial: string, lang: Language) => string;
};

export default function ProfileEditPersonContactBlock({
  lang,
  t,
  pickLang,
  isEditProfileRoute,
  profileEditFrUx,
  labels,
  help,
  formDraftT,
  profile,
  editingProfile,
  userEmail,
  profileWhatsappDialDefault,
  profileWhatsappLocalDefault,
  phoneDialRowsOrderedForUi,
  dialLabelForLang,
}: ProfileEditPersonContactBlockProps) {
  return (
    <div className={cn('profile-form-grid-2', isEditProfileRoute && 'profile-grid-2')}>
      <div className="profile-form-block--dense space-y-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.fullName : t('fullName')}
          <span className="text-red-500 font-semibold" aria-hidden>
            {' *'}
          </span>
        </label>
        <input
          id="profile-completion-fullName"
          name="fullName"
          defaultValue={formDraftT?.fullName ?? editingProfile?.fullName ?? profile?.fullName ?? ''}
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        />
      </div>

      <div className="profile-form-block--dense space-y-1">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.email : t('email')}
          <span className="text-red-500 font-semibold" aria-hidden>
            {' *'}
          </span>
        </label>
        <input
          id="profile-completion-email"
          type="email"
          name="email"
          defaultValue={formDraftT?.email ?? editingProfile?.email ?? profile?.email ?? userEmail ?? ''}
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        />
      </div>

      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 sm:col-span-2">
        {t('profileFormSubContact')}
      </p>

      <div className="profile-form-block--dense min-w-0 space-y-1 sm:col-span-2">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.linkedinUrl : t('linkedin')}
        </label>
        <input
          name="linkedin"
          id="linkedin-input"
          type="url"
          autoComplete="url"
          defaultValue={formDraftT?.linkedin ?? editingProfile?.linkedin ?? profile?.linkedin ?? ''}
          placeholder="https://linkedin.com/in/..."
          className="h-10 min-w-0 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        />
      </div>

      <div className="profile-form-block--dense min-w-0 sm:col-span-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(9rem,12rem)_1fr]">
          <div className="space-y-1">
            <label
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
              htmlFor="whatsappDial"
            >
              {profileEditFrUx ? labels.countryDialCode : t('profileFormPhoneCountryLabel')}
            </label>
            <select
              id="whatsappDial"
              name="whatsappDial"
              defaultValue={formDraftT?.whatsappDial ?? profileWhatsappDialDefault}
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-2 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
            >
              {phoneDialRowsOrderedForUi().map((row) => (
                <option key={row.dial} value={row.dial}>
                  {dialLabelForLang(row.dial, lang)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
              htmlFor="whatsappLocal"
            >
              {profileEditFrUx ? labels.phoneWhatsapp : t('profileFormPhoneLocalLabel')}
              <span className="text-red-500 font-semibold" aria-hidden>
                {' *'}
              </span>
            </label>
            <input
              id="whatsappLocal"
              type="tel"
              name="whatsappLocal"
              defaultValue={formDraftT?.whatsappLocal ?? profileWhatsappLocalDefault}
              placeholder={pickLang('ex. 33 1234 5678', 'ej. 33 1234 5678', 'e.g. 33 1234 5678', lang)}
              autoComplete="tel-national"
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
            />
            <ProfileFieldHint>
              {pickLang(help.phoneWhatsapp, 'Número sin repetir el prefijo internacional.', 'Number without repeating the country prefix.', lang)}
            </ProfileFieldHint>
          </div>
        </div>
      </div>
    </div>
  );
}

