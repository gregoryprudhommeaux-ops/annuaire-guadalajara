import { ReactNode } from 'react';
import { AdminOnly } from '@/components/auth/AdminOnly';
import { WhyJoinSection } from '@/components/home/WhyJoinSection';
import { First50MembersBanner } from '@/components/home/First50MembersBanner';
import { FIRST_50_MEMBER_TARGET } from '@/constants';
import { getSignupJoinUrl } from '@/lib/siteUrls';
import { cn } from '@/lib/cn';

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
  /** Hero + recherche / filtres (ex. `HeroSearchSection` ou équivalent). */
  heroSearch: ReactNode;
  /**
   * Raccourcis admin (ex. mêmes actions que le header : export OAuth, export DB).
   * Pas de routes `/oauth-connections` / `/export` dans l’app — brancher des boutons ou `Link` réels depuis le parent.
   */
  adminQuickActions?: ReactNode;
  /** Après First50 : nouveaux profils, demandes, recommandations, onglets annuaire, etc. */
  children?: ReactNode;
  className?: string;
};

/**
 * Mise en page d’accueil marketing (P1) + emplacements pour le reste du fil.
 * L’instance principale du site peut rester dans `App.tsx` ; ce composant sert à factoriser ou migrer progressivement.
 */
export function HomePage({
  isAdmin,
  visibleMemberCount,
  targetCount = FIRST_50_MEMBER_TARGET,
  inviteUrl = getSignupJoinUrl(),
  onInviteClick,
  heroSearch,
  adminQuickActions,
  children,
  className,
}: HomePageProps) {
  return (
    <main className={cn('mx-auto w-full max-w-6xl px-4 py-6 sm:px-6', className)}>
      <AdminOnly isAdmin={isAdmin}>
        {adminQuickActions ? (
          <div className="mb-6 flex flex-wrap gap-3">{adminQuickActions}</div>
        ) : null}
      </AdminOnly>

      <section className="space-y-4">{heroSearch}</section>

      <section className="mt-6">
        <WhyJoinSection />
      </section>

      <section className="mt-4">
        <First50MembersBanner
          currentCount={visibleMemberCount}
          targetCount={targetCount}
          inviteUrl={inviteUrl}
          onInviteClick={onInviteClick}
        />
      </section>

      {children}
    </main>
  );
}

export default HomePage;
