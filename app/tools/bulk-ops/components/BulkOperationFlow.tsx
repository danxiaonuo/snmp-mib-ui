"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Settings, 
  Server, 
  CheckCircle, 
  AlertCircle,
  Play,
  Zap,
  RefreshCw,
  Terminal,
  FileText,
  Download,
  Upload,
  Trash2,
  Power,
  RotateCcw
} from 'lucide-react'

import { IntegratedHostSelection } from '@/app/monitoring-installer/components/IntegratedHostSelection'

interface BulkOperation {
  id: string
  name: string
  description: string
  category: 'system' | 'config' | 'monitoring' | 'maintenance'
  type: 'command' | 'script' | 'config' | 'service'
  command?: string
  script?: string
  parameters: OperationParameter[]
  requiresConfirmation: boolean
  dangerLevel: 'low' | 'medium' | 'high'
  estimatedDuration: string
}

interface OperationParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'file'
  description: string
  defaultValue: any
  required: boolean
  options?: string[]
  validation?: string
}

interface BulkOperationFlowProps {
  operations: BulkOperation[]
}

export function BulkOperationFlow({ operations }: BulkOperationFlowProps) {
  // 操作步骤状态
  const [currentStep, setCurrentStep] = useState<'operation' | 'hosts' | 'config' | 'execute'>('operation')
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null)
  const [selectedHosts, setSelectedHosts] = useState<string[]>([])
  const [operationParams, setOperationParams] = useState<Record<string, any>>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionProgress, setExecutionProgress] = useState(0)
  const [executionResults, setExecutionResults] = useState<any[]>([])

  // 步骤1: 选择操作
  const handleOperationSelect = (operation: BulkOperation) => {
    setSelectedOperation(operation)
    // 初始化参数默认值
    const defaultParams: Record<string, any> = {}
    operation.parameters.forEach(param => {
      defaultParams[param.name] = param.defaultValue
    })
    setOperationParams(defaultParams)
    setCurrentStep('hosts')
  }

  // 步骤2: 主机选择完成
  const handleHostsSelected = (hosts: string[]) => {
    setSelectedHosts(hosts)
    setCurrentStep('config')
  }

  // 步骤3: 配置参数
  const handleParameterChange = (paramName: string, value: any) => {
    setOperationParams(prev => ({
      ...prev,
      [paramName]: value
    }))
  }

  // 步骤4: 执行操作
  const handleExecute = async () => {
    if (!selectedOperation || selectedHosts.length === 0) return

    setIsExecuting(true)
    setExecutionProgress(0)
    setCurrentStep('execute')

    try {
      // 调用批量操作API
      const response = await fetch('/api/bulk-operations/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operationId: selectedOperation.id,
          hosts: selectedHosts,
          parameters: operationParams
        })
      })

      const result = await response.json()

      if (result.success) {
        // 模拟执行进度
        const interval = setInterval(() => {
          setExecutionProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval)
              setIsExecuting(false)
              setExecutionResults(result.results || [])
              return 100
            }
            return prev + 5
          })
        }, 800)
      } else {
        setIsExecuting(false)
        console.error('批量操作执行失败:', result.error)
      }
    } catch (error) {
      setIsExecuting(false)
      console.error('批量操作请求失败:', error)
    }
  }

  // 返回上一步
  const handleBackStep = () => {
    if (currentStep === 'hosts') {
      setCurrentStep('operation')
    } else if (currentStep === 'config') {
      setCurrentStep('hosts')
    } else if (currentStep === 'execute') {
      setCurrentStep('config')
    }
  }

  const getDangerColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return Server
      case 'config': return Settings
      case 'monitoring': return RefreshCw
      case 'maintenance': return Terminal
      default: return FileText
    }
  }

  return (
    <div className="space-y-6">
      {/* 步骤指示器 */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className={`flex items-center space-x-2 ${currentStep === 'operation' ? 'text-blue-600' : currentStep === 'hosts' || currentStep === 'config' || currentStep === 'execute' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'operation' ? 'bg-blue-600 text-white' : currentStep === 'hosts' || currentStep === 'config' || currentStep === 'execute' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="font-medium">选择操作</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep === 'hosts' || currentStep === 'config' || currentStep === 'execute' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'hosts' ? 'text-blue-600' : currentStep === 'config' || currentStep === 'execute' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'hosts' ? 'bg-blue-600 text-white' : currentStep === 'config' || currentStep === 'execute' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="font-medium">选择主机</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep === 'config' || currentStep === 'execute' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'config' ? 'text-blue-600' : currentStep === 'execute' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'config' ? 'bg-blue-600 text-white' : currentStep === 'execute' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            3
          </div>
          <span className="font-medium">配置参数</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep === 'execute' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'execute' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'execute' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            4
          </div>
          <span className="font-medium">执行操作</span>
        </div>
      </div>

      {/* 步骤1: 选择批量操作 */}
      {currentStep === 'operation' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择批量操作</CardTitle>
              <CardDescription>选择要执行的批量操作类型</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {operations.map((operation) => {
                  const CategoryIcon = getCategoryIcon(operation.category)
                  
                  return (
                    <Card 
                      key={operation.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${selectedOperation?.id === operation.id ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => handleOperationSelect(operation)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CategoryIcon className="h-5 w-5" />
                            <CardTitle className="text-base">{operation.name}</CardTitle>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={getDangerColor(operation.dangerLevel)}
                          >
                            {operation.dangerLevel}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {operation.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">类型</span>
                            <Badge variant="secondary">{operation.type}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">预计时长</span>
                            <span>{operation.estimatedDuration}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">参数数量</span>
                            <span>{operation.parameters.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤2: 主机选择 */}
      {currentStep === 'hosts' && selectedOperation && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择目标主机</CardTitle>
              <CardDescription>
                为操作 "{selectedOperation.name}" 选择目标主机
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegratedHostSelection 
                selectedComponents={[]} // 批量操作不限制组件
                onHostsSelected={handleHostsSelected}
                onBack={handleBackStep}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤3: 配置参数 */}
      {currentStep === 'config' && selectedOperation && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>配置操作参数</CardTitle>
              <CardDescription>
                设置批量操作的参数
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">操作参数</h4>
                  {selectedOperation.parameters.map((param) => (
                    <div key={param.name} className="space-y-2">
                      <Label htmlFor={param.name}>
                        {param.name}
                        {param.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      
                      {param.type === 'string' && (
                        <Input
                          id={param.name}
                          value={operationParams[param.name] || ''}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          placeholder={param.description}
                        />
                      )}
                      
                      {param.type === 'number' && (
                        <Input
                          id={param.name}
                          type="number"
                          value={operationParams[param.name] || ''}
                          onChange={(e) => handleParameterChange(param.name, Number(e.target.value))}
                          placeholder={param.description}
                        />
                      )}
                      
                      {param.type === 'boolean' && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={param.name}
                            checked={operationParams[param.name] || false}
                            onCheckedChange={(checked) => handleParameterChange(param.name, checked)}
                          />
                          <Label htmlFor={param.name} className="text-sm">
                            {param.description}
                          </Label>
                        </div>
                      )}
                      
                      {param.type === 'select' && param.options && (
                        <Select
                          value={operationParams[param.name] || ''}
                          onValueChange={(value) => handleParameterChange(param.name, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={param.description} />
                          </SelectTrigger>
                          <SelectContent>
                            {param.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      <p className="text-xs text-muted-foreground">{param.description}</p>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">操作预览</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div><strong>操作:</strong> {selectedOperation.name}</div>
                      <div><strong>类型:</strong> {selectedOperation.type}</div>
                      <div><strong>目标主机:</strong> {selectedHosts.length} 台</div>
                      <div><strong>危险级别:</strong> 
                        <Badge className={`ml-2 ${getDangerColor(selectedOperation.dangerLevel)}`}>
                          {selectedOperation.dangerLevel}
                        </Badge>
                      </div>
                      <div><strong>预计时长:</strong> {selectedOperation.estimatedDuration}</div>
                    </div>
                  </div>
                  
                  {selectedOperation.requiresConfirmation && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        此操作需要确认。请仔细检查参数设置，确保操作安全。
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">执行摘要</h4>
                    <p className="text-sm text-muted-foreground">
                      将在 {selectedHosts.length} 台主机上执行 "{selectedOperation.name}"
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={handleBackStep}>
                      返回
                    </Button>
                    <Button onClick={handleExecute}>
                      <Zap className="mr-2 h-4 w-4" />
                      开始执行
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤4: 执行操作 */}
      {currentStep === 'execute' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>批量操作执行进度</CardTitle>
              <CardDescription>
                正在执行批量操作
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isExecuting ? (
                <div className="space-y-4">
                  <Alert>
                    <Play className="h-4 w-4" />
                    <AlertDescription>
                      正在执行操作... {executionProgress}%
                      <Progress value={executionProgress} className="mt-2" />
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">执行详情</h4>
                    <div className="text-sm space-y-1">
                      <div>操作: {selectedOperation?.name}</div>
                      <div>目标主机: {selectedHosts.length} 台</div>
                      <div>操作类型: {selectedOperation?.type}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                  <h3 className="mt-4 text-lg font-medium">操作完成</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    批量操作已在所有选定主机上执行完成
                  </p>
                  
                  {executionResults.length > 0 && (
                    <div className="mt-6 text-left">
                      <h4 className="font-medium mb-4">执行结果</h4>
                      <div className="space-y-2">
                        {executionResults.map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{result.host}</span>
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? "成功" : "失败"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 space-x-2">
                    <Button variant="outline" onClick={() => setCurrentStep('operation')}>
                      执行新操作
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      查看详细结果
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}