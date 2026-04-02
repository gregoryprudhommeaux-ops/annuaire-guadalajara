import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';

/** Événements produit (accueil, cartes) — distincts des logs Firestore `events_log` ci-dessous. */
export type AnalyticsEventName =
  | 'home_invite_click'
  | 'home_search_submit'
  | 'home_why_join_seen'
  | 'member_card_view_profile';

export function trackEvent(
  eventName: AnalyticsEventName,
  payload?: Record<string, unknown>
): void {
  if (import.meta.env.DEV) {
    console.info('[analytics]', eventName, payload ?? {});
  }

  // À brancher plus tard vers Firebase Analytics, Mixpanel ou autre
}

/** Types alignés sur `firestore.rules` (eventType + champs autorisés). */
export type EventType =
  | 'click_linkedin'
  | 'click_email'
  | 'click_whatsapp'
  | 'click_random_profile'
  | 'click_invite'
  | 'search'
  | 'filter_used'
  | 'profile_view'
  | 'spa_route';

type MemberLogInput = {
  eventType: EventType;
  targetId?: string;
  targetType?: string;
  source?: string;
  metadata?: Record<string, string>;
};

/**
 * Vues de route SPA sans compte (rules : `spa_route` + metadata.path uniquement).
 * Appelé depuis le routeur ; silencieux en cas d’erreur.
 */
export async function trackSpaRoute(pathname: string): Promise<void> {
  const path = pathname.slice(0, 240) || '/';
  try {
    await addDoc(collection(db, 'events_log'), {
      eventType: 'spa_route',
      metadata: { path },
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[trackSpaRoute] Failed:', err);
  }
}

/**
 * Événements membres connectés (rules : authentifié + schéma isValidEventLog).
 */
export async function trackMemberInteraction(input: MemberLogInput): Promise<void> {
  const auth = getAuth();
  const u = auth.currentUser;
  if (!u) return;

  const doc: Record<string, unknown> = {
    eventType: input.eventType,
    actorUid: u.uid,
    createdAt: serverTimestamp(),
  };
  if (u.email) doc.actorEmail = u.email;
  if (input.targetId) doc.targetId = input.targetId;
  if (input.targetType) doc.targetType = input.targetType;
  if (input.source) doc.source = input.source;
  if (input.metadata && Object.keys(input.metadata).length > 0) {
    doc.metadata = input.metadata;
  }

  try {
    await addDoc(collection(db, 'events_log'), doc);
  } catch (err) {
    console.warn('[trackMemberInteraction] Failed:', err);
  }
}
