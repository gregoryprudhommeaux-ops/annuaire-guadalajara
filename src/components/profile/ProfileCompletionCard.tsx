import React, { useMemo } from 'react';
import { cn } from '../../cn';
import type { Language } from '../../types';
import {
  getPriorityMissingFields,
  getProfileCompletionPercent,
  profileCompletionDefaultLabels,
  type ProfileCompletionInput,
} from '../../lib/profileCompletion';

type TFn = (key: string) => string;

export type ProfileCompletionCardProps = {
  profile: ProfileCompletionInput;
  t: TFn;
  lang: Language;
  className?: string;
  onEditField?: (fieldKey: string) => void;
  rightActions?: React.ReactNode;
};

export function ProfileCompletionCard({
  profile,
  t,
  lang,
  className,
  onEditField,
  rightActions,
}: ProfileCompletionCardProps) {
  const labels = useMemo(() => profileCompletionDefaultLabels(lang), [lang]);
  const percent = getProfileCompletionPercent(profile);
  const missing = useMemo(
    () => getPriorityMissingFields(profile, labels),
    [profile, labels]
  );

  const title = useMemo(() => {
    const raw = t('profileCompletionTitle');
    return raw
      .replace(/\{\{percent\}\}/g, String(percent))
      .replace(/\{percent\}/g, String(percent));
  }, [t, percent]);

  return (
    <aside
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm',
        className
      )}
      aria-labelledby="profile-completion-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            {t('profileCompletionEyebrow')}
          </p>
          <h2 id="profile-completion-title" className="mt-2 text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t('profileCompletionDescription')}</p>
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-start justify-end gap-3">
            <div>
              <div className="text-2xl font-semibold tracking-tight text-slate-900">{percent}%</div>
              <div className="text-xs text-slate-500">{t('profileCompletionProgressShort')}</div>
            </div>
            {rightActions ? <div className="pt-0.5">{rightActions}</div> : null}
          </div>
        </div>
      </div>

      <div
        className="mt-4 h-2 rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('profileCompletionProgressShort')}
      >
        <div
          className="h-2 rounded-full bg-teal-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {missing.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-slate-900">{t('profileCompletionNextBestActions')}</p>
          <div className="mt-3 space-y-2">
            {missing.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={!onEditField}
                onClick={() => onEditField?.(item.key)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left',
                  onEditField
                    ? 'cursor-pointer hover:bg-slate-100'
                    : 'cursor-default opacity-80'
                )}
              >
                <span className="text-sm text-slate-700">{item.label}</span>
                <span className="text-xs font-medium text-teal-700">
                  {t('profileCompletionCompleteNow')}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

export default ProfileCompletionCard;
