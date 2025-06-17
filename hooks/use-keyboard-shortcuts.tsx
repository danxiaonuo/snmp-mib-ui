"use client"

import { useEffect, useCallback, useRef } from 'react'
import { toast } from '@/hooks/use-toast'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
  preventDefault?: boolean
}

/**
 * 键盘快捷键Hook
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts)
  
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const activeElement = document.activeElement
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    )

    shortcutsRef.current.forEach(shortcut => {
      const {
        key,
        ctrlKey = false,
        metaKey = false,
        shiftKey = false,
        altKey = false,
        action,
        preventDefault = true
      } = shortcut

      const keyMatches = event.key.toLowerCase() === key.toLowerCase()
      const modifiersMatch = 
        event.ctrlKey === ctrlKey &&
        event.metaKey === metaKey &&
        event.shiftKey === shiftKey &&
        event.altKey === altKey

      if (keyMatches && modifiersMatch) {
        // 如果是输入框聚焦状态，只允许特定快捷键
        if (isInputFocused && !['Escape', 'F1', 'F2', 'F3'].includes(event.key)) {
          return
        }

        if (preventDefault) {
          event.preventDefault()
        }
        action()
      }
    })
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * 全局快捷键Hook
 */
export function useGlobalShortcuts() {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 's',
      ctrlKey: true,
      action: () => {
        // 触发保存操作
        const saveButton = document.querySelector('[data-shortcut="save"]') as HTMLButtonElement
        if (saveButton && !saveButton.disabled) {
          saveButton.click()
          toast({
            title: "快捷键",
            description: "已触发保存操作 (Ctrl+S)",
          })
        }
      },
      description: '保存当前内容'
    },
    {
      key: 'f',
      ctrlKey: true,
      action: () => {
        // 聚焦搜索框
        const searchInput = document.querySelector('input[placeholder*="搜索"], input[placeholder*="search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
          toast({
            title: "快捷键",
            description: "已聚焦搜索框 (Ctrl+F)",
          })
        }
      },
      description: '聚焦搜索框'
    },
    {
      key: 'Escape',
      action: () => {
        // 关闭对话框或取消操作
        const closeButton = document.querySelector('[data-shortcut="close"], [aria-label="Close"]') as HTMLButtonElement
        if (closeButton) {
          closeButton.click()
        }
        
        // 取消选择
        const activeElement = document.activeElement as HTMLElement
        if (activeElement) {
          activeElement.blur()
        }
      },
      description: '关闭对话框或取消选择',
      preventDefault: false
    },
    {
      key: 'n',
      ctrlKey: true,
      action: () => {
        // 创建新项目
        const newButton = document.querySelector('[data-shortcut="new"]') as HTMLButtonElement
        if (newButton && !newButton.disabled) {
          newButton.click()
          toast({
            title: "快捷键",
            description: "已触发新建操作 (Ctrl+N)",
          })
        }
      },
      description: '创建新项目'
    },
    {
      key: 'r',
      ctrlKey: true,
      action: () => {
        // 刷新数据
        const refreshButton = document.querySelector('[data-shortcut="refresh"]') as HTMLButtonElement
        if (refreshButton && !refreshButton.disabled) {
          refreshButton.click()
          toast({
            title: "快捷键",
            description: "已刷新数据 (Ctrl+R)",
          })
        }
      },
      description: '刷新数据'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => {
        // 删除选中项
        const deleteButton = document.querySelector('[data-shortcut="delete"]') as HTMLButtonElement
        if (deleteButton && !deleteButton.disabled) {
          deleteButton.click()
          toast({
            title: "快捷键",
            description: "已触发删除操作 (Ctrl+D)",
          })
        }
      },
      description: '删除选中项'
    },
    {
      key: 'a',
      ctrlKey: true,
      action: () => {
        // 全选
        const selectAllButton = document.querySelector('[data-shortcut="select-all"]') as HTMLButtonElement
        if (selectAllButton && !selectAllButton.disabled) {
          selectAllButton.click()
          toast({
            title: "快捷键",
            description: "已全选 (Ctrl+A)",
          })
        }
      },
      description: '全选项目'
    },
    {
      key: '/',
      action: () => {
        // 显示快捷键帮助
        showShortcutHelp()
      },
      description: '显示快捷键帮助'
    }
  ]

  useKeyboardShortcuts(shortcuts)
}

/**
 * 显示快捷键帮助
 */
function showShortcutHelp() {
  const shortcuts = [
    { key: 'Ctrl + S', description: '保存当前内容' },
    { key: 'Ctrl + F', description: '聚焦搜索框' },
    { key: 'Ctrl + N', description: '创建新项目' },
    { key: 'Ctrl + R', description: '刷新数据' },
    { key: 'Ctrl + D', description: '删除选中项' },
    { key: 'Ctrl + A', description: '全选项目' },
    { key: 'Esc', description: '关闭对话框或取消选择' },
    { key: '/', description: '显示此帮助' }
  ]

  const helpContent = shortcuts
    .map(s => `${s.key}: ${s.description}`)
    .join('\n')

  toast({
    title: "键盘快捷键",
    description: (
      <div className="space-y-1 text-sm">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex justify-between">
            <code className="bg-muted px-1 rounded text-xs">{shortcut.key}</code>
            <span className="ml-2">{shortcut.description}</span>
          </div>
        ))}
      </div>
    ),
  })
}

/**
 * 页面特定快捷键Hook
 */
export function usePageShortcuts(pageType: string) {
  const getPageShortcuts = useCallback((): KeyboardShortcut[] => {
    switch (pageType) {
      case 'devices':
        return [
          {
            key: 'e',
            ctrlKey: true,
            action: () => {
              const editButton = document.querySelector('[data-shortcut="edit"]') as HTMLButtonElement
              if (editButton && !editButton.disabled) {
                editButton.click()
              }
            },
            description: '编辑选中设备'
          }
        ]
      
      case 'mibs':
        return [
          {
            key: 'u',
            ctrlKey: true,
            action: () => {
              const uploadButton = document.querySelector('[data-shortcut="upload"]') as HTMLButtonElement
              if (uploadButton && !uploadButton.disabled) {
                uploadButton.click()
              }
            },
            description: '上传MIB文件'
          }
        ]
      
      case 'alert-rules':
        return [
          {
            key: 't',
            ctrlKey: true,
            action: () => {
              const testButton = document.querySelector('[data-shortcut="test"]') as HTMLButtonElement
              if (testButton && !testButton.disabled) {
                testButton.click()
              }
            },
            description: '测试告警规则'
          }
        ]
      
      default:
        return []
    }
  }, [pageType])

  useKeyboardShortcuts(getPageShortcuts())
}