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
import { Slider } from '@/components/ui/slider'
import { 
  AlertTriangle, 
  Bell, 
  Target, 
  Server, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Play,
  Zap,
  Clock,
  TrendingUp,
  Shield,
  Activity
} from 'lucide-react'

import { IntegratedHostSelection } from '@/app/monitoring-installer/components/IntegratedHostSelection'

interface AlertRule {
  id: string
  name: string
  description: string
  promql: string
  severity: 'info' | 'warning' | 'critical'
  category: string
  targetMetrics: string[]
  defaultThreshold: number
  defaultDuration: string
  parameters: AlertParameter[]
  applicableDeviceTypes: string[]
}

interface AlertParameter {
  name: string
  type: 'number' | 'duration' | 'select' | 'boolean'
  description: string
  defaultValue: any
  min?: number
  max?: number
  options?: string[]
  unit?: string
}

interface AlertRuleDeploymentFlowProps {
  alertRules: AlertRule[]
}

export function AlertRuleDeploymentFlow({ alertRules }: AlertRuleDeploymentFlowProps) {
  // 部署步骤状态
  const [currentStep, setCurrentStep] = useState<'rules' | 'hosts' | 'config' | 'deploy'>('rules')
  const [selectedRules, setSelectedRules] = useState<AlertRule[]>([])
  const [selectedHosts, setSelectedHosts] = useState<string[]>([])
  const [ruleConfigs, setRuleConfigs] = useState<Record<string, Record<string, any>>>({})
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployProgress, setDeployProgress] = useState(0)

  // 步骤1: 选择告警规则
  const handleRuleSelect = (rule: AlertRule, selected: boolean) => {
    if (selected) {
      setSelectedRules(prev => [...prev, rule])
      // 初始化规则参数默认值
      const defaultConfig: Record<string, any> = {}
      rule.parameters.forEach(param => {
        defaultConfig[param.name] = param.defaultValue
      })
      setRuleConfigs(prev => ({
        ...prev,
        [rule.id]: defaultConfig
      }))
    } else {
      setSelectedRules(prev => prev.filter(r => r.id !== rule.id))
      setRuleConfigs(prev => {
        const newConfigs = { ...prev }
        delete newConfigs[rule.id]
        return newConfigs
      })
    }
  }

  // 步骤2: 主机选择完成
  const handleHostsSelected = (hosts: string[]) => {
    setSelectedHosts(hosts)
    setCurrentStep('config')
  }

  // 步骤3: 配置告警参数
  const handleParameterChange = (ruleId: string, paramName: string, value: any) => {
    setRuleConfigs(prev => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        [paramName]: value
      }
    }))
  }

  // 步骤4: 执行部署
  const handleDeploy = async () => {
    if (selectedRules.length === 0 || selectedHosts.length === 0) return

    setIsDeploying(true)
    setDeployProgress(0)
    setCurrentStep('deploy')

    try {
      // 生成最终告警规则配置
      const finalRules = selectedRules.map(rule => ({
        ...rule,
        config: ruleConfigs[rule.id],
        finalPromql: generateFinalPromQL(rule, ruleConfigs[rule.id])
      }))

      // 调用部署API
      const response = await fetch('/api/alert-rules/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rules: finalRules,
          hosts: selectedHosts,
          deploymentConfig: {
            alertmanagerUrl: 'http://alertmanager:9093',
            prometheusUrl: 'http://prometheus:9090'
          }
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
            return prev + 8
          })
        }, 600)
      } else {
        setIsDeploying(false)
        console.error('告警规则部署失败:', result.error)
      }
    } catch (error) {
      setIsDeploying(false)
      console.error('告警规则部署请求失败:', error)
    }
  }

  // 生成最终PromQL
  const generateFinalPromQL = (rule: AlertRule, config: Record<string, any>): string => {
    let promql = rule.promql
    
    // 替换参数占位符
    Object.entries(config).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      promql = promql.replace(new RegExp(placeholder, 'g'), String(value))
    })
    
    return promql
  }

  // 返回上一步
  const handleBackStep = () => {
    if (currentStep === 'hosts') {
      setCurrentStep('rules')
    } else if (currentStep === 'config') {
      setCurrentStep('hosts')
    } else if (currentStep === 'deploy') {
      setCurrentStep('config')
    }
  }

  // 进入下一步
  const handleNextStep = () => {
    if (currentStep === 'rules' && selectedRules.length > 0) {
      setCurrentStep('hosts')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertTriangle
      case 'warning': return AlertCircle
      case 'info': return Bell
      default: return Bell
    }
  }

  return (
    <div className="space-y-6">
      {/* 步骤指示器 */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className={`flex items-center space-x-2 ${currentStep === 'rules' ? 'text-blue-600' : currentStep === 'hosts' || currentStep === 'config' || currentStep === 'deploy' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'rules' ? 'bg-blue-600 text-white' : currentStep === 'hosts' || currentStep === 'config' || currentStep === 'deploy' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="font-medium">选择规则</span>
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
          <span className="font-medium">配置阈值</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep === 'deploy' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'deploy' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'deploy' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            4
          </div>
          <span className="font-medium">执行部署</span>
        </div>
      </div>

      {/* 步骤1: 选择告警规则 */}
      {currentStep === 'rules' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>选择告警规则</CardTitle>
                  <CardDescription>选择要部署的告警规则模板</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    已选择 {selectedRules.length} 个规则
                  </Badge>
                  <Button 
                    onClick={handleNextStep}
                    disabled={selectedRules.length === 0}
                  >
                    下一步: 选择主机
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {alertRules.map((rule) => {
                  const isSelected = selectedRules.some(r => r.id === rule.id)
                  const SeverityIcon = getSeverityIcon(rule.severity)
                  
                  return (
                    <Card 
                      key={rule.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => handleRuleSelect(rule, !isSelected)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox checked={isSelected} readOnly />
                            <CardTitle className="text-base">{rule.name}</CardTitle>
                          </div>
                          <div className={`p-1 rounded ${getSeverityColor(rule.severity)}`}>
                            <SeverityIcon className="h-4 w-4" />
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          {rule.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">严重级别</span>
                            <Badge variant="outline" className={getSeverityColor(rule.severity)}>
                              {rule.severity}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">默认阈值</span>
                            <span>{rule.defaultThreshold}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">持续时间</span>
                            <span>{rule.defaultDuration}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {rule.targetMetrics.slice(0, 2).map(metric => (
                              <Badge key={metric} variant="secondary" className="text-xs">
                                {metric}
                              </Badge>
                            ))}
                            {rule.targetMetrics.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{rule.targetMetrics.length - 2}
                              </Badge>
                            )}
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
      {currentStep === 'hosts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择监控主机</CardTitle>
              <CardDescription>
                选择要应用告警规则的监控主机
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegratedHostSelection 
                selectedComponents={['prometheus', 'alertmanager']}
                onHostsSelected={handleHostsSelected}
                onBack={handleBackStep}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤3: 配置告警参数 */}
      {currentStep === 'config' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>配置告警参数</CardTitle>
              <CardDescription>
                为每个告警规则设置具体的阈值和参数
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {selectedRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{rule.name}</CardTitle>
                        <Badge variant="outline" className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                      </div>
                      <CardDescription>{rule.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {rule.parameters.map((param) => (
                          <div key={param.name} className="space-y-2">
                            <Label htmlFor={`${rule.id}-${param.name}`}>
                              {param.name}
                              {param.unit && <span className="text-muted-foreground ml-1">({param.unit})</span>}
                            </Label>
                            
                            {param.type === 'number' && (
                              <div className="space-y-2">
                                <Input
                                  id={`${rule.id}-${param.name}`}
                                  type="number"
                                  value={ruleConfigs[rule.id]?.[param.name] || ''}
                                  onChange={(e) => handleParameterChange(rule.id, param.name, Number(e.target.value))}
                                  min={param.min}
                                  max={param.max}
                                />
                                {param.min !== undefined && param.max !== undefined && (
                                  <Slider
                                    value={[ruleConfigs[rule.id]?.[param.name] || param.defaultValue]}
                                    onValueChange={([value]) => handleParameterChange(rule.id, param.name, value)}
                                    min={param.min}
                                    max={param.max}
                                    step={1}
                                    className="w-full"
                                  />
                                )}
                              </div>
                            )}
                            
                            {param.type === 'duration' && (
                              <Select
                                value={ruleConfigs[rule.id]?.[param.name] || ''}
                                onValueChange={(value) => handleParameterChange(rule.id, param.name, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="选择持续时间" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1m">1分钟</SelectItem>
                                  <SelectItem value="5m">5分钟</SelectItem>
                                  <SelectItem value="10m">10分钟</SelectItem>
                                  <SelectItem value="30m">30分钟</SelectItem>
                                  <SelectItem value="1h">1小时</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            
                            {param.type === 'select' && param.options && (
                              <Select
                                value={ruleConfigs[rule.id]?.[param.name] || ''}
                                onValueChange={(value) => handleParameterChange(rule.id, param.name, value)}
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
                            
                            {param.type === 'boolean' && (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${rule.id}-${param.name}`}
                                  checked={ruleConfigs[rule.id]?.[param.name] || false}
                                  onCheckedChange={(checked) => handleParameterChange(rule.id, param.name, checked)}
                                />
                                <Label htmlFor={`${rule.id}-${param.name}`} className="text-sm">
                                  {param.description}
                                </Label>
                              </div>
                            )}
                            
                            <p className="text-xs text-muted-foreground">{param.description}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium">生成的PromQL:</Label>
                        <pre className="text-xs mt-1 overflow-auto">
                          {generateFinalPromQL(rule, ruleConfigs[rule.id] || {})}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">部署摘要</h4>
                    <p className="text-sm text-muted-foreground">
                      将 {selectedRules.length} 个告警规则部署到 {selectedHosts.length} 台主机
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
              <CardTitle>告警规则部署进度</CardTitle>
              <CardDescription>
                正在将告警规则部署到选定的主机
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDeploying ? (
                <div className="space-y-4">
                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      正在部署告警规则... {deployProgress}%
                      <Progress value={deployProgress} className="mt-2" />
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">部署详情</h4>
                    <div className="text-sm space-y-1">
                      <div>告警规则: {selectedRules.length} 个</div>
                      <div>目标主机: {selectedHosts.length} 台</div>
                      <div>部署组件: Prometheus + Alertmanager</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                  <h3 className="mt-4 text-lg font-medium">部署完成</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    告警规则已成功部署到所有选定的主机
                  </p>
                  <div className="mt-4 space-x-2">
                    <Button variant="outline" onClick={() => setCurrentStep('rules')}>
                      部署新规则
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      查看告警状态
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