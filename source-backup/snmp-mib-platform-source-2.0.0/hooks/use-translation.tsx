"use client"

import { useLanguage } from "@/contexts/language-context"

export function useTranslation() {
  const { language, setLanguage, t } = useLanguage()

  return {
    language,
    setLanguage,
    t,
  }
}
