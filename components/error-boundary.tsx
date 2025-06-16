'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { handleComponentError } from '@/lib/error-handler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // 记录错误
    handleComponentError(error, errorInfo)

    // 调用自定义错误处理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                出现了一些问题
              </CardTitle>
              <CardDescription className="text-gray-600">
                应用程序遇到了意外错误，请稍后重试
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-md bg-red-50 p-3">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    错误详情 (仅开发环境显示):
                  </h4>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </pre>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">
                        查看堆栈跟踪
                      </summary>
                      <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap break-words">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="flex flex-col space-y-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重试
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  刷新页面
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/'} 
                  className="w-full"
                >
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// 高阶组件包装器
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// 异步组件错误边界
export const AsyncErrorBoundary: React.FC<{
  children: ReactNode
  fallback?: ReactNode
}> = ({ children, fallback }) => {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-8">
            <Card className="w-full max-w-sm">
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-yellow-500" />
                <p className="text-sm text-gray-600">加载组件时出错</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  重新加载
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  )
}