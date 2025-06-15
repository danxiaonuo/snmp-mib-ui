'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Server, 
  Settings, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Database, 
  BarChart3, 
  Monitor,
  Activity,
  RefreshCw,
  Bell,
  Network,
  Square,
  CheckSquare,
  Upload,
  Download,
  Eye,
  Send
} from 'lucide-react'

interface Host {
  id: number
  name: string
  ip: string
  status: 'online' | 'offline' | 'unknown'
  os: string
  arch: string
  cpu_cores: number
  memory: number
  disk: number
}

interface Component {
  name: string
  display_name: string
  type: string
  version: string
  description: string
  default_port: number
}

interface DeploymentTask {
  id: string
  name: string
  host_id: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  started_at?: string
  completed_at?: string
  logs: string[]
  error?: string
}

interface ConfigDeploymentTask {
  id: string
  name: string
  host_ids: number[]
  config_type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  results: Array<{
    host_id: number
    host_ip: string
    status: 'success' | 'failed'
    message: string
    file_path: string
  }>
}

export default function DeploymentPage() {
  const [hosts, setHosts] = useState<Host[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [selectedHosts, setSelectedHosts] = useState<number[]>([])
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [deploymentTasks, setDeploymentTasks] = useState<DeploymentTask[]>([])
  const [configTasks, setConfigTasks] = useState<ConfigDeploymentTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('hosts')

  // 配置表单状态
  const [configType, setConfigType] = useState('monitoring')
  const [monitoringConfig, setMonitoringConfig] = useState({
    nodeExporterTargets: ['localhost:9100'],
    snmpTargets: ['192.168.1.1'],
    remoteWriteURL: 'http://victoriametrics:8428/api/v1/write',
    victoriaMetricsURL: 'http://victoriametrics:8428'
  })
  const [alertingConfig, setAlertingConfig] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpFrom: 'alerts@company.com',
    smtpUsername: '',
    smtpPassword: '',
    alertEmail: 'admin@company.com',
    cpuThreshold: 80,
    memoryThreshold: 85,
    diskThreshold: 90,
    interfaceThreshold: 80
  })

  // 加载数据
  useEffect(() => {
    loadHosts()
    loadComponents()
  }, [])

  const loadHosts = async () => {
    try {
      const response = await fetch('/api/v1/hosts')
      if (response.ok) {
        const data = await response.json()
        setHosts(data.hosts || [])
      }
    } catch (error) {
      console.error('Failed to load hosts:', error)
    }
  }

  const loadComponents = async () => {
    try {
      const response = await fetch('/api/v1/deployment/components')
      if (response.ok) {
        const data = await response.json()
        setComponents(data.components || [])
      }
    } catch (error) {
      console.error('Failed to load components:', error)
    }
  }

  // 主机选择
  const toggleHostSelection = (hostId: number) => {
    setSelectedHosts(prev => 
      prev.includes(hostId) 
        ? prev.filter(id => id !== hostId)
        : [...prev, hostId]
    )
  }

  // 组件选择
  const toggleComponentSelection = (componentName: string) => {
    setSelectedComponents(prev => 
      prev.includes(componentName) 
        ? prev.filter(name => name !== componentName)
        : [...prev, componentName]
    )
  }

  // 批量部署组件
  const handleBatchDeploy = async () => {
    if (selectedHosts.length === 0 || selectedComponents.length === 0) {
      alert('请选择主机和组件')
      return
    }

    setIsLoading(true)
    try {
      const componentDeployments = selectedComponents.map(name => {
        const component = components.find(c => c.name === name)
        return {
          name,
          type: component?.type || 'unknown',
          version: component?.version || 'latest',
          port: component?.default_port || 8080,
          config: {},
          deploy_method: 'docker'
        }
      })

      const response = await fetch('/api/v1/deployment/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_ids: selectedHosts,
          components: componentDeployments
        })
      })

      if (response.ok) {
        const data = await response.json()
        setDeploymentTasks(prev => [...prev, ...data.tasks])
        alert('批量部署已启动')
      } else {
        const error = await response.json()
        alert(`部署失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Deployment failed:', error)
      alert('部署失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 部署配置
  const handleConfigDeploy = async () => {
    if (selectedHosts.length === 0) {
      alert('请选择主机')
      return
    }

    setIsLoading(true)
    try {
      let endpoint = ''
      let configData = {}

      switch (configType) {
        case 'monitoring':
          endpoint = '/api/v1/config-deployment/monitoring'
          configData = {
            host_ids: selectedHosts,
            ...monitoringConfig
          }
          break
        case 'alerting':
          endpoint = '/api/v1/config-deployment/alerting'
          configData = {
            host_ids: selectedHosts,
            ...alertingConfig
          }
          break
        case 'snmp':
          endpoint = '/api/v1/config-deployment/snmp'
          configData = {
            host_ids: selectedHosts
          }
          break
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      })

      if (response.ok) {
        const data = await response.json()
        setConfigTasks(prev => [...prev, data.task])
        alert('配置部署已启动')
      } else {
        const error = await response.json()
        alert(`配置部署失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Config deployment failed:', error)
      alert('配置部署失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 预览配置
  const handleConfigPreview = async () => {
    try {
      let configData = {}
      switch (configType) {
        case 'monitoring':
          configData = monitoringConfig
          break
        case 'alerting':
          configData = alertingConfig
          break
        case 'snmp':
          configData = {}
          break
      }

      const response = await fetch('/api/v1/config-deployment/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config_type: configType,
          config_data: configData
        })
      })

      if (response.ok) {
        const data = await response.json()
        // 显示配置预览
        const previewWindow = window.open('', '_blank')
        if (previewWindow) {
          previewWindow.document.write(`
            <html>
              <head><title>配置预览 - ${configType}</title></head>
              <body>
                <h1>配置预览 - ${configType}</h1>
                ${Object.entries(data.configs).map(([filename, content]) => `
                  <h2>${filename}</h2>
                  <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${content}</pre>
                `).join('')}
              </body>
            </html>
          `)
        }
      }
    } catch (error) {
      console.error('Preview failed:', error)
      alert('预览失败')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
      case 'running':
      case 'completed':
      case 'success':
        return <Badge className="bg-green-100 text-green-800">运行中</Badge>
      case 'offline':
      case 'stopped':
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">离线</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">等待中</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">未知</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">监控组件部署</h1>
          <p className="text-muted-foreground">远程部署监控组件和配置文件到目标主机</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadHosts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hosts">主机管理</TabsTrigger>
          <TabsTrigger value="components">组件部署</TabsTrigger>
          <TabsTrigger value="configs">配置部署</TabsTrigger>
          <TabsTrigger value="tasks">任务状态</TabsTrigger>
        </TabsList>

        <TabsContent value="hosts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>目标主机</CardTitle>
              <CardDescription>选择要部署监控组件的主机</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hosts.map((host) => (
                  <Card 
                    key={host.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedHosts.includes(host.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => toggleHostSelection(host.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {selectedHosts.includes(host.id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                          <Server className="h-4 w-4" />
                          <span className="font-medium">{host.name}</span>
                        </div>
                        {getStatusBadge(host.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>IP: {host.ip}</div>
                        <div>系统: {host.os} {host.arch}</div>
                        <div>资源: {host.cpu_cores}核 / {host.memory}MB / {host.disk}GB</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {hosts.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    暂无可用主机，请先添加主机或进行主机发现
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>监控组件</CardTitle>
              <CardDescription>选择要部署的监控组件</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {components.map((component) => (
                  <Card 
                    key={component.name} 
                    className={`cursor-pointer transition-colors ${
                      selectedComponents.includes(component.name) ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => toggleComponentSelection(component.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {selectedComponents.includes(component.name) ? (
                            <CheckSquare className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                          {component.type === 'collector' && <Network className="h-4 w-4" />}
                          {component.type === 'storage' && <Database className="h-4 w-4" />}
                          {component.type === 'visualization' && <BarChart3 className="h-4 w-4" />}
                          {component.type === 'alerting' && <Bell className="h-4 w-4" />}
                          <span className="font-medium">{component.display_name}</span>
                        </div>
                        <Badge variant="outline">{component.version}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>{component.description}</div>
                        <div>端口: {component.default_port}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleBatchDeploy} 
                  disabled={isLoading || selectedHosts.length === 0 || selectedComponents.length === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  批量部署 ({selectedComponents.length} 组件到 {selectedHosts.length} 主机)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>配置部署</CardTitle>
              <CardDescription>生成并部署监控配置文件到目标主机</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="configType">配置类型</Label>
                <Select value={configType} onValueChange={setConfigType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monitoring">监控配置</SelectItem>
                    <SelectItem value="alerting">告警配置</SelectItem>
                    <SelectItem value="snmp">SNMP配置</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {configType === 'monitoring' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nodeTargets">Node Exporter 目标</Label>
                    <Textarea
                      id="nodeTargets"
                      value={monitoringConfig.nodeExporterTargets.join('\n')}
                      onChange={(e) => setMonitoringConfig(prev => ({
                        ...prev,
                        nodeExporterTargets: e.target.value.split('\n').filter(t => t.trim())
                      }))}
                      placeholder="localhost:9100&#10;192.168.1.10:9100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="snmpTargets">SNMP 目标</Label>
                    <Textarea
                      id="snmpTargets"
                      value={monitoringConfig.snmpTargets.join('\n')}
                      onChange={(e) => setMonitoringConfig(prev => ({
                        ...prev,
                        snmpTargets: e.target.value.split('\n').filter(t => t.trim())
                      }))}
                      placeholder="192.168.1.1&#10;192.168.1.2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="remoteWriteURL">Remote Write URL</Label>
                    <Input
                      id="remoteWriteURL"
                      value={monitoringConfig.remoteWriteURL}
                      onChange={(e) => setMonitoringConfig(prev => ({
                        ...prev,
                        remoteWriteURL: e.target.value
                      }))}
                    />
                  </div>
                </div>
              )}

              {configType === 'alerting' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">SMTP 主机</Label>
                      <Input
                        id="smtpHost"
                        value={alertingConfig.smtpHost}
                        onChange={(e) => setAlertingConfig(prev => ({
                          ...prev,
                          smtpHost: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">SMTP 端口</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={alertingConfig.smtpPort}
                        onChange={(e) => setAlertingConfig(prev => ({
                          ...prev,
                          smtpPort: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="alertEmail">告警邮箱</Label>
                    <Input
                      id="alertEmail"
                      type="email"
                      value={alertingConfig.alertEmail}
                      onChange={(e) => setAlertingConfig(prev => ({
                        ...prev,
                        alertEmail: e.target.value
                      }))}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="cpuThreshold">CPU 阈值 (%)</Label>
                      <Input
                        id="cpuThreshold"
                        type="number"
                        value={alertingConfig.cpuThreshold}
                        onChange={(e) => setAlertingConfig(prev => ({
                          ...prev,
                          cpuThreshold: parseFloat(e.target.value)
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="memoryThreshold">内存阈值 (%)</Label>
                      <Input
                        id="memoryThreshold"
                        type="number"
                        value={alertingConfig.memoryThreshold}
                        onChange={(e) => setAlertingConfig(prev => ({
                          ...prev,
                          memoryThreshold: parseFloat(e.target.value)
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="diskThreshold">磁盘阈值 (%)</Label>
                      <Input
                        id="diskThreshold"
                        type="number"
                        value={alertingConfig.diskThreshold}
                        onChange={(e) => setAlertingConfig(prev => ({
                          ...prev,
                          diskThreshold: parseFloat(e.target.value)
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="interfaceThreshold">接口阈值 (%)</Label>
                      <Input
                        id="interfaceThreshold"
                        type="number"
                        value={alertingConfig.interfaceThreshold}
                        onChange={(e) => setAlertingConfig(prev => ({
                          ...prev,
                          interfaceThreshold: parseFloat(e.target.value)
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleConfigPreview} variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  预览配置
                </Button>
                <Button 
                  onClick={handleConfigDeploy} 
                  disabled={isLoading || selectedHosts.length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  部署配置到 {selectedHosts.length} 主机
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>组件部署任务</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deploymentTasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{task.name}</span>
                          {getStatusBadge(task.status)}
                        </div>
                        <Progress value={task.progress} className="mb-2" />
                        <div className="text-sm text-muted-foreground">
                          进度: {task.progress}%
                        </div>
                        {task.error && (
                          <Alert className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{task.error}</AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {deploymentTasks.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      暂无部署任务
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>配置部署任务</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {configTasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{task.name}</span>
                          {getStatusBadge(task.status)}
                        </div>
                        <Progress value={task.progress} className="mb-2" />
                        <div className="text-sm text-muted-foreground">
                          配置类型: {task.config_type} | 进度: {task.progress}%
                        </div>
                        {task.results && task.results.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {task.results.map((result, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                {result.status === 'success' ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-red-500" />
                                )}
                                <span>{result.host_ip}: {result.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {configTasks.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      暂无配置部署任务
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}