/**
 * Design system minimaliste — annuaire Guadalajara.
 * Palette : fond slate-50, texte slate-900, CTA blue-700, secondaires emerald / amber.
 * Typo : Inter (déjà chargée dans index.css).
 */

import React from 'react';

// ——— Button ———

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-700',
    secondary:
      'border border-blue-700 text-blue-700 bg-transparent hover:bg-blue-50 focus:ring-blue-700',
  };

  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// ——— Titres & texte ———

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  level?: 1 | 2 | 3;
};

export const Heading: React.FC<HeadingProps> = ({
  level = 1,
  className = '',
  children,
  ...props
}) => {
  const styles: Record<1 | 2 | 3, string> = {
    1: 'text-3xl font-semibold text-slate-900 md:text-4xl',
    2: 'text-2xl font-semibold text-slate-900',
    3: 'text-lg font-medium text-slate-900 md:text-xl',
  };
  const cls = `${styles[level]} ${className}`.trim();
  if (level === 1) {
    return (
      <h1 className={cls} {...props}>
        {children}
      </h1>
    );
  }
  if (level === 2) {
    return (
      <h2 className={cls} {...props}>
        {children}
      </h2>
    );
  }
  return (
    <h3 className={cls} {...props}>
      {children}
    </h3>
  );
};

export const BodyText: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <p
    className={`text-sm leading-relaxed text-slate-700 md:text-base ${className}`}
    {...props}
  >
    {children}
  </p>
);

// ——— Tags ———

type TagProps = {
  variant?: 'sector' | 'opportunity';
  children: React.ReactNode;
  className?: string;
};

export const Tag: React.FC<TagProps> = ({
  variant = 'sector',
  children,
  className = '',
}) => {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  const variants = {
    sector: 'bg-slate-100 text-slate-700',
    opportunity: 'bg-emerald-50 text-emerald-700',
  };

  return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>;
};

// ——— Cards ———

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div
    className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}
  >
    {children}
  </div>
);

type MemberCardProps = {
  name: string;
  company: string;
  role?: string;
  sectors?: string[];
};

export const MemberCard: React.FC<MemberCardProps> = ({
  name,
  company,
  role,
  sectors = [],
}) => (
  <Card className="space-y-2">
    <div>
      <h3 className="text-base font-semibold text-slate-900">{name}</h3>
      <p className="text-sm text-slate-600">
        {company}
        {role ? ` · ${role}` : null}
      </p>
    </div>
    {sectors.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {sectors.map((s) => (
          <Tag key={s} variant="sector">
            {s}
          </Tag>
        ))}
      </div>
    )}
  </Card>
);

type OpportunityCardProps = {
  title: string;
  description: string;
  typeLabel?: string;
};

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  title,
  description,
  typeLabel = 'Opportunité',
}) => (
  <Card className="space-y-2">
    <div className="flex items-start justify-between gap-2">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <Tag variant="opportunity">{typeLabel}</Tag>
    </div>
    <BodyText className="line-clamp-3 text-sm text-slate-600">{description}</BodyText>
  </Card>
);

// ——— Inputs ———

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const SearchInput: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input
    type="search"
    className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-1 ${className}`}
    {...props}
  />
);

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const SectorSelect: React.FC<SelectProps> = ({
  className = '',
  children,
  ...props
}) => (
  <select
    className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-1 ${className}`}
    {...props}
  >
    {children}
  </select>
);

// ——— Exemple de section (documentation / prototypage) ———

export const DirectoryExampleSection: React.FC = () => {
  return (
    <section className="mx-auto max-w-5xl space-y-6 bg-slate-50 px-4 py-8">
      <Heading level={1}>Communauté d’affaires francophone de Guadalajara</Heading>
      <BodyText>
        Découvrez les entreprises et membres déjà inscrits, filtrez par secteur, profil ou
        localisation, puis explorez les premiers profils suggérés.
      </BodyText>

      <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
        <SearchInput placeholder="Rechercher une entreprise, un membre, un secteur…" />
        <SectorSelect defaultValue="">
          <option value="">Tous les secteurs</option>
          <option value="agro">Agroalimentaire</option>
          <option value="industrie">Industrie</option>
          <option value="services">Services</option>
          <option value="tech">Tech / digital</option>
        </SectorSelect>
      </div>

      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <BodyText className="text-xs text-slate-500 md:text-sm">
          Astuce : complétez votre profil pour apparaître plus souvent dans les résultats.
        </BodyText>
        <Button variant="primary">Créer mon profil</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MemberCard
          name="Gregory Prudhommeaux"
          company="La Despensería / Conseil"
          role="Développement international"
          sectors={['Agroalimentaire', 'Sourcing', 'F&B']}
        />
        <OpportunityCard
          title="Recherche fournisseurs F&B francophones à Guadalajara"
          description="Entreprise basée à Guadalajara recherchant des partenaires F&B francophones pour développer une offre premium auprès des hôtels et restaurants de la ville."
          typeLabel="Opportunité"
        />
      </div>
    </section>
  );
};
