"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Database, 
  Server, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from "lucide-react"

interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
    temperature?: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  network: {
    latency: number
    throughput: number
    packetsLost: number
  }
  services: {
    database: 'healthy' | 'degraded' | 'down'
    api: 'healthy' | 'degraded' | 'down'
    cache: 'healthy' | 'degraded' | 'down'
    monitoring: 'healthy' | 'degraded' | 'down'
  }
  uptime: number
  lastUpdate: Date
}

interface HealthAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: Date
  resolved: boolean
}

export function SystemHealthMonitor() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [alerts, setAlerts] = useState<HealthAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchSystemMetrics = async () => {
    try {
      setIsLoading(true)
      
      // 模拟系统指标获取
      const response = await fetch('/api/system/health')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      } else {
        // 模拟数据
        const mockMetrics: SystemMetrics = {
          cpu: {
            usage: Math.random() * 100,
            cores: 8,
            temperature: 45 + Math.random() * 20
          },
          memory: {
            used: 6.4,
            total: 16,
            percentage: 40 + Math.random() * 30
          },
          disk: {
            used: 120,
            total: 500,
            percentage: 24 + Math.random() * 50
          },
          network: {
            latency: 10 + Math.random() * 50,
            throughput: 100 + Math.random() * 900,
            packetsLost: Math.random() * 0.1
          },
          services: {
            database: Math.random() > 0.1 ? 'healthy' : 'degraded',
            api: Math.random() > 0.05 ? 'healthy' : 'degraded',
            cache: Math.random() > 0.15 ? 'healthy' : 'degraded',
            monitoring: 'healthy'
          },
          uptime: Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000),
          lastUpdate: new Date()
        }
        setMetrics(mockMetrics)
        
        // 生成告警
        const newAlerts: HealthAlert[] = []
        if (mockMetrics.cpu.usage > 80) {
          newAlerts.push({
            id: `cpu-${Date.now()}`,
            type: 'warning',
            message: `CPU usage is high: ${mockMetrics.cpu.usage.toFixed(1)}%`,
            timestamp: new Date(),
            resolved: false
          })
        }
        if (mockMetrics.memory.percentage > 85) {
          newAlerts.push({
            id: `memory-${Date.now()}`,
            type: 'error',
            message: `Memory usage critical: ${mockMetrics.memory.percentage.toFixed(1)}%`,
            timestamp: new Date(),
            resolved: false
          })
        }
        if (mockMetrics.network.latency > 100) {
          newAlerts.push({
            id: `network-${Date.now()}`,
            type: 'warning',
            message: `High network latency: ${mockMetrics.network.latency.toFixed(0)}ms`,
            timestamp: new Date(),
            resolved: false
          })
        }
        
        setAlerts(prev => [...prev.slice(-10), ...newAlerts])
      }
    } catch (error) {
      console.error('Failed to fetch system metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemMetrics()
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemMetrics, 30000) // 30秒刷新
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'degraded': return 'bg-yellow-500'
      case 'down': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'down': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (24 * 60 * 60 * 1000))
    const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000))
    return `${days}d ${hours}h ${minutes}m`
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 系统概览 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health Monitor
            </CardTitle>
            <CardDescription>
              Real-time system performance and health metrics
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Disable' : 'Enable'} Auto Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSystemMetrics}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* CPU */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <Progress value={metrics.cpu.usage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{metrics.cpu.usage.toFixed(1)}%</span>
                <span>{metrics.cpu.cores} cores</span>
              </div>
            </div>

            {/* Memory */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <Progress value={metrics.memory.percentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{metrics.memory.percentage.toFixed(1)}%</span>
                <span>{metrics.memory.used.toFixed(1)}GB / {metrics.memory.total}GB</span>
              </div>
            </div>

            {/* Disk */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span className="text-sm font-medium">Disk Usage</span>
              </div>
              <Progress value={metrics.disk.percentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{metrics.disk.percentage.toFixed(1)}%</span>
                <span>{metrics.disk.used}GB / {metrics.disk.total}GB</span>
              </div>
            </div>

            {/* Network */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">Network</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span>{metrics.network.latency.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Throughput:</span>
                  <span>{metrics.network.throughput.toFixed(0)} Mbps</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 服务状态 */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>Status of critical system services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(metrics.services).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className="capitalize font-medium">{service}</span>
                </div>
                <Badge variant={status === 'healthy' ? 'default' : status === 'degraded' ? 'secondary' : 'destructive'}>
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 系统信息 */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Uptime</div>
              <div className="text-lg font-semibold">{formatUptime(metrics.uptime)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Update</div>
              <div className="text-lg font-semibold">{metrics.lastUpdate.toLocaleTimeString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">CPU Temperature</div>
              <div className="text-lg font-semibold">
                {metrics.cpu.temperature ? `${metrics.cpu.temperature.toFixed(1)}°C` : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 告警 */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>System health alerts and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(-5).map((alert) => (
                <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex justify-between items-center">
                    <span>{alert.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}