import { GridFormBuilder } from '@/components/forms/GridFormBuilder';
import { getDictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n-config';

export interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const [resolvedParams] = await Promise.all([params, searchParams]);
  const dict = await getDictionary(resolvedParams.locale);
  return <GridFormBuilder dict={dict.formBuilder} />;
} 