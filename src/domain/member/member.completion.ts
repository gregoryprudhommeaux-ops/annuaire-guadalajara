import type { Member } from './member.types';

type CompletionRule = {
  key: string;
  weight: number;
  isComplete: (member: Member) => boolean;
};

const RULES: CompletionRule[] = [
  {
    key: 'fullName',
    weight: 10,
    isComplete: (member) => Boolean(member.identity.fullName?.trim()),
  },
  {
    key: 'email',
    weight: 8,
    isComplete: (member) => Boolean(member.contact.email?.trim()),
  },
  {
    key: 'linkedin',
    weight: 6,
    isComplete: (member) => Boolean(member.contact.linkedinUrl?.trim()),
  },
  {
    key: 'phoneWhatsapp',
    weight: 8,
    isComplete: (member) => Boolean(member.contact.phoneWhatsapp?.trim()),
  },
  {
    key: 'languages',
    weight: 8,
    isComplete: (member) => member.identity.workLanguages.length > 0,
  },
  {
    key: 'bio',
    weight: 10,
    isComplete: (member) => (member.identity.bio?.trim().length ?? 0) >= 15,
  },
  {
    key: 'photo',
    weight: 6,
    isComplete: (member) => Boolean(member.identity.photoUrl?.trim()),
  },
  {
    key: 'companyName',
    weight: 10,
    isComplete: (member) => Boolean(member.company.name?.trim()),
  },
  {
    key: 'sector',
    weight: 8,
    isComplete: (member) => Boolean(member.company.sector),
  },
  {
    key: 'location',
    weight: 6,
    isComplete: (member) => Boolean(member.company.location?.city),
  },
  {
    key: 'activityDescription',
    weight: 8,
    isComplete: (member) =>
      (member.company.activityDescription?.trim().length ?? 0) >= 15,
  },
  {
    key: 'lookingForText',
    weight: 8,
    isComplete: (member) =>
      (member.networkProfile.lookingForText?.trim().length ?? 0) >= 15,
  },
  {
    key: 'helpOfferText',
    weight: 6,
    isComplete: (member) =>
      (member.networkProfile.helpOfferText?.trim().length ?? 0) >= 15,
  },
  {
    key: 'hobbies',
    weight: 4,
    isComplete: (member) => member.networkProfile.hobbies.length >= 1,
  },
  {
    key: 'openness',
    weight: 4,
    isComplete: (member) => member.networkProfile.openness.length >= 1,
  },
];

export type MemberProfileCompletionResult = {
  percent: number;
  completedWeight: number;
  totalWeight: number;
  missingFields: string[];
  isComplete: boolean;
};

export function calculateProfileCompletion(member: Member): MemberProfileCompletionResult {
  const totalWeight = RULES.reduce((sum, rule) => sum + rule.weight, 0);

  const completedWeight = RULES.reduce((sum, rule) => {
    return sum + (rule.isComplete(member) ? rule.weight : 0);
  }, 0);

  const percent = Math.round((completedWeight / totalWeight) * 100);

  const missingFields = RULES.filter((rule) => !rule.isComplete(member)).map((rule) => rule.key);

  return {
    percent,
    completedWeight,
    totalWeight,
    missingFields,
    isComplete: percent >= 100,
  };
}
