import React from 'react';
import type { UserProfile, Language } from '@/types';
import { cn } from '@/lib/cn';
import { ProfileSectionHint } from '@/features/profile/components/ProfileSectionHint';
import { ProfileSectionTag } from '@/features/profile/components/ProfileSectionTag';
import { ProfileFieldHint } from '@/features/profile/components/ProfileFieldHint';

export type ProfileEditVisibilitySectionProps = {
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  profileEditFrUx: boolean;
  labels: { openness: string };
  help: { openness: string };
  formDraftC: { openToMentoring?: boolean; openToTalks?: boolean; openToEvents?: boolean } | null;
  profile: UserProfile | null;
  editingProfile: UserProfile | null;
};

export default function ProfileEditVisibilitySection({
  lang,
  t,
  pickLang,
  isEditProfileRoute,
  profileEditFrUx,
  labels,
  help,
  formDraftC,
  profile,
  editingProfile,
}: ProfileEditVisibilitySectionProps) {
  return (
    <section className={cn('space-y-3', isEditProfileRoute && 'profile-card-soft profile-stack-md')}>
      <div className="profile-section-header">
        <h2 className="m-0 min-w-0 text-sm font-semibold text-stone-900">{t('profileFormSectionVisibility')}</h2>
        <ProfileSectionTag
          tone="public"
          label={pickLang('Visible publiquement', 'Visible públicamente', 'Shown on your public profile', lang)}
        />
      </div>

      <ProfileSectionHint tone="public">
        {pickLang(
          'Ces options contrôlent ce que les autres membres voient sur votre fiche.',
          'Estas opciones controlan lo que otros miembros ven en tu ficha.',
          'These options control what other members see on your profile.',
          lang
        )}
      </ProfileSectionHint>

      <div className="space-y-1">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.openness : t('contactPrefsOpenToLabel')}
        </span>

        <div className={cn('mt-0', isEditProfileRoute ? 'inline-checkboxes' : 'space-y-2')}>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 hover:bg-stone-50">
            <input
              type="checkbox"
              name="openToMentoring"
              defaultChecked={
                formDraftC?.openToMentoring ??
                (editingProfile?.openToMentoring ?? profile?.openToMentoring) === true
              }
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
            />
            <span className="text-sm text-stone-700">{t('contactPrefsOpenMentoring')}</span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 hover:bg-stone-50">
            <input
              type="checkbox"
              name="openToTalks"
              defaultChecked={
                formDraftC?.openToTalks ?? (editingProfile?.openToTalks ?? profile?.openToTalks) === true
              }
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
            />
            <span className="text-sm text-stone-700">{t('contactPrefsOpenTalks')}</span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 hover:bg-stone-50">
            <input
              type="checkbox"
              name="openToEvents"
              defaultChecked={
                formDraftC?.openToEvents ?? (editingProfile?.openToEvents ?? profile?.openToEvents) === true
              }
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
            />
            <span className="text-sm text-stone-700">{t('contactPrefsOpenEvents')}</span>
          </label>
        </div>

        <ProfileFieldHint>{profileEditFrUx ? help.openness : t('contactPrefsOpenToHint')}</ProfileFieldHint>
      </div>
    </section>
  );
}

