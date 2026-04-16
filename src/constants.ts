import {
  Translations,
  EMPLOYEE_COUNT_RANGES,
  type EmployeeCountRange,
  type Language,
} from './types';

export function isEmployeeCountRange(s: string): s is EmployeeCountRange {
  return (EMPLOYEE_COUNT_RANGES as readonly string[]).includes(s);
}

/** Dérive `companySize` (filtres / matching) à partir de la fourchette choisie */
export function companySizeFromEmployeeRange(r: EmployeeCountRange): 'solo' | '2-10' | '11-50' | '50+' {
  switch (r) {
    case '1-5':
      return '2-10';
    case '5-15':
    case '15-30':
    case '30-50':
      return '11-50';
    case '50-100':
    case '100-300':
    case '300+':
    case '1000+':
      return '50+';
  }
}

export function formatEmployeeCountDisplay(
  v: EmployeeCountRange | number | string | undefined | null
): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '';
    return String(v);
  }
  if (typeof v === 'string') {
    if (v === '') return '';
    if (isEmployeeCountRange(v)) return v;
    return v;
  }
  return '';
}

/** Valeur initiale du menu déroulant (profils avec ancien nombre entier) */
export function employeeCountToSelectDefault(
  v: EmployeeCountRange | number | string | undefined | null
): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string' && isEmployeeCountRange(v)) return v;
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n <= 5) return '1-5';
  if (n <= 15) return '5-15';
  if (n <= 30) return '15-30';
  if (n <= 50) return '30-50';
  if (n <= 100) return '50-100';
  if (n <= 300) return '100-300';
  if (n <= 1000) return '300+';
  return '1000+';
}

/** Secteurs : la valeur enregistrée en base reste le libellé FR ; l’UI affiche ES / EN si besoin. */
export const ACTIVITY_CATEGORY_I18N: { fr: string; es: string; en: string }[] = [
  { fr: 'Agriculture & Agroalimentaire', es: 'Agricultura y agroalimentación', en: 'Agriculture & food' },
  { fr: 'Artisanat & Design', es: 'Artesanía y diseño', en: 'Crafts & design' },
  { fr: 'Automobile & Transport', es: 'Automóvil y transporte', en: 'Automotive & transport' },
  { fr: 'Banque & Finance', es: 'Banca y finanzas', en: 'Banking & finance' },
  { fr: 'Bâtiment & Immobilier', es: 'Construcción e inmobiliario', en: 'Construction & real estate' },
  { fr: 'Commerce & Distribution', es: 'Comercio y distribución', en: 'Retail & distribution' },
  { fr: 'Conseil & Services aux entreprises', es: 'Consultoría y servicios a empresas', en: 'Consulting & business services' },
  { fr: 'Culture & Loisirs', es: 'Cultura y ocio', en: 'Culture & leisure' },
  { fr: 'Éducation & Formation', es: 'Educación y formación', en: 'Education & training' },
  { fr: 'Énergie & Environnement', es: 'Energía y medio ambiente', en: 'Energy & environment' },
  { fr: 'Hôtellerie & Restauration', es: 'Hotelería y restauración', en: 'Hospitality & restaurants' },
  { fr: 'Industrie & Manufacturier', es: 'Industria y manufactura', en: 'Industry & manufacturing' },
  { fr: 'Santé & Bien-être', es: 'Salud y bienestar', en: 'Health & wellness' },
  { fr: 'Technologies & Informatique', es: 'Tecnologías e informática', en: 'Technology & IT' },
  { fr: 'Tourisme', es: 'Turismo', en: 'Tourism' },
  { fr: 'Autre', es: 'Otro', en: 'Other' },
];

export const ACTIVITY_CATEGORIES = ACTIVITY_CATEGORY_I18N.map((x) => x.fr);

const activityCategoryByFr = new Map(ACTIVITY_CATEGORY_I18N.map((x) => [x.fr, x]));

export function activityCategoryLabel(value: string | undefined | null, lang: Language): string {
  if (value == null || value === '') return '';
  const row = activityCategoryByFr.get(value);
  if (!row) return value;
  if (lang === 'fr') return row.fr;
  if (lang === 'es') return row.es;
  return row.en;
}

/** Fonction dans l’entreprise : valeur stockée = libellé FR. */
export const WORK_FUNCTION_I18N: { fr: string; es: string; en: string }[] = [
  { fr: 'Direction générale', es: 'Dirección general', en: 'General management' },
  { fr: 'Stratégie / Corporate', es: 'Estrategia / corporativo', en: 'Strategy / corporate' },
  { fr: 'Vente / Business development', es: 'Ventas / desarrollo de negocio', en: 'Sales / business development' },
  { fr: 'Marketing / Communication', es: 'Marketing / comunicación', en: 'Marketing / communications' },
  { fr: 'Service client / Relation clients', es: 'Atención al cliente / relación con clientes', en: 'Customer service / client relations' },
  { fr: 'Développement produits / R&D', es: 'Desarrollo de productos / I+D', en: 'Product development / R&D' },
  { fr: 'Production / Opérations', es: 'Producción / operaciones', en: 'Production / operations' },
  { fr: 'Qualité / HSE', es: 'Calidad / HSE', en: 'Quality / HSE' },
  { fr: 'Technique / Maintenance / Ingénierie', es: 'Técnico / mantenimiento / ingeniería', en: 'Technical / maintenance / engineering' },
  { fr: 'Logistique / Supply chain', es: 'Logística / cadena de suministro', en: 'Logistics / supply chain' },
  { fr: 'Achats / Approvisionnement', es: 'Compras / aprovisionamiento', en: 'Purchasing / procurement' },
  { fr: 'Finance / Comptabilité / Contrôle de gestion', es: 'Finanzas / contabilidad / control de gestión', en: 'Finance / accounting / controlling' },
  { fr: 'Ressources humaines', es: 'Recursos humanos', en: 'Human resources' },
  { fr: 'Informatique / SI / Digital', es: 'Informática / SI / Digital', en: 'IT / IS / digital' },
  { fr: 'Juridique / Compliance / Risques', es: 'Jurídico / cumplimiento / riesgos', en: 'Legal / compliance / risk' },
];

export const WORK_FUNCTION_OPTIONS = WORK_FUNCTION_I18N.map((x) => x.fr);

const workFunctionByFr = new Map(WORK_FUNCTION_I18N.map((x) => [x.fr, x]));

export function workFunctionLabel(value: string | undefined | null, lang: Language): string {
  if (value == null || value === '') return '';
  const row = workFunctionByFr.get(value);
  if (!row) return value;
  if (lang === 'fr') return row.fr;
  if (lang === 'es') return row.es;
  return row.en;
}

export const CITIES = [
  'Guadalajara',
  'Zapopan',
  'Tlaquepaque',
  'Tonalá',
  'Tlajomulco de Zúñiga',
  'El Salto',
  'Autre',
];

/** Libellé affiché pour la liste des villes (`Autre` traduit ; noms propres inchangés). */
export function cityOptionLabel(city: string, lang: Language): string {
  if (city !== 'Autre') return city;
  if (lang === 'fr') return 'Autre';
  if (lang === 'es') return 'Otro';
  return 'Other';
}

/** Seuil d’affichage : bloc « lancement » vs stats complètes (homepage). */
export const MEMBERS_THRESHOLD = 20;

/** Objectif affiché dans le bandeau « premiers membres » (ex. page /join). */
export const FIRST_50_MEMBER_TARGET = 50;

/** Autres membres dans l’annuaire requis pour activer les recommandations IA (3 → 4 fiches au total avec vous). */
export const AI_REC_MIN_OTHER_MEMBERS = 3;

export const TRANSLATIONS: Translations = {
  title: { fr: "Annuaire d'Affaires de Guadalajara", es: "Directorio de Negocios de Guadalajara" },
  subtitle: { fr: "Communauté d'affaires francophone", es: "Comunidad de negocios francohablante" },
  login: { fr: "Se connecter", es: "Iniciar sesión" },
  /** Libellé du bouton header sur mobile (plus explicite) */
  loginMobile: {
    fr: "CRÉER UN PROFIL / LOGIN",
    es: "CREAR PERFIL / LOGIN",
  },
  continueGoogle: { fr: "Continuer avec Google", es: "Continuar con Google" },
  continueMicrosoft: { fr: "Continuer avec Microsoft", es: "Continuar con Microsoft" },
  continueApple: { fr: "Continuer avec Apple", es: "Continuar con Apple" },
  signInWithProvider: {
    fr: "Choisissez un compte :",
    es: "Elige una cuenta:",
  },
  /** Mention sous les boutons OAuth — transparence données (exigences Google Sign-In). */
  authGoogleOAuthMention: {
    fr: 'Connexion sécurisée via Google pour créer et gérer votre profil.',
    es: 'Inicio de sesión seguro con Google para crear y gestionar tu perfil.',
  },
  authOrEmail: {
    fr: "Ou avec une adresse e-mail",
    es: "O con correo electrónico",
  },
  authPassword: { fr: "Mot de passe", es: "Contraseña" },
  authConfirmPassword: {
    fr: "Confirmer le mot de passe",
    es: "Confirmar contraseña",
  },
  authEmailSignIn: { fr: "Se connecter", es: "Iniciar sesión" },
  authEmailSignUp: { fr: "Créer un compte", es: "Crear cuenta" },
  authEmailForgotLink: {
    fr: "Mot de passe oublié ?",
    es: "¿Olvidaste tu contraseña?",
  },
  authEmailNoAccount: { fr: "Pas encore de compte ?", es: "¿No tienes cuenta?" },
  authEmailHasAccount: { fr: "Déjà un compte ?", es: "¿Ya tienes cuenta?" },
  authEmailBackSignIn: {
    fr: "Retour à la connexion",
    es: "Volver al inicio de sesión",
  },
  authEmailSendReset: {
    fr: "Envoyer le lien de réinitialisation",
    es: "Enviar enlace de restablecimiento",
  },
  authResetEmailSent: {
    fr: "Si cette adresse est associée à un compte, un e-mail de réinitialisation vient d’être envoyé.",
    es: "Si esa dirección está asociada a una cuenta, acabamos de enviar un correo para restablecer la contraseña.",
  },
  authVerificationEmailSent: {
    fr: "Un e-mail de vérification vient d’être envoyé. Ouvrez-le pour activer votre compte.",
    es: "Hemos enviado un correo de verificación. Ábrelo para activar tu cuenta.",
  },
  authPasswordMismatch: {
    fr: "Les mots de passe ne correspondent pas.",
    es: "Las contraseñas no coinciden.",
  },
  authErrGeneric: {
    fr: "Une erreur d’authentification s’est produite. Réessayez.",
    es: "Se produjo un error de autenticación. Inténtalo de nuevo.",
  },
  authErrEmailAlreadyInUse: {
    fr: "Cette adresse e-mail est déjà utilisée.",
    es: "Este correo ya está en uso.",
  },
  authErrInvalidEmail: {
    fr: "Adresse e-mail invalide.",
    es: "Correo electrónico no válido.",
  },
  authErrWeakPassword: {
    fr: "Mot de passe trop faible (minimum 6 caractères recommandé).",
    es: "Contraseña demasiado débil (se recomiendan al menos 6 caracteres).",
  },
  authErrUserNotFound: {
    fr: "Aucun compte ne correspond à cette adresse.",
    es: "No hay ninguna cuenta con esta dirección.",
  },
  authErrWrongPassword: {
    fr: "Mot de passe incorrect.",
    es: "Contraseña incorrecta.",
  },
  authErrUserDisabled: {
    fr: "Ce compte a été désactivé. Contactez le support.",
    es: "Esta cuenta está desactivada. Contacta con soporte.",
  },
  authErrTooManyRequests: {
    fr: "Trop de tentatives. Patientez quelques minutes puis réessayez.",
    es: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  },
  authErrInvalidCredential: {
    fr: "E-mail ou mot de passe incorrect.",
    es: "Correo o contraseña incorrectos.",
  },
  authErrUnauthorizedDomain: {
    fr: "Ce domaine ({{host}}) n’est pas autorisé dans Firebase Auth. Ajoutez-le dans Authentication > Settings > Authorized domains.",
    es: "Este dominio ({{host}}) no está autorizado en Firebase Auth. Agrégalo en Authentication > Settings > Authorized domains.",
  },
  authErrOperationNotAllowed: {
    fr: "Ce mode de connexion n’est pas activé dans Firebase Auth (Sign-in method).",
    es: "Este método de inicio de sesión no está habilitado en Firebase Auth (Sign-in method).",
  },
  authErrPopupClosed: {
    fr: "La fenêtre de connexion a été fermée avant la fin. Réessayez.",
    es: "La ventana de inicio de sesión se cerró antes de terminar. Inténtalo de nuevo.",
  },
  authErrOAuthConcurrent: {
    fr: "Une connexion était déjà en cours. Cliquez une seule fois sur le bouton et attendez la fin de la fenêtre.",
    es: "Ya había un inicio de sesión en curso. Haz clic una sola vez en el botón y espera a que termine la ventana.",
  },
  authVerifyEmailBanner: {
    fr: "Vérifiez votre adresse e-mail (lien reçu par message) pour sécuriser votre compte.",
    es: "Verifica tu correo (enlace en el mensaje) para asegurar tu cuenta.",
  },
  authResendVerification: {
    fr: "Renvoyer l’e-mail de vérification",
    es: "Reenviar correo de verificación",
  },
  authVerificationSentShort: {
    fr: "E-mail de vérification envoyé.",
    es: "Correo de verificación enviado.",
  },
  close: { fr: "Fermer", es: "Cerrar" },
  logout: { fr: "Se déconnecter", es: "Cerrar sesión" },
  register: { fr: "S'enregistrer", es: "Registrarse" },
  myProfile: { fr: "Mon Profil", es: "Mi Perfil" },
  profileSharePublicCta: { fr: "Partager le profil", es: "Compartir perfil" },
  profileCreateEventCta: { fr: "Créer un événement", es: "Crear un evento" },
  directory: { fr: "Annuaire", es: "Directorio" },
  fullName: { fr: "Nom complet", es: "Nombre completo" },
  companyName: { fr: "Nom de la société", es: "Nombre de la empresa" },
  /** Titre de section (fiche détail) — pas la vue « Entreprises » du menu */
  company: { fr: "Entreprise", es: "Empresa" },
  creationYear: { fr: "Année de création", es: "Año de creación" },
  city: { fr: "Ville", es: "Ciudad" },
  state: { fr: "État", es: "Estado" },
  neighborhood: { fr: "Quartier", es: "Colonia" },
  country: { fr: "Pays", es: "País" },
  activityCategory: { fr: 'Secteur', es: "Sector de actividad" },
  workFunction: { fr: 'Fonction', es: "Función en la empresa" },
  workFunctionHint: {
    fr: 'Décrivez votre rôle réel, pas seulement votre titre.',
    es: "Rol operativo (no tu título en tu tarjeta de presentación)."
  },
  selectWorkFunction: { fr: "Choisir une fonction...", es: "Elige una función..." },
  email: { fr: "Email", es: "Correo electrónico" },
  website: { fr: "Site web", es: "Sitio web" },
  whatsapp: { fr: "WhatsApp", es: "WhatsApp" },
  passions: { fr: "En dehors du business :", es: "Más allá del negocio :" },
  passionsHint: {
    fr: "Choisissez jusqu’à 10 centres d’intérêt (hors cœur de métier).",
    es: "Elige hasta 10 intereses (fuera de tu actividad principal).",
  },
  passionsMaxReached: {
    fr: "Maximum atteint — décochez une passion pour en choisir une autre.",
    es: "Límite alcanzado — quita una opción para elegir otra.",
  },
  affinityWith: { fr: "Affinités avec", es: "Afinidades con" },
  affinityCommonNeedOne: { fr: "1 besoin en commun", es: "1 necesidad en común" },
  affinityCommonNeedMany: { fr: "{{n}} besoins en commun", es: "{{n}} necesidades en común" },
  affinityCommonPassions: { fr: "Passions en commun", es: "Pasiones en común" },
  affinitySuggestMeet: { fr: "Suggérer une rencontre (WhatsApp)", es: "Proponer un café ☕" },
  affinityWhatsAppMissing: {
    fr: "Ce membre n’a pas renseigné WhatsApp.",
    es: "Este miembro no registró WhatsApp.",
  },
  arrivalYear: { fr: 'Arrivée au Mexique', es: "Año de llegada a México" },
  yearsInMexico: { fr: "Années au Mexique", es: "Años en México" },
  employeeCount: { fr: 'Employés', es: "Número de empleados" },
  employeeCountOptional: { fr: "(facultatif)", es: "(opcional)" },
  isEmailPublic: { fr: "Rendre l'email public", es: "Hacer público mi correo" },
  isWhatsappPublic: { fr: "Rendre WhatsApp public", es: "Hacer público mi WhatsApp" },
  statsOnlySectionTitle: {
    fr: "Données non publiées sur votre fiche",
    es: "Datos que no aparecen en tu ficha pública",
  },
  statsOnlySectionHint: {
    fr: "Ces champs servent à des statistiques internes et à l’organisation du réseau (conformément aux usages européens et au RGPD). Ils ne sont jamais affichés sur l’annuaire public.",
    es: "Estos campos sirven para estadísticas internas y para la organización de la red (alineados con prácticas europeas y el RGPD). No se muestran en el directorio público.",
  },
  genderStatLabel: { fr: "Genre", es: "Género" },
  genderStatHint: {
    fr: "À fins statistiques uniquement.",
    es: "Solo con fines estadísticos.",
  },
  genderStatMale: { fr: "Homme", es: "Hombre" },
  genderStatFemale: { fr: "Femme", es: "Mujer" },
  genderStatOther: { fr: "Autre", es: "Otro" },
  genderStatPreferNotSay: { fr: "Ne souhaite pas répondre", es: "No desea responder" },
  genderStatSelectPlaceholder: {
    fr: "— Choisir une réponse —",
    es: "— Elegir una respuesta —",
  },
  nationalityLabel: { fr: "Nationalité", es: "Nacionalidad" },
  nationalityHint: {
    fr: "Non affichée sur la fiche publique.",
    es: "No se muestra en la ficha pública.",
  },
  nationalitySelectPlaceholder: { fr: "— Sélectionner —", es: "— Seleccionar —" },
  acceptsDelegationVisitsLabel: {
    fr: 'Accueil de délégations',
    es: "La empresa puede recibir visitas de delegaciones",
  },
  acceptsDelegationVisitsHint: {
    fr: "Réservé à l’équipe d’administration (non affiché publiquement).",
    es: "Solo para el equipo de administración (no es público).",
  },
  adminInternalDataTitle: {
    fr: "Données internes (administrateur)",
    es: "Datos internos (administrador)",
  },
  adminFieldGender: { fr: "Genre (stat.)", es: "Género (estad.)" },
  adminFieldNationality: { fr: "Nationalité", es: "Nacionalidad" },
  adminFieldDelegation: { fr: "Visites de délégations", es: "Visitas de delegaciones" },
  adminFieldEventSponsoring: { fr: "Sponsoring d’événements", es: "Patrocinio de eventos" },
  adminDelegationYes: { fr: "Oui", es: "Sí" },
  adminDelegationNo: { fr: "Non", es: "No" },
  adminDelegationUnknown: { fr: "Non renseigné", es: "Sin indicar" },
  linkedin: { fr: "Lien LinkedIn", es: "Enlace LinkedIn" },
  openLinkedin: { fr: "Ouvrir LinkedIn", es: "Abrir LinkedIn" },
  photoURL: { fr: "URL de la photo", es: "URL de la foto" },
  photoUrlHint: {
    fr: "URL HTTPS d’une image déjà hébergée publiquement (la plateforme ne stocke pas de fichier). Collez l’adresse directe de l’image, pas une page web.",
    es: "URL HTTPS de una imagen ya alojada públicamente (la plataforma no guarda archivos). Pega la dirección directa de la imagen, no una página web.",
  },
  save: { fr: "Enregistrer", es: "Guardar" },
  cancel: { fr: "Annuler", es: "Cancelar" },
  commonRecommended: { fr: 'Recommandé', es: 'Recomendado' },
  commonOptional: { fr: 'Facultatif', es: 'Opcional' },
  commonRequired: { fr: 'Obligatoire', es: 'Obligatorio' },
  search: { fr: "Rechercher", es: "Buscar" },
  searchPlaceholder: {
    fr: "Nom, secteur, besoin, mot-clé…",
    es: "Nombre, sector, necesidad, palabra clave…",
  },
  searchBlockTitle: {
    fr: "Trouver un contact clé en 2 clics",
    es: "Encuentra un contacto clave en 2 clics",
  },
  searchBlockSubtitle: {
    fr: "Recherchez un membre, une entreprise ou un besoin pour développer votre réseau à Guadalajara.",
    es: "Busca un miembro, una empresa o una necesidad para hacer crecer tu red en Guadalajara.",
  },
  searchDirectoryPlaceholder: {
    fr: "Rechercher un membre, une entreprise, un besoin…",
    es: "Buscar un miembro, empresa o necesidad…",
  },
  searchDirectoryPlaceholderExamples: {
    fr: "Ex. avocat francophone, importateur agro, coworking à Zapopan",
    es: "Ej. abogado francófono, importador agro, coworking en Zapopan",
  },
  searchButton: { fr: "Chercher maintenant", es: "Buscar ahora" },
  searchHelperTip: {
    fr: 'Astuce : commencez par un besoin concret (ex. « importateur vin », « expert fiscalité »).',
    es: 'Consejo: empieza por una necesidad concreta (ej. « importador de vinos », « experto en fiscalidad »).',
  },
  filterSectorLabel: { fr: "Secteur", es: "Sector" },
  filterSectorDefault: { fr: "Secteur", es: "Sector" },
  filterTypeLabel: { fr: "Type de profil", es: "Tipo de perfil" },
  filterTypeDefault: { fr: "Profil", es: "Perfil" },
  filterTypeCompany: { fr: "Entreprise", es: "Empresa" },
  filterTypeMember: { fr: "Membre", es: "Miembro" },
  filterLocationLabel: { fr: "Lieux", es: "Lugares" },
  filterLocationDefault: { fr: "Lieux", es: "Lugares" },
  filterLocationGuadalajara: { fr: "Guadalajara", es: "Guadalajara" },
  filterLocationZapopan: { fr: "Zapopan", es: "Zapopan" },
  filterLocationOther: { fr: "Autre", es: "Otro" },
  clearFilters: { fr: "Effacer les filtres", es: "Borrar filtros" },
  randomProfile: {
    fr: "🎲 Découvrir un contact à rencontrer cette semaine",
    es: "🎲 Descubrir un contacto para conocer esta semana",
  },
  randomProfileEmpty: {
    fr: "Aucun profil disponible",
    es: "Ningún perfil disponible",
  },
  /** CTA principal : suggestion aléatoire (colonne recherche annuaire). */
  randomProfileSuggest: {
    fr: '🎲 Me suggérer un contact',
    es: '🎲 Sugiéreme un contacto',
  },
  /** Carte membre annuaire : action unique vers la fiche. */
  directoryMemberCardCta: { fr: 'Voir le profil', es: 'Ver perfil' },
  directoryCardNoStructuredNeeds: {
    fr: 'Aucun besoin structuré renseigné.',
    es: 'Sin necesidades estructuradas.',
  },
  launchTitle: {
    fr: "Communauté en cours de lancement",
    es: "Comunidad en lanzamiento",
  },
  launchSubtitle: {
    fr: "Soyez parmi les premiers membres francophones à Guadalajara.",
    es: "Sé de los primeros miembros francófonos en Guadalajara.",
  },
  launchCta: {
    fr: "Créer mon profil maintenant →",
    es: "Crear mi perfil ahora →",
  },
  inviteNetworkTitle: { fr: "Inviter mon réseau", es: "Invitar mi red" },
  inviteNetworkSubtitle: {
    fr: "Partagez le lien de l’annuaire pour faire grandir la communauté francophone à Guadalajara.",
    es: "Comparte el enlace del directorio para hacer crecer la comunidad francófona en Guadalajara.",
  },
  inviteNetworkCta: { fr: "Inviter →", es: "Invitar →" },
  inviteNetworkModalTitle: { fr: "Inviter mon réseau", es: "Invitar mi red" },
  inviteNetworkModalHint: {
    fr: "Envoyez ce message par WhatsApp ou par e-mail, ou copiez-le pour le coller où vous voulez.",
    es: "Envía este mensaje por WhatsApp o correo, o cópialo para pegarlo donde quieras.",
  },
  inviteNetworkMessageLabel: { fr: "Message d’invitation", es: "Mensaje de invitación" },
  inviteEmailSubject: {
    fr: "Rejoins l’annuaire d’affaires francophone de Guadalajara",
    es: "Únete al directorio de negocios francófono de Guadalajara",
  },
  inviteShareBody: {
    fr: "Bonjour,\n\nJe t’invite à rejoindre l’annuaire de la communauté d’affaires francophone de Guadalajara — inscription simple sur cette page :\n\n{url}\n\nÀ bientôt !",
    es: "Hola,\n\nTe invito a unirte al directorio de la comunidad de negocios francófona de Guadalajara — registro sencillo en esta página:\n\n{url}\n\n¡Nos vemos!",
  },
  inviteShareWhatsApp: { fr: "WhatsApp", es: "WhatsApp" },
  inviteShareEmail: { fr: "E-mail", es: "Correo" },
  inviteShareCopy: { fr: "Copier le message", es: "Copiar mensaje" },
  statsMembers: { fr: "membres", es: "miembros" },
  statsSectors: { fr: "secteurs", es: "sectores" },
  tagNewMember: { fr: "Nouveau", es: "Nuevo" },
  tagUrgentNeed: { fr: "Besoin urgent", es: "Necesidad urgente" },
  tagsMore: { fr: "+{{count}} autres", es: "+{{count}} más" },
  tagsCollapse: { fr: "Réduire", es: "Mostrar menos" },
  details: { fr: "Détails", es: "Detalles" },
  restrictedInfo: { fr: "Connectez-vous pour voir", es: "Inicia sesión para ver" },
  registerPrompt: { fr: "Pour accéder à l'ensemble du profil, veuillez vous enregistrer sur l'annuaire", es: "Para ver el perfil completo, regístrate en el directorio" },
  directorySignInRequired: {
    fr: "Les fiches annuaire ne sont visibles qu’après connexion. Connectez-vous depuis l’accueil pour consulter ce contenu.",
    es: "Las fichas del directorio solo son visibles tras iniciar sesión. Conéctate desde el inicio para ver este contenido.",
  },
  adminPanel: { fr: "Panneau Admin", es: "Panel de Admin" },
  exportData: { fr: "Exporter la base de données", es: "Exportar base de datos" },
  signature: { fr: "Produit et managé par NextStep Services", es: "Producido y gestionado por NextStep Services" },
  /** Ligne de copyright sous le © (nom du service / communauté). */
  footerBrandCopyright: {
    fr: "Annuaire d'Affaires de Guadalajara — Communauté francophone",
    es: 'Directorio de negocios de Guadalajara — Comunidad francófona',
  },
  footerPrivacy: { fr: "Confidentialité", es: "Privacidad" },
  footerTerms: { fr: "Conditions", es: "Términos" },
  /** Libellés longs pour liens footer vers pages légales (URL /privacy, /terms). */
  footerPrivacyPageLink: {
    fr: "Politique de confidentialité",
    es: 'Política de privacidad',
  },
  footerTermsPageLink: {
    fr: "Conditions d'utilisation",
    es: 'Términos de uso',
  },
  footerContact: { fr: "Contact", es: "Contacto" },
  legalPrivacyTitle: {
    fr: "Politique de confidentialité et protection des données personnelles",
    es: "Aviso de privacidad y protección de datos personales",
  },
  legalTermsTitle: {
    fr: "Conditions générales d’utilisation",
    es: "Términos y condiciones de uso",
  },
  footerLegalClose: { fr: "Fermer", es: "Cerrar" },
  contactFormTitle: { fr: "Nous écrire", es: "Escríbenos" },
  contactFormName: { fr: "Nom", es: "Nombre" },
  contactFormNamePlaceholder: {
    fr: "Votre nom",
    es: "Tu nombre",
  },
  contactFormEmail: { fr: "E-mail", es: "Correo electrónico" },
  contactFormEmailPlaceholder: {
    fr: "vous@exemple.com",
    es: "tu@ejemplo.com",
  },
  contactFormMessage: { fr: "Message", es: "Mensaje" },
  contactFormMessagePlaceholder: {
    fr: "Votre question ou commentaire…",
    es: "Tu pregunta o comentario…",
  },
  contactFormSubmit: { fr: "Envoyer", es: "Enviar" },
  contactFormSending: { fr: "Envoi en cours…", es: "Enviando…" },
  contactFormSuccess: {
    fr: "Merci ! Votre message a bien été envoyé. Nous devrions pouvoir rapidement venir vers vous !",
    es: "¡Gracias! Tu mensaje se ha enviado correctamente. ¡Deberíamos poder responderte pronto!",
  },
  contactFormErrorGeneric: {
    fr: "L’envoi a échoué. Réessayez plus tard ou contactez-nous par un autre canal.",
    es: "No se pudo enviar. Inténtalo más tarde o contáctanos por otro canal.",
  },
  contactFormErrorConfig: {
    fr: "Le formulaire n’est pas encore configuré côté serveur (clé e-mail manquante).",
    es: "El formulario aún no está configurado en el servidor (falta la clave de correo).",
  },
  contactFormHpLabel: { fr: "Ne pas remplir", es: "No rellenar" },
  adminTabOverview: { fr: "Synthèse", es: "Resumen" },
  adminTabProfiles: { fr: "Analytics profils", es: "Analítica de perfiles" },
  adminTabSite: { fr: "Analytics site", es: "Analítica del sitio" },
  adminTabEvents: { fr: "Événements", es: "Eventos" },
  adminProfileInsightsIntro: {
    fr: "Indicateurs sur les fiches membres : complétude (score interne), inscriptions, mises à jour et validation.",
    es: "Indicadores sobre las fichas: completitud (puntuación interna), altas, actualizaciones y validación.",
  },
  adminSiteInsightsDisclaimer: {
    fr: "Ces données proviennent des événements enregistrés dans Firestore (pas un équivalent complet de Google Analytics). Pour le temps passé, entonnoirs et trafic détaillé, branchez plutôt GA4 ou Vercel Analytics.",
    es: "Estos datos vienen de eventos en Firestore (no sustituyen a Google Analytics). Para tiempo en página, embudos y tráfico fino, usa GA4 o Vercel Analytics.",
  },
  adminStatAvgCompletion: { fr: "Complétude moyenne", es: "Completitud media" },
  adminStatMedianCompletion: { fr: "Complétude médiane", es: "Completitud mediana" },
  adminStatProfileScoreHint: {
    fr: "Score interne (champs clés du profil)",
    es: "Puntuación interna (campos clave)",
  },
  adminStatValidated: { fr: "Profils validés", es: "Perfiles validados" },
  adminStatPendingReview: { fr: "En attente / non validés", es: "Pendientes / no validados" },
  adminStatNewRegistrations: { fr: "Nouvelles inscriptions", es: "Nuevos registros" },
  adminStatProfilesUpdated: { fr: "Profils mis à jour", es: "Perfiles actualizados" },
  adminStatNeverEdited: { fr: "Jamais réédités", es: "Sin reedición" },
  adminStatNeverEditedHint: {
    fr: "Création ≈ dernière maj (1 min)",
    es: "Creación ≈ última act. (1 min)",
  },
  adminStatContactFilled: { fr: "Au moins 1 contact", es: "Al menos 1 contacto" },
  adminStatContactFilledHint: {
    fr: "Email, LinkedIn ou WhatsApp renseigné",
    es: "Email, LinkedIn o WhatsApp informado",
  },
  adminChartCompletionBuckets: { fr: "Répartition du score de complétude", es: "Distribución del score" },
  adminChartCompletionBucketsHint: {
    fr: "Basé sur les champs utilisés pour les recommandations.",
    es: "Según los campos usados para recomendaciones.",
  },
  adminChartRegistrationsByDay: { fr: "Inscriptions par jour", es: "Altas por día" },
  adminChartRegistrationsCumulative: { fr: "Inscriptions cumulées", es: "Altas acumuladas" },
  adminLegendProfiles: { fr: "Profils", es: "Perfiles" },
  adminLegendRegistrations: { fr: "Inscriptions", es: "Altas" },
  adminStatSpaViews: { fr: "Vues de pages (SPA)", es: "Vistas de página (SPA)" },
  adminStatProfileViews: { fr: "Ouvertures de fiche", es: "Aperturas de ficha" },
  adminStatProfileViewsHint: {
    fr: "Membres connectés uniquement",
    es: "Solo miembros conectados",
  },
  adminStatContactClicks: { fr: "Clics contact", es: "Clics de contacto" },
  adminStatSearchEvents: { fr: "Recherche & filtres", es: "Búsqueda y filtros" },
  adminStatSearchFilterHint: { fr: "Si instrumentés dans l’app", es: "Si están instrumentados" },
  adminChartTopRoutes: { fr: "Pages vues (top)", es: "Páginas vistas (top)" },
  adminChartTopRoutesHint: {
    fr: "Routes enregistrées (visiteurs anonymes ou connectés selon la règle).",
    es: "Rutas registradas (anon. o con sesión según reglas).",
  },
  adminChartEventTypes: { fr: "Volume par type d’événement", es: "Volumen por tipo de evento" },
  adminLegendViews: { fr: "Vues", es: "Vistas" },
  welcome: {
    fr: "Bienvenue dans l'annuaire de la communauté d'affaires francophone de Guadalajara.",
    es: "Bienvenido al directorio de la comunidad de negocios francohablante de Guadalajara.",
  },
  welcomeIntro: {
    fr: "Découvrez les entreprises et membres déjà inscrits, filtrez par secteur, profil ou localisation, puis explorez les premiers profils suggérés. Invitez votre réseau à rejoindre la plateforme pour accélérer vos connexions à Guadalajara.",
    es: "Descubre empresas y miembros ya inscritos, filtra por sector, tipo de perfil o ubicación y explora las primeras fichas sugeridas. Invita a tu red a unirse a la plataforma para acelerar tus conexiones en Guadalajara.",
  },
  welcomeIntroShow: {
    fr: "Afficher l'introduction",
    es: "Mostrar la introducción",
  },
  welcomeIntroHide: {
    fr: "Réduire l'introduction",
    es: "Ocultar la introducción",
  },
  funFactIntroShow: {
    fr: 'Afficher le fun fact',
    es: 'Mostrar el fun fact',
  },
  funFactIntroHide: {
    fr: 'Réduire le fun fact',
    es: 'Ocultar el fun fact',
  },
  noProfile: { fr: "Vous n'avez pas encore de profil. Veuillez en créer un pour apparaître dans l'annuaire.", es: "Aún no tienes un perfil. Por favor, crea uno para aparecer en el directorio." },
  edit: { fr: "Modifier", es: "Editar" },
  editProfile: { fr: "Modifier mon profil", es: "Editar mi perfil" },
  /** CTA accueil (membre connecté) → liste des demandes réseau. */
  homeViewRequestsCta: { fr: 'Voir les demandes', es: 'Ver las solicitudes' },
  /** CTA accueil → annuaire / réseau. */
  homeExploreNetworkCta: { fr: 'Explorer le réseau', es: 'Explorar la red' },
  loading: { fr: "Chargement...", es: "Cargando..." },
  deleteProfile: { fr: "Supprimer mon profil", es: "Eliminar mi perfil" },
  confirmDelete: { fr: "Êtes-vous sûr de vouloir supprimer ce profil ? Cette action est irréversible.", es: "¿Seguro que quieres eliminar este perfil? Esta acción no se puede deshacer." },
  profileFormDangerZoneLabel: { fr: 'Zone de danger', es: 'Zona de peligro' },
  profileFormDeleteOwnConfirm: {
    fr: "Êtes-vous sûr de vouloir supprimer votre profil ? Cette action est irréversible.",
    es: '¿Seguro que quieres eliminar tu perfil? Esta acción no se puede deshacer.',
  },
  delete: { fr: "Supprimer", es: "Eliminar" },
  allIndustries: { fr: "Toutes les industries", es: "Todas las industrias" },
  filterSectorHint: {
    fr: "Affinez la liste des profils par secteur (même filtre que dans la colonne de gauche).",
    es: "Refina la lista de perfiles por sector (mismo filtro que en la columna izquierda)."
  },
  companySize: {
    fr: "Taille de l'entreprise (en nbr d'employés)",
    es: "Tamaño de la empresa (n.º de empleados)",
  },
  yearsInMexicoRange: { fr: "Années au Mexique", es: "Años en México" },
  any: { fr: "Tous", es: "Todos" },
  small: { fr: "Petite (1-10)", es: "Pequeña (1-10)" },
  medium: { fr: "Moyenne (11-50)", es: "Mediana (11-50)" },
  large: { fr: "Grande (51+)", es: "Grande (51+)" },
  newcomer: { fr: "Nouveau (< 2 ans)", es: "Recién llegado (< 2 años)" },
  established: { fr: "Établi (2-10 ans)", es: "Establecido (2-10 años)" },
  veteran: { fr: "Vétéran (10+ ans)", es: "Veterano (10+ años)" },
  adminActions: { fr: "Actions Administrateur", es: "Acciones de Administrador" },
  editUser: { fr: "Modifier l'utilisateur", es: "Editar usuario" },
  deleteUser: { fr: "Supprimer l'utilisateur", es: "Eliminar usuario" },
  stats: { fr: "Statistiques", es: "Estadísticas" },
  memberCount: { fr: "Nombre de membres", es: "Total de miembros" },
  newThisWeek: { fr: "Nouveaux inscrits (7j)", es: "Nuevos registros (últimos 7 días)" },
  lastRegistrants: { fr: "Derniers inscrits", es: "Últimos registros" },
  showLastRegistrants: { fr: "Afficher les derniers inscrits", es: "Ver los últimos registros" },
  seeMore: { fr: "Voir plus", es: "Ver más" },
  cardBioSeeLess: { fr: "Voir moins", es: "Ver menos" },
  cardContactByEmail: { fr: "Contacter par email", es: "Contactar por email" },
  cardContactByWhatsapp: { fr: "Contacter sur WhatsApp", es: "Contactar por WhatsApp" },
  pendingValidation: { fr: "Profil en attente de validation", es: "Perfil pendiente de validación" },
  validationMessage: { fr: "Votre profil doit être validé par un administrateur pour accéder à toutes les informations de l'annuaire.", es: "Tu perfil debe ser validado por un administrador para acceder a toda la información del directorio." },
  profileFormRequiredLegend: {
    fr: 'Les champs suivis d’une astérisque (*) sont obligatoires pour la validation de votre fiche par l’équipe.',
    es: 'Los campos con asterisco (*) son obligatorios para que el equipo valide tu ficha.',
  },
  profileFormDraftLocalHint: {
    fr: 'Votre saisie est mémorisée temporairement sur cet appareil (session du navigateur, jusqu’à 7 jours). Si la page se recharge avant l’enregistrement, le formulaire peut être rechargé sans tout recommencer.',
    es: 'Lo que escribes se guarda temporalmente en este dispositivo (sesión del navegador, hasta 7 días). Si la página se recarga antes de guardar, el formulario puede recuperarse sin empezar de cero.',
  },
  /** Sous-titres de groupe dans le formulaire profil (création société vs effectifs). */
  profileFormSubsectionEntreprise: { fr: 'Entreprise', es: 'Empresa' },
  profileFormSubsectionRH: {
    fr: 'Ressources humaines',
    es: 'Recursos humanos',
  },
  profileFormSectionIdentity: { fr: 'Identité', es: 'Identidad' },
  profileFormSubContact: { fr: 'Contact', es: 'Contacto' },
  profileFormSubLanguages: { fr: 'Langues', es: 'Idiomas' },
  profileFormSubBio: { fr: 'Bio', es: 'Bio' },
  profileFormSectionPhotoVisual: {
    fr: 'Photo et présence visuelle',
    es: 'Foto y presencia visual',
  },
  profileFormPhotoVisualIntro: {
    fr: 'Ajoutez votre lien LinkedIn pour renforcer la crédibilité de votre fiche. Si vous disposez d’une URL directe d’image publique, vous pouvez aussi l’utiliser comme photo. Sinon, votre profil sera affiché avec un avatar professionnel basé sur vos initiales.',
    es: 'Añade tu enlace de LinkedIn para reforzar la credibilidad de tu ficha. Si tienes una URL directa de imagen pública, también puedes usarla como foto. Si no, tu perfil se mostrará con un avatar profesional basado en tus iniciales.',
  },
  profileFormPhotoNoHostingNote: {
    fr: 'Les photos LinkedIn ne sont pas toujours accessibles en dehors de LinkedIn. La plateforme n’héberge pas d’image.',
    es: 'Las fotos de LinkedIn no siempre son accesibles fuera de LinkedIn. La plataforma no aloja imágenes.',
  },
  profileFormPhotoCredibilityNote: {
    fr: 'Votre lien LinkedIn reste le principal signal de crédibilité. La photo est optionnelle.',
    es: 'Tu enlace de LinkedIn sigue siendo la principal señal de credibilidad. La foto es opcional.',
  },
  profileFormPhotoPublicUrlLabel: {
    fr: 'URL directe de photo publique (optionnel)',
    es: 'URL directa de foto pública (opcional)',
  },
  /** Regroupement formulaire profil : la personne (contact, langues, etc.). */
  profileFormSectionPerson: {
    fr: 'Vous et vos coordonnées',
    es: 'Tú y tus datos de contacto',
  },
  profileFormSectionPassions: {
    fr: 'Passions et loisirs',
    es: 'Pasiones y aficiones',
  },
  profileFormSectionCompanyActivity: {
    fr: 'Société et implantation',
    es: 'Empresa e implantación',
  },
  profileFormSectionNeedsKeywords: {
    fr: 'Besoins, canal, mots-clés',
    es: 'Necesidades, canal, palabras clave',
  },
  profileFormPhoneCountryLabel: { fr: 'Indicatif', es: 'Prefijo país' },
  profileFormPhoneLocalLabel: { fr: 'Téléphone / WhatsApp', es: 'Teléfono / WhatsApp' },
  profileFormPhoneLocalHint: {
    fr: 'Numéro sans répéter l’indicatif (chiffres uniquement).',
    es: 'Número sin repetir el prefijo (solo dígitos).',
  },
  profileFormAddCompanyActivity: {
    fr: 'Ajouter une entreprise ou une activité',
    es: 'Añadir una empresa o actividad',
  },
  profileFormCompanyActivityBlockTitle: {
    fr: 'Entreprise ou activité',
    es: 'Empresa o actividad',
  },
  profileFormRemoveCompanyActivity: {
    fr: 'Retirer cette activité',
    es: 'Quitar esta actividad',
  },
  profileFormCompanyActivityMinOne: {
    fr: 'Au moins une entreprise ou activité avec un nom est requise.',
    es: 'Se requiere al menos una empresa o actividad con nombre.',
  },
  profileFormActivityDescriptionLabel: {
    fr: 'Description de l’activité',
    es: 'Descripción de la actividad',
  },
  profileFormActivityDescriptionHint: {
    fr: 'Minimum 15 caractères pour chaque entreprise nommée. Sert surtout à la recherche par société.',
    es: 'Mínimo 15 caracteres por cada empresa indicada. Sirve sobre todo para la búsqueda por empresa.',
  },
  profileFormMemberBioHint: {
    fr: 'Présentez votre parcours et votre valeur pour le réseau.',
    es: 'Mínimo 15 caracteres. Presentación personal, destacada en la búsqueda por miembro.',
  },
  profileActivityToggleExpand: { fr: 'Afficher le détail', es: 'Mostrar detalle' },
  profileActivityToggleCollapse: { fr: 'Masquer le détail', es: 'Ocultar detalle' },
  /** Sous le champ pays (formulaire identité) — court, pour aligner la grille. */
  profileFormCountryFootnote: {
    fr: "Pays d'implantation ou de résidence.",
    es: 'País de implantación o residencia.',
  },
  profileFormSectionCore: {
    fr: 'Ce que vous cherchez et ce que vous pouvez apporter',
    es: 'Lo que buscas y lo que puedes aportar',
  },
  profileFormRecommendPriorityBannerTitle: {
    fr: 'Section prioritaire pour être recommandé',
    es: 'Sección prioritaria para aparecer en recomendaciones',
  },
  profileFormRecommendPriorityBannerBody: {
    fr: 'Ces informations sont les plus importantes pour faire apparaître votre profil lorsqu’un autre membre exprime un besoin. Plus vos besoins, votre aide possible et vos mots-clés sont précis, plus la plateforme peut générer des mises en relation utiles et des leads sérieux.',
    es: 'Esta información es clave para que tu perfil aparezca cuando otro miembro expresa una necesidad. Cuanto más precisos sean tus necesidades, tu oferta de ayuda y tus palabras clave, más útiles serán los contactos y oportunidades generadas.',
  },
  /** Pied de section matching (formulaire profil). */
  profileFormMatchingFieldsFooter: {
    fr: 'Ces champs renforcent votre visibilité dans les recommandations automatiques.',
    es: 'Estos campos refuerzan tu visibilidad en las recomendaciones automáticas.',
  },
  /** Bandeau complétion : nuance « utile pour les reco » vs simple complétion. */
  profileFormMatchingRecommendationsNote: {
    fr: 'Compléter votre profil est une chose ; renseigner la section ci-dessous le rend surtout utile pour les recommandations automatiques et les sollicitations pertinentes.',
    es: 'Completar el perfil es un paso; la sección de oportunidades y matching es la que más ayuda a activar recomendaciones y contactos pertinentes.',
  },
  profileFormSectionCompanyDetails: {
    fr: "Détails de l'entreprise",
    es: 'Detalles de la empresa',
  },
  /** Sous-titre sous le titre de section « Détails de l'entreprise » (formulaire profil). */
  profileFormCompanyDetailsIntro: {
    fr: 'Ces informations servent uniquement à nos statistiques internes.',
    es: 'Esta información solo se usa para nuestras estadísticas internas.',
  },
  profileFormCompanyType: { fr: "Type d'entreprise", es: 'Tipo de empresa' },
  profileFormProfessionalStatus: {
    fr: 'Statut',
    es: 'Estatus profesional',
  },
  /** Court texte sous le libellé « année d'arrivée » (formulaire profil). */
  profileFormArrivalRegionHint: {
    fr: 'Permet d’estimer votre ancienneté locale.',
    es: 'Sirve para estimar la antigüedad en la región.',
  },
  profileFormSectionAbout: { fr: 'À propos de vous', es: 'Sobre ti' },
  profileFormProfilePhotoLabel: {
    fr: 'URL directe de photo publique (optionnel)',
    es: 'URL directa de foto pública (opcional)',
  },
  profileFormSectionVisibility: {
    fr: 'Visibilité & réseau',
    es: 'Visibilidad y red',
  },
  profileFormSectionUnpublished: {
    fr: 'Données non publiées',
    es: 'Datos no publicados',
  },
  /** Sous le titre de section « Données non publiées » (formulaire profil). */
  profileFormUnpublishedIntro: {
    fr: "Ces champs servent à des statistiques internes. Ils ne sont jamais affichés sur l'annuaire public.",
    es: 'Estos campos sirven para estadísticas internas. Nunca se muestran en el directorio público.',
  },
  profileBannerMandatory: {
    fr: 'Merci de mettre à jour votre profil avec les nouveaux champs obligatoires (marqués *) pour permettre sa validation.',
    es: 'Actualiza tu perfil con los nuevos campos obligatorios (marcados con *) para poder validarlo.',
  },
  profileBannerAi: {
    fr: 'Pensez à optimiser votre profil en complétant les champs utiles au matching IA (secteur, besoins, bio, fonction, passions).',
    es: 'Optimiza tu perfil completando los campos útiles para el emparejamiento por IA (sector, necesidades, bio, función, pasiones).',
  },
  profileBannerDismiss: { fr: 'Masquer pour cette session', es: 'Ocultar esta sesión' },
  profileCoachPrefix: {
    fr: 'Conseil : complétez notamment',
    es: 'Consejo: complete sobre todo',
  },
  profileCoachSeparator: { fr: ' · ', es: ' · ' },
  profileCoachMoreSuffix: { fr: '…', es: '…' },
  profileCoachAllGood: {
    fr: 'Votre fiche est bien renseignée. Vous pouvez encore affiner la bio ou vos préférences de contact pour plus de réponses.',
    es: 'Tu ficha está bien completa. Aún puedes afinar la bio o tus preferencias de contacto para más respuestas.',
  },
  coachGapHighlightedNeeds: {
    fr: 'au moins un besoin mis en avant',
    es: 'al menos una necesidad destacada',
  },
  coachGapKeywordsPassions: {
    fr: 'au moins une passion',
    es: 'al menos una pasión',
  },
  profileCoachAiHint: {
    fr: 'Une suggestion IA par session (aucune nouvelle requête tant que votre profil ne change pas).',
    es: 'Una sugerencia IA por sesión (sin nuevas peticiones mientras tu perfil no cambie).',
  },
  newProfiles: { fr: "Nouveaux Profils", es: "Nuevos Perfiles" },
  validate: { fr: "Valider", es: "Validar" },
  /** Visible uniquement par les administrateurs (annuaire). */
  adminLastSeenLabel: {
    fr: 'Dernière connexion',
    es: 'Última conexión',
  },
  adminLastSeenUnknown: {
    fr: 'Non enregistrée',
    es: 'No registrada',
  },
  reject: { fr: "Rejeter", es: "Rechazar" },
  noPendingProfiles: { fr: "Aucun profil en attente de validation", es: "No hay perfiles pendientes de validación" },
  adminOAuthLeadsTitle: {
    fr: "Connexions OAuth (sans fiche)",
    es: "Conexiones OAuth (sin ficha)",
  },
  adminOAuthLeadsSubtitle: {
    fr: "E-mails et fournisseurs pour relancer les personnes connectées qui n’ont pas encore créé leur fiche annuaire.",
    es: "Correos y proveedores para dar seguimiento a quienes iniciaron sesión sin crear su ficha.",
  },
  adminOAuthLeadsEmpty: { fr: "Aucune connexion enregistrée.", es: "No hay conexiones registradas." },
  adminOAuthLeadsHasProfile: { fr: "Fiche annuaire", es: "Ficha en el directorio" },
  adminOAuthLeadsNoProfile: { fr: "Pas de fiche", es: "Sin ficha" },
  adminOAuthLeadsLastSeen: { fr: "Dernière connexion", es: "Última conexión" },
  adminOAuthLeadsFirstSeen: { fr: "Première connexion", es: "Primera conexión" },
  adminOAuthLeadsProvider: { fr: "Fournisseur", es: "Proveedor" },
  adminOAuthLeadsEmailVerified: { fr: "e-mail vérifié", es: "correo verificado" },
  guestOverlayTitle: {
    fr: "Profil complet réservé aux membres inscrits",
    es: "Perfil completo reservado a miembros registrados",
  },
  guestJoinCta: {
    fr: "Rejoindre l'annuaire",
    es: "Unirse al directorio",
  },
  /** Page dédiée partageable : inscription sans passer par la landing. */
  signupPageTitle: {
    fr: 'Créer votre accès à l’annuaire',
    es: 'Crea tu acceso al directorio',
  },
  signupPageSubtitle: {
    fr: 'Quelques secondes avec Google, LinkedIn ou e-mail — puis vous compléterez votre fiche à votre rythme.',
    es: 'Unos segundos con Google, LinkedIn o correo; luego completas tu ficha con calma.',
  },
  signupPageOpenAuth: {
    fr: 'S’inscrire ou se connecter',
    es: 'Registrarse o iniciar sesión',
  },
  signupPageHint: {
    fr: 'Gratuit · Communauté francophone · Guadalajara',
    es: 'Gratis · Comunidad francófona · Guadalajara',
  },
  signupPageBrowseFullSite: {
    fr: 'Voir le site et l’annuaire d’abord',
    es: 'Ver el sitio y el directorio primero',
  },
  signupPageDocumentTitle: {
    fr: 'Inscription',
    es: 'Registro',
  },
  signupPageMetaDescription: {
    fr: 'Rejoignez l’annuaire des affaires : inscription rapide, sans parcourir tout le site.',
    es: 'Únete al directorio de negocios: registro rápido, sin recorrer todo el sitio.',
  },
  signupPageShareLinkLabel: {
    fr: 'Lien à partager',
    es: 'Enlace para compartir',
  },
  signupPageCopyJoinLink: {
    fr: 'Copier',
    es: 'Copiar',
  },
  signupPageJoinLinkCopied: {
    fr: 'Lien copié',
    es: 'Enlace copiado',
  },
  whyJoinEyebrow: { fr: 'Pourquoi rejoindre', es: 'Por qué unirse' },
  whyJoinTitle: {
    fr: 'Une communauté utile avant d’être volumique',
    es: 'Una comunidad útil antes de ser masiva',
  },
  whyJoinDescription: {
    fr: 'L’Annuaire d’Affaires de Guadalajara aide les professionnels francophones à Guadalajara à trouver rapidement les bons contacts, à mieux se recommander et à faire émerger des opportunités concrètes.',
    es: 'El directorio ayuda a los profesionales francófonos en Guadalajara a encontrar rápidamente los contactos adecuados, recomendarse mejor y generar oportunidades concretas.',
  },
  whyJoinItem1Title: { fr: 'Trouver les bons contacts', es: 'Encontrar a las personas correctas' },
  whyJoinItem1Description: {
    fr: 'Identifiez rapidement un membre, une entreprise ou un besoin lié à votre activité.',
    es: 'Identifica rápidamente un miembro, una empresa o una necesidad relacionada con tu actividad.',
  },
  whyJoinItem2Title: { fr: 'Être recommandé plus facilement', es: 'Ser recomendado con más facilidad' },
  whyJoinItem2Description: {
    fr: 'Un profil clair permet aux autres de comprendre en quelques secondes qui vous êtes et comment vous aider.',
    es: 'Un perfil claro ayuda a los demás a entender en segundos quién eres y cómo pueden ayudarte.',
  },
  whyJoinItem3Title: { fr: 'Accéder à des demandes ciblées', es: 'Acceder a oportunidades específicas' },
  whyJoinItem3Description: {
    fr: 'Partenaires, clients, experts locaux, besoins du réseau : la plateforme structure les connexions utiles.',
    es: 'Socios, clientes, expertos locales y necesidades de la red: la plataforma estructura conexiones valiosas.',
  },
  first50Eyebrow: { fr: 'Communauté en lancement', es: 'Comunidad en lanzamiento' },
  first50Title: {
    fr: 'Construisons les 50 premiers profils de référence',
    es: 'Construyamos los primeros 50 perfiles de referencia',
  },
  first50Description: {
    fr: 'Chaque nouveau membre renforce la valeur du réseau pour tous : recommandations, demandes ciblées, connexions et opportunités à Guadalajara.',
    es: 'Cada nuevo miembro refuerza el valor de la red para todos: recomendaciones, solicitudes específicas, conexiones y oportunidades en Guadalajara.',
  },
  first50ProgressLabel: { fr: 'Progression', es: 'Progreso' },
  first50Subline: {
    fr: 'Rejoignez les premiers membres et aidez-nous à atteindre une masse critique utile.',
    es: 'Únete a los primeros miembros y ayúdanos a alcanzar una masa crítica útil.',
  },
  first50InviteCta: {
    fr: 'Inviter mon réseau',
    es: 'Invitar a mi red',
  },
  first50ValueLine: {
    fr: 'Chaque nouveau profil augmente la valeur du réseau',
    es: 'Cada nuevo perfil aumenta el valor de la red',
  },
  sectorsProofEyebrow: { fr: 'Déjà présents dans le réseau', es: 'Ya presentes en la red' },
  sectorsProofTitle: {
    fr: 'Des profils issus de plusieurs secteurs clés',
    es: 'Perfiles de varios sectores clave',
  },
  sectorsProofDescription: {
    fr: 'Le réseau se structure déjà autour d’entreprises, d’experts et de décideurs actifs dans différents univers professionnels.',
    es: 'La red ya se está estructurando alrededor de empresas, expertos y tomadores de decisión activos en distintos sectores.',
  },
  onboardingIntroTitle: {
    fr: 'Crée un profil simple maintenant, complète-le ensuite.',
    es: 'Crea un perfil simple ahora y complétalo después.',
  },
  onboardingIntroDescription: {
    fr: 'L’objectif est d’abord de te rendre visible dans la communauté. Tu peux enrichir ton profil à tout moment pour améliorer la qualité des mises en relation.',
    es: 'Primero buscamos hacerte visible dentro de la comunidad. Luego podrás enriquecer tu perfil para mejorar la calidad de las conexiones.',
  },
  onboardingIntroStep1: {
    fr: 'Renseigne les informations essentielles.',
    es: 'Completa la información esencial.',
  },
  onboardingIntroStep2: {
    fr: 'Ajoute ce que tu cherches et ce que tu peux apporter.',
    es: 'Agrega lo que buscas y en qué puedes ayudar.',
  },
  onboardingIntroStep3: {
    fr: 'Complète le reste plus tard selon ton temps.',
    es: 'Completa el resto más adelante según tu tiempo.',
  },
  profileCompletionEyebrow: { fr: 'Visibilité du profil', es: 'Visibilidad del perfil' },
  profileCompletionTitle: {
    fr: 'Profil complété à {{percent}}%',
    es: 'Perfil completado al {{percent}}%',
  },
  profileCompletionDescription: {
    fr: 'Complète en priorité les champs les plus utiles pour être trouvé et recommandé dans l’annuaire.',
    es: 'Completa primero los campos más útiles para que te encuentren y te recomienden dentro del directorio.',
  },
  profileCompletionProgressShort: { fr: 'complété', es: 'completado' },
  profileCompletionNextBestActions: {
    fr: 'Les prochains champs à compléter',
    es: 'Siguientes campos por completar',
  },
  profileCompletionCompleteNow: { fr: 'Compléter', es: 'Completar' },
  guestInterstitialHeadline: {
    fr: "{{count}} autre(s) membre(s) dans l'annuaire",
    es: "{{count}} miembro(s) más en el directorio",
  },
  guestInterstitialBody: {
    fr: "Créez votre profil gratuitement pour accéder à toutes les fiches et aux coordonnées.",
    es: "Crea tu perfil gratis para acceder a todas las fichas y a los datos de contacto.",
  },
  guestInterstitialCta: { fr: "Rejoindre la communauté", es: "Unirse a la comunidad" },
  guestInterstitialFinePrint: {
    fr: "Gratuit · Communauté francophone · Guadalajara",
    es: "Gratis · Comunidad francófona · Guadalajara",
  },
  bio: { fr: "Bio (personne)", es: "Bio (persona)" },
  memberBio: { fr: "Bio", es: "Bio" },
  activityDescription: {
    fr: "Description de l’activité (entreprise)",
    es: "Descripción de la actividad (empresa)",
  },
  companyDescription: {
    fr: "Description de l'entreprise",
    es: "Descripción de la empresa",
  },
  needsSought: {
    fr: "Besoins recherchés",
    es: "Necesidades que busca",
  },
  noCompanyDescription: {
    fr: "Aucune description renseignée.",
    es: "Sin descripción.",
  },
  noNeedsSpecified: {
    fr: "Aucun besoin précisé pour le moment.",
    es: "Sin necesidades especificadas por ahora.",
  },
  memberCardEmptyNeeds: {
    fr: 'Profil en cours d’enrichissement — les besoins seront précisés prochainement.',
    es: 'Perfil en proceso de enriquecimiento: las necesidades se detallarán próximamente.',
  },
  memberCardEmptyHelp: {
    fr: 'Cette section sera enrichie prochainement.',
    es: 'Esta sección se completará próximamente.',
  },
  memberCardEmptyGeneric: {
    fr: 'Profil en cours d’enrichissement.',
    es: 'Perfil en proceso de enriquecimiento.',
  },
  /** Affichage des mots-clés (même champ Firestore `targetSectors`) */
  targetSectors: {
    fr: "Mots-clés (industrie, domaine, zone…)",
    es: "Palabras clave (industria, ámbito, zona…)",
  },
  targetSectorsOptional: { fr: "(facultatif)", es: "(opcional)" },
  needKeywordsHint: {
    fr: 'Ajoutez des mots-clés précis pour être trouvé plus facilement et apparaître dans les bons matchs (jusqu’à 20, séparés par des virgules).',
    es: 'Añade palabras clave precisas para que te encuentren y aparezcas en los mejores emparejamientos (hasta 20, separadas por comas).',
  },
  /** Libellé court du champ mots-clés (formulaire « À propos »). */
  profileFormAboutKeywordsLabel: { fr: 'Mots-clés', es: 'Palabras clave' },
  needKeywordsPlaceholder: {
    fr: "Ex. fournisseurs automotive, Jalisco, export France…",
    es: "Ej. proveedores automotriz, Jalisco, exportación Francia…",
  },
  profileHelpNewcomersLabel: {
    fr: 'Je peux aider sur',
    es: "Puedo ayudar en…",
  },
  profileHelpNewcomersHint: {
    fr: 'Expliquez concrètement ce que vous pouvez apporter à d’autres membres : expertise, réseau, accès marché, partenaires, financement, conseil.',
    es: 'Explica de forma concreta qué puedes aportar: experiencia, red, acceso al mercado, socios, financiamiento, asesoría.',
  },
  profileHelpNewcomersPlaceholder: {
    fr: 'Ex : installation à Guadalajara, réseau F&B, mise en relation locale...',
    es: 'Ej: instalación en Guadalajara, red F&B, conexiones locales...',
  },
  profileNetworkGoalLabel: {
    fr: 'Je recherche',
    es: 'Lo que busco a través de esta red',
  },
  profileNetworkGoalHint: {
    fr: 'Décrivez en une phrase le type d’opportunité, de contact ou de soutien que vous cherchez réellement dans le réseau.',
    es: 'Describe en una frase el tipo de oportunidad, contacto o apoyo que buscas realmente en la red.',
  },
  profileNetworkGoalPlaceholder: {
    fr: 'Ex : Développer ma clientèle B2B à Guadalajara, trouver un partenaire local...',
    es: 'Ej: desarrollar mi cartera B2B en Guadalajara, encontrar un socio local...',
  },
  keywordsTopRadar: {
    fr: "Mots-clés les plus cités",
    es: "Palabras clave más citadas",
  },
  /** Libellé court (tuile stats radar) */
  keywordsUniqueStat: {
    fr: "Mots-clés uniques",
    es: "Palabras clave únicas",
  },
  accountType: { fr: "Type de compte", es: "Tipo de cuenta" },
  local: { fr: "Local (Guadalajara)", es: "Local (Guadalajara)" },
  foreign: { fr: "Étranger / Visiteur", es: "Extranjero / Visitante" },
  urgentNeeds: { fr: "Besoins Urgents", es: "Necesidades Urgentes" },
  aiTranslationDisclaimer: {
    fr: 'Traduction générée automatiquement par IA.',
    es: 'Traducción generada automáticamente por IA.',
  },
  radar: { fr: "Radar Guadalajara", es: "Radar Guadalajara" },
  radarTitle: {
    fr: "Radar du réseau",
    es: "Radar de la red",
  },
  /** Libellé court pour l’onglet du listing (vs. titre long du bloc radar). */
  directoryTabRadar: {
    fr: "Radar",
    es: "Radar",
  },
  radarSubtitle: {
    fr: "Données en temps réel sur les besoins et l'activité de la communauté francophone à Guadalajara.",
    es: "Datos en tiempo real sobre las necesidades y la actividad de la comunidad francófona en Guadalajara.",
  },
  radarLive: {
    fr: "Mis à jour en temps réel",
    es: "Actualizado en tiempo real",
  },
  kpiMembers: { fr: "Membres", es: "Miembros" },
  radarMembersThisWeek: {
    fr: "{count} enregistrés cette semaine",
    es: "{count} registrados esta semana",
  },
  kpiNeeds: { fr: "Besoins", es: "Necesidades" },
  kpiSectors: { fr: "Secteurs", es: "Sectores" },
  chartSectorsTitle: { fr: "Secteurs représentés", es: "Sectores representados" },
  chartSectorsEmpty: {
    fr: "Le graphique s'enrichira avec de nouveaux membres.",
    es: "El gráfico se enriquecerá con nuevos miembros.",
  },
  chartNeedsTitle: { fr: "Top besoins du réseau", es: "Principales necesidades de la red" },
  chartPassionsTitle: { fr: "Passions du réseau", es: "Pasiones de la red" },
  chartPassionsEmpty: {
    fr: "Aucune passion renseignée.",
    es: "Ninguna pasión indicada.",
  },
  chartCenter: { fr: "membres", es: "miembros" },
  radarLockedMessage: {
    fr: "Données du radar disponibles après inscription : connectez-vous et enregistrez votre fiche dans l’annuaire pour voir les statistiques et interactions.",
    es: "Los datos del radar están disponibles tras registrarte: inicia sesión y completa tu ficha en el directorio para ver estadísticas e interacciones.",
  },
  radarLockedCtaGuest: {
    fr: "Me connecter ou m’inscrire",
    es: "Iniciar sesión o registrarme",
  },
  radarLockedCtaProfile: {
    fr: "Compléter mon profil annuaire",
    es: "Completar mi perfil del directorio",
  },
  companies: { fr: "Entreprises", es: "Empresas" },
  members: { fr: "Membres", es: "Miembros" },
  membersPageTitle: { fr: "Annuaire des membres", es: "Directorio de miembros" },
  membersPageSubtitle: {
    fr: "Triez la liste, puis affinez avec secteur, lieu et recherche (colonne de gauche).",
    es: "Ordena la lista y refina con sector, lugar y búsqueda (columna izquierda).",
  },
  membersSortLabel: { fr: "Trier par", es: "Ordenar por" },
  membersSortOptionRecent: { fr: "Plus récents en premier", es: "Más recientes primero" },
  membersSortOptionAlphabetical: {
    fr: "Ordre alphabétique (nom)",
    es: "Orden alfabético (nombre)",
  },
  membersSortOptionDefault: { fr: "Ordre par défaut", es: "Orden predeterminado" },
  /** @deprecated Libellé d’onglet : utiliser `radarTitle`. Conservé pour rétrocompatibilité éventuelle. */
  activities: { fr: "Secteurs", es: "Sectores" },
  recommendedForYou: { fr: "Recommandé pour vous", es: "Recomendado para ti" },
  aiRecCompleteProfile: {
    fr: "Complétez votre profil (≥ 80 % des champs clés : secteur, besoins, mots-clés, bio, etc.) pour activer les recommandations IA.",
    es: "Completa tu perfil (≥ 80 % de campos clave: sector, necesidades, palabras clave, bio, etc.) para activar las recomendaciones IA.",
  },
  aiRecFewMembers: {
    fr: "Il faut au moins 3 autres membres dans l’annuaire pour générer des suggestions. Revenez bientôt.",
    es: "Se necesitan al menos 3 miembros más en el directorio para generar sugerencias. Vuelve pronto.",
  },
  aiRecInviteEmptyBody: {
    fr: "Activez les recommandations personnalisées en invitant au moins 3 autres membres à rejoindre l’annuaire.",
    es: "Activa las recomendaciones personalizadas invitando al menos a 3 miembros más a unirse al directorio.",
  },
  aiRecInviteEmptyBenefit: {
    fr: "Plus vous invitez de contacts, plus les mises en relation proposées seront pertinentes pour votre activité.",
    es: "Cuantos más contactos invites, más relevantes serán las conexiones propuestas para tu actividad.",
  },
  aiRecInviteCta: {
    fr: "Inviter 3 contacts pour activer les recommandations",
    es: "Invitar a 3 contactos para activar las recomendaciones",
  },
  aiRecUnavailable: {
    fr: "Les suggestions IA sont temporairement indisponibles. Réessayez dans un instant.",
    es: "Las sugerencias IA no están disponibles por ahora. Inténtalo de nuevo en un momento.",
  },
  aiRecNoSuggestions: {
    fr: "Aucune suggestion pour le moment. Réessayez plus tard ou élargissez votre réseau dans l’annuaire.",
    es: "No hay sugerencias por ahora. Inténtalo más tarde o amplía tu red en el directorio.",
  },
  aiRecRetry: { fr: "Réessayer", es: "Reintentar" },
  memberRequestsTitle: { fr: "Demandes du réseau", es: "Demandas de la red" },
  memberRequestsSubtitle: {
    fr: "Publiez ce que vous cherchez (partenaire, zone, produit…).",
    es: "Publica lo que buscas (socio, zona, producto…).",
  },
  memberRequestsPostCta: { fr: "Poster une demande", es: "Publicar una demanda" },
  memberRequestsEmpty: {
    fr: "Aucune demande pour le moment. Soyez le premier à en poster une.",
    es: "Ninguna demanda por ahora. Sé el primero en publicar una.",
  },
  memberRequestsModalTitle: { fr: "Nouvelle demande réseau", es: "Nueva demanda de red" },
  memberRequestsExpiresHint: {
    fr: "Votre demande reste visible 30 jours (puis disparaît de la liste).",
    es: "Tu demanda será visible 30 días (luego desaparece de la lista).",
  },
  memberRequestsTextLabel: { fr: "Description de votre besoin", es: "Descripción de tu necesidad" },
  memberRequestsTextPlaceholder: {
    fr: "Ex. distributeur alimentaire pour Jalisco, contact fournisseurs UE…",
    es: "Ej. distribuidor alimentario para Jalisco, contacto con proveedores UE…",
  },
  memberRequestsSectorLabel: { fr: "Secteur (optionnel)", es: "Sector (opcional)" },
  memberRequestsSectorOptional: { fr: "— Aucun —", es: "— Ninguno —" },
  memberRequestsZoneLabel: { fr: "Zones / marchés", es: "Zonas / mercados" },
  memberRequestsZonePlaceholder: { fr: "Ex. Jalisco, Mexique, UE…", es: "Ej. Jalisco, México, UE…" },
  memberRequestsProductLabel: { fr: "Produits et services", es: "Productos y servicios" },
  memberRequestsProductPlaceholder: {
    fr: "Ex. vins, équipements industriels…",
    es: "Ej. vinos, equipos industriales…",
  },
  memberRequestsSubmit: { fr: "Publier", es: "Publicar" },
  memberRequestNeedProfile: {
    fr: "Créez ou complétez votre fiche annuaire pour publier une demande.",
    es: "Crea o completa tu ficha en el directorio para publicar una demanda.",
  },
  memberRequestTextRequired: {
    fr: "Décrivez votre besoin (au moins quelques mots).",
    es: "Describe tu necesidad (al menos unas palabras).",
  },
  memberRequestTextTooLong: {
    fr: "Texte trop long (800 caractères maximum).",
    es: "Texto demasiado largo (máx. 800 caracteres).",
  },
  memberRequestZoneRequired: {
    fr: "Indiquez au moins une zone ou un marché ciblé.",
    es: "Indica al menos una zona o mercado objetivo.",
  },
  memberRequestProductRequired: {
    fr: "Indiquez le ou les produits / services concernés.",
    es: "Indica el o los productos / servicios implicados.",
  },
  memberRequestSubmitError: {
    fr: "Impossible de publier. Vérifiez votre connexion ou réessayez.",
    es: "No se pudo publicar. Comprueba la conexión o inténtalo de nuevo.",
  },
  memberRequestErrorPermissionDenied: {
    fr:
      "Firestore a refusé l’enregistrement. Dans la console Firebase, ouvrez la base « ai-studio-… » (pas seulement default), onglet Règles, puis en terminal : npm run firebase:deploy:rules. Vérifiez aussi que le nom du projet Firebase correspond à l’app.",
    es:
      "Firestore rechazó el guardado. En la consola de Firebase, abre la base « ai-studio-… » (no solo default), pestaña Reglas, y en terminal: npm run firebase:deploy:rules. Comprueba que el proyecto Firebase coincide con la app.",
  },
  memberRequestDeleteConfirm: {
    fr: "Supprimer cette demande ? Cette action est définitive.",
    es: "¿Eliminar esta demanda? Esta acción es definitiva.",
  },
  memberRequestDeleteAria: { fr: "Supprimer la demande", es: "Eliminar la demanda" },
  memberRequestRespondCta: { fr: "Contacter", es: "Contactar" },
  memberRequestRespondHint: {
    fr: "Ouvre la fiche pour voir les infos de contact.",
    es: "Abre la ficha para ver la información de contacto.",
  },
  memberRequestGuestUnlockHint: {
    fr: "Connectez-vous et créez votre profil pour voir les détails et répondre.",
    es: "Inicia sesión y crea tu perfil para ver los detalles y responder.",
  },
  postUrgentNeed: { fr: "Publier un besoin urgent", es: "Publicar necesidad urgente" },
  urgentPostSaving: { fr: "Enregistrement…", es: "Guardando…" },
  urgentPostSubmitErrorGeneric: {
    fr: "Impossible d’enregistrer l’annonce. Vérifiez votre connexion et réessayez.",
    es: "No se pudo guardar el anuncio. Comprueba la conexión e inténtalo de nuevo.",
  },
  urgentPostErrorPermissionDenied: {
    fr:
      "Enregistrement refusé par Firebase (droits / règles Firestore). Vous êtes connecté : déployez firestore.rules sur la même base que l’app (npm run firebase:deploy:rules) ou mettez à jour les règles dans la console.",
    es:
      "Firebase ha rechazado el guardado (reglas de Firestore). Estás conectado: despliega firestore.rules en la misma base que la app (npm run firebase:deploy:rules) o actualiza las reglas en la consola.",
  },
  urgentPostErrorNetwork: {
    fr: "Service temporairement indisponible ou connexion instable. Réessayez dans un instant.",
    es: "Servicio temporalmente no disponible o conexión inestable. Inténtalo de nuevo en un momento.",
  },
  urgentPostMustSignIn: {
    fr: "Connectez-vous pour publier une annonce.",
    es: "Inicia sesión para publicar un anuncio.",
  },
  urgentPostFormInvalid: {
    fr: "Renseignez la description et le secteur.",
    es: "Completa la descripción y el sector.",
  },
  /** Message HTML5 `setCustomValidity` (navigateur) — aligné sur la langue UI. */
  htmlValidationFillField: {
    fr: "Veuillez remplir ce champ.",
    es: "Por favor, complete este campo.",
  },
  contact: { fr: "Contacter", es: "Contactar" },
  contactLinks: { fr: "Contact & liens", es: "Contacto y enlaces" },
  contactPrefsTitle: {
    fr: 'Préférences de contact & collaboration',
    es: 'Preferencias de contacto y colaboración',
  },
  contactPrefsCtaLabel: {
    fr: 'Canal de contact préféré',
    es: 'Canal de contacto preferido',
  },
  contactPrefsCtaHint: {
    fr: 'Indiquez le canal le plus simple et le plus naturel pour vous joindre rapidement.',
    es: 'Indica el canal más simple y natural para localizarte con rapidez.',
  },
  contactPrefsCtaPlaceholder: {
    fr: 'Ex : WhatsApp, Email, LinkedIn',
    es: 'Ej: WhatsApp, Email, LinkedIn',
  },
  contactPrefsWorkingLangLabel: {
    fr: 'Langues de travail',
    es: 'Idiomas de trabajo (máx. 3)',
  },
  contactPrefsWorkingLangHint: {
    fr: 'Sélectionnez vos langues de travail prioritaires dans la région.',
    es: 'Elige tus idiomas de trabajo prioritarios en la región.',
  },
  contactPrefsWorkingLangTip: {
    fr: 'Gardez 2 à 3 langues réellement utilisées en business.',
    es: 'Consejo: deja solo tus 2–3 idiomas más usados en el negocio.',
  },
  contactPrefsClientSizeLabel: {
    fr: 'Taille de clients habituels',
    es: 'Tamaño habitual de clientes',
  },
  contactPrefsClientSizeHint: {
    fr: 'Cochez jusqu’à 3 tailles de clients avec lesquelles vous travaillez le plus souvent.',
    es: 'Marca hasta 3 tamaños de cliente con los que trabajas con más frecuencia.',
  },
  contactPrefsClientSizeEmpty: {
    fr: '— Choisir une ou plusieurs options —',
    es: '— Elegir una o varias opciones —',
  },
  contactPrefsClientSizeMaxHint: {
    fr: 'Maximum 3 tailles — décochez une option pour en ajouter une autre.',
    es: 'Máximo 3 tamaños: desmarca una opción para añadir otra.',
  },
  contactPrefsOpenToLabel: {
    fr: 'Ouvert à',
    es: 'Abierto a…',
  },
  contactPrefsOpenToHint: {
    fr: 'Indiquez à quoi vous êtes ouvert pour faire vivre la communauté.',
    es: 'Indica en qué estás abierto para animar la comunidad.',
  },
  contactPrefsOpenMentoring: {
    fr: 'Mentorat / partage d’expérience',
    es: 'Mentoría / compartir experiencia',
  },
  contactPrefsOpenTalks: {
    fr: 'Interventions / prises de parole',
    es: 'Intervenciones / ponencias',
  },
  contactPrefsOpenEvents: {
    fr: 'Co-organisation d’événements',
    es: 'Coorganización de eventos',
  },
  contactPrefsOpenEventSponsoring: {
    fr: 'Sponsoring d’événements',
    es: 'Patrocinio de eventos',
  },
  contactPrefsOpenEventSponsoringPrivateHint: {
    fr: 'Enregistré dans vos données non publiées (comme le genre et les délégations).',
    es: 'Se guarda en tus datos no publicados (como género y delegaciones).',
  },
  /** Titre court sur la fiche publique (sans mention 0–3). */
  profilePublicCurrentNeeds: {
    fr: "Besoins actuels",
    es: "Necesidades actuales",
  },
  profilePublicAboutTitle: { fr: "À propos", es: "Sobre ti" },
  highlightedNeedsTitle: {
    fr: 'Besoins actuels',
    es: "Necesidades actuales (0 a 3)",
  },
  highlightedNeedsOptional: { fr: "(facultatif)", es: "(opcional)" },
  highlightedNeedsHint: {
    fr: 'Choisissez jusqu’à 3 besoins prioritaires : ce sont eux qui déclenchent les mises en relation les plus pertinentes.',
    es: 'Elige hasta 3 necesidades prioritarias: son las que disparan las conexiones más pertinentes.',
  },
  highlightedNeedsCount: {
    fr: "sélectionné(s)",
    es: "seleccionados",
  },
  typedNeedsRadar: {
    fr: "Besoins structurés (réseau)",
    es: "Necesidades de la red",
  },
  typedNeedsRadarEmpty: {
    fr: "Aucun besoin structuré renseigné pour l’instant (champ facultatif, jusqu’à 3).",
    es: "Aún no hay necesidades estructuradas (opcional, hasta 3).",
  },
  filterByTypedNeed: {
    fr: "Filtré par besoin structuré :",
    es: "Filtrado por necesidad estructurada:",
  },
  passionsRadarNetwork: {
    fr: "Passions dans le réseau",
    es: "Pasiones en la red",
  },
  filterByPassion: {
    fr: "Filtré par passion :",
    es: "Filtrado por pasión:",
  },
  passionsRadarEmpty: {
    fr: "Aucune passion structurée renseignée pour l’instant. Complétez votre profil (max. 10).",
    es: "Aún no hay pasiones estructuradas. Completa tu perfil (máx. 10).",
  },
  dashboardTab: { fr: "Tableau de bord", es: "Panel" },
  vueTitle: { fr: "Vue d’ensemble de la communauté", es: "Vista general de la comunidad" },
  vueSubtitle: {
    fr: "Qui compose la communauté : secteurs, tailles d’entreprise, ancienneté, statuts.",
    es: "Quién forma parte de la comunidad: sectores, tamaños de empresa, antigüedad, estatus.",
  },
  cardMembersBySector: { fr: "Répartition par secteur", es: "Reparto por sector" },
  cardMembersBySize: {
    fr: "Répartition par taille d’entreprise",
    es: "Reparto por tamaño de empresa",
  },
  cardMembersBySeniority: {
    fr: "Ancienneté à Guadalajara",
    es: "Antigüedad en Guadalajara",
  },
  cardMembersByStatus: { fr: "Statut des membres", es: "Estatus de los miembros" },
  kpiTopSector: { fr: "Secteur principal", es: "Sector principal" },
  kpiTopSize: { fr: "Taille dominante", es: "Tamaño dominante" },
  kpiGDLMedianYears: { fr: "Ancienneté médiane", es: "Antigüedad mediana" },
  kpiTopStatus: { fr: "Statut dominant", es: "Estatus dominante" },
  needsTitle: { fr: "Besoins du réseau", es: "Necesidades de la red" },
  needsSubtitle: {
    fr: "Comprenez les besoins business exprimés par les membres selon le secteur et dans le temps.",
    es: "Entiende las necesidades de negocio expresadas por los miembros por sector y en el tiempo.",
  },
  cardTopNeeds: { fr: "Top besoins", es: "Top necesidades" },
  cardNeedsHeatmap: { fr: "Besoins par secteur", es: "Necesidades por sector" },
  cardNeedsTimeseries: {
    fr: "Évolution mensuelle des besoins",
    es: "Evolución mensual de las necesidades",
  },
  filterNeedSector: { fr: "Filtrer par secteur", es: "Filtrar por sector" },
  filterNeedSize: {
    fr: "Filtrer par taille d’entreprise",
    es: "Filtrar por tamaño de empresa",
  },
  need_sourcing: { fr: "Sourcing", es: "Sourcing" },
  need_partners: { fr: "Partenaires", es: "Socios" },
  need_recruitment: { fr: "Recrutement", es: "Reclutamiento" },
  need_visibility: { fr: "Visibilité", es: "Visibilidad" },
  need_softlanding: { fr: "Soft‑landing", es: "Soft‑landing" },
  need_legal: { fr: "Conseils légaux/fiscaux", es: "Asesoría legal/fiscal" },
  profileNotFound: { fr: "Profil introuvable", es: "Perfil no encontrado" },
  needNotFound: { fr: "Besoin introuvable", es: "Necesidad no encontrada" },
  noSearchResults: { fr: "Aucun résultat trouvé", es: "No hay resultados" },
  onboardingWelcomeTitle: { fr: "Bienvenue dans l'Annuaire !", es: "¡Bienvenido al directorio!" },
  onboardingWelcomeBody: {
    fr: "Votre profil est la clé pour développer votre réseau. Complétez-le dès maintenant pour apparaître dans l'annuaire et recevoir des recommandations personnalisées par IA.",
    es: "Tu perfil es la llave para hacer crecer tu red. Complétalo ahora para aparecer en el directorio y recibir recomendaciones personalizadas con IA.",
  },
  onboardingCompleteProfile: { fr: "Compléter mon profil", es: "Completar mi perfil" },
  onboardingLater: { fr: "Plus tard", es: "Más tarde" },
  share: { fr: "Partager", es: "Compartir" }
};
