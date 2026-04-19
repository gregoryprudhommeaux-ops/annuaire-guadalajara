import type { Language } from '@/types';
import { pickLang } from '@/lib/uiLocale';

/** Libellés du tableau de bord admin — FR / ES / EN. */
export function getAdminDashboardCopy(lang: Language) {
  const L = (fr: string, es: string, en: string) => pickLang(fr, es, en, lang);
  return {
    kpiNewSignups: L('Nouveaux inscrits', 'Nuevos registros', 'New sign-ups'),
    kpiContactClicks: L('Clics contact', 'Clics de contacto', 'Contact clicks'),
    kpiCompleteProfiles: L('Profils complets', 'Perfiles completos', 'Complete profiles'),
    kpiPending: L('En attente', 'Pendientes', 'Pending'),
    kpiProfileViews: L('Vues profils', 'Vistas de perfil', 'Profile views'),
    chartRegistrationsTitle: L('Évolution des inscriptions', 'Evolución de altas', 'Sign-up trend'),
    chartRegistrationsSubtitle: L(
      'Courbe basée sur les profils créés',
      'Serie basada en perfiles creados',
      'Based on profiles created'
    ),
    chartCompletionTitle: L('Complétion des profils', 'Completitud de perfiles', 'Profile completion'),
    chartCompletionSubtitle: L(
      'Vue « strict » (nom, secteur, description, photo)',
      'Vista « estricta » (nombre, sector, descripción, foto)',
      'Strict view (name, sector, description, photo)'
    ),
    chartTopActiveTitle: L('Membres les plus actifs', 'Miembros más activos', 'Most active members'),
    chartTopActiveSubtitle: L(
      'Basé sur les clics de contact — score d’engagement par membre.',
      'Basado en clics de contacto — puntuación de compromiso por miembro.',
      'Based on contact clicks — engagement score per member.'
    ),
    chartSectorSplitTitle: L('Répartition par secteur', 'Distribución por sector', 'Split by sector'),
    chartSectorSplitSubtitle: L(
      'Lecture rapide par univers d’activité',
      'Lectura rápida por ámbito de actividad',
      'Quick read by industry area'
    ),
    needsBarTitle: L('Opportunités actuellement recherchées', 'Oportunidades buscadas ahora', 'Opportunities sought now'),
    needsBarSubtitle: L(
      'Les membres du réseau expriment activement ces besoins',
      'Los miembros expresan activamente estas necesidades',
      'Members are actively expressing these needs'
    ),
    chartCoverageTitle: L('Couverture secteurs / villes', 'Cobertura sectores / ciudades', 'Sector / city coverage'),
    chartCoverageSubtitle: L(
      'Identifier forces & zones faibles.',
      'Identificar fortalezas y puntos débiles.',
      'Spot strengths and weak spots.'
    ),
    gapsTitle: L('Gaps (≤ 1 membre)', 'Brechas (≤ 1 miembro)', 'Gaps (≤ 1 member)'),
    chartMissingFieldsTitle: L(
      'Champs les plus souvent manquants',
      'Campos faltantes más frecuentes',
      'Most often missing fields'
    ),
    chartMissingFieldsSubtitle: L(
      'Où concentrer les relances de complétion.',
      'Dónde enfocar los recordatorios de completitud.',
      'Where to focus completion nudges.'
    ),
    barNameMissing: L('Manquants', 'Faltantes', 'Missing'),
    chartAttentionTitle: L('Attention vs conversion', 'Atención vs conversión', 'Attention vs conversion'),
    chartAttentionSubtitleScatter: L(
      'Chaque point = un membre · axe X = vues profil, axe Y = clics contact.',
      'Cada punto = un miembro · eje X = vistas de perfil, eje Y = clics de contacto.',
      'Each point = one member · X = profile views, Y = contact clicks.'
    ),
    chartAttentionSubtitleEditorial: L(
      'Vue segmentée (peu de signal sur la période) — priorités lisibles.',
      'Vista segmentada (poca señal en el periodo) — prioridades claras.',
      'Segmented view (little signal this period) — clear priorities.'
    ),
    attentionEmpty: L(
      'Pas encore de vues ni de contacts sur cette période.',
      'Aún no hay vistas ni contactos en este periodo.',
      'No views or contacts yet for this period.'
    ),
    scatterAxisViews: L('Vues', 'Vistas', 'Views'),
    scatterAxisProfileViews: L('Vues profil', 'Vistas de perfil', 'Profile views'),
    scatterAxisContacts: L('Contacts', 'Contactos', 'Contacts'),
    scatterAxisContactClicks: L('Clics contact', 'Clics de contacto', 'Contact clicks'),
    attentionSegHighViewsLowContact: L('Très vus, peu contactés', 'Muy vistos, poco contactados', 'High views, low contact'),
    attentionSegEngaged: L('Vus et contactés', 'Vistos y contactados', 'Viewed and contacted'),
    attentionSegLowVis: L('Encore peu visibles', 'Aún poco visibles', 'Still low visibility'),
    attentionSegLowMeta: (n: number) =>
      L(
        `${n} profil${n > 1 ? 's' : ''} sans signal`,
        `${n} perfil${n !== 1 ? 'es' : ''} sin señal`,
        `${n} profile${n === 1 ? '' : 's'} with no signal`
      ),
    attentionRowViewsContacts: (v: number, c: number) =>
      L(
        `${v} vue${v > 1 ? 's' : ''} · ${c} contact${c > 1 ? 's' : ''}`,
        `${v} vista${v > 1 ? 's' : ''} · ${c} contacto${c > 1 ? 's' : ''}`,
        `${v} view${v === 1 ? '' : 's'} · ${c} contact click${c === 1 ? '' : 's'}`
      ),
    attentionRowZero: L('0 vue · 0 contact', '0 vistas · 0 contactos', '0 views · 0 contact clicks'),
    connectPriorityTitle: L('Membres à connecter en priorité', 'Miembros a conectar primero', 'Members to connect first'),
    connectPrioritySubtitle: L(
      'Forte proximité de passions avec d’autres membres — utile pour intros ciblées.',
      'Alta afinidad de pasiones con otros miembros — útil para intros dirigidas.',
      'Strong passion overlap with other members — useful for targeted intros.'
    ),
    connectPriorityEmpty: L(
      'Pas assez de passions renseignées pour estimer le potentiel.',
      'No hay suficientes pasiones para estimar el potencial.',
      'Not enough passions filled in to estimate potential.'
    ),
    overlapScoreTitle: L(
      'Membres distincts partageant au moins une passion',
      'Miembros distintos que comparten al menos una pasión',
      'Distinct members sharing at least one interest'
    ),
    overlapScoreSuffix: L(' recoupements', ' cruces', ' overlaps'),
    passionsCrossTitle: L('Passions les plus transverses', 'Pasiones más transversales', 'Most cross-cutting interests'),
    passionsCrossSubtitle: L(
      'S’étendent sur le plus de secteurs — leviers pour animations transverses.',
      'Cubren más sectores — palancas para dinámicas transversales.',
      'Span the most sectors — levers for cross-cutting programming.'
    ),
    passionMetricSectors: L('sect.', 'sect.', 'sect.'),
    passionDistinctSectorsTitle: L(
      'Nombre de secteurs distincts',
      'Número de sectores distintos',
      'Distinct sectors'
    ),
    passionMetricMembersTitle: L('Membres avec cette passion', 'Miembros con esta pasión', 'Members with this interest'),
    passionMetricMembers: (n: number) =>
      L(`${n} membres`, `${n} miembros`, `${n} member${n === 1 ? '' : 's'}`),
    gapMatrixTitle: L('Gaps secteurs & villes', 'Brechas sectores y ciudades', 'Sector & city gaps'),
    gapMatrixSubtitle: L(
      'Zones comptant ≤ 2 membres — à surveiller pour la représentativité du réseau.',
      'Zonas con ≤ 2 miembros — vigilar la representatividad de la red.',
      'Areas with ≤ 2 members — watch network representativeness.'
    ),
    gapMatrixEmpty: L(
      'Aucun secteur ni ville sous le seuil (≤2) avec les données actuelles.',
      'Ningún sector o ciudad bajo el umbral (≤2) con los datos actuales.',
      'No sector or city below the threshold (≤2) with current data.'
    ),
    gapTableLabel: L('Libellé', 'Etiqueta', 'Label'),
    gapTableType: L('Type', 'Tipo', 'Type'),
    gapKindSector: L('Secteur', 'Sector', 'Sector'),
    gapKindCity: L('Ville', 'Ciudad', 'City'),
    gapTableMembers: L('Membres', 'Miembros', 'Members'),
    gapTableLevel: L('Niveau', 'Nivel', 'Level'),
    gapLevelVeryThin: L('Très fin', 'Muy fino', 'Very thin'),
    gapLevelThin: L('Fin', 'Fino', 'Thin'),
    affinityMainTitle: L('Affinités relationnelles du réseau', 'Afinidades relacionales de la red', 'Network relationship affinities'),
    affinityMainSubtitle: L(
      'Repère les terrains d’intérêt commun les plus utiles pour animer la communauté et accélérer les mises en relation.',
      'Identifica los terrenos de interés común más útiles para animar la comunidad y acelerar conexiones.',
      'Surfaces the most useful common-interest areas to animate the community and speed up introductions.'
    ),
    affinityKpiTopPassion: L('Passion la plus fédératrice', 'Pasión más federadora', 'Top rallying interest'),
    affinityKpiTopSector: L('Secteur le plus affinitaire', 'Sector con más afinidad', 'Strongest affinity sector'),
    affinityKpiStrongestCross: L('Croisement le plus fort', 'Cruce más fuerte', 'Strongest cross'),
    affinityKpiPriorityIntro: L('Mise en relation prioritaire', 'Conexión prioritaria', 'Priority introductions'),
    affinityKpiPriorityIntroValue: L(
      'Identifier les membres à connecter',
      'Identificar miembros a conectar',
      'Identify members to connect'
    ),
    affinityKpiPriorityIntroMeta: L(
      'Priorité basée sur les signaux observés',
      'Prioridad según señales observadas',
      'Priority based on observed signals'
    ),
    affinityOccurrences: (n: number) =>
      L(`${n} occurrences (approx.)`, `${n} ocurrencias (aprox.)`, `${n} occurrences (approx.)`),
    affinityMemberCount: (n: number) =>
      L(`${n} membre(s)`, `${n} miembro(s)`, `${n} member(s)`),
    affinityEmptySummary: L(
      'Pas encore assez de données pour résumer les affinités.',
      'Aún no hay datos suficientes para resumir afinidades.',
      'Not enough data yet to summarize affinities.'
    ),
    affinityExploreSummary: L(
      'Exploration (détail & matrice)',
      'Exploración (detalle y matriz)',
      'Exploration (detail & matrix)'
    ),
    affinityTabDetail: L('Détail', 'Detalle', 'Detail'),
    affinityTabMatrix: L('Matrice', 'Matriz', 'Matrix'),
    affinityExploreAria: L('Exploration affinités', 'Exploración de afinidades', 'Affinity exploration'),
    affinityTablePassion: L('Passion', 'Pasión', 'Interest'),
    affinityTableSector: L('Secteur', 'Sector', 'Sector'),
    affinityTableMembers: L('Membres', 'Miembros', 'Members'),
    affinityTableAction: L('Action possible', 'Acción posible', 'Possible action'),
    affinityExploreBtn: L('Explorer', 'Explorar', 'Explore'),
    matrixCaption: L(
      'Vue exploratoire — utile pour voir la distribution globale des signaux.',
      'Vista exploratoria — útil para ver la distribución global de señales.',
      'Exploratory view — useful to see the overall signal distribution.'
    ),
    matrixViewSector: L('Vue : secteur', 'Vista: sector', 'View: sector'),
    matrixViewRole: L('Vue : fonction', 'Vista: función', 'View: role'),
    matrixViewIndustry: L('Vue : industrie', 'Vista: industria', 'View: industry'),
    matrixFilterAria: L('Vue de la matrice', 'Vista de la matriz', 'Matrix view'),
    drawerMembersShortlist: (n: number, shortlist: number) =>
      L(
        `${n} membre(s) · shortlist : ${shortlist}`,
        `${n} miembro(s) · shortlist: ${shortlist}`,
        `${n} member(s) · shortlist: ${shortlist}`
      ),
    drawerCopyList: L('Copier liste', 'Copiar lista', 'Copy list'),
    drawerCopyListTitle: L('Copier la liste des membres', 'Copiar la lista de miembros', 'Copy member list'),
    drawerCopyIntro: L('Copier intro', 'Copiar intro', 'Copy intro'),
    drawerCopyIntroTitle: L("Copier un texte d'intro", 'Copiar texto de intro', 'Copy intro text'),
    drawerClose: L('Fermer', 'Cerrar', 'Close'),
    drawerViewProfile: L('Voir le profil', 'Ver perfil', 'View profile'),
    shortlistToggleOn: L('Shortlisté', 'En lista', 'Shortlisted'),
    shortlistToggleOff: L('Shortlister', 'Añadir a lista', 'Shortlist'),
    prepareIntro: L('Préparer une intro', 'Preparar intro', 'Draft intro'),
    nextActionsTitle: L('Prochaines actions', 'Próximas acciones', 'Next actions'),
    nextActionsIntro: L(
      ': sélectionner 2–3 profils et envoyer une introduction courte.',
      ': elegir 2–3 perfiles y enviar una introducción breve.',
      ': pick 2–3 profiles and send a short introduction.'
    ),
    nextActionsShortlist: L(
      ': marquer 5–8 profils, puis « Copier liste » pour partager en interne.',
      ': marcar 5–8 perfiles y luego « Copiar lista » para compartir internamente.',
      ': mark 5–8 profiles, then “Copy list” to share internally.'
    ),
    nextActionsInvite: L(
      ': si un secteur/passion est sous-représenté, inviter 1–2 profils « référence ».',
      ': si un sector/pasión está poco representado, invitar 1–2 perfiles « referencia ».',
      ': if a sector/interest is under-represented, invite 1–2 “reference” profiles.'
    ),
    nextActionsFollowup: L(
      ': relancer les profils shortlistés après 7 jours.',
      ': hacer seguimiento a la shortlist a los 7 días.',
      ': follow up shortlisted profiles after 7 days.'
    ),
    nextActionsCopyShortlist: L(
      'Copier shortlist (sur cette sélection)',
      'Copiar shortlist (esta selección)',
      'Copy shortlist (this selection)'
    ),
    introEmailBulk: (title: string) =>
      L(
        `Bonjour,\n\nJe vous contacte via l’annuaire (admin) car votre profil semble pertinent pour: ${title}.\nSeriez-vous ouvert(e) à une introduction / échange rapide ?\n\nMerci,\n`,
        `Hola,\n\nOs escribo desde el directorio (admin) porque vuestro perfil parece relevante para: ${title}.\n¿Os encajaría una introducción / un intercambio breve?\n\nGracias,\n`,
        `Hello,\n\nI’m reaching out via the directory (admin) because your profile looks relevant for: ${title}.\nWould you be open to a quick introduction / chat?\n\nThanks,\n`
      ),
    introEmailSingle: (name: string, title: string) =>
      L(
        `Bonjour ${name},\n\nJe vous contacte via l’annuaire (admin) car votre profil semble pertinent pour: ${title}.\nSeriez-vous ouvert(e) à une introduction / échange rapide ?\n\nMerci,\n`,
        `Hola ${name},\n\nTe escribo desde el directorio (admin) porque tu perfil parece relevante para: ${title}.\n¿Te encajaría una introducción / un intercambio breve?\n\nGracias,\n`,
        `Hello ${name},\n\nI’m reaching out via the directory (admin) because your profile looks relevant for: ${title}.\nWould you be open to a quick introduction / chat?\n\nThanks,\n`
      ),
    strongIntro: L('Intro', 'Intro', 'Intro'),
    strongShortlist: L('Shortlist', 'Shortlist', 'Shortlist'),
    strongInvite: L('Invite', 'Invitar', 'Invite'),
    strongFollowup: L('Follow-up', 'Seguimiento', 'Follow-up'),
    modalChartType: L('Repartition profils (type)', 'Distribución de perfiles (tipo)', 'Profile split (type)'),
    modalChartStatus: L('Profils par statut', 'Perfiles por estado', 'Profiles by status'),
    modalChartCity: L('Profils par ville', 'Perfiles por ciudad', 'Profiles by city'),
    modalChartSector: L('Profils par secteur', 'Perfiles por sector', 'Profiles by sector'),
    modalChartGrowth: L('Croissance profils (30 jours)', 'Crecimiento de perfiles (30 días)', 'Profile growth (30 days)'),
    modalChartClicks: L('Clics de contact par canal', 'Clics de contacto por canal', 'Contact clicks by channel'),
    lineCumulativeProfiles: L('Profils cumulés', 'Perfiles acumulados', 'Cumulative profiles'),
    barClicksName: L('Clics', 'Clics', 'Clicks'),
    profileTypeCompany: L('Entreprise', 'Empresa', 'Company'),
    profileTypeMember: L('Membre', 'Miembro', 'Member'),
    dimSector: L('Secteur', 'Sector', 'Sector'),
    dimPoste: L('Fonction', 'Función', 'Role'),
    dimIndustrie: L('Industrie', 'Industria', 'Industry'),
  };
}

export function adminScatterTooltipLine(views: number, clicks: number, lang: Language): string {
  const v = pickLang(
    `${views} vue${views > 1 ? 's' : ''}`,
    `${views} vista${views > 1 ? 's' : ''}`,
    `${views} view${views === 1 ? '' : 's'}`,
    lang
  );
  const c = pickLang(
    `${clicks} contact${clicks > 1 ? 's' : ''}`,
    `${clicks} contacto${clicks > 1 ? 's' : ''}`,
    `${clicks} contact click${clicks === 1 ? '' : 's'}`,
    lang
  );
  return `${v} · ${c}`;
}

export function adminActivationSuggestion(
  row: { members: number; passionId: string; sector: string },
  rankIndex: number,
  lang: Language
): string {
  if (row.members >= 6) {
    return pickLang(
      'Afterwork transversal (gros potentiel)',
      'Afterwork transversal (alto potencial)',
      'Cross-functional afterwork (high potential)',
      lang
    );
  }
  if (row.members >= 4) {
    return pickLang(
      'Rencontres ciblées (petit groupe)',
      'Encuentros focalizados (grupo pequeño)',
      'Targeted small-group meetups',
      lang
    );
  }
  if (row.members >= 2) {
    return rankIndex === 0
      ? pickLang('Mise en relation pertinente', 'Conexión pertinente', 'Relevant introduction', lang)
      : pickLang('Introduction ciblée', 'Introducción focalizada', 'Targeted introduction', lang);
  }
  return pickLang('Signal faible — à surveiller', 'Señal débil — a vigilar', 'Weak signal — watch', lang);
}

export function adminAffinityViewMembers(lang: Language): string {
  return pickLang('Voir les membres', 'Ver miembros', 'View members', lang);
}

export function adminPluralProfiles(count: number, lang: Language): string {
  return pickLang(
    `${count} profil${count > 1 ? 's' : ''}`,
    `${count} perfil${count !== 1 ? 'es' : ''}`,
    `${count} profile${count === 1 ? '' : 's'}`,
    lang
  );
}
