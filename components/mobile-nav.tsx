"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AppSidebar } from "@/components/app-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { usePathname } from "next/navigation"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  if (!isMobile) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-[280px] sm:w-[300px] z-50 mobile-nav-content"
        onInteractOutside={() => setOpen(false)}
        id="mobile-navigation"
      >
        <SheetHeader className="flex flex-row items-center justify-between p-4 border-b">
          <SheetTitle className="text-lg font-semibold">Network Monitor</SheetTitle>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>
        <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
          <div className="p-2">
            <AppSidebar />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
