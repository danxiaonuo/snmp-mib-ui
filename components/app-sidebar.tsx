"use client"

import type * as React from "react"
import { FileText, Settings, Wrench, HardDrive, Home, Database, Monitor, Bell, BarChart3, Shield, Activity } from "lucide-react"

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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
