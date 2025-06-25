"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  metadata?: Record<string, any>
}

interface NotificationCenterProps {
  maxNotifications?: number
  autoRemoveDelay?: number
  className?: string
}

// 全局通知状态管理
class NotificationManager {
  private notifications: Notification[] = []
  private listeners: Set<(notifications: Notification[]) => void> = new Set()

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]))
  }

  add(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    }

    this.notifications.unshift(newNotification)
    this.notify()

    // 自动移除非持久化通知
    if (!notification.persistent) {
      setTimeout(() => {
        this.remove(newNotification.id)
      }, 5000)
    }

    return newNotification.id
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.notify()
  }

  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id)
    if (notification) {
      notification.read = true
      this.notify()
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true)
    this.notify()
  }

  clear() {
    this.notifications = []
    this.notify()
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length
  }

  getAll() {
    return [...this.notifications]
  }
}

// 全局实例
export const notificationManager = new NotificationManager()

// 便捷方法
export const notify = {
  info: (title: string, message: string, options?: Partial<Notification>) =>
    notificationManager.add({ title, message, type: 'info', ...options }),
  
  success: (title: string, message: string, options?: Partial<Notification>) =>
    notificationManager.add({ title, message, type: 'success', ...options }),
  
  warning: (title: string, message: string, options?: Partial<Notification>) =>
    notificationManager.add({ title, message, type: 'warning', ...options }),
  
  error: (title: string, message: string, options?: Partial<Notification>) =>
    notificationManager.add({ title, message, type: 'error', persistent: true, ...options })
}

export function NotificationCenter({ 
  maxNotifications = 50,
  autoRemoveDelay = 5000,
  className 
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    return notificationManager.subscribe(setNotifications)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      notificationManager.markAsRead(notification.id)
    }
  }, [])

  const handleRemove = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    notificationManager.remove(id)
  }, [])

  const handleMarkAllRead = useCallback(() => {
    notificationManager.markAllAsRead()
  }, [])

  const handleClearAll = useCallback(() => {
    notificationManager.clear()
    setIsOpen(false)
  }, [])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return '刚刚'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("relative", className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">通知中心</h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                <Check className="h-4 w-4 mr-1" />
                全部已读
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                <X className="h-4 w-4 mr-1" />
                清空
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">暂无通知</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.slice(0, maxNotifications).map((notification) => (
                <Card
                  key={notification.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    !notification.read && "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={cn(
                              "text-sm font-medium truncate",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(notification.timestamp)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={(e) => handleRemove(notification.id, e)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {notification.action && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              notification.action!.onClick()
                            }}
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > maxNotifications && (
          <div className="p-3 border-t text-center">
            <p className="text-xs text-muted-foreground">
              还有 {notifications.length - maxNotifications} 条通知未显示
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Hook for using notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    return notificationManager.subscribe(setNotifications)
  }, [])

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    add: notificationManager.add.bind(notificationManager),
    remove: notificationManager.remove.bind(notificationManager),
    markAsRead: notificationManager.markAsRead.bind(notificationManager),
    markAllAsRead: notificationManager.markAllAsRead.bind(notificationManager),
    clear: notificationManager.clear.bind(notificationManager),
    notify
  }
}