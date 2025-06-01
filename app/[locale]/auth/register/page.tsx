"use client";

import type React from "react";
import { RemoveFormatting } from "lucide-react";
import RegisterComp from "@/components/auth/RegisterComp";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function RegisterPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-black dark:text-white lg:flex dark:border-r ">
        <div className="absolute inset-0 bg-sepia" />
        {/* logo and app name  */}
        <div className="relative z-20 flex items-center text-lg font-medium">
          <RemoveFormatting className="mr-2 h-6 w-6" />
          Form Builder
        </div>
      </div>
      <div className="relative">
        <div className="absolute right-4 top-4 md:right-8 md:top-8">
          <LanguageSwitcher />
        </div>
        <RegisterComp />
      </div>
    </div>
  );
}
