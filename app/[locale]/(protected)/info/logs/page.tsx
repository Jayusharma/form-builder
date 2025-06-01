import { Metadata } from "next";
import { LogsViewer } from "@/components/logs/LogsViewer";
import { getDictionary } from "@/lib/dictionary";
import { Locale } from "@/lib/i18n-config";

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' }
  ];
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const dict = await getDictionary(params.locale);
  
  return {
    title: dict.logs.metadata.title,
    description: dict.logs.metadata.description,
  };
}

export default async function LogsPage(props: PageProps) {
  const params = await props.params;
  const dict = await getDictionary(params.locale);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.logs.title}</h1>
          <p className="text-muted-foreground">
            {dict.logs.description}
          </p>
        </div>
      </div>
      <LogsViewer />
    </div>
  );
} 