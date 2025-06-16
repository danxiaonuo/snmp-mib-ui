// 统一错误处理系统
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly code?: string

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.code = code

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, true, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, true, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false, 'INTERNAL_SERVER_ERROR')
    this.name = 'InternalServerError'
  }
}

// 错误处理中间件
export const handleError = (error: Error): {
  message: string
  statusCode: number
  code?: string
  stack?: string
} => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    }
  }

  // 处理已知的第三方错误
  if (error.name === 'ValidationError') {
    return {
      message: error.message,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    }
  }

  if (error.name === 'CastError') {
    return {
      message: 'Invalid ID format',
      statusCode: 400,
      code: 'INVALID_ID',
    }
  }

  if (error.name === 'MongoError' && (error as any).code === 11000) {
    return {
      message: 'Duplicate field value',
      statusCode: 409,
      code: 'DUPLICATE_FIELD',
    }
  }

  // 默认错误
  return {
    message: 'Something went wrong',
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  }
}

// API响应包装器
export const apiResponse = {
  success: <T>(data: T, message?: string) => ({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  }),

  error: (error: Error | AppError, message?: string) => {
    const errorInfo = handleError(error)
    return {
      success: false,
      error: {
        message: message || errorInfo.message,
        code: errorInfo.code,
        statusCode: errorInfo.statusCode,
      },
      timestamp: new Date().toISOString(),
    }
  },

  paginated: <T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    message?: string
  ) => ({
    success: true,
    data: {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    },
    message,
    timestamp: new Date().toISOString(),
  }),
}

// 异步错误捕获包装器
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 日志记录
export const logError = (error: Error, context?: Record<string, any>) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    ...context,
  }

  if (error instanceof AppError && error.isOperational) {
    console.warn('Operational Error:', errorInfo)
  } else {
    console.error('System Error:', errorInfo)
  }
}

// 错误边界组件的错误处理
export const handleComponentError = (error: Error, errorInfo: any) => {
  logError(error, {
    componentStack: errorInfo.componentStack,
    type: 'COMPONENT_ERROR',
  })

  // 在生产环境中，可以发送错误到监控服务
  if (process.env.NODE_ENV === 'production') {
    // sendErrorToMonitoring(error, errorInfo)
  }
}