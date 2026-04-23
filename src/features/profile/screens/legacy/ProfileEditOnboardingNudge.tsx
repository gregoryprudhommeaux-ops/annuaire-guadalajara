import React from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/types';

export type ProfileEditOnboardingNudgeProps = {
  user: User | null;
  profile: UserProfile | null;
  profileCompletionPct: number;
  editingSomeoneElse: boolean;
  isAdminEmail: (email: string | null | undefined) => boolean;
  OnboardingIntroBanner: React.ComponentType<{ t: (key: string) => string; className?: string }>;
  t: (key: string) => string;
};

export default function ProfileEditOnboardingNudge({
  user,
  profile,
  profileCompletionPct,
  editingSomeoneElse,
  isAdminEmail,
  OnboardingIntroBanner,
  t,
}: ProfileEditOnboardingNudgeProps) {
  const show =
    !!user &&
    profileCompletionPct < 100 &&
    profileCompletionPct <= 50 &&
    profile?.isValidated !== true &&
    !editingSomeoneElse &&
    !isAdminEmail(user.email);

  if (!show) return null;
  return <OnboardingIntroBanner t={t} className="w-full" />;
}

