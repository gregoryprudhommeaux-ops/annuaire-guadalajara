import React from 'react';
import type { Language } from '@/types';
import { cn } from '@/lib/cn';

type TFn = (key: string) => string;

export type ProfileEditFormActionsProps = {
  lang: Language;
  t: TFn;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  profileSaveBusy: boolean;
  profileSaveSuccess: string | null;
  onCancel: () => void;
};

export default function ProfileEditFormActions({
  lang,
  t,
  pickLang,
  profileSaveBusy,
  profileSaveSuccess,
  onCancel,
}: ProfileEditFormActionsProps) {
  const saved = Boolean(profileSaveSuccess);

  return (
    <div className="space-y-4 border-t border-stone-200 pt-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50 sm:min-h-0 sm:w-auto"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          id="profile-save-submit"
          disabled={profileSaveBusy}
          className={cn(
            'min-h-[44px] w-full rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0 sm:w-auto',
            saved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {profileSaveBusy
            ? pickLang('Enregistrement...', 'Guardando...', 'Saving...', lang)
            : saved
              ? pickLang('Enregistré ✓', 'Guardado ✓', 'Saved ✓', lang)
              : t('save')}
        </button>
      </div>
      <p className="text-center text-[11px] leading-relaxed text-stone-500 sm:text-right">
        {t('profileFormLaMesaFooterNote')}{' '}
        <a
          href={
            lang === 'es'
              ? 'https://lamesasecreta.com/es'
              : lang === 'en'
                ? 'https://lamesasecreta.com/en'
                : 'https://lamesasecreta.com/fr'
          }
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-stone-600 underline-offset-2 hover:text-[#01696f] hover:underline"
        >
          LA MESA
        </a>
      </p>
    </div>
  );
}

