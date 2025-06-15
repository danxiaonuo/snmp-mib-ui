"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { useState, useCallback } from "react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = useCallback((title: string) => {
    setOpenItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }, [])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url || item.items?.some((subItem) => pathname === subItem.url)
          const isOpen = openItems.includes(item.title) || isActive

          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(open) => {
                if (item.items) {
                  if (open) {
                    setOpenItems(prev => [...prev.filter(t => t !== item.title), item.title])
                  } else {
                    setOpenItems(prev => prev.filter(t => t !== item.title))
                  }
                }
              }}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {item.items ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={cn(
                          "w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200 cursor-pointer",
                          isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                          <span className="truncate">{item.title}</span>
                        </div>
                        <ChevronRight
                          className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-90")}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link
                                href={subItem.url}
                                className={cn(
                                  "w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200 cursor-pointer touch-manipulation",
                                  pathname === subItem.url &&
                                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                                )}
                                role="menuitem"
                                tabIndex={0}
                              >
                                <span className="truncate">{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link
                      href={item.url}
                      className={cn(
                        "w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200 cursor-pointer touch-manipulation",
                        pathname === item.url && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                      )}
                      role="menuitem"
                      tabIndex={0}
                    >
                      {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
