import { chartTheme } from '@/lib/chartTheme';

/** Brand UI (boutons, en-têtes stats) — inchangé. */
export const STATS_PRIMARY = '#01696f';
export const STATS_PRIMARY_HOVER = '#015a5f';
/** Fond accent très léger (équivalent ~ teal 50) */
export const STATS_ACCENT_BG = 'rgb(230 245 245)';

/** Barres / secteurs : palette catégorielle centralisée (`chartTheme`). */
export const STATS_CHART_BAR_COLORS: readonly string[] = chartTheme.categorical;
