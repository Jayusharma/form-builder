import { GridFormBuilder } from '@/components/forms/GridFormBuilder';
import { getDictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n-config';
import { Suspense } from 'react';

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function FormBuilderWrapper({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams
  ]);

  const dict = await getDictionary(resolvedParams.locale);

  return (
    <GridFormBuilder 
      dict={dict.formBuilder} 
      searchParams={resolvedSearchParams}
    />
  );
}

export default function Page(props: PageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FormBuilderWrapper {...props} />
    </Suspense>
  );
} 