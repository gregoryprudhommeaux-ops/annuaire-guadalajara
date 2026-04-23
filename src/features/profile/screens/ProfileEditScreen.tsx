import React, { useLayoutEffect } from 'react';
import { cn } from '@/lib/cn';
import type { Language, UserProfile } from '@/types';
import type { ProfileCompletionInput } from '@/lib/profileCompletion';
import ProfileCompletionCard from '@/components/profile/ProfileCompletionCard';

type TFn = (key: string) => string;

export type ProfileEditScreenProps = {
  lang: Language;
  t: TFn;
  isEditProfileRoute: boolean;
  profile: UserProfile | null;
  editingProfile: UserProfile | null;
  editingSomeoneElse: boolean;
  profileVisibilityBandHidden: boolean;
  profileCompletionCardSource: ProfileCompletionInput;
  profileSaveBusy: boolean;
  showAdminSelfProfilePanel: boolean;
  isProfileExpanded: boolean;
  setIsProfileExpanded: (v: boolean) => void;
  setIsEditing: (v: boolean) => void;
  setProfileVisibilityBandHidden: (v: boolean) => void;
  scrollToProfileCompletionField: (fieldId: string) => void;
  requestSubmitProfileForm: () => void;
  /** The legacy body content (form + panels) provided by App.tsx to keep behavior unchanged. */
  body: React.ReactNode;
  className?: string;
  /** Set when the screen is inside `AppShell` (FrancoNetwork header + bottom bar). */
  inAppShell?: boolean;
};

export default function ProfileEditScreen({
  lang,
  t,
  isEditProfileRoute,
  editingProfile,
  profile,
  profileVisibilityBandHidden,
  profileCompletionCardSource,
  profileSaveBusy,
  setIsProfileExpanded,
  setIsEditing,
  setProfileVisibilityBandHidden,
  scrollToProfileCompletionField,
  requestSubmitProfileForm,
  body,
  className,
  inAppShell = false,
}: ProfileEditScreenProps) {
  const pickLang = (fr: string, es: string, en: string) => (lang === 'es' ? es : lang === 'en' ? en : fr);

  useLayoutEffect(() => {
    if (!inAppShell) return;
    const root = document.documentElement;
    root.classList.add('fn-profile-edit-with-nav');
    return () => {
      root.classList.remove('fn-profile-edit-with-nav');
    };
  }, [inAppShell]);

  return (
    <div
      className={cn('min-w-0', inAppShell && 'profile-edit--in-app-shell', className)}
    >
      <div className="space-y-4">
        <header className="rounded-[var(--fn-radius-md)] border border-[rgb(var(--fn-border))] bg-[rgb(var(--fn-surface))] p-4 shadow-[var(--fn-shadow-sm)]">
          <h1 className="text-lg font-semibold tracking-tight text-[rgb(var(--fn-fg))]">{t('myProfile')}</h1>
          <p className="mt-1 text-sm text-[rgb(var(--fn-muted))]">
            {pickLang(
              'Un profil clair facilite les mises en relation et l’accès aux opportunités.',
              'Un perfil claro facilita las introducciones y el acceso a oportunidades.',
              'A clear profile improves introductions and access to opportunities.'
            )}
          </p>
        </header>

        {isEditProfileRoute && (editingProfile?.uid ?? profile?.uid) && !profileVisibilityBandHidden ? (
          <div
            className={cn(
              'sticky z-40',
              inAppShell
                ? 'top-[calc(env(safe-area-inset-top,0px)+var(--fn-header-h)+0.5rem)] sm:top-4'
                : 'top-24 sm:top-16',
            )}
          >
            <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
              <div className="p-3 sm:p-4">
                <ProfileCompletionCard
                  profile={profileCompletionCardSource}
                  t={t}
                  lang={lang}
                  onEditField={scrollToProfileCompletionField}
                  className="border-0 bg-transparent p-0 shadow-none"
                  matchingRecommendationsNote={t('profileFormMatchingRecommendationsNote')}
                  rightActions={
                    <button
                      type="button"
                      disabled={profileSaveBusy}
                      onClick={() => {
                        setIsProfileExpanded(true);
                        setIsEditing(true);
                        requestSubmitProfileForm();
                      }}
                      className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                    >
                      {profileSaveBusy
                        ? pickLang('Enregistrement...', 'Guardando...', 'Saving...')
                        : pickLang('Enregistrer', 'Guardar', 'Save')}
                    </button>
                  }
                  discreetRightFooter={
                    <button
                      type="button"
                      onClick={() => {
                        setProfileVisibilityBandHidden(true);
                        try {
                          window.sessionStorage.setItem('fn_profile_visibility_band_hidden', '1');
                        } catch {
                          // ignore
                        }
                      }}
                      className="text-[10px] font-normal leading-snug text-slate-400 transition-colors hover:text-slate-600 sm:text-xs"
                    >
                      {pickLang('Masquer ce bandeau', 'Ocultar este banner', 'Hide this banner')}
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        ) : null}

        {body}
      </div>
    </div>
  );
}

