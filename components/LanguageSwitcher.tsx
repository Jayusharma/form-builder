"use client"

import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { i18n } from "@/app/i18n.config"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Languages } from "lucide-react"

type LanguageCode = typeof i18n.locales[number]

const languageNames: Record<LanguageCode, string> = {
  en: "English",
  es: "Español"
} as const

export default function LanguageSwitcher() {
  const pathname = usePathname()
  const { locale } = useParams()

  const redirectedPathname = (locale: string): `/${string}` => {
    if (!pathname) return "/" as `/${string}`
    const segments = pathname.split("/")
    segments[1] = locale
    return segments.join("/") as `/${string}`
  }

  const currentLocale = (locale || i18n.defaultLocale) as LanguageCode
  const currentLanguageName = languageNames[currentLocale] || currentLocale.toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          <span>{currentLanguageName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {i18n.locales.map((locale) => (
          <DropdownMenuItem key={locale} asChild>
            <Link
              href={redirectedPathname(locale)}
              className="cursor-pointer w-full font-medium"
            >
              {languageNames[locale as LanguageCode] || locale.toUpperCase()}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 