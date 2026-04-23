import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export type FinalCtaProps = {
  isAuthenticated: boolean;
};

export function FinalCta({ isAuthenticated }: FinalCtaProps) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight text-[var(--fn-fg)]">
            {isAuthenticated ? 'Prêt à activer votre réseau ?' : 'Prêt à rejoindre un réseau business fiable ?'}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--fn-muted)]">
            {isAuthenticated
              ? 'Complétez votre profil pour faciliter les mises en relation — puis explorez les opportunités.'
              : 'Créez un profil propre en 2 minutes. Vous accédez ensuite aux membres et aux opportunités.'}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link to={isAuthenticated ? '/profile/edit' : '/inscription'} className="w-full sm:w-auto">
            <Button variant="primary" fullWidth trailingIcon={<ArrowRight className="h-4 w-4" />}>
              {isAuthenticated ? 'Compléter mon profil' : 'Créer mon profil'}
            </Button>
          </Link>
          <Link to={isAuthenticated ? '/network' : '#comment-ca-marche'} className="w-full sm:w-auto">
            <Button variant="secondary" fullWidth>
              {isAuthenticated ? 'Explorer le réseau' : 'En savoir plus'}
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

