'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  Settings, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Server, 
  Database, 
  BarChart3, 
  Monitor,
  Activity,
  RefreshCw,
  Bell, // Added for VMAlert, Alertmanager (already AlertCircle, Bell is an alternative)
  Network, // Added for SNMP Exporter, Categraf (Server is also fine)
  Square,
  CheckSquare
} from 'lucide-react'
import { COMPONENT_CONFIGS } from './components/ComponentDetails'

// Use the actual component configurations from ComponentDetails.tsx
const allMonitoringComponentsConfig = COMPONENT_CONFIGS

const getIconForCategory = (category: string) => {
  switch (category) {
    case 'collector':
      return Server; // Using Server for collectors like Node Exporter, Categraf, SNMP Exporter, VMAgent
    case 'storage':
      return Database; // For VictoriaMetrics and its storage components
    case 'visualization':
      return BarChart3; // For Grafana
    case 'alerting':
      return Bell; // Using Bell for Alertmanager, VMAlert (AlertCircle also an option)
    default:
      return Settings; // Default icon
  }
};

export default function MonitoringInstaller() {
  const [isInstalling, setIsInstalling] = useState(false)
  const [installProgress, setInstallProgress] = useState(0)
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [componentStatuses, setComponentStatuses] = useState<Record<string, string>>({})
  const [systemInfo, setSystemInfo] = useState<any>(null)

  const components = Object.values(allMonitoringComponentsConfig).map(comp => {
    const latestVersion = comp.versions.find(v => v.isLatest) || comp.versions[0];
    return {
      id: comp.id,
      name: comp.name,
      description: comp.description,
      icon: getIconForCategory(comp.category),
      status: 'available', // Default status
      version: latestVersion ? latestVersion.version : 'N/A',
      category: comp.category,
      features: comp.features,
      requirements: comp.requirements
    };
  });

  const handleInstall = async (componentId: string) => {
    setIsInstalling(true)
    setInstallProgress(0)
    
    try {
      // 调用安装API
      const response = await fetch('/api/monitoring/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'install',
          components: [componentId],
          configs: {
            [`docker-compose.${componentId}.yml`]: generateDockerComposeConfig(componentId)
          }
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        // 模拟安装进度
        const interval = setInterval(() => {
          setInstallProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval)
              setIsInstalling(false)
              return 100
            }
            return prev + 10
          })
        }, 500)
      } else {
        setIsInstalling(false)
        console.error('Installation failed:', result.errors)
      }
    } catch (error) {
      setIsInstalling(false)
      console.error('Installation request failed:', error)
    }
  }

  // 生成Docker Compose配置
  const generateDockerComposeConfig = (componentId: string): string => {
    const component = allMonitoringComponentsConfig[componentId]
    if (!component) return ''
    
    const latestVersion = component.versions.find(v => v.isLatest) || component.versions[0]
    
    // 基础配置模板
    const baseConfig = `version: '3.8'
services:
  ${componentId}:
    image: ${getDockerImage(componentId, latestVersion.version)}
    container_name: ${componentId}
    ports:
      - "${component.defaultPort}:${component.defaultPort}"
    networks:
      - monitoring
    restart: unless-stopped

networks:
  monitoring:
    external: true
`
    return baseConfig
  }

  // 获取Docker镜像名称
  const getDockerImage = (componentId: string, version: string): string => {
    const imageMap: Record<string, string> = {
      'node-exporter': `prom/node-exporter:v${version}`,
      'categraf': `flashcatcloud/categraf:v${version}`,
      'vmagent': `victoriametrics/vmagent:v${version}`,
      'victoriametrics': `victoriametrics/victoria-metrics:v${version}`,
      'vmstorage': `victoriametrics/vmstorage:v${version}`,
      'vminsert': `victoriametrics/vminsert:v${version}`,
      'vmselect': `victoriametrics/vmselect:v${version}`,
      'vmalert': `victoriametrics/vmalert:v${version}`,
      'grafana': `grafana/grafana:${version}`,
      'snmp-exporter': `prom/snmp-exporter:v${version}`,
      'alertmanager': `prom/alertmanager:v${version}`
    }
    return imageMap[componentId] || `${componentId}:${version}`
  }

  // 批量安装组件
  const handleBatchInstall = async () => {
    if (selectedComponents.length === 0) {
      alert('Please select at least one component to install')
      return
    }
    
    setIsInstalling(true)
    setInstallProgress(0)
    
    try {
      const configs: Record<string, string> = {}
      selectedComponents.forEach(componentId => {
        configs[`docker-compose.${componentId}.yml`] = generateDockerComposeConfig(componentId)
      })
      
      const response = await fetch('/api/monitoring/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'install',
          components: selectedComponents,
          configs
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        // 模拟安装进度
        const interval = setInterval(() => {
          setInstallProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval)
              setIsInstalling(false)
              checkComponentStatuses()
              return 100
            }
            return prev + 5
          })
        }, 1000)
      } else {
        setIsInstalling(false)
        console.error('Batch installation failed:', result.errors)
      }
    } catch (error) {
      setIsInstalling(false)
      console.error('Batch installation request failed:', error)
    }
  }

  // 检查组件状态
  const checkComponentStatuses = async () => {
    try {
      const componentIds = Object.keys(allMonitoringComponentsConfig)
      const response = await fetch('/api/monitoring/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'status',
          components: componentIds
        }),
      })
      
      const result = await response.json()
      
      if (result.success && result.statuses) {
        const statuses: Record<string, string> = {}
        result.statuses.forEach((status: any) => {
          statuses[status.name] = status.status
        })
        setComponentStatuses(statuses)
      }
    } catch (error) {
      console.error('检查状态失败:', error)
    }
  }

  // 获取系统信息
  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('/api/monitoring/install')
      const result = await response.json()
      setSystemInfo(result)
    } catch (error) {
      console.error('获取系统信息失败:', error)
    }
  }

  // 组件选择处理
  const handleComponentSelect = (componentId: string, selected: boolean) => {
    if (selected) {
      setSelectedComponents(prev => [...prev, componentId])
    } else {
      setSelectedComponents(prev => prev.filter(id => id !== componentId))
    }
  }

  // 页面加载时获取系统信息和组件状态
  React.useEffect(() => {
    fetchSystemInfo()
    checkComponentStatuses()
  }, [])

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* 页面头部 */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Monitor className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Monitoring Component Installer</h2>
          </div>
          <p className="text-muted-foreground">
            One-click installation and configuration of monitoring components to quickly build a complete monitoring system
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={checkComponentStatuses}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新状态
          </Button>
          <Button 
            size="sm" 
            onClick={handleBatchInstall}
            disabled={isInstalling || selectedComponents.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Batch Install ({selectedComponents.length})
          </Button>
        </div>
      </div>

      {/* Installation Progress */}
      {isInstalling && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Installing components... {installProgress}%
            <Progress value={installProgress} className="mt-2" />
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="components" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="components">Component Management</TabsTrigger>
          <TabsTrigger value="templates">Installation Templates</TabsTrigger>
          <TabsTrigger value="config">Configuration Management</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> {/* Adjusted grid for more items */}
            {components.map((component) => {
              const Icon = component.icon
              const isSelected = selectedComponents.includes(component.id)
              const status = componentStatuses[component.id] || 'unknown'
              const statusColor = status === 'running' ? 'text-green-600' : 
                                status === 'stopped' ? 'text-red-600' : 
                                status === 'error' ? 'text-red-600' : 'text-gray-600'
              const statusIcon = status === 'running' ? CheckCircle : 
                               status === 'stopped' ? AlertCircle : 
                               status === 'error' ? AlertCircle : Settings
              const StatusIcon = statusIcon
              
              return (
                <Card key={component.id} className={isSelected ? 'ring-2 ring-blue-500' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleComponentSelect(component.id, !isSelected)}
                        className="flex items-center space-x-2"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      <Icon className="h-5 w-5" />
                      <CardTitle className="text-lg">{component.name}</CardTitle>
                    </div>
                    <Badge variant="secondary">v{component.version}</Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4 h-10">
                      {component.description}
                    </CardDescription>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                        <span className={`text-sm ${statusColor}`}>
                          {status === 'running' ? '运行中' : 
                           status === 'stopped' ? '已停止' : 
                           status === 'error' ? '错误' : '未知'}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleInstall(component.id)}
                        disabled={isInstalling}
                        variant={status === 'running' ? 'outline' : 'default'}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {status === 'running' ? 'Reinstall' : 'Install'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Installation Templates</CardTitle>
              <CardDescription>Pre-configured monitoring component combinations for different scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Basic Monitoring</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Includes Prometheus + Grafana + Node Exporter
                  </p>
                  <Button className="mt-3" size="sm">Select Template</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Complete Monitoring</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Includes all major monitoring components and alerting system
                  </p>
                  <Button className="mt-3" size="sm">Select Template</Button>
                </div>
                 <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">VictoriaMetrics Stack</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Includes VictoriaMetrics standalone, VMAgent, Grafana
                  </p>
                  <Button className="mt-3" size="sm">选择模板</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">VictoriaMetrics 集群基础</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    包含 VMStorage, VMInsert, VMSelect, VMAgent, Grafana
                  </p>
                  <Button className="mt-3" size="sm">选择模板</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Management</CardTitle>
              <CardDescription>Manage configuration files for monitoring components</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Configuration management features are under development...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>系统环境</CardTitle>
                <CardDescription>Docker 环境检查</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Docker</span>
                    <Badge variant={systemInfo?.docker?.available ? "default" : "destructive"}>
                      {systemInfo?.docker?.available ? '可用' : '不可用'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Docker Compose</span>
                    <Badge variant={systemInfo?.dockerCompose?.available ? "default" : "destructive"}>
                      {systemInfo?.dockerCompose?.available ? '可用' : '不可用'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>系统就绪</span>
                    <Badge variant={systemInfo?.ready ? "default" : "destructive"}>
                      {systemInfo?.ready ? '就绪' : '未就绪'}
                    </Badge>
                  </div>
                  {systemInfo?.docker?.version && (
                    <div className="text-sm text-muted-foreground">
                      Docker: {systemInfo.docker.version}
                    </div>
                  )}
                  {systemInfo?.dockerCompose?.version && (
                    <div className="text-sm text-muted-foreground">
                      Compose: {systemInfo.dockerCompose.version}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Component Status</CardTitle>
                <CardDescription>Monitoring component runtime status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Running Components</span>
                    <span className="text-sm text-muted-foreground">
                      {Object.values(componentStatuses).filter(status => status === 'running').length} / {components.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Selected Components</span>
                    <span className="text-sm text-muted-foreground">{selectedComponents.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Check</span>
                    <span className="text-sm text-muted-foreground">Just now</span>
                  </div>
                  {systemInfo?.runningContainers && systemInfo.runningContainers.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Running Containers:</h4>
                      <div className="space-y-1">
                        {systemInfo.runningContainers.map((container: string) => (
                          <div key={container} className="text-xs text-muted-foreground">
                            {container}
                          </div>
                        ))}
                      </div>
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