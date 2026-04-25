import type { CrossPick } from '@/components/dashboard/PassionsCrossHeatmap';

export const FRANCO_ADMIN_KEY_SCROLL = 'francoAdmin:scrollTo';
export const FRANCO_ADMIN_KEY_AFFINITY = 'francoAdmin:pendingAffinity';

export function queueAdminDashboardScroll(id: string) {
  try {
    window.sessionStorage.setItem(FRANCO_ADMIN_KEY_SCROLL, id);
  } catch {
    // ignore
  }
}

export function queueAdminDashboardAffinity(cross: CrossPick) {
  try {
    window.sessionStorage.setItem(FRANCO_ADMIN_KEY_AFFINITY, JSON.stringify(cross));
  } catch {
    // ignore
  }
}
