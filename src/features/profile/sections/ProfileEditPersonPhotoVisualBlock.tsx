import React, { useRef, useState } from 'react';
import { ChevronDown, Upload } from 'lucide-react';
import { cn } from '@/lib/cn';
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
  onPhotoUploaded?: () => void;
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
  onPhotoUploaded,
  ProfileIdentityVisual,
}: ProfileEditPersonPhotoVisualBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const displayName = editingProfile?.fullName ?? profile?.fullName ?? userDisplayName ?? '';
  const photoClickLabel = pickLang(
    'Choisir ou remplacer la photo de profil',
    'Elegir o reemplazar la foto de perfil',
    'Choose or replace profile photo',
    lang
  );

  const resolveUploadError = (err: unknown): string => {
    if (err instanceof ProfilePhotoUploadError) {
      if (err.code === 'invalid_type') return t('profileFormPhotoUploadErrorInvalid');
      if (err.code === 'too_large') return t('profileFormPhotoUploadErrorSize');
      if (err.code === 'not_authenticated') return t('profileFormPhotoUploadErrorAuth');
    }
    return t('profileFormPhotoUploadErrorGeneric');
  };

  const openFilePicker = () => {
    if (!canUploadPhoto || uploading) return;
    fileInputRef.current?.click();
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
      onPhotoUploaded?.();
    } catch (err) {
      setUploadError(resolveUploadError(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-[rgb(var(--fn-border))] bg-[rgb(var(--fn-surface))] p-4 shadow-[var(--fn-shadow-sm)]">
      <div>
        <h3 className="text-sm font-semibold text-stone-900">{t('profileFormSectionPhotoVisual')}</h3>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">{t('profileFormPhotoVisualIntroShort')}</p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-stone-200 bg-stone-50/60 px-4 py-5 sm:flex-row sm:items-center sm:gap-5">
        <ProfileIdentityVisual
          fullName={displayName}
          photoUrl={profilePhotoUrlDraft}
          linkedinUrl={editingProfile?.linkedin ?? profile?.linkedin ?? undefined}
          size="xl"
          hideName
          onPhotoClick={canUploadPhoto ? openFilePicker : undefined}
          photoClickLabel={photoClickLabel}
          imageAlt={
            profilePhotoUrlDraft.trim()
              ? pickLang('Photo de profil — aperçu', 'Foto de perfil — vista previa', 'Profile photo — preview', lang)
              : undefined
          }
        />

        {canUploadPhoto ? (
          <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:items-start">
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
              onClick={openFilePicker}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#01696f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#015a60] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <Upload size={18} aria-hidden />
              {uploading ? t('profileFormPhotoUploading') : t('profileFormPhotoUploadButton')}
            </button>
            <p className="text-center text-xs text-stone-500 sm:text-left">{t('profileFormPhotoUploadHint')}</p>
            {canUploadPhoto ? (
              <p className="text-center text-[11px] text-stone-400 sm:text-left">
                {t('profileFormPhotoUploadTapAvatar')}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {uploadSuccess ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800" role="status">
          {t('profileFormPhotoUploadSuccess')}
        </p>
      ) : null}
      {uploadError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800" role="alert">
          {uploadError}
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-stone-500">{t('profileFormPhotoNoHostingNote')}</p>

      <div className="border-t border-stone-100 pt-3">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          aria-expanded={advancedOpen}
          className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-2 text-left text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          <span>{t('profileFormPhotoAdvancedToggle')}</span>
          <ChevronDown
            size={18}
            className={cn('shrink-0 text-stone-400 transition-transform', advancedOpen && 'rotate-180')}
            aria-hidden
          />
        </button>
        {advancedOpen ? (
          <div className="mt-2 space-y-1 px-1">
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
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#01696f]/30"
            />
            <p className="text-xs text-stone-500">{t('profileFormPhotoAdvancedHint')}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
