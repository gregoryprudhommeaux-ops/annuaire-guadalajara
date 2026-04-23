import React from 'react';

export type ProfileEditValidationCalloutProps = {
  show: boolean;
  message: string;
  icon: React.ReactNode;
};

export default function ProfileEditValidationCallout({
  show,
  message,
  icon,
}: ProfileEditValidationCalloutProps) {
  if (!show) return null;
  return (
    <div className="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
      <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg shrink-0">{icon}</div>
      <p className="text-[10px] text-amber-800 leading-relaxed font-medium">{message}</p>
    </div>
  );
}

