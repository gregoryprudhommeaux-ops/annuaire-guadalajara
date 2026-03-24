import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

/** Si App Check est « Enforced » pour Firestore : enregistrer l’app web dans Firebase → App Check, copier la clé reCAPTCHA v3, puis .env → VITE_FIREBASE_APPCHECK_SITE_KEY=... */
const appCheckSiteKey =
  typeof import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY === 'string'
    ? import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY.trim()
    : '';
if (typeof window !== 'undefined' && appCheckSiteKey.length > 0) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
