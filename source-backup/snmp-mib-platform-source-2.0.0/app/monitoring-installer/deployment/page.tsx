"use client"

import React, { useState, useEffect } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Trash2, 
  Download, 
  Upload, 
  Settings, 
  Monitor, 
  Server, 
  Database, 
  Activity, 
  BarChart3, 
  Bell, 
  Network, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Loader2, 
  Terminal, 
  FileText, 
  Eye, 
  RefreshCw,
  Zap,
  Shield,
  Globe,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  Container
} from 'lucide-react'

interface DeploymentComponent {
  id: string
  name: string
  category: 'collector' | 'storage' | 'visualization' | 'alerting'
  version: string
  status: 'pending' | 'deploying' | 'running' | 'stopped' | 'failed' | 'updating'
  health: 'healthy' | 'unhealthy' | 'unknown'
  replicas: {
    desired: number
    current: number
    ready: number
  }
  resources: {
    cpu: string
    memory: string
    storage: string
  }
  ports: number[]
  endpoints: string[]
  lastDeployed: string
  uptime: string
  logs: string[]
  metrics: {
    cpu: number
    memory: number
    network: number
    requests: number
  }
}

interface DeploymentEnvironment {
  id: string
  name: string
  type: 'development' | 'staging' | 'production'
  cluster: string
  namespace: string
  components: DeploymentComponent[]
  status: 'active' | 'inactive' | 'maintenance'
  createdAt: string
  lastUpdated: string
}

interface DeploymentTask {
  id: string
  type: 'deploy' | 'update' | 'rollback' | 'scale' | 'restart'
  component: string
  environment: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startTime: string
  endTime?: string
  logs: string[]
  error?: string
}

// 模拟部署数据
const MOCK_ENVIRONMENTS: DeploymentEnvironment[] = [
  {
    id: 'dev-env',
    name: '开发环境',
    type: 'development',
    cluster: 'dev-cluster',
    namespace: 'monitoring-dev',
    status: 'active',
    createdAt: '2024-01-15',
    lastUpdated: '2024-01-22 16:30:00',
    components: [
      {
        id: 'node-exporter',
        name: 'Node Exporter',
        category: 'collector',
        version: '1.7.0',
        status: 'running',
        health: 'healthy',
        replicas: { desired: 3, current: 3, ready: 3 },
        resources: { cpu: '100m', memory: '128Mi', storage: '1Gi' },
        ports: [9100],
        endpoints: ['http://node-exporter:9100/metrics'],
        lastDeployed: '2024-01-22 14:30:00',
        uptime: '2d 4h 15m',
        logs: [
          '2024-01-22 16:30:00 INFO Starting Node Exporter',
          '2024-01-22 16:30:01 INFO Listening on :9100',
          '2024-01-22 16:30:01 INFO Collector enabled: cpu',
          '2024-01-22 16:30:01 INFO Collector enabled: meminfo'
        ],
        metrics: { cpu: 15, memory: 45, network: 120, requests: 1250 }
      },
      {
        id: 'victoriametrics',
        name: 'VictoriaMetrics',
        category: 'storage',
        version: '1.96.0',
        status: 'running',
        health: 'healthy',
        replicas: { desired: 1, current: 1, ready: 1 },
        resources: { cpu: '500m', memory: '2Gi', storage: '50Gi' },
        ports: [8428],
        endpoints: ['http://victoriametrics:8428'],
        lastDeployed: '2024-01-22 15:00:00',
        uptime: '1d 23h 45m',
        logs: [
          '2024-01-22 16:30:00 INFO Starting VictoriaMetrics',
          '2024-01-22 16:30:01 INFO HTTP server started at :8428',
          '2024-01-22 16:30:01 INFO Storage path: /var/lib/victoriametrics'
        ],
        metrics: { cpu: 35, memory: 68, network: 850, requests: 3420 }
      },
      {
        id: 'grafana',
        name: 'Grafana',
        category: 'visualization',
        version: '10.2.3',
        status: 'updating',
        health: 'unknown',
        replicas: { desired: 1, current: 1, ready: 0 },
        resources: { cpu: '200m', memory: '512Mi', storage: '5Gi' },
        ports: [3000],
        endpoints: ['http://grafana:3000'],
        lastDeployed: '2024-01-22 16:25:00',
        uptime: '0h 5m',
        logs: [
          '2024-01-22 16:25:00 INFO Starting Grafana update',
          '2024-01-22 16:25:30 INFO Downloading new image',
          '2024-01-22 16:26:00 INFO Rolling out update'
        ],
        metrics: { cpu: 25, memory: 55, network: 320, requests: 890 }
      }
    ]
  },
  {
    id: 'prod-env',
    name: '生产环境',
    type: 'production',
    cluster: 'prod-cluster',
    namespace: 'monitoring-prod',
    status: 'active',
    createdAt: '2024-01-10',
    lastUpdated: '2024-01-22 12:00:00',
    components: [
      {
        id: 'node-exporter',
        name: 'Node Exporter',
        category: 'collector',
        version: '1.7.0',
        status: 'running',
        health: 'healthy',
        replicas: { desired: 10, current: 10, ready: 10 },
        resources: { cpu: '100m', memory: '128Mi', storage: '1Gi' },
        ports: [9100],
        endpoints: ['http://node-exporter:9100/metrics'],
        lastDeployed: '2024-01-20 10:00:00',
        uptime: '2d 6h 30m',
        logs: [
          '2024-01-22 16:30:00 INFO Node Exporter running normally',
          '2024-01-22 16:29:00 INFO Metrics collected successfully'
        ],
        metrics: { cpu: 12, memory: 38, network: 450, requests: 15600 }
      },
      {
        id: 'victoriametrics',
        name: 'VictoriaMetrics',
        category: 'storage',
        version: '1.96.0',
        status: 'running',
        health: 'healthy',
        replicas: { desired: 3, current: 3, ready: 3 },
        resources: { cpu: '2', memory: '8Gi', storage: '500Gi' },
        ports: [8428],
        endpoints: ['http://victoriametrics:8428'],
        lastDeployed: '2024-01-20 10:30:00',
        uptime: '2d 6h 0m',
        logs: [
          '2024-01-22 16:30:00 INFO VictoriaMetrics cluster healthy',
          '2024-01-22 16:29:00 INFO Data ingestion rate: 50k/s'
        ],
        metrics: { cpu: 45, memory: 72, network: 2100, requests: 25800 }
      },
      {
        id: 'alertmanager',
        name: 'Alertmanager',
        category: 'alerting',
        version: '0.26.0',
        status: 'failed',
        health: 'unhealthy',
        replicas: { desired: 2, current: 1, ready: 0 },
        resources: { cpu: '100m', memory: '256Mi', storage: '2Gi' },
        ports: [9093],
        endpoints: ['http://alertmanager:9093'],
        lastDeployed: '2024-01-22 11:00:00',
        uptime: '0h 0m',
        logs: [
          '2024-01-22 16:30:00 ERROR Failed to start Alertmanager',
          '2024-01-22 16:29:30 ERROR Config validation failed',
          '2024-01-22 16:29:00 INFO Attempting to start Alertmanager'
        ],
        metrics: { cpu: 0, memory: 0, network: 0, requests: 0 }
      }
    ]
  }
]

const MOCK_DEPLOYMENT_TASKS: DeploymentTask[] = [
  {
    id: 'task-1',
    type: 'update',
    component: 'grafana',
    environment: 'dev-env',
    status: 'running',
    progress: 65,
    startTime: '2024-01-22 16:25:00',
    logs: [
      '2024-01-22 16:25:00 Starting Grafana update to v10.2.3',
      '2024-01-22 16:25:30 Pulling new image',
      '2024-01-22 16:26:00 Rolling out update',
      '2024-01-22 16:26:30 Waiting for pods to be ready'
    ]
  },
  {
    id: 'task-2',
    type: 'deploy',
    component: 'alertmanager',
    environment: 'prod-env',
    status: 'failed',
    progress: 30,
    startTime: '2024-01-22 11:00:00',
    endTime: '2024-01-22 11:15:00',
    error: 'Configuration validation failed',
    logs: [
      '2024-01-22 11:00:00 Starting Alertmanager deployment',
      '2024-01-22 11:05:00 Validating configuration',
      '2024-01-22 11:10:00 ERROR: Invalid SMTP configuration',
      '2024-01-22 11:15:00 Deployment failed'
    ]
  }
]

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" />, label: '等待中' },
    deploying: { color: 'bg-blue-100 text-blue-800', icon: <Loader2 className="h-3 w-3 animate-spin" />, label: '部署中' },
    running: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" />, label: '运行中' },
    stopped: { color: 'bg-gray-100 text-gray-800', icon: <Square className="h-3 w-3" />, label: '已停止' },
    failed: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-3 w-3" />, label: '失败' },
    updating: { color: 'bg-yellow-100 text-yellow-800', icon: <RefreshCw className="h-3 w-3 animate-spin" />, label: '更新中' }
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      {config.icon}
      {config.label}
    </Badge>
  )
}

const HealthBadge = ({ health }: { health: string }) => {
  const healthConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    healthy: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" />, label: '健康' },
    unhealthy: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-3 w-3" />, label: '异常' },
    unknown: { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="h-3 w-3" />, label: '未知' }
  }

  const config = healthConfig[health] || healthConfig.unknown

  return (
    <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
      {config.icon}
      {config.label}
    </Badge>
  )
}

const CategoryIcon = ({ category }: { category: string }) => {
  const icons: Record<string, React.ReactNode> = {
    collector: <Activity className="h-4 w-4" />,
    storage: <Database className="h-4 w-4" />,
    visualization: <BarChart3 className="h-4 w-4" />,
    alerting: <Bell className="h-4 w-4" />
  }

  return icons[category] || <Server className="h-4 w-4" />
}

const MetricCard = ({ title, value, unit, icon, color }: {
  title: string
  value: number
  unit: string
  icon: React.ReactNode
  color: string
}) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-lg font-semibold">{value}{unit}</p>
      </div>
    </div>
  )
}

export default function DeploymentManagementPage() {
  const [environments, setEnvironments] = useState<DeploymentEnvironment[]>(MOCK_ENVIRONMENTS)
  const [deploymentTasks, setDeploymentTasks] = useState<DeploymentTask[]>(MOCK_DEPLOYMENT_TASKS)
  const [selectedEnvironment, setSelectedEnvironment] = useState<DeploymentEnvironment>(environments[0])
  const [selectedComponent, setSelectedComponent] = useState<DeploymentComponent | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // 模拟数据更新
      setEnvironments(prev => prev.map(env => ({
        ...env,
        lastUpdated: new Date().toLocaleString(),
        components: env.components.map(comp => ({
          ...comp,
          metrics: {
            cpu: Math.max(0, comp.metrics.cpu + (Math.random() - 0.5) * 10),
            memory: Math.max(0, comp.metrics.memory + (Math.random() - 0.5) * 10),
            network: Math.max(0, comp.metrics.network + (Math.random() - 0.5) * 100),
            requests: Math.max(0, comp.metrics.requests + Math.floor((Math.random() - 0.5) * 200))
          }
        }))
      })))
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleComponentAction = (componentId: string, action: string) => {
    // 模拟组件操作
    setEnvironments(prev => prev.map(env => 
      env.id === selectedEnvironment.id
        ? {
            ...env,
            components: env.components.map(comp => 
              comp.id === componentId
                ? { ...comp, status: action === 'restart' ? 'deploying' : comp.status }
                : comp
            )
          }
        : env
    ))
  }

  const getEnvironmentStats = (env: DeploymentEnvironment) => {
    const total = env.components.length
    const running = env.components.filter(c => c.status === 'running').length
    const healthy = env.components.filter(c => c.health === 'healthy').length
    const failed = env.components.filter(c => c.status === 'failed').length
    
    return { total, running, healthy, failed }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">部署管理</h1>
          <p className="text-gray-600 mt-1">监控和管理组件部署状态</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm">自动刷新</Label>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={() => setIsDeployDialogOpen(true)}>
            <Play className="h-4 w-4 mr-2" />
            新建部署
          </Button>
        </div>
      </div>

      {/* 环境选择 */}
      <div className="flex items-center gap-4">
        <Label>环境:</Label>
        <Select 
          value={selectedEnvironment.id} 
          onValueChange={(value) => {
            const env = environments.find(e => e.id === value)
            if (env) setSelectedEnvironment(env)
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {environments.map((env) => (
              <SelectItem key={env.id} value={env.id}>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {env.name}
                  <Badge variant="outline" className="text-xs">
                    {env.type}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 环境概览 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {selectedEnvironment.name}
                <Badge variant="outline">{selectedEnvironment.type}</Badge>
                <Badge className={selectedEnvironment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {selectedEnvironment.status === 'active' ? '活跃' : '非活跃'}
                </Badge>
              </CardTitle>
              <CardDescription>
                集群: {selectedEnvironment.cluster} | 命名空间: {selectedEnvironment.namespace}
              </CardDescription>
            </div>
            <div className="text-sm text-gray-600">
              最后更新: {selectedEnvironment.lastUpdated}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(() => {
              const stats = getEnvironmentStats(selectedEnvironment)
              return (
                <>
                  <MetricCard
                    title="总组件数"
                    value={stats.total}
                    unit=""
                    icon={<Container className="h-4 w-4" />}
                    color="bg-blue-100 text-blue-600"
                  />
                  <MetricCard
                    title="运行中"
                    value={stats.running}
                    unit=""
                    icon={<CheckCircle className="h-4 w-4" />}
                    color="bg-green-100 text-green-600"
                  />
                  <MetricCard
                    title="健康状态"
                    value={stats.healthy}
                    unit=""
                    icon={<Shield className="h-4 w-4" />}
                    color="bg-emerald-100 text-emerald-600"
                  />
                  <MetricCard
                    title="失败组件"
                    value={stats.failed}
                    unit=""
                    icon={<AlertCircle className="h-4 w-4" />}
                    color="bg-red-100 text-red-600"
                  />
                </>
              )
            })()
            }
          </div>
        </CardContent>
      </Card>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 组件列表 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>组件列表</CardTitle>
              <CardDescription>选择要查看的组件</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedEnvironment.components.map((component) => (
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
                    <div className="flex items-center gap-2">
                      <CategoryIcon category={component.category} />
                      <h3 className="font-medium">{component.name}</h3>
                    </div>
                    <StatusBadge status={component.status} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <HealthBadge health={component.health} />
                    <Badge variant="outline" className="text-xs">
                      v{component.version}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    <p>副本: {component.replicas.ready}/{component.replicas.desired}</p>
                    <p>运行时间: {component.uptime}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 组件详情 */}
        <div className="lg:col-span-2">
          {selectedComponent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CategoryIcon category={selectedComponent.category} />
                      {selectedComponent.name}
                      <StatusBadge status={selectedComponent.status} />
                      <HealthBadge health={selectedComponent.health} />
                    </CardTitle>
                    <CardDescription>
                      版本: {selectedComponent.version} | 运行时间: {selectedComponent.uptime}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleComponentAction(selectedComponent.id, 'restart')}
                      disabled={selectedComponent.status === 'deploying'}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      重启
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleComponentAction(selectedComponent.id, 'stop')}
                      disabled={selectedComponent.status !== 'running'}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      停止
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleComponentAction(selectedComponent.id, 'start')}
                      disabled={selectedComponent.status === 'running'}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      启动
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">概览</TabsTrigger>
                    <TabsTrigger value="metrics">指标</TabsTrigger>
                    <TabsTrigger value="logs">日志</TabsTrigger>
                    <TabsTrigger value="config">配置</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>副本状态</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress 
                            value={(selectedComponent.replicas.ready / selectedComponent.replicas.desired) * 100} 
                            className="flex-1" 
                          />
                          <span className="text-sm text-gray-600">
                            {selectedComponent.replicas.ready}/{selectedComponent.replicas.desired}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label>资源配置</Label>
                        <div className="text-sm text-gray-600 mt-1">
                          <p>CPU: {selectedComponent.resources.cpu}</p>
                          <p>内存: {selectedComponent.resources.memory}</p>
                          <p>存储: {selectedComponent.resources.storage}</p>
                        </div>
                      </div>
                      <div>
                        <Label>端口</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedComponent.ports.map((port) => (
                            <Badge key={port} variant="outline">
                              {port}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>端点</Label>
                        <div className="text-sm text-gray-600 mt-1">
                          {selectedComponent.endpoints.map((endpoint, index) => (
                            <p key={index}>{endpoint}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="metrics" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <MetricCard
                        title="CPU 使用率"
                        value={Math.round(selectedComponent.metrics.cpu)}
                        unit="%"
                        icon={<Cpu className="h-4 w-4" />}
                        color="bg-blue-100 text-blue-600"
                      />
                      <MetricCard
                        title="内存使用率"
                        value={Math.round(selectedComponent.metrics.memory)}
                        unit="%"
                        icon={<MemoryStick className="h-4 w-4" />}
                        color="bg-green-100 text-green-600"
                      />
                      <MetricCard
                        title="网络流量"
                        value={Math.round(selectedComponent.metrics.network)}
                        unit="KB/s"
                        icon={<Wifi className="h-4 w-4" />}
                        color="bg-purple-100 text-purple-600"
                      />
                      <MetricCard
                        title="请求数/分钟"
                        value={selectedComponent.metrics.requests}
                        unit=""
                        icon={<Zap className="h-4 w-4" />}
                        color="bg-orange-100 text-orange-600"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="logs" className="space-y-4">
                    <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                      {selectedComponent.logs.map((log, index) => (
                        <div key={index} className="mb-1">
                          {log}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        下载日志
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        刷新
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="config" className="space-y-4">
                    <Alert>
                      <Settings className="h-4 w-4" />
                      <AlertDescription>
                        组件配置可以在配置管理页面进行修改。
                      </AlertDescription>
                    </Alert>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      打开配置管理
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">选择一个组件</p>
                  <p>从左侧列表中选择要查看的组件</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 部署任务 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            部署任务
          </CardTitle>
          <CardDescription>当前正在执行的部署任务</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deploymentTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{task.type}</Badge>
                    <span className="font-medium">{task.component}</span>
                    <span className="text-sm text-gray-600">({task.environment})</span>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Progress value={task.progress} className="flex-1" />
                  <span className="text-sm text-gray-600">{task.progress}%</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>开始时间: {task.startTime}</p>
                  {task.endTime && <p>结束时间: {task.endTime}</p>}
                  {task.error && <p className="text-red-600">错误: {task.error}</p>}
                </div>
                {task.logs.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600">查看日志</summary>
                    <div className="bg-gray-100 p-2 rounded mt-2 text-xs font-mono">
                      {task.logs.map((log, index) => (
                        <div key={index}>{log}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}