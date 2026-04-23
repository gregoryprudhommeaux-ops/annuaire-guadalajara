import React from 'react';

export type ProfileEditExpandedSectionProps = {
  children: React.ReactNode;
};

export default function ProfileEditExpandedSection({ children }: ProfileEditExpandedSectionProps) {
  return <div className="mt-6">{children}</div>;
}

