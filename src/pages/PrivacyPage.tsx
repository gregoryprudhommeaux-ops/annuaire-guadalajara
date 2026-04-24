import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/lib/cn';
import { pagePadX } from '@/lib/pageLayout';
import { useLanguage } from '@/i18n/LanguageProvider';
import { pickLang } from '@/lib/uiLocale';

/**
 * Politique de confidentialité courte (franconetwork.app) — page dédiée pour liens publics / Google OAuth.
 * La version détaillée LFPDPPP reste sur `/legal/privacy`.
 */
export default function PrivacyPage() {
  const { lang } = useLanguage();

  const title = pickLang(
    'Politique de confidentialité',
    'Política de privacidad',
    'Privacy policy',
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
            "Politique de confidentialité de l’Annuaire d’Affaires de Guadalajara (franconetwork.app).",
            'Política de privacidad del Directorio de Negocios de Guadalajara (franconetwork.app).',
            'Privacy policy for the Guadalajara business directory (franconetwork.app).',
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
              {pickLang('1. Présentation', '1. Presentación', '1. Overview', lang)}
            </h2>
            <p>
              {pickLang(
                "L'Annuaire d'Affaires de Guadalajara (franconetwork.app) est une plateforme de mise en relation professionnelle destinée à la communauté francophone de Guadalajara, Mexique. Elle permet de créer un profil, d'explorer les membres et entreprises inscrits, et de développer son réseau.",
                'El Directorio de Negocios de Guadalajara (franconetwork.app) es una plataforma de conexiones profesionales para la comunidad francófona de Guadalajara, México. Permite crear un perfil, explorar miembros y empresas registradas y desarrollar tu red.',
                'The Guadalajara business directory (franconetwork.app) is a professional networking platform for the francophone community in Guadalajara, Mexico. It lets you create a profile, explore registered members and companies, and grow your network.',
                lang
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang('2. Données collectées', '2. Datos recopilados', '2. Data collected', lang)}
            </h2>
            <p>
              {pickLang(
                "Lors de la connexion via Google Sign-In, nous accédons uniquement à votre nom, adresse e-mail et photo de profil publique, dans le seul but de créer et identifier votre compte sur la plateforme.",
                'Al iniciar sesión con Google Sign-In, accedemos únicamente a tu nombre, correo electrónico y foto de perfil pública, con el único fin de crear e identificar tu cuenta en la plataforma.',
                'When signing in with Google Sign-In, we only access your name, email address, and public profile photo, solely to create and identify your account on the platform.',
                lang
              )}
            </p>
            <p className="mt-2">
              {pickLang(
                "Les informations que vous renseignez dans votre profil (secteur, entreprise, besoins, coordonnées de contact) sont stockées dans notre base de données sécurisée (Firebase / Google Cloud) et affichées dans l'annuaire selon vos préférences de visibilité.",
                'La información que completas en tu perfil (sector, empresa, necesidades, datos de contacto) se almacena en nuestra base de datos segura (Firebase / Google Cloud) y se muestra en el directorio según tus preferencias de visibilidad.',
                'Information you enter in your profile (sector, company, needs, contact details) is stored in our secure database (Firebase / Google Cloud) and displayed in the directory according to your visibility preferences.',
                lang
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang("3. Utilisation des données", '3. Uso de datos', '3. Use of data', lang)}
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>
                {pickLang(
                  'Création et gestion de votre compte',
                  'Creación y gestión de tu cuenta',
                  'Creating and managing your account',
                  lang
                )}
              </li>
              <li>
                {pickLang(
                  "Affichage de votre fiche dans l'annuaire public",
                  'Mostrar tu perfil en el directorio público',
                  'Displaying your profile in the public directory',
                  lang
                )}
              </li>
              <li>
                {pickLang(
                  'Facilitation des mises en relation entre membres',
                  'Facilitar conexiones entre miembros',
                  'Facilitating introductions between members',
                  lang
                )}
              </li>
              <li>
                {pickLang(
                  'Amélioration de la plateforme (statistiques anonymes)',
                  'Mejorar la plataforma (estadísticas anónimas)',
                  'Improving the platform (anonymous analytics)',
                  lang
                )}
              </li>
            </ul>
            <p className="mt-2">
              {pickLang(
                'Vos données ne sont jamais vendues ni partagées avec des tiers à des fins commerciales.',
                'Tus datos nunca se venden ni se comparten con terceros con fines comerciales.',
                'Your data is never sold or shared with third parties for commercial purposes.',
                lang
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang('4. Conservation', '4. Conservación', '4. Retention', lang)}
            </h2>
            <p>
              {pickLang(
                "Vos données sont conservées tant que votre compte est actif. Vous pouvez demander la suppression de votre compte et de vos données à tout moment en nous contactant à l'adresse indiquée ci-dessous.",
                'Tus datos se conservan mientras tu cuenta esté activa. Puedes solicitar la eliminación de tu cuenta y tus datos en cualquier momento contactándonos en la dirección indicada abajo.',
                'Your data is retained as long as your account is active. You can request deletion of your account and data at any time by contacting us at the address below.',
                lang
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang('5. Vos droits', '5. Tus derechos', '5. Your rights', lang)}
            </h2>
            <p>
              {pickLang(
                "Conformément aux lois applicables, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous à : ",
                'De acuerdo con las leyes aplicables, tienes derecho de acceso, rectificación y eliminación de tus datos personales. Para ejercer estos derechos, contáctanos en: ',
                'Under applicable laws, you have the right to access, rectify, and delete your personal data. To exercise these rights, contact us at: ',
                lang
              )}
              <a href="mailto:contact@franconetwork.app" className="text-blue-600 underline">
                contact@franconetwork.app
              </a>
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang('6. Cookies', '6. Cookies', '6. Cookies', lang)}
            </h2>
            <p>
              {pickLang(
                "La plateforme utilise uniquement des cookies fonctionnels nécessaires à l'authentification et à la session utilisateur. Aucun cookie publicitaire n'est déposé.",
                'La plataforma utiliza únicamente cookies funcionales necesarias para la autenticación y la sesión del usuario. No se instalan cookies publicitarias.',
                'The platform only uses functional cookies required for authentication and user sessions. No advertising cookies are set.',
                lang
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-stone-800">
              {pickLang('7. Contact', '7. Contacto', '7. Contact', lang)}
            </h2>
            <p>
              {pickLang(
                "Annuaire d'Affaires de Guadalajara — franconetwork.app",
                'Directorio de Negocios de Guadalajara — franconetwork.app',
                'Guadalajara business directory — franconetwork.app',
                lang
              )}
              <br />
              {pickLang('E-mail : ', 'Correo: ', 'Email: ', lang)}
              <a href="mailto:contact@franconetwork.app" className="text-blue-600 underline">
                contact@franconetwork.app
              </a>
            </p>
          </div>
        </section>

        <p className="mt-10 text-xs text-stone-500">
          <Link to="/legal/privacy" className="underline underline-offset-2 hover:text-stone-700">
            {pickLang(
              'Version détaillée (LFPDPPP)',
              'Versión detallada (LFPDPPP)',
              'Detailed version (LFPDPPP)',
              lang
            )}
          </Link>
        </p>
      </div>
    </>
  );
}
