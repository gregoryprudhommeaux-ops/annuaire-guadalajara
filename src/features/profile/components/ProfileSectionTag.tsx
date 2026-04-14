import React from 'react';

export type ProfileSectionTagProps = {
  tone?: 'public' | 'matching' | 'internal';
  label: string;
};

export function ProfileSectionTag({ tone = 'public', label }: ProfileSectionTagProps) {
  return <span className={`profile-section-tag profile-section-tag--${tone}`}>{label}</span>;
}
