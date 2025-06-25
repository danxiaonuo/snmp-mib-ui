// 增强的前端交互组件集合
"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Download, Upload, Settings, 
  Info, Clock, Shield, Play, Square, RotateCcw, Terminal, Zap, Package, 
  ArrowUp, ArrowDown, FileText, Database, Copy, Eye, Edit, Save, Undo, 
  GitBranch, History, Network, Cpu, MemoryStick, HardDrive, Activity,
  TrendingUp, TrendingDown, Minus, BarChart3, LineChart, PieChart,
  Server, Monitor, Wifi, Globe, Lock, Users, Calendar, Filter,
  Search, Plus, Trash2, ExternalLink, Code, BookOpen, HelpCircle
} from "lucide-react"

// 主仪表板组件
export function EnhancedDashboard() {
  const [systemStatus, setSystemStatus] = useState({
    totalDevices: 156,
    onlineDevices: 142,
    alerts: 8,
    performance: 'good'
  })

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, type: 'deployment', message: '成功部署配置到 12 台设备', time: '2分钟前', status: 'success' },
    { id: 2, type: 'alert', message: 'CPU使用率告警 - cisco-sw-01', time: '5分钟前', status: 'warning' },
    { id: 3, type: 'discovery', message: '发现 3 台新设备', time: '10分钟前', status: 'info' },
    { id: 4, type: 'compliance', message: '安全扫描完成 - 发现 2 个问题', time: '15分钟前', status: 'warning' }
  ])

  return (
    <div className="p-6 space-y-6">
      {/* 系统状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">设备总数</p>
                <p className="text-2xl font-bold">{systemStatus.totalDevices}</p>
              </div>
              <Server className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">在线设备</p>
                <p className="text-2xl font-bold text-green-600">{systemStatus.onlineDevices}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">活跃告警</p>
                <p className="text-2xl font-bold text-orange-600">{systemStatus.alerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">系统健康</p>
                <p className="text-2xl font-bold text-green-600">良好</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作和最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              快速操作
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-20 flex-col gap-2">
                <Plus className="h-6 w-6" />
                添加设备
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Download className="h-6 w-6" />
                批量部署
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Shield className="h-6 w-6" />
                安全扫描
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <BarChart3 className="h-6 w-6" />
                性能测试
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              最近活动
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 设备管理组件
export function DeviceManagement() {
  const [devices, setDevices] = useState([
    { id: 1, name: 'cisco-sw-01', ip: '192.168.1.1', vendor: 'cisco', status: 'online', lastSeen: '1分钟前' },
    { id: 2, name: 'h3c-sw-02', ip: '192.168.1.2', vendor: 'h3c', status: 'online', lastSeen: '2分钟前' },
    { id: 3, name: 'huawei-sw-03', ip: '192.168.1.3', vendor: 'huawei', status: 'offline', lastSeen: '1小时前' }
  ])

  const [selectedDevices, setSelectedDevices] = useState<number[]>([])
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [showBatchDeploy, setShowBatchDeploy] = useState(false)

  return (
    <div className="space-y-6">
      {/* 设备管理头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">设备管理</h2>
          <p className="text-muted-foreground">管理和监控SNMP设备</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加设备
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>添加SNMP设备</DialogTitle>
              </DialogHeader>
              <AddDeviceForm onSuccess={() => setShowAddDevice(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 设备筛选和搜索 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索设备名称或IP..." className="pl-10" />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="厂商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有厂商</SelectItem>
                <SelectItem value="cisco">Cisco</SelectItem>
                <SelectItem value="h3c">H3C</SelectItem>
                <SelectItem value="huawei">华为</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="online">在线</SelectItem>
                <SelectItem value="offline">离线</SelectItem>
                <SelectItem value="error">错误</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作 */}
      {selectedDevices.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedDevices.length} 台设备已选择</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  批量配置
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowBatchDeploy(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  批量部署
                </Button>
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  安全扫描
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 设备列表 */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded" />
                </TableHead>
                <TableHead>设备名称</TableHead>
                <TableHead>IP地址</TableHead>
                <TableHead>厂商</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后在线</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={selectedDevices.includes(device.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDevices([...selectedDevices, device.id])
                        } else {
                          setSelectedDevices(selectedDevices.filter(id => id !== device.id))
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>{device.ip}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {device.vendor}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="capitalize">{device.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{device.lastSeen}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 批量部署弹窗 */}
      <Dialog open={showBatchDeploy} onOpenChange={setShowBatchDeploy}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>批量配置部署</DialogTitle>
          </DialogHeader>
          <BatchDeploymentDialog 
            selectedDevices={selectedDevices}
            onClose={() => setShowBatchDeploy(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 添加设备表单
function AddDeviceForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    vendor: '',
    snmpVersion: '2c',
    community: 'public',
    port: '161'
  })

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const handleTest = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/snmp/real-test/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: formData.ip,
          community: formData.community,
          version: formData.snmpVersion,
          port: parseInt(formData.port)
        })
      })
      
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, error: '连接测试失败' })
    }
    setTesting(false)
  }

  const handleSubmit = async () => {
    // 添加设备逻辑
    onSuccess()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="device-name">设备名称</Label>
          <Input
            id="device-name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="例如: cisco-sw-01"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="device-ip">IP地址</Label>
          <Input
            id="device-ip"
            value={formData.ip}
            onChange={(e) => setFormData({...formData, ip: e.target.value})}
            placeholder="192.168.1.1"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="device-vendor">设备厂商</Label>
          <Select value={formData.vendor} onValueChange={(value) => setFormData({...formData, vendor: value})}>
            <SelectTrigger>
              <SelectValue placeholder="选择厂商" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cisco">Cisco</SelectItem>
              <SelectItem value="h3c">H3C</SelectItem>
              <SelectItem value="huawei">华为</SelectItem>
              <SelectItem value="juniper">Juniper</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="snmp-version">SNMP版本</Label>
          <Select value={formData.snmpVersion} onValueChange={(value) => setFormData({...formData, snmpVersion: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">v1</SelectItem>
              <SelectItem value="2c">v2c</SelectItem>
              <SelectItem value="3">v3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="community">Community</Label>
          <Input
            id="community"
            value={formData.community}
            onChange={(e) => setFormData({...formData, community: e.target.value})}
            placeholder="public"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="snmp-port">SNMP端口</Label>
          <Input
            id="snmp-port"
            value={formData.port}
            onChange={(e) => setFormData({...formData, port: e.target.value})}
            placeholder="161"
          />
        </div>
      </div>

      {/* 连接测试 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !formData.ip}
          >
            {testing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            连接测试
          </Button>
        </div>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            <AlertDescription>
              {testResult.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>连接测试成功</span>
                  </div>
                  {testResult.systemInfo && (
                    <div className="text-sm">
                      <p>系统描述: {testResult.systemInfo.sysDescr}</p>
                      <p>系统名称: {testResult.systemInfo.sysName}</p>
                      <p>响应时间: {testResult.responseTime}ms</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>连接测试失败: {testResult.error}</span>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onSuccess}>
          取消
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!formData.name || !formData.ip || !testResult?.success}
        >
          添加设备
        </Button>
      </div>
    </div>
  )
}

// 批量部署对话框
function BatchDeploymentDialog({ selectedDevices, onClose }: { selectedDevices: number[], onClose: () => void }) {
  const [deploymentConfig, setDeploymentConfig] = useState({
    configType: 'snmp_exporter',
    configTemplate: '',
    deploymentMode: 'parallel',
    batchSize: 5,
    autoRollback: true
  })

  const [deploying, setDeploying] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null)

  const handleDeploy = async () => {
    setDeploying(true)
    
    try {
      const response = await fetch('/api/deployment/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceIds: selectedDevices,
          config: deploymentConfig
        })
      })
      
      const result = await response.json()
      setDeploymentStatus(result)
    } catch (error) {
      setDeploymentStatus({ success: false, error: '部署失败' })
    }
    
    setDeploying(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>配置类型</Label>
          <Select 
            value={deploymentConfig.configType} 
            onValueChange={(value) => setDeploymentConfig({...deploymentConfig, configType: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="snmp_exporter">SNMP Exporter</SelectItem>
              <SelectItem value="categraf">Categraf</SelectItem>
              <SelectItem value="prometheus">Prometheus Rules</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>部署模式</Label>
          <Select 
            value={deploymentConfig.deploymentMode} 
            onValueChange={(value) => setDeploymentConfig({...deploymentConfig, deploymentMode: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parallel">并行部署</SelectItem>
              <SelectItem value="sequential">顺序部署</SelectItem>
              <SelectItem value="rolling">滚动部署</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>配置模板</Label>
        <Textarea
          placeholder="输入配置内容或选择模板..."
          className="h-32"
          value={deploymentConfig.configTemplate}
          onChange={(e) => setDeploymentConfig({...deploymentConfig, configTemplate: e.target.value})}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="auto-rollback"
          checked={deploymentConfig.autoRollback}
          onCheckedChange={(checked) => setDeploymentConfig({...deploymentConfig, autoRollback: checked})}
        />
        <Label htmlFor="auto-rollback">失败时自动回滚</Label>
      </div>

      {deploymentStatus && (
        <Alert variant={deploymentStatus.success ? "default" : "destructive"}>
          <AlertDescription>
            {deploymentStatus.success ? "部署成功完成" : `部署失败: ${deploymentStatus.error}`}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button 
          onClick={handleDeploy}
          disabled={deploying || !deploymentConfig.configTemplate}
        >
          {deploying ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              部署中...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              开始部署
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// 实时监控组件
export function RealTimeMonitoring() {
  const [monitoringData, setMonitoringData] = useState<any>(null)
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [monitoringActive, setMonitoringActive] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (monitoringActive) {
      // 建立WebSocket连接
      wsRef.current = new WebSocket('ws://localhost:8080')
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'metrics_update') {
          setMonitoringData(data)
        }
      }
      
      wsRef.current.onopen = () => {
        // 订阅设备监控
        selectedDevices.forEach(deviceId => {
          wsRef.current?.send(JSON.stringify({
            type: 'subscribe_device',
            deviceId
          }))
        })
      }
    } else {
      wsRef.current?.close()
    }

    return () => {
      wsRef.current?.close()
    }
  }, [monitoringActive, selectedDevices])

  return (
    <div className="space-y-6">
      {/* 监控控制 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            实时监控
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="monitoring-active"
                  checked={monitoringActive}
                  onCheckedChange={setMonitoringActive}
                />
                <Label htmlFor="monitoring-active">启用实时监控</Label>
              </div>
              
              <Badge variant={monitoringActive ? "default" : "secondary"}>
                {monitoringActive ? "监控中" : "已停止"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                配置
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                导出数据
              </Button>
            </div>
          </div>

          {/* 设备选择 */}
          <div className="space-y-2">
            <Label>监控设备</Label>
            <div className="flex flex-wrap gap-2">
              {['cisco-sw-01', 'h3c-sw-02', 'huawei-sw-03'].map(device => (
                <Badge 
                  key={device}
                  variant={selectedDevices.includes(device) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    if (selectedDevices.includes(device)) {
                      setSelectedDevices(selectedDevices.filter(d => d !== device))
                    } else {
                      setSelectedDevices([...selectedDevices, device])
                    }
                  }}
                >
                  {device}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 监控指标显示 */}
      {monitoringActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                CPU使用率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedDevices.map(device => (
                  <div key={device} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{device}</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MemoryStick className="h-5 w-5" />
                内存使用率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedDevices.map(device => (
                  <div key={device} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{device}</span>
                      <span className="font-medium">62%</span>
                    </div>
                    <Progress value={62} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-5 w-5" />
                网络流量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedDevices.map(device => (
                  <div key={device} className="text-sm">
                    <div className="flex justify-between">
                      <span>{device}</span>
                      <span className="font-medium">1.2 Gbps</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// 性能分析组件
export function PerformanceAnalysis() {
  const [benchmarkResults, setBenchmarkResults] = useState([
    { id: 1, name: 'SNMP性能测试', score: 85, grade: 'B', status: 'completed', duration: '5分钟' },
    { id: 2, name: '网络延迟测试', score: 92, grade: 'A', status: 'completed', duration: '3分钟' },
    { id: 3, name: 'Prometheus查询', score: 76, grade: 'C', status: 'running', duration: '进行中' }
  ])

  const [selectedBenchmark, setSelectedBenchmark] = useState<any>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">性能分析</h2>
          <p className="text-muted-foreground">监控系统性能基准测试和优化建议</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            生成报告
          </Button>
          <Button size="sm">
            <Play className="h-4 w-4 mr-2" />
            运行测试
          </Button>
        </div>
      </div>

      {/* 性能概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">平均延迟</p>
                <p className="text-2xl font-bold">45ms</p>
                <p className="text-xs text-green-600">↓ 12% 较上次</p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">吞吐量</p>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-xs text-green-600">↑ 8% 较上次</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">错误率</p>
                <p className="text-2xl font-bold">0.12%</p>
                <p className="text-xs text-muted-foreground">→ 无变化</p>
              </div>
              <Minus className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 基准测试结果 */}
      <Card>
        <CardHeader>
          <CardTitle>基准测试结果</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>测试名称</TableHead>
                <TableHead>分数</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>用时</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benchmarkResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{result.score}</span>
                      <Progress value={result.score} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      result.grade === 'A' ? 'default' :
                      result.grade === 'B' ? 'secondary' :
                      'outline'
                    }>
                      {result.grade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {result.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : result.status === 'running' ? (
                        <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="capitalize">{result.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>{result.duration}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedBenchmark(result)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 优化建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            优化建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">启用SNMP批量请求</p>
                  <p className="text-sm text-muted-foreground">
                    使用SNMP getBulk操作可以减少网络往返次数，预计可改善延迟200ms，提高吞吐量30%
                  </p>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    立即应用
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">优化监控间隔</p>
                  <p className="text-sm text-muted-foreground">
                    根据监控需求调整采集间隔，可以减少20%的资源使用率
                  </p>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    查看详情
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 安全合规组件
export function SecurityCompliance() {
  const [scanResults, setScanResults] = useState({
    score: 78,
    grade: 'B',
    totalRules: 45,
    passed: 35,
    failed: 7,
    warnings: 3
  })

  const [complianceIssues, setComplianceIssues] = useState([
    { id: 1, severity: 'critical', rule: '硬编码凭据检查', status: 'failed', description: '发现硬编码的SNMP密码' },
    { id: 2, severity: 'warning', rule: 'SNMP版本检查', status: 'warning', description: '使用了SNMPv2c，建议升级到v3' },
    { id: 3, severity: 'info', rule: '文件权限检查', status: 'warning', description: '配置文件权限过于宽松' }
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">安全合规</h2>
          <p className="text-muted-foreground">配置安全扫描和合规性检查</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出报告
          </Button>
          <Button size="sm">
            <Shield className="h-4 w-4 mr-2" />
            开始扫描
          </Button>
        </div>
      </div>

      {/* 合规性概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{scanResults.score}</div>
              <div className="text-sm text-muted-foreground">合规分数</div>
              <Badge variant="secondary" className="mt-2">等级 {scanResults.grade}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{scanResults.passed}</div>
              <div className="text-sm text-muted-foreground">通过检查</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{scanResults.failed}</div>
              <div className="text-sm text-muted-foreground">失败检查</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{scanResults.warnings}</div>
              <div className="text-sm text-muted-foreground">警告项目</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 安全问题列表 */}
      <Card>
        <CardHeader>
          <CardTitle>安全问题</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceIssues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {issue.severity === 'critical' ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : issue.severity === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{issue.rule}</h4>
                    <Badge variant={
                      issue.severity === 'critical' ? 'destructive' :
                      issue.severity === 'warning' ? 'outline' :
                      'secondary'
                    }>
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      修复
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4 mr-2" />
                      详情
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}