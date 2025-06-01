import type { Locale } from '@/app/i18n.config'

let dictionaries: { [key: string]: () => Promise<any> } = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  es: () => import('@/dictionaries/es.json').then((module) => module.default),
}

export const getClientDictionary = async (locale: Locale) => {
  if (!dictionaries[locale]) {
    console.warn(`Dictionary for locale ${locale} not found, falling back to English`);
    return dictionaries.en();
  }
  return dictionaries[locale]();
} 