import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  closeLabel: string;
  paragraphs: readonly string[];
  onClose: () => void;
};

export default function LegalInfoModal({ open, title, closeLabel, paragraphs, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[220] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label={closeLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col rounded-t-2xl border border-stone-200 bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-6">
              <h2
                id="legal-modal-title"
                className="pr-8 text-lg font-bold leading-snug text-stone-900 sm:text-xl"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:right-4 sm:top-4"
                aria-label={closeLabel}
              >
                <Plus size={22} className="rotate-45" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="space-y-4 text-sm leading-relaxed text-stone-600">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-pretty">
                    {p}
                  </p>
                ))}
              </div>
            </div>
            <div className="shrink-0 border-t border-stone-100 px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 sm:w-auto sm:px-8"
              >
                {closeLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
