function trimTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, '');
}

const DEFAULT_PRODUCTION_ORIGIN = 'https://www.franconetwork.app';

/**
 * Domaine public du site.
 * 1) `VITE_PUBLIC_SITE_URL` si défini (staging / autre domaine)
 * 2) build production : `https://www.franconetwork.app`
 * 3) sinon `window.location.origin` (ex. localhost en dev)
 */
export function getPublicSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return trimTrailingSlashes(fromEnv);
  if (import.meta.env.PROD) return DEFAULT_PRODUCTION_ORIGIN;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/** Lien d’inscription court à partager (ex. https://www.franconetwork.app/join). */
export function getSignupJoinUrl(): string {
  const origin = getPublicSiteOrigin();
  if (!origin) return '/join';
  return `${origin}/join`;
}
