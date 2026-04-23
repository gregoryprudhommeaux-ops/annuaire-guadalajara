import React from 'react';
import type { Language } from '@/types';
import { ProfileSectionHint } from '@/features/profile/components/ProfileSectionHint';
import { ProfileSectionTag } from '@/features/profile/components/ProfileSectionTag';
import ProfileEditCardSection from '@/features/profile/screens/legacy/ProfileEditCardSection';

export type ProfileEditUnpublishedSectionShellProps = {
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  sectionKey: string;
  children: React.ReactNode;
};

export default function ProfileEditUnpublishedSectionShell({
  lang,
  t,
  pickLang,
  isEditProfileRoute,
  sectionKey,
  children,
}: ProfileEditUnpublishedSectionShellProps) {
  return (
    <ProfileEditCardSection
      key={sectionKey}
      className={`border-t border-stone-200 pt-4${isEditProfileRoute ? ' profile-card-soft profile-stack-md' : ''}`}
    >
      <div className="profile-section-header">
        <h2 className="m-0 min-w-0 text-sm font-semibold text-stone-900">{t('profileFormSectionUnpublished')}</h2>
        <ProfileSectionTag tone="internal" label={pickLang('Interne uniquement', 'Solo interno', 'Internal only', lang)} />
      </div>

      <ProfileSectionHint tone="internal">
        {pickLang(
          'Ces informations servent aux statistiques et à l’animation du réseau.',
          'Estos datos sirven para estadísticas y la dinámica de la red.',
          'This information supports statistics and how we run the community.',
          lang
        )}
      </ProfileSectionHint>

      {children}
    </ProfileEditCardSection>
  );
}

