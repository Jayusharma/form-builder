import { Metadata } from "next";
import { LogsViewer } from "@/components/logs/LogsViewer";
import { getDictionary } from "@/lib/dictionary";

export interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.locale === 'es' ? 'es' : 'en');
  
  return {
    title: dict.logs.metadata.title,
    description: dict.logs.metadata.description,
  };
}

export default async function LogsPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const dict = await getDictionary(resolvedParams.locale === 'es' ? 'es' : 'en');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
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