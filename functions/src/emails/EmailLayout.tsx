import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

export type EmailLayoutProps = {
  preview: string;
  children: React.ReactNode;
  appUrl: string;
};

/** Coque commune (header simple + footer) pour tous les emails sortants. */
export function EmailLayout({ preview, children, appUrl }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-stone-50 font-sans">
          <Container className="mx-auto my-6 max-w-xl rounded-2xl bg-white p-8 shadow-sm">
            <Section>
              <Text className="m-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[#01696f]">
                FrancoNetwork · Guadalajara
              </Text>
            </Section>
            <Section className="mt-3">{children}</Section>
            <Hr className="border-stone-200" />
            <Section>
              <Text className="m-0 text-xs text-stone-500">
                Vous recevez ce message en tant que membre du réseau d&apos;affaires
                francophone de Guadalajara.
                {' · '}
                <a href={appUrl} className="text-[#01696f]">
                  {appUrl.replace(/^https?:\/\//, '')}
                </a>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default EmailLayout;
