import React from 'react';

export type ProfileEditSaveErrorProps = {
  error: string | null;
};

export default function ProfileEditSaveError({ error }: ProfileEditSaveErrorProps) {
  if (!error) return null;
  return <p className="mt-3 text-xs text-red-600">{error}</p>;
}

