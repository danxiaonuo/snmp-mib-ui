"use client"

import React from 'react'
import { KeyboardShortcutHelper } from './keyboard-shortcut-helper'
import { useGlobalShortcuts } from '@/hooks/use-keyboard-shortcuts'

interface EnhancedLayoutProps {
  children: React.ReactNode
  currentPage?: string
}

export function EnhancedLayout({ children, currentPage }: EnhancedLayoutProps) {
  const [showShortcutHelper, setShowShortcutHelper] = React.useState(false)

  // 启用全局快捷键
  useGlobalShortcuts()

  // 监听快捷键帮助
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true'
        )
        
        if (!isInputFocused) {
          e.preventDefault()
          setShowShortcutHelper(true)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      {children}
      <KeyboardShortcutHelper
        isOpen={showShortcutHelper}
        onClose={() => setShowShortcutHelper(false)}
        currentPage={currentPage}
      />
    </>
  )
}