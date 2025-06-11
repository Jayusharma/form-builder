import type { Dictionary } from '@/types/dictionary';

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  en: () => import('../dictionaries/en.json').then((module) => module.default as unknown as Dictionary),
  es: () => import('../dictionaries/es.json').then((module) => module.default as unknown as Dictionary),
};

export const getClientDictionary = async (locale: string): Promise<Dictionary> => {
  if (!dictionaries[locale]) {
    throw new Error(`Dictionary for locale '${locale}' not found`);
  }
  return dictionaries[locale]();
};