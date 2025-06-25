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
import { IntegratedHostSelection } from './components/IntegratedHostSelection'
import { FlexibleHostSelection } from './components/FlexibleHostSelection'
import { RemoteHostDiscovery } from './components/RemoteHostDiscovery'
import InstallProgress from './components/InstallProgress'

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
  // 安装步骤状态
  const [currentStep, setCurrentStep] = useState<'select' | 'hosts' | 'config' | 'install'>('select')
  const [isInstalling, setIsInstalling] = useState(false)
  const [installProgress, setInstallProgress] = useState(0)
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [selectedHosts, setSelectedHosts] = useState<any[]>([])
  const [selectedDeploymentMethod, setSelectedDeploymentMethod] = useState<string>('binary')
  const [componentStatuses, setComponentStatuses] = useState<Record<string, string>>({})
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [installConfig, setInstallConfig] = useState<any>({})

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

  // 进入下一步：主机选择
  const handleNextToHostSelection = () => {
    if (selectedComponents.length === 0) {
      alert('请至少选择一个组件')
      return
    }
    setCurrentStep('hosts')
  }

  // 主机选择完成，进入配置步骤
  const handleHostsSelected = (hosts: any[], deploymentMethod: string) => {
    setSelectedHosts(hosts)
    setSelectedDeploymentMethod(deploymentMethod)
    setCurrentStep('config')
  }

  // 配置确认完成，开始安装
  const handleStartInstall = () => {
    setCurrentStep('install')
    handleBatchInstall()
  }

  // 返回上一步
  const handleBackStep = () => {
    if (currentStep === 'hosts') {
      setCurrentStep('select')
    } else if (currentStep === 'config') {
      setCurrentStep('hosts')
    } else if (currentStep === 'install') {
      setCurrentStep('config')
    }
  }

  // 批量安装组件
  const handleBatchInstall = async () => {
    if (selectedComponents.length === 0 || selectedHosts.length === 0) {
      alert('请选择组件和目标主机')
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
          hosts: selectedHosts,
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
          {currentStep === 'select' && (
            <Button 
              size="sm" 
              onClick={handleNextToHostSelection}
              disabled={selectedComponents.length === 0}
            >
              <Server className="mr-2 h-4 w-4" />
              下一步: 选择主机 ({selectedComponents.length})
            </Button>
          )}
          {currentStep === 'hosts' && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleBackStep}>
                返回
              </Button>
              <Button 
                size="sm" 
                onClick={() => setCurrentStep('config')}
                disabled={selectedHosts.length === 0}
              >
                下一步: 配置确认 ({selectedHosts.length} 主机)
              </Button>
            </div>
          )}
          {currentStep === 'config' && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleBackStep}>
                返回
              </Button>
              <Button 
                size="sm" 
                onClick={handleStartInstall}
                disabled={isInstalling}
              >
                开始安装
              </Button>
            </div>
          )}
          {currentStep === 'install' && (
            <Button variant="outline" size="sm" onClick={handleBackStep} disabled={isInstalling}>
              返回配置
            </Button>
          )}
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

      {/* 步骤指示器 */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className={`flex items-center space-x-2 ${currentStep === 'select' ? 'text-blue-600' : currentStep === 'hosts' || currentStep === 'config' || currentStep === 'install' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'select' ? 'bg-blue-600 text-white' : currentStep === 'hosts' || currentStep === 'config' || currentStep === 'install' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="font-medium">选择组件</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep === 'hosts' || currentStep === 'config' || currentStep === 'install' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'hosts' ? 'text-blue-600' : currentStep === 'config' || currentStep === 'install' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'hosts' ? 'bg-blue-600 text-white' : currentStep === 'config' || currentStep === 'install' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="font-medium">选择主机</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep === 'config' || currentStep === 'install' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'config' ? 'text-blue-600' : currentStep === 'install' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'config' ? 'bg-blue-600 text-white' : currentStep === 'install' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            3
          </div>
          <span className="font-medium">配置确认</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep === 'install' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'install' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'install' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            4
          </div>
          <span className="font-medium">执行安装</span>
        </div>
      </div>

      {/* 根据当前步骤显示不同内容 */}
      {currentStep === 'select' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择监控组件</CardTitle>
              <CardDescription>选择需要安装的监控组件，支持多选</CardDescription>
            </CardHeader>
            <CardContent>
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
                      <Badge variant={isSelected ? 'default' : 'secondary'}>
                        {isSelected ? '已选择' : '点击选择'}
                      </Badge>
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

      {/* 主机选择步骤 */}
      {currentStep === 'hosts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择主机获取方式</CardTitle>
              <CardDescription>选择如何获取要部署监控组件的目标主机</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="discover" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="discover">发现远程主机</TabsTrigger>
                  <TabsTrigger value="existing">使用现有主机</TabsTrigger>
                </TabsList>
                
                <TabsContent value="discover" className="mt-6">
                  <RemoteHostDiscovery
                    onHostsSelected={(hosts) => handleHostsSelected(hosts, 'binary')}
                    onBack={handleBackStep}
                  />
                </TabsContent>
                
                <TabsContent value="existing" className="mt-6">
                  {selectedComponents.length === 1 ? (
                    <FlexibleHostSelection
                      selectedComponent={{
                        id: selectedComponents[0],
                        name: allMonitoringComponentsConfig[selectedComponents[0]]?.name || selectedComponents[0],
                        category: allMonitoringComponentsConfig[selectedComponents[0]]?.category || 'unknown'
                      }}
                      onHostsSelected={handleHostsSelected}
                      onBack={handleBackStep}
                    />
                  ) : (
                    <IntegratedHostSelection 
                      selectedComponents={selectedComponents}
                      onHostsSelected={(hosts) => handleHostsSelected(hosts, 'docker')}
                      onBack={handleBackStep}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 配置确认步骤 */}
      {currentStep === 'config' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>配置确认</CardTitle>
              <CardDescription>确认安装配置和部署参数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">选中的组件 ({selectedComponents.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedComponents.map(componentId => {
                      const component = allMonitoringComponentsConfig[componentId]
                      return (
                        <Badge key={componentId} variant="outline">
                          {component?.name || componentId}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">部署方式</h4>
                  <Badge variant="default">
                    {selectedDeploymentMethod === 'binary' ? '二进制部署' :
                     selectedDeploymentMethod === 'docker' ? 'Docker容器' :
                     selectedDeploymentMethod === 'systemd' ? 'Systemd服务' :
                     selectedDeploymentMethod === 'package' ? '包管理器' : selectedDeploymentMethod}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">目标主机 ({selectedHosts.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedHosts.map((host, index) => (
                      <Badge key={host.id || index} variant="outline">
                        {host.name || host.id || `主机${index + 1}`} ({host.ip || 'N/A'})
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 安装执行步骤 */}
      {currentStep === 'install' && (
        <div className="space-y-6">
          <InstallProgress 
            isInstalling={isInstalling}
            components={selectedComponents}
            onInstall={handleBatchInstall}
            onCancel={() => setCurrentStep('config')}
          />
        </div>
      )}
    </div>
  )
}