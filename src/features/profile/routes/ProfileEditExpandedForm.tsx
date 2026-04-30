import React from 'react';
import type { User } from 'firebase/auth';
import type {
  CompanyActivitySlot,
  EmployeeCountRange,
  Language,
  UserProfile,
} from '@/types';

export type ProfileEditExpandedFormCtx = {
  // data
  profile: UserProfile | null;
  editingProfile: UserProfile | null;
  isEditing: boolean;
  user: User | null;
  lang: Language;
  profileEditFrUx: boolean;
  isEditProfileRoute: boolean;
  editingSomeoneElse: boolean;
  profileCompletionPct: number;
  profileSaveBusy: boolean;
  profileSaveError: string | null;
  formDraftT: Partial<UserProfile> | null;
  formDraftC: Partial<UserProfile> | null;
  formAdminPrivateReady: boolean;
  formAdminPrivate: any;
  profilePhotoUrlDraft: string;
  passionIdsDraft: string[];
  workingLanguagesDraft: string[];
  communicationLanguageDraft: Language;
  setCommunicationLanguageDraft: React.Dispatch<React.SetStateAction<Language>>;
  highlightedNeedsDraft: string[];
  companyActivitiesDraft: CompanyActivitySlot[];
  companyActivityEditCollapsed: Record<string, boolean | undefined>;

  // constants / helpers
  PROFILE_FIELD_LABELS: Record<string, string>;
  PROFILE_FIELD_HELP: Record<string, string>;
  WORKING_LANGUAGE_OPTIONS: ReadonlyArray<{ code: string; label: { fr: string; es: string; en: string } }>;
  ACTIVITY_CATEGORIES: readonly string[];
  CITIES: readonly string[];
  WORK_FUNCTION_OPTIONS: readonly string[];
  EMPLOYEE_COUNT_RANGES: readonly EmployeeCountRange[];
  NATIONALITY_OPTIONS: Array<{ code: string }>;

  // i18n + utils
  t: (key: string) => string;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  cn: (...classes: Array<string | false | null | undefined>) => string;
  isAdminEmail: (email: string | null | undefined) => boolean;
  sanitizePassionIds: (ids: string[]) => string[];
  nationalityLabel: (code: string, lang: Language) => string;
  activityCategoryLabel: (c: string, lang: Language) => string;
  cityOptionLabel: (c: string, lang: Language) => string;
  workFunctionLabel: (opt: string, lang: Language) => string;
  employeeCountToSelectDefault: (v: CompanyActivitySlot['employeeCount']) => string;
  phoneDialRowsOrderedForUi: () => Array<{ dial: string }>;
  dialLabelForLang: (dial: string, lang: Language) => string;

  // phone defaults (computed from profile)
  profileWhatsappDialDefault: string;
  profileWhatsappLocalDefault: string;

  // state setters / handlers
  setIsEditing: (v: boolean) => void;
  setEditingProfile: (v: UserProfile | null) => void;
  setIsProfileExpanded: (v: boolean) => void;
  setProfilePhotoUrlDraft: React.Dispatch<React.SetStateAction<string>>;
  setPassionIdsDraft: React.Dispatch<React.SetStateAction<string[]>>;
  toggleWorkingLanguageDraft: (code: string) => void;
  toggleHighlightedNeedDraft: (needId: string) => void;
  setCompanyActivitiesDraft: React.Dispatch<React.SetStateAction<CompanyActivitySlot[]>>;
  setCompanyActivityEditCollapsed: React.Dispatch<
    React.SetStateAction<Record<string, boolean | undefined>>
  >;
  updateCompanyActivitySlot: (slotId: string, patch: Partial<CompanyActivitySlot>) => void;
  emptyCompanyActivitySlot: () => CompanyActivitySlot;
  handleSaveProfile: React.FormEventHandler<HTMLFormElement>;
  handleDeleteProfile: (uid: string) => Promise<void> | void;

  // refs
  profileFormLayoutRef: React.Ref<HTMLDivElement>;
  directoryProfileFormRef: React.Ref<HTMLFormElement>;
  profileFormRemountKey: React.Key;

  // components (kept broad on purpose)
  ProfileEditFormLayout: React.ComponentType<any>;
  ProfileEditForm: React.ComponentType<any>;
  ProfileEditFormPatchStyles: React.ComponentType<any>;
  ProfileEditAdminEditNotice: React.ComponentType<any>;
  ProfileEditFormHints: React.ComponentType<any>;
  ProfileEditOnboardingNudge: React.ComponentType<any>;
  OnboardingIntroBanner: React.ComponentType<any>;
  ProfileEditPersonSectionShell: React.ComponentType<any>;
  ProfileEditPersonContactBlock: React.ComponentType<any>;
  ProfileEditPersonVisibilityLanguagesBlock: React.ComponentType<any>;
  ProfileEditPersonBioBlock: React.ComponentType<any>;
  ProfileEditorialMemberBioField: React.ComponentType<any>;
  ProfileEditPersonPhotoVisualBlock: React.ComponentType<any>;
  ProfileIdentityVisual: React.ComponentType<any>;
  ProfileMatchingSection: React.ComponentType<any>;
  ProfileEditCompanyActivitySectionShell: React.ComponentType<any>;
  ProfileEditCompanyActivitySlotsBlock: React.ComponentType<any>;
  TypicalClientSizesDropdown: React.ComponentType<any>;
  ProfileEditPassionsSection: React.ComponentType<any>;
  ProfileEditVisibilitySection: React.ComponentType<any>;
  ProfileEditUnpublishedSectionShell: React.ComponentType<any>;
  ProfileEditUnpublishedAdminFields: React.ComponentType<any>;
  ProfileFieldHint: React.ComponentType<any>;
  ProfileEditFormActions: React.ComponentType<any>;
  ProfileEditDangerZone: React.ComponentType<any>;
  ProfileEditSaveError: React.ComponentType<any>;
  ProfileEditNoProfilePanel: React.ComponentType<any>;

  // icons
  Trash2: React.ComponentType<any>;
  ChevronDown: React.ComponentType<any>;
  ChevronRight: React.ComponentType<any>;
  Plus: React.ComponentType<any>;
};

export type ProfileEditExpandedFormProps = {
  ctx: ProfileEditExpandedFormCtx;
};

export default function ProfileEditExpandedForm({ ctx }: ProfileEditExpandedFormProps) {
  const {
    profile,
    isEditing,
    ProfileEditFormLayout,
    profileFormLayoutRef,
    user,
    profileCompletionPct,
    editingSomeoneElse,
    isAdminEmail,
    OnboardingIntroBanner,
    t,
    ProfileEditOnboardingNudge,
    ProfileEditForm,
    directoryProfileFormRef,
    profileFormRemountKey,
    handleSaveProfile,
    cn,
    isEditProfileRoute,
    ProfileEditFormPatchStyles,
    ProfileEditAdminEditNotice,
    editingProfile,
    pickLang,
    lang,
    ProfileEditFormHints,
    profileEditFrUx,
    PROFILE_FIELD_LABELS,
    PROFILE_FIELD_HELP,
    formDraftT,
    formDraftC,
    profileWhatsappDialDefault,
    profileWhatsappLocalDefault,
    phoneDialRowsOrderedForUi,
    dialLabelForLang,
    ProfileEditPersonSectionShell,
    ProfileEditPersonContactBlock,
    ProfileEditPersonVisibilityLanguagesBlock,
    workingLanguagesDraft,
    toggleWorkingLanguageDraft,
    WORKING_LANGUAGE_OPTIONS,
    communicationLanguageDraft,
    setCommunicationLanguageDraft,
    profilePhotoUrlDraft,
    ProfileEditPersonBioBlock,
    ProfileEditorialMemberBioField,
    ProfileEditPersonPhotoVisualBlock,
    ProfileIdentityVisual,
    setProfilePhotoUrlDraft,
    ProfileMatchingSection,
    highlightedNeedsDraft,
    toggleHighlightedNeedDraft,
    ProfileEditCompanyActivitySectionShell,
    ProfileEditCompanyActivitySlotsBlock,
    companyActivitiesDraft,
    setCompanyActivitiesDraft,
    emptyCompanyActivitySlot,
    companyActivityEditCollapsed,
    setCompanyActivityEditCollapsed,
    updateCompanyActivitySlot,
    ACTIVITY_CATEGORIES,
    activityCategoryLabel,
    CITIES,
    cityOptionLabel,
    WORK_FUNCTION_OPTIONS,
    workFunctionLabel,
    EMPLOYEE_COUNT_RANGES,
    employeeCountToSelectDefault,
    TypicalClientSizesDropdown,
    Trash2,
    ChevronDown,
    ChevronRight,
    Plus,
    ProfileEditPassionsSection,
    passionIdsDraft,
    setPassionIdsDraft,
    sanitizePassionIds,
    ProfileEditVisibilitySection,
    formAdminPrivateReady,
    formAdminPrivate,
    ProfileEditUnpublishedSectionShell,
    ProfileEditUnpublishedAdminFields,
    NATIONALITY_OPTIONS,
    nationalityLabel,
    ProfileFieldHint,
    ProfileEditFormActions,
    profileSaveBusy,
    setIsEditing,
    setEditingProfile,
    setIsProfileExpanded,
    ProfileEditDangerZone,
    handleDeleteProfile,
    profileSaveError,
    ProfileEditSaveError,
    ProfileEditNoProfilePanel,
  } = ctx;

  return (
    <>
      {profile || isEditing ? (
        <ProfileEditFormLayout ref={profileFormLayoutRef}>
          <div className="min-w-0 space-y-6">
            <ProfileEditOnboardingNudge
              user={user}
              profile={profile}
              profileCompletionPct={profileCompletionPct}
              editingSomeoneElse={editingSomeoneElse}
              isAdminEmail={isAdminEmail}
              OnboardingIntroBanner={OnboardingIntroBanner}
              t={t}
            />
            <ProfileEditForm
              ref={directoryProfileFormRef}
              formKey={profileFormRemountKey}
              onSubmit={handleSaveProfile}
              className={cn('space-y-8', isEditProfileRoute && 'profile-edit-density space-y-6')}
            >
              {isEditProfileRoute ? <ProfileEditFormPatchStyles /> : null}
              <ProfileEditAdminEditNotice show={Boolean(editingProfile && editingProfile.uid !== user.uid)}>
                {pickLang(
                  `Vous modifiez la fiche de ${editingProfile?.fullName || editingProfile?.email || editingProfile?.uid}. Les changements s’appliquent à son compte annuaire.`,
                  `Estás editando la ficha de ${editingProfile?.fullName || editingProfile?.email || editingProfile?.uid}. Los cambios se aplican a su ficha del directorio.`,
                  `You are editing ${editingProfile?.fullName || editingProfile?.email || editingProfile?.uid}'s profile. Changes apply to their directory entry.`,
                  lang
                )}
              </ProfileEditAdminEditNotice>
              <ProfileEditFormHints
                requiredLegend={t('profileFormRequiredLegend')}
                showDraftHint={Boolean(user && !editingSomeoneElse)}
                draftHint={t('profileFormDraftLocalHint')}
              />

              <ProfileEditPersonSectionShell
                lang={lang}
                t={t}
                pickLang={pickLang}
                isEditProfileRoute={isEditProfileRoute}
                identityTitle={t('profileFormSectionIdentity')}
              >
                <ProfileEditPersonContactBlock
                  lang={lang}
                  t={t}
                  pickLang={pickLang}
                  isEditProfileRoute={isEditProfileRoute}
                  profileEditFrUx={profileEditFrUx}
                  labels={{
                    fullName: PROFILE_FIELD_LABELS.fullName,
                    email: PROFILE_FIELD_LABELS.email,
                    linkedinUrl: PROFILE_FIELD_LABELS.linkedinUrl,
                    countryDialCode: PROFILE_FIELD_LABELS.countryDialCode,
                    phoneWhatsapp: PROFILE_FIELD_LABELS.phoneWhatsapp,
                  }}
                  help={{ phoneWhatsapp: PROFILE_FIELD_HELP.phoneWhatsapp }}
                  formDraftT={formDraftT}
                  profile={profile}
                  editingProfile={editingProfile}
                  userEmail={user.email ?? null}
                  profileWhatsappDialDefault={profileWhatsappDialDefault}
                  profileWhatsappLocalDefault={profileWhatsappLocalDefault}
                  phoneDialRowsOrderedForUi={phoneDialRowsOrderedForUi}
                  dialLabelForLang={dialLabelForLang}
                />

                <ProfileEditPersonVisibilityLanguagesBlock
                  lang={lang}
                  t={t}
                  isEditProfileRoute={isEditProfileRoute}
                  profileEditFrUx={profileEditFrUx}
                  labels={{ languages: PROFILE_FIELD_LABELS.languages }}
                  help={{ languages: PROFILE_FIELD_HELP.languages }}
                  formDraftC={formDraftC}
                  profile={profile}
                  editingProfile={editingProfile}
                  workingLanguagesDraft={workingLanguagesDraft}
                  toggleWorkingLanguageDraft={toggleWorkingLanguageDraft}
                  workingLanguageOptions={WORKING_LANGUAGE_OPTIONS}
                  communicationLanguageDraft={communicationLanguageDraft}
                  setCommunicationLanguageDraft={setCommunicationLanguageDraft}
                />

                <ProfileEditPersonBioBlock
                  lang={lang}
                  t={t}
                  pickLang={pickLang}
                  isEditProfileRoute={isEditProfileRoute}
                  profileEditFrUx={profileEditFrUx}
                  labels={{ bio: PROFILE_FIELD_LABELS.bio }}
                  help={{ bio: PROFILE_FIELD_HELP.bio }}
                  formDraftT={formDraftT}
                  profile={profile}
                  editingProfile={editingProfile}
                  ProfileEditorialMemberBioField={ProfileEditorialMemberBioField}
                />

                <ProfileEditPersonPhotoVisualBlock
                  lang={lang}
                  t={t}
                  pickLang={pickLang}
                  profileEditFrUx={profileEditFrUx}
                  labels={{ profilePhoto: PROFILE_FIELD_LABELS.profilePhoto }}
                  userDisplayName={user?.displayName ?? null}
                  profile={profile}
                  editingProfile={editingProfile}
                  profilePhotoUrlDraft={profilePhotoUrlDraft}
                  setProfilePhotoUrlDraft={setProfilePhotoUrlDraft}
                  ProfileIdentityVisual={ProfileIdentityVisual}
                />
              </ProfileEditPersonSectionShell>

              <ProfileMatchingSection
                lang={lang}
                t={t}
                pickLang={pickLang}
                profileEditFrUx={profileEditFrUx}
                isEditProfileRoute={isEditProfileRoute}
                formDraftT={formDraftT}
                editingProfile={editingProfile}
                profile={profile}
                highlightedNeedsDraft={highlightedNeedsDraft}
                onToggleHighlightedNeed={toggleHighlightedNeedDraft}
              />

              <ProfileEditCompanyActivitySectionShell lang={lang} t={t} pickLang={pickLang} isEditProfileRoute={isEditProfileRoute}>
                <ProfileEditCompanyActivitySlotsBlock
                  lang={lang}
                  t={t}
                  pickLang={pickLang}
                  isEditProfileRoute={isEditProfileRoute}
                  profileEditFrUx={profileEditFrUx}
                  slots={companyActivitiesDraft}
                  setSlots={setCompanyActivitiesDraft}
                  emptySlot={emptyCompanyActivitySlot}
                  collapsedById={companyActivityEditCollapsed}
                  setCollapsedById={setCompanyActivityEditCollapsed}
                  updateSlot={updateCompanyActivitySlot}
                  labels={{
                    companyName: PROFILE_FIELD_LABELS.companyName,
                    companyWebsite: PROFILE_FIELD_LABELS.companyWebsite,
                    sector: PROFILE_FIELD_LABELS.sector,
                    city: PROFILE_FIELD_LABELS.city,
                    district: PROFILE_FIELD_LABELS.district,
                    state: PROFILE_FIELD_LABELS.state,
                    country: PROFILE_FIELD_LABELS.country,
                    roleInCompany: PROFILE_FIELD_LABELS.roleInCompany,
                    arrivalYearInMexico: PROFILE_FIELD_LABELS.arrivalYearInMexico,
                    employeeRange: PROFILE_FIELD_LABELS.employeeRange,
                    companyType: PROFILE_FIELD_LABELS.companyType,
                    professionalStatus: PROFILE_FIELD_LABELS.professionalStatus,
                    typicalClientSizes: PROFILE_FIELD_LABELS.typicalClientSizes,
                    activityDescription: PROFILE_FIELD_LABELS.activityDescription,
                  }}
                  help={{
                    country: PROFILE_FIELD_HELP.country,
                    roleInCompany: PROFILE_FIELD_HELP.roleInCompany,
                    arrivalYearInMexico: PROFILE_FIELD_HELP.arrivalYearInMexico,
                    activityDescription: PROFILE_FIELD_HELP.activityDescription,
                  }}
                  activityCategories={ACTIVITY_CATEGORIES}
                  activityCategoryLabel={activityCategoryLabel}
                  cities={CITIES}
                  cityOptionLabel={cityOptionLabel}
                  workFunctionOptions={WORK_FUNCTION_OPTIONS}
                  workFunctionLabel={workFunctionLabel}
                  employeeCountRanges={EMPLOYEE_COUNT_RANGES}
                  employeeCountToSelectDefault={employeeCountToSelectDefault}
                  TypicalClientSizesDropdown={TypicalClientSizesDropdown}
                  icons={{ Trash2, ChevronDown, ChevronRight, Plus }}
                />
              </ProfileEditCompanyActivitySectionShell>

              <ProfileEditPassionsSection
                lang={lang}
                t={t}
                pickLang={pickLang}
                isEditProfileRoute={isEditProfileRoute}
                passionIdsDraft={passionIdsDraft}
                onChangePassions={(ids: string[]) => setPassionIdsDraft(sanitizePassionIds(ids))}
              />

              <ProfileEditVisibilitySection
                lang={lang}
                t={t}
                pickLang={pickLang}
                isEditProfileRoute={isEditProfileRoute}
                profileEditFrUx={profileEditFrUx}
                labels={{ openness: PROFILE_FIELD_LABELS.openness }}
                help={{ openness: PROFILE_FIELD_HELP.openness }}
                formDraftC={formDraftC}
                profile={profile}
                editingProfile={editingProfile}
              />

              {formAdminPrivateReady && formAdminPrivate !== null ? (
                <ProfileEditUnpublishedSectionShell
                  lang={lang}
                  t={t}
                  pickLang={pickLang}
                  isEditProfileRoute={isEditProfileRoute}
                  sectionKey={`unpublished-admin-${editingProfile?.uid ?? profile?.uid}`}
                >
                  <ProfileEditUnpublishedAdminFields
                    lang={lang}
                    t={t}
                    pickLang={pickLang}
                    isEditProfileRoute={isEditProfileRoute}
                    profileEditFrUx={profileEditFrUx}
                    labels={{
                      gender: PROFILE_FIELD_LABELS.gender,
                      nationality: PROFILE_FIELD_LABELS.nationality,
                      hostDelegations: PROFILE_FIELD_LABELS.hostDelegations,
                    }}
                    help={{ genderFr: PROFILE_FIELD_HELP.gender }}
                    formDraftT={formDraftT}
                    formDraftC={formDraftC}
                    formAdminPrivate={formAdminPrivate}
                    nationalityOptions={NATIONALITY_OPTIONS}
                    nationalityLabel={nationalityLabel}
                    ProfileFieldHint={ProfileFieldHint}
                  />
                </ProfileEditUnpublishedSectionShell>
              ) : null}

              <ProfileEditFormActions
                lang={lang}
                t={t}
                pickLang={pickLang}
                isEditProfileRoute={isEditProfileRoute}
                profileSaveBusy={profileSaveBusy}
                onCancel={() => {
                  setIsEditing(false);
                  setEditingProfile(null);
                  if (!isEditProfileRoute) {
                    setIsProfileExpanded(false);
                  }
                }}
              />

              <ProfileEditDangerZone
                show={!!(editingProfile?.uid ?? profile?.uid)}
                editingUid={editingProfile?.uid ?? profile?.uid ?? null}
                viewerUid={user?.uid ?? null}
                t={t}
                onConfirmDelete={(uid: string) => {
                  void handleDeleteProfile(uid);
                }}
              />

              <ProfileEditSaveError error={profileSaveError} />
            </ProfileEditForm>
          </div>
          {/* Profile completion card is sticky on /profile/edit */}
        </ProfileEditFormLayout>
      ) : (
        <ProfileEditNoProfilePanel t={t} PlusIcon={Plus} onRegister={() => setIsEditing(true)} />
      )}
    </>
  );
}

