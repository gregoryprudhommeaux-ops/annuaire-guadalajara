import React from 'react';
import { useStatsPagePdfState } from '@/lib/statsPagePdfBridge';
import type { Language } from '@/types';

const BRAND = '#1a3a2a';

function label(busy: boolean, lang: Language) {
  if (busy) {
    return lang === 'en' ? 'Exporting…' : lang === 'es' ? 'Exportando…' : 'Export…';
  }
  return lang === 'en'
    ? 'Export Google Slides'
    : lang === 'es'
      ? 'Exportar Google Slides'
      : 'Exporter Google Slides';
}

/**
 * Bouton d’export Google Slides affiché dans le bandeau (à gauche de « Se déconnecter » sur `/stats`).
 * L’action est fournie par {@link setStatsPagePdfState} dans `StatsPage` (bridge).
 */
export function StatsPdfHeaderButton({ lang }: { lang: Language }) {
  const state = useStatsPagePdfState();
  if (!state) return null;

  const run = () => {
    try {
      const r = state.print();
      if (r && typeof (r as Promise<unknown>).catch === 'function') {
        void (r as Promise<unknown>).catch((e) => console.error(e));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button
      type="button"
      // `pointerdown` is more reliable than `click` on some browsers with sticky/backdrop-filter.
      onPointerDown={run}
      onClick={run}
      disabled={state.busy}
      className="stats-pdf-header-btn shrink-0 select-none rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
      style={{ background: BRAND, touchAction: 'manipulation' }}
    >
      {label(state.busy, lang)}
    </button>
  );
}
