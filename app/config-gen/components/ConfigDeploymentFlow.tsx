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
import { 
  Settings, 
  Download, 
  Upload, 
  Server, 
  CheckCircle, 
  AlertCircle,
  Code,
  Save,
  Play,
  FileText,
  Target,
  Zap
} from 'lucide-react'

import { IntegratedHostSelection } from '@/app/monitoring-installer/components/IntegratedHostSelection'

interface ConfigTemplate {
  id: string
  name: string
  type: 'snmp_exporter' | 'prometheus' | 'grafana' | 'victoriametrics'
  description: string
  category: string
  content: string
  parameters: ConfigParameter[]
  targetComponents: string[]
}

interface ConfigParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select'
  description: string
  defaultValue: any
  required: boolean
  options?: string[]
}

interface ConfigDeploymentFlowProps {
  templates: ConfigTemplate[]
}

export function ConfigDeploymentFlow({ templates }: ConfigDeploymentFlowProps) {
  // 部署步骤状态
  const [currentStep, setCurrentStep] = useState<'template' | 'hosts' | 'config' | 'deploy'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<ConfigTemplate | null>(null)
  const [selectedHosts, setSelectedHosts] = useState<string[]>([])
  const [configParameters, setConfigParameters] = useState<Record<string, any>>({})
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployProgress, setDeployProgress] = useState(0)

  // 步骤1: 选择配置模板
  const handleTemplateSelect = (template: ConfigTemplate) => {
    setSelectedTemplate(template)
    // 初始化参数默认值
    const defaultParams: Record<string, any> = {}
    template.parameters.forEach(param => {
      defaultParams[param.name] = param.defaultValue
    })
    setConfigParameters(defaultParams)
    setCurrentStep('hosts')
  }

  // 步骤2: 主机选择完成
  const handleHostsSelected = (hosts: string[]) => {
    setSelectedHosts(hosts)
    setCurrentStep('config')
  }

  // 步骤3: 配置参数
  const handleParameterChange = (paramName: string, value: any) => {
    setConfigParameters(prev => ({
      ...prev,
      [paramName]: value
    }))
  }

  // 步骤4: 执行部署
  const handleDeploy = async () => {
    if (!selectedTemplate || selectedHosts.length === 0) return

    setIsDeploying(true)
    setDeployProgress(0)
    setCurrentStep('deploy')

    try {
      // 生成最终配置
      const finalConfig = generateFinalConfig(selectedTemplate, configParameters)

      // 调用部署API
      const response = await fetch('/api/config/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          hosts: selectedHosts,
          config: finalConfig,
          parameters: configParameters
        })
      })

      const result = await response.json()

      if (result.success) {
        // 模拟部署进度
        const interval = setInterval(() => {
          setDeployProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval)
              setIsDeploying(false)
              return 100
            }
            return prev + 10
          })
        }, 500)
      } else {
        setIsDeploying(false)
        console.error('配置部署失败:', result.error)
      }
    } catch (error) {
      setIsDeploying(false)
      console.error('配置部署请求失败:', error)
    }
  }

  // 生成最终配置
  const generateFinalConfig = (template: ConfigTemplate, params: Record<string, any>): string => {
    let config = template.content
    
    // 替换参数占位符
    Object.entries(params).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      config = config.replace(new RegExp(placeholder, 'g'), String(value))
    })
    
    return config
  }

  // 返回上一步
  const handleBackStep = () => {
    if (currentStep === 'hosts') {
      setCurrentStep('template')
    } else if (currentStep === 'config') {
      setCurrentStep('hosts')
    } else if (currentStep === 'deploy') {
      setCurrentStep('config')
    }
  }

  return (
    <div className="space-y-6">
      {/* 步骤指示器 */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className={`flex items-center space-x-2 ${currentStep === 'template' ? 'text-blue-600' : currentStep === 'hosts' || currentStep === 'config' || currentStep === 'deploy' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'template' ? 'bg-blue-600 text-white' : currentStep === 'hosts' || currentStep === 'config' || currentStep === 'deploy' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="font-medium">选择模板</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep === 'hosts' || currentStep === 'config' || currentStep === 'deploy' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'hosts' ? 'text-blue-600' : currentStep === 'config' || currentStep === 'deploy' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'hosts' ? 'bg-blue-600 text-white' : currentStep === 'config' || currentStep === 'deploy' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="font-medium">选择主机</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep === 'config' || currentStep === 'deploy' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'config' ? 'text-blue-600' : currentStep === 'deploy' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'config' ? 'bg-blue-600 text-white' : currentStep === 'deploy' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            3
          </div>
          <span className="font-medium">配置参数</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep === 'deploy' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'deploy' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'deploy' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            4
          </div>
          <span className="font-medium">执行部署</span>
        </div>
      </div>

      {/* 步骤1: 选择配置模板 */}
      {currentStep === 'template' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择配置模板</CardTitle>
              <CardDescription>选择要部署的配置模板</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Target className="mr-1 h-3 w-3" />
                          目标组件: {template.targetComponents.join(', ')}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Settings className="mr-1 h-3 w-3" />
                          参数数量: {template.parameters.length}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤2: 主机选择 */}
      {currentStep === 'hosts' && selectedTemplate && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择目标主机</CardTitle>
              <CardDescription>
                为配置模板 "{selectedTemplate.name}" 选择部署主机
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegratedHostSelection 
                selectedComponents={selectedTemplate.targetComponents}
                onHostsSelected={handleHostsSelected}
                onBack={handleBackStep}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤3: 配置参数 */}
      {currentStep === 'config' && selectedTemplate && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>配置参数</CardTitle>
              <CardDescription>
                设置配置模板的参数值
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">参数设置</h4>
                  {selectedTemplate.parameters.map((param) => (
                    <div key={param.name} className="space-y-2">
                      <Label htmlFor={param.name}>
                        {param.name}
                        {param.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {param.type === 'string' && (
                        <Input
                          id={param.name}
                          value={configParameters[param.name] || ''}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          placeholder={param.description}
                        />
                      )}
                      {param.type === 'number' && (
                        <Input
                          id={param.name}
                          type="number"
                          value={configParameters[param.name] || ''}
                          onChange={(e) => handleParameterChange(param.name, Number(e.target.value))}
                          placeholder={param.description}
                        />
                      )}
                      {param.type === 'boolean' && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={param.name}
                            checked={configParameters[param.name] || false}
                            onCheckedChange={(checked) => handleParameterChange(param.name, checked)}
                          />
                          <Label htmlFor={param.name} className="text-sm">
                            {param.description}
                          </Label>
                        </div>
                      )}
                      {param.type === 'select' && param.options && (
                        <Select
                          value={configParameters[param.name] || ''}
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
                  <h4 className="font-medium">配置预览</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs overflow-auto max-h-96">
                      {generateFinalConfig(selectedTemplate, configParameters)}
                    </pre>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">部署摘要</h4>
                    <p className="text-sm text-muted-foreground">
                      将配置部署到 {selectedHosts.length} 台主机
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={handleBackStep}>
                      返回
                    </Button>
                    <Button onClick={handleDeploy}>
                      <Zap className="mr-2 h-4 w-4" />
                      开始部署
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤4: 执行部署 */}
      {currentStep === 'deploy' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>配置部署进度</CardTitle>
              <CardDescription>
                正在将配置部署到选定的主机
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDeploying ? (
                <div className="space-y-4">
                  <Alert>
                    <Play className="h-4 w-4" />
                    <AlertDescription>
                      正在部署配置... {deployProgress}%
                      <Progress value={deployProgress} className="mt-2" />
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">部署详情</h4>
                    <div className="text-sm space-y-1">
                      <div>模板: {selectedTemplate?.name}</div>
                      <div>目标主机: {selectedHosts.length} 台</div>
                      <div>配置类型: {selectedTemplate?.type}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                  <h3 className="mt-4 text-lg font-medium">部署完成</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    配置已成功部署到所有选定的主机
                  </p>
                  <div className="mt-4 space-x-2">
                    <Button variant="outline" onClick={() => setCurrentStep('template')}>
                      部署新配置
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      查看部署状态
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