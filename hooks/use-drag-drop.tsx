"use client"

import { useState, useCallback, useRef, DragEvent } from 'react'
import { toast } from '@/hooks/use-toast'

export interface DragDropOptions {
  accept?: string[] // 接受的文件类型
  maxSize?: number // 最大文件大小（字节）
  multiple?: boolean // 是否支持多文件
  onDrop?: (files: File[]) => void
  onDragEnter?: () => void
  onDragLeave?: () => void
  onError?: (error: string) => void
}

/**
 * 拖拽上传Hook
 */
export function useDragDrop(options: DragDropOptions = {}) {
  const {
    accept = [],
    maxSize = 10 * 1024 * 1024, // 默认10MB
    multiple = true,
    onDrop,
    onDragEnter,
    onDragLeave,
    onError
  } = options

  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const dropRef = useRef<HTMLDivElement>(null)

  // 验证文件
  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = []
    
    for (const file of files) {
      // 检查文件类型
      if (accept.length > 0) {
        const isValidType = accept.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase())
          }
          return file.type.match(type.replace('*', '.*'))
        })
        
        if (!isValidType) {
          onError?.(`文件 ${file.name} 类型不支持`)
          continue
        }
      }
      
      // 检查文件大小
      if (file.size > maxSize) {
        onError?.(`文件 ${file.name} 超过大小限制 (${Math.round(maxSize / 1024 / 1024)}MB)`)
        continue
      }
      
      validFiles.push(file)
    }
    
    return validFiles
  }, [accept, maxSize, onError])

  // 处理拖拽进入
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragCounter(prev => prev + 1)
    
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
      onDragEnter?.()
    }
  }, [onDragEnter])

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragCounter(prev => {
      const newCounter = prev - 1
      if (newCounter === 0) {
        setIsDragging(false)
        onDragLeave?.()
      }
      return newCounter
    })
  }, [onDragLeave])

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // 处理文件放置
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(false)
    setDragCounter(0)
    
    const files = Array.from(e.dataTransfer?.files || [])
    
    if (files.length === 0) return
    
    if (!multiple && files.length > 1) {
      onError?.('只能上传一个文件')
      return
    }
    
    const validFiles = validateFiles(files)
    
    if (validFiles.length > 0) {
      onDrop?.(validFiles)
      toast({
        title: "文件上传",
        description: `成功接收 ${validFiles.length} 个文件`,
      })
    }
  }, [multiple, validateFiles, onDrop, onError])

  // 获取拖拽属性
  const getDragProps = () => ({
    ref: dropRef,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  })

  return {
    isDragging,
    getDragProps,
    dropRef
  }
}

/**
 * 列表拖拽排序Hook
 */
export function useDragSort<T>(
  items: T[],
  onReorder: (newItems: T[]) => void,
  keyExtractor: (item: T) => string | number = (item, index) => index
) {
  const [draggedItem, setDraggedItem] = useState<T | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  // 开始拖拽
  const handleDragStart = useCallback((item: T, index: number) => {
    setDraggedItem(item)
    setDraggedIndex(index)
  }, [])

  // 拖拽进入
  const handleDragEnter = useCallback((index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropIndex(index)
    }
  }, [draggedIndex])

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dropIndex !== null && draggedIndex !== dropIndex) {
      const newItems = [...items]
      const draggedItem = newItems[draggedIndex]
      
      // 移除拖拽项
      newItems.splice(draggedIndex, 1)
      
      // 插入到新位置
      newItems.splice(dropIndex, 0, draggedItem)
      
      onReorder(newItems)
      
      toast({
        title: "排序更新",
        description: "列表顺序已更新",
      })
    }
    
    setDraggedItem(null)
    setDraggedIndex(null)
    setDropIndex(null)
  }, [items, draggedIndex, dropIndex, onReorder])

  // 获取拖拽项属性
  const getDragItemProps = (item: T, index: number) => ({
    draggable: true,
    onDragStart: () => handleDragStart(item, index),
    onDragEnter: () => handleDragEnter(index),
    onDragEnd: handleDragEnd,
    onDragOver: (e: DragEvent) => e.preventDefault(),
    style: {
      opacity: draggedIndex === index ? 0.5 : 1,
      transform: dropIndex === index ? 'scale(1.02)' : 'scale(1)',
      transition: 'all 0.2s ease'
    }
  })

  return {
    draggedItem,
    draggedIndex,
    dropIndex,
    getDragItemProps
  }
}

/**
 * 拖拽调整大小Hook
 */
export function useDragResize(
  initialSize: { width: number; height: number },
  onResize?: (size: { width: number; height: number }) => void,
  constraints?: {
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
  }
) {
  const [size, setSize] = useState(initialSize)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>('')
  const startPos = useRef({ x: 0, y: 0 })
  const startSize = useRef(initialSize)

  const {
    minWidth = 100,
    maxWidth = window.innerWidth,
    minHeight = 100,
    maxHeight = window.innerHeight
  } = constraints || {}

  // 开始调整大小
  const handleResizeStart = useCallback((direction: string, e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    setResizeDirection(direction)
    startPos.current = { x: e.clientX, y: e.clientY }
    startSize.current = size
  }, [size])

  // 调整大小中
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const deltaX = e.clientX - startPos.current.x
    const deltaY = e.clientY - startPos.current.y

    let newWidth = startSize.current.width
    let newHeight = startSize.current.height

    if (resizeDirection.includes('right')) {
      newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.current.width + deltaX))
    }
    if (resizeDirection.includes('left')) {
      newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.current.width - deltaX))
    }
    if (resizeDirection.includes('bottom')) {
      newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.current.height + deltaY))
    }
    if (resizeDirection.includes('top')) {
      newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.current.height - deltaY))
    }

    const newSize = { width: newWidth, height: newHeight }
    setSize(newSize)
    onResize?.(newSize)
  }, [isResizing, resizeDirection, minWidth, maxWidth, minHeight, maxHeight, onResize])

  // 结束调整大小
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setResizeDirection('')
  }, [])

  // 监听鼠标事件
  useState(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  })

  // 获取调整大小手柄属性
  const getResizeHandleProps = (direction: string) => ({
    onMouseDown: (e: React.MouseEvent) => handleResizeStart(direction, e),
    style: {
      cursor: direction.includes('right') || direction.includes('left') 
        ? 'ew-resize' 
        : direction.includes('top') || direction.includes('bottom')
        ? 'ns-resize'
        : 'nwse-resize'
    }
  })

  return {
    size,
    isResizing,
    resizeDirection,
    getResizeHandleProps,
    setSize
  }
}