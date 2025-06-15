"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

interface BreadcrumbNavProps {
  className?: string
  showHome?: boolean
  maxItems?: number
}

// 路径映射配置
const PATH_LABELS: Record<string, string> = {
  '': '首页',
  'mibs': 'MIB 管理',
  'config-gen': '配置生成',
  'devices': '设备管理',
  'monitoring-installer': '监控安装器',
  'alert-rules': '告警规则',
  'intelligent-analysis': '智能分析',
  'simple-dashboard': '简单仪表板',
  'dashboard': '仪表板',
  'settings': '设置',
  'profile': '个人资料',
  'admin': '管理员',
  'api': 'API',
  'docs': '文档',
  'help': '帮助',
  'about': '关于'
}

// 路径图标映射
const PATH_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  '': Home,
  'mibs': () => <span className="text-sm">📋</span>,
  'config-gen': () => <span className="text-sm">⚙️</span>,
  'devices': () => <span className="text-sm">🖥️</span>,
  'monitoring-installer': () => <span className="text-sm">📊</span>,
  'alert-rules': () => <span className="text-sm">🚨</span>,
  'intelligent-analysis': () => <span className="text-sm">🧠</span>,
  'simple-dashboard': () => <span className="text-sm">📈</span>,
  'dashboard': () => <span className="text-sm">📊</span>,
  'settings': () => <span className="text-sm">⚙️</span>,
  'profile': () => <span className="text-sm">👤</span>,
  'admin': () => <span className="text-sm">👑</span>
}

// 格式化路径段
const formatSegment = (segment: string): string => {
  return PATH_LABELS[segment] || segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// 获取路径图标
const getPathIcon = (segment: string) => {
  return PATH_ICONS[segment] || null
}

// 生成面包屑项目
const generateBreadcrumbItems = (pathname: string, showHome: boolean = true): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []
  
  // 添加首页
  if (showHome) {
    items.push({
      label: '首页',
      href: '/',
      icon: Home
    })
  }
  
  // 添加路径段
  segments.forEach((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = formatSegment(segment)
    const icon = getPathIcon(segment)
    
    items.push({
      label,
      href,
      icon
    })
  })
  
  return items
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  className,
  showHome = true,
  maxItems = 5
}) => {
  const pathname = usePathname()
  const items = generateBreadcrumbItems(pathname, showHome)
  
  // 如果项目太多，进行截断
  const displayItems = items.length > maxItems 
    ? [
        items[0], // 首页
        { label: '...', href: '#', icon: null }, // 省略号
        ...items.slice(-2) // 最后两项
      ]
    : items
  
  if (items.length <= 1) {
    return null // 如果只有首页，不显示面包屑
  }
  
  return (
    <nav 
      className={cn(
        "flex items-center space-x-1 text-sm text-muted-foreground",
        className
      )}
      aria-label="面包屑导航"
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1
          const isEllipsis = item.label === '...'
          const Icon = item.icon
          
          return (
            <li key={`${item.href}-${index}`} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              )}
              
              {isEllipsis ? (
                <span className="px-2 py-1 text-muted-foreground/70">
                  {item.label}
                </span>
              ) : isLast ? (
                <span 
                  className={cn(
                    "flex items-center space-x-1 px-2 py-1 rounded-md",
                    "text-foreground font-medium",
                    "bg-muted/50"
                  )}
                  aria-current="page"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-1 px-2 py-1 rounded-md",
                    "hover:text-foreground hover:bg-muted/50",
                    "transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// 简化版面包屑组件
export const SimpleBreadcrumb: React.FC<{ className?: string }> = ({ className }) => {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return null
  }
  
  return (
    <nav className={cn("text-sm text-muted-foreground", className)}>
      <span>当前位置: </span>
      <span className="text-foreground font-medium">
        {formatSegment(segments[segments.length - 1])}
      </span>
    </nav>
  )
}

// 带返回按钮的面包屑
export const BreadcrumbWithBack: React.FC<{ 
  className?: string
  onBack?: () => void
}> = ({ className, onBack }) => {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (typeof window !== 'undefined') {
      window.history.back()
    }
  }
  
  return (
    <div className={cn("flex items-center space-x-4", className)}>
      <button
        onClick={handleBack}
        className={cn(
          "flex items-center space-x-1 px-3 py-1.5 rounded-md",
          "text-sm text-muted-foreground hover:text-foreground",
          "hover:bg-muted/50 transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        <span>返回</span>
      </button>
      
      <BreadcrumbNav className="flex-1" showHome={false} />
    </div>
  )
}

export default BreadcrumbNav