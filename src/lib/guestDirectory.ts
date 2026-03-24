/** Nombre de fiches visibles pour un visiteur sans fiche annuaire (ou non connecté). */
export const GUEST_DIRECTORY_PREVIEW_LIMIT = 4;

export function isGuestDirectoryRestricted(
  user: unknown,
  directoryProfile: unknown,
  viewerIsAdmin: boolean
): boolean {
  if (viewerIsAdmin) return false;
  if (!user) return true;
  return !directoryProfile;
}
