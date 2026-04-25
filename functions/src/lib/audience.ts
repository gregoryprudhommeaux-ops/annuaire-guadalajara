import { getFirestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { computeCompletionRate, pickDisplayName } from './profileCompletion';

export type AudienceFilter =
  | { type: 'all' }
  | { type: 'incomplete'; threshold?: number }
  | { type: 'manual'; emails: string[] };

export type AudienceMember = {
  uid: string;
  email: string;
  displayName: string;
  fullName: string;
  completionRate: number;
};

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/**
 * Résout un filtre d'audience en liste de destinataires (déduplication par email).
 * Exclut systématiquement les profils avec digestOptOut === true et les emails
 * sans adresse valide.
 */
export async function resolveAudience(
  filter: AudienceFilter
): Promise<AudienceMember[]> {
  const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
  const snap = await db.collection('users').get();

  const out: AudienceMember[] = [];
  for (const doc of snap.docs) {
    const d = doc.data() as Record<string, unknown>;
    if (d.digestOptOut === true) continue;
    const email = String(d.email ?? '').trim().toLowerCase();
    if (!isValidEmail(email)) continue;

    const completion = computeCompletionRate({
      fullName: d.fullName as string,
      companyName: d.companyName as string,
      photoURL: d.photoURL as string,
      activityCategory: d.activityCategory as string,
      memberBio: (d.memberBio ?? d.bio) as string,
      activityDescription: d.activityDescription as string,
    });

    out.push({
      uid: doc.id,
      email,
      displayName: pickDisplayName({
        displayName: d.displayName as string,
        fullName: d.fullName as string,
      }),
      fullName: String(d.fullName ?? '').trim(),
      completionRate: completion,
    });
  }

  switch (filter.type) {
    case 'all':
      return dedupe(out);
    case 'incomplete': {
      const threshold = filter.threshold ?? 80;
      return dedupe(out.filter((m) => m.completionRate < threshold));
    }
    case 'manual': {
      const allowed = new Set(
        filter.emails
          .map((e) => String(e).trim().toLowerCase())
          .filter(isValidEmail)
      );
      const fromUsers = out.filter((m) => allowed.has(m.email));
      const knownEmails = new Set(fromUsers.map((m) => m.email));
      const extras: AudienceMember[] = [];
      allowed.forEach((email) => {
        if (knownEmails.has(email)) return;
        extras.push({
          uid: '',
          email,
          displayName: 'cher membre',
          fullName: '',
          completionRate: 0,
        });
      });
      return dedupe([...fromUsers, ...extras]);
    }
  }
}

function dedupe(rows: AudienceMember[]): AudienceMember[] {
  const map = new Map<string, AudienceMember>();
  for (const r of rows) {
    if (!map.has(r.email)) map.set(r.email, r);
  }
  return Array.from(map.values());
}
