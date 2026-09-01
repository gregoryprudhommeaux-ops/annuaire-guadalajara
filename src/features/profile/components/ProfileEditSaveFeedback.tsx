import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ProfileEditSaveFeedbackProps = {
  success: string | null;
  error: string | null;
  /** Profile edit inside AppShell (mobile bottom nav). */
  inAppShell?: boolean;
  className?: string;
};

export function ProfileEditSaveFeedback({
  success,
  error,
  inAppShell = false,
  className,
}: ProfileEditSaveFeedbackProps) {
  if (!success && !error) return null;

  const isSuccess = Boolean(success);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed left-4 right-4 z-50 mx-auto flex max-w-lg items-start gap-3 rounded-xl border px-4 py-3 shadow-lg',
        inAppShell
          ? 'bottom-[calc(var(--fn-bottomnav-h)+env(safe-area-inset-bottom,0px)+12px)]'
          : 'bottom-4',
        isSuccess
          ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
          : 'border-rose-300 bg-rose-50 text-rose-950',
        className
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} aria-hidden />
      ) : (
        <AlertCircle className="mt-0.5 shrink-0 text-rose-600" size={20} aria-hidden />
      )}
      <p className="text-sm font-semibold leading-snug">{success ?? error}</p>
    </div>
  );
}

export default ProfileEditSaveFeedback;
