"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Upload, Download, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Settings, Eye, Play, Pause, RotateCcw, FileText, Server, Database, Zap, Activity, History, GitBranch, Compare, Undo2 } from "lucide-react"
import { toast } from "sonner"

// 同步目标数据
const mockSyncTargets = [
  {
    id: "1",
    name: "Prometheus-01",
    type: "prometheus",
    endpoint: "http://prometheus-01:9090",
    status: "connected",
    lastSync: "2024-01-15T14:30:00Z",
    version: "v2.45.0",
    rulesCount: 45,
    enabled: true
  },
  {
    id: "2",
    name: "Prometheus-02",
    type: "prometheus",
    endpoint: "http://prometheus-02:9090",
    status: "connected",
    lastSync: "2024-01-15T14:28:00Z",
    version: "v2.45.0",
    rulesCount: 42,
    enabled: true
  },
  {
    id: "3",
    name: "Alertmanager-01",
    type: "alertmanager",
    endpoint: "http://alertmanager-01:9093",
    status: "connected",
    lastSync: "2024-01-15T14:32:00Z",
    version: "v0.26.0",
    rulesCount: 0,
    enabled: true
  },
  {
    id: "4",
    name: "VictoriaMetrics",
    type: "victoriametrics",
    endpoint: "http://vm:8428",
    status: "error",
    lastSync: "2024-01-15T13:45:00Z",
    version: "v1.93.0",
    rulesCount: 38,
    enabled: false,
    error: "连接超时"
  }
]

// 同步历史数据
const mockSyncHistory = [
  {
    id: "1",
    timestamp: "2024-01-15T14:30:00Z",
    type: "auto",
    targets: ["Prometheus-01", "Prometheus-02", "Alertmanager-01"],
    status: "success",
    duration: "2.3s",
    rulesUpdated: 12,
    rulesAdded: 3,
    rulesDeleted: 1,
    message: "配置同步成功"
  },
  {
    id: "2",
    timestamp: "2024-01-15T14:00:00Z",
    type: "manual",
    targets: ["VictoriaMetrics"],
    status: "failed",
    duration: "30s",
    rulesUpdated: 0,
    rulesAdded: 0,
    rulesDeleted: 0,
    message: "连接超时，同步失败"
  },
  {
    id: "3",
    timestamp: "2024-01-15T13:30:00Z",
    type: "auto",
    targets: ["Prometheus-01", "Prometheus-02"],
    status: "partial",
    duration: "5.1s",
    rulesUpdated: 8,
    rulesAdded: 2,
    rulesDeleted: 0,
    message: "部分目标同步成功"
  }
]

// 配置版本数据
const mockConfigVersions = [
  {
    id: "1",
    version: "v1.2.3",
    timestamp: "2024-01-15T14:30:00Z",
    author: "Evan",
    description: "添加核心交换机告警规则",
    rulesCount: 45,
    status: "current",
    changes: {
      added: 3,
      modified: 2,
      deleted: 1
    }
  },
  {
    id: "2",
    version: "v1.2.2",
    timestamp: "2024-01-15T10:15:00Z",
    author: "Evan",
    description: "调整告警阈值",
    rulesCount: 41,
    status: "archived",
    changes: {
      added: 0,
      modified: 5,
      deleted: 0
    }
  },
  {
    id: "3",
    version: "v1.2.1",
    timestamp: "2024-01-14T16:20:00Z",
    author: "Evan",
    description: "修复规则语法错误",
    rulesCount: 41,
    status: "archived",
    changes: {
      added: 1,
      modified: 3,
      deleted: 2
    }
  }
]

const SYNC_TYPES = [
  { value: "prometheus", label: "Prometheus", icon: Activity },
  { value: "alertmanager", label: "Alertmanager", icon: Bell },
  { value: "victoriametrics", label: "VictoriaMetrics", icon: Database }
]

const STATUS_COLORS = {
  connected: "bg-green-500",
  disconnected: "bg-gray-500",
  error: "bg-red-500",
  syncing: "bg-blue-500"
}

interface ConfigSyncProps {
  onSyncComplete?: (result: any) => void
}

export function ConfigSync({ onSyncComplete }: ConfigSyncProps) {
  const [targets, setTargets] = useState(mockSyncTargets)
  const [syncHistory, setSyncHistory] = useState(mockSyncHistory)
  const [configVersions, setConfigVersions] = useState(mockConfigVersions)
  const [activeTab, setActiveTab] = useState("targets")
  const [showTargetEditor, setShowTargetEditor] = useState(false)
  const [editingTarget, setEditingTarget] = useState<any>(null)
  const [syncProgress, setSyncProgress] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedTargets, setSelectedTargets] = useState<string[]>([])
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
  const [syncInterval, setSyncInterval] = useState(300) // 5分钟
  const [showVersionCompare, setShowVersionCompare] = useState(false)
  const [compareVersions, setCompareVersions] = useState<string[]>([])

  // 自动同步定时器
  useEffect(() => {
    if (!autoSyncEnabled) return
    
    const interval = setInterval(() => {
      autoSync()
    }, syncInterval * 1000)
    
    return () => clearInterval(interval)
  }, [autoSyncEnabled, syncInterval])

  // 测试连接
  const testConnection = async (targetId: string) => {
    const target = targets.find(t => t.id === targetId)
    if (!target) return
    
    setTargets(prev => prev.map(t => 
      t.id === targetId ? { ...t, status: "syncing" } : t
    ))
    
    // 模拟连接测试
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const success = Math.random() > 0.3 // 70% 成功率
    setTargets(prev => prev.map(t => 
      t.id === targetId ? { 
        ...t, 
        status: success ? "connected" : "error",
        error: success ? undefined : "连接失败"
      } : t
    ))
    
    toast[success ? 'success' : 'error'](
      success ? `${target.name} 连接测试成功` : `${target.name} 连接测试失败`
    )
  }

  // 手动同步
  const manualSync = async (targetIds?: string[]) => {
    const syncTargets = targetIds || targets.filter(t => t.enabled).map(t => t.id)
    if (syncTargets.length === 0) {
      toast.error("请选择要同步的目标")
      return
    }
    
    setIsSyncing(true)
    setSyncProgress(0)
    
    try {
      for (let i = 0; i < syncTargets.length; i++) {
        const targetId = syncTargets[i]
        const target = targets.find(t => t.id === targetId)
        if (!target) continue
        
        // 更新目标状态
        setTargets(prev => prev.map(t => 
          t.id === targetId ? { ...t, status: "syncing" } : t
        ))
        
        // 模拟同步过程
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const success = target.status !== "error"
        
        // 更新目标状态
        setTargets(prev => prev.map(t => 
          t.id === targetId ? { 
            ...t, 
            status: success ? "connected" : "error",
            lastSync: new Date().toISOString()
          } : t
        ))
        
        setSyncProgress(((i + 1) / syncTargets.length) * 100)
      }
      
      // 添加同步历史记录
      const newHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: "manual",
        targets: syncTargets.map(id => targets.find(t => t.id === id)?.name || id),
        status: "success",
        duration: `${syncTargets.length * 1.2}s`,
        rulesUpdated: Math.floor(Math.random() * 10),
        rulesAdded: Math.floor(Math.random() * 5),
        rulesDeleted: Math.floor(Math.random() * 3),
        message: "手动同步完成"
      }
      
      setSyncHistory(prev => [newHistory, ...prev])
      toast.success("配置同步完成")
      onSyncComplete?.(newHistory)
      
    } catch (error) {
      toast.error("同步过程中发生错误")
    } finally {
      setIsSyncing(false)
      setSyncProgress(0)
    }
  }

  // 自动同步
  const autoSync = async () => {
    const enabledTargets = targets.filter(t => t.enabled && t.status === "connected")
    if (enabledTargets.length === 0) return
    
    try {
      // 静默同步，不显示进度
      const newHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: "auto",
        targets: enabledTargets.map(t => t.name),
        status: "success",
        duration: "1.8s",
        rulesUpdated: Math.floor(Math.random() * 5),
        rulesAdded: Math.floor(Math.random() * 2),
        rulesDeleted: Math.floor(Math.random() * 1),
        message: "自动同步完成"
      }
      
      setSyncHistory(prev => [newHistory, ...prev.slice(0, 9)]) // 保留最近10条记录
      
      // 更新最后同步时间
      setTargets(prev => prev.map(t => 
        enabledTargets.some(et => et.id === t.id) 
          ? { ...t, lastSync: new Date().toISOString() }
          : t
      ))
      
    } catch (error) {
      console.error("自动同步失败:", error)
    }
  }

  // 回滚到指定版本
  const rollbackToVersion = async (versionId: string) => {
    const version = configVersions.find(v => v.id === versionId)
    if (!version) return
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: `正在回滚到版本 ${version.version}...`,
        success: `已成功回滚到版本 ${version.version}`,
        error: "回滚失败"
      }
    )
    
    // 更新当前版本
    setConfigVersions(prev => prev.map(v => ({
      ...v,
      status: v.id === versionId ? "current" : "archived"
    })))
  }

  // 比较版本
  const compareConfigVersions = (version1: string, version2: string) => {
    setCompareVersions([version1, version2])
    setShowVersionCompare(true)
  }

  // 导出配置
  const exportConfig = (format: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: `正在导出${format.toUpperCase()}格式配置...`,
        success: `配置已导出为${format.toUpperCase()}格式`,
        error: "导出失败"
      }
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">配置同步管理</h2>
          <p className="text-muted-foreground">管理告警规则配置的同步和版本控制</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={autoSyncEnabled}
              onCheckedChange={setAutoSyncEnabled}
            />
            <Label>自动同步</Label>
          </div>
          <Button 
            variant="outline" 
            onClick={() => manualSync()}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            立即同步
          </Button>
        </div>
      </div>

      {/* 同步进度 */}
      {isSyncing && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>正在同步配置...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="w-full" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="targets">同步目标</TabsTrigger>
          <TabsTrigger value="history">同步历史</TabsTrigger>
          <TabsTrigger value="versions">版本管理</TabsTrigger>
          <TabsTrigger value="settings">同步设置</TabsTrigger>
        </TabsList>

        {/* 同步目标 */}
        <TabsContent value="targets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">同步目标管理</h3>
            <Button onClick={() => {
              setEditingTarget(null)
              setShowTargetEditor(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              添加目标
            </Button>
          </div>

          <div className="grid gap-4">
            {targets.map((target) => {
              const typeInfo = SYNC_TYPES.find(t => t.type === target.type)
              const Icon = typeInfo?.icon || Server
              const statusColor = STATUS_COLORS[target.status as keyof typeof STATUS_COLORS]
              
              return (
                <Card key={target.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedTargets.includes(target.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTargets([...selectedTargets, target.id])
                              } else {
                                setSelectedTargets(selectedTargets.filter(id => id !== target.id))
                              }
                            }}
                          />
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{target.name}</span>
                            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                            <Badge variant="outline">{typeInfo?.label}</Badge>
                            {target.enabled ? (
                              <Badge variant="secondary">启用</Badge>
                            ) : (
                              <Badge variant="outline">禁用</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {target.endpoint} | 版本: {target.version}
                            {target.error && (
                              <span className="text-red-500 ml-2">({target.error})</span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => testConnection(target.id)}
                          disabled={target.status === "syncing"}
                        >
                          {target.status === "syncing" ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Zap className="h-3 w-3" />
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => manualSync([target.id])}
                          disabled={!target.enabled || target.status === "error"}
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingTarget(target)
                            setShowTargetEditor(true)
                          }}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Switch 
                          checked={target.enabled}
                          onCheckedChange={(checked) => {
                            setTargets(prev => prev.map(t => 
                              t.id === target.id ? { ...t, enabled: checked } : t
                            ))
                          }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{target.rulesCount}</div>
                        <div className="text-sm text-muted-foreground">告警规则</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {target.status === 'connected' && <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />}
                          {target.status === 'error' && <XCircle className="inline h-4 w-4 text-red-500 mr-1" />}
                          {target.status === 'syncing' && <RefreshCw className="inline h-4 w-4 text-blue-500 mr-1 animate-spin" />}
                          {target.status === 'disconnected' && <Clock className="inline h-4 w-4 text-gray-500 mr-1" />}
                          {target.status === 'connected' ? '已连接' : 
                           target.status === 'error' ? '连接错误' :
                           target.status === 'syncing' ? '同步中' : '未连接'}
                        </div>
                        <div className="text-sm text-muted-foreground">连接状态</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {target.lastSync ? new Date(target.lastSync).toLocaleString() : '从未同步'}
                        </div>
                        <div className="text-sm text-muted-foreground">最后同步</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 批量操作 */}
          {selectedTargets.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedTargets.length} 个目标
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => manualSync(selectedTargets)}
              >
                <Upload className="mr-1 h-3 w-3" />
                批量同步
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  selectedTargets.forEach(id => testConnection(id))
                }}
              >
                <Zap className="mr-1 h-3 w-3" />
                批量测试
              </Button>
            </div>
          )}
        </TabsContent>

        {/* 同步历史 */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">同步历史记录</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                导出日志
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {syncHistory.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <History className="h-4 w-4" />
                        <span>{record.type === 'auto' ? '自动同步' : '手动同步'}</span>
                        {record.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {record.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                        {record.status === 'partial' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      </CardTitle>
                      <CardDescription>
                        {new Date(record.timestamp).toLocaleString()} | 耗时: {record.duration}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={record.status === 'success' ? 'secondary' : 
                              record.status === 'failed' ? 'destructive' : 'outline'}
                    >
                      {record.status === 'success' ? '成功' : 
                       record.status === 'failed' ? '失败' : '部分成功'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">同步目标</h4>
                      <div className="flex flex-wrap gap-1">
                        {record.targets.map(target => (
                          <Badge key={target} variant="outline">{target}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{record.rulesUpdated}</div>
                        <div className="text-sm text-muted-foreground">更新规则</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{record.rulesAdded}</div>
                        <div className="text-sm text-muted-foreground">新增规则</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{record.rulesDeleted}</div>
                        <div className="text-sm text-muted-foreground">删除规则</div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">{record.message}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 版本管理 */}
        <TabsContent value="versions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">配置版本管理</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => exportConfig('yaml')}>
                <Download className="mr-2 h-4 w-4" />
                导出YAML
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportConfig('json')}>
                <Download className="mr-2 h-4 w-4" />
                导出JSON
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {configVersions.map((version) => (
              <Card key={version.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <GitBranch className="h-4 w-4" />
                        <span>{version.version}</span>
                        {version.status === 'current' && <Badge variant="secondary">当前版本</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {version.description} | 作者: {version.author} | {new Date(version.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const otherVersions = configVersions.filter(v => v.id !== version.id)
                          if (otherVersions.length > 0) {
                            compareConfigVersions(version.id, otherVersions[0].id)
                          }
                        }}
                      >
                        <Compare className="h-3 w-3" />
                      </Button>
                      {version.status !== 'current' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => rollbackToVersion(version.id)}
                        >
                          <Undo2 className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{version.rulesCount}</div>
                      <div className="text-sm text-muted-foreground">总规则数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{version.changes.added}</div>
                      <div className="text-sm text-muted-foreground">新增</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{version.changes.modified}</div>
                      <div className="text-sm text-muted-foreground">修改</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{version.changes.deleted}</div>
                      <div className="text-sm text-muted-foreground">删除</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 同步设置 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>自动同步设置</CardTitle>
              <CardDescription>配置自动同步的行为和频率</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">启用自动同步</Label>
                  <p className="text-sm text-muted-foreground">定期自动同步配置到所有启用的目标</p>
                </div>
                <Switch 
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                />
              </div>
              
              <Separator />
              
              <div>
                <Label>同步间隔 (秒)</Label>
                <div className="mt-2">
                  <Slider
                    value={[syncInterval]}
                    onValueChange={(value) => setSyncInterval(value[0])}
                    max={3600}
                    min={60}
                    step={60}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>1分钟</span>
                    <span>当前: {Math.floor(syncInterval / 60)}分钟</span>
                    <span>60分钟</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>同步失败处理</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="retry-failed" defaultChecked />
                    <Label htmlFor="retry-failed">自动重试失败的同步</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="notify-failure" defaultChecked />
                    <Label htmlFor="notify-failure">同步失败时发送通知</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="disable-failed" />
                    <Label htmlFor="disable-failed">连续失败时自动禁用目标</Label>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>配置验证</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="validate-syntax" defaultChecked />
                    <Label htmlFor="validate-syntax">同步前验证配置语法</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="backup-before-sync" defaultChecked />
                    <Label htmlFor="backup-before-sync">同步前自动备份当前配置</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="dry-run" />
                    <Label htmlFor="dry-run">启用干运行模式（仅验证不实际同步）</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 版本比较对话框 */}
      <Dialog open={showVersionCompare} onOpenChange={setShowVersionCompare}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>版本比较</DialogTitle>
            <DialogDescription>
              比较两个配置版本之间的差异
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">版本 A</h4>
                <Select value={compareVersions[0]} onValueChange={(value) => 
                  setCompareVersions([value, compareVersions[1]])
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="选择版本" />
                  </SelectTrigger>
                  <SelectContent>
                    {configVersions.map(version => (
                      <SelectItem key={version.id} value={version.id}>
                        {version.version} - {version.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <h4 className="font-medium mb-2">版本 B</h4>
                <Select value={compareVersions[1]} onValueChange={(value) => 
                  setCompareVersions([compareVersions[0], value])
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="选择版本" />
                  </SelectTrigger>
                  <SelectContent>
                    {configVersions.map(version => (
                      <SelectItem key={version.id} value={version.id}>
                        {version.version} - {version.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">版本 A 配置</h4>
                <ScrollArea className="h-64 border rounded-lg p-4">
                  <pre className="text-sm">
                    <code>{`# Prometheus Rules v1.2.2
groups:
  - name: core-switches
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU usage is high"`}</code>
                  </pre>
                </ScrollArea>
              </div>
              <div>
                <h4 className="font-medium mb-2">版本 B 配置</h4>
                <ScrollArea className="h-64 border rounded-lg p-4">
                  <pre className="text-sm">
                    <code>{`# Prometheus Rules v1.2.3
groups:
  - name: core-switches
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage > 85  # Changed threshold
        for: 5m
        labels:
          severity: critical  # Changed severity
        annotations:
          summary: "CPU usage is critically high"
      - alert: HighMemoryUsage  # New rule
        expr: memory_usage > 90
        for: 3m`}</code>
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}