import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import dynamic from "next/dynamic"

import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"

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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mibweb-ui.com",
    title: "MIB Web UI - Enterprise SNMP Monitoring Platform",
    description: "Professional enterprise-grade SNMP MIB management and network monitoring platform",
    siteName: "MIB Web UI",
  },
  twitter: {
    card: "summary_large_image",
    title: "MIB Web UI - Enterprise SNMP Monitoring Platform",
    description: "Professional enterprise-grade SNMP MIB management and network monitoring platform",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <SidebarProvider>
              <AppSidebar className="hidden md:flex" />
              <SidebarInset className="flex flex-col flex-1 min-w-0">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 sticky top-0 z-50">
                  <div className="flex items-center gap-3">
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
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <div className="max-w-7xl mx-auto">{children}</div>
                </main>
                <PerformanceMonitor />
              </SidebarInset>
            </SidebarProvider>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
