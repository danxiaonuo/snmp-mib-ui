"use client"

// 引入语言文件
import enCommon from "@/locales/en/common.json"
import zhCommon from "@/locales/zh/common.json"

export type Language = "en" | "zh"

// 完整的翻译数据
export const translations = {
  en: {
    common: enCommon,
  },
  zh: {
    common: zhCommon,
  },
} as const

// 获取当前语言
export function getCurrentLanguage(): Language {
  if (typeof window === "undefined") return "en"
  
  const saved = localStorage.getItem("language") as Language
  if (saved && ["en", "zh"].includes(saved)) {
    return saved
  }
  
  // 检测浏览器语言
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.includes("zh")) {
    return "zh"
  }
  
  return "en"
}

// 获取翻译文本
export function getTranslation(key: string, lang?: Language): string {
  const currentLang = lang || getCurrentLanguage()
  const keys = key.split(".")
  
  let value: any = translations[currentLang]
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  // 如果当前语言没有找到，尝试英文
  if (value === undefined && currentLang !== "en") {
    let fallbackValue: any = translations.en
    for (const k of keys) {
      fallbackValue = fallbackValue?.[k]
    }
    value = fallbackValue
  }
  
  return typeof value === "string" ? value : key
}

// 翻译函数简写
export const t = getTranslation

// Hook for React components
export function useTranslation(lang?: Language) {
  const currentLang = lang || getCurrentLanguage()
  
  return {
    t: (key: string) => getTranslation(key, currentLang),
    language: currentLang,
  }
}

// 获取导航翻译的便捷函数
export function getNavigationTranslation(key: string, lang?: Language): string {
  return getTranslation(`common.navigation.${key}`, lang)
}

// 获取操作翻译的便捷函数
export function getActionTranslation(key: string, lang?: Language): string {
  return getTranslation(`common.actions.${key}`, lang)
}

// 获取状态翻译的便捷函数
export function getStatusTranslation(key: string, lang?: Language): string {
  return getTranslation(`common.status.${key}`, lang)
}

export default {
  t: getTranslation,
  useTranslation,
  getCurrentLanguage,
  getNavigationTranslation,
  getActionTranslation,
  getStatusTranslation,
}