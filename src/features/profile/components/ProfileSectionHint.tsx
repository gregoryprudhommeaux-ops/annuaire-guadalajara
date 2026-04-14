import React from 'react';

export type ProfileSectionHintProps = {
  tone?: 'public' | 'matching' | 'internal';
  children: React.ReactNode;
};

export function ProfileSectionHint({ tone = 'public', children }: ProfileSectionHintProps) {
  return <p className={`profile-section-hint profile-section-hint--${tone}`}>{children}</p>;
}
