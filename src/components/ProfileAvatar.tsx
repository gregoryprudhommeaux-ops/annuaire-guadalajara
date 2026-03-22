import React, { useEffect, useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '../cn';
import { profileInitialsFromName } from '../lib/profileInitials';

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
 * Gère les URL externes cassées (LinkedIn, etc.) via onError.
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

  useEffect(() => {
    setFailed(false);
  }, [trimmed]);

  const showImg = trimmed.length > 0 && !failed;
  const initials = profileInitialsFromName(fullName);

  return (
    <div className={cn('flex h-full w-full items-center justify-center bg-stone-100', className)}>
      {showImg ? (
        <img
          src={trimmed}
          alt=""
          className={cn('h-full w-full object-cover', imgClassName)}
          onError={() => setFailed(true)}
          loading="lazy"
          decoding="async"
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
