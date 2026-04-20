import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addDoc, collection, getDocs, limit, query, Timestamp, where } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/firebase';
import type { AdminEvent, EventRespondentAttendance, Language } from '@/types';

type TFn = (key: string) => string;

type Props = {
  lang: Language;
  t: TFn;
  currentUser?: User | null;
  onStartRsvp?: (status: 'present' | 'declined') => void;
};

function fmtDateTime(ts: Timestamp | null | undefined, lang: Language): string {
  if (!ts) return '';
  try {
    const d = ts.toDate();
    return d.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function fmtTimeRange(event: AdminEvent, lang: Language): string {
  const start = fmtDateTime(event.startsAt, lang);
  const end = event.endsAt ? fmtDateTime(event.endsAt, lang) : '';
  if (!end) return start;
  // Si même jour, on garde une seule date, puis "HH:MM – HH:MM"
  try {
    const s = event.startsAt.toDate();
    const e = event.endsAt.toDate();
    const sameDay = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate();
    if (!sameDay) return `${start} → ${end}`;
    const dateOnly = s.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
    const startTime = s.toLocaleTimeString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const endTime = e.toLocaleTimeString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateOnly} · ${startTime} – ${endTime}`;
  } catch {
    return `${start} – ${end}`;
  }
}

function uiPublic(lang: Language, fr: string, es: string, en: string) {
  return lang === 'en' ? en : lang === 'es' ? es : fr;
}

function safeHttpUrl(raw: string | undefined | null): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? s : '';
  } catch {
    return '';
  }
}

export default function PublicEventPage({ lang, t, currentUser, onStartRsvp }: Props) {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<AdminEvent | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [comments, setComments] = useState('');
  const [attendance, setAttendance] = useState<EventRespondentAttendance>('yes');

  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [guestSuccess, setGuestSuccess] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const s = String(slug ?? '').trim();
      if (!s) {
        setEvent(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'events'),
          where('slug', '==', s),
          where('status', '==', 'published'),
          limit(1)
        );
        const snap = await getDocs(q);
        const docSnap = snap.docs[0];
        const row = docSnap ? ({ id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) } as AdminEvent) : null;
        if (!cancelled) setEvent(row);
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
  }, [slug]);

  const title = useMemo(() => {
    if (lang === 'es') return 'Evento';
    if (lang === 'en') return 'Event';
    return 'Événement';
  }, [lang]);

  const submitGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event?.id || guestSubmitting) return;
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = guestEmail.trim().toLowerCase();
    const wa = whatsapp.trim();
    const job = jobTitle.trim();
    const co = companyName.trim();
    const comm = comments.trim();

    if (!fn || !ln || !em || !em.includes('@') || wa.length < 3 || !job || !co) {
      setGuestError(
        uiPublic(
          lang,
          'Remplis les champs obligatoires (prénom, nom, email, WhatsApp, poste, société).',
          'Completa los obligatorios (nombre, apellido, email, WhatsApp, puesto, empresa).',
          'Please fill required fields (first name, last name, email, WhatsApp, job position, company).'
        )
      );
      return;
    }
    setGuestSubmitting(true);
    setGuestError(null);
    try {
      await addDoc(collection(db, 'event_respondents'), {
        eventId: event.id,
        firstName: fn,
        lastName: ln,
        email: em,
        whatsapp: wa,
        jobTitle: job,
        companyName: co,
        comments: comm,
        attendance,
        createdAt: Timestamp.now(),
      });
      setGuestSuccess(true);
      setFirstName('');
      setLastName('');
      setGuestEmail('');
      setWhatsapp('');
      setJobTitle('');
      setCompanyName('');
      setComments('');
      setAttendance('yes');
    } catch (err) {
      setGuestError(err instanceof Error ? err.message : String(err));
    } finally {
      setGuestSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">{lang === 'es' ? 'Cargando…' : lang === 'en' ? 'Loading…' : 'Chargement…'}</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </div>
    );
  }

  if (!event) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold text-stone-900">{title}</h2>
        <p className="mt-2 text-sm text-stone-600">
          {lang === 'es'
            ? 'No encontramos este evento o aún no está publicado.'
            : lang === 'en'
              ? 'We could not find this event, or it is not published yet.'
              : 'Impossible de trouver cet événement, ou il n’est pas encore publié.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">{event.title}</h2>
        <p className="mt-2 text-sm text-stone-600">
          {fmtTimeRange(event, lang)}
          {event.address ? ` · ${event.address}` : ''}
        </p>

        {(() => {
          const mapsUrl = safeHttpUrl(event.mapsUrl);
          if (!mapsUrl) return null;
          return (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              {uiPublic(lang, 'Ouvrir Google Maps', 'Abrir Google Maps', 'Open Google Maps')}
            </a>
          );
        })()}

        {(() => {
          const dress = String(event.dressCode ?? '').trim();
          const parking = String(event.parking ?? '').trim();
          if (!dress && !parking) return null;
          const dressLabel =
            dress === 'casual'
              ? uiPublic(lang, 'Décontractée', 'Casual', 'Casual')
              : dress === 'smart_casual'
                ? uiPublic(lang, 'Casual chic', 'Smart casual', 'Smart casual')
                : dress === 'business'
                  ? uiPublic(lang, 'Business', 'Business', 'Business')
                  : dress === 'formal'
                    ? uiPublic(lang, 'Formelle', 'Formal', 'Formal')
                    : dress === 'traditional'
                      ? uiPublic(lang, 'Traditionnelle', 'Tradicional', 'Traditional')
                      : '';
          const parkingLabel =
            parking === 'on_site'
              ? uiPublic(lang, 'Parking sur place', 'Estacionamiento en sitio', 'On-site parking')
              : parking === 'secure_nearby'
                ? uiPublic(lang, 'Parking sécurisé proche', 'Estacionamiento seguro cercano', 'Secure parking nearby')
                : parking === 'valet'
                  ? uiPublic(lang, 'Voiturier', 'Valet parking', 'Valet service')
                  : parking === 'unknown'
                    ? uiPublic(lang, 'Pas de solution identifiée', 'Sin solución identificada', 'No identified solution')
                    : '';
          if (!dressLabel && !parkingLabel) return null;
          return (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {dressLabel ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                    {uiPublic(lang, 'Tenue', 'Vestimenta', 'Dress code')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">{dressLabel}</p>
                </div>
              ) : null}
              {parkingLabel ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                    {uiPublic(lang, 'Stationnement', 'Estacionamiento', 'Parking')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">{parkingLabel}</p>
                </div>
              ) : null}
            </div>
          );
        })()}

        {event.introText?.trim() ? (
          <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="whitespace-pre-wrap text-sm text-stone-700">{event.introText}</p>
          </div>
        ) : null}

        {(() => {
          const formUrl = safeHttpUrl(event.registrationFormUrl);
          const flyerUrl = safeHttpUrl(event.flyerUrl);
          if (!formUrl && !flyerUrl) return null;
          return (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {formUrl ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                    {uiPublic(lang, "Formulaire d'inscription", 'Formulario de inscripción', 'Registration form')}
                  </p>
                  <a
                    href={formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    {uiPublic(lang, 'Ouvrir', 'Abrir', 'Open')}
                  </a>
                </div>
              ) : null}
              {flyerUrl ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-900">
                    {uiPublic(lang, 'Flyer', 'Flyer', 'Flyer')}
                  </p>
                  <a
                    href={flyerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
                  >
                    {uiPublic(lang, 'Voir', 'Ver', 'View')}
                  </a>
                </div>
              ) : null}
            </div>
          );
        })()}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-sm font-semibold text-stone-900">
          {uiPublic(lang, 'Participation à l’événement', 'Participación al evento', 'Event RSVP')}
        </p>
        <p className="mt-1 text-xs text-stone-600">
          {uiPublic(
            lang,
            'Répondez ici. Si vous participez, on vous demandera de créer un compte et compléter votre profil.',
            'Responde aquí. Si participas, te pediremos crear una cuenta y completar tu perfil.',
            'Reply here. If you attend, you’ll be asked to create an account and complete your profile.'
          )}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onStartRsvp?.('present')}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {uiPublic(lang, 'Je participe', 'Sí, participaré', 'Yes, I will attend')}
          </button>
          <button
            type="button"
            onClick={() => onStartRsvp?.('declined')}
            className="rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            {uiPublic(lang, 'Je ne pourrai pas', 'No podré asistir', "No, I can't attend")}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-stone-500">
          {uiPublic(
            lang,
            'Votre réponse via ce bouton est visible uniquement par les administrateurs.',
            'Tu respuesta por este botón será visible solo para administradores.',
            'Your response via this button is visible to admins only.'
          )}
        </p>
      </div>

      {!currentUser ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">
            {uiPublic(lang, 'Pas encore membre de l’annuaire ?', '¿Aún no eres miembro del directorio?', 'Not a directory member yet?')}
          </p>
          <p className="mt-1 text-xs text-blue-800">
            {uiPublic(
              lang,
              'Crée un compte pour rejoindre le réseau et être visible par les autres membres.',
              'Crea una cuenta para unirte a la red y ser visible para otros miembros.',
              'Create an account to join the network and be visible to other members.'
            )}
          </p>
          <Link
            to="/inscription"
            className="mt-3 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            {t('signupPageTitle')}
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm font-semibold text-indigo-900">
            {uiPublic(
              lang,
              'Tu es connecté : tu peux aussi confirmer ta présence (ou ton refus) avec ton profil annuaire via la fenêtre qui s’affiche.',
              'Has iniciado sesión: también puedes confirmar asistencia (o rechazar) con tu perfil del directorio en el modal.',
              'You’re signed in: you can also confirm or decline with your directory profile via the prompt shown.'
            )}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-sm font-semibold text-stone-900">
          {uiPublic(lang, 'Répondre à l’invitation', 'Responder a la invitación', 'Respond to the invitation')}
        </p>
        <p className="mt-1 text-xs text-stone-600">
          {uiPublic(
            lang,
            'Indique si tu participes ou non. Les données servent à organiser l’événement.',
            'Indica si participarás o no. Los datos sirven para organizar el evento.',
            'Let us know if you plan to attend. Data is used to organize the event.'
          )}
        </p>

        {guestSuccess ? (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            {uiPublic(
              lang,
              'Merci, ta réponse a bien été enregistrée.',
              'Gracias, tu respuesta se ha registrado.',
              'Thanks — your response was saved.'
            )}
          </p>
        ) : (
          <form onSubmit={(e) => void submitGuest(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
            {guestError ? (
              <p className="sm:col-span-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {guestError}
              </p>
            ) : null}

            <div>
              <label className="block text-xs font-semibold text-stone-700">
                {uiPublic(lang, 'Prénom *', 'Nombre *', 'First name *')}
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700">
                {uiPublic(lang, 'Nom *', 'Apellido *', 'Last name *')}
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                autoComplete="family-name"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700">Email *</label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                autoComplete="email"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700">WhatsApp *</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={uiPublic(lang, '+52 …', '+52 …', '+52 …')}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                autoComplete="tel"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700">
                {uiPublic(lang, 'Poste / fonction *', 'Puesto / función *', 'Job position *')}
              </label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700">
                {uiPublic(lang, 'Société *', 'Empresa *', 'Company *')}
              </label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                autoComplete="organization"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700">
                {uiPublic(lang, 'Participation *', 'Participación *', 'Attendance *')}
              </label>
              <select
                value={attendance}
                onChange={(e) => setAttendance(e.target.value as EventRespondentAttendance)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="yes">{uiPublic(lang, 'Je participe', 'Participaré', 'I will attend')}</option>
                <option value="maybe">{uiPublic(lang, 'Peut-être', 'Quizás', 'Maybe')}</option>
                <option value="no">{uiPublic(lang, 'Je ne participe pas', 'No participaré', 'I will not attend')}</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700">
                {uiPublic(lang, 'Commentaires (optionnel)', 'Comentarios (opcional)', 'Comments (optional)')}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="mt-1 w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={guestSubmitting}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
              >
                {guestSubmitting
                  ? uiPublic(lang, 'Envoi…', 'Enviando…', 'Sending…')
                  : uiPublic(lang, 'Envoyer ma réponse', 'Enviar mi respuesta', 'Send my response')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
