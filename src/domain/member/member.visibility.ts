import type { Member, ProfileRole } from './member.types';

export type VisibilityProjection = 'public' | 'member' | 'admin';

export function projectMemberVisibility(
  member: Member,
  projection: VisibilityProjection
): Member {
  if (projection === 'admin') return member;

  const hideEmail = projection === 'public' && !member.visibility.emailPublic;
  const hideWhatsapp = projection === 'public' && !member.visibility.whatsappPublic;

  return {
    ...member,
    email: hideEmail ? undefined : member.email,
    whatsapp: hideWhatsapp ? undefined : member.whatsapp,
  };
}

export function projectionForViewerRole(role: ProfileRole | 'guest'): VisibilityProjection {
  if (role === 'admin') return 'admin';
  if (role === 'member') return 'member';
  return 'public';
}

