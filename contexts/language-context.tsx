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
        "mibManagement": "MIB Management",
        "mibLibrary": "MIB Library",
        "importExport": "Import/Export",
        "oidBrowser": "OID Browser",
        "mibValidator": "MIB Validator",
        "configGenerator": "Configuration Generator",
        "generateConfig": "Generate Config",
        "templates": "Templates",
        "configValidator": "Config Validator",
        "versionHistory": "Version History",
        "deviceManagement": "Device Management",
        "devices": "Devices",
        "deviceTemplates": "Device Templates",
        "snmpTesting": "SNMP Testing",
        "monitoring": "Monitoring",
        "realtimeMonitor": "Real-time Monitor",
        "performance": "Performance",
        "capacityPlanning": "Capacity Planning",
        "networkDiscovery": "Network Discovery",
        "autoDiscovery": "Auto Discovery",
        "manualDiscovery": "Manual Discovery",
        "discoveryRules": "Discovery Rules",
        "alertsEvents": "Alerts & Events",
        "alerts": "Alerts",
        "events": "Events",
        "alertRules": "Alert Rules",
        "notifications": "Notifications",
        "reports": "Analytics & Reports",
        "systemReports": "System Reports",
        "customReports": "Custom Reports",
        "dataExport": "Data Export",
        "automation": "Automation Tools",
        "scripts": "Scripts",
        "tasks": "Tasks",
        "bulkOperations": "Bulk Operations",
        "assets": "Asset Management",
        "inventory": "Inventory",
        "lifecycle": "Lifecycle",
        "compliance": "Compliance",
        "vulnerabilities": "Vulnerabilities",
        "settings": "System Settings",
        "general": "General",
        "security": "Security",
        "backup": "Backup",
        "users": "Users",
        "apiManagement": "API Management",
        "services": "Services",
        "mobile": "Mobile",
        "deployment": "Deployment",
        "topology": "Network Topology",
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
        "mibManagement": "MIB管理",
        "mibLibrary": "MIB库",
        "importExport": "导入/导出",
        "oidBrowser": "OID浏览器",
        "mibValidator": "MIB验证器",
        "configGenerator": "配置生成器",
        "generateConfig": "生成配置",
        "templates": "模板",
        "configValidator": "配置验证器",
        "versionHistory": "版本历史",
        "deviceManagement": "设备管理",
        "devices": "设备",
        "deviceTemplates": "设备模板",
        "snmpTesting": "SNMP测试",
        "monitoring": "监控",
        "realtimeMonitor": "实时监控",
        "performance": "性能",
        "capacityPlanning": "容量规划",
        "networkDiscovery": "网络发现",
        "autoDiscovery": "自动发现",
        "manualDiscovery": "手动发现",
        "discoveryRules": "发现规则",
        "alertsEvents": "告警与事件",
        "alerts": "告警",
        "events": "事件",
        "alertRules": "告警规则",
        "notifications": "通知",
        "reports": "分析报表",
        "systemReports": "系统报表",
        "customReports": "自定义报表",
        "dataExport": "数据导出",
        "automation": "自动化工具",
        "scripts": "脚本",
        "tasks": "任务",
        "bulkOperations": "批量操作",
        "assets": "资产管理",
        "inventory": "库存",
        "lifecycle": "生命周期",
        "compliance": "合规性",
        "vulnerabilities": "漏洞",
        "settings": "系统设置",
        "general": "通用",
        "security": "安全",
        "backup": "备份",
        "users": "用户",
        "apiManagement": "API管理",
        "services": "服务",
        "mobile": "移动端",
        "deployment": "部署",
        "topology": "网络拓扑",
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
