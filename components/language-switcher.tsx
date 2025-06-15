"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useState } from "react"

const languages = [
  { code: "en" as const, name: "English", flag: "🇺🇸" },
  { code: "zh" as const, name: "中文", flag: "🇨🇳" },
]

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const getCurrentLanguage = () => {
    return languages.find((lang) => lang.code === language) || languages[0]
  }

  const handleLanguageChange = (langCode: "en" | "zh") => {
    setLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-8 min-w-[80px] hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label={`Current language: ${getCurrentLanguage().name}. Click to change language.`}
        >
          <Globe className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline text-xs">{getCurrentLanguage().flag}</span>
          <span className="hidden md:inline text-sm font-medium">{getCurrentLanguage().name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 z-50">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer hover:bg-accent focus:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
            </div>
            {language === lang.code && <Check className="h-4 w-4 text-green-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
