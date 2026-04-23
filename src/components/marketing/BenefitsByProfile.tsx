import React from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';

const PROFILES = [
  {
    title: 'Entrepreneur',
    items: ['Accès rapide aux bons prestataires', 'Références et recommandations locales', 'Visibilité crédible, sans bruit'],
  },
  {
    title: 'Partenaire',
    items: ['Prospection plus fine (secteurs, langues)', 'Contexte business avant le premier contact', 'Opportunités qualifiées via demandes'],
  },
  {
    title: 'Investisseur',
    items: ['Lecture rapide de l’écosystème', 'Signal de sérieux (profil structuré)', 'Repérage de synergies et deals'],
  },
  {
    title: 'Membre communauté',
    items: ['Événements & invitations (selon accès)', 'Mises en relation ciblées', 'Réseau vivant, international'],
  },
] as const;

export function BenefitsByProfile() {
  return (
    <div className="space-y-4">
      <SectionTitle
        title="Bénéfices selon votre profil"
        subtitle="Un même réseau, des usages différents — toujours orientés résultats."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {PROFILES.map((p) => (
          <Card key={p.title}>
            <CardBody>
              <p className="text-[15px] font-semibold tracking-tight text-[var(--fn-fg)]">{p.title}</p>
              <ul className="mt-3 space-y-2">
                {p.items.map((it) => (
                  <li key={it} className="flex gap-2 text-sm leading-relaxed text-[var(--fn-muted)]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--fn-muted-2)]" aria-hidden />
                    <span className="min-w-0">{it}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

