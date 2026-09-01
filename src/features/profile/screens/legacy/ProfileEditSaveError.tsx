import React from 'react';
import { AlertCircle } from 'lucide-react';

export type ProfileEditSaveErrorProps = {
  error: string | null;
};

export default function ProfileEditSaveError({ error }: ProfileEditSaveErrorProps) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-900"
    >
      <AlertCircle className="mt-0.5 shrink-0 text-rose-600" size={18} aria-hidden />
      <p>{error}</p>
    </div>
  );
}
