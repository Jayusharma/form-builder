import { getDictionary } from '@/lib/dictionary'
import { Locale } from '@/lib/i18n-config'

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home(props: PageProps) {
  const params = await props.params;
  const dict = await getDictionary(params.locale);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold">{dict.common.welcome}</h1>
      </div>
    </main>
  )
} 