"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { i18n } from '@/lib/i18n-config';
import type { Locale } from '@/lib/i18n-config';
import { getClientDictionary } from '@/lib/client-dictionary';
import type { Dictionary } from '@/types/dictionary';

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);

  // Get the current locale from the pathname
  const currentLocale = pathname.split('/')[1];
  const isValidLocale = i18n.locales.includes(currentLocale as Locale);
  
  // Use current locale if valid, otherwise default
  const locale = isValidLocale ? (currentLocale as Locale) : i18n.defaultLocale;

  useEffect(() => {
    const loadDictionary = async () => {
      const dict = await getClientDictionary(locale);
      setDictionary(dict);
    };
    loadDictionary();
  }, [locale]);

  if (!dictionary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-[400px] border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{dictionary.notFound.title}</CardTitle>
          <CardDescription>
            {dictionary.notFound.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button 
            variant="default" 
            onClick={() => router.push(`/${locale}`)}
          >
            {dictionary.notFound.returnHome}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 