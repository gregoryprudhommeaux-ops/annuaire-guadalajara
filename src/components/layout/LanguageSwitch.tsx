import React from 'react';
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
 * Minimal, premium language switch (no heavy pills).
 * Designed to be passed into AppHeader `rightSlot`.
 */
export function LanguageSwitch({ value, onChange, className }: LanguageSwitchProps) {
  return (
    <div
      className={cn(
        'inline-flex overflow-hidden rounded-[var(--fn-radius-sm)] border border-[var(--fn-border)] bg-[var(--fn-surface)]',
        className
      )}
      role="group"
      aria-label="Langue"
    >
      {ITEMS.map((it) => {
        const active = it.code === value;
        return (
          <button
            key={it.code}
            type="button"
            onClick={() => onChange(it.code)}
            aria-pressed={active}
            className={cn(
              'min-h-[44px] px-2.5 text-xs font-semibold tracking-wide outline-none transition-colors',
              'focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]',
              active ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'text-[var(--fn-muted)] hover:bg-[var(--fn-surface-2)]'
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

