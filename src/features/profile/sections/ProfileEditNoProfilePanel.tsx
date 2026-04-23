import React from 'react';

type TFn = (key: string) => string;

export type ProfileEditNoProfilePanelProps = {
  t: TFn;
  PlusIcon: React.ComponentType<{ size?: number }>;
  onRegister: () => void;
};

export default function ProfileEditNoProfilePanel({ t, PlusIcon, onRegister }: ProfileEditNoProfilePanelProps) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-50 text-stone-300">
        <PlusIcon size={32} />
      </div>
      <p className="mb-6 text-sm text-stone-500">{t('noProfile')}</p>
      <button
        type="button"
        onClick={onRegister}
        className="rounded-lg bg-stone-900 px-8 py-2 font-medium text-white transition-all hover:bg-stone-800"
      >
        {t('register')}
      </button>
    </div>
  );
}

