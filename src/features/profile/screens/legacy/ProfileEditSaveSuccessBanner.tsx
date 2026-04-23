import React from 'react';

export type ProfileEditSaveSuccessBannerProps = {
  message: string | null;
};

export default function ProfileEditSaveSuccessBanner({ message }: ProfileEditSaveSuccessBannerProps) {
  if (!message) return null;
  return (
    <div className="mx-4 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 sm:mx-6 sm:text-sm">
      {message}
    </div>
  );
}

