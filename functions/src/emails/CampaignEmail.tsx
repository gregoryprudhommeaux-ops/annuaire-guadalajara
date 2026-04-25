import { Heading, Section } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

export type CampaignEmailProps = {
  /** Titre interne (utilisé pour la prévisualisation) */
  title: string;
  /** HTML libre saisi par l'admin (rendu dans un conteneur stylé par Tailwind). */
  bodyHtml: string;
  appUrl: string;
};

export function CampaignEmail({ title, bodyHtml, appUrl }: CampaignEmailProps) {
  return (
    <EmailLayout preview={title} appUrl={appUrl}>
      <Heading className="mb-3 mt-2 text-xl font-extrabold text-stone-900">
        {title}
      </Heading>
      <Section>
        <div
          className="prose prose-stone max-w-none text-stone-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </Section>
    </EmailLayout>
  );
}

export default CampaignEmail;
