"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function SimpleLanguageSwitcher() {
  const [language, setLanguage] = useState("en")

  useEffect(() => {
    const saved = localStorage.getItem("language") || "en"
    setLanguage(saved)
  }, [])

  const toggleLanguage = () => {
    const newLang = language === "en" ? "zh" : "en"
    setLanguage(newLang)
    localStorage.setItem("language", newLang)

    // 简单的页面刷新来应用语言变化
    window.location.reload()
  }

  return (
    <Button onClick={toggleLanguage} variant="outline" size="sm" className="h-8 px-3">
      {language === "en" ? "🇺🇸 EN" : "🇨🇳 中文"}
    </Button>
  )
}
