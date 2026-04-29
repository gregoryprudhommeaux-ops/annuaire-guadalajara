import React, { useLayoutEffect } from 'react';
import type { User } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import { MarketingSection } from '@/components/marketing/MarketingSection';
import { PublicHero } from '@/components/marketing/PublicHero';
import { SocialProofStrip } from '@/components/marketing/SocialProofStrip';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { BenefitsByProfile } from '@/components/marketing/BenefitsByProfile';
import { FeaturedOpportunities } from '@/components/marketing/FeaturedOpportunities';
import { FinalCta } from '@/components/marketing/FinalCta';
import { MobileFooter } from '@/components/marketing/MobileFooter';
import { useLanguage } from '@/i18n/LanguageProvider';

export type PublicHomePageProps = {
  /** Firebase user, if logged in (non-admin experience). */
  user?: User | null;
  /** If true, show admin navigation affordances in the shared header. */
  isAdmin?: boolean;
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
  isAdmin = false,
  memberCount,
  sectors,
  onRequestSignIn,
  onSignOut,
  headerRightSlot,
}: PublicHomePageProps) {
  const { t } = useLanguage();
  const location = useLocation();
  const isAuthenticated = Boolean(user);

  // If unauthenticated, prefer opening the auth modal (stay on page) when available.
  const primaryHref = isAuthenticated ? '/profile/edit' : onRequestSignIn ? '/' : '/inscription';
  const secondaryHref = isAuthenticated ? '/network' : '/network';

  const primaryLabel = isAuthenticated
    ? t('marketing.publicHome.primaryAuthenticated')
    : t('marketing.publicHome.primaryVisitor');
  const secondaryLabel = isAuthenticated
    ? t('marketing.publicHome.secondaryAuthenticated')
    : t('marketing.publicHome.secondaryVisitor');

  useLayoutEffect(() => {
    // Visitors should land on "Comment ça marche" by default (treat as home page).
    // Use layout effect + non-smooth scroll to avoid a visible "jump".
    if (isAuthenticated) return;
    if (location.pathname !== '/') return;
    if (location.hash && location.hash !== '#') return;
    try {
      window.history.replaceState(null, '', '/#comment-ca-marche');
      // Prefer explicit scroll (hash scrolling can be inconsistent with sticky headers).
      const el = document.getElementById('comment-ca-marche');
      if (el) el.scrollIntoView({ block: 'start', behavior: 'auto' });
    } catch {
      // ignore
    }
  }, [isAuthenticated, location.pathname, location.hash]);

  return (
    <AppShell
      header={{
        user: user
          ? { displayName: user.displayName, email: user.email, photoURL: user.photoURL }
          : null,
        isAdmin,
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

        <MarketingSection
          id="comment-ca-marche"
          eyebrow={t('marketing.publicHome.methodEyebrow')}
          title={t('marketing.publicHome.methodTitle')}
          lead={t('marketing.publicHome.methodLead')}
        >
          <HowItWorks />
        </MarketingSection>

        <MarketingSection
          eyebrow={t('marketing.publicHome.valueEyebrow')}
          title={t('marketing.publicHome.valueTitle')}
          lead={t('marketing.publicHome.valueLead')}
        >
          <BenefitsByProfile />
        </MarketingSection>

        <MarketingSection
          eyebrow={t('marketing.publicHome.opportunitiesEyebrow')}
          title={t('marketing.publicHome.opportunitiesTitle')}
          lead={t('marketing.publicHome.opportunitiesLead')}
        >
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

