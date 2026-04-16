import type { Member } from '../domain/member/member.types';

export const SAMPLE_MEMBERS: Member[] = [
  {
    id: 'member_001',
    slug: 'camille-dupont',
    identity: {
      id: 'member_001',
      slug: 'camille-dupont',
      fullName: 'Camille Dupont',
      photoUrl: 'https://example.com/photo.jpg',
      bio: 'Consultante B2B basée à Guadalajara.',
      workLanguages: ['fr', 'es'],
      arrivalYearInMexico: 2019,
    },
    contact: {
      email: 'camille@example.com',
      phoneWhatsapp: '+5213312345678',
      linkedinUrl: 'https://www.linkedin.com/in/camille-dupont/',
      preferredContactText: 'WhatsApp',
      preferredContactChannels: ['whatsapp'],
    },
    company: {
      id: 'company_001',
      name: 'Dupont Consulting',
      sector: 'consulting_services',
      website: 'https://dupont.example.com',
      roleInCompany: 'strategy_corporate',
      location: { city: 'guadalajara', state: 'Jalisco', country: 'Mexico' },
      companyType: 'independent',
      professionalStatus: 'freelance',
      typicalClientSizes: ['sme', 'corporate_enterprise'],
      activityDescription: 'Conseil en stratégie et développement commercial.',
    },
    networkProfile: {
      lookingForText: 'Trouver des partenaires et clients à Guadalajara.',
      helpOfferText: 'Mise en relation avec l’écosystème business local.',
      currentNeeds: [
        {
          id: 'NEED_PARTNERS',
          memberId: 'member_001',
          title: 'Partenaires commerciaux / stratégiques',
          categories: ['strategic_partners'],
          visibility: 'members',
          status: 'active',
          highlighted: true,
        },
      ],
      keywords: ['B2B', 'Mexico', 'Go-to-market'],
      hobbies: ['golf', 'travel'],
      openness: ['mentorship', 'event_cocreation'],
      searchableSectors: ['consulting_services'],
    },
    visibility: {
      contact: { emailPublic: false, phonePublic: true },
      internalOnly: {},
    },
    publicProfileCompleted: true,
    profileCompletionPercent: 100,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];
