/**
 * Exemple : formulaire autonome qui persiste uniquement `passionIds` (merge Firestore).
 * L’app principale enregistre le profil complet dans App.tsx ; ce fichier sert de référence.
 */
import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { Language } from '@/types';
import { sanitizePassionIds, MAX_PASSIONS } from '@/lib/passionConfig';
import { IceBreakerInterests } from '@/components/profile/IceBreakerInterests';

export type ProfileFormProps = {
  uid: string;
  initialPassionIds: string[];
  lang: Language;
};

const saveErrorText: Record<Language, string> = {
  fr: 'Erreur lors de la sauvegarde des centres d’intérêt.',
  en: 'Could not save interests.',
  es: 'No se pudieron guardar los intereses.',
};

const savingText: Record<Language, string> = {
  fr: 'Enregistrement…',
  en: 'Saving…',
  es: 'Guardando…',
};

const submitText: Record<Language, string> = {
  fr: 'Enregistrer',
  en: 'Save',
  es: 'Guardar',
};

const ProfileForm: React.FC<ProfileFormProps> = ({ uid, initialPassionIds, lang }) => {
  const [passionIdsDraft, setPassionIdsDraft] = useState<string[]>(
    sanitizePassionIds(initialPassionIds ?? [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const clean = sanitizePassionIds(passionIdsDraft);
      await setDoc(doc(db, 'users', uid), { passionIds: clean }, { merge: true });
    } catch (err) {
      console.error(err);
      setError(saveErrorText[lang] ?? saveErrorText.fr);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <IceBreakerInterests
        lang={lang}
        value={passionIdsDraft}
        onChange={(ids) => setPassionIdsDraft(sanitizePassionIds(ids))}
        maxSelected={MAX_PASSIONS}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {saving ? savingText[lang] ?? savingText.fr : submitText[lang] ?? submitText.fr}
      </button>
    </form>
  );
};

export default ProfileForm;
