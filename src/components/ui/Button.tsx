import React from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

const base =
  'inline-flex items-center justify-center gap-2 select-none whitespace-nowrap ' +
  'min-h-[44px] rounded-[14px] px-4 py-3 text-sm font-medium ' +
  'outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)] ' +
  'disabled:cursor-not-allowed disabled:opacity-55';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]',
  secondary:
    'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]',
  ghost: 'bg-transparent text-[var(--text)] hover:bg-black/5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', fullWidth, leadingIcon, trailingIcon, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], fullWidth && 'w-full', className)}
      {...props}
    >
      {leadingIcon ? <span className="shrink-0" aria-hidden>{leadingIcon}</span> : null}
      <span className="min-w-0 truncate">{children}</span>
      {trailingIcon ? <span className="shrink-0" aria-hidden>{trailingIcon}</span> : null}
    </button>
  );
});

