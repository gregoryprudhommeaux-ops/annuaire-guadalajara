import React from 'react';

export type ProfileEditDangerZoneProps = {
  show: boolean;
  editingUid: string | null;
  viewerUid: string | null;
  t: (key: string) => string;
  onConfirmDelete: (uid: string) => void;
};

export default function ProfileEditDangerZone({
  show,
  editingUid,
  viewerUid,
  t,
  onConfirmDelete,
}: ProfileEditDangerZoneProps) {
  if (!show || !editingUid) return null;

  return (
    <div className="mt-8 border-t border-red-100 pt-4">
      <p className="mb-2 text-xs text-stone-400">{t('profileFormDangerZoneLabel')}</p>
      <button
        type="button"
        className="text-xs text-red-500 underline decoration-red-500/80 underline-offset-2 hover:text-red-700"
        onClick={() => {
          if (
            !window.confirm(editingUid === viewerUid ? t('profileFormDeleteOwnConfirm') : t('confirmDelete'))
          ) {
            return;
          }
          onConfirmDelete(editingUid);
        }}
      >
        {t('deleteProfile')}
      </button>
    </div>
  );
}

