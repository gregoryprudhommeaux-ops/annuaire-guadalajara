import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type EventType =
  | 'click_linkedin'
  | 'click_email'
  | 'click_whatsapp'
  | 'click_random_profile'
  | 'click_invite'
  | 'search'
  | 'filter_used'
  | 'profile_view';

export interface TrackEventPayload {
  eventType: EventType;
  targetProfileId?: string;
  targetProfileName?: string;
  actorUserId?: string;
  metadata?: Record<string, string>;
}

/**
 * Enregistre un evenement dans la collection Firestore "events_log".
 * Fire-and-forget : ne bloque jamais l'UI, les erreurs sont silencieuses.
 */
export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  try {
    await addDoc(collection(db, 'events_log'), {
      ...payload,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // Silencieux pour ne pas impacter l'UX
    console.warn('[trackEvent] Failed to log event:', err);
  }
}

