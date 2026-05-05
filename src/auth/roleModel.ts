import type { User } from 'firebase/auth';
import type { UserProfile } from '@/types';

/**
 * Central role model (single source of truth).
 *
 * Access matrix (high level)
 *
 * | Capability / Area                  | guest | member | admin |
 * |------------------------------------|:-----:|:------:|:-----:|
 * | View `/` (public landing)          |  ✅   |   ✅    |  ✅   |
 * | View `/network` + `/requests`      |  ✅   |   ✅    |  ✅   |
 * | View `/stats/share` (vitrine lien)|  ✅   |   ✅    |  ✅   |
 * | View `/stats` (vitrine interne)    |  ❌   |   ❌    |  ✅   |
 * | View `/dashboard`                 |  ❌   |   ✅    |  ✅   |
 * | View `/admin`                     |  ❌   |   ❌    |  ✅   |
 * | Post requests / member actions     |  ❌   |   ✅    |  ✅   |
 *
 * Notes:
 * - "guest" means not authenticated (no `User`).
 * - "admin" is determined by profile role flag or email allowlist logic (kept for backward compat).
 */
export type AppRole = 'guest' | 'viewer' | 'member' | 'admin';

export type RoleContext = {
  user: User | null;
  profile: Pick<UserProfile, 'role'> | null;
  viewerIsAdmin: boolean;
  viewerAccess: { expiresAtMs: number } | null;
};

export function getAppRole(ctx: RoleContext): AppRole {
  if (!ctx.user) {
    if (ctx.viewerAccess && Number.isFinite(ctx.viewerAccess.expiresAtMs) && ctx.viewerAccess.expiresAtMs > Date.now()) {
      return 'viewer';
    }
    return 'guest';
  }
  if (ctx.viewerIsAdmin || ctx.profile?.role === 'admin') return 'admin';
  return 'member';
}

export type RouteAccess = 'public' | 'viewer' | 'member' | 'admin';

export function routeAccessForPath(pathname: string): RouteAccess {
  // Page vitrine publique à partager (hors shell app, lecture sans compte admin).
  if (pathname === '/stats/share') return 'public';
  if (pathname === '/stats' || pathname.startsWith('/stats/')) return 'admin';
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  if (pathname === '/communication' || pathname.startsWith('/communication/')) return 'admin';
  if (pathname === '/dashboard') return 'viewer';
  if (pathname === '/onboarding' || pathname === '/profile/edit') return 'member';
  return 'public';
}

export function canAccessRoute(role: AppRole, pathname: string): boolean {
  const need = routeAccessForPath(pathname);
  if (need === 'public') return true;
  if (need === 'viewer') return role === 'viewer' || role === 'member' || role === 'admin';
  if (need === 'member') return role === 'member' || role === 'admin';
  return role === 'admin';
}

