"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"

import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex h-screen">
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="flex flex-col flex-1">
                <header className="flex h-16 items-center justify-between gap-2 border-b px-4">
                  <h1 className="text-lg font-semibold">Network Monitor</h1>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-3 py-1 text-sm border rounded hover:bg-muted"
                    >
                      EN/中文
                    </button>
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-4">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
