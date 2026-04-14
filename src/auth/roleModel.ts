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
 * | View `/dashboard`                 |  ❌   |   ✅    |  ✅   |
 * | View `/admin`                     |  ❌   |   ❌    |  ✅   |
 * | Post requests / member actions     |  ❌   |   ✅    |  ✅   |
 *
 * Notes:
 * - "guest" means not authenticated (no `User`).
 * - "admin" is determined by profile role flag or email allowlist logic (kept for backward compat).
 */
export type AppRole = 'guest' | 'member' | 'admin';

export type RoleContext = {
  user: User | null;
  profile: Pick<UserProfile, 'role'> | null;
  viewerIsAdmin: boolean;
};

export function getAppRole(ctx: RoleContext): AppRole {
  if (!ctx.user) return 'guest';
  if (ctx.viewerIsAdmin || ctx.profile?.role === 'admin') return 'admin';
  return 'member';
}

export type RouteAccess = 'public' | 'member' | 'admin';

export function routeAccessForPath(pathname: string): RouteAccess {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  if (pathname === '/dashboard' || pathname === '/onboarding' || pathname === '/profile/edit')
    return 'member';
  return 'public';
}

export function canAccessRoute(role: AppRole, pathname: string): boolean {
  const need = routeAccessForPath(pathname);
  if (need === 'public') return true;
  if (need === 'member') return role === 'member' || role === 'admin';
  return role === 'admin';
}

