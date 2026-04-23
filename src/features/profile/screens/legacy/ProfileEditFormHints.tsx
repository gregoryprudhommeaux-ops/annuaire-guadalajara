import React from 'react';

export type ProfileEditFormHintsProps = {
  requiredLegend: string;
  showDraftHint: boolean;
  draftHint: string;
};

export default function ProfileEditFormHints({
  requiredLegend,
  showDraftHint,
  draftHint,
}: ProfileEditFormHintsProps) {
  return (
    <div className="space-y-1.5">
      <p className="rounded-md border border-stone-200/70 bg-stone-50/60 px-2 py-1 text-[11px] leading-snug text-stone-500">
        {requiredLegend}
      </p>
      {showDraftHint ? (
        <p className="rounded-md border border-blue-100/70 bg-blue-50/50 px-2 py-1 text-[11px] leading-snug text-blue-900/90">
          {draftHint}
        </p>
      ) : null}
    </div>
  );
}

