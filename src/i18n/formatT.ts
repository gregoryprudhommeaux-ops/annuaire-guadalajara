import type { TranslateParams } from './LanguageProvider';

export function formatT(
  t: (key: string, params?: TranslateParams) => string,
  key: string,
  params: Record<string, string | number>
): string {
  return t(key, params);
}

