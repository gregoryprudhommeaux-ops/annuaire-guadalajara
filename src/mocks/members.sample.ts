import type { Member } from '../domain/member/member.types';

export const SAMPLE_MEMBERS: Member[] = [
  {
    id: 'member_001',
    role: 'member',
    fullName: 'Camille Dupont',
    email: 'camille@example.com',
    whatsapp: '+5213312345678',
    linkedin: 'https://www.linkedin.com/in/camille-dupont/',
    photoUrl: 'https://example.com/photo.jpg',
    languages: ['fr', 'es'],
    location: { city: 'Guadalajara', state: 'Jalisco', country: 'Mexico' },
    primaryCompany: {
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
    companies: [],
    highlightedNeedIds: ['NEED_CLIENTS', 'NEED_PARTNERS'],
    hobbyIds: ['golf', 'voyage'],
    keywords: ['B2B', 'Mexico', 'Go-to-market'],
    contactPreferenceCta: 'WhatsApp',
    communityGoal: 'Trouver des partenaires et clients à Guadalajara.',
    helpNewcomers: 'Mise en relation avec l’écosystème business local.',
    visibility: {
      contact: { emailPublic: false, phonePublic: true },
      internalOnly: {},
    },
    openness: { openToMentoring: true, openToTalks: false, openToEvents: true },
    createdAtMs: Date.now() - 10 * 24 * 60 * 60 * 1000,
    lastSeenMs: Date.now() - 60 * 60 * 1000,
    validated: true,
    completion: { percent: 87, missingTopKeys: ['preferredContact', 'passions'] },
  },
];

