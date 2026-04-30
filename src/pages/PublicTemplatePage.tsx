import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { Copy, MessageCircle } from 'lucide-react';
import { db } from '@/firebase';
import { EmailPreview } from '@/components/admin/EmailPreview';

type PublicTemplateDoc = {
  name: string;
  subject: string;
  bodyHtml: string;
  updatedAt?: unknown;
};

export default function PublicTemplatePage() {
  const { id } = useParams();
  const templateId = (id ?? '').trim();
  const [data, setData] = useState<PublicTemplateDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/t/${encodeURIComponent(templateId)}`;
  }, [templateId]);

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleWhatsApp = () => {
    const msg = `Template: ${data?.name ?? data?.subject ?? templateId}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#01696f]">
            Template
          </p>
          <h1 className="mt-2 break-words text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
            {data?.name ?? data?.subject ?? '—'}
          </h1>
          {data?.subject ? (
            <p className="mt-1 break-words text-sm font-semibold text-stone-600">
              {data.subject}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
          >
            <Copy className="h-4 w-4" aria-hidden />
            {copied ? 'Copié' : 'Copier le lien'}
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-100"
            disabled={!data}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            WhatsApp
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      {data ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <EmailPreview subject={data.subject} bodyHtml={data.bodyHtml} />
          <p className="mt-2 text-[11px] text-stone-500">
            Approximation visuelle. Le rendu final est généré côté serveur par React Email + Resend.
          </p>
        </div>
      ) : null}
    </div>
  );
}

