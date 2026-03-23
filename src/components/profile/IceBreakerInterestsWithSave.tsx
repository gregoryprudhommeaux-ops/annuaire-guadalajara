/**
 * Variante autosave : réutilise {@link IceBreakerInterests} et persiste `passionIds` sur Firestore (merge).
 * Debounce léger pour limiter les écritures ; `db` vient de `@/firebase`.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { Language } from '@/types';
import { sanitizePassionIds, MAX_PASSIONS } from '@/lib/passionConfig';
import { IceBreakerInterests } from '@/components/profile/IceBreakerInterests';

const DEBOUNCE_MS = 450;

export type IceBreakerInterestsWithSaveProps = {
  uid: string;
  lang: Language;
  initialValue?: string[];
  maxSelected?: number;
};

const statusText: Record<Language, { saving: string; error: string }> = {
  fr: {
    saving: 'Sauvegarde en cours…',
    error: 'Impossible de sauvegarder. Réessaie.',
  },
  en: {
    saving: 'Saving…',
    error: 'Could not save. Try again.',
  },
  es: {
    saving: 'Guardando…',
    error: 'No se pudo guardar. Reintenta.',
  },
};

export function IceBreakerInterestsWithSave({
  uid,
  lang,
  initialValue,
  maxSelected = MAX_PASSIONS,
}: IceBreakerInterestsWithSaveProps) {
  const [selected, setSelected] = useState(() => sanitizePassionIds(initialValue ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCleanRef = useRef<string[] | null>(null);
  const uidRef = useRef(uid);
  uidRef.current = uid;

  const initialKey = JSON.stringify(sanitizePassionIds(initialValue ?? []));
  useEffect(() => {
    setSelected(sanitizePassionIds(initialValue ?? []));
  }, [uid, initialKey]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingCleanRef.current = null;
  }, [uid]);

  const runSave = useCallback(
    async (clean: string[]) => {
      const targetUid = uidRef.current;
      setSaving(true);
      setError(null);
      try {
        await setDoc(doc(db, 'users', targetUid), { passionIds: clean }, { merge: true });
      } catch (e) {
        console.error(e);
        setError(statusText[lang] ?? statusText.fr.error);
      } finally {
        setSaving(false);
      }
    },
    [lang]
  );

  const scheduleSave = useCallback(
    (clean: string[]) => {
      pendingCleanRef.current = clean;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        const toWrite = pendingCleanRef.current;
        if (toWrite) void runSave(toWrite);
      }, DEBOUNCE_MS);
    },
    [runSave]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const last = pendingCleanRef.current;
      if (last) {
        void setDoc(doc(db, 'users', uidRef.current), { passionIds: last }, { merge: true });
      }
    };
  }, []);

  const handleChange = (ids: string[]) => {
    const clean = sanitizePassionIds(ids);
    setSelected(clean);
    setError(null);
    scheduleSave(clean);
  };

  const t = statusText[lang] ?? statusText.fr;

  return (
    <div className="min-w-0">
      <IceBreakerInterests
        lang={lang}
        value={selected}
        onChange={handleChange}
        maxSelected={maxSelected}
      />
      {saving && <p className="mt-2 text-xs text-slate-400">{t.saving}</p>}
      {error && !saving && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default IceBreakerInterestsWithSave;
