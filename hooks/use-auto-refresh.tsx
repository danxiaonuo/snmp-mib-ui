"use client"

import { useEffect, useRef, useCallback, useState } from 'react'
import { toast } from '@/hooks/use-toast'

export interface AutoRefreshOptions {
  interval?: number // 刷新间隔（毫秒）
  enabled?: boolean // 是否启用自动刷新
  onError?: (error: Error) => void // 错误处理
  maxRetries?: number // 最大重试次数
  backoffMultiplier?: number // 退避乘数
}

/**
 * 自动刷新Hook
 */
export function useAutoRefresh(
  fetchFn: () => Promise<void> | void,
  options: AutoRefreshOptions = {}
) {
  const {
    interval = 30000, // 默认30秒
    enabled = true,
    onError,
    maxRetries = 3,
    backoffMultiplier = 2
  } = options

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [currentInterval, setCurrentInterval] = useState(interval)
  
  const fetchFnRef = useRef(fetchFn)
  const intervalRef = useRef<NodeJS.Timeout>()
  const isVisibleRef = useRef(true)

  // 更新函数引用
  useEffect(() => {
    fetchFnRef.current = fetchFn
  }, [fetchFn])

  // 页面可见性检测
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
      
      if (isVisibleRef.current && enabled) {
        // 页面重新可见时立即刷新一次
        handleRefresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enabled])

  // 执行刷新
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    
    try {
      await fetchFnRef.current()
      setLastRefresh(new Date())
      setRetryCount(0)
      setCurrentInterval(interval) // 重置间隔
    } catch (error) {
      const newRetryCount = retryCount + 1
      setRetryCount(newRetryCount)
      
      if (newRetryCount <= maxRetries) {
        // 指数退避
        const newInterval = interval * Math.pow(backoffMultiplier, newRetryCount)
        setCurrentInterval(newInterval)
        
        toast({
          title: "刷新失败",
          description: `第${newRetryCount}次重试，${Math.round(newInterval/1000)}秒后再次尝试`,
          variant: "destructive"
        })
      } else {
        toast({
          title: "刷新失败",
          description: "已达到最大重试次数，请手动刷新",
          variant: "destructive"
        })
      }

      if (onError) {
        onError(error as Error)
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, retryCount, maxRetries, interval, backoffMultiplier, onError])

  // 设置定时器
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    const startInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      intervalRef.current = setInterval(() => {
        // 只在页面可见时刷新
        if (isVisibleRef.current) {
          handleRefresh()
        }
      }, currentInterval)
    }

    startInterval()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, currentInterval, handleRefresh])

  // 手动刷新
  const manualRefresh = useCallback(() => {
    handleRefresh()
  }, [handleRefresh])

  // 暂停/恢复
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])

  const resume = useCallback(() => {
    if (enabled && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (isVisibleRef.current) {
          handleRefresh()
        }
      }, currentInterval)
    }
  }, [enabled, currentInterval, handleRefresh])

  return {
    isRefreshing,
    lastRefresh,
    retryCount,
    currentInterval,
    manualRefresh,
    pause,
    resume
  }
}

/**
 * 智能刷新Hook - 根据数据变化频率调整刷新间隔
 */
export function useSmartRefresh(
  fetchFn: () => Promise<any>,
  options: AutoRefreshOptions & {
    minInterval?: number
    maxInterval?: number
    adaptiveThreshold?: number // 数据变化阈值
  } = {}
) {
  const {
    minInterval = 5000,
    maxInterval = 300000, // 5分钟
    adaptiveThreshold = 0.1, // 10%变化率
    ...autoRefreshOptions
  } = options

  const [dataHistory, setDataHistory] = useState<any[]>([])
  const [adaptiveInterval, setAdaptiveInterval] = useState(autoRefreshOptions.interval || 30000)

  // 包装fetchFn以收集数据变化
  const wrappedFetchFn = useCallback(async () => {
    const result = await fetchFn()
    
    setDataHistory(prev => {
      const newHistory = [...prev, result].slice(-10) // 保留最近10次数据
      
      // 计算数据变化率
      if (newHistory.length >= 2) {
        const recent = newHistory.slice(-3) // 最近3次
        const changes = recent.slice(1).map((curr, idx) => {
          const prev = recent[idx]
          return JSON.stringify(curr) !== JSON.stringify(prev)
        })
        
        const changeRate = changes.filter(Boolean).length / changes.length
        
        // 根据变化率调整间隔
        if (changeRate > adaptiveThreshold) {
          // 数据变化频繁，缩短间隔
          setAdaptiveInterval(prev => Math.max(minInterval, prev * 0.8))
        } else {
          // 数据变化不频繁，延长间隔
          setAdaptiveInterval(prev => Math.min(maxInterval, prev * 1.2))
        }
      }
      
      return newHistory
    })
    
    return result
  }, [fetchFn, adaptiveThreshold, minInterval, maxInterval])

  return useAutoRefresh(wrappedFetchFn, {
    ...autoRefreshOptions,
    interval: adaptiveInterval
  })
}

/**
 * 条件刷新Hook - 根据条件决定是否刷新
 */
export function useConditionalRefresh(
  fetchFn: () => Promise<void> | void,
  condition: () => boolean,
  options: AutoRefreshOptions = {}
) {
  const conditionalFetchFn = useCallback(async () => {
    if (condition()) {
      await fetchFn()
    }
  }, [fetchFn, condition])

  return useAutoRefresh(conditionalFetchFn, options)
}

/**
 * 多数据源刷新Hook
 */
export function useMultiSourceRefresh(
  sources: Array<{
    name: string
    fetchFn: () => Promise<void> | void
    interval?: number
    enabled?: boolean
  }>,
  globalOptions: AutoRefreshOptions = {}
) {
  const refreshStates = sources.map(source => 
    useAutoRefresh(source.fetchFn, {
      ...globalOptions,
      interval: source.interval || globalOptions.interval,
      enabled: source.enabled !== undefined ? source.enabled : globalOptions.enabled
    })
  )

  const manualRefreshAll = useCallback(() => {
    refreshStates.forEach(state => state.manualRefresh())
  }, [refreshStates])

  const pauseAll = useCallback(() => {
    refreshStates.forEach(state => state.pause())
  }, [refreshStates])

  const resumeAll = useCallback(() => {
    refreshStates.forEach(state => state.resume())
  }, [refreshStates])

  return {
    sources: sources.map((source, index) => ({
      ...source,
      ...refreshStates[index]
    })),
    manualRefreshAll,
    pauseAll,
    resumeAll,
    isAnyRefreshing: refreshStates.some(state => state.isRefreshing)
  }
}