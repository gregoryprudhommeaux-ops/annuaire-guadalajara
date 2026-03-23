/** Nombre de fiches visibles pour un visiteur sans compte annuaire (pas de doc `users`). */
export const GUEST_DIRECTORY_PREVIEW_LIMIT = 3;

export function isGuestDirectoryRestricted(
  user: unknown,
  directoryProfile: unknown,
  viewerIsAdmin: boolean
): boolean {
  if (viewerIsAdmin) return false;
  if (!user) return true;
  return !directoryProfile;
}
