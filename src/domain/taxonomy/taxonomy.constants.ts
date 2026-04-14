import type { Language } from '../../types';
import { NEED_OPTIONS, NEED_OPTION_VALUE_SET, needOptionLabel } from '../../needOptions';
import {
  PASSIONS_CATEGORIES,
  PASSION_OPTION_ID_SET,
  getPassionCategoryLabel,
  getPassionEmoji,
  getPassionLabel,
} from '../../lib/passionConfig';
import type { Hobby, Need, NeedCategory, NeedId } from './taxonomy.types';

export const NEED_ID_SET = NEED_OPTION_VALUE_SET;

export function isNeedId(x: unknown): x is NeedId {
  return typeof x === 'string' && NEED_ID_SET.has(x);
}

export function getNeedLabel(id: NeedId, lang: Language): string {
  return needOptionLabel(id, lang);
}

export function listNeedCategories(): NeedCategory[] {
  return NEED_OPTIONS.map((group) => ({
    id: group.label.en.toLowerCase().replace(/\s+/g, '_'),
    label: group.label,
  }));
}

export function listNeeds(): Need[] {
  const out: Need[] = [];
  for (const group of NEED_OPTIONS) {
    const categoryId = group.label.en.toLowerCase().replace(/\s+/g, '_');
    for (const opt of group.options) {
      out.push({
        id: opt.value,
        label: opt.label,
        categoryId,
      });
    }
  }
  return out;
}

export const HOBBY_ID_SET = PASSION_OPTION_ID_SET;

export function isHobbyId(x: unknown): x is string {
  return typeof x === 'string' && HOBBY_ID_SET.has(x);
}

export function listHobbies(): Hobby[] {
  const out: Hobby[] = [];
  for (const cat of PASSIONS_CATEGORIES) {
    for (const opt of cat.options) {
      out.push({
        id: opt.id,
        label: opt.label,
        categoryId: cat.id,
        categoryEmoji: cat.emoji,
      });
    }
  }
  return out;
}

export function hobbyLabel(id: string, lang: Language): string {
  return getPassionLabel(id, lang);
}

export function hobbyEmoji(id: string): string {
  return getPassionEmoji(id);
}

export function hobbyCategoryLabel(categoryId: string, lang: Language): string {
  return getPassionCategoryLabel(categoryId, lang);
}

