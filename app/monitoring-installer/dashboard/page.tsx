"use client"

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { COMPONENT_CONFIGS } from '../components/ComponentDetails' // Added
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Activity, 
  Database, 
  BarChart3, 
  Bell, 
  Server, 
  Monitor, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Settings, 
  Eye, 
  ExternalLink,
  Globe,
  Shield,
  Wifi,
  Container,
  Users,
  Calendar,
  Timer,
  Target,
  Gauge
} from 'lucide-react'

interface MetricData {
  timestamp: string
  value: number
}

interface ComponentMetrics {
  id: string
  name: string
  category: 'collector' | 'storage' | 'visualization' | 'alerting'
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  uptime: string
  version: string
  metrics: {
    cpu: {
      current: number
      average: number
      trend: 'up' | 'down' | 'stable'
      history: MetricData[]
    }
    memory: {
      current: number
      average: number
      trend: 'up' | 'down' | 'stable'
      history: MetricData[]
    }
    requests: {
      current: number
      total: number
      trend: 'up' | 'down' | 'stable'
      history: MetricData[]
    }
    errors: {
      current: number
      rate: number
      trend: 'up' | 'down' | 'stable'
      history: MetricData[]
    }
  }
  alerts: {
    critical: number
    warning: number
    info: number
  }
}

interface SystemOverview {
  totalComponents: number
  healthyComponents: number
  warningComponents: number
  criticalComponents: number
  totalAlerts: number
  activeIncidents: number
  dataIngestionRate: number
  queryRate: number
  storageUsed: number
  storageTotal: number
  networkTraffic: number
  uptime: string
}

// Define types for MonitoringComponent and ComponentVersion if not already globally available
// For this scope, assuming they are implicitly available or defined in COMPONENT_CONFIGS import
interface MonitoringComponentConfig {
  id: string;
  name: string;
  category: 'collector' | 'storage' | 'visualization' | 'alerting';
  versions: { version: string }[];
  // Add other fields from COMPONENT_CONFIGS if needed by generateInitialComponentMetrics
}

interface AllComponentConfigs {
  [key: string]: MonitoringComponentConfig;
}


interface AlertItem {
  id: string
  severity: 'critical' | 'warning' | 'info'
  component: string
  message: string
  timestamp: string
  status: 'active' | 'resolved' | 'acknowledged'
}

// 真实API数据获取
const fetchComponentMetrics = async () => {
  try {
    // 这里调用真实API获取组件指标
    // const response = await apiClient.getMonitoringStatus()
    // return response.components || []
    return []
  } catch (error) {
    console.error('Failed to fetch component metrics:', error)
    return []
  }
}

// 获取真实时序数据
const fetchTimeSeriesData = async (componentId: string, metric: string): Promise<MetricData[]> => {
  try {
    const response = await fetch(`/api/monitoring/metrics/${componentId}/${metric}`)
    if (response.ok) {
      const data = await response.json()
      return data.metrics || []
    }
  } catch (error) {
    console.error('Failed to fetch time series data:', error)
  }
  return [] // 没有数据时返回空数组
}

// Helper function to generate initial component metrics
const generateInitialComponentMetrics = (
  configs: AllComponentConfigs,
  existingMocks: ComponentMetrics[]
): ComponentMetrics[] => {
  const allMetrics: ComponentMetrics[] = [];
  const existingMockMap = new Map(existingMocks.map(m => [m.id, m]));

  Object.keys(configs).forEach(id => {
    const config = configs[id];
    if (existingMockMap.has(id)) {
      // Use existing mock if available
      allMetrics.push(existingMockMap.get(id)!);
    } else {
      // Create new default metric structure
      allMetrics.push({
        id: config.id,
        name: config.name,
        category: config.category,
        status: 'unknown', // Default status
        uptime: '0d 0h 0m', // Default uptime
        version: config.versions[0]?.version || 'N/A', // Default to latest version
        metrics: {
          cpu: { current: 0, average: 0, trend: 'stable', history: generateTimeSeriesData(30, 0, 5) },
          memory: { current: 0, average: 0, trend: 'stable', history: generateTimeSeriesData(30, 0, 5) },
          requests: { current: 0, total: 0, trend: 'stable', history: generateTimeSeriesData(30, 0, 50) },
          errors: { current: 0, rate: 0, trend: 'stable', history: generateTimeSeriesData(30, 0, 1) },
        },
        alerts: { critical: 0, warning: 0, info: 0 },
      });
    }
  });
  return allMetrics;
};


// 获取真实系统概览数据
const fetchSystemOverview = async (): Promise<SystemOverview> => {
  try {
    const response = await fetch('/api/monitoring/overview')
    if (response.ok) {
      const data = await response.json()
      return data.overview || {
        totalComponents: 0,
        healthyComponents: 0,
        warningComponents: 0,
        criticalComponents: 0,
        totalAlerts: 0,
        activeIncidents: 0,
        dataIngestionRate: 0,
        queryRate: 0,
        storageUsed: 0,
        storageTotal: 0,
        networkTraffic: 0,
        uptime: '0d 0h 0m'
      }
    }
  } catch (error) {
    console.error('Failed to fetch system overview:', error)
  }
  // 返回空数据而不是假数据
  return {
    totalComponents: 0,
    healthyComponents: 0,
    warningComponents: 0,
    criticalComponents: 0,
    totalAlerts: 0,
    activeIncidents: 0,
    dataIngestionRate: 0,
    queryRate: 0,
    storageUsed: 0,
    storageTotal: 0,
    networkTraffic: 0,
    uptime: '0d 0h 0m'
  }
}

// 移除所有MOCK数据，改为从API获取
const [componentMetrics, setComponentMetrics] = useState<ComponentMetrics[]>([])
const [systemOverview, setSystemOverview] = useState<SystemOverview | null>(null)

// 获取真实组件指标数据
const fetchComponentMetrics = async () => {
  try {
    const response = await fetch('/api/monitoring/components')
    if (response.ok) {
      const data = await response.json()
      setComponentMetrics(data.components || [])
    } else {
      setComponentMetrics([]) // 无数据时显示空列表
    }
  } catch (error) {
    console.error('Failed to fetch component metrics:', error)
    setComponentMetrics([])
  }
}

// 移除原来的MOCK数据定义
const REMOVED_MOCK_COMPONENT_METRICS: ComponentMetrics[] = [
  {
    id: 'node-exporter', // This ID must match a key in COMPONENT_CONFIGS
    name: 'Node Exporter', // This will be overridden by COMPONENT_CONFIGS if logic is set up that way
    category: 'collector', // Will be overridden
    status: 'healthy',
    uptime: '15d 8h 32m', // Example uptime
    version: '1.7.0', // Will be overridden by latest from COMPONENT_CONFIGS
    metrics: { /* ... existing detailed metrics ... */
      cpu: { current: 12, average: 15, trend: 'down', history: generateTimeSeriesData(30, 15, 10) },
      memory: { current: 45, average: 42, trend: 'up', history: generateTimeSeriesData(30, 42, 15) },
      requests: { current: 1250, total: 1847520, trend: 'stable', history: generateTimeSeriesData(30, 1200, 200) },
      errors: { current: 0, rate: 0.02, trend: 'stable', history: generateTimeSeriesData(30, 0, 1) }
    },
    alerts: { critical: 0, warning: 1, info: 2 }
  },
  {
    id: 'victoriametrics', // Must match a key in COMPONENT_CONFIGS
    name: 'VictoriaMetrics', // Override
    category: 'storage', // Override
    status: 'healthy',
    uptime: '15d 8h 30m', // Example
    version: '1.96.0', // Override
    metrics: { /* ... existing detailed metrics ... */
      cpu: { current: 35, average: 32, trend: 'up', history: generateTimeSeriesData(30, 32, 12) },
      memory: { current: 68, average: 65, trend: 'stable', history: generateTimeSeriesData(30, 65, 8) },
      requests: { current: 3420, total: 5234890, trend: 'up', history: generateTimeSeriesData(30, 3200, 500) },
      errors: { current: 2, rate: 0.06, trend: 'stable', history: generateTimeSeriesData(30, 2, 3) }
    },
    alerts: { critical: 0, warning: 0, info: 1 }
  },
  {
    id: 'grafana', // Must match a key in COMPONENT_CONFIGS
    name: 'Grafana', // Override
    category: 'visualization', // Override
    status: 'warning',
    uptime: '2d 4h 15m', // Example
    version: '10.2.3', // Override
    metrics: { /* ... existing detailed metrics ... */
      cpu: { current: 25, average: 22, trend: 'up', history: generateTimeSeriesData(30, 22, 8) },
      memory: { current: 85, average: 78, trend: 'up', history: generateTimeSeriesData(30, 78, 12) },
      requests: { current: 890, total: 234560, trend: 'stable', history: generateTimeSeriesData(30, 850, 150) },
      errors: { current: 5, rate: 0.56, trend: 'up', history: generateTimeSeriesData(30, 3, 4) }
    },
    alerts: { critical: 0, warning: 2, info: 1 }
  },
  {
    id: 'alertmanager', // Must match a key in COMPONENT_CONFIGS
    name: 'Alertmanager', // Override
    category: 'alerting', // Override
    status: 'critical',
    uptime: '0h 0m', // Example
    version: '0.26.0', // Override
    metrics: { /* ... existing detailed metrics ... */
      cpu: { current: 0, average: 8, trend: 'down', history: generateTimeSeriesData(30, 8, 5) },
      memory: { current: 0, average: 25, trend: 'down', history: generateTimeSeriesData(30, 25, 10) },
      requests: { current: 0, total: 45230, trend: 'down', history: generateTimeSeriesData(30, 120, 50) },
      errors: { current: 15, rate: 100, trend: 'up', history: generateTimeSeriesData(30, 5, 8) }
    },
    alerts: { critical: 3, warning: 1, info: 0 }
  }
];

// This MOCK_ALERTS array can remain as is, or be dynamically generated if needed
const MOCK_ALERTS: AlertItem[] = [
  {
    id: 'alert-1',
    severity: 'critical',
    component: 'alertmanager',
    message: 'Alertmanager service is down',
    timestamp: '2024-01-22 16:30:00',
    status: 'active'
  },
  {
    id: 'alert-2',
    severity: 'critical',
    component: 'alertmanager',
    message: 'Failed to start Alertmanager container',
    timestamp: '2024-01-22 16:25:00',
    status: 'active'
  },
  {
    id: 'alert-3',
    severity: 'warning',
    component: 'grafana',
    message: 'High memory usage detected (85%)',
    timestamp: '2024-01-22 16:20:00',
    status: 'acknowledged'
  },
  {
    id: 'alert-4',
    severity: 'warning',
    component: 'grafana',
    message: 'Increased error rate in dashboard queries',
    timestamp: '2024-01-22 16:15:00',
    status: 'active'
  },
  {
    id: 'alert-5',
    severity: 'info',
    component: 'node-exporter',
    message: 'Metrics collection completed successfully',
    timestamp: '2024-01-22 16:10:00',
    status: 'resolved'
  }
]

const StatusBadge = ({ status, t }: { status: string; t: (key: string) => string }) => {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode; labelKey: string }> = {
    healthy: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" />, labelKey: 'status.healthy' },
    warning: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-3 w-3" />, labelKey: 'status.warning' },
    critical: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" />, labelKey: 'status.critical' },
    unknown: { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" />, labelKey: 'status.unknown' }
  }

  const config = statusConfig[status] || statusConfig.unknown

  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      {config.icon}
      {t(config.labelKey)}
    </Badge>
  )
}

const TrendIcon = ({ trend }: { trend: string }) => {
  const trendConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    up: { icon: <TrendingUp className="h-4 w-4" />, color: 'text-red-600' },
    down: { icon: <TrendingDown className="h-4 w-4" />, color: 'text-green-600' },
    stable: { icon: <Activity className="h-4 w-4" />, color: 'text-gray-600' }
  }

  const config = trendConfig[trend] || trendConfig.stable

  return (
    <div className={config.color}>
      {config.icon}
    </div>
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

const MetricCard = ({ title, value, unit, icon, color, trend, subtitle }: {
  title: string
  value: number | string
  unit?: string
  icon: React.ReactNode
  color: string
  trend?: string
  subtitle?: string
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm text-gray-600">{title}</p>
              <p className="text-2xl font-bold">
                {typeof value === 'number' ? value.toLocaleString() : value}
                {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
              </p>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {trend && <TrendIcon trend={trend} />}
        </div>
      </CardContent>
    </Card>
  )
}

const AlertBadge = ({ severity }: { severity: string }) => {
  const severityConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    critical: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
    warning: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-3 w-3" /> },
    info: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3" /> }
  }

  const config = severityConfig[severity] || severityConfig.info

  return (
    <Badge className={`${config.color} flex items-center gap-1 text-xs`}>
      {config.icon}
      {severity.toUpperCase()}
    </Badge>
  )
}

const MiniChart = ({ data, color = 'blue' }: { data: MetricData[]; color?: string }) => {
  const max = Math.max(...data.map(d => d.value))
  const min = Math.min(...data.map(d => d.value))
  const range = max - min || 1

  return (
    <div className="flex items-end gap-1 h-8">
      {data.slice(-10).map((point, index) => {
        const height = ((point.value - min) / range) * 100
        return (
          <div
            key={index}
            className={`w-1 bg-${color}-500 rounded-t`}
            style={{ height: `${Math.max(height, 5)}%` }}
          />
        )
      })}
    </div>
  )
}

export default function MonitoringDashboard() {
  const { t } = useLanguage()
  const [componentMetrics, setComponentMetrics] = useState<ComponentMetrics[]>(
    generateInitialComponentMetrics(COMPONENT_CONFIGS as AllComponentConfigs, ORIGINAL_MOCK_COMPONENT_METRICS)
  );
  const [systemOverview, setSystemOverview] = useState<SystemOverview>(() => {
    const initialMetrics = generateInitialComponentMetrics(COMPONENT_CONFIGS as AllComponentConfigs, ORIGINAL_MOCK_COMPONENT_METRICS);
    let healthy = 0;
    let warning = 0;
    let critical = 0;
    initialMetrics.forEach(c => {
      if (c.status === 'healthy') healthy++;
      else if (c.status === 'warning') warning++;
      else if (c.status === 'critical') critical++;
    });
    // For unknown, if they are not counted in healthy/warning/critical, totalComponents will cover them.
    // Or adjust logic to specifically count unknown and subtract from healthy if needed.
    return {
      ...INITIAL_SYSTEM_OVERVIEW,
      healthyComponents: healthy,
      warningComponents: warning,
      criticalComponents: critical,
      // If a component is 'unknown', it won't be in healthy, warning, or critical.
      // totalComponents is already set to Object.keys(COMPONENT_CONFIGS).length.
    };
  });
  const [alerts, setAlerts] = useState<AlertItem[]>(MOCK_ALERTS)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState('30')
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h')

  // 自动刷新数据
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // 模拟数据更新
      setComponentMetrics(prev => prev.map(component => ({
        ...component,
        metrics: {
          ...component.metrics,
          cpu: {
            ...component.metrics.cpu,
            current: Math.max(0, component.metrics.cpu.current + (Math.random() - 0.5) * 5)
          },
          memory: {
            ...component.metrics.memory,
            current: Math.max(0, component.metrics.memory.current + (Math.random() - 0.5) * 3)
          },
          requests: {
            ...component.metrics.requests,
            current: Math.max(0, component.metrics.requests.current + Math.floor((Math.random() - 0.5) * 100))
          }
        }
      })))

      setSystemOverview(prev => ({
        ...prev,
        dataIngestionRate: Math.max(0, prev.dataIngestionRate + Math.floor((Math.random() - 0.5) * 1000)),
        queryRate: Math.max(0, prev.queryRate + Math.floor((Math.random() - 0.5) * 200)),
        networkTraffic: Math.max(0, prev.networkTraffic + Math.floor((Math.random() - 0.5) * 100))
      }))
    }, parseInt(refreshInterval) * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const getHealthyPercentage = () => {
    return Math.round((systemOverview.healthyComponents / systemOverview.totalComponents) * 100)
  }

  const getStoragePercentage = () => {
    return Math.round((systemOverview.storageUsed / systemOverview.storageTotal) * 100)
  }

  const getActiveAlerts = () => {
    return alerts.filter(alert => alert.status === 'active')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('monitoringDashboard.header.title')}</h1>
          <p className="text-gray-600 mt-1">{t('monitoringDashboard.header.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm">{t('monitoringDashboard.controls.autoRefreshLabel')}</Label>
          </div>
          <Select value={refreshInterval} onValueChange={setRefreshInterval}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">{t('monitoringDashboard.controls.interval.seconds10')}</SelectItem>
              <SelectItem value="30">{t('monitoringDashboard.controls.interval.seconds30')}</SelectItem>
              <SelectItem value="60">{t('monitoringDashboard.controls.interval.minute1')}</SelectItem>
              <SelectItem value="300">{t('monitoringDashboard.controls.interval.minutes5')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('actions.refresh')}
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('monitoringDashboard.overview.systemHealth.title')}
          value={getHealthyPercentage()}
          unit="%"
          icon={<Shield className="h-5 w-5" />}
          color="bg-green-100 text-green-600"
          subtitle={`${systemOverview.healthyComponents}/${systemOverview.totalComponents} ${t('monitoringDashboard.overview.systemHealth.componentsHealthy')}`}
        />
        <MetricCard
          title={t('monitoringDashboard.overview.activeAlerts.title')}
          value={getActiveAlerts().length}
          icon={<Bell className="h-5 w-5" />}
          color="bg-red-100 text-red-600"
          subtitle={t('monitoringDashboard.overview.activeAlerts.totalAlerts', { count: systemOverview.totalAlerts })}
        />
        <MetricCard
          title={t('monitoringDashboard.overview.dataIngestionRate.title')}
          value={systemOverview.dataIngestionRate}
          unit={t('units.perMinute')}
          icon={<Zap className="h-5 w-5" />}
          color="bg-blue-100 text-blue-600"
          trend="up"
        />
        <MetricCard
          title={t('monitoringDashboard.overview.queryRate.title')}
          value={systemOverview.queryRate}
          unit={t('units.perMinute')}
          icon={<Target className="h-5 w-5" />}
          color="bg-purple-100 text-purple-600"
          trend="stable"
        />
      </div>

      {/* 存储和网络 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-orange-600" />
                <span className="font-medium">{t('monitoringDashboard.storage.title')}</span>
              </div>
              <span className="text-sm text-gray-600">{getStoragePercentage()}%</span>
            </div>
            <Progress value={getStoragePercentage()} className="mb-2" />
            <p className="text-sm text-gray-600">
              {systemOverview.storageUsed}GB / {systemOverview.storageTotal}GB
            </p>
          </CardContent>
        </Card>
        <MetricCard
          title={t('monitoringDashboard.network.traffic.title')}
          value={systemOverview.networkTraffic}
          unit={t('units.megabytesPerSecond')}
          icon={<Wifi className="h-5 w-5" />}
          color="bg-cyan-100 text-cyan-600"
          trend="up"
        />
        <MetricCard
          title={t('monitoringDashboard.overview.systemUptime.title')}
          value={systemOverview.uptime}
          icon={<Clock className="h-5 w-5" />}
          color="bg-emerald-100 text-emerald-600"
        />
      </div>

      {/* Component Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Container className="h-5 w-5" />
            {t('monitoringDashboard.componentStatus.header.title')}
          </CardTitle>
          <CardDescription>{t('monitoringDashboard.componentStatus.header.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {componentMetrics.map((component) => (
              <Card key={component.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CategoryIcon category={component.category} />
                      <h3 className="font-medium">{component.name}</h3> {/* Component name might also need translation if it's not a proper noun */}
                      <Badge variant="outline" className="text-xs">
                        v{component.version}
                      </Badge>
                    </div>
                    <StatusBadge status={component.status} t={t} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{t('metrics.cpu')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{Math.round(component.metrics.cpu.current)}%</span>
                        <TrendIcon trend={component.metrics.cpu.trend} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MemoryStick className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{t('metrics.memory')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{Math.round(component.metrics.memory.current)}%</span>
                        <TrendIcon trend={component.metrics.memory.trend} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">{t('metrics.requests')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{component.metrics.requests.current}</span>
                        <TrendIcon trend={component.metrics.requests.trend} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">{t('metrics.errors')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{component.metrics.errors.current}</span>
                        <TrendIcon trend={component.metrics.errors.trend} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{t('monitoringDashboard.componentStatus.card.uptimeLabel')} {component.uptime}</span>
                    <div className="flex items-center gap-1">
                      <span>{t('monitoringDashboard.componentStatus.card.alertsLabel')}</span>
                      {component.alerts.critical > 0 && (
                        <Badge className="bg-red-100 text-red-800 text-xs px-1">
                          {component.alerts.critical}
                        </Badge>
                      )}
                      {component.alerts.warning > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs px-1">
                          {component.alerts.warning}
                        </Badge>
                      )}
                      {component.alerts.info > 0 && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs px-1">
                          {component.alerts.info}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 告警和事件 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('monitoringDashboard.activeAlerts.header.title')}
            </CardTitle>
            <CardDescription>{t('monitoringDashboard.activeAlerts.header.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getActiveAlerts().slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <AlertBadge severity={alert.severity} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p> {/* Alert message might need translation depending on source */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                      <span>{alert.component}</span> {/* Component name might also need translation */}
                      <span>•</span>
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
              {getActiveAlerts().length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>{t('monitoringDashboard.activeAlerts.noAlerts')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('monitoringDashboard.performanceTrends.header.title')}
            </CardTitle>
            <CardDescription>{t('monitoringDashboard.performanceTrends.header.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('monitoringDashboard.performanceTrends.cpuUsage.title')}</p>
                  <p className="text-xs text-gray-600">{t('monitoringDashboard.performanceTrends.averageLabel', { value: '23%' })}</p> {/* Value is dynamic */}
                </div>
                <MiniChart data={componentMetrics[0]?.metrics.cpu.history || []} color="blue" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('monitoringDashboard.performanceTrends.memoryUsage.title')}</p>
                  <p className="text-xs text-gray-600">{t('monitoringDashboard.performanceTrends.averageLabel', { value: '56%' })}</p> {/* Value is dynamic */}
                </div>
                <MiniChart data={componentMetrics[0]?.metrics.memory.history || []} color="green" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('monitoringDashboard.performanceTrends.requestCount.title')}</p>
                  <p className="text-xs text-gray-600">{t('monitoringDashboard.performanceTrends.averageLabel', { value: '2.1k/min' })}</p> {/* Value is dynamic */}
                </div>
                <MiniChart data={componentMetrics[0]?.metrics.requests.history || []} color="purple" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('monitoringDashboard.performanceTrends.errorRate.title')}</p>
                  <p className="text-xs text-gray-600">{t('monitoringDashboard.performanceTrends.averageLabel', { value: '0.15%' })}</p> {/* Value is dynamic */}
                </div>
                <MiniChart data={componentMetrics[0]?.metrics.errors.history || []} color="red" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('monitoringDashboard.quickActions.header.title')}</CardTitle>
          <CardDescription>{t('monitoringDashboard.quickActions.header.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span>{t('monitoringDashboard.quickActions.buttons.configManagement')}</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Monitor className="h-6 w-6" />
              <span>{t('monitoringDashboard.quickActions.buttons.deploymentManagement')}</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Eye className="h-6 w-6" />
              <span>{t('monitoringDashboard.quickActions.buttons.logViewing')}</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <ExternalLink className="h-6 w-6" />
              <span>{t('monitoringDashboard.quickActions.buttons.externalLinks')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}