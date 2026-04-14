import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/cn';
import { pagePadX } from '@/lib/pageLayout';

/**
 * Conditions d'utilisation courtes (franconetwork.app).
 * La version détaillée reste sur `/legal/terms`.
 */
export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Conditions d&apos;utilisation · franconetwork.app</title>
        <meta
          name="description"
          content="Conditions d'utilisation de l'Annuaire d'Affaires de Guadalajara (franconetwork.app)."
        />
      </Helmet>
      <div
        className={cn(
          'mx-auto w-full min-w-0 max-w-3xl text-stone-700',
          pagePadX,
          'py-8 sm:py-10'
        )}
      >
        <h1 className="mb-2 text-2xl font-bold text-stone-900">Conditions d&apos;utilisation</h1>
        <p className="mb-6 text-sm text-stone-500">Dernière mise à jour : avril 2026</p>

        <section className="flex flex-col gap-6 text-sm leading-relaxed">
          <div>
            <h2 className="mb-1 font-semibold text-stone-800">1. Objet</h2>
            <p>
              Les présentes conditions régissent l&apos;accès et l&apos;utilisation de la plateforme
              franconetwork.app, annuaire professionnel de la communauté francophone de Guadalajara,
              Mexique.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">2. Accès à la plateforme</h2>
            <p>
              L&apos;accès est réservé aux professionnels et personnes ayant un lien avec la communauté
              francophone de Guadalajara. La création d&apos;un compte est gratuite et se fait via
              Google Sign-In.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">3. Responsabilités de l&apos;utilisateur</h2>
            <ul className="list-inside list-disc space-y-1">
              <li>Fournir des informations exactes et à jour</li>
              <li>Ne pas usurper l&apos;identité d&apos;un tiers</li>
              <li>Ne pas utiliser la plateforme à des fins de spam ou de démarchage abusif</li>
              <li>Respecter les autres membres de la communauté</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">4. Contenu</h2>
            <p>
              L&apos;utilisateur est seul responsable des informations publiées dans son profil. La
              plateforme se réserve le droit de modérer ou supprimer tout contenu inapproprié.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">5. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des éléments de la plateforme (logo, design, contenus éditoriaux) sont la
              propriété d&apos;Annuaire d&apos;Affaires de Guadalajara. Toute reproduction sans autorisation
              est interdite.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">6. Modification &amp; résiliation</h2>
            <p>
              La plateforme se réserve le droit de modifier ces conditions à tout moment. Tout compte
              ne respectant pas les présentes conditions peut être suspendu ou supprimé.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">7. Contact</h2>
            <p>
              Pour toute question :{' '}
              <a href="mailto:contact@franconetwork.app" className="text-blue-600 underline">
                contact@franconetwork.app
              </a>
            </p>
          </div>
        </section>

        <p className="mt-10 text-xs text-stone-500">
          <Link to="/legal/terms" className="underline underline-offset-2 hover:text-stone-700">
            Version détaillée des conditions
          </Link>
        </p>
      </div>
    </>
  );
}
