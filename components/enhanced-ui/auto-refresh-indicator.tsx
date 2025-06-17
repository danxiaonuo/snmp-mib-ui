"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  RefreshCw, 
  Pause, 
  Play, 
  Clock, 
  Wifi, 
  WifiOff,
  CheckCircle,
  AlertCircle 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutoRefreshIndicatorProps {
  isRefreshing: boolean
  lastRefresh: Date | null
  retryCount: number
  currentInterval: number
  onManualRefresh: () => void
  onPause: () => void
  onResume: () => void
  isPaused?: boolean
  className?: string
}

export function AutoRefreshIndicator({
  isRefreshing,
  lastRefresh,
  retryCount,
  currentInterval,
  onManualRefresh,
  onPause,
  onResume,
  isPaused = false,
  className
}: AutoRefreshIndicatorProps) {
  const [timeUntilNext, setTimeUntilNext] = React.useState(0)
  const [progress, setProgress] = React.useState(0)

  // 计算下次刷新倒计时
  React.useEffect(() => {
    if (!lastRefresh || isPaused) return

    const interval = setInterval(() => {
      const now = Date.now()
      const nextRefresh = lastRefresh.getTime() + currentInterval
      const remaining = Math.max(0, nextRefresh - now)
      const progressPercent = ((currentInterval - remaining) / currentInterval) * 100

      setTimeUntilNext(remaining)
      setProgress(progressPercent)

      if (remaining === 0) {
        setProgress(0)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lastRefresh, currentInterval, isPaused])

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatLastRefresh = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return date.toLocaleString()
  }

  return (
    <div className={cn("flex items-center space-x-2 text-sm", className)}>
      {/* 刷新状态指示器 */}
      <div className="flex items-center space-x-1">
        {isRefreshing ? (
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
        ) : isPaused ? (
          <Pause className="h-4 w-4 text-yellow-500" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-500" />
        )}
        
        <span className="text-muted-foreground">
          {isRefreshing ? '刷新中...' : isPaused ? '已暂停' : '自动刷新'}
        </span>
      </div>

      {/* 重试次数指示 */}
      {retryCount > 0 && (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          重试 {retryCount}
        </Badge>
      )}

      {/* 下次刷新倒计时 */}
      {!isPaused && !isRefreshing && timeUntilNext > 0 && (
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {formatTime(timeUntilNext)}
          </span>
          <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 最后刷新时间 */}
      {lastRefresh && (
        <span className="text-xs text-muted-foreground">
          上次: {formatLastRefresh(lastRefresh)}
        </span>
      )}

      {/* 控制按钮 */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onManualRefresh}
          disabled={isRefreshing}
          className="h-6 px-2"
          data-shortcut="refresh"
        >
          <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={isPaused ? onResume : onPause}
          className="h-6 px-2"
        >
          {isPaused ? (
            <Play className="h-3 w-3" />
          ) : (
            <Pause className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * 网络状态指示器
 */
export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = React.useState(true)
  const [lastOnline, setLastOnline] = React.useState<Date | null>(null)

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setLastOnline(new Date())
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 初始状态
    setIsOnline(navigator.onLine)
    if (navigator.onLine) {
      setLastOnline(new Date())
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="flex items-center space-x-1 text-xs">
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3 text-green-500" />
          <span className="text-green-600">在线</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-red-500" />
          <span className="text-red-600">离线</span>
          {lastOnline && (
            <span className="text-muted-foreground ml-1">
              (上次在线: {lastOnline.toLocaleTimeString()})
            </span>
          )}
        </>
      )}
    </div>
  )
}

/**
 * 数据刷新统计
 */
export function RefreshStats({
  totalRefreshes,
  successRate,
  averageResponseTime,
  className
}: {
  totalRefreshes: number
  successRate: number
  averageResponseTime: number
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-4 text-xs", className)}>
      <div className="text-center">
        <div className="font-medium">{totalRefreshes}</div>
        <div className="text-muted-foreground">总刷新次数</div>
      </div>
      <div className="text-center">
        <div className="font-medium text-green-600">{successRate.toFixed(1)}%</div>
        <div className="text-muted-foreground">成功率</div>
      </div>
      <div className="text-center">
        <div className="font-medium">{averageResponseTime}ms</div>
        <div className="text-muted-foreground">平均响应</div>
      </div>
    </div>
  )
}