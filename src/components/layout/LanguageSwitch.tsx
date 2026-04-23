import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { cn } from '@/lib/cn';

export type LanguageCode = 'fr' | 'es' | 'en';

export type LanguageSwitchProps = {
  value: LanguageCode;
  onChange: (v: LanguageCode) => void;
  className?: string;
};

const ITEMS: Array<{ code: LanguageCode; label: string }> = [
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

/**
 * Icône globe + code langue courant, menu déroulant (discret, peu de place).
 */
export function LanguageSwitch({ value, onChange, className }: LanguageSwitchProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = ITEMS.find((l) => l.code === value) ?? ITEMS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative inline-flex shrink-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        className={cn(
          'inline-flex min-h-[40px] items-center gap-1.5 rounded-md px-1.5 py-1.5 sm:min-h-0',
          'text-xs font-medium text-[var(--fn-muted)] transition-colors',
          'outline-none hover:text-[var(--fn-fg)]/90',
          'focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]'
        )}
        aria-label={`Langue : ${current.label}`}
      >
        <Globe className="h-3.5 w-3.5 shrink-0 text-[var(--fn-muted)]" strokeWidth={2} aria-hidden />
        <span className="font-medium tabular-nums text-[var(--fn-fg)]">{current.label}</span>
        <ChevronDown
          className={cn('h-3 w-3 shrink-0 text-[var(--fn-muted)]/80 transition-transform', open && 'rotate-180')}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Choisir la langue"
          className="absolute right-0 z-[60] mt-0.5 min-w-[8.25rem] overflow-hidden rounded-md border border-[var(--fn-border)] bg-[var(--fn-surface)] py-0.5 text-xs shadow-sm"
        >
          {ITEMS.map((it) => {
            const active = it.code === value;
            return (
              <li key={it.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left font-medium transition-colors',
                    active
                      ? 'bg-[var(--fn-surface-2)] text-[var(--fn-fg)]'
                      : 'text-[var(--fn-muted)] hover:bg-[var(--fn-surface-2)]/80 hover:text-[var(--fn-fg)]'
                  )}
                  onClick={() => {
                    onChange(it.code);
                    setOpen(false);
                  }}
                >
                  <span className="tabular-nums">{it.label}</span>
                  {active ? <Check className="h-3.5 w-3.5 shrink-0 text-[var(--fn-fg)]" strokeWidth={2.5} aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
