import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

/** Même ID que `firebase.json` / `functions/src/constants.ts` (base Firestore nommée). */
export const DEFAULT_FIRESTORE_DATABASE_ID =
  'ai-studio-b6e23c83-eceb-4cf9-848f-8e11b8db6eb8';

function resolveFirestoreDatabaseId(raw: string | undefined): string {
  const trimmed = String(raw ?? '').trim();
  // Vercel placeholder "none" (or empty) must not override the real named database.
  if (!trimmed || trimmed.toLowerCase() === 'none') {
    return DEFAULT_FIRESTORE_DATABASE_ID;
  }
  return trimmed;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([key, value]) => key !== 'measurementId' && !String(value ?? '').trim())
  .map(([key]) => key);

if (missingFirebaseConfig.length > 0) {
  throw new Error(`Missing Firebase environment variables: ${missingFirebaseConfig.join(', ')}`);
}

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId = resolveFirestoreDatabaseId(
  import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID
);

export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'us-central1');
