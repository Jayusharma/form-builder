'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Locale } from '@/lib/i18n-config';
import type { Dictionary } from '@/types/dictionary';
import enDict from '@/dictionaries/en.json';
import esDict from '@/dictionaries/es.json';

const dictionaries: { [key in Locale]: Dictionary } = {
  en: enDict,
  es: esDict,
};

/**
 * Hook to access dictionary translations on the client side
 * Uses pre-imported dictionaries to avoid dynamic imports
 * 
 * @returns {Dictionary} The dictionary object for the current locale
 */
export function useDictionary(): Dictionary {
  const params = useParams();
  const locale = (params?.locale as Locale) || 'en';
  const [dictionary, setDictionary] = useState<Dictionary>(dictionaries[locale] || dictionaries.en);

  useEffect(() => {
    setDictionary(dictionaries[locale] || dictionaries.en);
  }, [locale]);

  return dictionary;
} 