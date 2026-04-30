import type { UiLang, VitrineStats } from './vitrineTypes';

export type VitrineExportBundle = {
  docTitle: string;
  month: string;
  extractDateLong: string;
  footerSource: string;
  kpiMembers: string;
  kpiNew: string;
  kpiViews: string;
  kpiClicks: string;
  kpiPotentialConnections: string;
  affinitiesList: string;
  affinitiesInsights: string;
  sectorsList: string;
  growthSummary: string;
  recentActivityList: string;
  mostSoughtList: string;
  activeOppsList: string;
  activeOppsWhy: string;
  recentRequestsList: string;
  recentRequestsWhy: string;
  ctaCards: string;
  chartSectors: string;
  chartGrowth: string;
  chartNeeds: string;
};

export function localeForLang(lang: UiLang): string {
  return lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-US' : 'fr-FR';
}

function monthTitle(now: Date, lang: UiLang): string {
  return now.toLocaleDateString(localeForLang(lang), { month: 'long', year: 'numeric' });
}

function longDate(now: Date, lang: UiLang): string {
  return now.toLocaleDateString(localeForLang(lang), { day: 'numeric', month: 'long', year: 'numeric' });
}

function quickChartUrl(config: unknown, width: number, height: number): string {
  const c = encodeURIComponent(JSON.stringify(config));
  return `https://quickchart.io/chart?format=png&backgroundColor=white&width=${width}&height=${height}&c=${c}`;
}

function chartUrlBar(labels: string[], values: number[], colors: string[]): string {
  const safe = values.length ? values : [0];
  const safeLabels = labels.length ? labels : ['—'];
  const palette = colors.length ? colors : ['#01696f'];
  const cfg = {
    type: 'bar',
    data: {
      labels: safeLabels,
      datasets: [
        {
          data: safe,
          backgroundColor: safe.map((_: number, i: number) => palette[i % palette.length]),
          borderWidth: 0,
          barThickness: 16,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      scales: {
        x: { ticks: { color: '#475569', font: { size: 12 } }, grid: { color: '#e2e8f0' } },
        y: { ticks: { color: '#0f172a', font: { size: 12 } }, grid: { display: false } },
      },
    },
  };
  return quickChartUrl(cfg, 820, 380);
}

function chartUrlLine(points: number[]): string {
  const safe = points.length ? points : [0, 1];
  const cfg = {
    type: 'line',
    data: {
      labels: safe.map((_: number, i: number) => String(i + 1)),
      datasets: [
        {
          data: safe,
          borderColor: '#01696f',
          backgroundColor: 'rgba(1,105,111,0.15)',
          fill: false,
          tension: 0.25,
          pointRadius: 3,
          pointBackgroundColor: '#01696f',
        },
      ],
    },
    options: {
      responsive: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { ticks: { color: '#475569', font: { size: 12 } }, grid: { color: '#e2e8f0' } },
      },
    },
  };
  return quickChartUrl(cfg, 820, 300);
}

export function buildVitrineExportBundle(stats: VitrineStats, lang: UiLang, listDash: string): VitrineExportBundle {
  const now = new Date();
  const month = monthTitle(now, lang);
  const extractDateLong = longDate(now, lang);

  const docTitle =
    lang === 'en'
      ? `FrancoNetwork - Network showcase - ${month}`
      : lang === 'es'
        ? `FrancoNetwork - Vitrina de red - ${month}`
        : `FrancoNetwork - Vitrine réseau - ${month}`;

  const kpiMembers = String(stats.totalMembers);
  const kpiNew = String(stats.newMembersLast30d);
  const kpiViews = String(stats.profileViewsCumul);
  const kpiClicks = String(stats.contactClicksCumul);
  const kpiPotentialConnections =
    stats.totalMembers > 1 ? String((stats.totalMembers * (stats.totalMembers - 1)) / 2) : '0';

  const sectorsLabels = stats.topSectors.map((s) => s.name);
  const sectorsValues = stats.topSectors.map((s) => s.value);
  const sectorColors = ['#01696f', '#1f5f5b', '#3a7c78', '#5aa19c', '#0f766e', '#115e59', '#0b4a46', '#083b38'];

  const growthPoints = stats.growthCumulative.map((p) => p.count);
  const needsLabels = stats.needs.map((n) => n.label);
  const needsValues = stats.needs.map((n) => n.count);
  const needsColors = ['#01696f', '#0f766e', '#1f5f5b', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#64748b'];

  const chartSectors = chartUrlBar(sectorsLabels, sectorsValues, sectorColors.slice(0, Math.max(1, sectorsValues.length)));
  const chartGrowth = chartUrlLine(growthPoints.length ? growthPoints : [0, 1]);
  const chartNeeds = chartUrlBar(needsLabels, needsValues, needsColors.slice(0, Math.max(1, needsValues.length)));

  const affinitiesList =
    stats.topPassions.length === 0
      ? listDash
      : stats.topPassions
          .slice(0, 8)
          .map((p) => `• ${p.passionId} — ${p.memberCount} membres · ${p.sectorCount} secteurs`)
          .join('\n');

  const affinitiesInsights =
    lang === 'en'
      ? '• Existing relationship groundwork\n• Signals of trust and conviviality\n• A network conducive to durable connections\n\nConclusion: shared interests accelerate meaningful exchanges.'
      : lang === 'es'
        ? '• Base de relaciones ya existente\n• Señales de confianza y convivencia\n• Una red propicia a conexiones duraderas\n\nConclusión: los puntos en común aceleran los intercambios.'
        : '• Une base de relations déjà existante\n• Des signaux de confiance et de convivialité\n• Un réseau propice aux connexions durables\n\nConclusion : des points communs favorisent des échanges plus rapides.';

  const sectorsList =
    stats.topSectors.length === 0
      ? listDash
      : stats.topSectors.map((s) => `• ${s.name} — ${s.value}`).join('\n');

  const growthSummary =
    lang === 'en'
      ? `• ${stats.newMembersLast30d} new (30 days)\n• ${stats.totalMembers} decision-makers already visible\n\nConclusion: measurable growth momentum.`
      : lang === 'es'
        ? `• ${stats.newMembersLast30d} nuevos (30 días)\n• ${stats.totalMembers} decisores ya visibles\n\nConclusión: una dinámica de crecimiento medible.`
        : `• ${stats.newMembersLast30d} nouveaux (30 jours)\n• ${stats.totalMembers} décideurs déjà visibles\n\nConclusion : une dynamique de croissance mesurable.`;

  const recentActivityList =
    stats.recentMembers.length === 0
      ? listDash
      : stats.recentMembers
          .map((m) => {
            const when = m.createdAtMs ? new Date(m.createdAtMs).toLocaleDateString(localeForLang(lang)) : '';
            const need = m.primaryNeed ? ` — besoin: ${m.primaryNeed}` : '';
            return `• ${when} — ${m.sector}${need}`;
          })
          .join('\n');

  const mostSoughtList =
    stats.needs.length === 0
      ? listDash
      : stats.needs
          .slice(0, 8)
          .map((n) => `• ${n.label} — ${n.count}`)
          .join('\n');

  const activeOppsList = mostSoughtList;

  const activeOppsWhy =
    lang === 'en'
      ? '• Needs already expressed by the community\n• Joining helps you appear at the right moment\n\nConclusion: the network enables concrete opportunities.'
      : lang === 'es'
        ? '• Necesidades ya expresadas por la comunidad\n• Inscribirse ayuda a aparecer en el momento adecuado\n\nConclusión: la red facilita oportunidades concretas.'
        : '• Des besoins déjà exprimés par la communauté\n• Une inscription permet d’apparaître au bon moment\n\nConclusion : le réseau facilite des opportunités concrètes.';

  const recentRequestsList =
    stats.recentRequests.length === 0
      ? listDash
      : stats.recentRequests
          .slice(0, 5)
          .map((r) => {
            const when = r.createdAtMs ? new Date(r.createdAtMs).toLocaleDateString(localeForLang(lang)) : '';
            return `• ${when} — ${r.title}`;
          })
          .join('\n');

  const recentRequestsWhy =
    lang === 'en'
      ? '• Genuine expressed needs\n• Already-active opportunities\n• A community that takes action\n\nConclusion: the network already connects concrete projects.'
      : lang === 'es'
        ? '• Necesidades realmente expresadas\n• Oportunidades ya activas\n• Una comunidad en acción\n\nConclusión: la red ya conecta proyectos concretos.'
        : '• Des besoins réellement exprimés\n• Des opportunités déjà actives\n• Une communauté qui passe à l’action\n\nConclusion : le réseau sert déjà à connecter des projets concrets.';

  const ctaCards =
    lang === 'en'
      ? '• Complete your profile\n• Respond to a request\n• Join and activate the network'
      : lang === 'es'
        ? '• Completar su perfil\n• Responder a una solicitud\n• Unirse y activar la red'
        : '• Compléter son profil\n• Répondre à une demande\n• Rejoindre et activer le réseau';

  const footerSource =
    lang === 'en'
      ? 'Source: directory aggregates'
      : lang === 'es'
        ? 'Fuente: agregados del directorio'
        : 'Source : agrégats annuaire';

  return {
    docTitle,
    month,
    extractDateLong,
    footerSource,
    kpiMembers,
    kpiNew,
    kpiViews,
    kpiClicks,
    kpiPotentialConnections,
    affinitiesList,
    affinitiesInsights,
    sectorsList,
    growthSummary,
    recentActivityList,
    mostSoughtList,
    activeOppsList,
    activeOppsWhy,
    recentRequestsList,
    recentRequestsWhy,
    ctaCards,
    chartSectors,
    chartGrowth,
    chartNeeds,
  };
}
