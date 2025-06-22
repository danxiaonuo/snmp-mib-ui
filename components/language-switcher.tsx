"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Languages, Globe } from "lucide-react"

type Language = "en" | "zh"

interface LanguageItem {
  code: Language
  name: string
  flag: string
}

const languages: LanguageItem[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
]

export function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && ["en", "zh"].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage)
      // Update HTML lang attribute
      document.documentElement.lang = savedLanguage
    }
  }, [])

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language)
    localStorage.setItem("language", language)
    
    // Update HTML lang attribute
    document.documentElement.lang = language
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent("languageChange", { detail: language }))
    
    // Force page reload to apply language changes
    window.location.reload()
  }

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Globe className="h-4 w-4 mr-1" />
          <span className="text-sm">{currentLang.flag}</span>
          <span className="text-sm ml-1">{currentLang.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center gap-2 ${
              currentLanguage === language.code ? "bg-accent" : ""
            }`}
          >
            <span>{language.flag}</span>
            <span>{language.name}</span>
            {currentLanguage === language.code && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageSwitcher