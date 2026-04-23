import React from 'react';
import type { Language } from '@/types';
import { ProfileSectionHint } from '@/features/profile/components/ProfileSectionHint';
import { ProfileSectionTag } from '@/features/profile/components/ProfileSectionTag';
import ProfileEditCardSection from '@/features/profile/screens/legacy/ProfileEditCardSection';
import IceBreakerInterests from '@/components/profile/IceBreakerInterests';

export type ProfileEditPassionsSectionProps = {
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  passionIdsDraft: string[];
  onChangePassions: (ids: string[]) => void;
};

export default function ProfileEditPassionsSection({
  lang,
  t,
  pickLang,
  isEditProfileRoute,
  passionIdsDraft,
  onChangePassions,
}: ProfileEditPassionsSectionProps) {
  return (
    <ProfileEditCardSection
      id="profile-completion-passions"
      className={
        // keep the exact styling behavior as before
        // (this section uses its own rounded card styling, and adds profile-card-compact on edit route)
        `space-y-3 rounded-xl border border-stone-200 bg-white p-4${isEditProfileRoute ? ' profile-card-compact' : ''}`
      }
    >
      <div className="profile-section-header">
        <h2 className="m-0 min-w-0 text-sm font-semibold text-stone-900">{t('profileFormSectionPassions')}</h2>
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
          "Centres d’intérêt hors activité: ils humanisent la fiche et facilitent le matching. Ils font aussi office d’ice breakers relationnels.",
          'Intereses fuera de tu actividad principal: humanizan tu ficha y el matching. También sirven como rompehielos.',
          'Interests outside your core work humanize your profile and matching. They also work as conversational ice-breakers.',
          lang
        )}
      </ProfileSectionHint>
      <IceBreakerInterests lang={lang} value={passionIdsDraft} onChange={onChangePassions} markRequired />
    </ProfileEditCardSection>
  );
}

