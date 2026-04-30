import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Copy,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  Loader2,
  Mail,
  Plus,
  Send,
  Trash2,
  Zap,
} from 'lucide-react';
import { auth } from '@/firebase';
import { EmailPreview } from './EmailPreview';
import { AdminAutomationsTab } from './AdminAutomationsTab';
import {
  createCampaign,
  createTemplate,
  DEFAULT_TEST_EMAIL,
  deleteCampaign,
  deleteTemplate,
  publishPublicEmailTemplateCallable,
  sendCampaignNowCallable,
  sendCampaignTestCallable,
  subscribeToCampaigns,
  subscribeToTemplates,
  updateCampaign,
  updateTemplate,
  type AudienceFilter,
  type CampaignDoc,
  type CampaignStatus,
  type EmailTemplateDoc,
} from '@/lib/emailManager';
import { FirebaseError } from 'firebase/app';

type Tab = 'campaigns' | 'templates' | 'automations';

type AudienceType = AudienceFilter['type'];

type ComposerState = {
  campaignId: string | null;
  name: string;
  subject: string;
  bodyHtml: string;
  audienceType: AudienceType;
  manualEmails: string;
  threshold: number;
  scheduleEnabled: boolean;
  scheduleAt: string;
};

const EMPTY_COMPOSER: ComposerState = {
  campaignId: null,
  name: '',
  subject: '',
  bodyHtml: '',
  audienceType: 'all',
  manualEmails: '',
  threshold: 80,
  scheduleEnabled: false,
  scheduleAt: '',
};

function formatDate(ts: { toDate?: () => Date } | null | undefined): string {
  if (!ts?.toDate) return '—';
  try {
    return ts.toDate().toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function audienceLabel(a: AudienceFilter): string {
  switch (a.type) {
    case 'all':
      return 'Tous les membres';
    case 'incomplete':
      return `Profils incomplets (< ${a.threshold ?? 80}%)`;
    case 'manual':
      return `${a.emails.length} adresse${a.emails.length > 1 ? 's' : ''} manuelle${
        a.emails.length > 1 ? 's' : ''
      }`;
  }
}

function statusPill(status: CampaignStatus): { label: string; cls: string } {
  switch (status) {
    case 'draft':
      return {
        label: 'Brouillon',
        cls: 'bg-stone-100 text-stone-700 border-stone-200',
      };
    case 'scheduled':
      return {
        label: 'Programmée',
        cls: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'sending':
      return {
        label: 'En envoi…',
        cls: 'bg-sky-50 text-sky-800 border-sky-200',
      };
    case 'sent':
      return {
        label: 'Envoyée',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'failed':
      return { label: 'Échec', cls: 'bg-rose-50 text-rose-800 border-rose-200' };
  }
}

function parseEmails(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
    )
  );
}

function buildAudience(c: ComposerState): AudienceFilter {
  if (c.audienceType === 'incomplete') {
    return { type: 'incomplete', threshold: Math.min(100, Math.max(1, c.threshold)) };
  }
  if (c.audienceType === 'manual') {
    return { type: 'manual', emails: parseEmails(c.manualEmails) };
  }
  return { type: 'all' };
}

function composerFromCampaign(c: CampaignDoc): ComposerState {
  return {
    campaignId: c.id,
    name: c.name,
    subject: c.subject,
    bodyHtml: c.bodyHtml,
    audienceType: c.audience.type,
    manualEmails:
      c.audience.type === 'manual' ? c.audience.emails.join('\n') : '',
    threshold: c.audience.type === 'incomplete' ? c.audience.threshold ?? 80 : 80,
    scheduleEnabled: Boolean(c.scheduledAt),
    scheduleAt: c.scheduledAt?.toDate
      ? toDatetimeLocal(c.scheduledAt.toDate())
      : '',
  };
}

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function AdminEmailManager() {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [campaigns, setCampaigns] = useState<CampaignDoc[]>([]);
  const [templates, setTemplates] = useState<EmailTemplateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [composer, setComposer] = useState<ComposerState>(EMPTY_COMPOSER);
  const [composerOpen, setComposerOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState<string>(DEFAULT_TEST_EMAIL);

  useEffect(() => {
    const unsubC = subscribeToCampaigns(
      (cs) => {
        setCampaigns(cs);
        setLoading(false);
      },
      (e) => setError(e.message)
    );
    const unsubT = subscribeToTemplates(
      (ts) => setTemplates(ts),
      (e) => setError(e.message)
    );
    return () => {
      unsubC();
      unsubT();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const uid = auth.currentUser?.uid ?? '';

  const handleSaveCampaign = async (
    sendNow: boolean,
    asScheduled: boolean
  ) => {
    if (!composer.subject.trim() || !composer.bodyHtml.trim()) {
      setToast('Sujet et corps obligatoires.');
      return;
    }
    if (composer.audienceType === 'manual' && parseEmails(composer.manualEmails).length === 0) {
      setToast('Au moins une adresse email valide est requise.');
      return;
    }
    let scheduledDate: Date | null = null;
    if (asScheduled) {
      if (!composer.scheduleAt) {
        setToast('Date de programmation requise.');
        return;
      }
      scheduledDate = new Date(composer.scheduleAt);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        setToast('La date doit être dans le futur.');
        return;
      }
    }

    setBusy('save');
    try {
      const audience = buildAudience(composer);
      let campaignId = composer.campaignId;

      if (campaignId) {
        await updateCampaign(campaignId, {
          name: composer.name || composer.subject,
          subject: composer.subject,
          bodyHtml: composer.bodyHtml,
          audience,
          scheduledAt: asScheduled ? scheduledDate : null,
          status: asScheduled ? 'scheduled' : 'draft',
        });
      } else {
        campaignId = await createCampaign({
          name: composer.name || composer.subject,
          subject: composer.subject,
          bodyHtml: composer.bodyHtml,
          audience,
          scheduledAt: asScheduled ? scheduledDate : null,
          createdBy: uid,
        });
      }

      if (sendNow && campaignId) {
        const res = await sendCampaignNowCallable(campaignId);
        setToast(
          `Envoi terminé : ${res.succeeded}/${res.recipients} reçus, ${res.failed} échecs.`
        );
      } else {
        setToast(asScheduled ? 'Campagne programmée.' : 'Campagne enregistrée.');
      }
      setComposer(EMPTY_COMPOSER);
      setComposerOpen(false);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setBusy(null);
    }
  };

  const handleSendTest = async () => {
    if (!composer.subject.trim() || !composer.bodyHtml.trim()) {
      setToast('Sujet et corps obligatoires pour un test.');
      return;
    }
    const to = testEmail.trim() || DEFAULT_TEST_EMAIL;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setToast(`Adresse de test invalide : ${to}`);
      return;
    }
    setBusy('test');
    try {
      const res = await sendCampaignTestCallable({
        subject: composer.subject,
        bodyHtml: composer.bodyHtml,
        name: composer.name || composer.subject,
        to,
      });
      setToast(`Test envoyé à ${res.to}.`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Envoi de test échoué.');
    } finally {
      setBusy(null);
    }
  };

  const handleSendExisting = async (id: string) => {
    if (!confirm('Envoyer cette campagne maintenant à toute l\'audience ?')) return;
    setBusy(`send-${id}`);
    try {
      const res = await sendCampaignNowCallable(id);
      setToast(
        `Envoi terminé : ${res.succeeded}/${res.recipients} reçus, ${res.failed} échecs.`
      );
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Envoi échoué.');
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Supprimer cette campagne ?')) return;
    setBusy(`del-c-${id}`);
    try {
      await deleteCampaign(id);
      setToast('Campagne supprimée.');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Suppression échouée.');
    } finally {
      setBusy(null);
    }
  };

  const handleSaveTemplate = async () => {
    if (!composer.subject.trim() || !composer.bodyHtml.trim()) {
      setToast('Sujet et corps obligatoires pour un template.');
      return;
    }
    if (!auth.currentUser) {
      setToast('Non connecté. Recharge la page et reconnecte-toi.');
      return;
    }
    setToast('Sauvegarde du template…');
    setBusy('save-tpl');
    try {
      await createTemplate({
        name: composer.name || composer.subject,
        subject: composer.subject,
        bodyHtml: composer.bodyHtml,
        createdBy: uid,
      });
      setToast('Template enregistré.');
      setTab('templates');
    } catch (err) {
      if (err instanceof FirebaseError) {
        if (err.code === 'permission-denied') {
          setToast(
            "Permission refusée (admin). Vérifie que les règles Firestore sont bien déployées et que ton compte est admin."
          );
        } else {
          setToast(`${err.code}: ${err.message}`);
        }
      } else {
        setToast(err instanceof Error ? err.message : 'Erreur sauvegarde template.');
      }
    } finally {
      setBusy(null);
    }
  };

  const handleCreateMonthlyStatsTemplate = async () => {
    setBusy('seed-monthly-stats');
    try {
      const subject = 'Communauté en chiffres — fin de mois';
      const bodyHtml = `<p>Bonjour,</p>
<p>Chaque fin de mois, nous partageons une synthèse publique et partageable de la communauté :</p>
<p><a href="https://franconetwork.app/stats/share?lang=fr"><strong>Voir « Communauté en chiffres »</strong></a></p>
<p>Vous pouvez ensuite :</p>
<ul>
  <li>partager cette page à votre équipe / réseau,</li>
  <li>ou rejoindre la plateforme pour apparaître au bon moment.</li>
</ul>
<p><a href="https://franconetwork.app/inscription">Rejoindre FrancoNetwork</a></p>`;

      await createTemplate({
        name: 'Fin de mois — Communauté en chiffres',
        subject,
        bodyHtml,
        createdBy: uid,
      });
      setToast('Template “Fin de mois — Communauté en chiffres” créé.');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Création du template échouée.');
    } finally {
      setBusy(null);
    }
  };

  const handleUseTemplate = (t: EmailTemplateDoc) => {
    setComposer({
      ...EMPTY_COMPOSER,
      name: t.name,
      subject: t.subject,
      bodyHtml: t.bodyHtml,
    });
    setComposerOpen(true);
    setTab('campaigns');
  };

  const handleEditTemplate = async (t: EmailTemplateDoc) => {
    const newName = prompt('Nom du template', t.name) ?? t.name;
    const newSubject = prompt('Sujet du template', t.subject) ?? t.subject;
    if (newName === t.name && newSubject === t.subject) return;
    setBusy(`tpl-${t.id}`);
    try {
      await updateTemplate(t.id, { name: newName, subject: newSubject });
      setToast('Template mis à jour.');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Supprimer ce template ?')) return;
    setBusy(`del-t-${id}`);
    try {
      await deleteTemplate(id);
      setToast('Template supprimé.');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Suppression échouée.');
    } finally {
      setBusy(null);
    }
  };

  const handleShareTemplate = async (tpl: EmailTemplateDoc) => {
    if (!auth.currentUser) {
      setToast('Non connecté.');
      return;
    }
    setBusy(`share-tpl-${tpl.id}`);
    setToast('Publication…');
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/t/${encodeURIComponent(tpl.id)}/html`;
      await publishPublicEmailTemplateCallable({
        templateId: tpl.id,
        name: tpl.name,
        subject: tpl.subject,
        bodyHtml: tpl.bodyHtml,
      });
      // Open via an anchor click to reduce popup-blocker issues
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setToast('Lien ouvert.');
    } catch (err) {
      if (err instanceof FirebaseError) {
        setToast(`${err.code}: ${err.message}`);
      } else {
        setToast(err instanceof Error ? err.message : 'Partage échoué.');
      }
    } finally {
      setBusy(null);
    }
  };

  const audienceCount = useMemo(() => {
    if (composer.audienceType === 'manual') return parseEmails(composer.manualEmails).length;
    return null;
  }, [composer.audienceType, composer.manualEmails]);

  return (
    <section className="mb-10" id="admin-emails">
      <header className="mb-4 max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#01696f]">
          Emails
        </p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
          Composer, programmer et envoyer
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Crée des campagnes ad hoc, sauve des templates réutilisables, programme
          un envoi futur ou envoie immédiatement. L&apos;email de bienvenue
          (à l&apos;inscription) et le récap hebdo (lundi 9h Guadalajara) tournent
          automatiquement en plus.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'campaigns', label: 'Campagnes', icon: Mail },
            { id: 'automations', label: 'Automatisations', icon: Zap },
            { id: 'templates', label: 'Templates', icon: FileText },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                active
                  ? 'bg-[#01696f] text-white shadow-sm'
                  : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {toast ? (
        <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-800">
          {toast}
        </div>
      ) : null}

      {tab === 'automations' ? (
        <AdminAutomationsTab />
      ) : tab === 'campaigns' ? (
        <>
          <div className="mb-4">
            {!composerOpen ? (
              <button
                type="button"
                onClick={() => {
                  setComposer(EMPTY_COMPOSER);
                  setComposerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#01696f] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#015c61]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Nouvelle campagne
              </button>
            ) : (
              <Composer
                state={composer}
                onChange={setComposer}
                templates={templates}
                onUseTemplate={handleUseTemplate}
                audienceCount={audienceCount}
                busy={busy}
                testEmail={testEmail}
                onChangeTestEmail={setTestEmail}
                onSendTest={handleSendTest}
                onCancel={() => {
                  setComposer(EMPTY_COMPOSER);
                  setComposerOpen(false);
                }}
                onSaveDraft={() => handleSaveCampaign(false, false)}
                onSaveTemplate={handleSaveTemplate}
                onSchedule={() => handleSaveCampaign(false, true)}
                onSendNow={() => handleSaveCampaign(true, false)}
              />
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/90">
                    <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">Nom</th>
                    <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">Audience</th>
                    <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">Statut</th>
                    <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">Programmée</th>
                    <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">Stats</th>
                    <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                        Chargement…
                      </td>
                    </tr>
                  ) : campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                        Aucune campagne pour l&apos;instant.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c) => {
                      const pill = statusPill(c.status);
                      return (
                        <tr
                          key={c.id}
                          className="border-b border-stone-100 align-top last:border-0 hover:bg-stone-50/60"
                        >
                          <td className="px-3 py-3 sm:px-4">
                            <div className="font-semibold text-stone-900">
                              {c.name || c.subject}
                            </div>
                            <div className="text-xs text-stone-500">{c.subject}</div>
                          </td>
                          <td className="px-3 py-3 text-stone-700 sm:px-4">
                            {audienceLabel(c.audience)}
                          </td>
                          <td className="px-3 py-3 sm:px-4">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${pill.cls}`}
                            >
                              {pill.label}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-stone-700 sm:px-4">
                            {c.scheduledAt ? formatDate(c.scheduledAt) : '—'}
                          </td>
                          <td className="px-3 py-3 text-xs text-stone-700 sm:px-4">
                            {c.stats
                              ? `${c.stats.succeeded}/${c.stats.recipients} reçus`
                              : '—'}
                            {c.lastError ? (
                              <div
                                className="mt-1 max-w-[200px] truncate text-rose-700"
                                title={c.lastError}
                              >
                                {c.lastError}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-3 py-3 sm:px-4">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setComposer(composerFromCampaign(c));
                                  setComposerOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                              >
                                <Copy className="h-3 w-3" aria-hidden />
                                Éditer
                              </button>
                              {c.status !== 'sending' && c.status !== 'sent' ? (
                                <button
                                  type="button"
                                  disabled={busy === `send-${c.id}`}
                                  onClick={() => handleSendExisting(c.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#01696f]/20 bg-[#e6f5f5]/60 px-2 py-1 text-xs font-semibold text-[#0a4f54] hover:bg-[#e6f5f5] disabled:opacity-60"
                                >
                                  {busy === `send-${c.id}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                                  ) : (
                                    <Send className="h-3 w-3" aria-hidden />
                                  )}
                                  Envoyer
                                </button>
                              ) : null}
                              <button
                                type="button"
                                disabled={busy === `del-c-${c.id}`}
                                onClick={() => handleDeleteCampaign(c.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                              >
                                <Trash2 className="h-3 w-3" aria-hidden />
                                Suppr.
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/90">
                  <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">Nom</th>
                  <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">Sujet</th>
                  <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">Modifié</th>
                  <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                      <p>
                        Aucun template. Crée-en un depuis le composer en cliquant sur « Sauver comme template ».
                      </p>
                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          disabled={busy === 'seed-monthly-stats'}
                          onClick={handleCreateMonthlyStatsTemplate}
                          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-60"
                        >
                          {busy === 'seed-monthly-stats' ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <Plus className="h-4 w-4" aria-hidden />
                          )}
                          Créer le template “Communauté en chiffres”
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  templates.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-stone-100 align-top last:border-0 hover:bg-stone-50/60"
                    >
                      <td className="px-3 py-3 font-semibold text-stone-900 sm:px-4">
                        {t.name}
                      </td>
                      <td className="px-3 py-3 text-stone-700 sm:px-4">{t.subject}</td>
                      <td className="px-3 py-3 text-stone-600 sm:px-4">
                        {formatDate(t.updatedAt)}
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUseTemplate(t)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                          >
                            <Copy className="h-3 w-3" aria-hidden />
                            Utiliser
                          </button>
                          <button
                            type="button"
                            disabled={busy === `share-tpl-${t.id}`}
                            onClick={() => handleShareTemplate(t)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-60"
                          >
                            {busy === `share-tpl-${t.id}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                            ) : null}
                            Partager
                          </button>
                          <button
                            type="button"
                            disabled={busy === `del-t-${t.id}`}
                            onClick={() => handleDeleteTemplate(t.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden />
                            Suppr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function Composer({
  state,
  onChange,
  templates,
  onUseTemplate,
  audienceCount,
  busy,
  testEmail,
  onChangeTestEmail,
  onSendTest,
  onCancel,
  onSaveDraft,
  onSaveTemplate,
  onSchedule,
  onSendNow,
}: {
  state: ComposerState;
  onChange: (s: ComposerState) => void;
  templates: EmailTemplateDoc[];
  onUseTemplate: (t: EmailTemplateDoc) => void;
  audienceCount: number | null;
  busy: string | null;
  testEmail: string;
  onChangeTestEmail: (v: string) => void;
  onSendTest: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  onSaveTemplate: () => void;
  onSchedule: () => void;
  onSendNow: () => void;
}) {
  const set = (patch: Partial<ComposerState>) => onChange({ ...state, ...patch });
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-stone-900">
          {state.campaignId ? 'Modifier la campagne' : 'Nouvelle campagne'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            aria-pressed={showPreview}
          >
            {showPreview ? (
              <EyeOff className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Eye className="h-3.5 w-3.5" aria-hidden />
            )}
            {showPreview ? 'Masquer l\'aperçu' : 'Afficher l\'aperçu'}
          </button>
          {templates.length > 0 ? (
            <select
              className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs"
              defaultValue=""
              onChange={(e) => {
                const t = templates.find((x) => x.id === e.target.value);
                if (t) onUseTemplate(t);
                e.target.value = '';
              }}
            >
              <option value="">Insérer un template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      <div
        className={
          showPreview
            ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch'
            : 'block'
        }
      >
        <div className={showPreview ? 'flex h-full flex-col' : undefined}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-stone-700">
          Nom interne (optionnel)
          <input
            value={state.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Ex: Annonce nouveau réseau"
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal text-stone-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-stone-700">
          Sujet *
          <input
            value={state.subject}
            onChange={(e) => set({ subject: e.target.value })}
            placeholder="Ex: Nouveautés du réseau cette semaine"
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal text-stone-900"
          />
        </label>
      </div>

      <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-stone-700">
        Corps HTML *
        <textarea
          value={state.bodyHtml}
          onChange={(e) => set({ bodyHtml: e.target.value })}
          rows={18}
          placeholder="<p>Bonjour…</p><p><a href='https://franconetwork.app'>En savoir plus</a></p>"
          className="min-h-[22rem] flex-1 rounded-lg border border-stone-200 px-3 py-2 font-mono text-xs text-stone-900"
        />
        <span className="text-[11px] font-normal text-stone-500">
          HTML inline supporté. Le corps est wrappé dans une coque commune
          (logo, footer). Saute des lignes avec &lt;p&gt; ou &lt;br/&gt;.
        </span>
      </label>

      <fieldset className="mt-4 rounded-xl border border-stone-200 bg-stone-50/60 p-3">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-wide text-stone-600">
          Audience
        </legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {(
            [
              { id: 'all', label: 'Tous les membres' },
              { id: 'incomplete', label: 'Profils incomplets' },
              { id: 'manual', label: 'Liste manuelle' },
            ] as const
          ).map((opt) => (
            <label key={opt.id} className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name="audience"
                checked={state.audienceType === opt.id}
                onChange={() => set({ audienceType: opt.id })}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {state.audienceType === 'incomplete' ? (
          <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-stone-700 sm:max-w-xs">
            Seuil (%)
            <input
              type="number"
              min={1}
              max={100}
              value={state.threshold}
              onChange={(e) =>
                set({ threshold: Number(e.target.value) || 80 })
              }
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal text-stone-900"
            />
          </label>
        ) : null}
        {state.audienceType === 'manual' ? (
          <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-stone-700">
            Adresses email (séparées par retour à la ligne, virgule ou point-virgule)
            <textarea
              value={state.manualEmails}
              onChange={(e) => set({ manualEmails: e.target.value })}
              rows={3}
              className="rounded-lg border border-stone-200 px-3 py-2 font-mono text-xs text-stone-900"
            />
            <span className="text-[11px] font-normal text-stone-500">
              {audienceCount ?? 0} adresse(s) valide(s).
            </span>
          </label>
        ) : null}
      </fieldset>

      <fieldset className="mt-4 rounded-xl border border-stone-200 bg-stone-50/60 p-3">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-wide text-stone-600">
          Programmation
        </legend>
        <label className="inline-flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={state.scheduleEnabled}
            onChange={(e) => set({ scheduleEnabled: e.target.checked })}
          />
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          Programmer un envoi futur
        </label>
        {state.scheduleEnabled ? (
          <input
            type="datetime-local"
            value={state.scheduleAt}
            onChange={(e) => set({ scheduleAt: e.target.value })}
            className="mt-2 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900"
          />
        ) : null}
      </fieldset>
        </div>

        {showPreview ? (
          <div className="h-full">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-600">
              Aperçu
            </p>
            <div className="lg:sticky lg:top-4">
              <EmailPreview
                subject={state.subject}
                bodyHtml={state.bodyHtml}
              />
              <p className="mt-2 text-[11px] text-stone-500">
                Approximation visuelle. Le rendu final est généré côté serveur
                par React Email + Resend.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <fieldset className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/40 p-3">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-wide text-amber-800">
          Envoi de test
        </legend>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-1 min-w-[220px] flex-col gap-1 text-xs font-semibold text-stone-700">
            Adresse de test
            <input
              type="email"
              value={testEmail}
              onChange={(e) => onChangeTestEmail(e.target.value)}
              placeholder={DEFAULT_TEST_EMAIL}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal text-stone-900"
            />
          </label>
          <button
            type="button"
            onClick={onSendTest}
            disabled={busy === 'test'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200 disabled:opacity-60"
          >
            {busy === 'test' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <FlaskConical className="h-4 w-4" aria-hidden />
            )}
            Envoyer un test
          </button>
        </div>
        <p className="mt-2 text-[11px] text-stone-600">
          Envoie une copie unique à l&apos;adresse ci-dessus avec le sujet préfixé
          <span className="font-mono"> [TEST]</span>. Aucun impact sur l&apos;audience
          réelle ni sur la base.
        </p>
      </fieldset>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onSaveTemplate}
          disabled={busy === 'save-tpl'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
        >
          {busy === 'save-tpl' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <FileText className="h-4 w-4" aria-hidden />
          )}
          Sauver comme template
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={busy === 'save'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
        >
          Brouillon
        </button>
        {state.scheduleEnabled ? (
          <button
            type="button"
            onClick={onSchedule}
            disabled={busy === 'save'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
          >
            {busy === 'save' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Calendar className="h-4 w-4" aria-hidden />
            )}
            Programmer
          </button>
        ) : (
          <button
            type="button"
            onClick={onSendNow}
            disabled={busy === 'save'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#01696f] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#015c61] disabled:opacity-60"
          >
            {busy === 'save' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            Envoyer maintenant
          </button>
        )}
      </div>
    </div>
  );
}
