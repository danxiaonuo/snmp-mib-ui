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
import { Progress } from "@/components/ui/progress"
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
  SkipForward,
  Database,
  FileText,
  HardDrive,
  Cpu,
  Network,
  Eye,
  CheckSquare,
  AlertCircle as AlertIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ComponentDetectionResult {
  name: string
  detected: boolean
  currentVersion?: string
  installationType?: 'docker' | 'binary' | 'systemd' | 'package' | 'unknown'
  configPaths?: string[]
  dataPaths?: string[]
  serviceName?: string
  containerName?: string
  ports?: number[]
  dependencies?: string[]
  conflicts?: string[]
  healthStatus?: 'healthy' | 'unhealthy' | 'unknown'
  lastSeen?: string
  resourceUsage?: {
    cpu: number
    memory: number
    disk: number
  }
}

interface InstallationDecision {
  action: 'fresh_install' | 'upgrade' | 'reinstall' | 'migrate' | 'skip' | 'repair'
  reason: string
  riskLevel: 'low' | 'medium' | 'high'
  estimatedTime: number // 分钟
  requiredBackup: boolean
  configMigration: boolean
  dataPreservation: boolean
  rollbackPossible: boolean
  prerequisites: string[]
  warnings: string[]
  recommendations: string[]
}

interface SmartInstallationDecisionEngineProps {
  hostId: string
  components: string[]
  targetVersions: Record<string, string>
  onDecisionMade?: (decisions: Record<string, InstallationDecision>) => void
  className?: string
}

export function SmartInstallationDecisionEngine({
  hostId,
  components,
  targetVersions,
  onDecisionMade,
  className
}: SmartInstallationDecisionEngineProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [detectionResults, setDetectionResults] = useState<Record<string, ComponentDetectionResult>>({})
  const [installationDecisions, setInstallationDecisions] = useState<Record<string, InstallationDecision>>({})
  const [selectedTab, setSelectedTab] = useState("detection")
  const [autoDecisionMode, setAutoDecisionMode] = useState(true)
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced')

  // 开始智能分析
  const startAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // 步骤1: 检测现有组件
      setAnalysisProgress(20)
      const detectionResults = await detectExistingComponents()
      setDetectionResults(detectionResults)

      // 步骤2: 分析依赖关系
      setAnalysisProgress(40)
      await analyzeDependencies(detectionResults)

      // 步骤3: 评估风险
      setAnalysisProgress(60)
      const riskAssessment = await assessInstallationRisks(detectionResults)

      // 步骤4: 生成安装决策
      setAnalysisProgress(80)
      const decisions = await generateInstallationDecisions(detectionResults, riskAssessment)
      setInstallationDecisions(decisions)

      // 步骤5: 完成分析
      setAnalysisProgress(100)
      onDecisionMade?.(decisions)

    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 检测现有组件
  const detectExistingComponents = async (): Promise<Record<string, ComponentDetectionResult>> => {
    const results: Record<string, ComponentDetectionResult> = {}

    for (const component of components) {
      // 模拟组件检测
      const detectionResult = await mockComponentDetection(component)
      results[component] = detectionResult
    }

    return results
  }

  // 模拟组件检测
  const mockComponentDetection = async (componentName: string): Promise<ComponentDetectionResult> => {
    // 模拟不同的检测场景
    const scenarios = [
      // 场景1: 未安装
      {
        name: componentName,
        detected: false,
        installationType: undefined,
        healthStatus: 'unknown' as const
      },
      // 场景2: Docker安装，运行正常
      {
        name: componentName,
        detected: true,
        currentVersion: '2.0.5',
        installationType: 'docker' as const,
        configPaths: [`/etc/${componentName}/config.yml`],
        dataPaths: [`/var/lib/${componentName}`],
        containerName: componentName,
        ports: [9090, 9091],
        healthStatus: 'healthy' as const,
        lastSeen: new Date().toISOString(),
        resourceUsage: {
          cpu: 15,
          memory: 256,
          disk: 1024
        }
      },
      // 场景3: 二进制安装，版本较旧
      {
        name: componentName,
        detected: true,
        currentVersion: '1.8.2',
        installationType: 'binary' as const,
        configPaths: [`/etc/${componentName}/config.yml`],
        serviceName: componentName,
        ports: [9090],
        healthStatus: 'healthy' as const,
        lastSeen: new Date().toISOString(),
        resourceUsage: {
          cpu: 8,
          memory: 128,
          disk: 512
        }
      },
      // 场景4: 损坏的安装
      {
        name: componentName,
        detected: true,
        currentVersion: 'unknown',
        installationType: 'unknown' as const,
        healthStatus: 'unhealthy' as const,
        lastSeen: new Date(Date.now() - 86400000).toISOString(), // 1天前
        conflicts: ['Port 9090 already in use by another process']
      }
    ]

    // 随机选择一个场景
    return scenarios[Math.floor(Math.random() * scenarios.length)]
  }

  // 分析依赖关系
  const analyzeDependencies = async (results: Record<string, ComponentDetectionResult>) => {
    // 这里可以分析组件间的依赖关系
    // 例如：Grafana 依赖 Prometheus 或 VictoriaMetrics
    console.log('Analyzing dependencies...', results)
  }

  // 评估安装风险
  const assessInstallationRisks = async (results: Record<string, ComponentDetectionResult>) => {
    // 评估各种风险因素
    return {
      dataLossRisk: 'low',
      serviceInterruptionRisk: 'medium',
      configurationComplexity: 'low',
      rollbackDifficulty: 'low'
    }
  }

  // 生成安装决策
  const generateInstallationDecisions = async (
    results: Record<string, ComponentDetectionResult>,
    riskAssessment: any
  ): Promise<Record<string, InstallationDecision>> => {
    const decisions: Record<string, InstallationDecision> = {}

    for (const [componentName, result] of Object.entries(results)) {
      const targetVersion = targetVersions[componentName] || 'latest'
      decisions[componentName] = generateDecisionForComponent(result, targetVersion)
    }

    return decisions
  }

  // 为单个组件生成决策
  const generateDecisionForComponent = (
    result: ComponentDetectionResult,
    targetVersion: string
  ): InstallationDecision => {
    if (!result.detected) {
      // 未安装 - 全新安装
      return {
        action: 'fresh_install',
        reason: '组件未安装，将执行全新安装',
        riskLevel: 'low',
        estimatedTime: 5,
        requiredBackup: false,
        configMigration: false,
        dataPreservation: false,
        rollbackPossible: true,
        prerequisites: ['确保端口可用', '检查磁盘空间'],
        warnings: [],
        recommendations: ['建议使用Docker安装以便于管理']
      }
    }

    if (result.healthStatus === 'unhealthy' || result.installationType === 'unknown') {
      // 损坏的安装 - 重新安装
      return {
        action: 'reinstall',
        reason: '检测到组件安装损坏或状态异常，建议重新安装',
        riskLevel: 'medium',
        estimatedTime: 8,
        requiredBackup: true,
        configMigration: true,
        dataPreservation: true,
        rollbackPossible: true,
        prerequisites: ['备份现有配置', '停止相关服务'],
        warnings: ['重新安装可能导致短暂的服务中断'],
        recommendations: ['建议在维护窗口期间执行']
      }
    }

    if (result.currentVersion && compareVersions(result.currentVersion, targetVersion) < 0) {
      // 需要升级
      return {
        action: 'upgrade',
        reason: `当前版本 ${result.currentVersion} 低于目标版本 ${targetVersion}，建议升级`,
        riskLevel: 'medium',
        estimatedTime: 10,
        requiredBackup: true,
        configMigration: true,
        dataPreservation: true,
        rollbackPossible: true,
        prerequisites: ['备份配置和数据', '检查升级兼容性'],
        warnings: ['升级过程中服务将短暂中断'],
        recommendations: ['建议先在测试环境验证升级过程']
      }
    }

    if (result.currentVersion && compareVersions(result.currentVersion, targetVersion) > 0) {
      // 版本较新 - 可选择降级或跳过
      return {
        action: 'skip',
        reason: `当前版本 ${result.currentVersion} 高于目标版本 ${targetVersion}，建议跳过`,
        riskLevel: 'low',
        estimatedTime: 0,
        requiredBackup: false,
        configMigration: false,
        dataPreservation: true,
        rollbackPossible: false,
        prerequisites: [],
        warnings: [],
        recommendations: ['如需降级，请谨慎操作并充分测试']
      }
    }

    // 版本相同 - 跳过
    return {
      action: 'skip',
      reason: `当前版本 ${result.currentVersion} 与目标版本相同，无需操作`,
      riskLevel: 'low',
      estimatedTime: 0,
      requiredBackup: false,
      configMigration: false,
      dataPreservation: true,
      rollbackPossible: false,
      prerequisites: [],
      warnings: [],
      recommendations: ['可选择执行健康检查以确保服务正常']
    }
  }

  // 简单的版本比较
  const compareVersions = (version1: string, version2: string): number => {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0
      
      if (v1Part < v2Part) return -1
      if (v1Part > v2Part) return 1
    }
    
    return 0
  }

  // 获取动作图标
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'fresh_install': return Download
      case 'upgrade': return ArrowUp
      case 'reinstall': return RefreshCw
      case 'migrate': return Database
      case 'repair': return Settings
      case 'skip': return SkipForward
      default: return Package
    }
  }

  // 获取风险级别颜色
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  // 获取安装类型图标
  const getInstallationTypeIcon = (type?: string) => {
    switch (type) {
      case 'docker': return Package
      case 'binary': return Terminal
      case 'systemd': return Settings
      case 'package': return Download
      default: return HelpCircle
    }
  }

  useEffect(() => {
    if (components.length > 0) {
      startAnalysis()
    }
  }, [components, hostId])

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            智能安装决策引擎
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-decision">自动决策模式</Label>
                <Switch
                  id="auto-decision"
                  checked={autoDecisionMode}
                  onCheckedChange={setAutoDecisionMode}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label>风险容忍度:</Label>
                <Select value={riskTolerance} onValueChange={(value: any) => setRiskTolerance(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">保守</SelectItem>
                    <SelectItem value="balanced">平衡</SelectItem>
                    <SelectItem value="aggressive">激进</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={startAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  重新分析
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAnalyzing && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>分析进度</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} />
            </div>
          )}

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="detection">组件检测</TabsTrigger>
              <TabsTrigger value="decisions">安装决策</TabsTrigger>
              <TabsTrigger value="summary">执行摘要</TabsTrigger>
            </TabsList>

            <TabsContent value="detection" className="space-y-4">
              <div className="grid gap-4">
                {Object.entries(detectionResults).map(([componentName, result]) => {
                  const InstallationTypeIcon = getInstallationTypeIcon(result.installationType)
                  
                  return (
                    <Card key={componentName}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <InstallationTypeIcon className="h-4 w-4" />
                              <span className="font-medium">{result.name}</span>
                              {result.detected ? (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  已检测
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-600">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  未安装
                                </Badge>
                              )}
                            </div>
                            
                            {result.detected && (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">当前版本:</span>
                                  <span className="ml-2 font-mono">{result.currentVersion || 'unknown'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">安装类型:</span>
                                  <span className="ml-2">{result.installationType || 'unknown'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">健康状态:</span>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      result.healthStatus === 'healthy' ? 'text-green-600' :
                                      result.healthStatus === 'unhealthy' ? 'text-red-600' : 'text-gray-600'
                                    )}
                                  >
                                    {result.healthStatus === 'healthy' ? '健康' :
                                     result.healthStatus === 'unhealthy' ? '异常' : '未知'}
                                  </Badge>
                                </div>
                                {result.resourceUsage && (
                                  <div>
                                    <span className="text-gray-600">资源使用:</span>
                                    <span className="ml-2">
                                      CPU: {result.resourceUsage.cpu}%, 
                                      内存: {result.resourceUsage.memory}MB
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {result.conflicts && result.conflicts.length > 0 && (
                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>冲突检测:</strong>
                                  <ul className="mt-1 list-disc list-inside">
                                    {result.conflicts.map((conflict, index) => (
                                      <li key={index}>{conflict}</li>
                                    ))}
                                  </ul>
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="decisions" className="space-y-4">
              <div className="grid gap-4">
                {Object.entries(installationDecisions).map(([componentName, decision]) => {
                  const ActionIcon = getActionIcon(decision.action)
                  
                  return (
                    <Card key={componentName}>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <ActionIcon className="h-4 w-4" />
                                <span className="font-medium">{componentName}</span>
                                <Badge variant="outline">
                                  {decision.action === 'fresh_install' ? '全新安装' :
                                   decision.action === 'upgrade' ? '升级' :
                                   decision.action === 'reinstall' ? '重新安装' :
                                   decision.action === 'migrate' ? '迁移' :
                                   decision.action === 'repair' ? '修复' : '跳过'}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={getRiskLevelColor(decision.riskLevel)}
                                >
                                  {decision.riskLevel === 'low' ? '低风险' :
                                   decision.riskLevel === 'medium' ? '中风险' : '高风险'}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600">{decision.reason}</p>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">预计时间:</span>
                                  <span className="ml-2">{decision.estimatedTime} 分钟</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">需要备份:</span>
                                  <span className="ml-2">{decision.requiredBackup ? '是' : '否'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">配置迁移:</span>
                                  <span className="ml-2">{decision.configMigration ? '是' : '否'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">可回滚:</span>
                                  <span className="ml-2">{decision.rollbackPossible ? '是' : '否'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {decision.prerequisites.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">前置条件:</h4>
                              <ul className="text-sm text-gray-600 list-disc list-inside">
                                {decision.prerequisites.map((prereq, index) => (
                                  <li key={index}>{prereq}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {decision.warnings.length > 0 && (
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>注意事项:</strong>
                                <ul className="mt-1 list-disc list-inside">
                                  {decision.warnings.map((warning, index) => (
                                    <li key={index}>{warning}</li>
                                  ))}
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {decision.recommendations.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">建议:</h4>
                              <ul className="text-sm text-blue-600 list-disc list-inside">
                                {decision.recommendations.map((recommendation, index) => (
                                  <li key={index}>{recommendation}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">执行摘要</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Object.values(installationDecisions).filter(d => d.action === 'fresh_install').length}
                        </div>
                        <div className="text-sm text-gray-600">全新安装</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Object.values(installationDecisions).filter(d => d.action === 'upgrade').length}
                        </div>
                        <div className="text-sm text-gray-600">升级</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {Object.values(installationDecisions).filter(d => d.action === 'reinstall').length}
                        </div>
                        <div className="text-sm text-gray-600">重新安装</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {Object.values(installationDecisions).filter(d => d.action === 'skip').length}
                        </div>
                        <div className="text-sm text-gray-600">跳过</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">总体风险评估:</h4>
                        <div className="flex items-center gap-2">
                          {Object.values(installationDecisions).some(d => d.riskLevel === 'high') ? (
                            <Badge variant="destructive">高风险</Badge>
                          ) : Object.values(installationDecisions).some(d => d.riskLevel === 'medium') ? (
                            <Badge variant="outline" className="text-yellow-600">中风险</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">低风险</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">预计总时间:</h4>
                        <span className="text-lg font-semibold">
                          {Object.values(installationDecisions).reduce((total, d) => total + d.estimatedTime, 0)} 分钟
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">需要备份的组件:</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(installationDecisions)
                            .filter(([_, decision]) => decision.requiredBackup)
                            .map(([componentName, _]) => (
                              <Badge key={componentName} variant="outline">
                                {componentName}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}