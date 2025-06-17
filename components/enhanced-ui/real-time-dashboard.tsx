"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  RotateCcw
} from "lucide-react"

interface RealTimeMetric {
  timestamp: number
  cpu: number
  memory: number
  network: number
  alerts: number
  devices: number
  throughput: number
}

interface AlertData {
  id: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  timestamp: number
  source: string
}

export function RealTimeDashboard() {
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([])
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [isRunning, setIsRunning] = useState(true)
  const [updateInterval, setUpdateInterval] = useState(2000) // 2秒
  const intervalRef = useRef<NodeJS.Timeout>()
  const maxDataPoints = 50

  // 生成实时数据
  const generateMetric = (): RealTimeMetric => {
    const now = Date.now()
    const lastMetric = metrics[metrics.length - 1]
    
    return {
      timestamp: now,
      cpu: Math.max(0, Math.min(100, (lastMetric?.cpu || 50) + (Math.random() - 0.5) * 20)),
      memory: Math.max(0, Math.min(100, (lastMetric?.memory || 60) + (Math.random() - 0.5) * 15)),
      network: Math.max(0, Math.min(1000, (lastMetric?.network || 100) + (Math.random() - 0.5) * 100)),
      alerts: Math.floor(Math.random() * 10),
      devices: 25 + Math.floor(Math.random() * 10),
      throughput: Math.max(0, (lastMetric?.throughput || 500) + (Math.random() - 0.5) * 200)
    }
  }

  // 生成告警
  const generateAlert = (): AlertData | null => {
    if (Math.random() > 0.1) return null // 10%概率生成告警
    
    const severities: ('critical' | 'warning' | 'info')[] = ['critical', 'warning', 'info']
    const messages = [
      'High CPU usage detected',
      'Memory usage approaching limit',
      'Network latency spike',
      'Device connection lost',
      'Service response time degraded',
      'Disk space running low',
      'Authentication failure detected',
      'Configuration change detected'
    ]
    const sources = ['CPU Monitor', 'Memory Manager', 'Network Scanner', 'Device Manager', 'Service Monitor']
    
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity: severities[Math.floor(Math.random() * severities.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      timestamp: Date.now(),
      source: sources[Math.floor(Math.random() * sources.length)]
    }
  }

  // 更新数据
  const updateData = () => {
    setMetrics(prev => {
      const newMetric = generateMetric()
      const updated = [...prev, newMetric]
      return updated.slice(-maxDataPoints)
    })

    const newAlert = generateAlert()
    if (newAlert) {
      setAlerts(prev => [newAlert, ...prev.slice(0, 19)]) // 保留最新20条告警
    }
  }

  // 启动/停止实时更新
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(updateData, updateInterval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, updateInterval])

  // 初始化数据
  useEffect(() => {
    const initialData: RealTimeMetric[] = []
    const now = Date.now()
    for (let i = maxDataPoints - 1; i >= 0; i--) {
      initialData.push({
        timestamp: now - i * updateInterval,
        cpu: 30 + Math.random() * 40,
        memory: 40 + Math.random() * 30,
        network: 50 + Math.random() * 100,
        alerts: Math.floor(Math.random() * 5),
        devices: 25 + Math.floor(Math.random() * 10),
        throughput: 300 + Math.random() * 400
      })
    }
    setMetrics(initialData)
  }, [])

  const currentMetric = metrics[metrics.length - 1]
  const previousMetric = metrics[metrics.length - 2]

  const getTrend = (current: number, previous: number) => {
    if (!previous) return null
    const diff = current - previous
    if (Math.abs(diff) < 1) return null
    return diff > 0 ? 'up' : 'down'
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500'
      case 'warning': return 'text-yellow-500'
      case 'info': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-Time Monitoring Dashboard
            </CardTitle>
            <CardDescription>
              Live system metrics and alerts with {updateInterval/1000}s refresh rate
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isRunning ? 'Pause' : 'Resume'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMetrics([])
                setAlerts([])
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 实时指标卡片 */}
      {currentMetric && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              <div className="flex items-center gap-1">
                {getTrend(currentMetric.cpu, previousMetric?.cpu) === 'up' && 
                  <TrendingUp className="h-4 w-4 text-red-500" />}
                {getTrend(currentMetric.cpu, previousMetric?.cpu) === 'down' && 
                  <TrendingDown className="h-4 w-4 text-green-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetric.cpu.toFixed(1)}%</div>
              <Progress value={currentMetric.cpu} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <div className="flex items-center gap-1">
                {getTrend(currentMetric.memory, previousMetric?.memory) === 'up' && 
                  <TrendingUp className="h-4 w-4 text-red-500" />}
                {getTrend(currentMetric.memory, previousMetric?.memory) === 'down' && 
                  <TrendingDown className="h-4 w-4 text-green-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetric.memory.toFixed(1)}%</div>
              <Progress value={currentMetric.memory} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Traffic</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetric.network.toFixed(0)} Mbps</div>
              <p className="text-xs text-muted-foreground mt-2">
                Throughput: {currentMetric.throughput.toFixed(0)} req/s
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetric.devices}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {currentMetric.alerts} active alerts
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 实时图表 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>CPU and Memory usage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={formatTime}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`, 
                    name === 'cpu' ? 'CPU' : 'Memory'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                  name="cpu"
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  name="memory"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Activity</CardTitle>
            <CardDescription>Traffic and throughput metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={formatTime}
                  formatter={(value: number, name: string) => [
                    name === 'network' ? `${value.toFixed(0)} Mbps` : `${value.toFixed(0)} req/s`,
                    name === 'network' ? 'Traffic' : 'Throughput'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="network" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="network"
                />
                <Area 
                  type="monotone" 
                  dataKey="throughput" 
                  stackId="2"
                  stroke="#f59e0b" 
                  fill="#f59e0b"
                  fillOpacity={0.6}
                  name="throughput"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 实时告警 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Live Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive">{alerts.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Real-time system alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No active alerts</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-muted-foreground">
                        {alert.source} • {formatTime(alert.timestamp)}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      alert.severity === 'critical' ? 'destructive' : 
                      alert.severity === 'warning' ? 'secondary' : 'default'
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}