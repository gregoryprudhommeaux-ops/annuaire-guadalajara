import React from 'react';
import type { Language, UserProfile } from '@/types';
import { ProfileFieldHint } from '@/features/profile/components/ProfileFieldHint';

export type ProfileEditPersonBioBlockProps = {
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  profileEditFrUx: boolean;
  labels: { bio: string };
  help: { bio: string };
  formDraftT: Partial<UserProfile> | null;
  profile: UserProfile | null;
  editingProfile: UserProfile | null;
  ProfileEditorialMemberBioField: React.ComponentType<{
    formDraftT: Partial<UserProfile> | null;
    editingProfile: UserProfile | null;
    profile: UserProfile | null;
    profileEditFrUx: boolean;
    lang: Language;
    t: (key: string) => string;
  }>;
};

export default function ProfileEditPersonBioBlock({
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
  ProfileEditorialMemberBioField,
}: ProfileEditPersonBioBlockProps) {
  if (isEditProfileRoute) {
    return (
      <ProfileEditorialMemberBioField
        formDraftT={formDraftT}
        editingProfile={editingProfile}
        profile={profile}
        profileEditFrUx={profileEditFrUx}
        lang={lang}
        t={t}
      />
    );
  }

  return (
    <div className="space-y-1">
      <label
        className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
        htmlFor="profile-member-bio"
      >
        {profileEditFrUx ? labels.bio : t('memberBio')}
        <span className="text-red-500 font-semibold" aria-hidden>
          {' *'}
        </span>
      </label>
      <textarea
        id="profile-member-bio"
        name="memberBio"
        rows={4}
        maxLength={4000}
        defaultValue={
          formDraftT?.memberBio ??
          (editingProfile?.memberBio ??
            profile?.memberBio ??
            editingProfile?.bio ??
            profile?.bio) ??
          ''
        }
        placeholder={pickLang(
          'Qui êtes-vous, votre parcours, ce que vous apportez au réseau…',
          'Quién eres, tu trayectoria, qué aportas a la red…',
          'Who you are, your path, what you bring to the network…',
          lang
        )}
        className="min-h-[90px] w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
      />
      <ProfileFieldHint>{profileEditFrUx ? help.bio : t('profileFormMemberBioHint')}</ProfileFieldHint>
    </div>
  );
}

