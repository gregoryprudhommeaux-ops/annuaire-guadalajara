import { useSyncExternalStore } from 'react';

export type StatsPagePdfState = {
  print: () => void | Promise<void>;
  busy: boolean;
} | null;

let pdfState: StatsPagePdfState = null;
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): StatsPagePdfState {
  return pdfState;
}

function getServerSnapshot(): StatsPagePdfState {
  return null;
}

/** Enregistre l’action PDF depuis `StatsPage` (et nettoie au démontage). */
export function setStatsPagePdfState(next: StatsPagePdfState) {
  pdfState = next;
  listeners.forEach((l) => l());
}

/** État + ré-abonnement : pour le bouton du bandeau (App) pendant `/stats`. */
export function useStatsPagePdfState(): StatsPagePdfState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
