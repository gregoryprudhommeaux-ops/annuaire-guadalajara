import React from 'react';
import type { User } from 'firebase/auth';
import type { Language, UserProfile } from '@/types';
import ProfileEditCardHeaderContent from '@/features/profile/screens/legacy/ProfileEditCardHeaderContent';
import ProfileAvatar from '@/components/ProfileAvatar';

export type ProfileEditAdminProfileHeaderContentProps = {
  lang: Language;
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  isEditProfileRoute: boolean;
  isProfileExpanded: boolean;
  profileVisibilityBandHidden: boolean;
  profileCompletionPct: number;
  profileCoachLine: string;
  profileCoachLoading: boolean;
  profileCoachSource: string;
  user: User | null;
  profile: UserProfile | null;
  editingProfile: UserProfile | null;
  editingSomeoneElse: boolean;
  isAdminEmail: (email: string | null | undefined) => boolean;
  onShowVisibilityBand: () => void;
  onRegister: () => void;
  showRegisterButton: boolean;
  rightChevron: React.ReactNode;
  downChevron: React.ReactNode;
  icons: {
    UserIcon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;
    Sparkles: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    RefreshCw: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  };
};

export default function ProfileEditAdminProfileHeaderContent({
  lang,
  t,
  pickLang,
  isEditProfileRoute,
  isProfileExpanded,
  profileVisibilityBandHidden,
  profileCompletionPct,
  profileCoachLine,
  profileCoachLoading,
  profileCoachSource,
  user,
  profile,
  editingProfile,
  editingSomeoneElse,
  isAdminEmail,
  onShowVisibilityBand,
  onRegister,
  showRegisterButton,
  rightChevron,
  downChevron,
  icons,
}: ProfileEditAdminProfileHeaderContentProps) {
  const { UserIcon, Sparkles, RefreshCw } = icons;

  return (
    <>
      <ProfileEditCardHeaderContent className={isProfileExpanded ? 'items-center' : 'items-start sm:items-center'}>
        {!isProfileExpanded ? (
          <div className="mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 sm:mt-0">
            {profile ? (
              <ProfileAvatar
                photoURL={profile.photoURL}
                fullName={profile.fullName}
                className="h-full w-full"
                iconSize={22}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-500">
                <UserIcon size={18} aria-hidden />
              </div>
            )}
          </div>
        ) : null}

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {editingSomeoneElse && editingProfile
                  ? pickLang(
                      `Fiche membre : ${editingProfile.fullName || editingProfile.email || editingProfile.uid}`,
                      `Ficha del miembro: ${editingProfile.fullName || editingProfile.email || editingProfile.uid}`,
                      `Member profile: ${editingProfile.fullName || editingProfile.email || editingProfile.uid}`,
                      lang
                    )
                  : t('myProfile')}
              </h2>
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                {editingSomeoneElse
                  ? pickLang('Édition admin', 'Edición admin', 'Admin edit', lang)
                  : isAdminEmail(user?.email)
                    ? pickLang('Admin', 'Admin', 'Admin', lang)
                    : pickLang(`Profil: ${profileCompletionPct}%`, `Perfil: ${profileCompletionPct}%`, `Profile: ${profileCompletionPct}%`, lang)}
              </span>
            </div>

            {isEditProfileRoute && (editingProfile?.uid ?? profile?.uid) && profileVisibilityBandHidden ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowVisibilityBand();
                }}
                className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                {pickLang('Afficher la visibilité du profil', 'Mostrar visibilidad del perfil', 'Show profile visibility', lang)}
              </button>
            ) : null}
          </div>

          {profile ? (
            <div className="flex items-start gap-2">
              {isAdminEmail(user?.email) && editingSomeoneElse && editingProfile ? (
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[11px] font-medium leading-relaxed text-violet-900 sm:text-xs">
                    {pickLang(
                      'Vous corrigez la fiche d’un autre membre — elle ne remplace pas votre compte administrateur.',
                      'Estás corrigiendo la ficha de otro miembro: no sustituye tu cuenta de administrador.',
                      'You are editing another member’s directory profile — it is not your admin account.',
                      lang
                    )}
                  </p>
                </div>
              ) : isAdminEmail(user?.email) ? (
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[11px] font-medium leading-relaxed text-blue-700 sm:text-xs">
                    {pickLang(
                      'Compte administrateur : accès complet sans fiche annuaire publiée.',
                      'Cuenta de administración: acceso completo sin ficha en el directorio.',
                      'Admin account: full access without a published directory profile.',
                      lang
                    )}
                  </p>
                </div>
              ) : (
                <>
                  {profileCoachSource === 'ai' ? (
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden />
                  ) : null}
                  {profileCoachLoading && profileCoachSource !== 'ai' ? (
                    <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-stone-400" aria-hidden />
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[11px] font-medium leading-relaxed text-blue-700 sm:text-xs">
                      {pickLang(
                        profileCompletionPct >= 100
                          ? 'Bravo, votre profil est complet !'
                          : `Objectif 100%: complétez votre profil pour gagner en visibilité.`,
                        profileCompletionPct >= 100
                          ? 'Excelente, tu perfil está completo.'
                          : 'Meta 100%: completa tu perfil para ganar visibilidad.',
                        profileCompletionPct >= 100
                          ? 'Great, your profile is complete.'
                          : 'Target 100%: complete your profile to boost visibility.',
                        lang
                      )}
                    </p>
                    {profileCoachLine.trim() ? (
                      <p className="text-xs leading-relaxed text-stone-500 sm:text-sm break-words">
                        {profileCoachLine}
                      </p>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </ProfileEditCardHeaderContent>

      <div className="flex items-center gap-3">
        {showRegisterButton ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRegister();
            }}
            className="px-4 py-1.5 bg-stone-900 text-white text-xs rounded-lg hover:bg-stone-800 transition-all font-medium"
          >
            {t('register')}
          </button>
        ) : null}

        {!isEditProfileRoute ? <div className="p-2 text-stone-400">{isProfileExpanded ? downChevron : rightChevron}</div> : null}
      </div>
    </>
  );
}

