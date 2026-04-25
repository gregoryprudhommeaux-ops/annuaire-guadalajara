import React, { useEffect, useState } from 'react';
import { Compass, Handshake, Radar } from 'lucide-react';
import type { Language } from '@/types';
import { StatsCard, StatsPrimaryButton, StatsSectionHeader, StatsSectionShell } from '@/components/stats/ui';

type Persona = {
  title: string;
  body: string;
  micro: string;
  cta: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
};

type Copy = {
  eyebrow: string;
  title: string;
  lead: string;
  p1: Persona;
  p2: Persona;
  p3: Persona;
  footer: string;
  brandCta: string;
};

function tcopy(lang: Language): Copy {
  if (lang === 'en') {
    return {
      eyebrow: 'Take action',
      title: 'The network becomes useful when the right profile joins at the right time',
      lead: 'Choose the path that best matches your current situation.',
      p1: {
        title: 'You are growing your business in Mexico',
        body: 'Access qualified contacts, move faster on the ground, and spot the right local relays earlier.',
        micro: 'Built for French-speaking business exchanges in Guadalajara',
        cta: 'Join as a business',
        to: '/inscription',
        Icon: Compass,
      },
      p2: {
        title: 'You are looking for commercial partners',
        body: 'Distributors, deal-bringers, local experts, suppliers: turn your searches into useful connections.',
        micro: 'More targeted than a simple directory',
        cta: 'View opportunities',
        to: '/requests',
        Icon: Handshake,
      },
      p3: {
        title: 'You are already established and want more visibility',
        body: 'Position your profile so you show up in searches and in requests from the community.',
        micro: 'Visible in a qualified community',
        cta: 'Build my presence in the network',
        to: '/inscription',
        Icon: Radar,
      },
      footer:
        'The more relevant profiles join, the more value each new sign-up creates for others.',
      brandCta: 'Join FrancoNetwork',
    };
  }
  if (lang === 'es') {
    return {
      eyebrow: 'Pase a la acción',
      title: 'La red gana en utilidad cuando el perfil adecuado entra en el momento adecuado',
      lead: 'Elija el punto de entrada que mejor encaje con su situación actual.',
      p1: {
        title: 'Desarrolla su actividad en México',
        body: 'Acceda a contactos cualificados, gane tiempo sobre el terreno e identifique antes a los buenos apoyos locales.',
        micro: 'Pensado para el intercambio de negocio francófono en Guadalajara',
        cta: 'Unirse como empresa',
        to: '/inscription',
        Icon: Compass,
      },
      p2: {
        title: 'Busca socios comerciales',
        body: 'Distribuidores, generadores de oportunidades, expertos locales, proveedores: de la búsqueda a la conexión útil.',
        micro: 'Más orientado que un anuario clásico',
        cta: 'Ver oportunidades',
        to: '/requests',
        Icon: Handshake,
      },
      p3: {
        title: 'Ya está implantado y quiere más visibilidad',
        body: 'Posicione su perfil en el buen momento para figurar en las búsquedas y en las demandas de la comunidad.',
        micro: 'Presencia visible en una comunidad cualificada',
        cta: 'Crear mi presencia en la red',
        to: '/inscription',
        Icon: Radar,
      },
      footer:
        'Cuanto más perfiles relevantes atrae la red, más valor aporta cada alta para los demás.',
      brandCta: 'Unirse a FrancoNetwork',
    };
  }
  return {
    eyebrow: 'Passer à l’action',
    title: 'Le réseau devient utile dès que le bon profil entre au bon moment',
    lead: 'Choisissez l’entrée qui correspond le mieux à votre situation actuelle.',
    p1: {
      title: 'Vous développez votre activité au Mexique',
      body: 'Accédez à des contacts qualifiés, gagnez du temps sur le terrain et identifiez plus vite les bons relais locaux.',
      micro: 'Pensé pour les échanges business francophones à Guadalajara',
      cta: 'Rejoindre comme entreprise',
      to: '/inscription',
      Icon: Compass,
    },
    p2: {
      title: 'Vous cherchez des partenaires commerciaux',
      body: 'Distributeurs, apporteurs d’affaires, experts locaux, fournisseurs : le réseau vous aide à transformer vos recherches en connexions utiles.',
      micro: 'Des connexions plus ciblées qu’un annuaire classique',
      cta: 'Voir les opportunités',
      to: '/requests',
      Icon: Handshake,
    },
    p3: {
      title: 'Vous êtes déjà implanté et souhaitez gagner en visibilité',
      body: 'Positionnez votre profil au bon moment pour apparaître dans les recherches et les demandes exprimées par la communauté.',
      micro: 'Une présence visible au sein d’une communauté qualifiée',
      cta: 'Créer ma présence dans le réseau',
      to: '/inscription',
      Icon: Radar,
    },
    footer:
      'Plus le réseau attire de profils pertinents, plus chaque inscription crée de la valeur pour les autres.',
    brandCta: 'Rejoindre FrancoNetwork',
  };
}

type CardProps = {
  persona: Persona;
  index: number;
};

function PersonaCard({ persona, index }: CardProps) {
  const { title, body, micro, cta, to, Icon } = persona;
  return (
    <StatsCard
      className="seg-join-card seg-join-card-anim !flex h-full !flex-col !sm:p-6 overflow-hidden transition motion-safe:hover:border-slate-300/90 motion-safe:hover:shadow-md"
      style={{ animationDelay: `${80 + index * 70}ms` }}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f5f5]/60 text-[#01696f]" aria-hidden>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-extrabold leading-snug text-slate-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{body}</p>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">{micro}</p>
      <div className="mt-4 pt-1">
        <StatsPrimaryButton to={to} className="w-full">
          {cta}
        </StatsPrimaryButton>
      </div>
    </StatsCard>
  );
}

/**
 * Bloc de conversion final segmenté (3 profils) pour la page `/stats`.
 */
export function SegmentedJoinCTA({ lang }: { lang: Language }) {
  const c = tcopy(lang);
  const personas: Persona[] = [c.p1, c.p2, c.p3];
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <section
      className={`seg-join-cta mt-10 print:break-inside-avoid ${
        reveal ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-500 motion-reduce:opacity-100 motion-reduce:duration-0`}
      aria-labelledby="seg-join-cta-title"
    >
      <StatsSectionShell>
        <div className="border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
          <StatsSectionHeader
            eyebrow={c.eyebrow}
            title={c.title}
            titleId="seg-join-cta-title"
            description={c.lead}
          />
        </div>
        <div className="p-4 sm:p-6">

        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((p, i) => (
            <li key={i} className="h-full min-h-0 min-w-0">
              <PersonaCard persona={p} index={i} />
            </li>
          ))}
        </ul>
        </div>

        <div className="border-t border-slate-100 px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-sm leading-relaxed text-slate-700">
            {c.footer}
          </p>
          <div className="mt-4 flex justify-center sm:justify-center print:justify-center">
            <StatsPrimaryButton to="/inscription" className="w-full max-w-md sm:w-auto">
              {c.brandCta}
            </StatsPrimaryButton>
          </div>
        </div>
      </StatsSectionShell>
    </section>
  );
}
