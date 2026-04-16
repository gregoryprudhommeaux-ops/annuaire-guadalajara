import React, { useEffect, useState } from 'react';
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

export type ProfileAvatarProps = {
  photoURL?: string | null;
  fullName: string;
  /** Classe du conteneur (taille, fond, etc.) — doit remplir la zone parente (ex. h-full w-full). */
  className?: string;
  imgClassName?: string;
  initialsClassName?: string;
  iconSize?: number;
  /** Si la photo charge : texte alternatif. Vide = image décorative (cartes denses). */
  imageAlt?: string;
};

/**
 * Affiche la photo si l’URL charge ; sinon initiales ou icône.
 * Aucun proxy externe : si l’URL ne charge pas, repli immédiat sur les initiales.
 */
export default function ProfileAvatar({
  photoURL,
  fullName,
  className,
  imgClassName,
  initialsClassName,
  iconSize = 24,
  imageAlt,
}: ProfileAvatarProps) {
  const trimmed = photoURL?.trim() || '';
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [trimmed]);

  const showImg = trimmed.length > 0 && !failed;
  const initials = profileInitialsFromName(fullName);

  return (
    <div className={cn('flex h-full w-full items-center justify-center bg-stone-100', className)}>
      {showImg ? (
        <img
          key={trimmed}
          src={trimmed}
          alt={imageAlt ?? ''}
          className={cn('h-full w-full object-cover', imgClassName)}
          onError={() => {
            if (import.meta.env.DEV) {
              console.warn('[ProfileAvatar] image load failed, using fallback', safeUrlPreviewForLog(trimmed));
            }
            setFailed(true);
          }}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
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
