import ProfileAvatar from '../ProfileAvatar';
import { cn } from '../../cn';

export type ProfileIdentityVisualSize = 'md' | 'lg' | 'xl';

export type ProfileIdentityVisualProps = {
  fullName: string;
  photoUrl?: string | null;
  /** Réservé pour extensions (crédibilité) ; le formulaire garde le champ LinkedIn à part. */
  linkedinUrl?: string | null;
  size?: ProfileIdentityVisualSize;
  className?: string;
  /** Texte alternatif si la photo charge (sinon chaîne vide, initiales/icône restent décoratives). */
  imageAlt?: string;
  /** Rend l’avatar cliquable (upload photo). */
  onPhotoClick?: () => void;
  photoClickLabel?: string;
  /** Masque le nom à côté de l’avatar (formulaire photo). */
  hideName?: boolean;
};

const dimensions: Record<ProfileIdentityVisualSize, string> = {
  md: 'h-14 w-14 min-h-14 min-w-14',
  lg: 'h-20 w-20 min-h-20 min-w-20',
  xl: 'h-32 w-32 min-h-32 min-w-32',
};

const iconBySize: Record<ProfileIdentityVisualSize, number> = {
  md: 22,
  lg: 30,
  xl: 40,
};

export default function ProfileIdentityVisual({
  fullName,
  photoUrl,
  size = 'md',
  className,
  imageAlt,
  onPhotoClick,
  photoClickLabel,
  hideName = false,
}: ProfileIdentityVisualProps) {
  const displayName = fullName.trim();
  const avatarShell = (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-full border border-stone-200 bg-stone-50 shadow-sm ring-2 ring-white',
        dimensions[size],
        onPhotoClick &&
          'cursor-pointer transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#01696f]'
      )}
    >
      <ProfileAvatar
        photoURL={photoUrl}
        fullName={displayName}
        className="h-full w-full"
        iconSize={iconBySize[size]}
        imageAlt={imageAlt}
      />
    </div>
  );

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {onPhotoClick ? (
        <button
          type="button"
          onClick={onPhotoClick}
          aria-label={photoClickLabel}
          className="shrink-0 rounded-full border-0 bg-transparent p-0"
        >
          {avatarShell}
        </button>
      ) : (
        avatarShell
      )}
      {displayName && !hideName ? (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-900">{displayName}</p>
        </div>
      ) : null}
    </div>
  );
}
