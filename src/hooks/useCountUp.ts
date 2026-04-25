import { useEffect, useMemo, useState } from 'react';

const easeOutExpo = (t: number) => 1 - Math.pow(2, -10 * Math.min(1, Math.max(0, t)));

function usePrefersReducedMotion(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
}

/**
 * Compteur animé 0 → end, ease-out exponentiel, durée en ms.
 * `enabled` : lancer l’anim (souvent après IntersectionObserver).
 * Si `prefers-reduced-motion` : affiche `end` immédiatement.
 */
export function useCountUp(
  end: number,
  {
    duration = 1800,
    enabled,
  }: {
    duration?: number;
    /** Quand true, l’animation se joue (une fois) vers `end` actuel. */
    enabled: boolean;
  }
): number {
  const reduceMotion = usePrefersReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (reduceMotion) {
      setValue(end);
      return;
    }

    setValue(0);
    let raf = 0;
    const t0 = performance.now();
    const from = 0;
    const span = end - from;

    const step = (now: number) => {
      const elapsed = now - t0;
      const t = Math.min(1, elapsed / duration);
      const e = easeOutExpo(t);
      setValue(from + span * e);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [duration, enabled, end, reduceMotion]);

  return value;
}

export { usePrefersReducedMotion };
