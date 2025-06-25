"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Zap,
  Package,
  ArrowUp,
  ArrowDown,
  Pause,
  SkipForward
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ComponentDetectionResult {
  name: string
  detected: boolean
  currentVersion?: string
  installationType?: 'docker' | 'binary' | 'systemd' | 'package'
  configPaths?: string[]
  dataPaths?: string[]
  serviceName?: string
  containerName?: string
  ports?: number[]
  dependencies?: string[]
  conflicts?: string[]
}

interface InstallationStrategy {
  action: 'fresh_install' | 'upgrade' | 'reinstall' | 'migrate' | 'skip'
  backupStrategy: {
    enabled: boolean
    configBackup: boolean
    dataBackup: boolean
    backupLocation: string
    retentionDays: number
  }
  migrationStrategy: {
    enabled: boolean
    configMigration: boolean
    dataMigration: boolean
    customMigrationScript?: string
  }
  rollbackStrategy: {
    enabled: boolean
    autoRollback: boolean
    rollbackTimeout: number
    healthCheckEnabled: boolean
  }
  installationMethod: 'docker' | 'binary' | 'package'
  serviceManagement: {
    stopBeforeInstall: boolean
    startAfterInstall: boolean
    restartExisting: boolean
    gracefulShutdown: boolean
    shutdownTimeout: number
  }
  validation: {
    preInstallCheck: boolean
    postInstallCheck: boolean
    healthCheck: boolean
    versionVerification: boolean
  }
}

interface InstallationPlan {
  hostId: string
  components: Array<{
    name: string
    currentState: ComponentDetectionResult
    targetVersion: string
    strategy: InstallationStrategy
    estimatedDuration: number
    riskLevel: 'low' | 'medium' | 'high'
    dependencies: string[]
  }>
  executionOrder: string[]
  totalEstimatedTime: number
  overallRiskLevel: 'low' | 'medium' | 'high'
  warnings: string[]
  recommendations: string[]
}

interface InstallationStrategyManagerProps {
  hostId: string
  components: string[]
  onPlanReady?: (plan: InstallationPlan) => void
  onExecute?: (plan: InstallationPlan) => void
  className?: string
}

export function InstallationStrategyManager({
  hostId,
  components,
  onPlanReady,
  onExecute,
  className
}: InstallationStrategyManagerProps) {
  const [detectionResults, setDetectionResults] = useState<ComponentDetectionResult[]>([])
  const [installationPlan, setInstallationPlan] = useState<InstallationPlan | null>(null)
  const [globalStrategy, setGlobalStrategy] = useState<Partial<InstallationStrategy>>({
    backupStrategy: {
      enabled: true,
      configBackup: true,
      dataBackup: true,
      backupLocation: '/opt/monitoring/backups',
      retentionDays: 30
    },
    migrationStrategy: {
      enabled: true,
      configMigration: true,
      dataMigration: false
    },
    rollbackStrategy: {
      enabled: true,
      autoRollback: false,
      rollbackTimeout: 300,
      healthCheckEnabled: true
    },
    installationMethod: 'docker',
    serviceManagement: {
      stopBeforeInstall: true,
      startAfterInstall: true,
      restartExisting: false,
      gracefulShutdown: true,
      shutdownTimeout: 30
    },
    validation: {
      preInstallCheck: true,
      postInstallCheck: true,
      healthCheck: true,
      versionVerification: true
    }
  })
  const [detecting, setDetecting] = useState(false)
  const [planning, setPlanning] = useState(false)
  const [activeTab, setActiveTab] = useState("detection")

  // 检测组件当前状态
  const detectComponentStates = async () => {
    setDetecting(true)
    try {
      const response = await fetch('/api/monitoring/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostId,
          components
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setDetectionResults(result.data)
        setActiveTab("strategy")
      }
    } catch (error) {
      console.error('Error detecting component states:', error)
    } finally {
      setDetecting(false)
    }
  }

  // 生成安装计划
  const generateInstallationPlan = async () => {
    setPlanning(true)
    try {
      const response = await fetch('/api/monitoring/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostId,
          detectionResults,
          globalStrategy,
          targetVersions: components.reduce((acc, comp) => ({ ...acc, [comp]: 'latest' }), {})
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setInstallationPlan(result.data)
        setActiveTab("plan")
        onPlanReady?.(result.data)
      }
    } catch (error) {
      console.error('Error generating installation plan:', error)
    } finally {
      setPlanning(false)
    }
  }

  // 执行安装计划
  const executePlan = () => {
    if (installationPlan) {
      onExecute?.(installationPlan)
    }
  }

  // 获取组件状态图标
  const getStatusIcon = (result: ComponentDetectionResult) => {
    if (!result.detected) {
      return <Package className="h-4 w-4 text-gray-400" />
    }
    
    switch (result.installationType) {
      case 'docker':
        return <Package className="h-4 w-4 text-blue-500" />
      case 'binary':
        return <Terminal className="h-4 w-4 text-green-500" />
      case 'systemd':
        return <Settings className="h-4 w-4 text-purple-500" />
      case 'package':
        return <Download className="h-4 w-4 text-orange-500" />
      default:
        return <Package className="h-4 w-4 text-gray-400" />
    }
  }

  // 获取推荐动作图标
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'fresh_install':
        return <Download className="h-4 w-4 text-green-500" />
      case 'upgrade':
        return <ArrowUp className="h-4 w-4 text-blue-500" />
      case 'reinstall':
        return <RefreshCw className="h-4 w-4 text-orange-500" />
      case 'migrate':
        return <Upload className="h-4 w-4 text-purple-500" />
      case 'skip':
        return <SkipForward className="h-4 w-4 text-gray-500" />
      default:
        return <Settings className="h-4 w-4 text-gray-400" />
    }
  }

  // 获取风险级别颜色
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'high':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  useEffect(() => {
    if (hostId && components.length > 0) {
      detectComponentStates()
    }
  }, [hostId, components])

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            智能安装策略管理器
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="detection">组件检测</TabsTrigger>
              <TabsTrigger value="strategy">策略配置</TabsTrigger>
              <TabsTrigger value="plan">安装计划</TabsTrigger>
              <TabsTrigger value="execution">执行监控</TabsTrigger>
            </TabsList>

            {/* 组件检测 */}
            <TabsContent value="detection" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">组件状态检测</h3>
                <Button 
                  onClick={detectComponentStates} 
                  disabled={detecting}
                  className="flex items-center gap-2"
                >
                  {detecting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {detecting ? '检测中...' : '重新检测'}
                </Button>
              </div>

              <div className="grid gap-4">
                {detectionResults.map((result) => (
                  <Card key={result.name} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result)}
                        <div>
                          <h4 className="font-medium">{result.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {result.detected ? (
                              <>
                                已安装 - {result.installationType} ({result.currentVersion})
                              </>
                            ) : (
                              '未安装'
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge variant={result.detected ? "default" : "secondary"}>
                        {result.detected ? '已安装' : '未安装'}
                      </Badge>
                    </div>

                    {result.detected && (
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        {result.configPaths && (
                          <div>
                            <span className="font-medium">配置路径:</span>
                            <div className="text-muted-foreground">
                              {result.configPaths.join(', ')}
                            </div>
                          </div>
                        )}
                        {result.dataPaths && (
                          <div>
                            <span className="font-medium">数据路径:</span>
                            <div className="text-muted-foreground">
                              {result.dataPaths.join(', ')}
                            </div>
                          </div>
                        )}
                        {result.ports && (
                          <div>
                            <span className="font-medium">端口:</span>
                            <div className="text-muted-foreground">
                              {result.ports.join(', ')}
                            </div>
                          </div>
                        )}
                        {result.dependencies && (
                          <div>
                            <span className="font-medium">依赖:</span>
                            <div className="text-muted-foreground">
                              {result.dependencies.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* 策略配置 */}
            <TabsContent value="strategy" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">全局安装策略</h3>
                <Button 
                  onClick={generateInstallationPlan} 
                  disabled={planning || detectionResults.length === 0}
                  className="flex items-center gap-2"
                >
                  {planning ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {planning ? '生成中...' : '生成安装计划'}
                </Button>
              </div>

              <div className="grid gap-6">
                {/* 备份策略 */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3">备份策略</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="backup-enabled">启用备份</Label>
                      <Switch
                        id="backup-enabled"
                        checked={globalStrategy.backupStrategy?.enabled}
                        onCheckedChange={(checked) =>
                          setGlobalStrategy(prev => ({
                            ...prev,
                            backupStrategy: { ...prev.backupStrategy!, enabled: checked }
                          }))
                        }
                      />
                    </div>
                    {globalStrategy.backupStrategy?.enabled && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="config-backup">配置文件备份</Label>
                          <Switch
                            id="config-backup"
                            checked={globalStrategy.backupStrategy?.configBackup}
                            onCheckedChange={(checked) =>
                              setGlobalStrategy(prev => ({
                                ...prev,
                                backupStrategy: { ...prev.backupStrategy!, configBackup: checked }
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="data-backup">数据文件备份</Label>
                          <Switch
                            id="data-backup"
                            checked={globalStrategy.backupStrategy?.dataBackup}
                            onCheckedChange={(checked) =>
                              setGlobalStrategy(prev => ({
                                ...prev,
                                backupStrategy: { ...prev.backupStrategy!, dataBackup: checked }
                              }))
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* 迁移策略 */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3">迁移策略</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="migration-enabled">启用配置迁移</Label>
                      <Switch
                        id="migration-enabled"
                        checked={globalStrategy.migrationStrategy?.enabled}
                        onCheckedChange={(checked) =>
                          setGlobalStrategy(prev => ({
                            ...prev,
                            migrationStrategy: { ...prev.migrationStrategy!, enabled: checked }
                          }))
                        }
                      />
                    </div>
                    {globalStrategy.migrationStrategy?.enabled && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="config-migration">配置迁移</Label>
                          <Switch
                            id="config-migration"
                            checked={globalStrategy.migrationStrategy?.configMigration}
                            onCheckedChange={(checked) =>
                              setGlobalStrategy(prev => ({
                                ...prev,
                                migrationStrategy: { ...prev.migrationStrategy!, configMigration: checked }
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="data-migration">数据迁移</Label>
                          <Switch
                            id="data-migration"
                            checked={globalStrategy.migrationStrategy?.dataMigration}
                            onCheckedChange={(checked) =>
                              setGlobalStrategy(prev => ({
                                ...prev,
                                migrationStrategy: { ...prev.migrationStrategy!, dataMigration: checked }
                              }))
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* 回滚策略 */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3">回滚策略</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rollback-enabled">启用回滚</Label>
                      <Switch
                        id="rollback-enabled"
                        checked={globalStrategy.rollbackStrategy?.enabled}
                        onCheckedChange={(checked) =>
                          setGlobalStrategy(prev => ({
                            ...prev,
                            rollbackStrategy: { ...prev.rollbackStrategy!, enabled: checked }
                          }))
                        }
                      />
                    </div>
                    {globalStrategy.rollbackStrategy?.enabled && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-rollback">自动回滚</Label>
                        <Switch
                          id="auto-rollback"
                          checked={globalStrategy.rollbackStrategy?.autoRollback}
                          onCheckedChange={(checked) =>
                            setGlobalStrategy(prev => ({
                              ...prev,
                              rollbackStrategy: { ...prev.rollbackStrategy!, autoRollback: checked }
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* 安装方法 */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3">安装方法</h4>
                  <Select
                    value={globalStrategy.installationMethod}
                    onValueChange={(value: 'docker' | 'binary' | 'package') =>
                      setGlobalStrategy(prev => ({ ...prev, installationMethod: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择安装方法" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="docker">Docker 容器</SelectItem>
                      <SelectItem value="binary">二进制文件</SelectItem>
                      <SelectItem value="package">系统包管理器</SelectItem>
                    </SelectContent>
                  </Select>
                </Card>
              </div>
            </TabsContent>

            {/* 安装计划 */}
            <TabsContent value="plan" className="space-y-4">
              {installationPlan ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">安装计划</h3>
                    <div className="flex items-center gap-4">
                      <Badge className={getRiskColor(installationPlan.overallRiskLevel)}>
                        风险等级: {installationPlan.overallRiskLevel}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        预计时间: {Math.round(installationPlan.totalEstimatedTime / 60)} 分钟
                      </span>
                      <Button onClick={executePlan} className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        执行计划
                      </Button>
                    </div>
                  </div>

                  {/* 警告和建议 */}
                  {installationPlan.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <strong>警告:</strong>
                          {installationPlan.warnings.map((warning, index) => (
                            <div key={index}>• {warning}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {installationPlan.recommendations.length > 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <strong>建议:</strong>
                          {installationPlan.recommendations.map((rec, index) => (
                            <div key={index}>• {rec}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* 执行顺序 */}
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">执行顺序</h4>
                    <div className="space-y-2">
                      {installationPlan.executionOrder.map((componentName, index) => {
                        const component = installationPlan.components.find(c => c.name === componentName)
                        return (
                          <div key={componentName} className="flex items-center gap-3 p-2 rounded border">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm flex items-center justify-center">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {getActionIcon(component?.strategy.action || 'fresh_install')}
                                <span className="font-medium">{componentName}</span>
                                <Badge variant="outline">
                                  {component?.strategy.action}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {component?.currentState.currentVersion ? 
                                  `${component.currentState.currentVersion} → ${component.targetVersion}` :
                                  `安装 ${component?.targetVersion}`
                                }
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {Math.round((component?.estimatedDuration || 0) / 60)} 分钟
                              </div>
                              <Badge className={getRiskColor(component?.riskLevel || 'low')}>
                                {component?.riskLevel}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  请先完成组件检测和策略配置，然后生成安装计划
                </div>
              )}
            </TabsContent>

            {/* 执行监控 */}
            <TabsContent value="execution" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                执行监控功能将在计划执行时显示
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}