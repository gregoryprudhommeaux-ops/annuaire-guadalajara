/**
 * Jeu de chaînes ES (structure imbriquée) — référence produit.
 * L’UI utilise `t('cléPlate')` avec `lang === 'es'` via `TRANSLATIONS` ; garder les `es` alignés avec cet objet.
 */
export const ES = {
  common: {
    recommended: 'Recomendado',
    optional: 'Opcional',
    required: 'Obligatorio',
  },

  home: {
    whyJoin: {
      eyebrow: 'Por qué unirse',
      title: 'Una comunidad útil antes de ser masiva',
      description:
        'El Directorio de negocios de Guadalajara ayuda a los profesionales francófonos en Guadalajara a encontrar rápidamente los contactos adecuados, recomendarse mejor y generar oportunidades concretas.',
      item1Title: 'Encontrar a las personas correctas',
      item1Description:
        'Identifica rápidamente un miembro, una empresa o una necesidad relacionada con tu actividad.',
      item2Title: 'Ser recomendado con más facilidad',
      item2Description:
        'Un perfil claro ayuda a los demás a entender en segundos quién eres y cómo pueden ayudarte.',
      item3Title: 'Acceder a oportunidades específicas',
      item3Description:
        'Socios, clientes, expertos locales y necesidades de la red: la plataforma estructura conexiones valiosas.',
    },

    first50: {
      eyebrow: 'Comunidad en lanzamiento',
      title: 'Construyamos los primeros 50 perfiles de referencia',
      description:
        'Cada nuevo miembro refuerza el valor de la red para todos: recomendaciones, solicitudes específicas, conexiones y oportunidades en Guadalajara.',
      subline:
        'Únete a los primeros miembros y ayúdanos a alcanzar una masa crítica útil.',
      progressLabel: 'Progreso',
      inviteCta: 'Invitar a mi red',
      valueLine: 'Cada nuevo perfil aumenta el valor de la red',
    },

    sectors: {
      eyebrow: 'Ya presentes en la red',
      title: 'Perfiles de varios sectores clave',
      description:
        'La red ya se está estructurando alrededor de empresas, expertos y tomadores de decisión activos en distintos sectores.',
    },
  },

  memberCard: {
    empty: {
      needs:
        'Perfil en proceso de enriquecimiento: las necesidades se detallarán próximamente.',
      help: 'Esta sección se completará próximamente.',
      generic: 'Perfil en proceso de enriquecimiento.',
    },
  },

  onboarding: {
    intro: {
      title: 'Crea un perfil simple ahora y complétalo después.',
      description:
        'Primero buscamos hacerte visible dentro de la comunidad. Luego podrás enriquecer tu perfil para mejorar la calidad de las conexiones.',
      step1: 'Completa la información esencial.',
      step2: 'Agrega lo que buscas y en qué puedes ayudar.',
      step3: 'Completa el resto más adelante según tu tiempo.',
    },
  },

  profileCompletion: {
    eyebrow: 'Visibilidad del perfil',
    title: 'Perfil completado al {percent}%',
    description:
      'Completa primero los campos más útiles para que te encuentren y te recomienden dentro del directorio.',
    progressShort: 'completado',
    nextBestActions: 'Siguientes campos por completar',
    completeNow: 'Completar',
  },

  profile: {
    fields: {
      lookingFor: {
        label: 'Lo que busco a través de esta red',
        placeholder:
          'Ej: desarrollar mi cartera B2B en Guadalajara, encontrar un socio local...',
        help: 'Esta frase ayuda a los demás a entender rápidamente cómo pueden ayudarte.',
      },
      canHelpWith: {
        label: 'Puedo ayudar en…',
        placeholder:
          'Ej: instalación en Guadalajara, red F&B, conexiones locales...',
        help: 'Explica en qué puedes ser útil para otros miembros de la comunidad.',
      },
      preferredContact: {
        label: 'Contactarme preferentemente por…',
        placeholder: 'Ej: WhatsApp, Email, LinkedIn',
        help: 'Indica el canal más simple para un primer contacto.',
      },
    },
  },
} as const;
