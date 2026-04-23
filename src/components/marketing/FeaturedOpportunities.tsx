import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Radar, Sparkles } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { cn } from '@/lib/cn';

export type FeaturedOpportunitiesProps = {
  isAuthenticated: boolean;
  requestsHref?: string;
  radarHref?: string;
};

export function FeaturedOpportunities({
  isAuthenticated,
  requestsHref = '/requests',
  radarHref = '/radar',
}: FeaturedOpportunitiesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <SectionTitle
          title="Opportunités en avant-première"
          subtitle="Un aperçu de ce que vous pouvez déclencher dans le réseau."
        />
        <Link to={isAuthenticated ? requestsHref : '/inscription'} className={cn('hidden sm:block')}>
          <Button variant="ghost" trailingIcon={<ArrowRight className="h-4 w-4" />}>
            Voir
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardBody className="flex h-full flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                  <Sparkles className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                  Demandes qualifiées
                </p>
                <p className="mt-3 text-[15px] font-semibold tracking-tight text-[var(--text)]">
                  Besoin d’un partenaire fiable, maintenant.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  Des opportunités concrètes, formulées clairement, pour activer les bonnes introductions.
                </p>
              </div>
            </div>
            <div className="mt-auto pt-1">
              <Link to={isAuthenticated ? requestsHref : '/inscription'} className="block">
                <Button variant="secondary" fullWidth trailingIcon={<ArrowRight className="h-4 w-4" />}>
                  {isAuthenticated ? 'Explorer les demandes' : 'Créer un profil pour accéder'}
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex h-full flex-col gap-3">
            <div className="min-w-0">
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                <Radar className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                Radar réseau
              </p>
              <p className="mt-3 text-[15px] font-semibold tracking-tight text-[var(--text)]">
                Repérer les signaux faibles du marché.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                Un flux pour comprendre qui bouge, qui cherche, et où se trouvent les synergies.
              </p>
            </div>
            <div className="mt-auto pt-1">
              <Link to={isAuthenticated ? radarHref : '/inscription'} className="block">
                <Button variant="secondary" fullWidth trailingIcon={<ArrowRight className="h-4 w-4" />}>
                  {isAuthenticated ? 'Ouvrir le radar' : 'S’inscrire pour accéder'}
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="sm:hidden">
        <Link to={isAuthenticated ? requestsHref : '/inscription'} className="block">
          <Button variant="ghost" fullWidth trailingIcon={<ArrowRight className="h-4 w-4" />}>
            Voir toutes les opportunités
          </Button>
        </Link>
      </div>
    </div>
  );
}

