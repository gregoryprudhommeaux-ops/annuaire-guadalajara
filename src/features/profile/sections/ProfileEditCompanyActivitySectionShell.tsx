import React from 'react';
import type { Language } from '@/types';
import { ProfileSectionHint } from '@/features/profile/components/ProfileSectionHint';
import { ProfileSectionTag } from '@/features/profile/components/ProfileSectionTag';
import ProfileEditCardSection from '@/features/profile/screens/legacy/ProfileEditCardSection';

export type ProfileEditCompanyActivitySectionShellProps = {
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  children: React.ReactNode;
};

export default function ProfileEditCompanyActivitySectionShell({
  lang,
  t,
  pickLang,
  isEditProfileRoute,
  children,
}: ProfileEditCompanyActivitySectionShellProps) {
  return (
    <ProfileEditCardSection
      className={
        'space-y-3 rounded-xl border border-stone-200 bg-stone-50/40 p-4' +
        (isEditProfileRoute ? ' profile-card-soft profile-stack-md' : '')
      }
    >
      <div className="profile-section-header">
        <h2 className="m-0 min-w-0 text-sm font-semibold text-stone-900">{t('profileFormSectionCompanyActivity')}</h2>
        <ProfileSectionTag
          tone="public"
          label={pickLang('Visible publiquement', 'Visible públicamente', 'Shown on your public profile', lang)}
        />
        <ProfileSectionTag
          tone="matching"
          label={pickLang('Important pour le matching', 'Importante para el emparejamiento', 'Used for matching', lang)}
        />
      </div>
      <ProfileSectionHint tone="public">{t('profileFormCompanyDetailsIntro')}</ProfileSectionHint>
      {children}
    </ProfileEditCardSection>
  );
}

