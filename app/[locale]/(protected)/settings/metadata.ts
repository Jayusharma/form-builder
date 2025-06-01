import { getDictionary } from "@/lib/dictionary";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const dict = await getDictionary(params.locale === 'es' ? 'es' : 'en');
  
  return {
    title: dict.settings.metadata.title,
    description: dict.settings.metadata.description,
  };
} 