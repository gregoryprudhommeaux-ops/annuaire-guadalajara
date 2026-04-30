import React from 'react';
import type { Language, UserProfile } from '@/types';

export type ProfileEditPersonPhotoVisualBlockProps = {
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  profileEditFrUx: boolean;
  labels: { profilePhoto: string };
  userDisplayName: string | null;
  profile: UserProfile | null;
  editingProfile: UserProfile | null;
  profilePhotoUrlDraft: string;
  setProfilePhotoUrlDraft: React.Dispatch<React.SetStateAction<string>>;
  // Relaxed to avoid prop-type churn during refactor.
  ProfileIdentityVisual: React.ComponentType<any>;
};

export default function ProfileEditPersonPhotoVisualBlock({
  lang,
  t,
  pickLang,
  profileEditFrUx,
  labels,
  userDisplayName,
  profile,
  editingProfile,
  profilePhotoUrlDraft,
  setProfilePhotoUrlDraft,
  ProfileIdentityVisual,
}: ProfileEditPersonPhotoVisualBlockProps) {
  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-white/70 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">{t('profileFormSectionPhotoVisual')}</h3>
      <p className="text-xs leading-relaxed text-stone-600">{t('profileFormPhotoVisualIntro')}</p>
      <p className="border-l-2 border-stone-300 pl-3 text-xs leading-relaxed text-stone-500">
        {t('profileFormPhotoNoHostingNote')}
      </p>
      <ProfileIdentityVisual
        fullName={editingProfile?.fullName ?? profile?.fullName ?? userDisplayName ?? ''}
        photoUrl={profilePhotoUrlDraft}
        linkedinUrl={editingProfile?.linkedin ?? profile?.linkedin ?? undefined}
        size="lg"
        imageAlt={
          profilePhotoUrlDraft.trim()
            ? pickLang('Photo de profil — aperçu', 'Foto de perfil — vista previa', 'Profile photo — preview', lang)
            : undefined
        }
      />
      <p className="text-xs font-medium text-stone-800">{t('profileFormPhotoCredibilityNote')}</p>
      <div className="space-y-1">
        <label
          className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
          htmlFor="profilePhotoUrl"
        >
          {profileEditFrUx ? labels.profilePhoto : t('profileFormPhotoPublicUrlLabel')}
        </label>
        <input
          id="profilePhotoUrl"
          name="photoURL"
          type="url"
          inputMode="url"
          autoComplete="url"
          value={profilePhotoUrlDraft}
          onChange={(e) => setProfilePhotoUrlDraft(e.target.value)}
          onBlur={() => {
            setProfilePhotoUrlDraft((prev) => {
              const trimmed = String(prev ?? '').trim();
              if (!trimmed) return '';
              return trimmed.split('#')[0];
            });
          }}
          onPaste={(e) => {
            const text = e.clipboardData?.getData('text') ?? '';
            if (!text) return;
            e.preventDefault();
            setProfilePhotoUrlDraft(text.trim().split('#')[0]);
          }}
          placeholder="https://…"
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        />
      </div>
    </div>
  );
}

