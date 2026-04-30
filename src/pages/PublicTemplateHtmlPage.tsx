import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

type PublicTemplateDoc = {
  name: string;
  subject: string;
  bodyHtml: string;
};

export default function PublicTemplateHtmlPage() {
  const { id } = useParams();
  const templateId = (id ?? '').trim();
  const [data, setData] = useState<PublicTemplateDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) {
      setError('Lien invalide.');
      return;
    }
    const ref = doc(db, 'publicEmailTemplates', templateId);
    return onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setData(null);
          setError('Template introuvable.');
          return;
        }
        setError(null);
        setData(snap.data() as PublicTemplateDoc);
      },
      (err) => setError(err.message)
    );
  }, [templateId]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 text-sm font-semibold text-rose-800">
        {error}
      </div>
    );
  }

  if (!data) return null;

  // Page "brute" pratique pour partager un lien qui affiche juste l'HTML.
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="mb-4 border-b border-stone-200 pb-3">
          <h1 className="text-lg font-extrabold text-stone-900">{data.name || data.subject}</h1>
          {data.subject ? <p className="mt-1 text-sm font-semibold text-stone-600">{data.subject}</p> : null}
        </div>
        <div dangerouslySetInnerHTML={{ __html: data.bodyHtml }} />
      </div>
    </div>
  );
}

