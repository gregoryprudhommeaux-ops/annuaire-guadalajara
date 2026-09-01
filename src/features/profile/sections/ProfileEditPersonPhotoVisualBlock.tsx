import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { Language, UserProfile } from '@/types';
import {
  ProfilePhotoUploadError,
  uploadProfilePhoto,
} from '@/lib/uploadProfilePhoto';

export type ProfileEditPersonPhotoVisualBlockProps = {
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  profileEditFrUx: boolean;
  labels: { profilePhoto: string };
  userDisplayName: string | null;
  userUid: string | null;
  canUploadPhoto: boolean;
  profile: UserProfile | null;
  editingProfile: UserProfile | null;
  profilePhotoUrlDraft: string;
  setProfilePhotoUrlDraft: React.Dispatch<React.SetStateAction<string>>;
  ProfileIdentityVisual: React.ComponentType<any>;
};

export default function ProfileEditPersonPhotoVisualBlock({
  lang,
  t,
  pickLang,
  profileEditFrUx,
  labels,
  userDisplayName,
  userUid,
  canUploadPhoto,
  profile,
  editingProfile,
  profilePhotoUrlDraft,
  setProfilePhotoUrlDraft,
  ProfileIdentityVisual,
}: ProfileEditPersonPhotoVisualBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const resolveUploadError = (err: unknown): string => {
    if (err instanceof ProfilePhotoUploadError) {
      if (err.code === 'invalid_type') return t('profileFormPhotoUploadErrorInvalid');
      if (err.code === 'too_large') return t('profileFormPhotoUploadErrorSize');
      if (err.code === 'not_authenticated') return t('profileFormPhotoUploadErrorAuth');
    }
    return t('profileFormPhotoUploadErrorGeneric');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !userUid || !canUploadPhoto) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      const url = await uploadProfilePhoto(userUid, file);
      setProfilePhotoUrlDraft(url);
      setUploadSuccess(true);
    } catch (err) {
      setUploadError(resolveUploadError(err));
    } finally {
      setUploading(false);
    }
  };

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

      {canUploadPhoto ? (
        <div className="space-y-2 rounded-lg border border-dashed border-stone-200 bg-stone-50/80 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">
            {t('profileFormPhotoUploadLabel')}
          </p>
          <p className="text-xs leading-relaxed text-stone-500">{t('profileFormPhotoUploadHint')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            aria-hidden
            onChange={(e) => {
              void handleFileChange(e);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={16} aria-hidden />
            {uploading ? t('profileFormPhotoUploading') : t('profileFormPhotoUploadButton')}
          </button>
          {uploadSuccess ? (
            <p className="text-xs font-medium text-emerald-700" role="status">
              {t('profileFormPhotoUploadSuccess')}
            </p>
          ) : null}
          {uploadError ? (
            <p className="text-xs font-medium text-rose-700" role="alert">
              {uploadError}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
        {canUploadPhoto ? t('profileFormPhotoOrUrlDivider') : t('profileFormPhotoPublicUrlLabel')}
      </p>
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
          onChange={(e) => {
            setUploadSuccess(false);
            setProfilePhotoUrlDraft(e.target.value);
          }}
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
            setUploadSuccess(false);
            setProfilePhotoUrlDraft(text.trim().split('#')[0]);
          }}
          placeholder="https://…"
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
        />
      </div>
    </div>
  );
}
