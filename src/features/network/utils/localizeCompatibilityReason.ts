import type { CompatibilityReason } from '../types/compatibility';

export function localizeCompatibilityReason(
  reason: CompatibilityReason,
  t: (k: string) => string
): string {
  switch (reason) {
    case 'Besoin compatible':
      return t('network.compatReason.needMatch');
    case 'Peut vous aider':
      return t('network.compatReason.canHelp');
    case 'Même secteur':
      return t('network.compatReason.sameSector');
    case 'Même ville':
      return t('network.compatReason.sameCity');
    case 'Passion commune':
      return t('network.compatReason.passion');
    case 'Ouvert au mentorat':
      return t('network.compatReason.mentoring');
    case 'Mots-clés proches':
      return t('network.compatReason.keywords');
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}
