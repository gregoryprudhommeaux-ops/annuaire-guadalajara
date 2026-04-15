import { ES } from '@/i18n/es';

const shell = {
  nav: {
    home: 'Inicio',
    network: 'Red',
    requests: 'Solicitudes',
    radar: 'Radar',
    myProfile: 'Mi perfil',
    admin: 'Admin',
    backHome: 'Volver al inicio',
  },
  network: {
    search: {
      eyebrow: 'BÚSQUEDA',
      memberCompanyNeedAria: 'Buscar un miembro, empresa o necesidad',
    },
    recommendations: {
      eyebrow: 'RECOMENDACIONES',
      title: 'Perfiles recomendados para ti',
      subtitle:
        'Basado en tus necesidades actuales, tu actividad y tus intereses.',
      aria: 'Perfiles recomendados para ti',
    },
    profileFallback: 'Perfil',
    compatLevel: {
      veryRelevant: 'Muy pertinente',
      relevant: 'Pertinente',
      explore: 'Para explorar',
    },
    compatReason: {
      needMatch: 'Necesidad afín',
      canHelp: 'Puede ayudarte',
      sameSector: 'Mismo sector',
      sameCity: 'Misma ciudad',
      passion: 'Pasión compartida',
      mentoring: 'Abierto a mentoría',
      keywords: 'Palabras clave afines',
    },
    filters: {
      sectorAll: 'Sector',
      profileAll: 'Perfil',
      locationAll: 'Lugares',
      company: 'Empresa',
      member: 'Miembro',
      other: 'Otro',
    },
    memberCard: {
      noStructuredNeed: 'Sin necesidades estructuradas',
      companyUnknown: 'Empresa no indicada',
      sectorUnknown: 'Sector no indicado',
      cardAria: 'Perfil de {name}',
      bioIncomplete: 'Presentación por completar.',
      currentNeedsLabel: 'NECESIDADES ACTUALES',
    },
    scoreLabel: 'Pertinencia: {score} de 5',
    recommendedCard: {
      openProfileAria: 'Abrir perfil de {name}',
      saveAria: 'Guardar para más tarde',
      savedAria: 'Quitar de guardados',
      labelSaved: 'Guardado',
      labelFollow: 'Seguir',
      hideRecoAria: 'No recomendar este perfil',
      alreadyKnow: 'Ya lo conozco',
      viewProfile: 'Ver perfil',
    },
  },
  footer: {
    privacy: 'Política de privacidad',
    terms: 'Términos de uso',
    contact: 'Contacto',
  },
} as const;

export const es = {
  ...ES,
  common: {
    ...ES.common,
    viewProfile: 'Ver perfil',
    learnMore: 'Saber más',
    loading: 'Cargando…',
    noResults: 'Sin resultados',
    search: 'Buscar',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
  },
  nav: shell.nav,
  network: shell.network,
  footer: shell.footer,
} as const;
