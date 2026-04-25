import { Button, Heading, Section, Text } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

export type WeeklyDigestEmailProps = {
  displayName: string;
  completionRate: number;
  appUrl: string;
};

export function WeeklyDigestEmail({
  displayName,
  completionRate,
  appUrl,
}: WeeklyDigestEmailProps) {
  const incomplete = completionRate < 100;
  return (
    <EmailLayout preview="Votre récap hebdo FrancoNetwork" appUrl={appUrl}>
      <Heading className="mb-3 mt-2 text-xl font-extrabold text-stone-900">
        Bonjour {displayName},
      </Heading>
      <Text className="text-stone-700 leading-relaxed">
        Voici le récap hebdo du réseau. Votre profil est complété à{' '}
        <strong>{completionRate}%</strong>.
      </Text>
      {incomplete ? (
        <Section className="my-5 rounded-xl bg-stone-50 p-4">
          <Text className="m-0 text-sm text-stone-700">
            Compléter votre profil augmente sensiblement vos chances d&apos;être
            contacté(e) par les autres membres et d&apos;apparaître dans les
            recommandations du réseau.
          </Text>
        </Section>
      ) : null}
      <Section className="my-6 text-center">
        <Button
          href={`${appUrl}/dashboard`}
          className="rounded-lg bg-[#01696f] px-5 py-3 text-sm font-bold text-white"
        >
          Voir le réseau
        </Button>
      </Section>
      <Text className="text-stone-700 leading-relaxed">
        Bonne semaine, et au plaisir de vous lire dans l&apos;annuaire.
      </Text>
      <Text className="mb-0 mt-4 text-stone-700">— Gregory</Text>
    </EmailLayout>
  );
}

export default WeeklyDigestEmail;
