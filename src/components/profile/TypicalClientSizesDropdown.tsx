import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Language } from '../../types';
import { cn } from '../../cn';
import {
  TYPICAL_CLIENT_SIZE_VALUES,
  type TypicalClientSize,
  typicalClientSizeLabel,
} from '../../lib/contactPreferences';

type Props = {
  value: TypicalClientSize[];
  onChange: (next: TypicalClientSize[]) => void;
  lang: Language;
  max?: number;
  emptyLabel: string;
  maxHint: string;
  className?: string;
  /** Même valeur que `htmlFor` du label externe (accessibilité). */
  fieldId: string;
};

/**
 * Liste déroulante multi-sélection (cases à cocher), max 3 tailles de clients habituels.
 */
export function TypicalClientSizesDropdown({
  value,
  onChange,
  lang,
  max = 3,
  emptyLabel,
  maxHint,
  className,
  fieldId,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toggle = (v: TypicalClientSize) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else if (value.length < max) {
      onChange([...value, v]);
    }
  };

  const summary =
    value.length === 0
      ? emptyLabel
      : value.map((v) => typicalClientSizeLabel(v, lang)).join(' · ');

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <button
        type="button"
        id={fieldId}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 text-left text-sm outline-none transition-all',
          'focus:ring-2 focus:ring-stone-900',
          value.length === 0 && 'text-stone-500'
        )}
      >
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-stone-500 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
          role="listbox"
          aria-multiselectable="true"
        >
          {(TYPICAL_CLIENT_SIZE_VALUES as readonly TypicalClientSize[]).map((v) => {
            const checked = value.includes(v);
            const disabled = !checked && value.length >= max;
            return (
              <label
                key={v}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 px-3 py-2.5 text-sm hover:bg-stone-50',
                  disabled && 'cursor-not-allowed opacity-50 hover:bg-white'
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(v)}
                />
                <span className="min-w-0 leading-snug text-stone-800">{typicalClientSizeLabel(v, lang)}</span>
              </label>
            );
          })}
          {value.length >= max ? (
            <p className="border-t border-stone-100 px-3 py-2 text-[11px] text-stone-500">{maxHint}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
