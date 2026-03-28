import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackSpaRoute } from '@/utils/trackEvent';

const THROTTLE_MS = 4000;

/**
 * Enregistre les changements de route SPA dans `events_log` (anonyme, voir firestore.rules).
 */
export default function SpaRouteAnalytics() {
  const location = useLocation();
  const lastPathRef = useRef<string>('');
  const lastAtRef = useRef<number>(0);

  useEffect(() => {
    const path = `${location.pathname}${location.search || ''}`;
    const now = Date.now();
    if (path === lastPathRef.current && now - lastAtRef.current < THROTTLE_MS) return;
    lastPathRef.current = path;
    lastAtRef.current = now;
    void trackSpaRoute(path);
  }, [location.pathname, location.search]);

  return null;
}
