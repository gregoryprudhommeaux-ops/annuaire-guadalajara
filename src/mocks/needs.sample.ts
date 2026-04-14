import type { NetworkRequest } from '../domain/need/need.types';

export const SAMPLE_REQUESTS: NetworkRequest[] = [
  {
    id: 'req_001',
    authorId: 'member_001',
    authorName: 'Camille Dupont',
    authorPhotoUrl: 'https://example.com/photo.jpg',
    authorCompany: 'Dupont Consulting',
    text: "Je cherche des recommandations de prestataires IT/cybersécurité à Guadalajara.",
    sector: 'Tech',
    zone: 'Guadalajara',
    productOrService: 'Cybersécurité',
    createdAtMs: Date.now() - 2 * 24 * 60 * 60 * 1000,
    expiresAtMs: Date.now() + 12 * 24 * 60 * 60 * 1000,
  },
];

