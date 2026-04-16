import React, { useEffect, useMemo, useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '../cn';
import { profileInitialsFromName } from '../lib/profileInitials';

function safeUrlPreviewForLog(url: string): string {
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    const s = u.toString();
    return s.length > 140 ? `${s.slice(0, 140)}…` : s;
  } catch {
    return url.length > 140 ? `${url.slice(0, 140)}…` : url;
  }
}

/** Hôtes connus pour les photos de profil LinkedIn (hotlink souvent capricieux). */
export function isLinkedInCdnPhotoUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === 'media.licdn.com' || h.endsWith('.licdn.com') || h.includes('media.linkedin.com');
  } catch {
    return false;
  }
}

export type ProfileAvatarProps = {
  photoURL?: string | null;
  fullName: string;
  /** Classe du conteneur (taille, fond, etc.) — doit remplir la zone parente (ex. h-full w-full). */
  className?: string;
  imgClassName?: string;
  initialsClassName?: string;
  iconSize?: number;
};

/**
 * Affiche la photo si l’URL charge ; sinon initiales ou icône.
 * LinkedIn : ne pas forcer no-referrer (souvent 403) ; repli wsrv.nl si l’image refuse de charger.
 */
export default function ProfileAvatar({
  photoURL,
  fullName,
  className,
  imgClassName,
  initialsClassName,
  iconSize = 24,
}: ProfileAvatarProps) {
  const trimmed = photoURL?.trim() || '';
  const [failed, setFailed] = useState(false);
  const [linkedInProxy, setLinkedInProxy] = useState(false);

  const isLinkedIn = useMemo(() => isLinkedInCdnPhotoUrl(trimmed), [trimmed]);

  useEffect(() => {
    setFailed(false);
    setLinkedInProxy(false);
  }, [trimmed]);

  const imgSrc = useMemo(() => {
    if (!trimmed) return '';
    if (linkedInProxy && isLinkedIn) {
      return `https://wsrv.nl/?url=${encodeURIComponent(trimmed)}&n=-1`;
    }
    return trimmed;
  }, [trimmed, isLinkedIn, linkedInProxy]);

  const showImg = imgSrc.length > 0 && !failed;
  const initials = profileInitialsFromName(fullName);

  /* LinkedIn direct : laisser le référent par défaut du navigateur (no-referrer → 403 fréquent). */
  const referrerPolicy: React.HTMLAttributeReferrerPolicy | undefined =
    linkedInProxy || !isLinkedIn ? 'no-referrer' : undefined;

  return (
    <div className={cn('flex h-full w-full items-center justify-center bg-stone-100', className)}>
      {showImg ? (
        <img
          key={imgSrc}
          src={imgSrc}
          alt=""
          className={cn('h-full w-full object-cover', imgClassName)}
          onError={() => {
            if (isLinkedIn && !linkedInProxy) {
              setLinkedInProxy(true);
              return;
            }
            if (import.meta.env.DEV) {
              console.warn('[ProfileAvatar] image load failed, using fallback', safeUrlPreviewForLog(trimmed));
            }
            setFailed(true);
          }}
          loading="lazy"
          decoding="async"
          referrerPolicy={referrerPolicy}
        />
      ) : initials && fullName.trim() ? (
        <span
          className={cn(
            'select-none font-bold uppercase tracking-tight text-stone-500 text-[10px] leading-none sm:text-xs',
            initialsClassName
          )}
          aria-hidden
        >
          {initials}
        </span>
      ) : (
        <UserIcon size={iconSize} className="text-stone-300" aria-hidden />
      )}
    </div>
  );
}
