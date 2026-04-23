import React from 'react';
import type { Language } from '@/types';
import { ProfileSectionHint } from '@/features/profile/components/ProfileSectionHint';
import { ProfileSectionTag } from '@/features/profile/components/ProfileSectionTag';
import ProfileEditCardSection from '@/features/profile/screens/legacy/ProfileEditCardSection';

export type ProfileEditPersonSectionShellProps = {
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  identityTitle: string;
  children: React.ReactNode;
};

export default function ProfileEditPersonSectionShell({
  lang,
  t,
  pickLang,
  isEditProfileRoute,
  identityTitle,
  children,
}: ProfileEditPersonSectionShellProps) {
  return (
    <ProfileEditCardSection className={isEditProfileRoute ? 'profile-card-soft profile-stack-md' : undefined}>
      <div className="profile-section-header">
        <h2 className="m-0 min-w-0 text-sm font-semibold text-stone-900">{t('profileFormSectionPerson')}</h2>
        <ProfileSectionTag
          tone="public"
          label={pickLang('Visible publiquement', 'Visible públicamente', 'Shown on your public profile', lang)}
        />
        <ProfileSectionTag
          tone="matching"
          label={pickLang('Important pour le matching', 'Importante para el emparejamiento', 'Used for matching', lang)}
        />
      </div>

      <ProfileSectionHint tone="public">
        {pickLang(
          'Identité, moyens de contact, langues, présentation personnelle et photo.',
          'Identidad, contacto, idiomas, bio personal y foto.',
          'Identity, contact, languages, personal intro and photo.',
          lang
        )}
      </ProfileSectionHint>

      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{identityTitle}</p>

      {children}
    </ProfileEditCardSection>
  );
}

