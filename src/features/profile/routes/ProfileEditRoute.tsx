import React from 'react';
import type { Language, UserProfile } from '@/types';
import type { ProfileCompletionInput } from '@/lib/profileCompletion';
import ProfileEditScreen from '@/features/profile/screens/ProfileEditScreen';
import ProfileEditLegacyBodyContent from '@/features/profile/routes/ProfileEditLegacyBodyContent';
import type { ProfileEditLegacyBodyCtx } from '@/features/profile/routes/profileEditLegacyBodyContext';

type TFn = (key: string) => string;

export type ProfileEditRouteProps = {
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
  ctx: ProfileEditLegacyBodyCtx;
  /** True when the route is under `AppShell` (header + mobile bottom bar). Affects sticky offsets and scroll margin. */
  inAppShell?: boolean;
};

export default function ProfileEditRoute(props: ProfileEditRouteProps) {
  const { ctx, inAppShell, ...screenProps } = props;
  return (
    <ProfileEditScreen
      {...screenProps}
      inAppShell={inAppShell}
      body={<ProfileEditLegacyBodyContent ctx={ctx} />}
    />
  );
}

