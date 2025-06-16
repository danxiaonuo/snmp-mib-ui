"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Plus, Search, Filter, Download, Upload, Settings, Play, Pause, Copy, Edit, Trash2, Eye, Code, Save, RefreshCw, Bell, Target, Users, Tag, Layers, GitBranch, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle, Activity, Zap, Shield, BarChart3, PieChart, LineChart } from "lucide-react"
import { toast } from "sonner"

// 模拟数据
const mockAlertRules = [
  {
    id: "1",
    name: "Switch CPU Usage Alert",
    description: "Monitor switch CPU usage exceeding 80%",
    promql: "(100 - (avg by (instance) (irate(cpu_idle_total[5m])) * 100)) > 80",
    severity: "warning",
    threshold: 80,
    duration: "5m",
    enabled: true,
    deviceGroup: "Core Switches",
    vendor: "Huawei",
    tags: ["CPU", "Performance"],
    lastTriggered: "2024-01-15 14:30:00",
    triggerCount: 5,
    status: "active"
  },
  {
    id: "2",
    name: "Port Status Abnormal Alert",
    description: "Monitor switch port status changes",
    promql: "ifOperStatus{job=\"snmp\"} != ifAdminStatus{job=\"snmp\"}",
    severity: "critical",
    threshold: 1,
    duration: "1m",
    enabled: true,
    deviceGroup: "Access Switches",
    vendor: "Cisco",
    tags: ["Access", "Standard"],
    lastTriggered: "2024-01-15 16:45:00",
    triggerCount: 12,
    status: "firing"
  }
]

const mockTemplates = [
  {
    id: "1",
    name: "Huawei Switch CPU Monitoring",
    category: "Performance Monitoring",
    type: "CPU",
    description: "Huawei switch CPU usage monitoring template",
    promql: "(100 - (avg by (instance) (irate(hwCpuDevCpuUsage[5m])))) > {{threshold}}",
    defaultThreshold: 80,
    severity: "warning",
    duration: "5m",
    tags: ["华为", "CPU", "性能"]
  },
  {
    id: "2",
    name: "Cisco Switch Memory Monitoring",
    category: "Network Monitoring",
    type: "Memory",
    description: "Cisco switch memory usage monitoring template",
    promql: "(ciscoMemoryPoolUsed / ciscoMemoryPoolFree * 100) > {{threshold}}",
    defaultThreshold: 85,
    severity: "warning",
    duration: "3m",
    tags: ["思科", "内存", "性能"]
  }
]

const mockDeviceGroups = [
  {
    id: "1",
    name: "Cisco Switch Memory Monitoring",
    description: "Cisco switch memory usage monitoring template",
    deviceCount: 8,
    ruleCount: 15,
    tags: ["Core", "Critical Business"],
    location: "Data Center A"
  },
  {
    id: "2",
    name: "Core Switches",
    description: "Data center core switch group",
    deviceCount: 45,
    ruleCount: 32,
    tags: ["Port", "Connection"],
    location: "All Floors"
  }
]

export default function AlertRulesPage() {
  const [activeTab, setActiveTab] = useState("rules")
  const [selectedRules, setSelectedRules] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showRuleEditor, setShowRuleEditor] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)
  const [promqlCode, setPromqlCode] = useState("")
  const [syntaxValid, setSyntaxValid] = useState(true)

  // Filter rules
  const filteredRules = mockAlertRules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = filterSeverity === "all" || rule.severity === filterSeverity
    const matchesStatus = filterStatus === "all" || rule.status === filterStatus
    return matchesSearch && matchesSeverity && matchesStatus
  })

  // PromQL语法校验
  const validatePromQL = (query: string) => {
    // 简单的语法校验逻辑
    const hasMetric = /\w+\{/.test(query) || /\w+\[/.test(query) || /\w+\s*[><=]/.test(query)
    setSyntaxValid(hasMetric && query.length > 0)
  }

  useEffect(() => {
    if (promqlCode) {
      validatePromQL(promqlCode)
    }
  }, [promqlCode])

  const handleBatchOperation = (operation: string) => {
    if (selectedRules.length === 0) {
      toast.error("请先选择要操作的规则")
      return
    }
    
    switch (operation) {
      case "enable":
        toast.success(`已启用 ${selectedRules.length} 条规则`)
        break
      case "disable":
        toast.success(`已禁用 ${selectedRules.length} 条规则`)
        break
      case "delete":
        toast.success(`已删除 ${selectedRules.length} 条规则`)
        break
    }
    setSelectedRules([])
  }

  const handleApplyTemplate = (templateId: string, deviceGroupId: string) => {
    toast.success("Template applied successfully, alert rules created for device group")
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* 现代化页面头部 */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
              Alert Rules Configuration
            </h2>
          </div>
          <p className="text-muted-foreground">
            Intelligent alert rule management with PromQL editing, batch operations, and real-time monitoring
          </p>
        </div>
        
        {/* 统计卡片 */}
        <div className="flex flex-wrap gap-4">
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">活跃规则</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{filteredRules.filter(r => r.enabled).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">触发中</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{filteredRules.filter(r => r.status === 'firing').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">总规则数</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{filteredRules.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 操作按钮组 */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setShowRuleEditor(true)} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          新建规则
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          导出配置
        </Button>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          导入配置
        </Button>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          同步状态
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-none lg:flex">
          <TabsTrigger value="rules" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>告警规则</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span>规则模板</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>设备分组</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>分析报告</span>
          </TabsTrigger>
          <TabsTrigger value="alertmanager" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Alertmanager</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center space-x-2">
            <GitBranch className="h-4 w-4" />
            <span>配置同步</span>
          </TabsTrigger>
        </TabsList>

        {/* 告警规则管理 - 现代化设计 */}
        <TabsContent value="rules" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>告警规则管理</span>
                  </CardTitle>
                  <CardDescription>
                    Intelligent rule management with batch operations, real-time monitoring, and performance analysis
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-muted-foreground">实时同步</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* 增强的搜索和过滤区域 */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-x-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search rule name, description or tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 border-2 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                      <SelectTrigger className="w-40 h-12">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="critical">🔴 严重</SelectItem>
                        <SelectItem value="warning">🟡 警告</SelectItem>
                        <SelectItem value="info">🔵 信息</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32 h-12">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="active">✅ 活跃</SelectItem>
                        <SelectItem value="firing">🔥 触发中</SelectItem>
                        <SelectItem value="pending">⏳ 等待中</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* 快速过滤标签 */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 hover:border-blue-300">
                    <Tag className="mr-1 h-3 w-3" />
                    CPU监控
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-green-50 hover:border-green-300">
                    <Tag className="mr-1 h-3 w-3" />
                    内存监控
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-purple-50 hover:border-purple-300">
                    <Tag className="mr-1 h-3 w-3" />
                    网络监控
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-orange-50 hover:border-orange-300">
                    <Tag className="mr-1 h-3 w-3" />
                    华为设备
                  </Badge>
                </div>
              </div>

              {/* 批量操作栏 */}
              {selectedRules.length > 0 && (
                <div className="mb-6 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                        <span className="text-sm font-bold">{selectedRules.length}</span>
                      </div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        已选择 {selectedRules.length} 条规则
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleBatchOperation("enable")} className="border-green-300 text-green-700 hover:bg-green-50">
                        <Play className="mr-1 h-3 w-3" />
                        批量启用
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBatchOperation("disable")} className="border-yellow-300 text-yellow-700 hover:bg-yellow-50">
                        <Pause className="mr-1 h-3 w-3" />
                        批量禁用
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBatchOperation("delete")} className="border-red-300 text-red-700 hover:bg-red-50">
                        <Trash2 className="mr-1 h-3 w-3" />
                        批量删除
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 现代化规则表格 */}
              <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRules.length === filteredRules.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRules(filteredRules.map(r => r.id))
                            } else {
                              setSelectedRules([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="font-semibold">规则信息</TableHead>
                      <TableHead className="font-semibold">严重程度</TableHead>
                      <TableHead className="font-semibold">设备组</TableHead>
                      <TableHead className="font-semibold">状态</TableHead>
                      <TableHead className="font-semibold">性能指标</TableHead>
                      <TableHead className="font-semibold">最后触发</TableHead>
                      <TableHead className="font-semibold text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRules.map((rule) => (
                      <TableRow key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <TableCell>
                          <Checkbox
                            checked={selectedRules.includes(rule.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRules([...selectedRules, rule.id])
                              } else {
                                setSelectedRules(selectedRules.filter(id => id !== rule.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className="font-medium text-gray-900 dark:text-gray-100">{rule.name}</div>
                              {rule.enabled && (
                                <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{rule.description}</div>
                            <div className="flex flex-wrap gap-1">
                              {rule.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={rule.severity === "critical" ? "destructive" : "secondary"}
                            className={rule.severity === "critical" ? "bg-red-100 text-red-800 border-red-300" : "bg-yellow-100 text-yellow-800 border-yellow-300"}
                          >
                            {rule.severity === "critical" ? "🔴 严重" : "🟡 警告"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{rule.deviceGroup}</div>
                            <div className="text-xs text-muted-foreground">{rule.vendor}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <div className={`h-3 w-3 rounded-full ${
                                rule.status === "firing" ? "bg-red-500 animate-pulse" :
                                rule.status === "active" ? "bg-green-500" : "bg-yellow-500"
                              }`} />
                              <span className="text-sm font-medium">
                                {rule.status === "firing" ? "触发中" :
                                 rule.status === "active" ? "活跃" : "等待中"}
                              </span>
                            </div>
                            <Switch checked={rule.enabled} size="sm" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-3 w-3 text-blue-500" />
                              <span className="text-sm font-medium">{rule.triggerCount}次</span>
                            </div>
                            <Progress value={(rule.triggerCount / 20) * 100} className="h-1" />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{rule.lastTriggered}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center space-x-1">
                            <Button size="sm" variant="ghost" onClick={() => {
                              setEditingRule(rule)
                              setPromqlCode(rule.promql)
                              setShowRuleEditor(true)
                            }} className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600">
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-orange-50 hover:text-orange-600">
                              <BarChart3 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 规则模板库 - 现代化设计 */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockTemplates.map((template) => (
              <Card key={template.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                        <Layers className="h-4 w-4 text-white" />
                      </div>
                      <span>{template.name}</span>
                    </CardTitle>
                    <Badge variant="outline" className="bg-white/80">{template.category}</Badge>
                  </div>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">类型:</span>
                        <Badge variant="secondary" className="text-xs">{template.type}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">阈值:</span>
                        <span className="font-medium">{template.defaultThreshold}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">持续:</span>
                        <span className="font-medium">{template.duration}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">严重度:</span>
                        <Badge variant={template.severity === "critical" ? "destructive" : "secondary"} className="text-xs">
                          {template.severity === "critical" ? "🔴 严重" : "🟡 警告"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs px-2 py-1">
                          <Tag className="mr-1 h-2 w-2" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                            <Target className="mr-1 h-3 w-3" />
                            应用模板
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>应用模板到设备组</DialogTitle>
                            <DialogDescription>
                              选择要应用此模板的设备组
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>选择设备组</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="选择设备组" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockDeviceGroups.map(group => (
                                    <SelectItem key={group.id} value={group.id}>
                                      {group.name} ({group.deviceCount}台设备)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>自定义阈值</Label>
                              <Input type="number" defaultValue={template.defaultThreshold} />
                            </div>
                            <Button onClick={() => handleApplyTemplate(template.id, "1")} className="w-full">
                              应用模板
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 设备分组管理 - 现代化设计 */}
        <TabsContent value="groups" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {mockDeviceGroups.map((group) => (
              <Card key={group.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-blue-600">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <span>{group.name}</span>
                    </CardTitle>
                    <Badge variant="outline" className="bg-white/80">
                      <Users className="mr-1 h-3 w-3" />
                      {group.deviceCount}台
                    </Badge>
                  </div>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">位置:</span>
                          <span className="font-medium">{group.location}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">告警规则:</span>
                          <Badge variant="secondary" className="text-xs">{group.ruleCount}条</Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{group.deviceCount}</div>
                          <div className="text-xs text-muted-foreground">设备总数</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {group.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs px-2 py-1">
                          <Tag className="mr-1 h-2 w-2" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-300">
                        <Settings className="mr-1 h-3 w-3" />
                        管理设备
                      </Button>
                      <Button size="sm" variant="outline" className="hover:bg-green-50 hover:border-green-300">
                        <Bell className="mr-1 h-3 w-3" />
                        配置规则
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alertmanager配置 - 现代化设计 */}
        <TabsContent value="alertmanager" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  <span>路由规则配置</span>
                </CardTitle>
                <CardDescription>配置告警路由和分组策略</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label>路由匹配规则</Label>
                    <Textarea 
                      placeholder="severity: critical&#10;service: network"
                      className="mt-1 font-mono text-sm"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>分组策略</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分组策略" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="by-severity">按严重程度分组</SelectItem>
                        <SelectItem value="by-service">按服务分组</SelectItem>
                        <SelectItem value="by-instance">按实例分组</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                    <Save className="mr-2 h-4 w-4" />
                    保存路由配置
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-purple-600" />
                  <span>通知渠道管理</span>
                </CardTitle>
                <CardDescription>配置不同的告警通知方式</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border-2 border-green-200 bg-green-50 rounded-lg dark:border-green-800 dark:bg-green-950">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <div>
                          <div className="font-medium text-green-900 dark:text-green-100">邮件通知</div>
                          <div className="text-sm text-green-700 dark:text-green-300">admin@company.com</div>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border-2 border-blue-200 bg-blue-50 rounded-lg dark:border-blue-800 dark:bg-blue-950">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                        <div>
                          <div className="font-medium text-blue-900 dark:text-blue-100">钉钉机器人</div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">运维群</div>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border-2 border-gray-200 bg-gray-50 rounded-lg dark:border-gray-700 dark:bg-gray-900">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">企业微信</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">未配置</div>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-2 border-dashed hover:bg-purple-50 hover:border-purple-300">
                    <Plus className="mr-2 h-4 w-4" />
                    添加通知渠道
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 配置同步 - 现代化设计 */}
        <TabsContent value="sync" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950">
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5 text-cyan-600" />
                <span>配置同步状态</span>
              </CardTitle>
              <CardDescription>监控配置文件同步状态和操作日志</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center space-x-3 p-4 border-2 border-green-200 bg-green-50 rounded-lg dark:border-green-800 dark:bg-green-950">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="font-medium text-green-900 dark:text-green-100">Prometheus Rules</div>
                      <div className="text-sm text-green-700 dark:text-green-300">最后同步: 2分钟前</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border-2 border-green-200 bg-green-50 rounded-lg dark:border-green-800 dark:bg-green-950">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="font-medium text-green-900 dark:text-green-100">Alertmanager Config</div>
                      <div className="text-sm text-green-700 dark:text-green-300">最后同步: 5分钟前</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border-2 border-blue-200 bg-blue-50 rounded-lg dark:border-blue-800 dark:bg-blue-950">
                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-100">VictoriaMetrics</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">同步中...</div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">同步操作</h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      手动同步
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-green-50 hover:border-green-300">
                      <Eye className="mr-2 h-4 w-4" />
                      查看配置
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border-2 border-green-200 bg-green-50 rounded-lg dark:border-green-800 dark:bg-green-950">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium text-green-900 dark:text-green-100">规则配置更新</div>
                        <div className="text-sm text-green-700 dark:text-green-300">2024-01-15 16:30:00</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">成功</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border-2 border-green-200 bg-green-50 rounded-lg dark:border-green-800 dark:bg-green-950">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium text-green-900 dark:text-green-100">通知配置同步</div>
                        <div className="text-sm text-green-700 dark:text-green-300">2024-01-15 16:25:00</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">成功</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PromQL规则编辑器对话框 - 现代化设计 */}
      <Dialog open={showRuleEditor} onOpenChange={setShowRuleEditor}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Code className="h-4 w-4 text-white" />
              </div>
              <span>{editingRule ? "编辑告警规则" : "新建告警规则"}</span>
            </DialogTitle>
            <DialogDescription>
              配置PromQL查询和告警条件，支持语法高亮和实时校验
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>规则名称</Label>
                <Input defaultValue={editingRule?.name} placeholder="输入规则名称" className="mt-1" />
              </div>
              <div>
                <Label>严重程度</Label>
                <Select defaultValue={editingRule?.severity || "warning"}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">🔴 严重</SelectItem>
                    <SelectItem value="warning">🟡 警告</SelectItem>
                    <SelectItem value="info">🔵 信息</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>描述</Label>
              <Input defaultValue={editingRule?.description} placeholder="输入规则描述" className="mt-1" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>PromQL查询</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant={syntaxValid ? "secondary" : "destructive"} className={syntaxValid ? "bg-green-100 text-green-800 border-green-300" : ""}>
                    {syntaxValid ? "✅ 语法正确" : "❌ 语法错误"}
                  </Badge>
                  <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-300">
                    <Code className="mr-1 h-3 w-3" />
                    格式化
                  </Button>
                  <Button size="sm" variant="outline" className="hover:bg-green-50 hover:border-green-300">
                    <Play className="mr-1 h-3 w-3" />
                    测试查询
                  </Button>
                </div>
              </div>
              <Textarea
                value={promqlCode}
                onChange={(e) => setPromqlCode(e.target.value)}
                placeholder="输入PromQL查询表达式...&#10;例如: (100 - (avg by (instance) (irate(cpu_idle_total[5m])) * 100)) > 80"
                className="font-mono text-sm min-h-32 border-2 focus:border-blue-500"
              />
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 rounded border">
                💡 支持VictoriaMetrics特有函数，如 rate(), increase(), histogram_quantile() 等
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>阈值</Label>
                <Input type="number" defaultValue={editingRule?.threshold} placeholder="80" className="mt-1" />
              </div>
              <div>
                <Label>持续时间</Label>
                <Input defaultValue={editingRule?.duration || "5m"} placeholder="5m" className="mt-1" />
              </div>
              <div>
                <Label>设备组</Label>
                <Select defaultValue={editingRule?.deviceGroup}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择设备组" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDeviceGroups.map(group => (
                      <SelectItem key={group.id} value={group.name}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>标签</Label>
              <Input placeholder="输入标签，用逗号分隔" className="mt-1" />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowRuleEditor(false)}>
                取消
              </Button>
              <Button onClick={() => {
                toast.success(editingRule ? "规则更新成功" : "规则创建成功")
                setShowRuleEditor(false)
                setEditingRule(null)
              }} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Save className="mr-2 h-4 w-4" />
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}