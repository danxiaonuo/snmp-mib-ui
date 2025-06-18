"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  Server,
  Network,
  Thermometer,
  Zap,
  HardDrive
} from "lucide-react"

interface MonitoringMetric {
  name: string
  value: string
  type: string
  help?: string
  timestamp: number
  status: 'ok' | 'warning' | 'error'
}

interface TestResult {
  host: string
  success: boolean
  metrics: MonitoringMetric[]
  error?: string
  responseTime?: number
  lastUpdate: number
}

interface RealTimeMonitoringTestProps {
  config: string
  targets: Array<{
    host: string
    community: string
    version: string
    name?: string
  }>
  onMetricsUpdate?: (metrics: MonitoringMetric[]) => void
}

export function RealTimeMonitoringTest({ config, targets, onMetricsUpdate }: RealTimeMonitoringTestProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30) // 秒
  const [totalMetrics, setTotalMetrics] = useState(0)
  const [successfulTargets, setSuccessfulTargets] = useState(0)

  // 执行配置验证和数据抓取
  const runTest = async () => {
    if (!config || targets.length === 0) return

    setIsRunning(true)
    
    try {
      const response = await fetch('/api/snmp/validate-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          configType: 'snmp_exporter',
          testTargets: targets
        })
      })

      const result = await response.json()
      
      if (result.success && result.testResults) {
        const updatedResults = result.testResults.map((testResult: any) => ({
          ...testResult,
          lastUpdate: Date.now(),
          metrics: testResult.metrics.map((metric: any) => ({
            ...metric,
            timestamp: Date.now(),
            status: getMetricStatus(metric.name, metric.value)
          }))
        }))
        
        setTestResults(updatedResults)
        
        // 统计信息
        const successful = updatedResults.filter(r => r.success).length
        const totalMetricsCount = updatedResults.reduce((sum, r) => sum + r.metrics.length, 0)
        
        setSuccessfulTargets(successful)
        setTotalMetrics(totalMetricsCount)
        
        // 回调所有指标
        if (onMetricsUpdate) {
          const allMetrics = updatedResults.flatMap(r => r.metrics)
          onMetricsUpdate(allMetrics)
        }
      }
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  // 根据指标名称和值判断状态
  const getMetricStatus = (name: string, value: string): 'ok' | 'warning' | 'error' => {
    const numValue = parseFloat(value)
    
    if (isNaN(numValue)) return 'ok'
    
    // CPU使用率检查
    if (name.includes('cpu') && name.includes('usage')) {
      if (numValue > 90) return 'error'
      if (numValue > 80) return 'warning'
      return 'ok'
    }
    
    // 温度检查
    if (name.includes('temperature')) {
      if (numValue > 80) return 'error'
      if (numValue > 70) return 'warning'
      return 'ok'
    }
    
    // 接口状态检查
    if (name.includes('interface') && name.includes('status')) {
      return numValue === 1 ? 'ok' : 'error'
    }
    
    return 'ok'
  }

  // 获取指标图标
  const getMetricIcon = (name: string) => {
    if (name.includes('cpu')) return <TrendingUp className="h-4 w-4" />
    if (name.includes('temperature')) return <Thermometer className="h-4 w-4" />
    if (name.includes('interface')) return <Network className="h-4 w-4" />
    if (name.includes('memory')) return <HardDrive className="h-4 w-4" />
    if (name.includes('power') || name.includes('voltage')) return <Zap className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  // 格式化指标值
  const formatMetricValue = (metric: MonitoringMetric) => {
    const value = metric.value
    const name = metric.name.toLowerCase()
    
    if (name.includes('temperature') && !isNaN(parseFloat(value))) {
      return `${value}°C`
    }
    
    if (name.includes('bytes') && !isNaN(parseFloat(value))) {
      const bytes = parseFloat(value)
      if (bytes > 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      } else if (bytes > 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      } else if (bytes > 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`
      }
      return `${bytes} B`
    }
    
    if (name.includes('percent') && !isNaN(parseFloat(value))) {
      return `${value}%`
    }
    
    if (name.includes('uptime') && !isNaN(parseFloat(value))) {
      const ticks = parseFloat(value)
      const seconds = Math.floor(ticks / 100)
      const days = Math.floor(seconds / (24 * 60 * 60))
      const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
      const minutes = Math.floor((seconds % (60 * 60)) / 60)
      return `${days}d ${hours}h ${minutes}m`
    }
    
    return value
  }

  // 自动刷新
  useEffect(() => {
    if (!isRunning && targets.length > 0) {
      const interval = setInterval(() => {
        runTest()
      }, refreshInterval * 1000)
      
      return () => clearInterval(interval)
    }
  }, [refreshInterval, targets, config, isRunning])

  // 初始测试
  useEffect(() => {
    if (targets.length > 0 && config) {
      runTest()
    }
  }, [targets, config])

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            实时监控测试
          </CardTitle>
          <CardDescription>
            验证配置并实时抓取监控数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                onClick={runTest} 
                disabled={isRunning || targets.length === 0}
                size="sm"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    测试中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    立即测试
                  </>
                )}
              </Button>
              
              <div className="flex items-center gap-2">
                <label className="text-sm">刷新间隔:</label>
                <select 
                  value={refreshInterval} 
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value={10}>10秒</option>
                  <option value={30}>30秒</option>
                  <option value={60}>1分钟</option>
                  <option value={300}>5分钟</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span>{successfulTargets}/{targets.length} 目标在线</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>{totalMetrics} 个指标</span>
              </div>
            </div>
          </div>
          
          {/* 目标状态概览 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testResults.map((result, index) => (
              <Card key={result.host} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{targets[index]?.name || result.host}</span>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "在线" : "离线"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {result.success ? (
                    <>
                      <div>{result.metrics.length} 个指标</div>
                      {result.responseTime && (
                        <div>响应时间: {result.responseTime}ms</div>
                      )}
                    </>
                  ) : (
                    <div className="text-red-500">{result.error}</div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 监控数据详情 */}
      {testResults.length > 0 && (
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList>
            <TabsTrigger value="metrics">监控指标</TabsTrigger>
            <TabsTrigger value="alerts">告警状态</TabsTrigger>
            <TabsTrigger value="raw">原始数据</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            {testResults.map((result) => (
              <Card key={result.host}>
                <CardHeader>
                  <CardTitle className="text-lg">{result.host}</CardTitle>
                  <CardDescription>
                    最后更新: {new Date(result.lastUpdate).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result.success ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>指标</TableHead>
                          <TableHead>值</TableHead>
                          <TableHead>类型</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>说明</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.metrics.map((metric, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getMetricIcon(metric.name)}
                                <span className="font-mono text-sm">{metric.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatMetricValue(metric)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{metric.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  metric.status === 'ok' ? 'default' : 
                                  metric.status === 'warning' ? 'secondary' : 'destructive'
                                }
                              >
                                {metric.status === 'ok' ? '正常' : 
                                 metric.status === 'warning' ? '警告' : '错误'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {metric.help}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {result.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {testResults.map((result) => {
              const alertMetrics = result.metrics.filter(m => m.status !== 'ok')
              return (
                <Card key={result.host}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {result.host}
                      <Badge variant={alertMetrics.length > 0 ? "destructive" : "default"}>
                        {alertMetrics.length} 个告警
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {alertMetrics.length > 0 ? (
                      <div className="space-y-2">
                        {alertMetrics.map((metric, idx) => (
                          <Alert key={idx} variant={metric.status === 'error' ? 'destructive' : 'default'}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>{metric.name}</strong>: {formatMetricValue(metric)}
                              {metric.help && ` - ${metric.help}`}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>所有指标正常</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          <TabsContent value="raw" className="space-y-4">
            {testResults.map((result) => (
              <Card key={result.host}>
                <CardHeader>
                  <CardTitle className="text-lg">{result.host} - 原始数据</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}