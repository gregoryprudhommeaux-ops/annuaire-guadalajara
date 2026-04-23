import React from 'react';
import type { Language, UserProfile } from '@/types';
import { cn } from '@/lib/cn';
import { ProfileFieldHint } from '@/features/profile/components/ProfileFieldHint';

type WorkingLanguageOption = {
  code: string;
  label: { fr: string; es: string; en: string };
};

export type ProfileEditPersonVisibilityLanguagesBlockProps = {
  lang: Language;
  t: (key: string) => string;
  isEditProfileRoute: boolean;
  profileEditFrUx: boolean;
  labels: { languages: string };
  help: { languages: string };
  formDraftC: Partial<UserProfile> | null;
  profile: UserProfile | null;
  editingProfile: UserProfile | null;
  workingLanguagesDraft: string[];
  toggleWorkingLanguageDraft: (code: string) => void;
  workingLanguageOptions: ReadonlyArray<WorkingLanguageOption>;
};

export default function ProfileEditPersonVisibilityLanguagesBlock({
  lang,
  t,
  isEditProfileRoute,
  profileEditFrUx,
  labels,
  help,
  formDraftC,
  profile,
  editingProfile,
  workingLanguagesDraft,
  toggleWorkingLanguageDraft,
  workingLanguageOptions,
}: ProfileEditPersonVisibilityLanguagesBlockProps) {
  return (
    <>
      <div
        className={cn('mb-4', isEditProfileRoute ? 'inline-checkboxes' : 'flex flex-col gap-2')}
      >
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700 hover:text-stone-900">
          <input
            type="checkbox"
            name="isEmailPublic"
            defaultChecked={
              formDraftC?.isEmailPublic ??
              editingProfile?.isEmailPublic ??
              profile?.isEmailPublic ??
              false
            }
            className="h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
          />
          <span>{t('isEmailPublic')}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700 hover:text-stone-900">
          <input
            type="checkbox"
            name="isWhatsappPublic"
            defaultChecked={
              formDraftC?.isWhatsappPublic ??
              editingProfile?.isWhatsappPublic ??
              profile?.isWhatsappPublic ??
              false
            }
            className="h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
          />
          <span>{t('isWhatsappPublic')}</span>
        </label>
      </div>

      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
        {t('profileFormSubLanguages')}
      </p>
      <div className="mb-4 space-y-1" id="profile-completion-workLanguages">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {profileEditFrUx ? labels.languages : t('contactPrefsWorkingLangLabel')}
        </span>
        <div className="flex flex-wrap gap-2">
          {workingLanguageOptions.map((opt) => {
            const selected = workingLanguagesDraft.includes(opt.code);
            const disabled = !selected && workingLanguagesDraft.length >= 3;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => toggleWorkingLanguageDraft(opt.code)}
                disabled={disabled}
                className={cn(
                  'rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-all',
                  selected
                    ? 'border-blue-600 bg-blue-700 text-white shadow-sm'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300',
                  disabled && !selected && 'cursor-not-allowed opacity-40 hover:border-stone-200'
                )}
              >
                {opt.label[lang]}
              </button>
            );
          })}
        </div>
        <ProfileFieldHint>{profileEditFrUx ? help.languages : t('contactPrefsWorkingLangTip')}</ProfileFieldHint>
      </div>
    </>
  );
}

