"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Language = "en" | "zh"

// Define a type for the translations
interface Translations {
  [key: string]: string | Translations
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Removed hardcoded translations
// const translations = { ... }

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")
  const [isInitialized, setIsInitialized] = useState(false)
  // State for loaded translations
  const [loadedTranslations, setLoadedTranslations] = useState<{ [key in Language]?: Translations }>({})

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "zh")) {
      setLanguage(savedLanguage)
    }
    setIsInitialized(true)

    // Simulate fetching translations
    // In a real app, you would fetch these from /locales/en/common.json and /locales/zh/common.json
    // For this subtask, we'll use the content read previously.
    const enTranslations = {
      "navigation": {
        "dashboard": "Dashboard",
        "devices": "Devices",
        "alerts": "Alerts",
        "topology": "Network Topology",
        "assets": "Asset Management",
        "reports": "Analytics & Reports",
        "automation": "Automation Tools",
        "apiManagement": "API Management",
        "settings": "System Settings",
        "deployment": "Deployment",
        "userManagement": "User Management",
        "aiAnalytics": "AI Analytics",
        "intelligentAnalysis": "Intelligent Analysis"
      },
      "actions": {
        "save": "Save",
        "cancel": "Cancel",
        "delete": "Delete",
        "edit": "Edit",
        "add": "Add",
        "create": "Create",
        "update": "Update",
        "refresh": "Refresh",
        "export": "Export",
        "import": "Import",
        "search": "Search",
        "filter": "Filter",
        "reset": "Reset",
        "submit": "Submit",
        "close": "Close",
        "confirm": "Confirm"
      },
      "status": {
        "active": "Active",
        "inactive": "Inactive",
        "online": "Online",
        "offline": "Offline",
        "pending": "Pending",
        "completed": "Completed",
        "failed": "Failed",
        "success": "Success",
        "error": "Error",
        "warning": "Warning",
        "info": "Info"
      },
      "language": {
        "english": "English",
        "chinese": "中文",
        "switchLanguage": "Switch Language"
      },
      "loading": "Loading...",
      "noData": "No data available",
      "error": "An error occurred",
      "success": "Operation successful"
    };

    const zhTranslations = {
      "navigation": {
        "dashboard": "仪表板",
        "devices": "设备管理",
        "alerts": "告警管理",
        "topology": "网络拓扑",
        "assets": "资产管理",
        "reports": "分析报表",
        "automation": "自动化工具",
        "apiManagement": "API管理",
        "settings": "系统设置",
        "deployment": "部署管理",
        "userManagement": "用户管理",
        "aiAnalytics": "AI分析",
        "intelligentAnalysis": "智能分析"
      },
      "actions": {
        "save": "保存",
        "cancel": "取消",
        "delete": "删除",
        "edit": "编辑",
        "add": "添加",
        "create": "创建",
        "update": "更新",
        "refresh": "刷新",
        "export": "导出",
        "import": "导入",
        "search": "搜索",
        "filter": "筛选",
        "reset": "重置",
        "submit": "提交",
        "close": "关闭",
        "confirm": "确认"
      },
      "status": {
        "active": "活跃",
        "inactive": "非活跃",
        "online": "在线",
        "offline": "离线",
        "pending": "待处理",
        "completed": "已完成",
        "failed": "失败",
        "success": "成功",
        "error": "错误",
        "warning": "警告",
        "info": "信息"
      },
      "language": {
        "english": "English",
        "chinese": "中文",
        "switchLanguage": "切换语言"
      },
      "loading": "加载中...",
      "noData": "暂无数据",
      "error": "发生错误",
      "success": "操作成功"
    };

    setLoadedTranslations({
      en: enTranslations as unknown as Translations,
      zh: zhTranslations as unknown as Translations,
    });

  }, [])

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en"

    // Force re-render by dispatching a custom event
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: lang }))
  }

  const t = (key: string): string => {
    if (!isInitialized || !loadedTranslations[language]) {
      // Fallback if translations are not loaded for the current language
      console.error(`Translations not loaded for language: ${language}`);
      return key;
    }

    const keys = key.split('.');
    let current: string | Translations | undefined = loadedTranslations[language];

    for (const k of keys) {
      if (typeof current === 'object' && current !== null && k in current) {
        current = current[k];
      } else {
        // Key not found
        console.warn(`Translation key not found: ${key} for language: ${language}`);
        return key;
      }
    }

    if (typeof current === 'string') {
      return current;
    } else {
      // This case should ideally not happen if keys always point to strings
      console.warn(`Translation key did not resolve to a string: ${key} for language: ${language}`);
      return key;
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
