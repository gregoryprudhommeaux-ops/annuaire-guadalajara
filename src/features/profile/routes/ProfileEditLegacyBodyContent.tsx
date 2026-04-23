import React from 'react';
import type { ProfileEditLegacyBodyCtx } from '@/features/profile/routes/profileEditLegacyBodyContext';

/**
 * This component is intentionally "legacy" and receives a context bag from App.tsx.
 * The goal is to remove the huge JSX block from App.tsx without behavior changes.
 */
export type ProfileEditLegacyBodyContentProps = {
  ctx: ProfileEditLegacyBodyCtx;
};

export default function ProfileEditLegacyBodyContent({ ctx }: ProfileEditLegacyBodyContentProps) {
  const {
    cn,
    pageSectionPad,
    isEditProfileRoute,
    showAdminSelfProfilePanel,
    isProfileExpanded,
    setIsProfileExpanded,
    setIsEditing,
    user,
    profile,
    editingProfile,
    t,
    lang,
    pickLang,
    // bindings for header/body
    adminHeaderProps,
    expandedFormCtx,
    collapsedActions,
    onApplyOptimizationSuggestion,
    // components / icons
    ProfileEditLegacyBody,
    ProfileEditCard,
    ProfileEditCardHeader,
    ProfileEditAdminProfileHeaderContent,
    ProfileEditExpandMotion,
    ProfileEditExpandedContainer,
    ProfileEditValidationCallout,
    ProfileEditOptimizationCallout,
    ProfileEditCollapsedActionsBar,
    ProfileEditSaveSuccessBanner,
    ProfileEditExpandedSection,
    Users,
    ProfileEditExpandedForm,
    profileSaveSuccess,
  } = ctx;

  return (
    <ProfileEditLegacyBody className={cn(pageSectionPad, isEditProfileRoute && 'profile-edit-page')}>
      {showAdminSelfProfilePanel ? (
        <ProfileEditCard>
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
            <ProfileEditAdminProfileHeaderContent {...adminHeaderProps} />
          </ProfileEditCardHeader>

          <ProfileEditCollapsedActionsBar
            show={!isProfileExpanded && !!user}
            t={t}
            hasProfileUid={Boolean(profile?.uid)}
            viewerIsAdmin={collapsedActions.viewerIsAdmin}
            onSharePublicProfileLink={collapsedActions.onSharePublicProfileLink}
            onOpenPostRequest={collapsedActions.onOpenPostRequest}
            onAdminCreateEventClick={collapsedActions.onAdminCreateEventClick}
            icons={collapsedActions.icons}
          />

          <ProfileEditSaveSuccessBanner message={profileSaveSuccess} />

          <ProfileEditExpandMotion open={isProfileExpanded}>
            <ProfileEditExpandedContainer>
              <ProfileEditValidationCallout
                show={profile?.isValidated === false}
                message={t('validationMessage')}
                icon={<Users size={14} />}
              />
              {profile ? (
                <ProfileEditOptimizationCallout
                  show={profile.isValidated === false && Boolean(profile.optimizationSuggestion)}
                  lang={lang}
                  pickLang={pickLang}
                  profile={profile}
                  onApply={onApplyOptimizationSuggestion}
                />
              ) : null}

              <ProfileEditExpandedSection>
                <ProfileEditExpandedForm ctx={expandedFormCtx} />
              </ProfileEditExpandedSection>
            </ProfileEditExpandedContainer>
          </ProfileEditExpandMotion>
        </ProfileEditCard>
      ) : null}
    </ProfileEditLegacyBody>
  );
}

