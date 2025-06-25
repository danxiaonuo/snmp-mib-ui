"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Settings, Eye, Play, Pause, Wifi, WifiOff, Router, Server, Monitor, Smartphone, Laptop, HardDrive, Network, MapPin, Building, Tag, Filter, Download, Upload, Zap, Activity, TrendingUp, TrendingDown, Plus, Minus } from "lucide-react"
import { toast } from "sonner"

// 发现的设备数据
const mockDiscoveredDevices = [
  {
    id: "1",
    ip: "192.168.1.1",
    hostname: "core-sw-01",
    type: "switch",
    vendor: "华为",
    model: "S5720-28P-LI-AC",
    location: "机房A-01",
    status: "online",
    lastSeen: "2024-01-15T14:30:00Z",
    firstSeen: "2024-01-10T09:15:00Z",
    metrics: {
      cpu: 45,
      memory: 62,
      temperature: 38,
      ports: { total: 28, up: 24, down: 4 }
    },
    tags: ["核心", "生产", "关键"],
    hasRules: true,
    rulesCount: 8,
    isNew: false
  },
  {
    id: "2",
    ip: "192.168.1.10",
    hostname: "access-sw-10",
    type: "switch",
    vendor: "思科",
    model: "Catalyst 2960-X",
    location: "机房A-10",
    status: "online",
    lastSeen: "2024-01-15T14:28:00Z",
    firstSeen: "2024-01-15T10:20:00Z",
    metrics: {
      cpu: 23,
      memory: 41,
      temperature: 35,
      ports: { total: 24, up: 18, down: 6 }
    },
    tags: ["接入", "新设备"],
    hasRules: false,
    rulesCount: 0,
    isNew: true
  },
  {
    id: "3",
    ip: "192.168.2.5",
    hostname: "server-01",
    type: "server",
    vendor: "戴尔",
    model: "PowerEdge R740",
    location: "机房B-05",
    status: "online",
    lastSeen: "2024-01-15T14:32:00Z",
    firstSeen: "2024-01-12T14:00:00Z",
    metrics: {
      cpu: 78,
      memory: 85,
      temperature: 42,
      disk: { total: "2TB", used: "1.2TB", usage: 60 }
    },
    tags: ["服务器", "数据库", "生产"],
    hasRules: true,
    rulesCount: 12,
    isNew: false
  },
  {
    id: "4",
    ip: "192.168.1.20",
    hostname: "unknown-device",
    type: "unknown",
    vendor: "未知",
    model: "未知",
    location: "未分配",
    status: "offline",
    lastSeen: "2024-01-15T12:15:00Z",
    firstSeen: "2024-01-15T12:10:00Z",
    metrics: {},
    tags: ["未识别"],
    hasRules: false,
    rulesCount: 0,
    isNew: true
  }
]

// 发现规则数据
const mockDiscoveryRules = [
  {
    id: "1",
    name: "VictoriaMetrics扫描",
    type: "victoriametrics",
    enabled: true,
    interval: 300, // 5分钟
    query: 'up{job=~".*switch.*|.*router.*"}',
    description: "从VM中扫描网络设备",
    lastRun: "2024-01-15T14:30:00Z",
    devicesFound: 15,
    status: "success"
  },
  {
    id: "2",
    name: "SNMP扫描",
    type: "snmp",
    enabled: true,
    interval: 600, // 10分钟
    ipRanges: ["192.168.1.0/24", "192.168.2.0/24"],
    description: "SNMP主动扫描网段",
    lastRun: "2024-01-15T14:25:00Z",
    devicesFound: 8,
    status: "success"
  },
  {
    id: "3",
    name: "Ping扫描",
    type: "ping",
    enabled: false,
    interval: 1800, // 30分钟
    ipRanges: ["10.0.0.0/16"],
    description: "Ping扫描大网段",
    lastRun: "2024-01-15T13:00:00Z",
    devicesFound: 0,
    status: "disabled"
  }
]

// 推荐规则数据
const mockRuleRecommendations = [
  {
    deviceId: "2",
    deviceName: "access-sw-10",
    deviceType: "switch",
    vendor: "思科",
    recommendations: [
      {
        templateId: "cisco-basic",
        templateName: "思科交换机基础监控",
        rules: ["CPU使用率", "内存使用率", "端口状态", "温度监控"],
        priority: "high",
        reason: "新发现的思科交换机，建议配置基础监控规则"
      },
      {
        templateId: "network-performance",
        templateName: "网络性能监控",
        rules: ["接口流量", "错误包率", "丢包率"],
        priority: "medium",
        reason: "接入层交换机，建议监控网络性能指标"
      }
    ]
  },
  {
    deviceId: "4",
    deviceName: "unknown-device",
    deviceType: "unknown",
    vendor: "未知",
    recommendations: [
      {
        templateId: "basic-connectivity",
        templateName: "基础连通性监控",
        rules: ["设备在线状态", "响应时间"],
        priority: "low",
        reason: "未识别设备，建议先配置基础连通性监控"
      }
    ]
  }
]

const DEVICE_TYPES = [
  { value: "switch", label: "交换机", icon: Router, color: "bg-blue-500" },
  { value: "router", label: "路由器", icon: Network, color: "bg-green-500" },
  { value: "server", label: "服务器", icon: Server, color: "bg-purple-500" },
  { value: "firewall", label: "防火墙", icon: Shield, color: "bg-red-500" },
  { value: "unknown", label: "未知", icon: HelpCircle, color: "bg-gray-500" }
]

const STATUS_COLORS = {
  online: "bg-green-500",
  offline: "bg-red-500",
  warning: "bg-orange-500",
  unknown: "bg-gray-500"
}

interface DeviceDiscoveryProps {
  onDeviceSelect?: (device: any) => void
  onRuleApply?: (deviceId: string, templateId: string) => void
}

export function DeviceDiscovery({ onDeviceSelect, onRuleApply }: DeviceDiscoveryProps) {
  const [devices, setDevices] = useState(mockDiscoveredDevices)
  const [discoveryRules, setDiscoveryRules] = useState(mockDiscoveryRules)
  const [recommendations, setRecommendations] = useState(mockRuleRecommendations)
  const [activeTab, setActiveTab] = useState("devices")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterHasRules, setFilterHasRules] = useState("all")
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [showDeviceDetails, setShowDeviceDetails] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<any>(null)
  const [showRuleEditor, setShowRuleEditor] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)
  const [autoDiscoveryEnabled, setAutoDiscoveryEnabled] = useState(true)

  // 过滤设备
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.ip.includes(searchTerm) ||
                         device.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || device.type === filterType
    const matchesStatus = filterStatus === "all" || device.status === filterStatus
    const matchesRules = filterHasRules === "all" || 
                        (filterHasRules === "with" && device.hasRules) ||
                        (filterHasRules === "without" && !device.hasRules)
    
    return matchesSearch && matchesType && matchesStatus && matchesRules
  })

  // 手动扫描
  const startManualScan = async () => {
    setIsScanning(true)
    setScanProgress(0)
    
    try {
      // 模拟扫描过程
      for (let i = 0; i <= 100; i += 10) {
        setScanProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // 模拟发现新设备
      const newDevice = {
        id: Date.now().toString(),
        ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        hostname: `new-device-${Math.floor(Math.random() * 100)}`,
        type: "switch",
        vendor: "华为",
        model: "S5720-28P-LI-AC",
        location: "未分配",
        status: "online",
        lastSeen: new Date().toISOString(),
        firstSeen: new Date().toISOString(),
        metrics: {
          cpu: Math.floor(Math.random() * 100),
          memory: Math.floor(Math.random() * 100),
          temperature: Math.floor(Math.random() * 20) + 30,
          ports: { total: 28, up: Math.floor(Math.random() * 28), down: Math.floor(Math.random() * 5) }
        },
        tags: ["新设备"],
        hasRules: false,
        rulesCount: 0,
        isNew: true
      }
      
      setDevices(prev => [newDevice, ...prev])
      toast.success(`扫描完成，发现 1 个新设备`)
      
    } catch (error) {
      toast.error("扫描失败")
    } finally {
      setIsScanning(false)
      setScanProgress(0)
    }
  }

  // 应用推荐规则
  const applyRecommendedRule = async (deviceId: string, templateId: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "正在应用告警规则...",
        success: "告警规则应用成功",
        error: "规则应用失败"
      }
    )
    
    // 更新设备状态
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, hasRules: true, rulesCount: device.rulesCount + 4 }
        : device
    ))
    
    // 移除推荐
    setRecommendations(prev => prev.filter(rec => rec.deviceId !== deviceId))
    
    onRuleApply?.(deviceId, templateId)
  }

  // 批量应用规则
  const batchApplyRules = async () => {
    if (selectedDevices.length === 0) {
      toast.error("请选择要应用规则的设备")
      return
    }
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: `正在为 ${selectedDevices.length} 个设备应用规则...`,
        success: `已为 ${selectedDevices.length} 个设备应用规则`,
        error: "批量应用规则失败"
      }
    )
    
    // 更新设备状态
    setDevices(prev => prev.map(device => 
      selectedDevices.includes(device.id)
        ? { ...device, hasRules: true, rulesCount: device.rulesCount + 3 }
        : device
    ))
    
    setSelectedDevices([])
  }

  // 设备详情
  const showDeviceDetailsDialog = (device: any) => {
    setSelectedDevice(device)
    setShowDeviceDetails(true)
    onDeviceSelect?.(device)
  }

  // 获取设备类型信息
  const getDeviceTypeInfo = (type: string) => {
    return DEVICE_TYPES.find(t => t.value === type) || DEVICE_TYPES[DEVICE_TYPES.length - 1]
  }

  // 统计信息
  const stats = {
    total: devices.length,
    online: devices.filter(d => d.status === "online").length,
    offline: devices.filter(d => d.status === "offline").length,
    withRules: devices.filter(d => d.hasRules).length,
    newDevices: devices.filter(d => d.isNew).length
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">设备自动发现</h2>
          <p className="text-muted-foreground">自动发现网络设备并推荐告警规则</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={autoDiscoveryEnabled}
              onCheckedChange={setAutoDiscoveryEnabled}
            />
            <Label>自动发现</Label>
          </div>
          <Button 
            variant="outline" 
            onClick={startManualScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            手动扫描
          </Button>
        </div>
      </div>

      {/* 扫描进度 */}
      {isScanning && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>正在扫描网络设备...</span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="w-full" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">总设备数</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.online}</div>
              <div className="text-sm text-muted-foreground">在线设备</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.offline}</div>
              <div className="text-sm text-muted-foreground">离线设备</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.withRules}</div>
              <div className="text-sm text-muted-foreground">已配置规则</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.newDevices}</div>
              <div className="text-sm text-muted-foreground">新发现设备</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="devices">发现设备</TabsTrigger>
          <TabsTrigger value="recommendations">规则推荐</TabsTrigger>
          <TabsTrigger value="discovery-rules">发现规则</TabsTrigger>
          <TabsTrigger value="coverage">监控覆盖率</TabsTrigger>
        </TabsList>

        {/* 发现设备 */}
        <TabsContent value="devices" className="space-y-4">
          {/* 搜索和过滤 */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="搜索设备名称、IP或厂商..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                {DEVICE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="online">在线</SelectItem>
                <SelectItem value="offline">离线</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterHasRules} onValueChange={setFilterHasRules}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有设备</SelectItem>
                <SelectItem value="with">已配置规则</SelectItem>
                <SelectItem value="without">未配置规则</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 设备列表 */}
          <div className="space-y-4">
            {filteredDevices.map((device) => {
              const typeInfo = getDeviceTypeInfo(device.type)
              const Icon = typeInfo.icon
              const statusColor = STATUS_COLORS[device.status as keyof typeof STATUS_COLORS]
              
              return (
                <Card key={device.id} className={device.isNew ? "border-orange-200 bg-orange-50" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedDevices.includes(device.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDevices([...selectedDevices, device.id])
                            } else {
                              setSelectedDevices(selectedDevices.filter(id => id !== device.id))
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <Icon className="h-5 w-5" />
                          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                        </div>
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{device.hostname}</span>
                            {device.isNew && <Badge variant="secondary">新设备</Badge>}
                            <Badge variant="outline">{typeInfo.label}</Badge>
                            {device.hasRules ? (
                              <Badge variant="secondary">{device.rulesCount} 规则</Badge>
                            ) : (
                              <Badge variant="outline">无规则</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {device.ip} | {device.vendor} {device.model} | {device.location}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => showDeviceDetailsDialog(device)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {!device.hasRules && (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              // 快速应用基础规则
                              applyRecommendedRule(device.id, "basic")
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            配置规则
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* 标签 */}
                      <div className="flex flex-wrap gap-1">
                        {device.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                      
                      {/* 指标 */}
                      {device.metrics && Object.keys(device.metrics).length > 0 && (
                        <div className="grid gap-4 md:grid-cols-4">
                          {device.metrics.cpu !== undefined && (
                            <div className="text-center">
                              <div className={`text-lg font-bold ${
                                device.metrics.cpu > 80 ? 'text-red-600' : 
                                device.metrics.cpu > 60 ? 'text-orange-600' : 'text-green-600'
                              }`}>{device.metrics.cpu}%</div>
                              <div className="text-sm text-muted-foreground">CPU</div>
                            </div>
                          )}
                          {device.metrics.memory !== undefined && (
                            <div className="text-center">
                              <div className={`text-lg font-bold ${
                                device.metrics.memory > 85 ? 'text-red-600' : 
                                device.metrics.memory > 70 ? 'text-orange-600' : 'text-green-600'
                              }`}>{device.metrics.memory}%</div>
                              <div className="text-sm text-muted-foreground">内存</div>
                            </div>
                          )}
                          {device.metrics.temperature !== undefined && (
                            <div className="text-center">
                              <div className={`text-lg font-bold ${
                                device.metrics.temperature > 50 ? 'text-red-600' : 
                                device.metrics.temperature > 40 ? 'text-orange-600' : 'text-green-600'
                              }`}>{device.metrics.temperature}°C</div>
                              <div className="text-sm text-muted-foreground">温度</div>
                            </div>
                          )}
                          {device.metrics.ports && (
                            <div className="text-center">
                              <div className="text-lg font-bold">
                                <span className="text-green-600">{device.metrics.ports.up}</span>
                                <span className="text-muted-foreground">/</span>
                                <span>{device.metrics.ports.total}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">端口</div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        最后发现: {new Date(device.lastSeen).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 批量操作 */}
          {selectedDevices.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedDevices.length} 个设备
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Button 
                size="sm" 
                onClick={batchApplyRules}
              >
                <Plus className="mr-1 h-3 w-3" />
                批量配置规则
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // 批量添加标签
                  toast.success("批量标签功能开发中")
                }}
              >
                <Tag className="mr-1 h-3 w-3" />
                批量标签
              </Button>
            </div>
          )}
        </TabsContent>

        {/* 规则推荐 */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">智能规则推荐</h3>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新推荐
            </Button>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => {
              const device = devices.find(d => d.id === rec.deviceId)
              if (!device) return null
              
              const typeInfo = getDeviceTypeInfo(device.type)
              const Icon = typeInfo.icon
              
              return (
                <Card key={rec.deviceId}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <CardTitle>{rec.deviceName}</CardTitle>
                        <CardDescription>
                          {device.ip} | {rec.vendor} | {device.location}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rec.recommendations.map((recommendation, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{recommendation.templateName}</h4>
                              <Badge 
                                variant={recommendation.priority === 'high' ? 'destructive' : 
                                        recommendation.priority === 'medium' ? 'default' : 'secondary'}
                              >
                                {recommendation.priority === 'high' ? '高优先级' : 
                                 recommendation.priority === 'medium' ? '中优先级' : '低优先级'}
                              </Badge>
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => applyRecommendedRule(rec.deviceId, recommendation.templateId)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              应用规则
                            </Button>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {recommendation.reason}
                          </p>
                          
                          <div className="flex flex-wrap gap-1">
                            {recommendation.rules.map(rule => (
                              <Badge key={rule} variant="outline" className="text-xs">{rule}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {recommendations.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">所有设备都已配置规则</h3>
              <p className="text-muted-foreground">当前没有需要配置规则的设备</p>
            </div>
          )}
        </TabsContent>

        {/* 发现规则 */}
        <TabsContent value="discovery-rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">设备发现规则</h3>
            <Button onClick={() => {
              setEditingRule(null)
              setShowRuleEditor(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              添加规则
            </Button>
          </div>

          <div className="space-y-4">
            {discoveryRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{rule.name}</span>
                        <Badge variant="outline">{rule.type}</Badge>
                        {rule.enabled ? (
                          <Badge variant="secondary">启用</Badge>
                        ) : (
                          <Badge variant="outline">禁用</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingRule(rule)
                          setShowRuleEditor(true)
                        }}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Switch 
                        checked={rule.enabled}
                        onCheckedChange={(checked) => {
                          setDiscoveryRules(prev => prev.map(r => 
                            r.id === rule.id ? { ...r, enabled: checked } : r
                          ))
                        }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{Math.floor(rule.interval / 60)}分钟</div>
                      <div className="text-sm text-muted-foreground">扫描间隔</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{rule.devicesFound}</div>
                      <div className="text-sm text-muted-foreground">发现设备</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {rule.status === 'success' && <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />}
                        {rule.status === 'error' && <XCircle className="inline h-4 w-4 text-red-500 mr-1" />}
                        {rule.status === 'disabled' && <Pause className="inline h-4 w-4 text-gray-500 mr-1" />}
                        {rule.status === 'success' ? '正常' : 
                         rule.status === 'error' ? '错误' : '已禁用'}
                      </div>
                      <div className="text-sm text-muted-foreground">运行状态</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {rule.lastRun ? new Date(rule.lastRun).toLocaleString() : '从未运行'}
                      </div>
                      <div className="text-sm text-muted-foreground">最后运行</div>
                    </div>
                  </div>
                  
                  {rule.type === 'victoriametrics' && rule.query && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium">查询语句</Label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                        {rule.query}
                      </div>
                    </div>
                  )}
                  
                  {rule.type === 'snmp' && rule.ipRanges && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium">扫描网段</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rule.ipRanges.map(range => (
                          <Badge key={range} variant="outline">{range}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 监控覆盖率 */}
        <TabsContent value="coverage" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">监控覆盖率报告</h3>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              导出报告
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>总体覆盖率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>设备监控覆盖率</span>
                    <span className="font-bold">{Math.round((stats.withRules / stats.total) * 100)}%</span>
                  </div>
                  <Progress value={(stats.withRules / stats.total) * 100} />
                  
                  <div className="text-sm text-muted-foreground">
                    {stats.withRules} / {stats.total} 设备已配置监控规则
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>设备类型分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {DEVICE_TYPES.slice(0, -1).map(type => {
                    const count = devices.filter(d => d.type === type.value).length
                    const withRules = devices.filter(d => d.type === type.value && d.hasRules).length
                    const percentage = count > 0 ? Math.round((withRules / count) * 100) : 0
                    
                    return (
                      <div key={type.value} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <type.icon className="h-4 w-4" />
                          <span>{type.label}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{percentage}%</span>
                          <div className="w-16">
                            <Progress value={percentage} className="h-2" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>未配置规则的设备</CardTitle>
              <CardDescription>以下设备尚未配置告警规则，建议及时配置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {devices.filter(d => !d.hasRules).map(device => {
                  const typeInfo = getDeviceTypeInfo(device.type)
                  const Icon = typeInfo.icon
                  
                  return (
                    <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{device.hostname}</span>
                        <span className="text-sm text-muted-foreground">{device.ip}</span>
                        <Badge variant="outline">{typeInfo.label}</Badge>
                        {device.isNew && <Badge variant="secondary">新设备</Badge>}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => applyRecommendedRule(device.id, "basic")}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        配置规则
                      </Button>
                    </div>
                  )
                })}
              </div>
              
              {devices.filter(d => !d.hasRules).length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p className="text-muted-foreground">所有设备都已配置告警规则</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 设备详情对话框 */}
      <Dialog open={showDeviceDetails} onOpenChange={setShowDeviceDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>设备详情</DialogTitle>
            <DialogDescription>
              查看设备的详细信息和监控指标
            </DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">基本信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">设备名称:</span>
                      <span>{selectedDevice.hostname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP地址:</span>
                      <span>{selectedDevice.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">设备类型:</span>
                      <span>{getDeviceTypeInfo(selectedDevice.type).label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">厂商:</span>
                      <span>{selectedDevice.vendor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">型号:</span>
                      <span>{selectedDevice.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">位置:</span>
                      <span>{selectedDevice.location}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">监控状态</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">在线状态:</span>
                      <Badge variant={selectedDevice.status === 'online' ? 'secondary' : 'destructive'}>
                        {selectedDevice.status === 'online' ? '在线' : '离线'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">告警规则:</span>
                      <span>{selectedDevice.rulesCount} 条</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">首次发现:</span>
                      <span>{new Date(selectedDevice.firstSeen).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">最后发现:</span>
                      <span>{new Date(selectedDevice.lastSeen).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 标签 */}
              <div>
                <h4 className="font-medium mb-2">设备标签</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedDevice.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
              
              {/* 监控指标 */}
              {selectedDevice.metrics && Object.keys(selectedDevice.metrics).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">当前指标</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(selectedDevice.metrics).map(([key, value]) => {
                      if (typeof value === 'object' && value !== null) {
                        return (
                          <div key={key} className="border rounded p-3">
                            <h5 className="font-medium capitalize mb-2">{key}</h5>
                            <div className="space-y-1 text-sm">
                              {Object.entries(value as any).map(([subKey, subValue]) => (
                                <div key={subKey} className="flex justify-between">
                                  <span className="text-muted-foreground">{subKey}:</span>
                                  <span>{subValue}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      } else {
                        return (
                          <div key={key} className="border rounded p-3 text-center">
                            <div className="text-2xl font-bold">{value}{key === 'temperature' ? '°C' : key.includes('cpu') || key.includes('memory') ? '%' : ''}</div>
                            <div className="text-sm text-muted-foreground capitalize">{key}</div>
                          </div>
                        )
                      }
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}