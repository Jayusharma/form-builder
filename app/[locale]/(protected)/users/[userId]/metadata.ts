import { getDictionary } from "@/lib/dictionary";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const dict = await getDictionary(params.locale === 'es' ? 'es' : 'en');
  
  return {
    title: dict.userEdit.metadata.title,
    description: dict.userEdit.metadata.description,
  };
} 