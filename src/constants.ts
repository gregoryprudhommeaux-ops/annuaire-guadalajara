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
    fr: "À fins statistiques uniquement — non affiché sur votre profil public.",
    es: "Solo con fines estadísticos — no se muestra en tu perfil público.",
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
    fr: "L’entreprise peut accueillir des visites de délégations",
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
  fetchPhoto: { fr: "Récupérer la photo LinkedIn", es: "Importar foto de LinkedIn" },
  linkedinPhotoHelperTitle: { fr: "Comment récupérer votre photo LinkedIn ?", es: "¿Cómo importar tu foto de LinkedIn?" },
  linkedinPhotoHelperStep1: { fr: "1. Ouvrez votre profil LinkedIn dans un nouvel onglet.", es: "1. Abre tu perfil de LinkedIn en una nueva pestaña." },
  linkedinPhotoHelperStep2: { fr: "2. Faites un clic droit sur votre photo de profil.", es: "2. Haz clic derecho en tu foto de perfil." },
  linkedinPhotoHelperStep3: { fr: "3. Choisissez 'Copier l'adresse de l'image'.", es: "3. Elige « Copiar dirección de la imagen »." },
  linkedinPhotoHelperStep4: {
    fr: "4. Sur cet annuaire, ce lien ne fonctionnera pas : utilisez plutôt « Envoyer une photo » (fichier JPEG/PNG…), ou hébergez l’image ailleurs et collez cette URL.",
    es: "4. En este directorio ese enlace no funciona: usa « Subir una foto » (archivo JPEG/PNG…), o sube la imagen a otro sitio y pega esa URL.",
  },
  openLinkedin: { fr: "Ouvrir LinkedIn", es: "Abrir LinkedIn" },
  photoURL: { fr: "URL de la photo", es: "URL de la foto" },
  photoUploadFromDevice: { fr: "Envoyer une photo", es: "Subir una foto" },
  photoUploading: { fr: "Envoi…", es: "Subiendo…" },
  photoUploadHint: {
    fr: "Les URL LinkedIn (linkedin.com, media.licdn.com…) ne peuvent pas être enregistrées : le site bloque l’affichage ailleurs. Utilisez « Envoyer une photo » ou une image hébergée sur votre site / un service d’images.",
    es: "Las URL de LinkedIn (linkedin.com, media.licdn.com…) no se pueden guardar: el sitio bloquea mostrarlas fuera. Usa « Subir una foto » o una imagen en tu web / un servicio de hosting.",
  },
  profilePhotoUrlBlockedHost: {
    fr: "Cette URL d’image provient de LinkedIn : elle ne peut pas s’afficher dans l’annuaire (blocage côté LinkedIn). Videz le champ ou utilisez « Envoyer une photo », ou une URL hébergée ailleurs.",
    es: "Esta URL de imagen es de LinkedIn: no puede mostrarse en el directorio (bloqueo de LinkedIn). Borra el campo o usa « Subir una foto », u otra URL alojada fuera de LinkedIn.",
  },
  photoUploadWrongAccount: {
    fr: "L’envoi de fichier n’est disponible que sur votre propre fiche (pas en édition d’un autre membre).",
    es: "La subida solo está disponible en tu propia ficha (no al editar a otro miembro).",
  },
  photoUploadInvalidFile: {
    fr: "Format non pris en charge ou fichier trop volumineux (JPEG, PNG, WebP ou GIF, max 5 Mo).",
    es: "Formato no admitido o archivo demasiado grande (JPEG, PNG, WebP o GIF, máx. 5 MB).",
  },
  photoUploadStorageRules: {
    fr: "Accès refusé par Firebase Storage : vérifiez les règles (déploiement de storage.rules) et que vous êtes connecté.",
    es: "Acceso denegado en Firebase Storage: revisa las reglas (despliega storage.rules) y que hayas iniciado sesión.",
  },
  photoUploadError: {
    fr: "Impossible d’envoyer la photo. Réessayez ou collez une URL hébergée de façon stable.",
    es: "No se pudo subir la foto. Inténtalo de nuevo o pega una URL alojada de forma estable.",
  },
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
    fr: "Bonjour,\n\nJe t’invite à rejoindre l’annuaire de la communauté d’affaires francophone de Guadalajara :\n\n{url}\n\nÀ bientôt !",
    es: "Hola,\n\nTe invito a unirte al directorio de la comunidad de negocios francófona de Guadalajara:\n\n{url}\n\n¡Nos vemos!",
  },
  inviteShareWhatsApp: { fr: "WhatsApp", es: "WhatsApp" },
  inviteShareEmail: { fr: "E-mail", es: "Correo" },
  inviteShareCopy: { fr: "Copier le message", es: "Copiar mensaje" },
  statsMembers: { fr: "membres", es: "miembros" },
  statsSectors: { fr: "secteurs", es: "sectores" },
  statsOpportunities: { fr: "opportunités", es: "oportunidades" },
  tagNewMember: { fr: "Nouveau", es: "Nuevo" },
  tagUrgentNeed: { fr: "Besoin urgent", es: "Necesidad urgente" },
  tagsMore: { fr: "+{{count}} autres", es: "+{{count}} más" },
  tagsCollapse: { fr: "Réduire", es: "Mostrar menos" },
  details: { fr: "Détails", es: "Detalles" },
  restrictedInfo: { fr: "Connectez-vous pour voir", es: "Inicia sesión para ver" },
  registerPrompt: { fr: "Pour accéder à l'ensemble du profil, veuillez vous enregistrer sur l'annuaire", es: "Para ver el perfil completo, regístrate en el directorio" },
  adminPanel: { fr: "Panneau Admin", es: "Panel de Admin" },
  exportData: { fr: "Exporter la base de données", es: "Exportar base de datos" },
  signature: { fr: "Produit et managé par NextStep Services", es: "Producido y gestionado por NextStep Services" },
  welcome: {
    fr: "Bienvenue dans l'annuaire de la communauté d'affaires francophone de Guadalajara.",
    es: "Bienvenido al directorio de la comunidad de negocios francohablante de Guadalajara.",
  },
  welcomeIntro: {
    fr: "Découvrez les entreprises et membres déjà inscrits, filtrez par secteur, profil ou localisation, puis explorez les premiers profils suggérés. Invitez votre réseau à rejoindre la plateforme pour activer davantage d'opportunités et accélérer vos connexions à Guadalajara.",
    es: "Descubre empresas y miembros ya inscritos, filtra por sector, tipo de perfil o ubicación, explora las primeras fichas sugeridas e invita a tu red a unirse a la plataforma para activar más oportunidades y acelerar tus conexiones en Guadalajara.",
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
  cardBioSeeLess: { fr: "Voir moins", es: "Ver menos" },
  cardContactByEmail: { fr: "Contacter par email", es: "Contactar por email" },
  cardContactByWhatsapp: { fr: "Contacter sur WhatsApp", es: "Contactar por WhatsApp" },
  pendingValidation: { fr: "Profil en attente de validation", es: "Perfil pendiente de validación" },
  validationMessage: { fr: "Votre profil doit être validé par un administrateur pour accéder à toutes les informations de l'annuaire.", es: "Tu perfil debe ser validado por un administrador para acceder a toda la información del directorio." },
  profileFormRequiredLegend: {
    fr: 'Les champs suivis d’une astérisque (*) sont obligatoires pour la validation de votre fiche par l’équipe.',
    es: 'Los campos con asterisco (*) son obligatorios para que el equipo valide tu ficha.',
  },
  profileBannerMandatory: {
    fr: 'Merci de mettre à jour votre profil avec les nouveaux champs obligatoires (marqués *) pour permettre sa validation.',
    es: 'Actualiza tu perfil con los nuevos campos obligatorios (marcados con *) para poder validarlo.',
  },
  profileBannerAi: {
    fr: 'Pensez à optimiser votre profil en complétant les champs utiles au matching IA (secteur, besoins, bio, fonction, taille d’entreprise, passions ou mots-clés).',
    es: 'Optimiza tu perfil completando los campos útiles para el emparejamiento por IA (sector, necesidades, bio, función, tamaño, pasiones o palabras clave).',
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
    fr: 'passions ou mots-clés cibles',
    es: 'pasiones o palabras clave',
  },
  profileCoachAiHint: {
    fr: 'Une suggestion IA par session (aucune nouvelle requête tant que votre profil ne change pas).',
    es: 'Una sugerencia IA por sesión (sin nuevas peticiones mientras tu perfil no cambie).',
  },
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
  opportunitiesEmpty: {
    fr: "Aucune opportunité pour le moment.",
    es: "Sin oportunidades por el momento.",
  },
  opportunityModerationPendingNote: {
    fr: "Votre annonce sera visible par tous après validation par un administrateur.",
    es: "Tu anuncio será visible para todos tras la validación de un administrador.",
  },
  opportunityAuthorHiddenGuest: {
    fr: "Membre — connectez-vous pour voir l’auteur et le contacter.",
    es: "Miembro — inicia sesión para ver al autor y contactarle.",
  },
  opportunitiesModerationTitle: {
    fr: "Modération opportunités",
    es: "Moderación de oportunidades",
  },
  opportunitiesModerationPendingCount: {
    fr: "en attente",
    es: "pendientes",
  },
  opportunitiesModerationEmpty: {
    fr: "Aucune opportunité en attente de publication.",
    es: "Ninguna oportunidad pendiente de publicación.",
  },
  opportunityPublish: { fr: "Publier", es: "Publicar" },
  opportunityReject: { fr: "Refuser", es: "Rechazar" },
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
  kpiNeeds: { fr: "Besoins", es: "Necesidades" },
  kpiSectors: { fr: "Secteurs", es: "Sectores" },
  kpiOpportunities: { fr: "Opportunités", es: "Oportunidades" },
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
  radarRecentOpportunitiesTitle: {
    fr: "Opportunités récentes",
    es: "Oportunidades recientes",
  },
  radarRecentOpportunitiesEmpty: {
    fr: "Aucune opportunité pour le moment.",
    es: "Sin oportunidades por el momento.",
  },
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
  contactPrefsTitle: {
    fr: 'Préférences de contact & collaboration',
    es: 'Preferencias de contacto y colaboración',
  },
  contactPrefsCtaLabel: {
    fr: 'Le contacter de préférence par…',
    es: 'Contactar de preferencia por…',
  },
  contactPrefsCtaHint: {
    fr: 'Indiquez le canal à privilégier pour un premier contact (WhatsApp, email, LinkedIn…).',
    es: 'Indica el canal preferido para un primer contacto (WhatsApp, correo, LinkedIn…).',
  },
  contactPrefsCtaPlaceholder: {
    fr: 'Ex. WhatsApp en journée, email pour les demandes formelles',
    es: 'Ej. WhatsApp por el día, correo para solicitudes formales',
  },
  contactPrefsWorkingLangLabel: {
    fr: 'Langues de travail (max. 3)',
    es: 'Idiomas de trabajo (máx. 3)',
  },
  contactPrefsWorkingLangHint: {
    fr: 'Sélectionnez vos langues de travail prioritaires dans la région.',
    es: 'Elige tus idiomas de trabajo prioritarios en la región.',
  },
  contactPrefsWorkingLangTip: {
    fr: 'Astuce : gardez uniquement vos 2–3 langues les plus utilisées dans le business.',
    es: 'Consejo: deja solo tus 2–3 idiomas más usados en el negocio.',
  },
  contactPrefsClientSizeLabel: {
    fr: 'Taille de clients habituels',
    es: 'Tamaño habitual de clientes',
  },
  contactPrefsClientSizeHint: {
    fr: 'Tailles de clients avec lesquelles vous travaillez le plus souvent.',
    es: 'Tamaños de cliente con los que trabajas con más frecuencia.',
  },
  contactPrefsClientSizeEmpty: {
    fr: '— Choisir une option —',
    es: '— Elegir una opción —',
  },
  contactPrefsOpenToLabel: {
    fr: 'Ouvert à…',
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
    fr: "Votre profil est la clé pour générer des opportunités. Complétez-le dès maintenant pour apparaître dans l'annuaire et recevoir des recommandations personnalisées par IA.",
    es: "Tu perfil es la llave para generar oportunidades. Complétalo ahora para aparecer en el directorio y recibir recomendaciones personalizadas con IA.",
  },
  onboardingCompleteProfile: { fr: "Compléter mon profil", es: "Completar mi perfil" },
  onboardingLater: { fr: "Plus tard", es: "Más tarde" },
  share: { fr: "Partager", es: "Compartir" }
};
