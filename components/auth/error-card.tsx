"use client";

import { BackButton } from "@/components/auth/BackButton";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { useDictionary } from "@/hooks/useDictionary";
import { useParams } from "next/navigation";

export default function ErrorCard() {
  const dict = useDictionary();
  const { locale } = useParams();

  return (
    <Card className="p-5 w-[400px] shadow-md gap-20">
      <CardHeader className="flex justify-center w-full">
        <p className="flex justify-center text-2xl">{dict.auth.error.title}</p>
      </CardHeader>
      <CardFooter>
        <BackButton href={`/${locale}/auth/login` as `/${string}${string}`} label={dict.auth.error.backToLogin} />
      </CardFooter>
    </Card>
  );
}