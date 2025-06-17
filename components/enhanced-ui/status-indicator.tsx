"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Wifi,
  WifiOff,
  Server,
  Database,
  Activity,
  Zap,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

export type StatusType = 'online' | 'offline' | 'warning' | 'error' | 'loading' | 'success' | 'pending'

interface StatusIndicatorProps {
  status: StatusType
  label?: string
  description?: string
  showIcon?: boolean
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dot' | 'badge' | 'card'
  className?: string
  onClick?: () => void
}

interface SystemStatusProps {
  services: Array<{
    name: string
    status: StatusType
    description?: string
    uptime?: number
    responseTime?: number
    lastCheck?: Date
  }>
  onRefresh?: () => void
  refreshing?: boolean
  className?: string
}

interface ConnectionStatusProps {
  isConnected: boolean
  connectionType?: string
  signalStrength?: number
  className?: string
}

const statusConfig = {
  online: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    label: '在线',
    badgeVariant: 'default' as const
  },
  offline: {
    icon: XCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500',
    label: '离线',
    badgeVariant: 'secondary' as const
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    label: '警告',
    badgeVariant: 'outline' as const
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    label: '错误',
    badgeVariant: 'destructive' as const
  },
  loading: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    label: '加载中',
    badgeVariant: 'outline' as const
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    label: '成功',
    badgeVariant: 'default' as const
  },
  pending: {
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
    label: '等待中',
    badgeVariant: 'outline' as const
  }
}

export function StatusIndicator({
  status,
  label,
  description,
  showIcon = true,
  showLabel = true,
  size = 'md',
  variant = 'badge',
  className,
  onClick
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const dotSizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  if (variant === 'dot') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "rounded-full flex-shrink-0",
              config.bgColor,
              dotSizeClasses[size],
              onClick && "cursor-pointer",
              className
            )}
            onClick={onClick}
          />
        </TooltipTrigger>
        {(label || description) && (
          <TooltipContent>
            <div>
              {label && <div className="font-medium">{label}</div>}
              {description && <div className="text-xs text-muted-foreground">{description}</div>}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={cn("cursor-pointer hover:shadow-md transition-shadow", className)} onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {showIcon && (
              <Icon className={cn(sizeClasses[size], config.color, status === 'loading' && 'animate-spin')} />
            )}
            <div className="flex-1">
              {showLabel && (
                <div className="font-medium">{label || config.label}</div>
              )}
              {description && (
                <div className="text-sm text-muted-foreground">{description}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default badge variant
  return (
    <Badge
      variant={config.badgeVariant}
      className={cn(
        "flex items-center space-x-1",
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
      onClick={onClick}
    >
      {showIcon && (
        <Icon className={cn(sizeClasses[size], status === 'loading' && 'animate-spin')} />
      )}
      {showLabel && <span>{label || config.label}</span>}
    </Badge>
  )
}

export function SystemStatus({ services, onRefresh, refreshing, className }: SystemStatusProps) {
  const overallStatus = services.every(s => s.status === 'online') 
    ? 'online' 
    : services.some(s => s.status === 'error') 
    ? 'error' 
    : 'warning'

  const formatUptime = (uptime?: number) => {
    if (!uptime) return 'N/A'
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    
    if (days > 0) return `${days}天 ${hours}小时`
    if (hours > 0) return `${hours}小时 ${minutes}分钟`
    return `${minutes}分钟`
  }

  const formatResponseTime = (time?: number) => {
    if (!time) return 'N/A'
    return `${time}ms`
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center space-x-2">
          <Server className="h-5 w-5" />
          <span>系统状态</span>
          <StatusIndicator status={overallStatus} variant="dot" size="md" />
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          刷新
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {services.map((service, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <StatusIndicator 
                status={service.status} 
                variant="dot" 
                size="md"
                label={service.name}
                description={service.description}
              />
              <div>
                <div className="font-medium">{service.name}</div>
                {service.description && (
                  <div className="text-sm text-muted-foreground">{service.description}</div>
                )}
              </div>
            </div>
            
            <div className="text-right text-sm text-muted-foreground">
              <div>运行时间: {formatUptime(service.uptime)}</div>
              <div>响应时间: {formatResponseTime(service.responseTime)}</div>
              {service.lastCheck && (
                <div>最后检查: {service.lastCheck.toLocaleTimeString()}</div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ConnectionStatus({ 
  isConnected, 
  connectionType = 'WiFi', 
  signalStrength = 0,
  className 
}: ConnectionStatusProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getSignalIcon = () => {
    if (!isConnected) return WifiOff
    if (signalStrength >= 75) return Wifi
    if (signalStrength >= 50) return Wifi
    if (signalStrength >= 25) return Wifi
    return Wifi
  }

  const getSignalColor = () => {
    if (!isConnected) return 'text-red-500'
    if (signalStrength >= 75) return 'text-green-500'
    if (signalStrength >= 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  const SignalIcon = getSignalIcon()

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-1 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
            <SignalIcon className={cn("h-4 w-4", getSignalColor())} />
            <StatusIndicator 
              status={isConnected ? 'online' : 'offline'} 
              variant="dot" 
              size="sm"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <div className="font-medium">
              {isConnected ? '已连接' : '未连接'}
            </div>
            <div className="text-xs">
              类型: {connectionType}
            </div>
            {isConnected && (
              <div className="text-xs">
                信号强度: {signalStrength}%
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {showDetails && (
        <div className="text-xs text-muted-foreground">
          {isConnected ? `${connectionType} ${signalStrength}%` : '离线'}
        </div>
      )}
    </div>
  )
}

// Hook for monitoring connection status
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    
    const updateConnectionType = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown')
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    updateConnectionType()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  return {
    isOnline,
    connectionType
  }
}