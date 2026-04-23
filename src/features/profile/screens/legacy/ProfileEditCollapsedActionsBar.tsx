import React from 'react';
import { Link } from 'react-router-dom';

export type ProfileEditCollapsedActionsBarProps = {
  show: boolean;
  t: (key: string) => string;
  hasProfileUid: boolean;
  viewerIsAdmin: boolean;
  onSharePublicProfileLink: (e: React.MouseEvent) => void;
  onOpenPostRequest: () => void;
  onAdminCreateEventClick: () => void;
  icons: {
    Share2: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    Megaphone: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    Calendar: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  };
};

export default function ProfileEditCollapsedActionsBar({
  show,
  t,
  hasProfileUid,
  viewerIsAdmin,
  onSharePublicProfileLink,
  onOpenPostRequest,
  onAdminCreateEventClick,
  icons,
}: ProfileEditCollapsedActionsBarProps) {
  if (!show) return null;
  const { Share2, Megaphone, Calendar } = icons;

  return (
    <div
      className="flex flex-wrap gap-2 border-t border-stone-100 px-4 py-3 sm:px-5"
      onClick={(e) => e.stopPropagation()}
    >
      {hasProfileUid ? (
        <button
          type="button"
          onClick={onSharePublicProfileLink}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-sm transition-colors hover:bg-stone-50"
        >
          <Share2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('profileSharePublicCta')}
        </button>
      ) : null}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenPostRequest();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
      >
        <Megaphone className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('memberRequestsPostCta')}
      </button>

      {viewerIsAdmin ? (
        <Link
          to="/evenements"
          onClick={(e) => {
            e.stopPropagation();
            onAdminCreateEventClick();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900 transition-colors hover:bg-indigo-100"
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('profileCreateEventCta')}
        </Link>
      ) : null}
    </div>
  );
}

