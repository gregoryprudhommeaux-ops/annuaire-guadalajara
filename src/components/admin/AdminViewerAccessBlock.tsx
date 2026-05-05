import React, { useEffect, useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import {
  createViewerMagicLinkCallable,
  revokeViewerMagicLinkCallable,
  subscribeToViewerMagicLinks,
  subscribeToViewerMagicLinkSessions,
  type ViewerMagicLinkDoc,
  type ViewerMagicLinkSessionDoc,
  type ViewerRecipient,
} from '@/lib/viewerMagicLinks';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDateTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '—';
  const d = ts.toDate();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatSeconds(sec: number | null | undefined): string {
  if (!sec || !Number.isFinite(sec)) return '—';
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  return `${m}m ${r}s`;
}

function buildViewerUrl(token: string): string {
  return `${window.location.origin}/v/${encodeURIComponent(token)}`;
}

function formatDateOnly(ts: Timestamp | null | undefined): string {
  if (!ts) return '—';
  const d = ts.toDate();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function buildWhatsAppMessage(input: {
  recipient: ViewerRecipient;
  url: string;
  expiresAt: Timestamp;
}): string {
  const name = [input.recipient.firstName, input.recipient.lastName].filter(Boolean).join(' ').trim();
  const until = formatDateOnly(input.expiresAt);
  return [
    `Bonjour ${name || ''}`.trim() + ',',
    '',
    `Voici votre accès temporaire à FRANCONETWORK (valable jusqu’au ${until}).`,
    '',
    input.url,
    '',
    `À l’expiration, vous pourrez demander une extension en répondant à ce message ou en contactant l’admin par email.`,
  ].join('\n');
}

function buildEmailSubject(input: { recipient: ViewerRecipient; expiresAt: Timestamp }): string {
  const until = formatDateOnly(input.expiresAt);
  return `FRANCONETWORK — accès temporaire (jusqu’au ${until})`;
}

function buildEmailBody(input: {
  recipient: ViewerRecipient;
  url: string;
  expiresAt: Timestamp;
}): string {
  const name = [input.recipient.firstName, input.recipient.lastName].filter(Boolean).join(' ').trim();
  const until = formatDateOnly(input.expiresAt);
  return [
    `Bonjour ${name || ''}`.trim() + ',',
    '',
    `Voici votre accès temporaire à FRANCONETWORK (valable 3 jours, jusqu’au ${until}).`,
    '',
    `Lien d’accès:`,
    input.url,
    '',
    `Si vous avez besoin d’une extension après expiration, merci de contacter l’admin: contact@franconetwork.app`,
    '',
    `Bonne visite,`,
    `FrancoNetwork`,
  ].join('\n');
}

export function AdminViewerAccessBlock() {
  const [rows, setRows] = useState<ViewerMagicLinkDoc[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ViewerMagicLinkSessionDoc[]>([]);
  const [lastCreated, setLastCreated] = useState<null | {
    url: string;
    expiresAt: Timestamp;
    recipient: ViewerRecipient;
  }>(null);

  const [form, setForm] = useState<ViewerRecipient>({
    firstName: '',
    lastName: '',
    email: '',
    whatsapp: '',
  });
  const days = 3;

  useEffect(() => {
    const unsub = subscribeToViewerMagicLinks(
      (r) => setRows(r),
      (err) => setToast(err.message)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!expandedLinkId) return;
    const unsub = subscribeToViewerMagicLinkSessions(
      expandedLinkId,
      (r) => setSessions(r),
      (err) => setToast(err.message)
    );
    return () => unsub();
  }, [expandedLinkId]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const activeCount = useMemo(() => rows.filter((r) => !r.revokedAt && r.expiresAt.toMillis() > Date.now()).length, [rows]);

  const createLink = async () => {
    setBusy('create');
    setToast(null);
    try {
      const res = await createViewerMagicLinkCallable({ days, recipient: form });
      const url = buildViewerUrl(res.token);
      const expiresAt = Timestamp.fromMillis(res.expiresAtMs);
      setLastCreated({ url, expiresAt, recipient: form });
      try {
        await navigator.clipboard.writeText(url);
        setToast('Magic link créé et copié.');
      } catch {
        setToast('Magic link créé.');
      }
    } catch (err) {
      if (err instanceof FirebaseError) setToast(`${err.code}: ${err.message}`);
      else setToast(err instanceof Error ? err.message : 'Création échouée.');
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (linkId: string) => {
    setBusy(`revoke:${linkId}`);
    setToast(null);
    try {
      await revokeViewerMagicLinkCallable(linkId);
      setToast('Accès révoqué.');
    } catch (err) {
      if (err instanceof FirebaseError) setToast(`${err.code}: ${err.message}`);
      else setToast(err instanceof Error ? err.message : 'Révocation échouée.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="admin-analytics-wide mt-4">
      <article className="admin-chart-card admin-chart-card--table" id="admin-section-viewer-access">
        <p className="admin-chart-card__title">Accès viewer (magic links)</p>
        <p className="admin-chart-card__subtitle">
          Créer un accès temporaire (3 jours) à la partie membre, avec historique des connexions. Actifs: {activeCount}
        </p>
        <div className="admin-chart-card__body">
          {toast ? (
            <p className="mb-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              {toast}
            </p>
          ) : null}

          {lastCreated ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">
                    Message prêt à envoyer
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                    Lien valable jusqu’au {formatDateOnly(lastCreated.expiresAt)} (3 jours)
                  </p>
                  <p className="mt-2 break-all text-xs text-emerald-900/90">{lastCreated.url}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100/40"
                    onClick={() => {
                      void navigator.clipboard.writeText(lastCreated.url).then(
                        () => setToast('Lien copié.'),
                        () => setToast('Copie impossible.')
                      );
                    }}
                  >
                    Copier le lien
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    onClick={() => setLastCreated(null)}
                  >
                    Fermer
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">WhatsApp</p>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-stone-800">
                    {buildWhatsAppMessage({
                      recipient: lastCreated.recipient,
                      url: lastCreated.url,
                      expiresAt: lastCreated.expiresAt,
                    })}
                  </pre>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                      onClick={() => {
                        const txt = buildWhatsAppMessage({
                          recipient: lastCreated.recipient,
                          url: lastCreated.url,
                          expiresAt: lastCreated.expiresAt,
                        });
                        void navigator.clipboard.writeText(txt).then(
                          () => setToast('Message WhatsApp copié.'),
                          () => setToast('Copie impossible.')
                        );
                      }}
                    >
                      Copier WhatsApp
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">Email</p>
                  <p className="mt-2 text-xs font-semibold text-stone-800">
                    Objet: {buildEmailSubject({ recipient: lastCreated.recipient, expiresAt: lastCreated.expiresAt })}
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-stone-800">
                    {buildEmailBody({
                      recipient: lastCreated.recipient,
                      url: lastCreated.url,
                      expiresAt: lastCreated.expiresAt,
                    })}
                  </pre>
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                      onClick={() => {
                        const subject = buildEmailSubject({
                          recipient: lastCreated.recipient,
                          expiresAt: lastCreated.expiresAt,
                        });
                        void navigator.clipboard.writeText(subject).then(
                          () => setToast('Objet copié.'),
                          () => setToast('Copie impossible.')
                        );
                      }}
                    >
                      Copier objet
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                      onClick={() => {
                        const body = buildEmailBody({
                          recipient: lastCreated.recipient,
                          url: lastCreated.url,
                          expiresAt: lastCreated.expiresAt,
                        });
                        void navigator.clipboard.writeText(body).then(
                          () => setToast('Corps du mail copié.'),
                          () => setToast('Copie impossible.')
                        );
                      }}
                    >
                      Copier email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-bold uppercase tracking-wide text-stone-600">Prénom</span>
                <input
                  className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-bold uppercase tracking-wide text-stone-600">Nom</span>
                <input
                  className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-bold uppercase tracking-wide text-stone-600">Email</span>
                <input
                  className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-bold uppercase tracking-wide text-stone-600">WhatsApp</span>
                <input
                  className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  value={form.whatsapp}
                  onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled={busy === 'create'}
                onClick={() => void createLink()}
                className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
              >
                Créer un magic link (3 jours)
              </button>
            </div>
          </div>

          <div className="mt-4 admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Créé</th>
                  <th>Fin</th>
                  <th>Destinataire</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Statut</th>
                  <th className="tabular-nums">Connexions</th>
                  <th className="tabular-nums">Durée totale</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9}>—</td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const expired = r.expiresAt?.toMillis?.() ? r.expiresAt.toMillis() <= Date.now() : false;
                    const status = r.revokedAt ? 'Révoqué' : expired ? 'Expiré' : 'Actif';
                    return (
                      <React.Fragment key={r.id}>
                        <tr>
                          <td>{formatDateTime(r.createdAt)}</td>
                          <td>{formatDateTime(r.expiresAt)}</td>
                          <td>{[r.recipient?.firstName, r.recipient?.lastName].filter(Boolean).join(' ') || '—'}</td>
                          <td>{r.recipient?.email || '—'}</td>
                          <td>{r.recipient?.whatsapp || '—'}</td>
                          <td>{status}</td>
                          <td className="tabular-nums">{r.sessionsCount ?? r.resolvesCount ?? 0}</td>
                          <td className="tabular-nums">{formatSeconds(r.totalDurationSec)}</td>
                          <td>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                                onClick={() => setExpandedLinkId((prev) => (prev === r.id ? null : r.id))}
                              >
                                {expandedLinkId === r.id ? 'Masquer logs' : 'Voir logs'}
                              </button>
                              {!r.revokedAt ? (
                                <button
                                  type="button"
                                  disabled={busy === `revoke:${r.id}`}
                                  className="rounded-md bg-rose-700 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
                                  onClick={() => void revoke(r.id)}
                                >
                                  Révoquer
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                        {expandedLinkId === r.id ? (
                          <tr>
                            <td colSpan={9}>
                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                                <p className="text-xs font-extrabold uppercase tracking-wide text-stone-600">
                                  Connexions (sessions)
                                </p>
                                <div className="mt-2 overflow-auto rounded-lg border border-stone-200 bg-white">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-stone-200 text-left text-xs font-semibold text-stone-600">
                                        <th className="px-3 py-2">Début</th>
                                        <th className="px-3 py-2">Dernier signe de vie</th>
                                        <th className="px-3 py-2">Fin</th>
                                        <th className="px-3 py-2">Durée</th>
                                        <th className="px-3 py-2">User agent</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sessions.length === 0 ? (
                                        <tr>
                                          <td className="px-3 py-2" colSpan={5}>
                                            —
                                          </td>
                                        </tr>
                                      ) : (
                                        sessions.map((s) => (
                                          <tr key={s.id} className="border-b border-stone-100">
                                            <td className="px-3 py-2">{formatDateTime(s.startedAt)}</td>
                                            <td className="px-3 py-2">{formatDateTime(s.lastSeenAt)}</td>
                                            <td className="px-3 py-2">{formatDateTime(s.endedAt)}</td>
                                            <td className="px-3 py-2 tabular-nums">{formatSeconds(s.durationSec)}</td>
                                            <td className="px-3 py-2 text-xs text-stone-600">
                                              {String(s.userAgent ?? '').slice(0, 140) || '—'}
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </div>
  );
}

