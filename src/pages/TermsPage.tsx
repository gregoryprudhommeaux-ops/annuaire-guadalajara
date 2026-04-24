import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/cn';
import { pagePadX } from '@/lib/pageLayout';
import { useLanguage } from '@/i18n/LanguageProvider';
import { pickLang } from '@/lib/uiLocale';

/**
 * Conditions d'utilisation courtes (franconetwork.app).
 * La version détaillée reste sur `/legal/terms`.
 */
export default function TermsPage() {
  const { lang } = useLanguage();

  const title = pickLang(
    "Conditions d'utilisation",
    'Términos de uso',
    'Terms of use',
    lang
  );
  const lastUpdate = pickLang('Dernière mise à jour : avril 2026', 'Última actualización: abril 2026', 'Last updated: April 2026', lang);
  return (
    <>
      <Helmet>
        <title>{title} · franconetwork.app</title>
        <meta
          name="description"
          content={pickLang(
            "Conditions d'utilisation de l'Annuaire d'Affaires de Guadalajara (franconetwork.app).",
            'Términos de uso del Directorio de Negocios de Guadalajara (franconetwork.app).',
            'Terms of use for the Guadalajara business directory (franconetwork.app).',
            lang
          )}
        />
      </Helmet>
      <div
        className={cn(
          'mx-auto w-full min-w-0 max-w-3xl text-stone-700',
          pagePadX,
          'py-8 sm:py-10'
        )}
      >
        <h1 className="mb-2 text-2xl font-bold text-stone-900">{title}</h1>
        <p className="mb-6 text-sm text-stone-500">{lastUpdate}</p>

        <section className="flex flex-col gap-6 text-sm leading-relaxed">
          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang('1. Objet', '1. Objeto', '1. Purpose', lang)}
            </h2>
            <p>
              {pickLang(
                "Les présentes conditions régissent l'accès et l'utilisation de la plateforme franconetwork.app, annuaire professionnel de la communauté francophone de Guadalajara, Mexique.",
                'Estos términos rigen el acceso y uso de la plataforma franconetwork.app, directorio profesional de la comunidad francófona de Guadalajara, México.',
                'These terms govern access to and use of the franconetwork.app platform, a professional directory for the francophone community of Guadalajara, Mexico.',
                lang
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang('2. Accès à la plateforme', '2. Acceso a la plataforma', '2. Platform access', lang)}
            </h2>
            <p>
              {pickLang(
                "L'accès est réservé aux professionnels et personnes ayant un lien avec la communauté francophone de Guadalajara. La création d'un compte est gratuite et se fait via Google Sign-In.",
                'El acceso está reservado a profesionales y personas con vínculo con la comunidad francófona de Guadalajara. La creación de cuenta es gratuita y se realiza mediante Google Sign-In.',
                'Access is reserved for professionals and people connected to the francophone community of Guadalajara. Account creation is free and uses Google Sign-In.',
                lang
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang("3. Responsabilités de l'utilisateur", '3. Responsabilidades del usuario', '3. User responsibilities', lang)}
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>
                {pickLang(
                  'Fournir des informations exactes et à jour',
                  'Proporcionar información exacta y actualizada',
                  'Provide accurate, up-to-date information',
                  lang
                )}
              </li>
              <li>
                {pickLang(
                  "Ne pas usurper l'identité d'un tiers",
                  'No suplantar la identidad de terceros',
                  'Do not impersonate others',
                  lang
                )}
              </li>
              <li>
                {pickLang(
                  'Ne pas utiliser la plateforme à des fins de spam ou de démarchage abusif',
                  'No usar la plataforma para spam o prospección abusiva',
                  'Do not use the platform for spam or abusive outreach',
                  lang
                )}
              </li>
              <li>
                {pickLang(
                  'Respecter les autres membres de la communauté',
                  'Respetar a los demás miembros de la comunidad',
                  'Respect other community members',
                  lang
                )}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang('4. Contenu', '4. Contenido', '4. Content', lang)}
            </h2>
            <p>
              {pickLang(
                "L'utilisateur est seul responsable des informations publiées dans son profil. La plateforme se réserve le droit de modérer ou supprimer tout contenu inapproprié.",
                'El usuario es el único responsable de la información publicada en su perfil. La plataforma se reserva el derecho de moderar o eliminar cualquier contenido inapropiado.',
                'Users are solely responsible for the information posted in their profile. The platform may moderate or remove any inappropriate content.',
                lang
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang('5. Propriété intellectuelle', '5. Propiedad intelectual', '5. Intellectual property', lang)}
            </h2>
            <p>
              {pickLang(
                "L'ensemble des éléments de la plateforme (logo, design, contenus éditoriaux) sont la propriété d'Annuaire d'Affaires de Guadalajara. Toute reproduction sans autorisation est interdite.",
                'Todos los elementos de la plataforma (logo, diseño, contenidos editoriales) son propiedad del Directorio de Negocios de Guadalajara. Queda prohibida cualquier reproducción sin autorización.',
                'All elements of the platform (logo, design, editorial content) are the property of the Guadalajara business directory. Any reproduction without authorization is prohibited.',
                lang
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang('6. Modification & résiliation', '6. Modificación y terminación', '6. Changes & termination', lang)}
            </h2>
            <p>
              {pickLang(
                "La plateforme se réserve le droit de modifier ces conditions à tout moment. Tout compte ne respectant pas les présentes conditions peut être suspendu ou supprimé.",
                'La plataforma se reserva el derecho de modificar estos términos en cualquier momento. Cualquier cuenta que no los respete puede ser suspendida o eliminada.',
                'The platform may update these terms at any time. Any account that does not comply may be suspended or removed.',
                lang
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang('7. Contact', '7. Contacto', '7. Contact', lang)}
            </h2>
            <p>
              {pickLang('Pour toute question : ', 'Para cualquier duda: ', 'For any questions: ', lang)}
              <a href="mailto:contact@franconetwork.app" className="text-blue-600 underline">
                contact@franconetwork.app
              </a>
            </p>
          </div>
        </section>

        <p className="mt-10 text-xs text-stone-500">
          <Link to="/legal/terms" className="underline underline-offset-2 hover:text-stone-700">
            {pickLang(
              'Version détaillée des conditions',
              'Versión detallada de los términos',
              'Detailed terms version',
              lang
            )}
          </Link>
        </p>
      </div>
    </>
  );
}
