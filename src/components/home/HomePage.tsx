import { ReactNode, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminOnly } from '@/components/auth/AdminOnly';
import { WhyJoinSection } from '@/components/home/WhyJoinSection';
import { First50MembersBanner } from '@/components/home/First50MembersBanner';
import { SectorsPresentCard } from '@/components/home/SectorsPresentCard';
import { FIRST_50_MEMBER_TARGET } from '@/constants';
import { getSignupJoinUrl } from '@/lib/siteUrls';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n/useTranslation';

/** Source optionnelle pour déduire les pastilles secteurs (ex. profils annuaire). */
export type HomePageMemberSectorSource = {
  id: string;
  sector?: string | null;
};

export type HomePageProps = {
  isAdmin: boolean;
  visibleMemberCount: number;
  targetCount?: number;
  /**
   * Lien partageable (défaut : `getSignupJoinUrl()`).
   * Pour ouvrir uniquement la modale d’invitation, omettre et passer `onInviteClick`.
   */
  inviteUrl?: string;
  onInviteClick?: () => void;
  /**
   * Intro + hero + recherche. Si absent, affiche le bloc marketing par défaut (`home.marketing.*`).
   */
  heroSearch?: ReactNode;
  adminQuickActions?: ReactNode;
  /** Colonne principale zone B (8/12). Si absent : sections placeholder i18n. */
  mainColumn?: ReactNode;
  /** Colonne droite zone B (4/12). Si absent : secteurs + doubles CTA. */
  sidebarColumn?: ReactNode;
  /** Pastilles secteurs déjà localisées (prioritaire). */
  sectors?: string[];
  /** Déduit jusqu’à 6 secteurs distincts si `sectors` est vide. */
  membersForSectors?: HomePageMemberSectorSource[];
  signupHref?: string;
  joinHref?: string;
  /** Lien ou ancre « explorer les membres » (défaut `#annuaire`). */
  exploreMembersHref?: string;
  /** Lien ou ancre « poster une demande » (défaut `#annuaire`). */
  postRequestHref?: string;
  /** Id de la section annuaire pour l’ancre (défaut `annuaire`). */
  annuaireSectionId?: string;
  /** Sous la grille zone B (pleine largeur). */
  children?: ReactNode;
  className?: string;
};

function parseSectorChips(line: string): string[] {
  return line
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Accueil marketing : zone conversion (1 col) + zone produit (2 cols lg).
 * Branchez `heroSearch`, `mainColumn`, `sidebarColumn` pour remplacer les blocs par défaut.
 */
export function HomePage({
  isAdmin,
  visibleMemberCount,
  targetCount = FIRST_50_MEMBER_TARGET,
  inviteUrl = getSignupJoinUrl(),
  onInviteClick,
  heroSearch,
  adminQuickActions,
  mainColumn,
  sidebarColumn,
  sectors,
  membersForSectors,
  signupHref = '/inscription',
  joinHref = '/join',
  exploreMembersHref,
  postRequestHref: postRequestHrefProp,
  annuaireSectionId = 'annuaire',
  children,
  className,
}: HomePageProps) {
  const { t } = useTranslation();
  const exploreHref = exploreMembersHref ?? `#${annuaireSectionId}`;
  const postRequestHref = postRequestHrefProp ?? `#${annuaireSectionId}`;

  const derivedSectors = useMemo(() => {
    if (sectors?.length) return sectors;
    if (!membersForSectors?.length) return [];
    const set = new Set<string>();
    membersForSectors.forEach((m) => {
      if (m.sector?.trim()) set.add(m.sector.trim());
    });
    return Array.from(set).slice(0, 6);
  }, [sectors, membersForSectors]);

  const sectorsForCard = useMemo(() => {
    if (derivedSectors.length) return derivedSectors;
    return parseSectorChips(t('home.marketing.sectorFallbacksChips'));
  }, [derivedSectors, t]);

  const defaultConversion = (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm leading-6 text-slate-700">{t('home.marketing.introP1')}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t('home.marketing.introP2')}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {t('home.marketing.heroTitle')}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {t('home.marketing.heroLead')}
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            to={signupHref}
            className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
          >
            {t('home.marketing.ctaCreateProfile')}
          </Link>
          <a
            href={exploreHref}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            {t('home.marketing.ctaExploreMembers')}
          </a>
        </div>

        <ul className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
          <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            {t('home.marketing.benefit1')}
          </li>
          <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            {t('home.marketing.benefit2')}
          </li>
          <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            {t('home.marketing.benefit3')}
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">{t('home.marketing.searchTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t('home.marketing.searchLead')}</p>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row">
          <input
            type="search"
            placeholder={t('home.marketing.searchPlaceholder')}
            className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-600"
          />
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            {t('home.marketing.searchButton')}
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-500">{t('home.marketing.searchTip')}</p>
      </section>
    </>
  );

  const defaultMainColumn = (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {t('home.marketing.columnNewMembersTitle')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {t('home.marketing.columnNewMembersLead')}
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          {t('home.marketing.columnNewMembersPlaceholder')}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {t('home.marketing.columnRequestsTitle')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t('home.marketing.columnRequestsLead')}
            </p>
          </div>
          <a
            href={postRequestHref}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            {t('home.marketing.columnRequestsCta')}
          </a>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          {t('home.marketing.columnRequestsPlaceholder')}
        </div>
      </section>

      <section
        id={annuaireSectionId}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-6"
      >
        <h2 className="text-xl font-semibold text-slate-900">
          {t('home.marketing.columnDirectoryTitle')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {t('home.marketing.columnDirectoryLead')}
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          {t('home.marketing.columnDirectoryPlaceholder')}
        </div>
      </section>
    </>
  );

  const defaultSidebar = (
    <>
      <SectorsPresentCard sectors={sectorsForCard} />
      <section className="rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">{t('home.marketing.sidebarProfileTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">{t('home.marketing.sidebarProfileLead')}</p>
        <Link
          to={signupHref}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
        >
          {t('home.marketing.sidebarProfileCta')}
        </Link>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">{t('home.marketing.sidebarInviteTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t('home.marketing.sidebarInviteLead')}</p>
        <Link
          to={joinHref}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          {t('home.marketing.sidebarInviteCta')}
        </Link>
      </section>
    </>
  );

  return (
    <main className={cn('mx-auto w-full max-w-7xl px-4 py-6 sm:px-6', className)}>
      <AdminOnly isAdmin={isAdmin}>
        {adminQuickActions ? (
          <div className="mb-6 flex flex-wrap gap-3">{adminQuickActions}</div>
        ) : null}
      </AdminOnly>

      {/* ZONE A — conversion / 1 colonne */}
      <section className="space-y-6">
        {heroSearch ?? defaultConversion}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 lg:items-stretch">
          <div className="min-w-0 lg:col-span-8">
            <WhyJoinSection className="h-full" />
          </div>
          <div className="min-w-0 lg:col-span-4">
            <First50MembersBanner
              currentCount={visibleMemberCount}
              targetCount={targetCount}
              inviteUrl={inviteUrl}
              onInviteClick={onInviteClick}
              className="h-full"
              narrow
            />
          </div>
        </div>
      </section>

      {/* ZONE B — produit / 2 colonnes */}
      <section className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">{mainColumn ?? defaultMainColumn}</div>
        <aside className="space-y-6 lg:col-span-4">{sidebarColumn ?? defaultSidebar}</aside>
      </section>

      {children ? <div className="mt-8 space-y-6">{children}</div> : null}
    </main>
  );
}

export default HomePage;
