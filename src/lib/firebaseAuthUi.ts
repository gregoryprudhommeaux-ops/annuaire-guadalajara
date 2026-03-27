import { FirebaseError } from 'firebase/app';
import type { ActionCodeSettings } from 'firebase/auth';

/** URL de retour après clic sur lien e-mail (vérif / reset) : domaine courant (ex. franconetwork.app). */
export function getAuthActionCodeSettings(): ActionCodeSettings {
  if (typeof window === 'undefined') {
    return { url: '/', handleCodeInApp: false };
  }
  return {
    url: `${window.location.origin}/`,
    handleCodeInApp: false,
  };
}

const CODE_TO_KEY: Record<string, string> = {
  'auth/email-already-in-use': 'authErrEmailAlreadyInUse',
  'auth/invalid-email': 'authErrInvalidEmail',
  'auth/weak-password': 'authErrWeakPassword',
  'auth/user-not-found': 'authErrUserNotFound',
  'auth/wrong-password': 'authErrWrongPassword',
  'auth/user-disabled': 'authErrUserDisabled',
  'auth/too-many-requests': 'authErrTooManyRequests',
  'auth/invalid-credential': 'authErrInvalidCredential',
  'auth/unauthorized-domain': 'authErrUnauthorizedDomain',
  'auth/operation-not-allowed': 'authErrOperationNotAllowed',
  'auth/popup-closed-by-user': 'authErrPopupClosed',
};

export function firebaseAuthCodeToTranslationKey(code: string): string {
  return CODE_TO_KEY[code] ?? 'authErrGeneric';
}

export function readFirebaseAuthErrorCode(error: unknown): string {
  if (error instanceof FirebaseError) return error.code;
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code?: string }).code ?? '');
  }
  return '';
}

/** Texte utilisateur seul (sans suffixe code) — aligné avec les erreurs OAuth dans App. */
export function firebaseAuthErrorUserMessage(
  error: unknown,
  t: (key: string) => string,
  host: string
): string {
  const code = readFirebaseAuthErrorCode(error);
  const key = firebaseAuthCodeToTranslationKey(code);
  let msg = t(key);
  if (key === 'authErrUnauthorizedDomain') {
    msg = msg.replace(/\{\{host\}\}/g, host);
  }
  return msg;
}

export function formatFirebaseAuthErrorMessage(
  error: unknown,
  t: (key: string) => string,
  host: string
): string {
  const code = readFirebaseAuthErrorCode(error);
  const msg = firebaseAuthErrorUserMessage(error, t, host);
  return code ? `${msg} (${code})` : msg;
}
