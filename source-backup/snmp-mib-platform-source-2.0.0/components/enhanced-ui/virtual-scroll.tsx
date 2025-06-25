"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"

interface VirtualScrollProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
  onScroll?: (scrollTop: number) => void
  getItemKey?: (item: T, index: number) => string | number
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
  onScroll,
  getItemKey = (_, index) => index
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  // 可见项目
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
  }, [items, visibleRange])

  // 总高度
  const totalHeight = items.length * itemHeight

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
  }, [onScroll])

  // 滚动到指定索引
  const scrollToIndex = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const targetScrollTop = index * itemHeight
      scrollElementRef.current.scrollTop = targetScrollTop
      setScrollTop(targetScrollTop)
    }
  }, [itemHeight])

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    scrollToIndex(0)
  }, [scrollToIndex])

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    scrollToIndex(items.length - 1)
  }, [scrollToIndex, items.length])

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        ref={scrollElementRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${visibleRange.startIndex * itemHeight}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map((item, index) => {
              const actualIndex = visibleRange.startIndex + index
              return (
                <div
                  key={getItemKey(item, actualIndex)}
                  style={{ height: itemHeight }}
                  className="flex items-center"
                >
                  {renderItem(item, actualIndex)}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* 滚动指示器 */}
      {items.length > 0 && (
        <div className="absolute right-2 top-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          {Math.floor(scrollTop / itemHeight) + 1} / {items.length}
        </div>
      )}
    </div>
  )
}

// 使用示例的 Hook
export function useVirtualScroll<T>(items: T[], itemHeight: number = 50) {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerHeight, setContainerHeight] = useState(400)

  useEffect(() => {
    if (!containerRef) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(containerRef)
    return () => resizeObserver.disconnect()
  }, [containerRef])

  return {
    containerRef: setContainerRef,
    containerHeight,
    itemHeight,
    totalItems: items.length
  }
}