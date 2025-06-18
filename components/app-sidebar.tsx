"use client"

import type * as React from "react"
import { FileText, Settings, Wrench, HardDrive, Home, Database, Monitor, Bell, BarChart3, Shield, Activity } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin User",
    email: "admin@company.com",
    avatar: "/avatars/admin.jpg",
  },
  teams: [
    {
      name: "MIB Platform",
      logo: Database,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Enhanced Dashboard",
      url: "/enhanced-dashboard",
      icon: Monitor,
    },
    {
      title: "MIB Management",
      url: "#",
      icon: FileText,
      isActive: true,
      items: [
        {
          title: "MIB Library",
          url: "/mibs",
        },
        {
          title: "Import/Export",
          url: "/mibs/import-export",
        },
        {
          title: "OID Browser",
          url: "/mibs/oid-browser",
        },
        {
          title: "MIB Validator",
          url: "/mibs/validator",
        },
      ],
    },
    {
      title: "Configuration Generator",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "Generate Config",
          url: "/config-gen",
        },
        {
          title: "Templates",
          url: "/config-gen/templates",
        },
        {
          title: "Config Validator",
          url: "/config-gen/validator",
        },
        {
          title: "Version History",
          url: "/config-gen/versions",
        },
      ],
    },
    {
      title: "Device Management",
      url: "#",
      icon: HardDrive,
      items: [
        {
          title: "Devices",
          url: "/devices",
        },
        {
          title: "Device Templates",
          url: "/devices/templates",
        },
        {
          title: "SNMP Testing",
          url: "/devices/testing",
        },
      ],
    },
    {
      title: "Monitoring",
      url: "#",
      icon: Monitor,
      items: [
        {
          title: "Monitoring Installer",
          url: "/monitoring-installer",
        },
        {
          title: "Analytics",
          url: "/analytics",
        },
        {
          title: "AI Analytics",
          url: "/ai-analytics",
        },
        {
          title: "Simple Dashboard",
          url: "/simple-dashboard",
        },
      ],
    },
    {
      title: "Alerts & Rules",
      url: "#",
      icon: Bell,
      items: [
        {
          title: "Alert Rules",
          url: "/alert-rules",
        },
        {
          title: "Alerts",
          url: "/alerts",
        },
        {
          title: "Events",
          url: "/events",
        },
        {
          title: "Notifications",
          url: "/notifications",
        },
      ],
    },
    {
      title: "System Management",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "Discovery",
          url: "/discovery",
        },
        {
          title: "Inventory",
          url: "/inventory",
        },
        {
          title: "Assets",
          url: "/assets",
        },
        {
          title: "Lifecycle",
          url: "/lifecycle",
        },
        {
          title: "Capacity",
          url: "/capacity",
        },
        {
          title: "Topology",
          url: "/topology",
        },
      ],
    },
    {
      title: "Security & Compliance",
      url: "#",
      icon: Shield,
      items: [
        {
          title: "Security",
          url: "/security",
        },
        {
          title: "Compliance",
          url: "/compliance",
        },
        {
          title: "Vulnerabilities",
          url: "/vulnerabilities",
        },
        {
          title: "Access Control",
          url: "/access-control",
        },
      ],
    },
    {
      title: "Operations",
      url: "#",
      icon: Activity,
      items: [
        {
          title: "Tasks",
          url: "/tasks",
        },
        {
          title: "Scripts",
          url: "/scripts",
        },
        {
          title: "Automation",
          url: "/automation",
        },
        {
          title: "Backup",
          url: "/backup",
        },
        {
          title: "Deployment",
          url: "/deployment",
        },
        {
          title: "Services",
          url: "/services",
        },
      ],
    },
    {
      title: "Tools",
      url: "#",
      icon: Wrench,
      items: [
        {
          title: "OID Converter",
          url: "/tools/oid-converter",
        },
        {
          title: "SNMP Walker",
          url: "/tools/snmp-walker",
        },
        {
          title: "Config Diff",
          url: "/tools/config-diff",
        },
        {
          title: "Bulk Operations",
          url: "/tools/bulk-ops",
        },
      ],
    },
    {
      title: "Reports & Templates",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Reports",
          url: "/reports",
        },
        {
          title: "Templates",
          url: "/templates",
        },
        {
          title: "Intelligent Analysis",
          url: "/intelligent-analysis",
        },
      ],
    },
    {
      title: "System Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "Settings",
          url: "/settings",
        },
        {
          title: "Users",
          url: "/users",
        },
        {
          title: "API Management",
          url: "/api-management",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useLanguage()

  const translatedNavMain = data.navMain.map(item => ({
    ...item,
    title: t(`navigation.${getNavigationKey(item.title)}`),
    items: item.items?.map(subItem => ({
      ...subItem,
      title: t(`navigation.${getNavigationKey(subItem.title)}`)
    }))
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={translatedNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

// Helper function to convert display names to translation keys
function getNavigationKey(title: string): string {
  const keyMap: { [key: string]: string } = {
    "Dashboard": "dashboard",
    "MIB Management": "mibManagement", 
    "MIB Library": "mibLibrary",
    "Import/Export": "importExport",
    "OID Browser": "oidBrowser",
    "MIB Validator": "mibValidator",
    "Configuration Generator": "configGenerator",
    "Generate Config": "generateConfig",
    "Templates": "templates",
    "Config Validator": "configValidator",
    "Version History": "versionHistory",
    "Device Management": "deviceManagement",
    "Devices": "devices",
    "Device Templates": "deviceTemplates",
    "SNMP Testing": "snmpTesting",
    "Monitoring": "monitoring",
    "Real-time Monitor": "realtimeMonitor",
    "Performance": "performance",
    "Capacity Planning": "capacityPlanning",
    "Network Discovery": "networkDiscovery",
    "Auto Discovery": "autoDiscovery",
    "Manual Discovery": "manualDiscovery",
    "Discovery Rules": "discoveryRules",
    "Alerts & Events": "alertsEvents",
    "Alerts": "alerts",
    "Events": "events",
    "Alert Rules": "alertRules",
    "Notifications": "notifications",
    "Analytics & Reports": "reports",
    "System Reports": "systemReports",
    "Custom Reports": "customReports",
    "Data Export": "dataExport",
    "Automation Tools": "automation",
    "Scripts": "scripts",
    "Tasks": "tasks",
    "Bulk Operations": "bulkOperations",
    "Asset Management": "assets",
    "Inventory": "inventory",
    "Lifecycle": "lifecycle",
    "Compliance": "compliance",
    "Vulnerabilities": "vulnerabilities",
    "System Settings": "settings",
    "General": "general",
    "Security": "security",
    "Backup": "backup",
    "Users": "users",
    "API Management": "apiManagement",
    "Services": "services",
    "Mobile": "mobile",
    "Deployment": "deployment"
  }
  
  return keyMap[title] || title.toLowerCase().replace(/\s+/g, '')
}
