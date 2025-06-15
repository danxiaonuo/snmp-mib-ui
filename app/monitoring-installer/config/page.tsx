"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Copy, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Database, 
  Server, 
  Activity, 
  BarChart3, 
  Bell, 
  Network, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Eye, 
  EyeOff,
  Code,
  History,
  GitBranch,
  Lock,
  Unlock
} from 'lucide-react'

interface ConfigItem {
  key: string
  value: string | number | boolean
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea'
  description: string
  required: boolean
  options?: string[]
  sensitive?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

interface ComponentConfig {
  id: string
  name: string
  category: 'collector' | 'storage' | 'visualization' | 'alerting'
  version: string
  status: 'active' | 'inactive' | 'error'
  configFile: string
  lastModified: string
  configs: ConfigItem[]
}

interface ConfigTemplate {
  id: string
  name: string
  description: string
  component: string
  environment: 'development' | 'staging' | 'production'
  configs: Record<string, any>
  createdAt: string
  isDefault: boolean
}

// 模拟配置数据
const MOCK_COMPONENT_CONFIGS: ComponentConfig[] = [
  {
    id: 'node-exporter',
    name: 'Node Exporter',
    category: 'collector',
    version: '1.7.0',
    status: 'active',
    configFile: '/etc/node_exporter/config.yml',
    lastModified: '2024-01-22 14:30:00',
    configs: [
      {
        key: 'web.listen-address',
        value: ':9100',
        type: 'string',
        description: '监听地址和端口',
        required: true,
        validation: { pattern: '^:[0-9]+$' }
      },
      {
        key: 'web.telemetry-path',
        value: '/metrics',
        type: 'string',
        description: '指标路径',
        required: true
      },
      {
        key: 'collector.disable-defaults',
        value: false,
        type: 'boolean',
        description: '禁用默认收集器',
        required: false
      },
      {
        key: 'collector.cpu',
        value: true,
        type: 'boolean',
        description: '启用CPU收集器',
        required: false
      },
      {
        key: 'collector.meminfo',
        value: true,
        type: 'boolean',
        description: '启用内存信息收集器',
        required: false
      },
      {
        key: 'log.level',
        value: 'info',
        type: 'select',
        description: '日志级别',
        required: false,
        options: ['debug', 'info', 'warn', 'error']
      }
    ]
  },
  {
    id: 'victoriametrics',
    name: 'VictoriaMetrics',
    category: 'storage',
    version: '1.96.0',
    status: 'active',
    configFile: '/etc/victoriametrics/config.yml',
    lastModified: '2024-01-22 15:45:00',
    configs: [
      {
        key: 'httpListenAddr',
        value: ':8428',
        type: 'string',
        description: 'HTTP监听地址',
        required: true
      },
      {
        key: 'storageDataPath',
        value: '/var/lib/victoriametrics',
        type: 'string',
        description: '数据存储路径',
        required: true
      },
      {
        key: 'retentionPeriod',
        value: '1y',
        type: 'string',
        description: '数据保留期',
        required: true
      },
      {
        key: 'memory.allowedPercent',
        value: 60,
        type: 'number',
        description: '允许使用的内存百分比',
        required: false,
        validation: { min: 10, max: 90 }
      },
      {
        key: 'search.maxConcurrentRequests',
        value: 8,
        type: 'number',
        description: '最大并发查询数',
        required: false,
        validation: { min: 1, max: 32 }
      }
    ]
  },
  {
    id: 'grafana',
    name: 'Grafana',
    category: 'visualization',
    version: '10.2.3',
    status: 'active',
    configFile: '/etc/grafana/grafana.ini',
    lastModified: '2024-01-22 16:20:00',
    configs: [
      {
        key: 'http_port',
        value: 3000,
        type: 'number',
        description: 'HTTP端口',
        required: true,
        validation: { min: 1024, max: 65535 }
      },
      {
        key: 'domain',
        value: 'localhost',
        type: 'string',
        description: '域名',
        required: true
      },
      {
        key: 'root_url',
        value: 'http://localhost:3000/',
        type: 'string',
        description: '根URL',
        required: true
      },
      {
        key: 'admin_user',
        value: 'admin',
        type: 'string',
        description: '管理员用户名',
        required: true
      },
      {
        key: 'admin_password',
        value: 'admin123',
        type: 'string',
        description: '管理员密码',
        required: true,
        sensitive: true
      },
      {
        key: 'allow_sign_up',
        value: false,
        type: 'boolean',
        description: '允许用户注册',
        required: false
      },
      {
        key: 'log_level',
        value: 'info',
        type: 'select',
        description: '日志级别',
        required: false,
        options: ['debug', 'info', 'warn', 'error', 'critical']
      }
    ]
  },
  {
    id: 'alertmanager',
    name: 'Alertmanager',
    category: 'alerting',
    version: '0.26.0',
    status: 'inactive',
    configFile: '/etc/alertmanager/alertmanager.yml',
    lastModified: '2024-01-20 10:15:00',
    configs: [
      {
        key: 'web.listen-address',
        value: ':9093',
        type: 'string',
        description: 'Web监听地址',
        required: true
      },
      {
        key: 'storage.path',
        value: '/var/lib/alertmanager',
        type: 'string',
        description: '存储路径',
        required: true
      },
      {
        key: 'data.retention',
        value: '120h',
        type: 'string',
        description: '数据保留时间',
        required: false
      },
      {
        key: 'smtp.smarthost',
        value: 'localhost:587',
        type: 'string',
        description: 'SMTP服务器',
        required: false
      },
      {
        key: 'smtp.from',
        value: 'alertmanager@example.com',
        type: 'string',
        description: '发件人邮箱',
        required: false
      },
      {
        key: 'smtp.auth_username',
        value: '',
        type: 'string',
        description: 'SMTP用户名',
        required: false,
        sensitive: true
      },
      {
        key: 'smtp.auth_password',
        value: '',
        type: 'string',
        description: 'SMTP密码',
        required: false,
        sensitive: true
      }
    ]
  }
]

const MOCK_CONFIG_TEMPLATES: ConfigTemplate[] = [
  {
    id: 'dev-template',
    name: '开发环境配置',
    description: '适用于开发环境的默认配置模板',
    component: 'all',
    environment: 'development',
    configs: {
      'log.level': 'debug',
      'retention': '7d',
      'memory.limit': '1GB'
    },
    createdAt: '2024-01-15',
    isDefault: true
  },
  {
    id: 'prod-template',
    name: '生产环境配置',
    description: '适用于生产环境的优化配置模板',
    component: 'all',
    environment: 'production',
    configs: {
      'log.level': 'warn',
      'retention': '1y',
      'memory.limit': '8GB'
    },
    createdAt: '2024-01-15',
    isDefault: false
  }
]

const CategoryBadge = ({ category }: { category: string }) => {
  const categoryColors: Record<string, string> = {
    collector: 'bg-blue-100 text-blue-800',
    storage: 'bg-green-100 text-green-800',
    visualization: 'bg-purple-100 text-purple-800',
    alerting: 'bg-orange-100 text-orange-800'
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    collector: <Activity className="h-3 w-3" />,
    storage: <Database className="h-3 w-3" />,
    visualization: <BarChart3 className="h-3 w-3" />,
    alerting: <Bell className="h-3 w-3" />
  }

  return (
    <Badge variant="outline" className={`${categoryColors[category]} flex items-center gap-1`}>
      {categoryIcons[category]}
      {category}
    </Badge>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800'
  }

  const statusIcons: Record<string, React.ReactNode> = {
    active: <CheckCircle className="h-3 w-3" />,
    inactive: <AlertCircle className="h-3 w-3" />,
    error: <AlertCircle className="h-3 w-3" />
  }

  const statusNames: Record<string, string> = {
    active: '运行中',
    inactive: '已停止',
    error: '错误'
  }

  return (
    <Badge className={`${statusColors[status]} flex items-center gap-1`}>
      {statusIcons[status]}
      {statusNames[status]}
    </Badge>
  )
}

const ConfigInput = ({ 
  config, 
  value, 
  onChange, 
  showSensitive 
}: { 
  config: ConfigItem
  value: any
  onChange: (value: any) => void
  showSensitive: boolean
}) => {
  const handleChange = (newValue: any) => {
    if (config.type === 'number') {
      const numValue = parseFloat(newValue)
      if (!isNaN(numValue)) {
        onChange(numValue)
      }
    } else if (config.type === 'boolean') {
      onChange(newValue)
    } else {
      onChange(newValue)
    }
  }

  if (config.type === 'boolean') {
    return (
      <Switch
        checked={value}
        onCheckedChange={handleChange}
      />
    )
  }

  if (config.type === 'select') {
    return (
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {config.options?.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (config.type === 'textarea') {
    return (
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        rows={4}
      />
    )
  }

  return (
    <Input
      type={config.sensitive && !showSensitive ? 'password' : config.type === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      min={config.validation?.min}
      max={config.validation?.max}
      pattern={config.validation?.pattern}
    />
  )
}

export default function ConfigManagementPage() {
  const [componentConfigs, setComponentConfigs] = useState<ComponentConfig[]>(MOCK_COMPONENT_CONFIGS)
  const [configTemplates, setConfigTemplates] = useState<ConfigTemplate[]>(MOCK_CONFIG_TEMPLATES)
  const [selectedComponent, setSelectedComponent] = useState<ComponentConfig | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showSensitive, setShowSensitive] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)

  // 过滤组件
  const filteredComponents = componentConfigs.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || component.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleConfigChange = (componentId: string, configKey: string, value: any) => {
    setComponentConfigs(prev => prev.map(component => {
      if (component.id === componentId) {
        return {
          ...component,
          configs: component.configs.map(config => 
            config.key === configKey ? { ...config, value } : config
          )
        }
      }
      return component
    }))
    setHasUnsavedChanges(true)
  }

  const handleSaveConfig = (componentId: string) => {
    // 模拟保存配置
    setComponentConfigs(prev => prev.map(component => 
      component.id === componentId 
        ? { ...component, lastModified: new Date().toLocaleString() }
        : component
    ))
    setHasUnsavedChanges(false)
  }

  const handleResetConfig = (componentId: string) => {
    // 模拟重置配置
    setComponentConfigs(MOCK_COMPONENT_CONFIGS)
    setHasUnsavedChanges(false)
  }

  const handleExportConfig = (component: ComponentConfig) => {
    const configData = {
      component: component.name,
      version: component.version,
      configs: component.configs.reduce((acc, config) => {
        acc[config.key] = config.value
        return acc
      }, {} as Record<string, any>)
    }
    
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${component.id}-config.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">配置管理</h1>
          <p className="text-gray-600 mt-1">管理监控组件的配置参数和模板</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsTemplateDialogOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            配置模板
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            导入配置
          </Button>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-sensitive"
              checked={showSensitive}
              onCheckedChange={setShowSensitive}
            />
            <Label htmlFor="show-sensitive" className="text-sm flex items-center gap-1">
              {showSensitive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              显示敏感信息
            </Label>
          </div>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索组件名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="collector">采集器</SelectItem>
                <SelectItem value="storage">存储</SelectItem>
                <SelectItem value="visualization">可视化</SelectItem>
                <SelectItem value="alerting">告警</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">运行中</SelectItem>
                <SelectItem value="inactive">已停止</SelectItem>
                <SelectItem value="error">错误</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 配置统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">总组件数</p>
                <p className="text-2xl font-bold">{componentConfigs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">运行中</p>
                <p className="text-2xl font-bold">{componentConfigs.filter(c => c.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">已停止</p>
                <p className="text-2xl font-bold">{componentConfigs.filter(c => c.status === 'inactive').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">配置模板</p>
                <p className="text-2xl font-bold">{configTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 组件列表 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>组件列表</CardTitle>
              <CardDescription>选择要配置的组件</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredComponents.map((component) => (
                <div
                  key={component.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedComponent?.id === component.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedComponent(component)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{component.name}</h3>
                    <StatusBadge status={component.status} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryBadge category={component.category} />
                    <Badge variant="outline" className="text-xs">
                      v{component.version}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    更新: {component.lastModified}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 配置详情 */}
        <div className="lg:col-span-2">
          {selectedComponent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedComponent.name}
                      <CategoryBadge category={selectedComponent.category} />
                      <StatusBadge status={selectedComponent.status} />
                    </CardTitle>
                    <CardDescription>
                      配置文件: {selectedComponent.configFile}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportConfig(selectedComponent)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      导出
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetConfig(selectedComponent.id)}
                      disabled={!hasUnsavedChanges}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      重置
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveConfig(selectedComponent.id)}
                      disabled={!hasUnsavedChanges}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      保存
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {hasUnsavedChanges && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      您有未保存的配置更改，请记得保存。
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  {selectedComponent.configs.map((config) => (
                    <div key={config.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          {config.key}
                          {config.required && (
                            <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
                              必需
                            </Badge>
                          )}
                          {config.sensitive && (
                            <Lock className="h-3 w-3 text-orange-500" />
                          )}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {config.type}
                        </Badge>
                      </div>
                      <ConfigInput
                        config={config}
                        value={config.value}
                        onChange={(value) => handleConfigChange(selectedComponent.id, config.key, value)}
                        showSensitive={showSensitive}
                      />
                      <p className="text-xs text-gray-600">{config.description}</p>
                      {config.validation && (
                        <div className="text-xs text-gray-500">
                          {config.validation.min !== undefined && (
                            <span>最小值: {config.validation.min} </span>
                          )}
                          {config.validation.max !== undefined && (
                            <span>最大值: {config.validation.max} </span>
                          )}
                          {config.validation.pattern && (
                            <span>格式: {config.validation.pattern}</span>
                          )}
                        </div>
                      )}
                      <Separator />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">选择一个组件</p>
                  <p>从左侧列表中选择要配置的组件</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 配置模板对话框 */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>配置模板</DialogTitle>
            <DialogDescription>
              管理和应用配置模板
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {configTemplates.map((template) => (
              <Card key={template.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{template.name}</h3>
                        {template.isDefault && (
                          <Badge className="bg-blue-100 text-blue-800">
                            默认
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {template.environment}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {template.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        创建时间: {template.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm">
                        应用
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              关闭
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建模板
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}