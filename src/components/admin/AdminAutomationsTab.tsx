import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  FlaskConical,
  Loader2,
  Plus,
  Save,
  Trash2,
  Zap,
} from 'lucide-react';
import { auth } from '@/firebase';
import { EmailPreview } from './EmailPreview';
import {
  AUTOMATION_TRIGGERS,
  AUTOMATION_VARIABLES,
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_TEST_EMAIL,
  createAutomation,
  deleteAutomation,
  sendAutomationTestCallable,
  setAutomationTriggerEnabled,
  subscribeToAutomations,
  subscribeToAutomationSettings,
  updateAutomation,
  type AutomationDoc,
  type AutomationLanguage,
  type AutomationSettings,
  type AutomationTrigger,
} from '@/lib/emailManager';

const LANGUAGE_OPTIONS: { value: AutomationLanguage; label: string; flag: string }[] = [
  { value: null, label: 'Toutes les langues', flag: '🌐' },
  { value: 'es', label: 'Español', flag: '🇲🇽' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
];

function languageBadge(lang: AutomationLanguage | undefined): {
  label: string;
  flag: string;
} {
  const opt =
    LANGUAGE_OPTIONS.find((o) => o.value === (lang ?? null)) ??
    LANGUAGE_OPTIONS[0];
  return { label: opt.label, flag: opt.flag };
}

type EditorState = {
  id: string | null;
  name: string;
  trigger: AutomationTrigger;
  enabled: boolean;
  subject: string;
  bodyHtml: string;
  targetLanguage: AutomationLanguage;
};

const EMPTY_EDITOR: EditorState = {
  id: null,
  name: '',
  trigger: 'userCreated',
  enabled: true,
  subject: '',
  bodyHtml: '',
  targetLanguage: null,
};

const PRESETS: Record<AutomationTrigger, { subject: string; bodyHtml: string; name: string }> = {
  userCreated: {
    name: 'Bienvenue par défaut',
    subject: 'Bienvenue sur FrancoNetwork, {{firstName}} !',
    bodyHtml: `<p>Bonjour {{firstName}},</p>
<p>Bienvenue sur <strong>FrancoNetwork Guadalajara</strong> — le réseau d'affaires francophone du Mexique.</p>
<p>Pour démarrer, complète ton profil pour être visible auprès des autres membres :</p>
<p><a href="{{profileEditUrl}}">Compléter mon profil</a></p>
<p>Ou explore le répertoire des membres :</p>
<p><a href="{{networkUrl}}">Voir le réseau</a></p>
<p>À très vite,<br/>Gregory &amp; l'équipe FrancoNetwork</p>`,
  },
  weeklySchedule: {
    name: 'Récap hebdo par défaut',
    subject: 'Votre récap hebdo FrancoNetwork',
    bodyHtml: `<p>Bonjour {{firstName}},</p>
<p>Voici le récap de la semaine sur <strong>FrancoNetwork</strong>.</p>
<p>Votre profil est complété à <strong>{{completionPercent}}</strong>. Plus il est complet, plus vous êtes visible auprès des autres membres.</p>
<p><a href="{{profileEditUrl}}">Mettre à jour mon profil</a></p>
<p><a href="{{networkUrl}}">Voir le réseau</a></p>
<p>À lundi prochain,<br/>L'équipe FrancoNetwork</p>`,
  },
  monthlySchedule: {
    name: 'Fin de mois — Communauté en chiffres',
    subject: 'Communauté en chiffres — {{monthLabel}}',
    bodyHtml: `<p>Bonjour {{firstName}},</p>
<p>Voici un aperçu de la communauté pour <strong>{{monthLabel}}</strong>.</p>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0 8px 0;">
  <tr>
    <td style="padding:8px; border:1px solid #e5e7eb; border-radius:14px; text-align:center;">
      <div style="font-size:28px; font-weight:800; color:#01696f; line-height:1.1;">{{kpiMembers}}</div>
      <div style="margin-top:6px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280;">Membres</div>
    </td>
    <td width="12"></td>
    <td style="padding:8px; border:1px solid #e5e7eb; border-radius:14px; text-align:center;">
      <div style="font-size:28px; font-weight:800; color:#01696f; line-height:1.1;">{{kpiConnections}}</div>
      <div style="margin-top:6px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280;">Connexions</div>
    </td>
  </tr>
  <tr><td height="12" colspan="3"></td></tr>
  <tr>
    <td style="padding:8px; border:1px solid #e5e7eb; border-radius:14px; text-align:center;">
      <div style="font-size:28px; font-weight:800; color:#01696f; line-height:1.1;">{{kpiGrowthPct}}</div>
      <div style="margin-top:6px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280;">Croissance</div>
    </td>
    <td width="12"></td>
    <td style="padding:8px; border:1px solid #e5e7eb; border-radius:14px; text-align:center;">
      <div style="font-size:28px; font-weight:800; color:#01696f; line-height:1.1;">{{kpiSectors}}</div>
      <div style="margin-top:6px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280;">Secteurs</div>
    </td>
  </tr>
</table>

<p style="margin-top:10px;"><a href="{{statsShareUrl}}"><strong>Voir la page complète à partager</strong></a></p>
<p>Vous pouvez aussi mettre à jour votre profil pour apparaître au bon moment :</p>
<p><a href="{{profileEditUrl}}">Mettre à jour mon profil</a></p>
<p>À bientôt,<br/>L'équipe FrancoNetwork</p>`,
  },
};

function triggerLabel(t: AutomationTrigger): string {
  return AUTOMATION_TRIGGERS.find((x) => x.id === t)?.label ?? t;
}

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

export function AdminAutomationsTab() {
  const [rows, setRows] = useState<AutomationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState<string>(DEFAULT_TEST_EMAIL);
  const [showPreview, setShowPreview] = useState(true);
  const [settings, setSettings] = useState<AutomationSettings>(
    DEFAULT_AUTOMATION_SETTINGS
  );

  useEffect(() => {
    const unsub = subscribeToAutomations(
      (items) => {
        setRows(items);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      }
    );
    const unsubSettings = subscribeToAutomationSettings(
      (s) => setSettings(s),
      (e) => setError(e.message)
    );
    return () => {
      unsub();
      unsubSettings();
    };
  }, []);

  const handleToggleTrigger = async (
    trigger: AutomationTrigger,
    enabled: boolean
  ) => {
    setBusy(`switch-${trigger}`);
    try {
      await setAutomationTriggerEnabled(trigger, enabled);
      setToast(
        enabled
          ? 'Déclencheur activé.'
          : 'Déclencheur désactivé : aucun email automatique ne partira pour celui-ci.'
      );
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Erreur.');
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const uid = auth.currentUser?.uid ?? '';

  const grouped = useMemo(() => {
    const map = new Map<AutomationTrigger, AutomationDoc[]>();
    for (const t of AUTOMATION_TRIGGERS) map.set(t.id, []);
    for (const r of rows) {
      const list = map.get(r.trigger) ?? [];
      list.push(r);
      map.set(r.trigger, list);
    }
    return map;
  }, [rows]);

  const openNew = (trigger: AutomationTrigger) => {
    const preset = PRESETS[trigger];
    setEditor({
      id: null,
      name: preset.name,
      trigger,
      enabled: true,
      subject: preset.subject,
      bodyHtml: preset.bodyHtml,
      targetLanguage: null,
    });
    setEditorOpen(true);
  };

  const openEdit = (a: AutomationDoc) => {
    setEditor({
      id: a.id,
      name: a.name,
      trigger: a.trigger,
      enabled: a.enabled,
      subject: a.subject,
      bodyHtml: a.bodyHtml,
      targetLanguage: a.targetLanguage ?? null,
    });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editor.subject.trim() || !editor.bodyHtml.trim()) {
      setToast('Sujet et corps obligatoires.');
      return;
    }
    setBusy('save');
    try {
      if (editor.id) {
        await updateAutomation(editor.id, {
          name: editor.name || editor.subject,
          trigger: editor.trigger,
          enabled: editor.enabled,
          subject: editor.subject,
          bodyHtml: editor.bodyHtml,
          targetLanguage: editor.targetLanguage,
          updatedBy: uid,
        });
        setToast('Automation mise à jour.');
      } else {
        await createAutomation({
          name: editor.name || editor.subject,
          trigger: editor.trigger,
          enabled: editor.enabled,
          subject: editor.subject,
          bodyHtml: editor.bodyHtml,
          targetLanguage: editor.targetLanguage,
          updatedBy: uid,
        });
        setToast('Automation créée.');
      }
      setEditor(EMPTY_EDITOR);
      setEditorOpen(false);
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setBusy(null);
    }
  };

  const handleToggle = async (a: AutomationDoc) => {
    setBusy(`toggle-${a.id}`);
    try {
      await updateAutomation(a.id, { enabled: !a.enabled, updatedBy: uid });
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Erreur.');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette automation ?')) return;
    setBusy(`del-${id}`);
    try {
      await deleteAutomation(id);
      setToast('Automation supprimée.');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Suppression échouée.');
    } finally {
      setBusy(null);
    }
  };

  const handleSendTest = async () => {
    if (!editor.subject.trim() || !editor.bodyHtml.trim()) {
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
      const res = await sendAutomationTestCallable({
        subject: editor.subject,
        bodyHtml: editor.bodyHtml,
        name: editor.name || editor.subject,
        to,
      });
      setToast(`Test envoyé à ${res.to}.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Envoi de test échoué.');
    } finally {
      setBusy(null);
    }
  };

  const insertVar = (name: string) => {
    setEditor((s) => ({ ...s, bodyHtml: `${s.bodyHtml}{{${name}}}` }));
  };

  return (
    <section>
      <header className="mb-4 max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#01696f]">
          Automatisations
        </p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
          Emails déclenchés automatiquement
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Configure les emails déclenchés par un événement (nouvel inscrit) ou
          par un planning (récap hebdo). Tu peux créer plusieurs versions par
          déclencheur, les activer / désactiver, et tester un envoi avant que
          ça parte aux vrais destinataires.
        </p>
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
          <strong>Comment ça marche :</strong> chaque déclencheur a un
          interrupteur maître <em>(coché par défaut)</em>. Coché : tant
          qu&apos;aucune automation n&apos;est créée, le contenu par défaut
          est envoyé ; dès qu&apos;une automation existe, seules celles
          <em> activées</em> partent. Décoché : aucun email automatique
          n&apos;est envoyé pour ce déclencheur, peu importe les automations.
        </p>
      </header>

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

      {editorOpen ? (
        <Editor
          state={editor}
          onChange={setEditor}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview((v) => !v)}
          testEmail={testEmail}
          onChangeTestEmail={setTestEmail}
          onSendTest={handleSendTest}
          onSave={handleSave}
          onCancel={() => {
            setEditor(EMPTY_EDITOR);
            setEditorOpen(false);
          }}
          insertVar={insertVar}
          busy={busy}
        />
      ) : (
        <div className="space-y-5">
          {AUTOMATION_TRIGGERS.map((trig) => {
            const list = grouped.get(trig.id) ?? [];
            const triggerOn = settings[trig.id];
            return (
              <div
                key={trig.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                  triggerOn ? 'border-stone-200' : 'border-stone-200 opacity-90'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50/80 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[#01696f]" aria-hidden />
                      <h3 className="text-sm font-extrabold text-stone-900">
                        {trig.label}
                      </h3>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          triggerOn
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-rose-200 bg-rose-50 text-rose-800'
                        }`}
                      >
                        {triggerOn ? 'En marche' : 'Suspendu'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-stone-600">
                      {trig.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-stone-700"
                      title={
                        triggerOn
                          ? 'Décoche pour suspendre tous les envois sur ce déclencheur'
                          : 'Coche pour réactiver les envois sur ce déclencheur'
                      }
                    >
                      <span className="relative inline-block h-5 w-9">
                        <input
                          type="checkbox"
                          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          checked={triggerOn}
                          disabled={busy === `switch-${trig.id}`}
                          onChange={(e) =>
                            handleToggleTrigger(trig.id, e.target.checked)
                          }
                        />
                        <span
                          aria-hidden
                          className="block h-5 w-9 rounded-full bg-stone-300 transition-colors peer-checked:bg-[#01696f]"
                        />
                        <span
                          aria-hidden
                          className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4"
                        />
                      </span>
                      <span className="select-none">
                        {triggerOn ? 'Activé' : 'Désactivé'}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => openNew(trig.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#01696f] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#015c61]"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                      Nouvelle automation
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="px-4 py-6 text-sm text-stone-500">
                    Chargement…
                  </div>
                ) : list.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-stone-500">
                    {triggerOn
                      ? 'Aucune automation. Le contenu par défaut est envoyé tant que tu n\'en crées pas.'
                      : 'Déclencheur suspendu. Aucun email ne partira (ni le contenu par défaut, ni d\'éventuelles automations).'}
                  </div>
                ) : (
                  <ul className="divide-y divide-stone-100">
                    {list.map((a) => (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-start justify-between gap-2 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                                a.enabled
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : 'border-stone-200 bg-stone-100 text-stone-600'
                              }`}
                            >
                              {a.enabled ? 'Activée' : 'Désactivée'}
                            </span>
                            {(() => {
                              const b = languageBadge(a.targetLanguage);
                              return (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-stone-700"
                                  title={`Langue cible : ${b.label}`}
                                >
                                  <span aria-hidden>{b.flag}</span>
                                  <span>{b.label}</span>
                                </span>
                              );
                            })()}
                            <span className="font-semibold text-stone-900">
                              {a.name}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-stone-500">
                            {a.subject}
                          </div>
                          <div className="mt-0.5 text-[11px] text-stone-400">
                            Modifiée {formatDate(a.updatedAt)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggle(a)}
                            disabled={busy === `toggle-${a.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-60"
                          >
                            {busy === `toggle-${a.id}` ? (
                              <Loader2
                                className="h-3 w-3 animate-spin"
                                aria-hidden
                              />
                            ) : null}
                            {a.enabled ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                          >
                            Éditer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id)}
                            disabled={busy === `del-${a.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden />
                            Suppr.
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Editor({
  state,
  onChange,
  showPreview,
  onTogglePreview,
  testEmail,
  onChangeTestEmail,
  onSendTest,
  onSave,
  onCancel,
  insertVar,
  busy,
}: {
  state: EditorState;
  onChange: (s: EditorState) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  testEmail: string;
  onChangeTestEmail: (v: string) => void;
  onSendTest: () => void;
  onSave: () => void;
  onCancel: () => void;
  insertVar: (name: string) => void;
  busy: string | null;
}) {
  const set = (patch: Partial<EditorState>) => onChange({ ...state, ...patch });

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-stone-900">
          {state.id ? 'Modifier l\'automation' : 'Nouvelle automation'}
        </h3>
        <button
          type="button"
          onClick={onTogglePreview}
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
      </div>

      <div
        className={
          showPreview
            ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
            : 'block'
        }
      >
        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-stone-700">
              Nom interne
              <input
                value={state.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Ex: Bienvenue v2"
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal text-stone-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-stone-700">
              Déclencheur
              <select
                value={state.trigger}
                onChange={(e) =>
                  set({ trigger: e.target.value as AutomationTrigger })
                }
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal text-stone-900"
              >
                {AUTOMATION_TRIGGERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-stone-700">
              Langue cible
              <select
                value={state.targetLanguage ?? ''}
                onChange={(e) =>
                  set({
                    targetLanguage:
                      e.target.value === ''
                        ? null
                        : (e.target.value as Exclude<AutomationLanguage, null>),
                  })
                }
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal text-stone-900"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value ?? 'all'} value={opt.value ?? ''}>
                    {opt.flag} {opt.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] font-normal text-stone-500">
                Cet email ne partira qu&apos;aux membres ayant choisi cette
                langue dans leur profil.
              </span>
            </label>
          </div>

          <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-stone-700">
            Sujet *
            <input
              value={state.subject}
              onChange={(e) => set({ subject: e.target.value })}
              placeholder="Ex: Bienvenue {{firstName}} !"
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal text-stone-900"
            />
          </label>

          <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-stone-700">
            Corps HTML *
            <textarea
              value={state.bodyHtml}
              onChange={(e) => set({ bodyHtml: e.target.value })}
              rows={12}
              placeholder="<p>Bonjour {{firstName}}, …</p>"
              className="rounded-lg border border-stone-200 px-3 py-2 font-mono text-xs text-stone-900"
            />
            <span className="text-[11px] font-normal text-stone-500">
              Les jetons {`{{firstName}}`}, {`{{email}}`}, {`{{appUrl}}`}…
              sont remplacés par les vraies valeurs au moment de l&apos;envoi.
              Voir la liste à droite.
            </span>
          </label>

          <fieldset className="mt-4 rounded-xl border border-stone-200 bg-stone-50/60 p-3">
            <legend className="px-2 text-[11px] font-bold uppercase tracking-wide text-stone-600">
              Activation
            </legend>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state.enabled}
                onChange={(e) => set({ enabled: e.target.checked })}
              />
              {state.enabled
                ? `Activée — déclenchée sur ${triggerLabel(state.trigger)}`
                : 'Désactivée — ignorée par le déclencheur'}
            </label>
          </fieldset>
        </div>

        {showPreview ? (
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-600">
              Aperçu (variables non substituées)
            </p>
            <div className="lg:sticky lg:top-4 space-y-3">
              <EmailPreview subject={state.subject} bodyHtml={state.bodyHtml} />
              <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-600">
                  Variables disponibles (clic pour insérer)
                </p>
                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {AUTOMATION_VARIABLES.map((v) => (
                    <li key={v.name}>
                      <button
                        type="button"
                        onClick={() => insertVar(v.name)}
                        className="group flex w-full flex-col items-start gap-0.5 rounded-md border border-stone-200 bg-white px-2 py-1 text-left text-[11px] hover:border-[#01696f] hover:bg-[#e6f5f5]/40"
                      >
                        <span className="font-mono font-semibold text-[#01696f]">
                          {`{{${v.name}}}`}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {v.description}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
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
          Les variables {`{{firstName}}`} etc. sont remplacées par des valeurs
          de démonstration. Sujet préfixé{' '}
          <span className="font-mono">[TEST AUTOMATION]</span>.
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
          onClick={onSave}
          disabled={busy === 'save'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#01696f] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#015c61] disabled:opacity-60"
        >
          {busy === 'save' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {state.id ? 'Enregistrer' : 'Créer l\'automation'}
        </button>
      </div>
    </div>
  );
}
