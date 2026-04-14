import React from 'react';

export type ProfileFieldHintProps = {
  children: React.ReactNode;
};

export function ProfileFieldHint({ children }: ProfileFieldHintProps) {
  return <p className="profile-field-hint">{children}</p>;
}
