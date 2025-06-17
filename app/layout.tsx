import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import dynamic from "next/dynamic"

import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/contexts/language-context"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { LanguageSwitcher } from "@/components/language-switcher"
import { EnhancedLayout } from "@/components/enhanced-ui/enhanced-layout"
import { PWARegister } from "@/components/pwa-register"
import { MobileOptimizations } from "@/components/mobile-optimizations"
import { QuickActions } from "@/components/enhanced-ui/quick-actions"
import { NotificationCenter } from "@/components/enhanced-ui/notification-center"

// Dynamic import for performance monitoring (client component)
const PerformanceMonitor = dynamic(() => import("@/components/performance-monitor"))

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MIB Web UI - Enterprise SNMP Monitoring Platform",
  description: "Professional enterprise-grade SNMP MIB management and network monitoring platform with real-time analytics, intelligent alerting, and comprehensive device management capabilities.",
  keywords: ["SNMP", "MIB", "Network Monitoring", "Device Management", "Enterprise", "Real-time Analytics"],
  authors: [{ name: "Evan" }],
  creator: "Evan",
  publisher: "Evan",
  robots: "index, follow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MIB Platform",
    startupImage: [
      {
        url: "/icons/apple-splash-2048-2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/icons/apple-splash-1668-2388.png", 
        media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/icons/apple-splash-1536-2048.png",
        media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/icons/apple-splash-1125-2436.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: "/icons/apple-splash-1242-2208.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: "/icons/apple-splash-750-1334.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/icons/apple-splash-640-1136.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      }
    ]
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mibweb-ui.com",
    title: "MIB Web UI - Enterprise SNMP Monitoring Platform",
    description: "Professional enterprise-grade SNMP MIB management and network monitoring platform",
    siteName: "MIB Web UI",
    images: [
      {
        url: "/icons/og-image.png",
        width: 1200,
        height: 630,
        alt: "MIB Platform Dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "MIB Web UI - Enterprise SNMP Monitoring Platform",
    description: "Professional enterprise-grade SNMP MIB management and network monitoring platform",
    images: ["/icons/twitter-image.png"]
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover"
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ],
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#3b82f6",
    "msapplication-config": "/browserconfig.xml"
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "antialiased")}>
        <LanguageProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <SidebarProvider>
              <AppSidebar className="hidden md:flex" />
              <SidebarInset className="flex flex-col flex-1 min-w-0">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 sticky top-0 z-50">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className="hidden md:flex" />
                    <MobileNav />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                      </div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        MIB Platform
                      </h1>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <NotificationCenter />
                    <QuickActions />
                    <LanguageSwitcher />
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <div className="max-w-7xl mx-auto">
                    <EnhancedLayout>
                      {children}
                    </EnhancedLayout>
                  </div>
                </main>
                <PerformanceMonitor />
              </SidebarInset>
            </SidebarProvider>
          </div>
          <Toaster />
          <PWARegister />
          <MobileOptimizations />
        </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
