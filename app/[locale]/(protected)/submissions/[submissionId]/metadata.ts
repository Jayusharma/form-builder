import { getDictionary } from "@/lib/dictionary";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const dict = await getDictionary(params.locale === 'es' ? 'es' : 'en');
  
  return {
    title: dict.submissions.metadata.title,
    description: dict.submissions.metadata.description,
  };
} 