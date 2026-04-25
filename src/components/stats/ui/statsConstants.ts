/** Palette locale page `/stats` (PDF-friendly, cohérente avec le brand teal). */
export const STATS_PRIMARY = '#01696f';
export const STATS_PRIMARY_HOVER = '#015a5f';
/** Fond accent très léger (équivalent ~ teal 50) */
export const STATS_ACCENT_BG = 'rgb(230 245 245)';

/**
 * Barres / séries : dégradé de teintes proches du primaire, lisibles en impression.
 */
export const STATS_CHART_BAR_COLORS: readonly string[] = [
  '#01696f',
  '#0c5a5f',
  '#2a7a7f',
  '#4a9094',
  '#6ba6a9',
  '#8cbbc0',
  '#adcfd2',
  '#4b5563',
] as const;
