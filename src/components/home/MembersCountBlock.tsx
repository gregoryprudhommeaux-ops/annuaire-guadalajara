import React from 'react';
import { Share2, Sparkles } from 'lucide-react';
import { cn } from '../../cn';
import { cardPad } from '../../lib/pageLayout';

type TFn = (key: string) => string;

type Props = {
  t: TFn;
  memberCount: number;
  sectorCount: number;
  threshold: number;
  onCreateProfile: () => void;
  /** Membre connecté avec un profil annuaire : masque le CTA « lancement » et affiche l’invitation. */
  registeredWithProfile?: boolean;
  onOpenInvite?: () => void;
};

/** [MEMBERS-COUNT] Bloc lancement (peu de membres) ou stats enrichies. */
export default function MembersCountBlock({
  t,
  memberCount,
  sectorCount,
  threshold,
  onCreateProfile,
  registeredWithProfile = false,
  onOpenInvite,
}: Props) {
  if (memberCount < threshold) {
    if (registeredWithProfile && onOpenInvite) {
      return (
        <div className="min-w-0 rounded-[10px] border border-emerald-200 bg-emerald-50/90 p-3.5 sm:p-4">
          <div className="flex min-w-0 gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm ring-1 ring-emerald-100"
              aria-hidden
            >
              <Share2 className="h-5 w-5 text-emerald-700" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 break-words">{t('inviteNetworkTitle')}</p>
              <p className="mt-1 text-[13px] leading-snug text-slate-600 break-words hyphens-auto">
                {t('inviteNetworkSubtitle')}
              </p>
              <button
                type="button"
                data-testid="invite-network-cta"
                onClick={onOpenInvite}
                className="mt-3 text-left text-sm font-semibold text-emerald-800 underline-offset-2 hover:text-emerald-950 hover:underline"
              >
                {t('inviteNetworkCta')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-w-0 rounded-[10px] border border-blue-100 bg-blue-50/90 p-3.5 sm:p-4">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm" aria-hidden>
            <Sparkles className="h-5 w-5 text-blue-700" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 break-words">{t('launchTitle')}</p>
            <p className="mt-1 text-[13px] leading-snug text-slate-500 break-words hyphens-auto">
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

  if (parts.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'min-w-0 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm',
        cardPad
      )}
    >
      <p className="hyphens-auto break-words leading-relaxed">
        {parts.map((segment, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-slate-400"> · </span>}
            {segment}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
}
