import React from 'react';

export type ProfileEditAdminSelfPanelHeaderProps = {
  ctx: any;
};

export default function ProfileEditAdminSelfPanelHeader({ ctx }: ProfileEditAdminSelfPanelHeaderProps) {
  const {
    isEditProfileRoute,
    isProfileExpanded,
    setIsProfileExpanded,
    setIsEditing,
    user,
    profile,
    editingProfile,
    editingSomeoneElse,
    profileVisibilityBandHidden,
    setProfileVisibilityBandHidden,
    pickLang,
    lang,
    t,
    profileCompletionPct,
    profileCoachSource,
    profileCoachLoading,
    profileCoachLine,
    isAdminEmail,
    // UI
    ProfileEditCardHeader,
    ProfileEditCardHeaderContent,
    ProfileAvatar,
    UserIcon,
    Sparkles,
    RefreshCw,
    ChevronUp,
    ChevronDown,
  } = ctx;

  return (
    <ProfileEditCardHeader
      isClickable={!isEditProfileRoute}
      onClick={
        isEditProfileRoute
          ? undefined
          : () => {
              if (!isProfileExpanded) {
                setIsProfileExpanded(true);
                setIsEditing(true);
              } else {
                setIsProfileExpanded(false);
              }
            }
      }
    >
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
                onClick={(e: any) => {
                  e.stopPropagation();
                  setProfileVisibilityBandHidden(false);
                  try {
                    window.sessionStorage.removeItem('fn_profile_visibility_band_hidden');
                  } catch {
                    // ignore
                  }
                }}
                className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                {pickLang('Afficher la visibilité du profil', 'Mostrar visibilidad del perfil', 'Show profile visibility', lang)}
              </button>
            ) : null}
          </div>

          {profile ? (
            <div className="flex items-start gap-2">
              {profileCoachSource === 'ai' ? (
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden />
              ) : null}
              {profileCoachLoading && profileCoachSource !== 'ai' ? (
                <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-stone-400" aria-hidden />
              ) : null}
              <div className="min-w-0 flex-1 space-y-1">
                {profileCoachLine?.trim?.() ? (
                  <p className="text-xs leading-relaxed text-stone-500 sm:text-sm break-words">{profileCoachLine}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </ProfileEditCardHeaderContent>

      <div className="flex items-center gap-3">
        {user && !profile && !isProfileExpanded ? (
          <button
            onClick={(e: any) => {
              e.stopPropagation();
              setIsEditing(true);
              setIsProfileExpanded(true);
            }}
            className="px-4 py-1.5 bg-stone-900 text-white text-xs rounded-lg hover:bg-stone-800 transition-all font-medium"
          >
            {t('register')}
          </button>
        ) : null}
        {!isEditProfileRoute ? (
          <div className="p-2 text-stone-400">{isProfileExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
        ) : null}
      </div>
    </ProfileEditCardHeader>
  );
}

