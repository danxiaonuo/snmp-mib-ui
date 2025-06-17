"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Plus,
  Search,
  Settings,
  Bell,
  User,
  LogOut,
  HelpCircle,
  Keyboard,
  Moon,
  Sun,
  Monitor,
  Zap,
  Database,
  Server,
  Network,
  Shield,
  BarChart3
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface QuickAction {
  id: string
  label: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  category: string
  onClick: () => void
}

interface QuickActionsProps {
  className?: string
}

export function QuickActions({ className }: QuickActionsProps) {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const quickActions: QuickAction[] = [
    {
      id: 'new-device',
      label: '添加设备',
      description: '添加新的网络设备',
      icon: Plus,
      shortcut: 'Ctrl+N',
      category: '设备管理',
      onClick: () => {
        console.log('添加设备')
        setOpen(false)
      }
    },
    {
      id: 'search',
      label: '全局搜索',
      description: '搜索设备、MIB、告警等',
      icon: Search,
      shortcut: 'Ctrl+K',
      category: '搜索',
      onClick: () => {
        console.log('全局搜索')
        setOpen(false)
      }
    },
    {
      id: 'dashboard',
      label: '监控面板',
      description: '查看系统监控面板',
      icon: BarChart3,
      shortcut: 'Ctrl+D',
      category: '监控',
      onClick: () => {
        window.location.href = '/'
        setOpen(false)
      }
    },
    {
      id: 'devices',
      label: '设备列表',
      description: '管理网络设备',
      icon: Server,
      shortcut: 'Ctrl+1',
      category: '设备管理',
      onClick: () => {
        window.location.href = '/devices'
        setOpen(false)
      }
    },
    {
      id: 'mibs',
      label: 'MIB 管理',
      description: '管理 MIB 文件',
      icon: Database,
      shortcut: 'Ctrl+2',
      category: 'MIB',
      onClick: () => {
        window.location.href = '/mibs'
        setOpen(false)
      }
    },
    {
      id: 'alerts',
      label: '告警管理',
      description: '查看和管理告警',
      icon: Bell,
      shortcut: 'Ctrl+3',
      category: '告警',
      onClick: () => {
        window.location.href = '/alerts'
        setOpen(false)
      }
    },
    {
      id: 'topology',
      label: '网络拓扑',
      description: '查看网络拓扑图',
      icon: Network,
      shortcut: 'Ctrl+4',
      category: '网络',
      onClick: () => {
        window.location.href = '/topology'
        setOpen(false)
      }
    },
    {
      id: 'security',
      label: '安全中心',
      description: '安全设置和监控',
      icon: Shield,
      shortcut: 'Ctrl+5',
      category: '安全',
      onClick: () => {
        window.location.href = '/security'
        setOpen(false)
      }
    },
    {
      id: 'settings',
      label: '系统设置',
      description: '配置系统参数',
      icon: Settings,
      category: '设置',
      onClick: () => {
        window.location.href = '/settings'
        setOpen(false)
      }
    }
  ]

  const groupedActions = quickActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = []
    }
    acc[action.category].push(action)
    return acc
  }, {} as Record<string, QuickAction[]>)

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* 快速操作 */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Zap className="h-4 w-4 mr-2" />
            快速操作
            <Badge variant="secondary" className="ml-2 text-xs">
              Ctrl+Space
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <Command>
            <CommandInput placeholder="搜索操作..." />
            <CommandList>
              <CommandEmpty>未找到相关操作</CommandEmpty>
              {Object.entries(groupedActions).map(([category, actions]) => (
                <CommandGroup key={category} heading={category}>
                  {actions.map((action) => (
                    <CommandItem
                      key={action.id}
                      onSelect={action.onClick}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <action.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{action.label}</div>
                          {action.description && (
                            <div className="text-xs text-muted-foreground">
                              {action.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {action.shortcut && (
                        <Badge variant="outline" className="text-xs">
                          {action.shortcut}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 主题切换 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">切换主题</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>主题设置</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleThemeChange("light")}>
            <Sun className="mr-2 h-4 w-4" />
            <span>浅色模式</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            <span>深色模式</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleThemeChange("system")}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>跟随系统</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 帮助菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>帮助与支持</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Keyboard className="mr-2 h-4 w-4" />
            <span>快捷键</span>
            <Badge variant="outline" className="ml-auto text-xs">
              ?
            </Badge>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>使用文档</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <span className="text-xs text-muted-foreground">
              版本 v2.0.0
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// 全局快捷键处理
export function useQuickActions() {
  const { theme, setTheme } = useTheme()

  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl/Cmd + Space: 打开快速操作
    if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
      e.preventDefault()
      // 触发快速操作面板
      console.log('打开快速操作')
    }

    // Ctrl/Cmd + K: 全局搜索
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      console.log('打开全局搜索')
    }

    // Ctrl/Cmd + D: 仪表板
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault()
      window.location.href = '/'
    }

    // Ctrl/Cmd + 1-5: 快速导航
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
      e.preventDefault()
      const routes = ['/devices', '/mibs', '/alerts', '/topology', '/security']
      const index = parseInt(e.key) - 1
      if (routes[index]) {
        window.location.href = routes[index]
      }
    }

    // ?: 帮助
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      const activeElement = document.activeElement
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      )
      
      if (!isInputFocused) {
        e.preventDefault()
        console.log('显示帮助')
      }
    }
  }

  return { handleKeyDown }
}