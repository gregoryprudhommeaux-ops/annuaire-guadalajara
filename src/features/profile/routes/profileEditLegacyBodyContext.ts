import type { ComponentType, PropsWithChildren, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { Language, UserProfile } from '@/types';
import type { ProfileEditAdminProfileHeaderContentProps } from '@/features/profile/screens/legacy/ProfileEditAdminProfileHeaderContent';
import type { ProfileEditCollapsedActionsBarProps } from '@/features/profile/screens/legacy/ProfileEditCollapsedActionsBar';
import type { ProfileEditExpandedFormCtx } from '@/features/profile/routes/ProfileEditExpandedForm';

type CollapsedActionsCtx = Pick<
  ProfileEditCollapsedActionsBarProps,
  | 'viewerIsAdmin'
  | 'onSharePublicProfileLink'
  | 'onOpenPostRequest'
  | 'onAdminCreateEventClick'
  | 'icons'
>;

/**
 * Context bag for `ProfileEditLegacyBodyContent` so the profile-edit page JSX stays out of `App.tsx`.
 */
export type ProfileEditLegacyBodyCtx = {
  cn: (...classes: Array<string | false | null | undefined>) => string;
  pageSectionPad: string;
  isEditProfileRoute: boolean;
  showAdminSelfProfilePanel: boolean;
  isProfileExpanded: boolean;
  setIsProfileExpanded: (v: boolean) => void;
  setIsEditing: (v: boolean) => void;
  user: User | null;
  profile: UserProfile | null;
  editingProfile: UserProfile | null;
  editingSomeoneElse: boolean;
  profileVisibilityBandHidden: boolean;
  setProfileVisibilityBandHidden: (v: boolean) => void;
  pickLang: (fr: string, es: string, en: string, lang: Language) => string;
  lang: Language;
  t: (key: string) => string;
  profileCompletionPct: number;
  profileCoachLine: string;
  profileCoachLoading: boolean;
  profileCoachSource: string;
  profileSaveSuccess: string | null;
  isAdminEmail: (email: string | null | undefined) => boolean;
  adminHeaderProps: ProfileEditAdminProfileHeaderContentProps;
  collapsedActions: CollapsedActionsCtx;
  onApplyOptimizationSuggestion: () => void;
  expandedFormCtx: ProfileEditExpandedFormCtx;
  // Leaf components: keep as ComponentType<any> to match real components without mirroring every prop
  ProfileEditLegacyBody: ComponentType<{ className?: string; children?: ReactNode }>;
  ProfileEditCard: ComponentType<any>;
  ProfileEditCardHeader: ComponentType<any>;
  ProfileEditAdminProfileHeaderContent: ComponentType<ProfileEditAdminProfileHeaderContentProps>;
  ProfileEditExpandMotion: ComponentType<PropsWithChildren<{ open: boolean }>>;
  ProfileEditExpandedContainer: ComponentType<any>;
  ProfileEditValidationCallout: ComponentType<any>;
  ProfileEditOptimizationCallout: ComponentType<any>;
  ProfileEditCollapsedActionsBar: ComponentType<ProfileEditCollapsedActionsBarProps>;
  ProfileEditSaveSuccessBanner: ComponentType<{ message: string | null }>;
  ProfileEditExpandedSection: ComponentType<any>;
  ProfileEditExpandedForm: ComponentType<{ ctx: ProfileEditExpandedFormCtx }>;
  Users: ComponentType<any>;
};
