import React from 'react';
import type { Language } from '@/types';

type TFn = (key: string) => string;

export type ProfileEditFormActionsProps = {
  lang: Language;
  t: TFn;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  profileSaveBusy: boolean;
  onCancel: () => void;
};

export default function ProfileEditFormActions({
  lang,
  t,
  pickLang,
  profileSaveBusy,
  onCancel,
}: ProfileEditFormActionsProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-stone-200 pt-6 sm:flex-row sm:justify-end sm:gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="min-h-[44px] w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50 sm:min-h-0 sm:w-auto"
      >
        {t('cancel')}
      </button>
      <button
        type="submit"
        disabled={profileSaveBusy}
        className="min-h-[44px] w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0 sm:w-auto"
      >
        {profileSaveBusy ? pickLang('Enregistrement...', 'Guardando...', 'Saving...', lang) : t('save')}
      </button>
    </div>
  );
}

