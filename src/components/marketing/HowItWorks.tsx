import React from 'react';
import { Card, CardBody } from '@/components/ui/Card';

const STEPS = [
  {
    k: '1',
    title: 'Créez un profil clair',
    body: 'Rôle, expertise, secteurs, langues. Une présentation lisible et utile.',
  },
  {
    k: '2',
    title: 'Explorez et repérez',
    body: 'Annuaire, demandes, radar. Identifiez rapidement les bons interlocuteurs.',
  },
  {
    k: '3',
    title: 'Activez des mises en relation',
    body: 'Prenez contact au bon moment, avec un contexte partagé et des objectifs nets.',
  },
] as const;

export function HowItWorks() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {STEPS.map((s) => (
        <Card key={s.k}>
          <CardBody>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fn-muted-2)]">
              Étape {s.k}
            </p>
            <p className="mt-2 text-[15px] font-semibold tracking-tight text-[var(--fn-fg)]">{s.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--fn-muted)]">{s.body}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

