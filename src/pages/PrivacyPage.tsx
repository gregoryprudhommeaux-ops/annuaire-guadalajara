import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

/**
 * Politique de confidentialité courte (franconetwork.app) — page dédiée pour liens publics / Google OAuth.
 * La version détaillée LFPDPPP reste sur `/legal/privacy`.
 */
export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Politique de confidentialité · franconetwork.app</title>
        <meta
          name="description"
          content="Politique de confidentialité de l’Annuaire d’Affaires de Guadalajara (franconetwork.app)."
        />
      </Helmet>
      <div className="mx-auto max-w-3xl px-6 py-12 text-stone-700">
        <h1 className="mb-2 text-2xl font-bold text-stone-900">Politique de confidentialité</h1>
        <p className="mb-8 text-sm text-stone-500">Dernière mise à jour : avril 2026</p>

        <section className="space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="mb-1 font-semibold text-stone-800">1. Présentation</h2>
            <p>
              L&apos;Annuaire d&apos;Affaires de Guadalajara (<strong>franconetwork.app</strong>) est une
              plateforme de mise en relation professionnelle destinée à la communauté francophone de
              Guadalajara, Mexique. Elle permet de créer un profil, d&apos;explorer les membres et
              entreprises inscrits, et de développer son réseau.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">2. Données collectées</h2>
            <p>
              Lors de la connexion via Google Sign-In, nous accédons uniquement à votre nom, adresse
              e-mail et photo de profil publique, dans le seul but de créer et identifier votre compte
              sur la plateforme.
            </p>
            <p className="mt-2">
              Les informations que vous renseignez dans votre profil (secteur, entreprise, besoins,
              coordonnées de contact) sont stockées dans notre base de données sécurisée (Firebase /
              Google Cloud) et affichées dans l&apos;annuaire selon vos préférences de visibilité.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">3. Utilisation des données</h2>
            <ul className="list-inside list-disc space-y-1">
              <li>Création et gestion de votre compte</li>
              <li>Affichage de votre fiche dans l&apos;annuaire public</li>
              <li>Facilitation des mises en relation entre membres</li>
              <li>Amélioration de la plateforme (statistiques anonymes)</li>
            </ul>
            <p className="mt-2">
              Vos données ne sont jamais vendues ni partagées avec des tiers à des fins commerciales.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">4. Conservation</h2>
            <p>
              Vos données sont conservées tant que votre compte est actif. Vous pouvez demander la
              suppression de votre compte et de vos données à tout moment en nous contactant à
              l&apos;adresse indiquée ci-dessous.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">5. Vos droits</h2>
            <p>
              Conformément aux lois applicables, vous disposez d&apos;un droit d&apos;accès, de
              rectification et de suppression de vos données personnelles. Pour exercer ces droits,
              contactez-nous à :{' '}
              <a href="mailto:contact@franconetwork.app" className="text-blue-600 underline">
                contact@franconetwork.app
              </a>
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">6. Cookies</h2>
            <p>
              La plateforme utilise uniquement des cookies fonctionnels nécessaires à
              l&apos;authentification et à la session utilisateur. Aucun cookie publicitaire n&apos;est
              déposé.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">7. Contact</h2>
            <p>
              Annuaire d&apos;Affaires de Guadalajara — franconetwork.app
              <br />
              E-mail :{' '}
              <a href="mailto:contact@franconetwork.app" className="text-blue-600 underline">
                contact@franconetwork.app
              </a>
            </p>
          </div>
        </section>

        <p className="mt-10 text-xs text-stone-500">
          <Link to="/legal/privacy" className="underline underline-offset-2 hover:text-stone-700">
            Version détaillée (LFPDPPP)
          </Link>
        </p>
      </div>
    </>
  );
}
