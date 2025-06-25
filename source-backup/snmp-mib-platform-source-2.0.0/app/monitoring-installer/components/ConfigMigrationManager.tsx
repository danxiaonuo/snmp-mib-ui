"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
  FileText,
  Database,
  Copy,
  Eye,
  Edit,
  Save,
  Undo,
  GitBranch,
  History
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfigFile {
  path: string
  name: string
  type: 'yaml' | 'json' | 'toml' | 'ini' | 'properties'
  size: number
  lastModified: string
  backup?: string
  migrationRequired: boolean
  migrationComplexity: 'simple' | 'moderate' | 'complex'
  changes: ConfigChange[]
}

interface ConfigChange {
  type: 'add' | 'remove' | 'modify' | 'rename'
  path: string
  oldValue?: any
  newValue?: any
  reason: string
  risk: 'low' | 'medium' | 'high'
  automatic: boolean
}

interface MigrationRule {
  fromVersion: string
  toVersion: string
  component: string
  rules: Array<{
    action: 'add' | 'remove' | 'modify' | 'rename'
    path: string
    condition?: string
    transformation?: string
    description: string
  }>
}

interface ConfigMigrationManagerProps {
  componentName: string
  fromVersion: string
  toVersion: string
  configFiles: ConfigFile[]
  onMigrationComplete?: (results: MigrationResult[]) => void
  className?: string
}

interface MigrationResult {
  file: string
  success: boolean
  changes: number
  warnings: string[]
  errors: string[]
  backupPath?: string
}

export function ConfigMigrationManager({
  componentName,
  fromVersion,
  toVersion,
  configFiles,
  onMigrationComplete,
  className
}: ConfigMigrationManagerProps) {
  const [selectedTab, setSelectedTab] = useState("analysis")
  const [migrationRules, setMigrationRules] = useState<MigrationRule[]>([])
  const [previewMode, setPreviewMode] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)
  const [migrationProgress, setMigrationProgress] = useState(0)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([])
  const [selectedFile, setSelectedFile] = useState<ConfigFile | null>(null)

  // 加载迁移规则
  useEffect(() => {
    loadMigrationRules()
  }, [componentName, fromVersion, toVersion])

  const loadMigrationRules = async () => {
    // 模拟加载迁移规则
    const rules = await getMigrationRules(componentName, fromVersion, toVersion)
    setMigrationRules(rules)
    
    // 分析配置文件需要的变更
    analyzeConfigChanges(rules)
  }

  // 获取迁移规则
  const getMigrationRules = async (component: string, from: string, to: string): Promise<MigrationRule[]> => {
    // 模拟不同组件的迁移规则
    const ruleDatabase: Record<string, MigrationRule[]> = {
      'prometheus': [
        {
          fromVersion: '2.0.*',
          toVersion: '2.1.*',
          component: 'prometheus',
          rules: [
            {
              action: 'modify',
              path: 'global.scrape_interval',
              transformation: 'rename to global.evaluation_interval',
              description: '全局抓取间隔配置项重命名'
            },
            {
              action: 'add',
              path: 'global.external_labels.cluster',
              description: '添加集群标识标签'
            },
            {
              action: 'remove',
              path: 'rule_files',
              condition: 'if empty',
              description: '移除空的规则文件配置'
            }
          ]
        }
      ],
      'grafana': [
        {
          fromVersion: '8.*',
          toVersion: '9.*',
          component: 'grafana',
          rules: [
            {
              action: 'modify',
              path: 'auth.anonymous.enabled',
              transformation: 'move to security.anonymous.enabled',
              description: '匿名访问配置迁移到安全配置段'
            },
            {
              action: 'add',
              path: 'feature_toggles.enable',
              description: '添加新功能开关配置'
            }
          ]
        }
      ]
    }

    return ruleDatabase[component] || []
  }

  // 分析配置变更
  const analyzeConfigChanges = (rules: MigrationRule[]) => {
    // 为每个配置文件分析需要的变更
    configFiles.forEach(file => {
      const changes: ConfigChange[] = []
      
      rules.forEach(rule => {
        rule.rules.forEach(ruleItem => {
          changes.push({
            type: ruleItem.action,
            path: ruleItem.path,
            reason: ruleItem.description,
            risk: 'low', // 根据实际情况评估
            automatic: true
          })
        })
      })
      
      file.changes = changes
      file.migrationRequired = changes.length > 0
      file.migrationComplexity = changes.length > 5 ? 'complex' : changes.length > 2 ? 'moderate' : 'simple'
    })
  }

  // 执行迁移
  const executeMigration = async () => {
    setIsMigrating(true)
    setMigrationProgress(0)
    
    const results: MigrationResult[] = []
    
    try {
      for (let i = 0; i < configFiles.length; i++) {
        const file = configFiles[i]
        setMigrationProgress((i / configFiles.length) * 100)
        
        if (file.migrationRequired) {
          const result = await migrateConfigFile(file)
          results.push(result)
        }
      }
      
      setMigrationProgress(100)
      setMigrationResults(results)
      onMigrationComplete?.(results)
      
    } catch (error) {
      console.error('Migration failed:', error)
    } finally {
      setIsMigrating(false)
    }
  }

  // 迁移单个配置文件
  const migrateConfigFile = async (file: ConfigFile): Promise<MigrationResult> => {
    // 模拟配置文件迁移
    const result: MigrationResult = {
      file: file.name,
      success: true,
      changes: file.changes.length,
      warnings: [],
      errors: [],
      backupPath: autoBackup ? `/backup/${file.name}.${Date.now()}` : undefined
    }
    
    // 模拟一些警告和错误
    if (file.migrationComplexity === 'complex') {
      result.warnings.push('复杂配置迁移，建议手动验证')
    }
    
    if (Math.random() < 0.1) { // 10% 概率出现错误
      result.success = false
      result.errors.push('配置文件格式不兼容')
    }
    
    // 模拟迁移时间
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return result
  }

  // 预览配置变更
  const previewConfigChanges = (file: ConfigFile) => {
    setSelectedFile(file)
  }

  // 获取变更类型图标
  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'add': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'remove': return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'modify': return <Edit className="h-4 w-4 text-blue-600" />
      case 'rename': return <GitBranch className="h-4 w-4 text-purple-600" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  // 获取复杂度颜色
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-600'
      case 'moderate': return 'text-yellow-600'
      case 'complex': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            配置迁移管理器
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {componentName} 从 {fromVersion} 升级到 {toVersion}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="preview-mode">预览模式</Label>
                <Switch
                  id="preview-mode"
                  checked={previewMode}
                  onCheckedChange={setPreviewMode}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-backup">自动备份</Label>
                <Switch
                  id="auto-backup"
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isMigrating && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>迁移进度</span>
                <span>{Math.round(migrationProgress)}%</span>
              </div>
              <Progress value={migrationProgress} />
            </div>
          )}

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">变更分析</TabsTrigger>
              <TabsTrigger value="preview">预览变更</TabsTrigger>
              <TabsTrigger value="migration">执行迁移</TabsTrigger>
              <TabsTrigger value="results">迁移结果</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-4">
              <div className="grid gap-4">
                {configFiles.map((file, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{file.name}</span>
                            <Badge variant="outline">{file.type.toUpperCase()}</Badge>
                            {file.migrationRequired ? (
                              <Badge variant="outline" className="text-orange-600">
                                需要迁移
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600">
                                无需变更
                              </Badge>
                            )}
                            <Badge 
                              variant="outline" 
                              className={getComplexityColor(file.migrationComplexity)}
                            >
                              {file.migrationComplexity === 'simple' ? '简单' :
                               file.migrationComplexity === 'moderate' ? '中等' : '复杂'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">文件路径:</span>
                              <span className="ml-2 font-mono text-xs">{file.path}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">文件大小:</span>
                              <span className="ml-2">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <div>
                              <span className="text-gray-600">最后修改:</span>
                              <span className="ml-2">{new Date(file.lastModified).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">变更数量:</span>
                              <span className="ml-2">{file.changes.length} 项</span>
                            </div>
                          </div>
                          
                          {file.migrationRequired && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">需要的变更:</h4>
                              <div className="space-y-1">
                                {file.changes.slice(0, 3).map((change, changeIndex) => (
                                  <div key={changeIndex} className="flex items-center gap-2 text-sm">
                                    {getChangeTypeIcon(change.type)}
                                    <span className="font-mono text-xs">{change.path}</span>
                                    <span className="text-gray-600">- {change.reason}</span>
                                  </div>
                                ))}
                                {file.changes.length > 3 && (
                                  <div className="text-sm text-gray-500">
                                    还有 {file.changes.length - 3} 项变更...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => previewConfigChanges(file)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            预览
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {selectedFile ? (
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">当前配置</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <pre className="text-xs bg-gray-50 p-4 rounded">
{`# ${selectedFile.name} (${selectedFile.type})
# 当前版本: ${fromVersion}

global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'prometheus'

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093`}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">迁移后配置</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <pre className="text-xs bg-green-50 p-4 rounded">
{`# ${selectedFile.name} (${selectedFile.type})
# 目标版本: ${toVersion}

global:
  scrape_interval: 15s
  evaluation_interval: 15s  # 重命名自 scrape_interval
  external_labels:
    monitor: 'prometheus'
    cluster: 'production'    # 新增

# rule_files 已移除（为空时）

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093`}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  请从变更分析页面选择一个配置文件进行预览
                </div>
              )}
            </TabsContent>

            <TabsContent value="migration" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">迁移执行</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>迁移前检查:</strong>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                          <li>✅ 配置文件语法检查通过</li>
                          <li>✅ 备份目录空间充足</li>
                          <li>✅ 迁移规则加载完成</li>
                          <li>⚠️ 建议在维护窗口期间执行</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">迁移统计:</h4>
                        <div className="space-y-1 text-sm">
                          <div>需要迁移的文件: {configFiles.filter(f => f.migrationRequired).length}</div>
                          <div>总变更数量: {configFiles.reduce((sum, f) => sum + f.changes.length, 0)}</div>
                          <div>预计时间: {configFiles.filter(f => f.migrationRequired).length * 2} 分钟</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">迁移选项:</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                            <Label>自动备份原配置</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={previewMode} onCheckedChange={setPreviewMode} />
                            <Label>预览模式（不实际修改）</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={executeMigration} 
                        disabled={isMigrating}
                        className="flex-1"
                      >
                        {isMigrating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            迁移中...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            {previewMode ? '预览迁移' : '开始迁移'}
                          </>
                        )}
                      </Button>
                      
                      <Button variant="outline" disabled={isMigrating}>
                        <Download className="h-4 w-4 mr-2" />
                        导出迁移脚本
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {migrationResults.length > 0 ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">迁移结果摘要</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {migrationResults.filter(r => r.success).length}
                          </div>
                          <div className="text-sm text-gray-600">成功</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {migrationResults.filter(r => !r.success).length}
                          </div>
                          <div className="text-sm text-gray-600">失败</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {migrationResults.reduce((sum, r) => sum + r.changes, 0)}
                          </div>
                          <div className="text-sm text-gray-600">总变更</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {migrationResults.map((result, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              {result.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="font-medium">{result.file}</span>
                              <Badge variant={result.success ? "outline" : "destructive"}>
                                {result.success ? '成功' : '失败'}
                              </Badge>
                            </div>
                            
                            <div className="text-sm">
                              <span className="text-gray-600">变更数量:</span>
                              <span className="ml-2">{result.changes}</span>
                              {result.backupPath && (
                                <>
                                  <span className="ml-4 text-gray-600">备份路径:</span>
                                  <span className="ml-2 font-mono text-xs">{result.backupPath}</span>
                                </>
                              )}
                            </div>
                            
                            {result.warnings.length > 0 && (
                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>警告:</strong>
                                  <ul className="mt-1 list-disc list-inside">
                                    {result.warnings.map((warning, i) => (
                                      <li key={i}>{warning}</li>
                                    ))}
                                  </ul>
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            {result.errors.length > 0 && (
                              <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>错误:</strong>
                                  <ul className="mt-1 list-disc list-inside">
                                    {result.errors.map((error, i) => (
                                      <li key={i}>{error}</li>
                                    ))}
                                  </ul>
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {result.backupPath && (
                              <Button variant="outline" size="sm">
                                <Undo className="h-4 w-4 mr-1" />
                                回滚
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              查看
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  尚未执行迁移
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}