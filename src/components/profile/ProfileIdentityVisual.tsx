import ProfileAvatar from '../ProfileAvatar';
import { cn } from '../../cn';

export type ProfileIdentityVisualSize = 'md' | 'lg';

export type ProfileIdentityVisualProps = {
  fullName: string;
  photoUrl?: string | null;
  /** Réservé pour extensions (crédibilité) ; le formulaire garde le champ LinkedIn à part. */
  linkedinUrl?: string | null;
  size?: ProfileIdentityVisualSize;
  className?: string;
  /** Texte alternatif si la photo charge (sinon chaîne vide, initiales/icône restent décoratives). */
  imageAlt?: string;
};

const dimensions: Record<ProfileIdentityVisualSize, string> = {
  md: 'h-14 w-14 min-h-14 min-w-14',
  lg: 'h-20 w-20 min-h-20 min-w-20',
};

const iconBySize: Record<ProfileIdentityVisualSize, number> = {
  md: 22,
  lg: 30,
};

export default function ProfileIdentityVisual({
  fullName,
  photoUrl,
  size = 'md',
  className,
  imageAlt,
}: ProfileIdentityVisualProps) {
  const displayName = fullName.trim();
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div
        className={cn(
          'shrink-0 overflow-hidden rounded-full border border-stone-200 bg-stone-50 shadow-sm ring-2 ring-white',
          dimensions[size]
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
      {displayName ? (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-900">{displayName}</p>
        </div>
      ) : null}
    </div>
  );
}
