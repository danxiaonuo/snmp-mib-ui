"use client"

import React from 'react'

interface SimplifiedLayoutProps {
  children: React.ReactNode
}

export function SimplifiedLayout({ children }: SimplifiedLayoutProps) {
  return (
    <div className="simplified-layout">
      {children}
    </div>
  )
}