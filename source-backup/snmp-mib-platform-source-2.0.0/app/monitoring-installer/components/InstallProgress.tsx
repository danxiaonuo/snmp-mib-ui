'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Play, 
  Square, 
  RefreshCw,
  Terminal,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

interface InstallStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startTime?: Date
  endTime?: Date
  output?: string[]
  error?: string
}

interface ServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'error' | 'unknown'
  containerId?: string
  ports?: string[]
  uptime?: string
  health?: 'healthy' | 'unhealthy' | 'unknown'
}

interface InstallProgressProps {
  isInstalling: boolean
  components: string[]
  onInstall: () => void
  onCancel: () => void
  onRetry: () => void
}

const InstallProgress: React.FC<InstallProgressProps> = ({
  isInstalling,
  components,
  onInstall,
  onCancel,
  onRetry
}) => {
  const [steps, setSteps] = useState<InstallStep[]>([])
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [overallProgress, setOverallProgress] = useState(0)
  const [installOutput, setInstallOutput] = useState<string[]>([])
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([])
  const [showOutput, setShowOutput] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  // 初始化安装步骤
  useEffect(() => {
    if (components.length > 0) {
      const initialSteps: InstallStep[] = [
        {
          id: 'check-environment',
          name: '环境检查',
          description: '检查 Docker 和 Docker Compose 是否可用',
          status: 'pending'
        },
        {
          id: 'create-network',
          name: '创建网络',
          description: '创建监控组件专用网络',
          status: 'pending'
        },
        ...components.map(component => ({
          id: `install-${component}`,
          name: `安装 ${component}`,
          description: `下载并启动 ${component} 服务`,
          status: 'pending' as const
        })),
        {
          id: 'verify-services',
          name: '验证服务',
          description: '检查所有服务是否正常运行',
          status: 'pending'
        }
      ]
      
      setSteps(initialSteps)
      setEstimatedTime(initialSteps.length * 30) // 每步预估30秒
    }
  }, [components])

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isInstalling) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      setElapsedTime(0)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isInstalling])

  // 模拟安装过程
  useEffect(() => {
    if (isInstalling && steps.length > 0) {
      simulateInstallation()
    }
  }, [isInstalling, steps.length])

  const simulateInstallation = async () => {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      
      // 开始步骤
      setCurrentStep(step.id)
      updateStepStatus(step.id, 'running', { startTime: new Date() })
      addOutput(`开始执行: ${step.name}`)
      
      try {
        // 模拟步骤执行
        await executeStep(step)
        
        // 完成步骤
        updateStepStatus(step.id, 'completed', { endTime: new Date() })
        addOutput(`✓ 完成: ${step.name}`)
        
        // 更新进度
        setOverallProgress(((i + 1) / steps.length) * 100)
        
        // 如果是安装组件步骤，更新服务状态
        if (step.id.startsWith('install-')) {
          const componentName = step.id.replace('install-', '')
          await updateServiceStatus(componentName)
        }
        
      } catch (error) {
        // 步骤失败
        const errorMessage = error instanceof Error ? error.message : String(error)
        updateStepStatus(step.id, 'failed', { 
          endTime: new Date(), 
          error: errorMessage 
        })
        addOutput(`✗ 失败: ${step.name} - ${errorMessage}`)
        break
      }
      
      // 步骤间延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    setCurrentStep(null)
  }

  const executeStep = async (step: InstallStep): Promise<void> => {
    // 模拟不同步骤的执行时间和可能的错误
    const executionTime = Math.random() * 3000 + 1000 // 1-4秒
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟一些步骤可能失败
        if (Math.random() < 0.1) { // 10% 失败率
          reject(new Error(`模拟错误: ${step.name} 执行失败`))
        } else {
          resolve()
        }
      }, executionTime)
    })
  }

  const updateStepStatus = (stepId: string, status: InstallStep['status'], updates: Partial<InstallStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, ...updates }
        : step
    ))
  }

  const addOutput = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setInstallOutput(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const updateServiceStatus = async (componentName: string) => {
    // 模拟服务状态检查
    const mockStatus: ServiceStatus = {
      name: componentName,
      status: Math.random() > 0.2 ? 'running' : 'error',
      containerId: `mock-${componentName}-${Math.random().toString(36).substr(2, 9)}`,
      ports: getDefaultPorts(componentName),
      uptime: '刚刚启动',
      health: Math.random() > 0.1 ? 'healthy' : 'unhealthy'
    }
    
    setServiceStatuses(prev => {
      const existing = prev.findIndex(s => s.name === componentName)
      if (existing >= 0) {
        const newStatuses = [...prev]
        newStatuses[existing] = mockStatus
        return newStatuses
      } else {
        return [...prev, mockStatus]
      }
    })
  }

  const getDefaultPorts = (componentName: string): string[] => {
    const portMap: Record<string, string[]> = {
      'node-exporter': ['9100:9100'],
      'categraf': ['9100:9100'],
      'vmagent': ['8429:8429'],
      'victoriametrics': ['8428:8428'],
      'grafana': ['3000:3000'],
      'alertmanager': ['9093:9093'],
      'snmp-exporter': ['9116:9116']
    }
    return portMap[componentName] || []
  }

  const getStepIcon = (status: InstallStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case 'skipped':
        return <Clock className="h-5 w-5 text-gray-400" />
      default:
        return <Clock className="h-5 w-5 text-gray-300" />
    }
  }

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-100 text-green-800">运行中</Badge>
      case 'stopped':
        return <Badge className="bg-gray-100 text-gray-800">已停止</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">错误</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">未知</Badge>
    }
  }

  const getHealthBadge = (health: ServiceStatus['health']) => {
    switch (health) {
      case 'healthy':
        return <Badge variant="outline" className="text-green-600 border-green-600">健康</Badge>
      case 'unhealthy':
        return <Badge variant="outline" className="text-red-600 border-red-600">不健康</Badge>
      default:
        return <Badge variant="outline" className="text-gray-600 border-gray-600">未知</Badge>
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const completedSteps = steps.filter(step => step.status === 'completed').length
  const failedSteps = steps.filter(step => step.status === 'failed').length
  const hasErrors = failedSteps > 0
  const isCompleted = completedSteps === steps.length && !hasErrors

  return (
    <div className="space-y-6">
      {/* 总体进度 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>安装进度</CardTitle>
              <CardDescription>
                {isInstalling ? '正在安装监控组件...' : 
                 isCompleted ? '安装完成！' : 
                 hasErrors ? '安装遇到错误' : '准备开始安装'}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {Math.round(overallProgress)}%
              </div>
              <div className="text-sm text-gray-500">
                {isInstalling ? `已用时: ${formatTime(elapsedTime)}` : 
                 estimatedTime > 0 ? `预计: ${formatTime(estimatedTime)}` : ''}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="mb-4" />
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{completedSteps} / {steps.length} 步骤完成</span>
            <span>{components.length} 个组件</span>
          </div>
          
          {hasErrors && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                安装过程中遇到错误，请检查日志并重试。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 安装步骤 */}
      <Card>
        <CardHeader>
          <CardTitle>安装步骤</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  step.status === 'running' ? 'bg-blue-50 border border-blue-200' :
                  step.status === 'completed' ? 'bg-green-50' :
                  step.status === 'failed' ? 'bg-red-50' :
                  'bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{step.name}</span>
                    {step.status === 'running' && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        进行中
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                  {step.error && (
                    <p className="text-sm text-red-600 mt-1">错误: {step.error}</p>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {step.startTime && step.endTime && (
                    <span>
                      {Math.round((step.endTime.getTime() - step.startTime.getTime()) / 1000)}s
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 服务状态 */}
      {serviceStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>服务状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceStatuses.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="font-medium">{service.name}</div>
                    {getStatusBadge(service.status)}
                    {service.health && getHealthBadge(service.health)}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {service.ports && service.ports.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span>端口:</span>
                        {service.ports.map((port, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {port}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {service.uptime && (
                      <span>运行时间: {service.uptime}</span>
                    )}
                    {service.containerId && (
                      <span className="font-mono text-xs">
                        {service.containerId.substring(0, 12)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 安装日志 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>安装日志</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOutput(!showOutput)}
            >
              <Terminal className="h-4 w-4 mr-1" />
              {showOutput ? '隐藏' : '显示'}日志
            </Button>
          </div>
        </CardHeader>
        {showOutput && (
          <CardContent>
            <ScrollArea className="h-64 w-full border rounded-lg p-3">
              <div className="space-y-1 font-mono text-sm">
                {installOutput.map((line, index) => (
                  <div key={index} className="text-gray-700">
                    {line}
                  </div>
                ))}
                {installOutput.length === 0 && (
                  <div className="text-gray-500 text-center py-8">
                    暂无日志输出
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>

      {/* 操作按钮 */}
      <div className="flex items-center justify-center space-x-4">
        {!isInstalling && !isCompleted && (
          <Button onClick={onInstall} className="px-8">
            <Play className="h-4 w-4 mr-2" />
            开始安装
          </Button>
        )}
        
        {isInstalling && (
          <Button variant="outline" onClick={onCancel}>
            <Square className="h-4 w-4 mr-2" />
            取消安装
          </Button>
        )}
        
        {hasErrors && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            重试安装
          </Button>
        )}
        
        {isCompleted && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">安装完成！</span>
            </div>
            <div className="text-sm text-gray-600">
              所有组件已成功安装并运行
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstallProgress