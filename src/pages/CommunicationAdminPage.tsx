import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageProvider';
import { AdminEmailManager } from '@/components/admin/AdminEmailManager';

/**
 * Page admin dédiée à la communication (campagnes email, templates, planification).
 * Accessible uniquement aux administrateurs via le bouton « Communication » de la barre principale.
 */
export default function CommunicationAdminPage() {
  const { lang } = useLanguage();
  const title = lang === 'es' ? 'Comunicación' : lang === 'en' ? 'Communication' : 'Communication';
  const lead =
    lang === 'es'
      ? 'Crear, programar y enviar correos a la comunidad.'
      : lang === 'en'
        ? 'Create, schedule and send emails to the community.'
        : 'Créer, programmer et envoyer des emails à la communauté.';
  const back =
    lang === 'es' ? 'Volver al panel' : lang === 'en' ? 'Back to dashboard' : 'Retour tableau de bord';

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-stone-900">{title}</h2>
          <p className="text-sm text-stone-500">{lead}</p>
        </div>
        <Link
          to="/admin"
          className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
        >
          {back}
        </Link>
      </div>

      <AdminEmailManager />
    </div>
  );
}
