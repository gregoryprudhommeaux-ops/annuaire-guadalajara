import React from 'react';
import { Sparkles } from 'lucide-react';

type TFn = (key: string) => string;

type Props = {
  t: TFn;
  memberCount: number;
  sectorCount: number;
  opportunitiesCount: number;
  threshold: number;
  onCreateProfile: () => void;
};

/** [MEMBERS-COUNT] Bloc lancement (peu de membres) ou stats enrichies. */
export default function MembersCountBlock({
  t,
  memberCount,
  sectorCount,
  opportunitiesCount,
  threshold,
  onCreateProfile,
}: Props) {
  if (memberCount < threshold) {
    return (
      <div className="min-w-0 rounded-[10px] border border-blue-100 bg-blue-50/90 p-3.5 sm:p-4">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm" aria-hidden>
            <Sparkles className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 break-words">{t('launchTitle')}</p>
            <p className="mt-1 text-[13px] leading-snug text-gray-500 break-words hyphens-auto">
              {t('launchSubtitle')}
            </p>
            <button
              type="button"
              onClick={onCreateProfile}
              className="mt-3 text-left text-sm font-semibold text-blue-700 underline-offset-2 hover:text-blue-800 hover:underline"
            >
              {t('launchCta')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const parts: string[] = [];
  if (memberCount > 0) {
    parts.push(`${memberCount} ${t('statsMembers')}`);
  }
  if (sectorCount > 0) {
    parts.push(`${sectorCount} ${t('statsSectors')}`);
  }
  if (opportunitiesCount > 0) {
    parts.push(`${opportunitiesCount} ${t('statsOpportunities')}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 shadow-sm">
      <p className="hyphens-auto break-words leading-relaxed">
        {parts.map((segment, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-gray-400"> · </span>}
            {segment}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
}
