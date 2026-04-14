import { cn } from '@/lib/cn';

export {
  clampText,
  getInitials,
  getVisibleNeeds,
  normalizeCompanyName,
  normalizeSectorName,
} from './display';

/** Root motion.div / card surface (Tailwind + hook class for network.css). */
export function memberCardRootClassName(networkListing: boolean): string | false {
  return networkListing ? 'fn-network-member-card rounded-2xl' : false;
}

/** Default variant: member name heading. */
export function memberCardDefaultNameClassName(networkListing: boolean): string {
  return cn(
    'line-clamp-2 break-words font-bold leading-tight text-stone-900 transition-colors group-hover:text-stone-700',
    networkListing && 'fn-network-card-name text-base sm:text-[1.05rem]'
  );
}

/** Bio / activity excerpt under header. */
export function memberCardBioBodyClassName(networkListing: boolean): string {
  return cn(
    'line-clamp-2 leading-relaxed text-stone-600',
    networkListing ? 'fn-network-card-bio line-clamp-3 text-[13px]' : 'text-xs'
  );
}

/** Native tooltip when bio is long and listing uses network scan mode. */
export function memberCardBioTitleAttr(
  text: string,
  networkListing: boolean,
  minLength = 120
): string | undefined {
  const t = text.trim();
  if (!networkListing || t.length <= minLength) return undefined;
  return t;
}
