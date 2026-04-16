import { EN } from '@/i18n/en';

const shell = {
  nav: {
    home: 'Home',
    network: 'Network',
    requests: 'Requests',
    radar: 'Radar',
    myProfile: 'My profile',
    admin: 'Admin',
    backHome: 'Back to home',
  },
  network: {
    search: {
      eyebrow: 'SEARCH',
      memberCompanyNeedAria: 'Search for a member, company, or need',
    },
    recommendations: {
      eyebrow: 'RECOMMENDATIONS',
      title: 'Recommended profiles for you',
      subtitle:
        'Profiles whose needs clearly overlap your activity (green callout) are listed first, then other affinities.',
      aria: 'Recommended profiles for you',
    },
    profileFallback: 'Profile',
    compatLevel: {
      veryRelevant: 'Highly relevant',
      relevant: 'Relevant',
      explore: 'Worth exploring',
      evidentClient: 'Strong lead match',
    },
    compatReason: {
      needMatch: 'Aligned need',
      canHelp: 'Can help you',
      sameSector: 'Same sector',
      sameCity: 'Same city',
      passion: 'Shared passion',
      mentoring: 'Open to mentoring',
      keywords: 'Similar keywords',
    },
    filters: {
      sectorAll: 'Sector',
      profileAll: 'Profile',
      locationAll: 'Locations',
      company: 'Company',
      member: 'Member',
      other: 'Other',
    },
    memberCard: {
      noStructuredNeed: 'No structured needs listed',
      companyUnknown: 'Company not specified',
      sectorUnknown: 'Sector not specified',
      cardAria: 'Profile: {name}',
      bioIncomplete: 'Profile presentation to be completed.',
      currentNeedsLabel: 'CURRENT NEEDS',
      matchTitleStrong: 'They could use your help',
      matchTitleSoft: 'You can probably help',
      matchReasonForNeeds: 'Your profile looks relevant for: {needs}',
    },
    scoreLabel: 'Relevance: {score} of 5',
    recommendedCard: {
      openProfileAria: 'Open profile: {name}',
      saveAria: 'Save for later',
      savedAria: 'Remove from saved',
      labelSaved: 'Saved',
      labelFollow: 'Follow',
      hideRecoAria: 'Stop recommending this profile',
      alreadyKnow: 'I already know them',
      viewProfile: 'View profile',
    },
    savedPanel: {
      title: 'Saved contacts',
      description: 'See profiles you saved and your suggested approach',
      titleEmpty: 'No saved contacts yet',
      openAria: 'Show {count} saved contacts in the directory',
    },
  },
  footer: {
    privacy: 'Privacy policy',
    terms: 'Terms of use',
    contact: 'Contact',
  },
} as const;

export const en = {
  ...EN,
  common: {
    ...EN.common,
    viewProfile: 'View profile',
    learnMore: 'Learn more',
    loading: 'Loading…',
    noResults: 'No results',
    search: 'Search',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
  },
  nav: shell.nav,
  network: shell.network,
  footer: shell.footer,
} as const;
