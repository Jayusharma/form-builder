'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { i18n } from '../i18n-config';

export function useLanguage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get the current locale from the pathname
    const currentLocale = pathname.split('/')[1];
    
    // Check if it's a valid locale
    if (i18n.locales.includes(currentLocale as any)) {
      // Store the locale preference
      localStorage.setItem('preferredLanguage', currentLocale);
    } else {
      // Get stored preference or default to i18n.defaultLocale
      const storedLocale = localStorage.getItem('preferredLanguage') || i18n.defaultLocale;
      
      // Redirect to the correct locale path if we're at the root
      if (!pathname.startsWith(`/${storedLocale}`)) {
        const newPath = `/${storedLocale}${pathname}` as `/${string}`;
        router.push(newPath);
      }
    }
  }, [pathname, router]);

  return null;
} 