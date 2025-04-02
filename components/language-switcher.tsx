"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { type Language, getLanguageName } from "@/lib/i18n/dictionaries"
import { useEffect, useState } from "react"

interface LanguageSwitcherProps {
  currentLanguage: Language
  onLanguageChange: (language: Language) => void
}

// Map of language codes to flag emojis
const languageFlags: Record<Language, string> = {
  pt: "🇧🇷",
  en: "🇺🇸",
  es: "🇪🇸",
}

export default function LanguageSwitcher({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="px-2 min-w-0">
        <span className="text-lg">🏳️</span>
        <span className="sr-only">Toggle language</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2 min-w-0">
          <span className="text-lg">{languageFlags[currentLanguage]}</span>
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(["pt", "en", "es"] as Language[]).map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => onLanguageChange(lang)}
            className={`flex items-center gap-2 ${currentLanguage === lang ? "bg-accent" : ""}`}
          >
            <span className="text-base">{languageFlags[lang]}</span>
            <span>{getLanguageName(lang)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

