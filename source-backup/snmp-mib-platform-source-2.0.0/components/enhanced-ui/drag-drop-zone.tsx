"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  X,
  Check,
  AlertCircle,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDragDrop } from '@/hooks/use-drag-drop'

interface DragDropZoneProps {
  accept?: string[]
  maxSize?: number
  multiple?: boolean
  onFilesSelected: (files: File[]) => void
  className?: string
  disabled?: boolean
  children?: React.ReactNode
}

export function DragDropZone({
  accept = [],
  maxSize = 10 * 1024 * 1024,
  multiple = true,
  onFilesSelected,
  className,
  disabled = false,
  children
}: DragDropZoneProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const { isDragging, getDragProps } = useDragDrop({
    accept,
    maxSize,
    multiple,
    onDrop: onFilesSelected,
    onError: (error) => console.error('拖拽错误:', error)
  })

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = ''
  }

  const formatFileTypes = () => {
    if (accept.length === 0) return '所有文件'
    return accept.map(type => type.replace('*', '')).join(', ')
  }

  const formatMaxSize = () => {
    const mb = maxSize / (1024 * 1024)
    return mb >= 1 ? `${mb}MB` : `${maxSize / 1024}KB`
  }

  return (
    <div className={cn("relative", className)}>
      <Card 
        {...getDragProps()}
        className={cn(
          "border-2 border-dashed transition-all duration-200 cursor-pointer",
          isDragging && "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10"
        )}
        onClick={handleClick}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          {children || (
            <>
              <div className={cn(
                "mb-4 p-4 rounded-full transition-colors",
                isDragging ? "bg-blue-100 dark:bg-blue-900" : "bg-muted"
              )}>
                <Upload className={cn(
                  "h-8 w-8 transition-colors",
                  isDragging ? "text-blue-600" : "text-muted-foreground"
                )} />
              </div>
              
              <h3 className="text-lg font-medium mb-2">
                {isDragging ? '释放文件到这里' : '拖拽文件到这里'}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                或者 <span className="text-blue-600 underline">点击选择文件</span>
              </p>
              
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>支持格式: {formatFileTypes()}</p>
                <p>最大大小: {formatMaxSize()}</p>
                {multiple && <p>支持多文件上传</p>}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept.join(',')}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}

/**
 * 文件列表组件
 */
interface FileListProps {
  files: File[]
  onRemove?: (index: number) => void
  showProgress?: boolean
  uploadProgress?: Record<string, number>
  className?: string
}

export function FileList({ 
  files, 
  onRemove, 
  showProgress = false,
  uploadProgress = {},
  className 
}: FileListProps) {
  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase()
    
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) {
      return <Archive className="h-4 w-4" />
    }
    if (type.includes('text') || type.includes('json') || type.includes('xml')) {
      return <FileText className="h-4 w-4" />
    }
    
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getProgressStatus = (fileName: string) => {
    const progress = uploadProgress[fileName]
    if (progress === undefined) return 'pending'
    if (progress === 100) return 'completed'
    if (progress === -1) return 'error'
    return 'uploading'
  }

  if (files.length === 0) return null

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium">选中的文件 ({files.length})</h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {files.map((file, index) => {
          const status = getProgressStatus(file.name)
          const progress = uploadProgress[file.name] || 0
          
          return (
            <Card key={`${file.name}-${index}`} className="p-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 text-muted-foreground">
                  {getFileIcon(file)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                      
                      {status === 'completed' && (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          完成
                        </Badge>
                      )}
                      
                      {status === 'error' && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          失败
                        </Badge>
                      )}
                      
                      {onRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {showProgress && status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={progress} className="h-1" />
                      <p className="text-xs text-muted-foreground mt-1">
                        上传中... {progress}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 拖拽排序列表组件
 */
interface DragSortListProps<T> {
  items: T[]
  onReorder: (newItems: T[]) => void
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode
  keyExtractor: (item: T, index: number) => string | number
  className?: string
}

export function DragSortList<T>({
  items,
  onReorder,
  renderItem,
  keyExtractor,
  className
}: DragSortListProps<T>) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dropIndex, setDropIndex] = React.useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragEnter = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropIndex(index)
    }
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dropIndex !== null && draggedIndex !== dropIndex) {
      const newItems = [...items]
      const draggedItem = newItems[draggedIndex]
      
      newItems.splice(draggedIndex, 1)
      newItems.splice(dropIndex, 0, draggedItem)
      
      onReorder(newItems)
    }
    
    setDraggedIndex(null)
    setDropIndex(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div
          key={keyExtractor(item, index)}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "transition-all duration-200 cursor-move",
            draggedIndex === index && "opacity-50 scale-95",
            dropIndex === index && "scale-105 shadow-lg"
          )}
        >
          {renderItem(item, index, draggedIndex === index)}
        </div>
      ))}
    </div>
  )
}