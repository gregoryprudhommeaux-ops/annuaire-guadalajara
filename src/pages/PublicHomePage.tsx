import React from 'react';
import type { User } from 'firebase/auth';
import AppShell from '@/components/layout/AppShell';
import { MarketingSection } from '@/components/marketing/MarketingSection';
import { PublicHero } from '@/components/marketing/PublicHero';
import { SocialProofStrip } from '@/components/marketing/SocialProofStrip';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { BenefitsByProfile } from '@/components/marketing/BenefitsByProfile';
import { FeaturedOpportunities } from '@/components/marketing/FeaturedOpportunities';
import { FinalCta } from '@/components/marketing/FinalCta';
import { MobileFooter } from '@/components/marketing/MobileFooter';

export type PublicHomePageProps = {
  /** Firebase user, if logged in (non-admin experience). */
  user?: User | null;
  /** Visible members count (optional social proof). */
  memberCount?: number;
  /** Optional sectors list (chips). */
  sectors?: string[];
  /** When unauthenticated, open auth modal instead of navigating (optional). */
  onRequestSignIn?: () => void;
  /** When authenticated, sign out handler (optional). */
  onSignOut?: () => void;
  /** Optional language controls for the header. */
  headerRightSlot?: React.ReactNode;
};

export default function PublicHomePage({
  user,
  memberCount,
  sectors,
  onRequestSignIn,
  onSignOut,
  headerRightSlot,
}: PublicHomePageProps) {
  const isAuthenticated = Boolean(user);

  // If unauthenticated, prefer opening the auth modal (stay on page) when available.
  const primaryHref = isAuthenticated ? '/profile/edit' : onRequestSignIn ? '/' : '/inscription';
  const secondaryHref = isAuthenticated ? '/network' : '/network';

  const primaryLabel = isAuthenticated ? 'Compléter mon profil' : 'Créer mon profil';
  const secondaryLabel = isAuthenticated ? 'Explorer le réseau' : 'Découvrir le réseau';

  return (
    <AppShell
      header={{
        user: user
          ? { displayName: user.displayName, email: user.email, photoURL: user.photoURL }
          : null,
        onSignIn: onRequestSignIn,
        onSignOut,
        rightSlot: headerRightSlot,
      }}
      showBottomNav={isAuthenticated}
    >
      <div className="space-y-6 sm:space-y-8">
        <PublicHero
          isAuthenticated={isAuthenticated}
          primaryHref={primaryHref}
          primaryLabel={primaryLabel}
          secondaryHref={secondaryHref}
          secondaryLabel={secondaryLabel}
          onPrimaryClick={() => {
            if (!isAuthenticated) onRequestSignIn?.();
          }}
        />

        <MarketingSection>
          <SocialProofStrip memberCount={memberCount} sectors={sectors} />
        </MarketingSection>

        <MarketingSection id="comment-ca-marche" eyebrow="Méthode" title="Une plateforme B2B, structurée" lead="Moins de dispersion. Plus de clarté.">
          <HowItWorks />
        </MarketingSection>

        <MarketingSection eyebrow="Valeur" title="Conçu pour des profils exigeants" lead="Entrepreneurs, dirigeants, investisseurs, partenaires : chaque usage a son parcours.">
          <BenefitsByProfile />
        </MarketingSection>

        <MarketingSection eyebrow="Opportunités" title="Ce qui se passe dans le réseau" lead="Un aperçu — puis des données réelles dès que vous êtes membre.">
          <FeaturedOpportunities isAuthenticated={isAuthenticated} />
        </MarketingSection>

        <MarketingSection>
          <FinalCta isAuthenticated={isAuthenticated} />
        </MarketingSection>

        <MobileFooter />
      </div>
    </AppShell>
  );
}

