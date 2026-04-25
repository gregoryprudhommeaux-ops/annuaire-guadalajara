import { Button, Heading, Section, Text } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

export type WelcomeEmailProps = {
  displayName: string;
  appUrl: string;
};

export function WelcomeEmail({ displayName, appUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview="Bienvenue sur FrancoNetwork Guadalajara"
      appUrl={appUrl}
    >
      <Heading className="mb-3 mt-2 text-2xl font-extrabold text-stone-900">
        Bienvenue {displayName} !
      </Heading>
      <Text className="text-stone-700 leading-relaxed">
        Heureux de vous accueillir dans le réseau d&apos;affaires francophone
        de Guadalajara. Pour profiter pleinement des connexions, complétez
        votre profil afin que les autres membres puissent vous identifier et
        vous contacter.
      </Text>
      <Section className="my-6 text-center">
        <Button
          href={`${appUrl}/profil/me`}
          className="rounded-lg bg-[#01696f] px-5 py-3 text-sm font-bold text-white"
        >
          Compléter mon profil
        </Button>
      </Section>
      <Text className="text-stone-700 leading-relaxed">
        Vous avez une question ? Répondez simplement à cet email, je le reçois
        directement.
      </Text>
      <Text className="mb-0 mt-4 text-stone-700">— Gregory</Text>
    </EmailLayout>
  );
}

export default WelcomeEmail;
