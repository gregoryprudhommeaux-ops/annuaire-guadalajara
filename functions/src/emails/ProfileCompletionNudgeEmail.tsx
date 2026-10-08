import { Button, Heading, Section, Text } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

export type ProfileCompletionNudgeEmailProps = {
  displayName: string;
  completionRate: number;
  isValidated: boolean | null;
  appUrl: string;
  lang: 'fr' | 'es' | 'en';
};

type Copy = {
  preview: string;
  hello: string;
  status: string;
  why: string;
  how: string;
  cta: string;
  close: string;
  sign: string;
};

function copyFor(
  lang: 'fr' | 'es' | 'en',
  completionRate: number,
  isValidated: boolean | null
): Copy {
  const needsFill = completionRate < 100;
  const awaitingValidation = !needsFill && isValidated === false;

  if (lang === 'es') {
    if (awaitingValidation) {
      return {
        preview: 'Revisa tu ficha FrancoNetwork antes de la validación',
        hello: 'Hola',
        status: 'Tu perfil está completo en lo básico.',
        why: 'Antes de publicarlo en el directorio, conviene releer foto, actividad y qué buscas. Es lo que usan los demás para decidir si te escriben.',
        how: 'Abre tu ficha, ajusta lo que falte o suene vago, y guarda. Nosotros nos encargamos de la validación.',
        cta: 'Revisar mi perfil',
        close: 'Si algo no está claro, responde a este correo.',
        sign: '— Gregory',
      };
    }
    return {
      preview: 'Tu ficha FrancoNetwork todavía se puede mejorar',
      hello: 'Hola',
      status: `Tu perfil está al ${completionRate}%.`,
      why: 'En el directorio, la gente escribe sobre todo a fichas claras: foto, actividad, y qué buscas. Si eso falta, te ven menos y te contactan menos.',
      how: 'Diez minutos bastan para subir la ficha. Completa lo esencial y guarda.',
      cta: 'Completar mi perfil',
      close: 'Si algo no está claro, responde a este correo.',
      sign: '— Gregory',
    };
  }

  if (lang === 'en') {
    if (awaitingValidation) {
      return {
        preview: 'Review your FrancoNetwork profile before validation',
        hello: 'Hi',
        status: 'Your profile looks complete on the basics.',
        why: 'Before it shows in the directory, it helps to re-read photo, activity, and what you are looking for. That is what people use when they decide to write you.',
        how: 'Open your profile, tighten anything thin or vague, and save. We handle validation from there.',
        cta: 'Review my profile',
        close: 'If something is unclear, reply to this email.',
        sign: '— Gregory',
      };
    }
    return {
      preview: 'Your FrancoNetwork profile can still go further',
      hello: 'Hi',
      status: `Your profile is at ${completionRate}%.`,
      why: 'In the directory, people mostly reach out to clear profiles: photo, what you do, and what you are looking for. Without that, you stay harder to find and harder to contact.',
      how: 'Ten minutes is enough to raise the profile. Fill in the essentials and save.',
      cta: 'Complete my profile',
      close: 'If something is unclear, reply to this email.',
      sign: '— Gregory',
    };
  }

  if (awaitingValidation) {
    return {
      preview: 'Relisez votre fiche FrancoNetwork avant validation',
      hello: 'Bonjour',
      status: 'Votre profil est rempli sur l’essentiel.',
      why: 'Avant publication dans l’annuaire, relisez photo, activité et ce que vous cherchez. C’est ce que les autres regardent pour décider de vous écrire.',
      how: 'Ouvrez votre fiche, resserrez ce qui reste flou, enregistrez. La validation, on s’en charge ensuite.',
      cta: 'Relire mon profil',
      close: 'Si un point bloque, répondez à cet email.',
      sign: '— Gregory',
    };
  }

  return {
    preview: 'Votre fiche FrancoNetwork peut encore avancer',
    hello: 'Bonjour',
    status: `Votre profil est à ${completionRate} %.`,
    why: 'Dans l’annuaire, les membres contactent surtout les fiches claires : photo, activité, et ce que vous cherchez. Sans ça, on vous trouve moins, et on vous écrit moins.',
    how: 'Dix minutes suffisent pour faire monter la fiche. Complétez l’essentiel et enregistrez.',
    cta: 'Compléter mon profil',
    close: 'Si un point bloque, répondez à cet email.',
    sign: '— Gregory',
  };
}

export function ProfileCompletionNudgeEmail({
  displayName,
  completionRate,
  isValidated,
  appUrl,
  lang,
}: ProfileCompletionNudgeEmailProps) {
  const c = copyFor(lang, completionRate, isValidated);
  const editUrl = `${appUrl.replace(/\/$/, '')}/profile/edit`;
  return (
    <EmailLayout preview={c.preview} appUrl={appUrl}>
      <Heading className="mb-3 mt-2 text-xl font-extrabold text-stone-900">
        {c.hello} {displayName},
      </Heading>
      <Text className="text-stone-700 leading-relaxed">{c.status}</Text>
      <Text className="text-stone-700 leading-relaxed">{c.why}</Text>
      <Text className="text-stone-700 leading-relaxed">{c.how}</Text>
      <Section className="my-6 text-center">
        <Button
          href={editUrl}
          className="rounded-lg bg-[#01696f] px-5 py-3 text-sm font-bold text-white"
        >
          {c.cta}
        </Button>
      </Section>
      <Text className="text-stone-700 leading-relaxed">{c.close}</Text>
      <Text className="mb-0 mt-4 text-stone-700">{c.sign}</Text>
    </EmailLayout>
  );
}

export function profileCompletionNudgeSubject(
  lang: 'fr' | 'es' | 'en',
  completionRate: number,
  isValidated: boolean | null = null
): string {
  const awaitingValidation = completionRate >= 100 && isValidated === false;
  if (lang === 'es') {
    return awaitingValidation
      ? 'Revisa tu ficha FrancoNetwork'
      : `Tu perfil FrancoNetwork está al ${completionRate}%`;
  }
  if (lang === 'en') {
    return awaitingValidation
      ? 'Review your FrancoNetwork profile'
      : `Your FrancoNetwork profile is at ${completionRate}%`;
  }
  return awaitingValidation
    ? 'Relisez votre fiche FrancoNetwork'
    : `Votre profil FrancoNetwork est à ${completionRate} %`;
}

export default ProfileCompletionNudgeEmail;
