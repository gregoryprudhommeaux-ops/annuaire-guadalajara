// Centralized palette for Vitrine / stats charts (Recharts & related UI).

export const chartTheme = {
  // Palette catégorielle principale (opportunités, secteurs, etc.)
  categorical: [
    '#2563eb', // bleu
    '#0891b2', // cyan
    '#0f766e', // teal
    '#d97706', // amber
    '#ea580c', // orange
    '#e11d48', // rose
    '#7c3aed', // violet
    '#475569', // slate
  ],

  categoricalSoft: [
    '#dbeafe',
    '#cffafe',
    '#ccfbf1',
    '#fef3c7',
    '#ffedd5',
    '#ffe4e6',
    '#ede9fe',
    '#e2e8f0',
  ],

  state: {
    success: '#16a34a',
    warning: '#ca8a04',
    danger: '#dc2626',
  },

  base: {
    axis: '#e5e7eb',
    label: '#475569',
    labelMuted: '#64748b',
    tooltipBg: '#0f172a',
    tooltipText: '#e2e8f0',
  },
} as const;

export function getChartColor(index: number): string {
  const palette = chartTheme.categorical;
  return palette[index % palette.length]!;
}

export function hexToRgba(hex: string, alpha = 1): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
