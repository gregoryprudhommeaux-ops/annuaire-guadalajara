/** Même ID que `firebase.json` / `firebase-applet-config.json` (base Firestore nommée). */
export const FIRESTORE_DATABASE_ID =
  'ai-studio-b6e23c83-eceb-4cf9-848f-8e11b8db6eb8';

/** Une ligne = 6 colonnes (A–F), alignées entre inscription Auth et export profils. */
export const MEMBER_SHEET_HEADERS = [
  'Inscrit le',
  'UID',
  'Email',
  'Nom',
  'Société',
  'Rôle / source',
] as const;
