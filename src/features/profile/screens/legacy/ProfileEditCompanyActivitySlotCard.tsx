import React from 'react';

export type ProfileEditCompanyActivitySlotCardProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  canRemove: boolean;
  onRemove?: () => void;
  removeLabel?: React.ReactNode;
  leadingToggleIcon: React.ReactNode;
  trailingToggleIcon: React.ReactNode;
  removeIcon?: React.ReactNode;
  children: React.ReactNode;
};

export default function ProfileEditCompanyActivitySlotCard({
  title,
  subtitle,
  collapsed,
  onToggleCollapsed,
  canRemove,
  onRemove,
  removeLabel,
  leadingToggleIcon,
  trailingToggleIcon,
  removeIcon,
  children,
}: ProfileEditCompanyActivitySlotCardProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
          aria-expanded={!collapsed}
          onClick={onToggleCollapsed}
        >
          {collapsed ? trailingToggleIcon : leadingToggleIcon}
        </button>

        <span className="min-w-0 flex-1 text-xs font-bold uppercase tracking-wide text-stone-800">
          {title}
          {subtitle ? (
            <span className="ml-1 font-semibold normal-case text-stone-600">— {subtitle}</span>
          ) : null}
        </span>

        {canRemove ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-100"
            onClick={onRemove}
          >
            {removeIcon}
            {removeLabel}
          </button>
        ) : null}
      </div>

      {children}
    </div>
  );
}

