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

/** Secteurs : la valeur enregistrée en base reste le libellé FR ; l’UI affiche ES si besoin. */
export const ACTIVITY_CATEGORY_I18N: { fr: string; es: string }[] = [
  { fr: 'Agriculture & Agroalimentaire', es: 'Agricultura y agroalimentación' },
  { fr: 'Artisanat & Design', es: 'Artesanía y diseño' },
  { fr: 'Automobile & Transport', es: 'Automóvil y transporte' },
  { fr: 'Banque & Finance', es: 'Banca y finanzas' },
  { fr: 'Bâtiment & Immobilier', es: 'Construcción e inmobiliario' },
  { fr: 'Commerce & Distribution', es: 'Comercio y distribución' },
  { fr: 'Conseil & Services aux entreprises', es: 'Consultoría y servicios a empresas' },
  { fr: 'Culture & Loisirs', es: 'Cultura y ocio' },
  { fr: 'Éducation & Formation', es: 'Educación y formación' },
  { fr: 'Énergie & Environnement', es: 'Energía y medio ambiente' },
  { fr: 'Hôtellerie & Restauration', es: 'Hotelería y restauración' },
  { fr: 'Industrie & Manufacturier', es: 'Industria y manufactura' },
  { fr: 'Santé & Bien-être', es: 'Salud y bienestar' },
  { fr: 'Technologies & Informatique', es: 'Tecnologías e informática' },
  { fr: 'Tourisme', es: 'Turismo' },
  { fr: 'Autre', es: 'Otro' },
];

export const ACTIVITY_CATEGORIES = ACTIVITY_CATEGORY_I18N.map((x) => x.fr);

const activityCategoryByFr = new Map(ACTIVITY_CATEGORY_I18N.map((x) => [x.fr, x]));

export function activityCategoryLabel(value: string | undefined | null, lang: Language): string {
  if (value == null || value === '') return '';
  if (lang === 'fr') return value;
  return activityCategoryByFr.get(value)?.es ?? value;
}

/** Fonction dans l’entreprise : valeur stockée = libellé FR. */
export const WORK_FUNCTION_I18N: { fr: string; es: string }[] = [
  { fr: 'Direction générale', es: 'Dirección general' },
  { fr: 'Stratégie / Corporate', es: 'Estrategia / corporativo' },
  { fr: 'Vente / Business development', es: 'Ventas / desarrollo de negocio' },
  { fr: 'Marketing / Communication', es: 'Marketing / comunicación' },
  { fr: 'Service client / Relation clients', es: 'Atención al cliente / relación con clientes' },
  { fr: 'Développement produits / R&D', es: 'Desarrollo de productos / I+D' },
  { fr: 'Production / Opérations', es: 'Producción / operaciones' },
  { fr: 'Qualité / HSE', es: 'Calidad / HSE' },
  { fr: 'Technique / Maintenance / Ingénierie', es: 'Técnico / mantenimiento / ingeniería' },
  { fr: 'Logistique / Supply chain', es: 'Logística / cadena de suministro' },
  { fr: 'Achats / Approvisionnement', es: 'Compras / aprovisionamiento' },
  { fr: 'Finance / Comptabilité / Contrôle de gestion', es: 'Finanzas / contabilidad / control de gestión' },
  { fr: 'Ressources humaines', es: 'Recursos humanos' },
  { fr: 'Informatique / SI / Digital', es: 'Informática / SI / Digital' },
  { fr: 'Juridique / Compliance / Risques', es: 'Jurídico / cumplimiento / riesgos' },
];

export const WORK_FUNCTION_OPTIONS = WORK_FUNCTION_I18N.map((x) => x.fr);

const workFunctionByFr = new Map(WORK_FUNCTION_I18N.map((x) => [x.fr, x]));

export function workFunctionLabel(value: string | undefined | null, lang: Language): string {
  if (value == null || value === '') return '';
  if (lang === 'fr') return value;
  return workFunctionByFr.get(value)?.es ?? value;
}

export const CITIES = [
  'Guadalajara',
  'Zapopan',
  'Tlaquepaque',
  'Tonalá',
  'Tlajomulco de Zúñiga',
  'El Salto',
  'Autre'
];

/** Seuil d’affichage : bloc « lancement » vs stats complètes (homepage). */
export const MEMBERS_THRESHOLD = 20;

export const TRANSLATIONS: Translations = {
  title: { fr: "Annuaire d'Affaires de Guadalajara", es: "Directorio de Negocios de Guadalajara" },
  subtitle: { fr: "Communauté d'affaires francophone", es: "Comunidad de negocios francohablante" },
  login: { fr: "Se connecter", es: "Iniciar sesión" },
  continueGoogle: { fr: "Continuer avec Google", es: "Continuar con Google" },
  continueMicrosoft: { fr: "Continuer avec Microsoft", es: "Continuar con Microsoft" },
  continueApple: { fr: "Continuer avec Apple", es: "Continuar con Apple" },
  signInWithProvider: {
    fr: "Choisissez un compte :",
    es: "Elige una cuenta:",
  },
  close: { fr: "Fermer", es: "Cerrar" },
  logout: { fr: "Se déconnecter", es: "Cerrar sesión" },
  register: { fr: "S'enregistrer", es: "Registrarse" },
  myProfile: { fr: "Mon Profil", es: "Mi Perfil" },
  directory: { fr: "Annuaire", es: "Directorio" },
  fullName: { fr: "Nom complet", es: "Nombre completo" },
  companyName: { fr: "Nom de la société", es: "Nombre de la empresa" },
  /** Titre de section (fiche détail) — pas la vue « Entreprises » du menu */
  company: { fr: "Entreprise", es: "Empresa" },
  creationYear: { fr: "Année de création", es: "Año de creación" },
  city: { fr: "Ville", es: "Ciudad" },
  state: { fr: "État", es: "Estado" },
  neighborhood: { fr: "Quartier", es: "Colonia" },
  activityCategory: { fr: "Secteur d'activité", es: "Sector de actividad" },
  workFunction: { fr: "Fonction dans l'entreprise", es: "Función en la empresa" },
  workFunctionHint: {
    fr: "Rôle opérationnel (pas votre titre sur la carte de visite).",
    es: "Rol operativo (no tu título en tu tarjeta de presentación)."
  },
  selectWorkFunction: { fr: "Choisir une fonction...", es: "Elige una función..." },
  email: { fr: "Email", es: "Correo electrónico" },
  website: { fr: "Site web", es: "Sitio web" },
  whatsapp: { fr: "WhatsApp", es: "WhatsApp" },
  passions: { fr: "En dehors du business :", es: "Más allá del negocio :" },
  passionsHint: {
    fr: "Choisissez jusqu’à 3 centres d’intérêt (hors cœur de métier).",
    es: "Elige hasta 3 intereses (fuera de tu actividad principal).",
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
  arrivalYear: { fr: "Année d'arrivée au Mexique", es: "Año de llegada a México" },
  yearsInMexico: { fr: "Années au Mexique", es: "Años en México" },
  employeeCount: { fr: "Nombre d'employés", es: "Número de empleados" },
  isEmailPublic: { fr: "Rendre l'email public", es: "Hacer público mi correo" },
  isWhatsappPublic: { fr: "Rendre WhatsApp public", es: "Hacer público mi WhatsApp" },
  linkedin: { fr: "Lien LinkedIn", es: "Enlace LinkedIn" },
  fetchPhoto: { fr: "Récupérer la photo LinkedIn", es: "Importar foto de LinkedIn" },
  linkedinPhotoHelperTitle: { fr: "Comment récupérer votre photo LinkedIn ?", es: "¿Cómo importar tu foto de LinkedIn?" },
  linkedinPhotoHelperStep1: { fr: "1. Ouvrez votre profil LinkedIn dans un nouvel onglet.", es: "1. Abre tu perfil de LinkedIn en una nueva pestaña." },
  linkedinPhotoHelperStep2: { fr: "2. Faites un clic droit sur votre photo de profil.", es: "2. Haz clic derecho en tu foto de perfil." },
  linkedinPhotoHelperStep3: { fr: "3. Choisissez 'Copier l'adresse de l'image'.", es: "3. Elige « Copiar dirección de la imagen »." },
  linkedinPhotoHelperStep4: { fr: "4. Revenez ici et collez l'adresse dans le champ 'URL de la photo'.", es: "4. Vuelve aquí y pega la dirección en el campo « URL de la foto »." },
  openLinkedin: { fr: "Ouvrir LinkedIn", es: "Abrir LinkedIn" },
  photoURL: { fr: "URL de la photo", es: "URL de la foto" },
  save: { fr: "Enregistrer", es: "Guardar" },
  cancel: { fr: "Annuler", es: "Cancelar" },
  search: { fr: "Rechercher", es: "Buscar" },
  searchPlaceholder: {
    fr: "Nom, secteur, besoin, mot-clé…",
    es: "Nombre, sector, necesidad, palabra clave…",
  },
  searchBlockTitle: { fr: "Rechercher dans l'annuaire", es: "Buscar en el directorio" },
  searchDirectoryPlaceholder: {
    fr: "Rechercher un membre, une entreprise, un besoin…",
    es: "Buscar un miembro, empresa o necesidad…",
  },
  searchButton: { fr: "Rechercher", es: "Buscar" },
  filterSectorLabel: { fr: "Secteur", es: "Sector" },
  filterSectorDefault: { fr: "Secteur", es: "Sector" },
  filterTypeLabel: { fr: "Type de profil", es: "Tipo de perfil" },
  filterTypeDefault: { fr: "Profil", es: "Perfil" },
  filterTypeCompany: { fr: "Entreprise", es: "Empresa" },
  filterTypeMember: { fr: "Membre", es: "Miembro" },
  filterLocationLabel: { fr: "Localisation", es: "Ubicación" },
  filterLocationDefault: { fr: "Localisation", es: "Ubicación" },
  filterLocationCentro: { fr: "Guadalajara Centre", es: "Guadalajara Centro" },
  filterLocationZapopan: { fr: "Zapopan", es: "Zapopan" },
  filterLocationProvidencia: { fr: "Providencia", es: "Providencia" },
  filterLocationOther: { fr: "Autre", es: "Otro" },
  clearFilters: { fr: "Effacer les filtres", es: "Borrar filtros" },
  randomProfile: {
    fr: "🎲 Découvrir un profil au hasard",
    es: "🎲 Descubrir un perfil al azar",
  },
  randomProfileEmpty: {
    fr: "Aucun profil disponible",
    es: "Ningún perfil disponible",
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
  statsMembers: { fr: "membres", es: "miembros" },
  statsSectors: { fr: "secteurs", es: "sectores" },
  statsOpportunities: { fr: "opportunités", es: "oportunidades" },
  details: { fr: "Détails", es: "Detalles" },
  restrictedInfo: { fr: "Connectez-vous pour voir", es: "Inicia sesión para ver" },
  registerPrompt: { fr: "Pour accéder à l'ensemble du profil, veuillez vous enregistrer sur l'annuaire", es: "Para ver el perfil completo, regístrate en el directorio" },
  adminPanel: { fr: "Panneau Admin", es: "Panel de Admin" },
  exportData: { fr: "Exporter la base de données", es: "Exportar base de datos" },
  signature: { fr: "Produit et managé par NextStep Services", es: "Producido y gestionado por NextStep Services" },
  welcome: { fr: "Bienvenue sur l'annuaire de la communauté d'affaires francophone de Guadalajara.", es: "Bienvenido al directorio de la comunidad de negocios francohablante de Guadalajara." },
  welcomeIntro: {
    fr: "Explorez les fiches entreprises et membres, affinez par secteur ou par besoins structurés, et laissez-vous proposer des matchings entre profils complémentaires. Publiez ou consultez des besoins urgents, ouvrez le radar d'opportunités et suivez l'activité du réseau — un outil pour accélérer vos connexions à Guadalajara.",
    es: "Explora fichas de empresas y miembros, refina por sector o por necesidades estructuradas y recibe emparejamientos sugeridos entre perfiles complementarios. Publica o consulta necesidades urgentes, abre el radar de oportunidades y sigue la actividad de la red: una herramienta para acelerar tus conexiones en Guadalajara.",
  },
  noProfile: { fr: "Vous n'avez pas encore de profil. Veuillez en créer un pour apparaître dans l'annuaire.", es: "Aún no tienes un perfil. Por favor, crea uno para aparecer en el directorio." },
  edit: { fr: "Modifier", es: "Editar" },
  editProfile: { fr: "Modifier mon profil", es: "Editar mi perfil" },
  loading: { fr: "Chargement...", es: "Cargando..." },
  deleteProfile: { fr: "Supprimer mon profil", es: "Eliminar mi perfil" },
  confirmDelete: { fr: "Êtes-vous sûr de vouloir supprimer ce profil ? Cette action est irréversible.", es: "¿Seguro que quieres eliminar este perfil? Esta acción no se puede deshacer." },
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
  pendingValidation: { fr: "Profil en attente de validation", es: "Perfil pendiente de validación" },
  validationMessage: { fr: "Votre profil doit être validé par un administrateur pour accéder à toutes les informations de l'annuaire.", es: "Tu perfil debe ser validado por un administrador para acceder a toda la información del directorio." },
  newProfiles: { fr: "Nouveaux Profils", es: "Nuevos Perfiles" },
  validate: { fr: "Valider", es: "Validar" },
  reject: { fr: "Rejeter", es: "Rechazar" },
  noPendingProfiles: { fr: "Aucun profil en attente de validation", es: "No hay perfiles pendientes de validación" },
  bio: { fr: "Bio / Description", es: "PRESENTACIÓN / BIO" },
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
  /** Affichage des mots-clés (même champ Firestore `targetSectors`) */
  targetSectors: {
    fr: "Mots-clés (industrie, domaine, zone…)",
    es: "Palabras clave (industria, ámbito, zona…)",
  },
  needKeywordsHint: {
    fr: "Indiquez des mots-clés séparés par des virgules (secteur, type de clientèle, zone géographique, technologie…).",
    es: "Indica palabras clave separadas por comas (sector, tipo de cliente, zona, tecnología…).",
  },
  needKeywordsPlaceholder: {
    fr: "Ex. agroalimentaire, SaaS B2B, Zapopan, export UE…",
    es: "Ej. agro, SaaS B2B, Zapopan, export UE…",
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
  opportunities: { fr: "Opportunités", es: "Oportunidades" },
  radar: { fr: "Radar Guadalajara", es: "Radar Guadalajara" },
  companies: { fr: "Entreprises", es: "Empresas" },
  members: { fr: "Membres", es: "Miembros" },
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
  aiRecUnavailable: {
    fr: "Les suggestions IA sont temporairement indisponibles. Réessayez dans un instant.",
    es: "Las sugerencias IA no están disponibles por ahora. Inténtalo de nuevo en un momento.",
  },
  aiRecNoSuggestions: {
    fr: "Aucune suggestion pour le moment. Réessayez plus tard ou élargissez votre réseau dans l’annuaire.",
    es: "No hay sugerencias por ahora. Inténtalo más tarde o amplía tu red en el directorio.",
  },
  aiRecRetry: { fr: "Réessayer", es: "Reintentar" },
  postUrgentNeed: { fr: "Publier un besoin urgent", es: "Publicar necesidad urgente" },
  contact: { fr: "Contacter", es: "Contactar" },
  contactLinks: { fr: "Contact & liens", es: "Contacto y enlaces" },
  highlightedNeedsTitle: {
    fr: "Besoins actuels (max. 3)",
    es: "Necesidades actuales (máx. 3)",
  },
  highlightedNeedsHint: {
    fr: "Sélectionnez jusqu’à 3 besoins représentatifs ; ils apparaîtront sur votre fiche dans l’annuaire.",
    es: "Elige hasta 3 necesidades; aparecerán en tu ficha del directorio.",
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
    fr: "Aucun besoin structuré renseigné pour l’instant. Complétez votre profil (max. 3).",
    es: "Aún no hay necesidades estructuradas. Completa tu perfil (máx. 3).",
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
    fr: "Aucune passion structurée renseignée pour l’instant. Complétez votre profil (max. 3).",
    es: "Aún no hay pasiones estructuradas. Completa tu perfil (máx. 3).",
  },
  profileNotFound: { fr: "Profil introuvable", es: "Perfil no encontrado" },
  needNotFound: { fr: "Besoin introuvable", es: "Necesidad no encontrada" },
  noSearchResults: { fr: "Aucun résultat trouvé", es: "No hay resultados" },
  onboardingWelcomeTitle: { fr: "Bienvenue dans l'Annuaire !", es: "¡Bienvenido al directorio!" },
  onboardingWelcomeBody: {
    fr: "Votre profil est la clé pour générer des opportunités. Complétez-le dès maintenant pour apparaître dans l'annuaire et recevoir des recommandations personnalisées par IA.",
    es: "Tu perfil es la llave para generar oportunidades. Complétalo ahora para aparecer en el directorio y recibir recomendaciones personalizadas con IA.",
  },
  onboardingCompleteProfile: { fr: "Compléter mon profil", es: "Completar mi perfil" },
  onboardingLater: { fr: "Plus tard", es: "Más tarde" },
  share: { fr: "Partager", es: "Compartir" }
};
