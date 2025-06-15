"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const navItems = [
  { title: "Dashboard", href: "/" },
  { title: "Devices", href: "/devices" },
  { title: "Alerts", href: "/alerts" },
  { title: "Reports", href: "/reports" },
  { title: "Settings", href: "/settings" },
]

export function SimpleMobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="h-9 w-9">
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg z-50">
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-gray-100 rounded"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
