import { APP_URL_PARAM } from './resend';
import { pickDisplayName } from './profileCompletion';

/**
 * Variables disponibles dans le sujet et le corps des automations.
 * Le serveur les substitue au moment de l'envoi via {@link interpolate}.
 */
export type TemplateVars = Record<string, string>;

export type RecipientLike = {
  uid?: string | null;
  email: string;
  fullName?: string | null;
  displayName?: string | null;
  companyName?: string | null;
  completionRate?: number | null;
  /**
   * Langue préférée pour les communications internes (`'fr' | 'es' | 'en'`).
   * Stockée dans `users/{uid}.communicationLanguage`. Par défaut `'es'` côté
   * formulaire d'inscription.
   */
  communicationLanguage?: 'fr' | 'es' | 'en' | null;
};

/** Langue par défaut côté serveur si le profil n'a pas la préférence. */
export const DEFAULT_COMMUNICATION_LANGUAGE: 'fr' | 'es' | 'en' = 'es';

function resolveLanguage(
  v: unknown
): 'fr' | 'es' | 'en' {
  return v === 'fr' || v === 'es' || v === 'en'
    ? v
    : DEFAULT_COMMUNICATION_LANGUAGE;
}

function firstName(full: string | undefined | null): string {
  const s = (full ?? '').trim();
  if (!s) return '';
  const parts = s.split(/\s+/);
  return parts[0] ?? '';
}

/**
 * Construit le dictionnaire de variables pour un destinataire.
 * Toutes les valeurs sont garanties string (jamais null/undefined) pour
 * un rendu propre dans le HTML.
 */
export function buildVariables(recipient: RecipientLike): TemplateVars {
  const appUrl = APP_URL_PARAM.value() || 'https://franconetwork.app';
  const display = pickDisplayName({
    displayName: recipient.displayName ?? undefined,
    fullName: recipient.fullName ?? undefined,
  });
  const fullName = (recipient.fullName ?? display ?? '').trim();
  const completion = Math.max(
    0,
    Math.min(100, Math.round(recipient.completionRate ?? 0))
  );

  const language = resolveLanguage(recipient.communicationLanguage);
  const monthLabel = (() => {
    const now = new Date();
    const locale = language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-US' : 'es-MX';
    try {
      return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(now);
    } catch {
      return '';
    }
  })();
  return {
    firstName: firstName(fullName) || display,
    fullName: fullName || display,
    displayName: display,
    email: recipient.email,
    companyName: (recipient.companyName ?? '').trim(),
    appUrl,
    profileEditUrl: `${appUrl}/profile/edit`,
    networkUrl: `${appUrl}/network`,
    statsShareUrl: `${appUrl}/stats/share?lang=${language}`,
    monthLabel,
    // KPI (renseignés par certains triggers, ex. monthlySchedule). Valeurs vides par défaut.
    kpiMembers: '',
    kpiConnections: '',
    kpiGrowthPct: '',
    kpiSectors: '',
    completionRate: String(completion),
    completionPercent: `${completion}%`,
    language,
  };
}

/** Données de prévisualisation utilisées pour l'envoi de TEST. */
export function buildSampleVariables(adminEmail: string): TemplateVars {
  const appUrl = APP_URL_PARAM.value() || 'https://franconetwork.app';
  const monthLabel = (() => {
    try {
      return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date());
    } catch {
      return '';
    }
  })();
  return {
    firstName: 'Gregory',
    fullName: 'Gregory Prudhommeaux',
    displayName: 'Gregory Prudhommeaux',
    email: adminEmail,
    companyName: 'FrancoNetwork',
    appUrl,
    profileEditUrl: `${appUrl}/profile/edit`,
    networkUrl: `${appUrl}/network`,
    statsShareUrl: `${appUrl}/stats/share?lang=${DEFAULT_COMMUNICATION_LANGUAGE}`,
    monthLabel,
    kpiMembers: '153',
    kpiConnections: '1 120',
    kpiGrowthPct: '+18%',
    kpiSectors: '8',
    completionRate: '87',
    completionPercent: '87%',
    language: DEFAULT_COMMUNICATION_LANGUAGE,
  };
}

const TOKEN_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * Substitue les jetons `{{name}}` dans une chaîne. Les variables inconnues
 * sont remplacées par chaîne vide pour éviter les fuites de syntaxe dans
 * l'email final.
 */
export function interpolate(input: string, vars: TemplateVars): string {
  if (!input) return '';
  return input.replace(TOKEN_RE, (_, key: string) => {
    const v = vars[key];
    return typeof v === 'string' ? v : '';
  });
}

/**
 * Liste des variables exposées pour l'aide-mémoire de l'UI admin.
 * Source unique pour qu'un nouvel ajout côté serveur soit visible côté UI.
 */
export const AVAILABLE_VARS: { name: string; description: string }[] = [
  { name: 'firstName', description: 'Prénom du destinataire' },
  { name: 'fullName', description: 'Nom complet' },
  { name: 'displayName', description: 'Nom d\'affichage (fullName si dispo, sinon displayName)' },
  { name: 'email', description: 'Adresse email' },
  { name: 'companyName', description: 'Société (si renseignée)' },
  { name: 'appUrl', description: 'URL de l\'app (https://franconetwork.app)' },
  { name: 'profileEditUrl', description: 'Lien direct vers /profile/edit' },
  { name: 'networkUrl', description: 'Lien vers le répertoire /network' },
  { name: 'statsShareUrl', description: 'Lien vers la vitrine /stats/share (langue auto)' },
  { name: 'monthLabel', description: 'Mois en cours (ex. avril 2026) selon la langue' },
  { name: 'kpiMembers', description: 'KPI — membres (nombre formaté)' },
  { name: 'kpiConnections', description: 'KPI — connexions potentielles (nombre formaté)' },
  { name: 'kpiGrowthPct', description: 'KPI — croissance du mois (ex. +18%)' },
  { name: 'kpiSectors', description: 'KPI — secteurs représentés (nombre formaté)' },
  { name: 'completionRate', description: 'Taux de complétion (0–100)' },
  { name: 'completionPercent', description: 'Taux de complétion avec %' },
  { name: 'language', description: "Langue de communication choisie (fr/es/en, défaut es)" },
];
