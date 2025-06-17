"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Keyboard, 
  Search, 
  Command, 
  Zap,
  BookOpen,
  Settings,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShortcutItem {
  key: string
  description: string
  category: string
  action?: () => void
}

const globalShortcuts: ShortcutItem[] = [
  { key: 'Ctrl + S', description: '保存当前内容', category: '通用' },
  { key: 'Ctrl + F', description: '聚焦搜索框', category: '通用' },
  { key: 'Ctrl + N', description: '创建新项目', category: '通用' },
  { key: 'Ctrl + R', description: '刷新数据', category: '通用' },
  { key: 'Ctrl + D', description: '删除选中项', category: '通用' },
  { key: 'Ctrl + A', description: '全选项目', category: '通用' },
  { key: 'Esc', description: '关闭对话框或取消选择', category: '通用' },
  { key: '/', description: '显示快捷键帮助', category: '通用' },
]

const pageShortcuts: Record<string, ShortcutItem[]> = {
  devices: [
    { key: 'Ctrl + E', description: '编辑选中设备', category: '设备管理' },
    { key: 'Ctrl + T', description: '测试设备连接', category: '设备管理' },
    { key: 'Ctrl + I', description: '查看设备详情', category: '设备管理' },
  ],
  mibs: [
    { key: 'Ctrl + U', description: '上传MIB文件', category: 'MIB管理' },
    { key: 'Ctrl + V', description: '验证MIB文件', category: 'MIB管理' },
    { key: 'Ctrl + B', description: '浏览OID树', category: 'MIB管理' },
  ],
  'alert-rules': [
    { key: 'Ctrl + T', description: '测试告警规则', category: '告警规则' },
    { key: 'Ctrl + P', description: '预览PromQL', category: '告警规则' },
    { key: 'Ctrl + M', description: '从模板创建', category: '告警规则' },
  ],
  'monitoring-installer': [
    { key: 'Ctrl + I', description: '开始安装', category: '监控安装' },
    { key: 'Ctrl + H', description: '选择主机', category: '监控安装' },
    { key: 'Ctrl + C', description: '配置组件', category: '监控安装' },
  ]
}

interface KeyboardShortcutHelperProps {
  isOpen: boolean
  onClose: () => void
  currentPage?: string
}

export function KeyboardShortcutHelper({ 
  isOpen, 
  onClose, 
  currentPage = 'global' 
}: KeyboardShortcutHelperProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('all')

  const allShortcuts = React.useMemo(() => {
    const shortcuts = [...globalShortcuts]
    if (currentPage && pageShortcuts[currentPage]) {
      shortcuts.push(...pageShortcuts[currentPage])
    }
    return shortcuts
  }, [currentPage])

  const categories = React.useMemo(() => {
    const cats = new Set(allShortcuts.map(s => s.category))
    return ['all', ...Array.from(cats)]
  }, [allShortcuts])

  const filteredShortcuts = React.useMemo(() => {
    return allShortcuts.filter(shortcut => {
      const matchesSearch = searchTerm === '' || 
        shortcut.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shortcut.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || 
        shortcut.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [allShortcuts, searchTerm, selectedCategory])

  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, ShortcutItem[]> = {}
    filteredShortcuts.forEach(shortcut => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = []
      }
      groups[shortcut.category].push(shortcut)
    })
    return groups
  }, [filteredShortcuts])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5" />
            <span>键盘快捷键</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 搜索和过滤 */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索快捷键..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '所有分类' : category}
                </option>
              ))}
            </select>
          </div>

          {/* 快捷键列表 */}
          <div className="overflow-y-auto max-h-96 space-y-4">
            {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <span>{category}</span>
                    <Badge variant="secondary" className="text-xs">
                      {shortcuts.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <KeyboardKey keys={shortcut.key} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredShortcuts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Keyboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>没有找到匹配的快捷键</p>
            </div>
          )}

          {/* 提示信息 */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Zap className="h-4 w-4" />
              <span>快捷键提示</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• 在输入框聚焦时，大部分快捷键会被禁用</li>
              <li>• 按 <KeyboardKey keys="/" /> 可随时打开此帮助</li>
              <li>• 按 <KeyboardKey keys="Esc" /> 可关闭对话框</li>
              <li>• Mac用户请使用 Cmd 替代 Ctrl</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 键盘按键显示组件
 */
interface KeyboardKeyProps {
  keys: string
  className?: string
}

export function KeyboardKey({ keys, className }: KeyboardKeyProps) {
  const keyParts = keys.split(' + ').map(key => key.trim())
  
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {keyParts.map((key, index) => (
        <React.Fragment key={index}>
          <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-mono bg-muted border border-border rounded shadow-sm min-w-[24px] h-6">
            {key === 'Ctrl' && <Command className="h-3 w-3" />}
            {key !== 'Ctrl' && key}
          </kbd>
          {index < keyParts.length - 1 && (
            <span className="text-muted-foreground text-xs">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

/**
 * 快捷键提示浮层
 */
interface ShortcutTooltipProps {
  shortcut: string
  description: string
  children: React.ReactNode
  className?: string
}

export function ShortcutTooltip({ 
  shortcut, 
  description, 
  children, 
  className 
}: ShortcutTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div 
      className={cn("relative", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-popover border border-border rounded-md shadow-lg p-2 whitespace-nowrap">
            <div className="text-xs font-medium">{description}</div>
            <div className="flex items-center justify-center mt-1">
              <KeyboardKey keys={shortcut} className="scale-75" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 快捷键状态指示器
 */
export function ShortcutStatusIndicator() {
  const [isEnabled, setIsEnabled] = React.useState(true)
  const [activeShortcuts, setActiveShortcuts] = React.useState<string[]>([])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = []
      if (e.ctrlKey || e.metaKey) keys.push('Ctrl')
      if (e.shiftKey) keys.push('Shift')
      if (e.altKey) keys.push('Alt')
      if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
        keys.push(e.key)
      }
      
      if (keys.length > 1) {
        setActiveShortcuts(keys)
      }
    }

    const handleKeyUp = () => {
      setActiveShortcuts([])
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  if (!isEnabled || activeShortcuts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="p-2 shadow-lg">
        <div className="flex items-center space-x-2">
          <Keyboard className="h-4 w-4 text-muted-foreground" />
          <KeyboardKey keys={activeShortcuts.join(' + ')} />
        </div>
      </Card>
    </div>
  )
}