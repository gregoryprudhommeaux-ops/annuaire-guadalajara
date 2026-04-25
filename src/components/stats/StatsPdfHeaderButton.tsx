import React from 'react';
import { useStatsPagePdfState } from '@/lib/statsPagePdfBridge';
import type { Language } from '@/types';

const BRAND = '#1a3a2a';

function label(busy: boolean, lang: Language) {
  if (busy) {
    return lang === 'en' ? 'Preparing…' : lang === 'es' ? 'Preparando…' : 'Préparation…';
  }
  return lang === 'en' ? 'Download PDF' : lang === 'es' ? 'Descargar PDF' : 'Télécharger en PDF';
}

/**
 * Bouton d’export PDF affiché dans le bandeau (à gauche de « Se déconnecter » sur `/stats`).
 * L’action est fournie par {@link setStatsPagePdfState} dans `StatsPage`.
 */
export function StatsPdfHeaderButton({ lang }: { lang: Language }) {
  const state = useStatsPagePdfState();
  if (!state) return null;
  return (
    <button
      type="button"
      onClick={() => void state.print()}
      disabled={state.busy}
      className="stats-pdf-header-btn shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
      style={{ background: BRAND }}
    >
      {label(state.busy, lang)}
    </button>
  );
}
