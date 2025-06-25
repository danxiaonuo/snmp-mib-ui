"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle, AlertCircle, Zap, Search, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

// 增强的按钮组件 - 带状态反馈
interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  success?: boolean
  error?: boolean
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function EnhancedButton({ 
  loading, 
  success, 
  error, 
  children, 
  className, 
  disabled,
  ...props 
}: EnhancedButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (success || error) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "transition-all duration-200 transform",
        loading && "scale-95",
        success && "bg-green-500 hover:bg-green-600",
        error && "bg-red-500 hover:bg-red-600",
        isAnimating && "animate-pulse",
        className
      )}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {success && !loading && <CheckCircle className="mr-2 h-4 w-4" />}
      {error && !loading && <AlertCircle className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  )
}

// 智能搜索框 - 带实时搜索建议
interface SmartSearchProps {
  placeholder?: string
  onSearch: (query: string) => void
  onFilter?: () => void
  suggestions?: string[]
  className?: string
}

export function SmartSearch({ 
  placeholder = "搜索...", 
  onSearch, 
  onFilter,
  suggestions = [],
  className 
}: SmartSearchProps) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (query.length > 0) {
      const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [query, suggestions])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    onSearch(searchQuery)
    setShowSuggestions(false)
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query)
            }
          }}
          className="pl-8 pr-20"
        />
        <div className="absolute right-2 top-1 flex gap-1">
          {onFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFilter}
              className="h-8 w-8 p-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearch(query)}
            className="h-8 w-8 p-0"
          >
            <Zap className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {showSuggestions && (
        <Card className="absolute top-full mt-1 w-full z-50 max-h-40 overflow-y-auto">
          <CardContent className="p-2">
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-2 py-1 hover:bg-muted rounded cursor-pointer text-sm"
                onClick={() => handleSearch(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 实时状态卡片
interface StatusCardProps {
  title: string
  value: string | number
  change?: string
  status: 'online' | 'offline' | 'warning' | 'error'
  onClick?: () => void
  children?: React.ReactNode
}

export function StatusCard({ title, value, change, status, onClick, children }: StatusCardProps) {
  const statusConfig = {
    online: { color: 'text-green-600', bg: 'bg-green-100', badge: 'bg-green-500' },
    offline: { color: 'text-gray-600', bg: 'bg-gray-100', badge: 'bg-gray-500' },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-100', badge: 'bg-yellow-500' },
    error: { color: 'text-red-600', bg: 'bg-red-100', badge: 'bg-red-500' }
  }

  const config = statusConfig[status]

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md transform hover:scale-105",
        onClick && "hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("w-3 h-3 rounded-full", config.badge)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground mt-1">
            {change}
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

// 加载状态管理
interface LoadingStateProps {
  loading: boolean
  error?: string
  children: React.ReactNode
  loadingText?: string
}

export function LoadingState({ loading, error, children, loadingText = "加载中..." }: LoadingStateProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">{loadingText}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
          重试
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

// 实时进度指示器
interface LiveProgressProps {
  value: number
  max: number
  label?: string
  showPercentage?: boolean
  className?: string
}

export function LiveProgress({ value, max, label, showPercentage = true, className }: LiveProgressProps) {
  const percentage = Math.round((value / max) * 100)
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}
      <Progress value={percentage} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{value}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

// 快速操作工具栏
interface QuickToolbarProps {
  actions: Array<{
    label: string
    icon: React.ComponentType<{ className?: string }>
    onClick: () => void
    disabled?: boolean
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  }>
  className?: string
}

export function QuickToolbar({ actions, className }: QuickToolbarProps) {
  return (
    <div className={cn("flex gap-2 p-2 border rounded-lg bg-muted/50", className)}>
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || "ghost"}
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled}
          className="flex-1"
        >
          <action.icon className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </div>
  )
}