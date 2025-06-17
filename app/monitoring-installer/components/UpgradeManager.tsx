"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Info,
  Clock,
  Shield,
  Play,
  Square,
  RotateCcw,
  Terminal,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ComponentStatus {
  name: string
  installed: boolean
  currentVersion?: string
  targetVersion: string
  status: 'NOT_INSTALLED' | 'SAME_VERSION' | 'NEED_UPDATE' | 'NEWER_VERSION' | 'CORRUPTED'
  lastCheck?: Date
  configBackup?: boolean
  serviceRunning?: boolean
  upgradeAction: 'install' | 'update' | 'skip' | 'downgrade' | 'reinstall'
}

interface UpgradeTask {
  id: string
  hostId: string
  componentName: string
  fromVersion: string
  toVersion: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back'
  progress: number
  steps: Array<{
    name: string
    description: string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
    startTime?: string
    endTime?: string
    output?: string
    error?: string
  }>
  startedAt?: string
  completedAt?: string
  logs: string[]
  error?: string
}

interface UpgradeStrategy {
  backupConfig: boolean
  backupData: boolean
  stopService: boolean
  migrateConfig: boolean
  rollbackEnabled: boolean
  upgradeTimeout: number
  healthCheckDelay: number
}

interface UpgradeManagerProps {
  hostId: string
  components: string[]
  onUpgradeComplete?: (results: any[]) => void
  className?: string
}

export function UpgradeManager({
  hostId,
  components,
  onUpgradeComplete,
  className
}: UpgradeManagerProps) {
  const [statuses, setStatuses] = useState<ComponentStatus[]>([])
  const [tasks, setTasks] = useState<UpgradeTask[]>([])
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [strategy, setStrategy] = useState<UpgradeStrategy>({
    backupConfig: true,
    backupData: true,
    stopService: true,
    migrateConfig: true,
    rollbackEnabled: true,
    upgradeTimeout: 1800,
    healthCheckDelay: 30
  })
  const [checking, setChecking] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [activeTab, setActiveTab] = useState("status")

  // 检查组件状态
  const checkComponentStatuses = async () => {
    setChecking(true)
    try {
      const response = await fetch('/api/monitoring/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check',
          hostId,
          components,
          targetVersions: components.reduce((acc, comp) => ({ ...acc, [comp]: '2.1.0' }), {})
        })
      })
      
      const result = await response.json()
      if (result.success) {
        const statusesWithDate = result.data.map((status: any) => ({
          ...status,
          lastCheck: new Date(status.lastCheck)
        }))
        setStatuses(statusesWithDate)
        
        // 自动选择需要更新的组件
        const needUpdate = statusesWithDate.filter((s: ComponentStatus) => 
          s.status === 'NEED_UPDATE' || s.status === 'NOT_INSTALLED'
        ).map((s: ComponentStatus) => s.name)
        setSelectedComponents(needUpdate)
      }
    } catch (error) {
      console.error('Error checking component statuses:', error)
    } finally {
      setChecking(false)
    }
  }

  // 开始升级
  const startUpgrade = async () => {
    if (selectedComponents.length === 0) return
    
    setUpgrading(true)
    setActiveTab("progress")
    
    try {
      const response = await fetch('/api/monitoring/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'upgrade',
          hostId,
          components: selectedComponents,
          targetVersions: selectedComponents.reduce((acc, comp) => ({ ...acc, [comp]: '2.1.0' }), {}),
          strategy
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setTasks(result.data)
        
        // 开始轮询任务状态
        result.data.forEach((task: UpgradeTask) => {
          pollTaskStatus(task.id)
        })
      }
    } catch (error) {
      console.error('Error starting upgrade:', error)
    } finally {
      setUpgrading(false)
    }
  }

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/monitoring/upgrade?action=status&taskId=${taskId}`)
        const result = await response.json()
        
        if (result.success) {
          setTasks(prev => prev.map(task => 
            task.id === taskId ? result.data : task
          ))
          
          // 如果任务还在进行中，继续轮询
          if (result.data.status === 'running' || result.data.status === 'pending') {
            setTimeout(poll, 2000)
          } else if (result.data.status === 'completed') {
            // 任务完成，重新检查组件状态
            checkComponentStatuses()
          }
        }
      } catch (error) {
        console.error('Error polling task status:', error)
      }
    }
    
    poll()
  }

  // 回滚升级
  const rollbackUpgrade = async (taskId: string) => {
    try {
      const response = await fetch('/api/monitoring/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'rollback',
          taskId
        })
      })
      
      const result = await response.json()
      if (result.success) {
        // 开始轮询回滚状态
        pollTaskStatus(taskId)
      }
    } catch (error) {
      console.error('Error rolling back upgrade:', error)
    }
  }

  useEffect(() => {
    if (components.length > 0) {
      checkComponentStatuses()
    }
  }, [components, hostId])

  const getStatusIcon = (status: ComponentStatus['status']) => {
    switch (status) {
      case 'NOT_INSTALLED':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'SAME_VERSION':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'NEED_UPDATE':
        return <Upload className="h-4 w-4 text-blue-500" />
      case 'NEWER_VERSION':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'CORRUPTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: ComponentStatus['status']) => {
    const variants = {
      'NOT_INSTALLED': { variant: 'secondary' as const, text: '未安装' },
      'SAME_VERSION': { variant: 'default' as const, text: '已是最新' },
      'NEED_UPDATE': { variant: 'outline' as const, text: '需要更新' },
      'NEWER_VERSION': { variant: 'destructive' as const, text: '版本较新' },
      'CORRUPTED': { variant: 'destructive' as const, text: '状态异常' }
    }
    
    const config = variants[status]
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const getTaskStatusIcon = (status: UpgradeTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'rolled_back':
        return <RotateCcw className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getSummary = () => {
    const counts = {
      total: statuses.length,
      needAction: statuses.filter(s => s.status === 'NOT_INSTALLED' || s.status === 'NEED_UPDATE' || s.status === 'CORRUPTED').length,
      upToDate: statuses.filter(s => s.status === 'SAME_VERSION').length,
      issues: statuses.filter(s => s.status === 'NEWER_VERSION' || s.status === 'CORRUPTED').length
    }
    return counts
  }

  const summary = getSummary()

  return (
    <div className={cn("space-y-6", className)}>
      {/* 状态总览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>组件升级管理</span>
            <Button
              variant="outline"
              size="sm"
              onClick={checkComponentStatuses}
              disabled={checking}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", checking && "animate-spin")} />
              {checking ? '检查中...' : '重新检查'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
              <div className="text-sm text-muted-foreground">总组件数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.needAction}</div>
              <div className="text-sm text-muted-foreground">需要处理</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.upToDate}</div>
              <div className="text-sm text-muted-foreground">已是最新</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.issues}</div>
              <div className="text-sm text-muted-foreground">有问题</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">组件状态</TabsTrigger>
          <TabsTrigger value="strategy">升级策略</TabsTrigger>
          <TabsTrigger value="progress">升级进度</TabsTrigger>
        </TabsList>

        {/* 组件状态标签页 */}
        <TabsContent value="status" className="space-y-4">
          {statuses.length > 0 && (
            <div className="space-y-3">
              {statuses.map((status, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedComponents.includes(status.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedComponents(prev => [...prev, status.name])
                            } else {
                              setSelectedComponents(prev => prev.filter(c => c !== status.name))
                            }
                          }}
                          disabled={status.status === 'SAME_VERSION'}
                          className="rounded"
                        />
                        {getStatusIcon(status.status)}
                        <div>
                          <div className="font-medium">{status.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {status.installed ? (
                              <>
                                当前版本: {status.currentVersion} → 目标版本: {status.targetVersion}
                              </>
                            ) : (
                              <>目标版本: {status.targetVersion}</>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {getStatusBadge(status.status)}
                      </div>
                    </div>

                    {/* 额外信息 */}
                    {status.installed && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {status.serviceRunning !== undefined && (
                            <div className="flex items-center space-x-1">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                status.serviceRunning ? "bg-green-500" : "bg-red-500"
                              )} />
                              <span>服务{status.serviceRunning ? '运行中' : '已停止'}</span>
                            </div>
                          )}
                          
                          {status.configBackup !== undefined && (
                            <div className="flex items-center space-x-1">
                              <Shield className="h-3 w-3" />
                              <span>配置{status.configBackup ? '已备份' : '未备份'}</span>
                            </div>
                          )}
                          
                          {status.lastCheck && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>检查时间: {status.lastCheck.toLocaleTimeString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          {selectedComponents.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">已选择 {selectedComponents.length} 个组件</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedComponents.join(', ')}
                    </div>
                  </div>
                  <Button
                    onClick={startUpgrade}
                    disabled={upgrading || checking}
                    className="ml-4"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    开始升级
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 升级策略标签页 */}
        <TabsContent value="strategy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>升级策略配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="backup-config"
                    checked={strategy.backupConfig}
                    onCheckedChange={(checked) => 
                      setStrategy(prev => ({ ...prev, backupConfig: checked }))
                    }
                  />
                  <Label htmlFor="backup-config">备份配置文件</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="backup-data"
                    checked={strategy.backupData}
                    onCheckedChange={(checked) => 
                      setStrategy(prev => ({ ...prev, backupData: checked }))
                    }
                  />
                  <Label htmlFor="backup-data">备份数据文件</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="stop-service"
                    checked={strategy.stopService}
                    onCheckedChange={(checked) => 
                      setStrategy(prev => ({ ...prev, stopService: checked }))
                    }
                  />
                  <Label htmlFor="stop-service">停止服务</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="migrate-config"
                    checked={strategy.migrateConfig}
                    onCheckedChange={(checked) => 
                      setStrategy(prev => ({ ...prev, migrateConfig: checked }))
                    }
                  />
                  <Label htmlFor="migrate-config">迁移配置</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rollback-enabled"
                    checked={strategy.rollbackEnabled}
                    onCheckedChange={(checked) => 
                      setStrategy(prev => ({ ...prev, rollbackEnabled: checked }))
                    }
                  />
                  <Label htmlFor="rollback-enabled">启用回滚</Label>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  建议在生产环境中启用所有备份和回滚选项，以确保升级过程的安全性。
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 升级进度标签页 */}
        <TabsContent value="progress" className="space-y-4">
          {tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTaskStatusIcon(task.status)}
                        <span>{task.componentName} 升级任务</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={task.status === 'completed' ? 'default' : 
                                     task.status === 'failed' ? 'destructive' : 'secondary'}>
                          {task.status === 'pending' && '等待中'}
                          {task.status === 'running' && '进行中'}
                          {task.status === 'completed' && '已完成'}
                          {task.status === 'failed' && '失败'}
                          {task.status === 'rolled_back' && '已回滚'}
                        </Badge>
                        {task.status === 'failed' && strategy.rollbackEnabled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rollbackUpgrade(task.id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            回滚
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* 进度条 */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>升级进度</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="w-full" />
                      </div>
                      
                      {/* 步骤列表 */}
                      <div className="space-y-2">
                        {task.steps.map((step, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {step.status === 'running' && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                            {step.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                            {step.status === 'pending' && <Clock className="h-4 w-4 text-gray-500" />}
                            {step.status === 'skipped' && <Square className="h-4 w-4 text-gray-400" />}
                            <span className={cn(
                              step.status === 'completed' && 'text-green-600',
                              step.status === 'running' && 'text-blue-600',
                              step.status === 'failed' && 'text-red-600',
                              step.status === 'pending' && 'text-gray-600',
                              step.status === 'skipped' && 'text-gray-400'
                            )}>
                              {step.description}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* 日志 */}
                      {task.logs.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Terminal className="h-4 w-4" />
                            <span className="text-sm font-medium">执行日志</span>
                          </div>
                          <ScrollArea className="h-32 w-full border rounded p-2">
                            <div className="space-y-1">
                              {task.logs.map((log, index) => (
                                <div key={index} className="text-xs font-mono text-muted-foreground">
                                  {log}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                      
                      {/* 错误信息 */}
                      {task.error && (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>{task.error}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">暂无升级任务</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}