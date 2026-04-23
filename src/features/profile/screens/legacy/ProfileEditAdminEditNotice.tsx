import React from 'react';

export type ProfileEditAdminEditNoticeProps = {
  show: boolean;
  children: React.ReactNode;
};

export default function ProfileEditAdminEditNotice({ show, children }: ProfileEditAdminEditNoticeProps) {
  if (!show) return null;
  return (
    <p
      className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium leading-relaxed text-indigo-950"
      role="status"
    >
      {children}
    </p>
  );
}

