import React, { useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Copy, Plus, Save, Search, Trash2, X } from 'lucide-react';
import type {
  Language,
  AdminEvent,
  AdminEventParticipation,
  EventParticipationStatus,
  EventRespondent,
  EventRespondentAttendance,
  EventStatusSource,
  UserProfile,
} from '@/types';
import { db } from '@/firebase';
import { PASSIONS_CATEGORIES, getPassionEmoji, getPassionLabel, sanitizePassionIds } from '@/lib/passionConfig';
import { profileDistinctActivityCategories } from '@/lib/companyActivities';

type TFn = (key: string) => string;

type AdminEventsProps = {
  lang: Language;
  t: TFn;
  /** Base URL affichée dans les messages copiables (ex. https://annuaire.com). */
  publicBaseUrl?: string;
  /** UID admin (optionnel) pour audit. */
  adminUid?: string | null;
};

function uiLabel(lang: Language, fr: string, es: string, en: string) {
  return lang === 'en' ? en : lang === 'es' ? es : fr;
}

function slugify(input: string): string {
  return String(input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function fmtDateTime(ts: Timestamp | null | undefined, lang: Language): string {
  if (!ts) return '';
  try {
    const d = ts.toDate();
    return d.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function statusBadge(status: EventParticipationStatus) {
  if (status === 'present') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'declined') return 'bg-rose-100 text-rose-800 border-rose-200';
  return 'bg-stone-100 text-stone-700 border-stone-200';
}

function respondentAttendanceBadge(att: EventRespondentAttendance) {
  if (att === 'yes') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (att === 'no') return 'bg-rose-100 text-rose-800 border-rose-200';
  return 'bg-amber-100 text-amber-900 border-amber-200';
}

async function safeCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // fallback: ignore (user can select manually)
  }
}

function eventPublicUrl(baseUrl: string, slug: string) {
  const b = baseUrl.replace(/\/+$/, '');
  return `${b}/e/${slug}`;
}

function buildEmailTemplate(e: AdminEvent, url: string) {
  const title = e.title?.trim() || 'Evento';
  // Toujours en espagnol mexicain pour les invitations (même si l’admin UI est en FR/EN).
  const when = e.startsAt ? fmtDateTime(e.startsAt, 'es') : '';
  const where = e.address?.trim() || '';
  return [
    `Asunto: Invitación – ${title}`,
    '',
    'Hola,',
    '',
    `Te invito a ${title}${when ? ` — ${when}` : ''}${where ? `, ${where}` : ''}.`,
    '',
    `Para confirmar tu asistencia (o rechazar) y crear/completar tu perfil en el directorio:`,
    url,
    '',
    `Nota: la información que ingreses se registrará en el directorio para facilitar conexiones y futuras invitaciones.`,
    '',
    '¡Nos vemos!',
  ].join('\n');
}

function buildWhatsappTemplate(e: AdminEvent, url: string) {
  const title = e.title?.trim() || 'Evento';
  // Toujours en espagnol mexicain pour les invitations (même si l’admin UI est en FR/EN).
  const when = e.startsAt ? fmtDateTime(e.startsAt, 'es') : '';
  const where = e.address?.trim() || '';
  return [
    `¡Hola! Invitación: ${title}${when ? ` — ${when}` : ''}${where ? ` @ ${where}` : ''}.`,
    `Confirmación/rechazo + perfil en el directorio: ${url}`,
    `(la info se integrará al directorio para matching y próximos eventos)`,
  ].join('\n');
}

function mapDoc<T extends Record<string, unknown>>(id: string, data: T): T & { id: string } {
  return { id, ...data };
}

export default function AdminEvents({ lang, t, publicBaseUrl, adminUid }: AdminEventsProps) {
  const baseUrl =
    publicBaseUrl ??
    (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '');

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const activeEvent = useMemo(() => events.find((e) => e.id === activeEventId) ?? null, [events, activeEventId]);

  const [showEditor, setShowEditor] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [titleDraft, setTitleDraft] = useState('');
  const [introDraft, setIntroDraft] = useState('');
  const [addressDraft, setAddressDraft] = useState('');
  const [startsAtDateDraft, setStartsAtDateDraft] = useState(''); // yyyy-mm-dd
  const [startsAtTimeDraft, setStartsAtTimeDraft] = useState(''); // HH:MM
  const [capacityDraft, setCapacityDraft] = useState<string>('');
  const [statusDraft, setStatusDraft] = useState<'draft' | 'published' | 'closed'>('draft');
  const [editorInviteUids, setEditorInviteUids] = useState<string[]>([]);
  const [editorMemberQuery, setEditorMemberQuery] = useState('');
  const [editorSectorFilter, setEditorSectorFilter] = useState<string>('');
  const [editorPassionFilter, setEditorPassionFilter] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [magicLinkOpen, setMagicLinkOpen] = useState(false);
  const [magicLinkUrl, setMagicLinkUrl] = useState<string>('');
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [participants, setParticipants] = useState<AdminEventParticipation[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [participantsFilter, setParticipantsFilter] = useState<EventParticipationStatus>('invited');

  const [respondents, setRespondents] = useState<EventRespondent[]>([]);
  const [respondentsLoading, setRespondentsLoading] = useState(false);
  const [respondentsError, setRespondentsError] = useState<string | null>(null);

  const [memberIndex, setMemberIndex] = useState<UserProfile[]>([]);
  const [memberIndexLoading, setMemberIndexLoading] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  const [externalName, setExternalName] = useState('');
  const [externalCompany, setExternalCompany] = useState('');

  const hydrateEditorFromEvent = (e: AdminEvent | null) => {
    if (!e) {
      setTitleDraft('');
      setIntroDraft('');
      setAddressDraft('');
      setStartsAtDateDraft('');
      setStartsAtTimeDraft('');
      setCapacityDraft('');
      setStatusDraft('draft');
      setEditorInviteUids([]);
      setEditorMemberQuery('');
      setEditorSectorFilter('');
      setEditorPassionFilter('');
      return;
    }
    setTitleDraft(e.title ?? '');
    setIntroDraft(e.introText ?? '');
    setAddressDraft(e.address ?? '');
    const d = e.startsAt?.toDate?.();
    if (d) {
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      setStartsAtDateDraft(`${yyyy}-${mm}-${dd}`);
      setStartsAtTimeDraft(`${hh}:${mi}`);
    } else {
      setStartsAtDateDraft('');
      setStartsAtTimeDraft('');
    }
    setCapacityDraft(typeof e.capacity === 'number' ? String(e.capacity) : '');
    setStatusDraft(e.status ?? 'draft');
    setEditorInviteUids([]);
    setEditorMemberQuery('');
    setEditorSectorFilter('');
    setEditorPassionFilter('');
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, 'events'), orderBy('startsAt', 'desc'));
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>)) as unknown as AdminEvent[];
        if (!cancelled) setEvents(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadParticipants() {
      if (!activeEventId) {
        setParticipants([]);
        setParticipantsError(null);
        return;
      }
      setParticipantsLoading(true);
      setParticipantsError(null);
      try {
        const q = query(
          collection(db, 'event_participations'),
          where('eventId', '==', activeEventId),
          orderBy('updatedAt', 'desc'),
          limit(400)
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>)) as unknown as AdminEventParticipation[];
        if (!cancelled) setParticipants(rows);
      } catch (e) {
        if (!cancelled) setParticipantsError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setParticipantsLoading(false);
      }
    }
    void loadParticipants();
    return () => {
      cancelled = true;
    };
  }, [activeEventId]);

  useEffect(() => {
    let cancelled = false;
    async function loadPublic() {
      if (!activeEventId) {
        setRespondents([]);
        setRespondentsError(null);
        return;
      }
      setRespondentsLoading(true);
      setRespondentsError(null);
      try {
        const q = query(collection(db, 'event_respondents'), where('eventId', '==', activeEventId), limit(500));
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) =>
          mapDoc(d.id, d.data() as Record<string, unknown>)
        ) as unknown as EventRespondent[];
        rows.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        if (!cancelled) setRespondents(rows);
      } catch (e) {
        if (!cancelled) setRespondentsError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setRespondentsLoading(false);
      }
    }
    void loadPublic();
    return () => {
      cancelled = true;
    };
  }, [activeEventId]);

  const filteredParticipants = useMemo(
    () => participants.filter((p) => p.status === participantsFilter),
    [participants, participantsFilter]
  );

  const openCreate = () => {
    setEditId(null);
    hydrateEditorFromEvent(null);
    setShowEditor(true);
    void ensureMemberIndexLoaded();
  };
  const openEdit = (e: AdminEvent) => {
    setEditId(e.id);
    hydrateEditorFromEvent(e);
    setShowEditor(true);
    void ensureMemberIndexLoaded();
  };

  const saveEvent = async () => {
    const title = titleDraft.trim();
    if (!title) return;
    if (!startsAtDateDraft || !startsAtTimeDraft) return;
    const dt = new Date(`${startsAtDateDraft}T${startsAtTimeDraft}:00`);
    if (Number.isNaN(dt.getTime())) return;
    const startsAt = Timestamp.fromDate(dt);
    const now = Timestamp.now();
    const slug = slugify(`${title}-${startsAtDateDraft}`);
    const capacity = capacityDraft.trim() ? Number(capacityDraft) : undefined;
    const patchBase: Omit<AdminEvent, 'id' | 'createdByUid'> = {
      slug,
      title,
      introText: introDraft.trim() || undefined,
      address: addressDraft.trim() || undefined,
      startsAt,
      capacity: Number.isFinite(capacity as number) ? (capacity as number) : undefined,
      status: statusDraft,
      createdAt: now,
      updatedAt: now,
    };
    const patch: Omit<AdminEvent, 'id'> = adminUid ? { ...patchBase, createdByUid: adminUid } : patchBase;
    setError(null);
    setSaving(true);
    try {
      if (!editId) {
        const ref = await addDoc(collection(db, 'events'), patch);
        const saved: AdminEvent = { id: ref.id, ...patch };
        setEvents((prev) => [saved, ...prev].sort((a, b) => b.startsAt.toMillis() - a.startsAt.toMillis()));
        setActiveEventId(ref.id);

        // Invitations pré-sélectionnées (groupes / affinités) → status invited.
        const now2 = Timestamp.now();
        const uniqueUids = Array.from(new Set(editorInviteUids));
        if (uniqueUids.length > 0) {
          const selected = memberIndex.filter((m) => uniqueUids.includes(m.uid));
          await Promise.all(
            selected
              .filter((m) => String(m.email ?? '').trim())
              .map((m) =>
                addDoc(collection(db, 'event_participations'), {
                  eventId: ref.id,
                  uid: m.uid,
                  email: String(m.email ?? '').trim().toLowerCase(),
                  fullName: m.fullName ?? null,
                  companyName: m.companyName ?? null,
                  status: 'invited',
                  statusSource: 'admin',
                  createdAt: now2,
                  updatedAt: now2,
                })
              )
          );
        }

        const url = eventPublicUrl(baseUrl, slug);
        setMagicLinkUrl(url);
        setMagicLinkOpen(true);
      } else {
        await updateDoc(doc(db, 'events', editId), {
          ...patch,
          createdAt: undefined,
          ...(adminUid ? { createdByUid: adminUid } : {}),
          updatedAt: now,
        } as Record<string, unknown>);
        setEvents((prev) =>
          prev.map((e) => (e.id === editId ? ({ ...e, ...patch, id: editId, createdAt: e.createdAt } as AdminEvent) : e))
        );
        const url = eventPublicUrl(baseUrl, slug);
        setMagicLinkUrl(url);
        setMagicLinkOpen(true);
      }
      setShowEditor(false);
      setPreviewOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const cancelEditor = () => {
    setShowEditor(false);
  };

  const ensureMemberIndexLoaded = async () => {
    if (memberIndexLoading || memberIndex.length > 0) return;
    setMemberIndexLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const rows = snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>)) as unknown as UserProfile[];
      setMemberIndex(rows);
    } finally {
      setMemberIndexLoading(false);
    }
  };

  const memberMatches = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return [];
    const rows = memberIndex
      .filter((m) => {
        const hay = `${m.fullName ?? ''} ${m.companyName ?? ''} ${m.email ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8);
    return rows;
  }, [memberIndex, memberQuery]);

  const allSectors = useMemo(() => {
    const set = new Set<string>();
    memberIndex.forEach((m) => {
      profileDistinctActivityCategories(m).forEach((s) => set.add(s));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [memberIndex]);

  const editorCandidates = useMemo(() => {
    const q = editorMemberQuery.trim().toLowerCase();
    const sector = editorSectorFilter.trim();
    const passion = editorPassionFilter.trim();
    return memberIndex
      .filter((m) => {
        if (sector && !profileDistinctActivityCategories(m).includes(sector)) return false;
        if (passion) {
          const ids = sanitizePassionIds(m.passionIds);
          if (!ids.includes(passion)) return false;
        }
        if (!q) return true;
        const hay = `${m.fullName ?? ''} ${m.companyName ?? ''} ${m.email ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 12);
  }, [memberIndex, editorMemberQuery, editorSectorFilter, editorPassionFilter]);

  const editorSelectedMembers = useMemo(() => {
    const set = new Set(editorInviteUids);
    return memberIndex.filter((m) => set.has(m.uid));
  }, [memberIndex, editorInviteUids]);

  const toggleEditorInviteUid = (uid: string) => {
    setEditorInviteUids((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  };

  const upsertParticipation = async (payload: Omit<AdminEventParticipation, 'id'>) => {
    // Simplification V1: crée toujours un nouveau doc (pas d’upsert strict par (eventId,email)).
    // On pourra normaliser plus tard via une clé deterministe si besoin.
    const ref = await addDoc(collection(db, 'event_participations'), payload);
    const row: AdminEventParticipation = { id: ref.id, ...payload };
    setParticipants((prev) => [row, ...prev]);
  };

  const addInviteForMember = async (m: UserProfile) => {
    if (!activeEventId) return;
    const now = Timestamp.now();
    await upsertParticipation({
      eventId: activeEventId,
      uid: m.uid,
      email: String(m.email ?? '').trim(),
      fullName: m.fullName ?? undefined,
      companyName: m.companyName ?? undefined,
      status: 'invited',
      statusSource: 'admin',
      createdAt: now,
      updatedAt: now,
    });
    setMemberQuery('');
  };

  const addInviteExternal = async () => {
    if (!activeEventId) return;
    const email = externalEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    const now = Timestamp.now();
    await upsertParticipation({
      eventId: activeEventId,
      email,
      fullName: externalName.trim() || undefined,
      companyName: externalCompany.trim() || undefined,
      status: 'invited',
      statusSource: 'admin',
      createdAt: now,
      updatedAt: now,
    });
    setExternalEmail('');
    setExternalName('');
    setExternalCompany('');
  };

  const setParticipationStatus = async (p: AdminEventParticipation, status: EventParticipationStatus, source: EventStatusSource) => {
    const now = Timestamp.now();
    await updateDoc(doc(db, 'event_participations', p.id), {
      status,
      statusSource: source,
      updatedAt: now,
    });
    setParticipants((prev) => prev.map((x) => (x.id === p.id ? { ...x, status, statusSource: source, updatedAt: now } : x)));
  };

  const setParticipationNote = async (p: AdminEventParticipation, adminNote: string) => {
    const now = Timestamp.now();
    await updateDoc(doc(db, 'event_participations', p.id), { adminNote: adminNote.trim() || null, updatedAt: now });
    setParticipants((prev) => prev.map((x) => (x.id === p.id ? { ...x, adminNote, updatedAt: now } : x)));
  };

  const copyLink = async () => {
    if (!activeEvent) return;
    await safeCopy(eventPublicUrl(baseUrl, activeEvent.slug));
  };
  const copyEmail = async () => {
    if (!activeEvent) return;
    const url = eventPublicUrl(baseUrl, activeEvent.slug);
    await safeCopy(buildEmailTemplate(activeEvent, url));
  };
  const copyWhatsapp = async () => {
    if (!activeEvent) return;
    const url = eventPublicUrl(baseUrl, activeEvent.slug);
    await safeCopy(buildWhatsappTemplate(activeEvent, url));
  };

  const deleteActiveEvent = async () => {
    if (!activeEvent) return;
    const ok = window.confirm(
      uiLabel(
        lang,
        `Supprimer définitivement « ${activeEvent.title} » et toutes les invitations / participations associées ?`,
        `¿Eliminar definitivamente « ${activeEvent.title} » y todas las invitaciones/participaciones?`,
        `Permanently delete “${activeEvent.title}” and all related invitations/participations?`
      )
    );
    if (!ok) return;
    setError(null);
    setDeleteBusy(true);
    try {
      const partSnap = await getDocs(
        query(collection(db, 'event_participations'), where('eventId', '==', activeEvent.id))
      );
      await Promise.all(partSnap.docs.map((d) => deleteDoc(d.ref)));
      const pubSnap = await getDocs(
        query(collection(db, 'event_respondents'), where('eventId', '==', activeEvent.id))
      );
      await Promise.all(pubSnap.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(doc(db, 'events', activeEvent.id));
      const removedId = activeEvent.id;
      setEvents((prev) => prev.filter((e) => e.id !== removedId));
      setActiveEventId(null);
      setParticipants([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleteBusy(false);
    }
  };

  const previewEventDraft = useMemo((): AdminEvent => {
    const title = titleDraft.trim() || uiLabel(lang, 'Événement', 'Evento', 'Event');
    const safeDate = startsAtDateDraft && startsAtTimeDraft ? new Date(`${startsAtDateDraft}T${startsAtTimeDraft}:00`) : new Date();
    const startsAt = Timestamp.fromDate(Number.isNaN(safeDate.getTime()) ? new Date() : safeDate);
    const slug = slugify(`${title}-${startsAtDateDraft || 'date'}`);
    return {
      id: editId ?? 'draft',
      slug,
      title,
      introText: introDraft.trim() || undefined,
      address: addressDraft.trim() || undefined,
      startsAt,
      capacity: capacityDraft.trim() ? Number(capacityDraft) : undefined,
      status: statusDraft,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...(adminUid ? { createdByUid: adminUid } : {}),
    };
  }, [
    titleDraft,
    introDraft,
    addressDraft,
    startsAtDateDraft,
    startsAtTimeDraft,
    capacityDraft,
    statusDraft,
    editId,
    lang,
    adminUid,
  ]);

  const previewDraftUrl = useMemo(() => eventPublicUrl(baseUrl, previewEventDraft.slug), [baseUrl, previewEventDraft.slug]);

  const openNativePicker = (el: HTMLInputElement | null) => {
    if (!el) return;
    const anyEl = el as HTMLInputElement & { showPicker?: () => void };
    try {
      anyEl.showPicker?.();
    } catch {
      // ignore (not supported / blocked)
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-stone-900">
            {uiLabel(lang, 'Événements (admin)', 'Eventos (admin)', 'Events (admin)')}
          </h3>
          <p className="text-xs text-stone-500">
            {uiLabel(
              lang,
              'Créer, suivre les invitations (invité / présent / refusé) et ajouter des notes.',
              'Crear, seguir invitaciones (invitado / presente / rechazado) y añadir notas.',
              'Create, track invitations (invited / present / declined), and add notes.'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {uiLabel(lang, 'Nouvel événement', 'Nuevo evento', 'New event')}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {error}
        </p>
      ) : null}

      <div
        className={
          showEditor
            ? 'grid grid-cols-1 gap-4'
            : 'grid gap-4 lg:grid-cols-[420px_1fr]'
        }
      >
        {!showEditor ? (
          <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {uiLabel(lang, 'Tous les événements', 'Todos los eventos', 'All events')}
              </p>
              {loading ? <p className="text-xs text-stone-400">{uiLabel(lang, 'Chargement…', 'Cargando…', 'Loading…')}</p> : null}
            </div>
            <div className="space-y-2">
              {events.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setActiveEventId(e.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    activeEventId === e.id ? 'border-blue-300 bg-blue-50' : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-stone-900">{e.title}</p>
                  <p className="truncate text-xs text-stone-500">
                    {fmtDateTime(e.startsAt, lang)}
                    {e.address ? ` · ${e.address}` : ''}
                  </p>
                </button>
              ))}
              {!loading && events.length === 0 ? (
                <p className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-600">
                  {uiLabel(lang, 'Aucun événement pour le moment.', 'Todavía no hay eventos.', 'No events yet.')}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="min-w-0 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          {showEditor ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-stone-900">
                    {editId
                      ? uiLabel(lang, 'Modifier l’événement', 'Editar evento', 'Edit event')
                      : uiLabel(lang, 'Nouvel événement', 'Nuevo evento', 'New event')}
                  </p>
                  <p className="text-sm text-stone-500">
                    {uiLabel(
                      lang,
                      'Renseigne les infos, puis compose un groupe d’invités.',
                      'Completa la información y crea un grupo de invitados.',
                      'Fill details, then build an invite group.'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cancelEditor}
                  className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                >
                  {uiLabel(lang, 'Fermer', 'Cerrar', 'Close')}
                </button>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-stone-700">{uiLabel(lang, 'Titre *', 'Título *', 'Title *')}</label>
                    <input
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700">{uiLabel(lang, 'Date *', 'Fecha *', 'Date *')}</label>
                    <input
                      type="date"
                      value={startsAtDateDraft}
                      onChange={(e) => setStartsAtDateDraft(e.target.value)}
                      onClick={(e) => openNativePicker(e.currentTarget)}
                      onFocus={(e) => openNativePicker(e.currentTarget)}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700">{uiLabel(lang, 'Heure *', 'Hora *', 'Time *')}</label>
                    <input
                      type="time"
                      value={startsAtTimeDraft}
                      onChange={(e) => setStartsAtTimeDraft(e.target.value)}
                      onClick={(e) => openNativePicker(e.currentTarget)}
                      onFocus={(e) => openNativePicker(e.currentTarget)}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-stone-700">{uiLabel(lang, 'Adresse', 'Dirección', 'Address')}</label>
                    <input
                      value={addressDraft}
                      onChange={(e) => setAddressDraft(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-stone-700">{uiLabel(lang, 'Texte d’introduction', 'Texto de introducción', 'Intro text')}</label>
                    <textarea
                      value={introDraft}
                      onChange={(e) => setIntroDraft(e.target.value)}
                      rows={4}
                      className="mt-1 w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700">{uiLabel(lang, 'Capacité (optionnel)', 'Capacidad (opcional)', 'Capacity (optional)')}</label>
                    <input
                      inputMode="numeric"
                      value={capacityDraft}
                      onChange={(e) => setCapacityDraft(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700">{uiLabel(lang, 'Statut', 'Estado', 'Status')}</label>
                    <select
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value as 'draft' | 'published' | 'closed')}
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="draft">{uiLabel(lang, 'Brouillon', 'Borrador', 'Draft')}</option>
                      <option value="published">{uiLabel(lang, 'Publié', 'Publicado', 'Published')}</option>
                      <option value="closed">{uiLabel(lang, 'Clos', 'Cerrado', 'Closed')}</option>
                    </select>
                  </div>
                </div>

                {/* Bloc groupe / affinités (inchangé) */}
                <div className="mt-2 rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                        {uiLabel(lang, 'Constituer un groupe (invités)', 'Crear un grupo (invitados)', 'Build a group (invited)')}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {uiLabel(
                          lang,
                          'Recherche par nom/société/email + filtres secteur et passions.',
                          'Búsqueda por nombre/empresa/email + filtros de sector y pasiones.',
                          'Search by name/company/email + sector and passions filters.'
                        )}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-stone-700">
                      {uiLabel(lang, 'Sélectionnés', 'Seleccionados', 'Selected')}: {editorInviteUids.length}
                    </p>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="relative sm:col-span-1">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" aria-hidden />
                      <input
                        value={editorMemberQuery}
                        onChange={(e) => {
                          setEditorMemberQuery(e.target.value);
                          void ensureMemberIndexLoaded();
                        }}
                        placeholder={uiLabel(lang, 'Nom / société / email…', 'Nombre / empresa / email…', 'Name / company / email…')}
                        className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <select
                        value={editorSectorFilter}
                        onChange={(e) => setEditorSectorFilter(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">{uiLabel(lang, 'Tous secteurs', 'Todos sectores', 'All sectors')}</option>
                        {allSectors.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={editorPassionFilter}
                        onChange={(e) => setEditorPassionFilter(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">{uiLabel(lang, 'Toutes passions', 'Todas pasiones', 'All passions')}</option>
                        {PASSIONS_CATEGORIES.flatMap((c) =>
                          c.options.map((o) => (
                            <option key={o.id} value={o.id}>
                              {c.emoji} {getPassionLabel(o.id, lang)}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {memberIndexLoading ? (
                    <p className="mt-2 text-xs text-stone-500">{uiLabel(lang, 'Chargement des membres…', 'Cargando miembros…', 'Loading members…')}</p>
                  ) : null}

                  {!memberIndexLoading ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-stone-200 bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                          {uiLabel(lang, 'Résultats', 'Resultados', 'Results')}
                        </p>
                        <div className="mt-2 space-y-2">
                          {editorCandidates.map((m) => {
                            const selected = editorInviteUids.includes(m.uid);
                            const passions = sanitizePassionIds(m.passionIds);
                            return (
                              <button
                                key={m.uid}
                                type="button"
                                onClick={() => toggleEditorInviteUid(m.uid)}
                                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                  selected ? 'border-blue-300 bg-blue-50' : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                                }`}
                              >
                                <p className="truncate font-semibold text-stone-900">{m.fullName}</p>
                                <p className="truncate text-xs text-stone-600">
                                  {m.companyName} ·{' '}
                                  {(() => {
                                    const cats = profileDistinctActivityCategories(m);
                                    return cats.length ? cats.join(' · ') : uiLabel(lang, '—', '—', '—');
                                  })()}
                                </p>
                                {passions.length > 0 ? (
                                  <p className="mt-1 truncate text-[11px] text-stone-500">
                                    {passions.map((id) => `${getPassionEmoji(id)} ${getPassionLabel(id, lang)}`).join(' · ')}
                                  </p>
                                ) : null}
                              </button>
                            );
                          })}
                          {editorCandidates.length === 0 ? (
                            <p className="text-sm text-stone-500">
                              {uiLabel(lang, 'Aucun résultat avec ces filtres.', 'Sin resultados con estos filtros.', 'No results with these filters.')}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-xl border border-stone-200 bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                          {uiLabel(lang, 'Sélection', 'Selección', 'Selection')}
                        </p>
                        <div className="mt-2 space-y-2">
                          {editorSelectedMembers.map((m) => (
                            <div key={m.uid} className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-stone-900">{m.fullName}</p>
                                <p className="truncate text-xs text-stone-600">{m.companyName}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleEditorInviteUid(m.uid)}
                                className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                              >
                                {uiLabel(lang, 'Retirer', 'Quitar', 'Remove')}
                              </button>
                            </div>
                          ))}
                          {editorSelectedMembers.length === 0 ? (
                            <p className="text-sm text-stone-500">
                              {uiLabel(lang, 'Aucun membre sélectionné.', 'Ningún miembro seleccionado.', 'No members selected.')}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEditor}
                    className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    {uiLabel(lang, 'Annuler', 'Cancelar', 'Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
                  >
                    {uiLabel(lang, 'Voir', 'Ver', 'Preview')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveEvent()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" aria-hidden />
                    {saving ? uiLabel(lang, 'Enregistrement…', 'Guardando…', 'Saving…') : uiLabel(lang, 'Enregistrer', 'Guardar', 'Save')}
                  </button>
                </div>
              </div>
            </div>
          ) : !activeEvent ? (
            <p className="text-sm text-stone-500">
              {uiLabel(lang, 'Sélectionne un événement pour voir le détail.', 'Selecciona un evento para ver el detalle.', 'Select an event to view details.')}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-stone-900">{activeEvent.title}</p>
                  <p className="text-sm text-stone-600">
                    {fmtDateTime(activeEvent.startsAt, lang)}
                    {activeEvent.address ? ` · ${activeEvent.address}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(activeEvent)}
                    className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                  >
                    {uiLabel(lang, 'Modifier', 'Editar', 'Edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteActiveEvent()}
                    disabled={deleteBusy}
                    className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    {deleteBusy
                      ? uiLabel(lang, 'Suppression…', 'Eliminando…', 'Deleting…')
                      : uiLabel(lang, 'Supprimer', 'Eliminar', 'Delete')}
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
                >
                  <Copy className="h-4 w-4" aria-hidden />
                  {uiLabel(lang, 'Copier le lien', 'Copiar enlace', 'Copy link')}
                </button>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
                >
                  <Copy className="h-4 w-4" aria-hidden />
                  {uiLabel(lang, 'Copier email', 'Copiar email', 'Copy email')}
                </button>
                <button
                  type="button"
                  onClick={copyWhatsapp}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
                >
                  <Copy className="h-4 w-4" aria-hidden />
                  {uiLabel(lang, 'Copier WhatsApp', 'Copiar WhatsApp', 'Copy WhatsApp')}
                </button>
              </div>

              {activeEvent.introText ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {uiLabel(lang, 'Introduction', 'Introducción', 'Introduction')}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{activeEvent.introText}</p>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {uiLabel(lang, 'Inviter des membres', 'Invitar miembros', 'Invite members')}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" aria-hidden />
                      <input
                        value={memberQuery}
                        onChange={(e) => {
                          setMemberQuery(e.target.value);
                          void ensureMemberIndexLoaded();
                        }}
                        placeholder={uiLabel(lang, 'Nom, société ou email…', 'Nombre, empresa o email…', 'Name, company or email…')}
                        className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    {memberIndexLoading ? (
                      <p className="text-xs text-stone-400">{uiLabel(lang, 'Chargement…', 'Cargando…', 'Loading…')}</p>
                    ) : null}
                  </div>
                  {memberMatches.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {memberMatches.map((m) => (
                        <button
                          key={m.uid}
                          type="button"
                          onClick={() => void addInviteForMember(m)}
                          className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-left text-sm hover:bg-stone-100"
                        >
                          <p className="font-semibold text-stone-900">{m.fullName}</p>
                          <p className="text-xs text-stone-600">
                            {m.companyName} · {m.email}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {uiLabel(lang, 'Inviter un externe', 'Invitar externo', 'Invite external')}
                  </p>
                  <div className="mt-2 grid gap-2">
                    <input
                      value={externalEmail}
                      onChange={(e) => setExternalEmail(e.target.value)}
                      placeholder={uiLabel(lang, 'Email *', 'Email *', 'Email *')}
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={externalName}
                        onChange={(e) => setExternalName(e.target.value)}
                        placeholder={uiLabel(lang, 'Nom', 'Nombre', 'Name')}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        value={externalCompany}
                        onChange={(e) => setExternalCompany(e.target.value)}
                        placeholder={uiLabel(lang, 'Société', 'Empresa', 'Company')}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void addInviteExternal()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      {uiLabel(lang, 'Ajouter à la liste', 'Añadir a la lista', 'Add to list')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {uiLabel(lang, 'Participants / invitations', 'Participantes / invitaciones', 'Participants / invitations')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(['invited', 'present', 'declined'] as EventParticipationStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setParticipantsFilter(st)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          participantsFilter === st ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {st === 'invited'
                          ? uiLabel(lang, 'Invités', 'Invitados', 'Invited')
                          : st === 'present'
                            ? uiLabel(lang, 'Présents', 'Presentes', 'Present')
                            : uiLabel(lang, 'Refusés', 'Rechazados', 'Declined')}
                      </button>
                    ))}
                  </div>
                </div>

                {participantsError ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                    {participantsError}
                  </p>
                ) : null}
                {participantsLoading ? <p className="text-sm text-stone-500">{uiLabel(lang, 'Chargement…', 'Cargando…', 'Loading…')}</p> : null}

                <div className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
                  {filteredParticipants.map((p) => (
                    <div key={p.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-stone-900">
                            {p.fullName || p.email}
                          </p>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge(p.status)}`}>
                            {p.status === 'invited'
                              ? uiLabel(lang, 'Invité', 'Invitado', 'Invited')
                              : p.status === 'present'
                                ? uiLabel(lang, 'Présent', 'Presente', 'Present')
                                : uiLabel(lang, 'Refusé', 'Rechazado', 'Declined')}
                          </span>
                          <span className="text-[11px] font-medium text-stone-400">
                            {p.statusSource === 'admin' ? uiLabel(lang, 'admin', 'admin', 'admin') : uiLabel(lang, 'invité', 'invitado', 'guest')}
                          </span>
                        </div>
                        <p className="truncate text-xs text-stone-500">
                          {p.companyName ? `${p.companyName} · ` : ''}
                          {p.email}
                        </p>
                        {p.adminNote ? (
                          <p className="mt-1 whitespace-pre-wrap text-xs text-stone-700">
                            <span className="font-semibold">{uiLabel(lang, 'Note:', 'Nota:', 'Note:')}</span> {p.adminNote}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void setParticipationStatus(p, 'invited', 'admin')}
                          className="rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                        >
                          {uiLabel(lang, 'Invité', 'Invitado', 'Invited')}
                        </button>
                        <button
                          type="button"
                          onClick={() => void setParticipationStatus(p, 'present', 'admin')}
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          {uiLabel(lang, 'Présent', 'Presente', 'Present')}
                        </button>
                        <button
                          type="button"
                          onClick={() => void setParticipationStatus(p, 'declined', 'admin')}
                          className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                        >
                          {uiLabel(lang, 'Refusé', 'Rechazado', 'Declined')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = window.prompt(uiLabel(lang, 'Note admin (privée)', 'Nota admin (privada)', 'Admin note (private)'), p.adminNote ?? '');
                            if (next === null) return;
                            void setParticipationNote(p, next);
                          }}
                          className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100"
                        >
                          {uiLabel(lang, 'Note', 'Nota', 'Note')}
                        </button>
                      </div>
                    </div>
                  ))}
                  {!participantsLoading && filteredParticipants.length === 0 ? (
                    <div className="p-4 text-sm text-stone-500">
                      {uiLabel(lang, 'Aucune entrée pour ce filtre.', 'No hay entradas para este filtro.', 'No entries for this filter.')}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {uiLabel(
                    lang,
                    'Répondants (formulaire public /e/…)',
                    'Respondientes (formulario público /e/…)',
                    'Respondents (public /e/… form)'
                  )}
                </p>
                {respondentsError ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                    {respondentsError}
                  </p>
                ) : null}
                {respondentsLoading ? (
                  <p className="text-sm text-stone-500">{uiLabel(lang, 'Chargement…', 'Cargando…', 'Loading…')}</p>
                ) : null}
                <div className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
                  {respondents.map((r) => (
                    <div key={r.id} className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-stone-900">
                          {r.firstName} {r.lastName}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${respondentAttendanceBadge(r.attendance)}`}
                        >
                          {r.attendance === 'yes'
                            ? uiLabel(lang, 'Présent', 'Presente', 'Attending')
                            : r.attendance === 'no'
                              ? uiLabel(lang, 'Absent', 'Ausente', 'Not attending')
                              : uiLabel(lang, 'Peut-être', 'Quizás', 'Maybe')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-600">
                        {r.email} · WhatsApp {r.whatsapp}
                      </p>
                      <p className="text-xs text-stone-600">
                        {r.jobTitle} · {r.companyName}
                      </p>
                      {r.comments?.trim() ? (
                        <p className="mt-2 whitespace-pre-wrap text-xs text-stone-700">
                          <span className="font-semibold text-stone-500">
                            {uiLabel(lang, 'Commentaire :', 'Comentario:', 'Comment:')}
                          </span>{' '}
                          {r.comments}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-stone-400">{fmtDateTime(r.createdAt, lang)}</p>
                    </div>
                  ))}
                  {!respondentsLoading && respondents.length === 0 ? (
                    <div className="p-4 text-sm text-stone-500">
                      {uiLabel(
                        lang,
                        'Aucun répondant pour l’instant.',
                        'Aún no hay respondientes.',
                        'No respondents yet.'
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-[240] flex items-center justify-center bg-stone-900/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold text-stone-900">{uiLabel(lang, 'Aperçu invitation', 'Vista previa invitación', 'Invitation preview')}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {uiLabel(lang, 'Ce texte sera copié/collé dans tes messages.', 'Este texto se copiará/pegará en tus mensajes.', 'This text is meant to be copy/pasted.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                aria-label={uiLabel(lang, 'Fermer', 'Cerrar', 'Close')}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Email</p>
                <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-stone-800">
                  {buildEmailTemplate(previewEventDraft, previewDraftUrl)}
                </pre>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">WhatsApp</p>
                <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-stone-800">
                  {buildWhatsappTemplate(previewEventDraft, previewDraftUrl)}
                </pre>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void safeCopy(buildEmailTemplate(previewEventDraft, previewDraftUrl))}
                  className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <Copy className="h-4 w-4" aria-hidden />
                  {uiLabel(lang, 'Copier email', 'Copiar email', 'Copy email')}
                </button>
                <button
                  type="button"
                  onClick={() => void safeCopy(buildWhatsappTemplate(previewEventDraft, previewDraftUrl))}
                  className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <Copy className="h-4 w-4" aria-hidden />
                  {uiLabel(lang, 'Copier WhatsApp', 'Copiar WhatsApp', 'Copy WhatsApp')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => void saveEvent()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" aria-hidden />
                {saving ? uiLabel(lang, 'Enregistrement…', 'Guardando…', 'Saving…') : uiLabel(lang, 'Enregistrer', 'Guardar', 'Save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {magicLinkOpen ? (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-stone-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold text-stone-900">{uiLabel(lang, 'Magic link', 'Magic link', 'Magic link')}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {uiLabel(lang, 'Lien à partager pour l’inscription/refus.', 'Enlace para compartir para inscripción/rechazo.', 'Share this link for RSVP (present/declined).')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMagicLinkOpen(false)}
                className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                aria-label={uiLabel(lang, 'Fermer', 'Cerrar', 'Close')}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <p className="break-all text-sm font-semibold text-stone-900">{magicLinkUrl}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void safeCopy(magicLinkUrl)}
                className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
              >
                <Copy className="h-4 w-4" aria-hidden />
                {uiLabel(lang, 'Copier le lien', 'Copiar enlace', 'Copy link')}
              </button>
              <button
                type="button"
                onClick={() => setMagicLinkOpen(false)}
                className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                {uiLabel(lang, 'Fermer', 'Cerrar', 'Close')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

