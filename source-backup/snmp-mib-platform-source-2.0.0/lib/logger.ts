// 统一日志管理系统
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  component?: string
  action?: string
}

class Logger {
  private static instance: Logger
  private logLevel: LogLevel
  private logs: LogEntry[] = []
  private maxLogs: number = 1000

  private constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      component: this.getComponentName(),
    }
  }

  private getCurrentUserId(): string | undefined {
    // 从上下文或localStorage获取用户ID
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || undefined
    }
    return undefined
  }

  private getSessionId(): string | undefined {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('sessionId')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('sessionId', sessionId)
      }
      return sessionId
    }
    return undefined
  }

  private getComponentName(): string | undefined {
    // 尝试从错误堆栈中提取组件名
    const stack = new Error().stack
    if (stack) {
      const match = stack.match(/at (\w+)/)
      return match ? match[1] : undefined
    }
    return undefined
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // 发送到远程日志服务（生产环境）
    if (process.env.NODE_ENV === 'production' && entry.level >= LogLevel.ERROR) {
      this.sendToRemoteLogger(entry)
    }
  }

  private async sendToRemoteLogger(entry: LogEntry) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
    } catch (error) {
      // 静默失败，避免日志记录本身造成错误
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context)
      this.addLog(entry)
      console.debug(`🐛 [DEBUG] ${message}`, context)
    }
  }

  info(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context)
      this.addLog(entry)
      console.info(`ℹ️ [INFO] ${message}`, context)
    }
  }

  warn(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context)
      this.addLog(entry)
      console.warn(`⚠️ [WARN] ${message}`, context)
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, {
        ...context,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : undefined,
      })
      this.addLog(entry)
      console.error(`❌ [ERROR] ${message}`, error, context)
    }
  }

  // 获取最近的日志
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count)
  }

  // 按级别过滤日志
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  // 清除日志
  clearLogs() {
    this.logs = []
  }

  // 导出日志
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // 性能监控
  time(label: string) {
    console.time(label)
  }

  timeEnd(label: string, context?: Record<string, any>) {
    console.timeEnd(label)
    this.info(`Performance: ${label} completed`, context)
  }

  // API调用监控
  logApiCall(method: string, url: string, duration: number, status: number, context?: Record<string, any>) {
    const level = status >= 400 ? LogLevel.ERROR : status >= 300 ? LogLevel.WARN : LogLevel.INFO
    const message = `API ${method} ${url} - ${status} (${duration}ms)`
    
    if (level === LogLevel.ERROR) {
      this.error(message, undefined, { method, url, duration, status, ...context })
    } else if (level === LogLevel.WARN) {
      this.warn(message, { method, url, duration, status, ...context })
    } else {
      this.info(message, { method, url, duration, status, ...context })
    }
  }

  // 用户行为监控
  logUserAction(action: string, component: string, context?: Record<string, any>) {
    this.info(`User action: ${action} in ${component}`, {
      action,
      component,
      ...context,
    })
  }
}

// 导出单例实例
export const logger = Logger.getInstance()

// 便捷方法
export const log = {
  debug: (message: string, context?: Record<string, any>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, any>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, any>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context),
  time: (label: string) => logger.time(label),
  timeEnd: (label: string, context?: Record<string, any>) => logger.timeEnd(label, context),
  apiCall: (method: string, url: string, duration: number, status: number, context?: Record<string, any>) => 
    logger.logApiCall(method, url, duration, status, context),
  userAction: (action: string, component: string, context?: Record<string, any>) => 
    logger.logUserAction(action, component, context),
}

export default logger