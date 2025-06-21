"use client"

// 禁用静态生成，需要客户端功能
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Zap, 
  Server, 
  Database, 
  BarChart3, 
  Bell,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Settings,
  Eye,
  Download,
  Upload,
  Clock,
  Shield,
  Info
} from 'lucide-react'

import { SmartInstallationDecisionEngine } from '../components/SmartInstallationDecisionEngine'
import { ConfigMigrationManager } from '../components/ConfigMigrationManager'
import { IntegratedHostSelection } from '../components/IntegratedHostSelection'
import InstallProgress from '../components/InstallProgress'

// 模拟配置文件数据
const mockConfigFiles = [
  {
    path: '/etc/prometheus/prometheus.yml',
    name: 'prometheus.yml',
    type: 'yaml' as const,
    size: 2048,
    lastModified: new Date().toISOString(),
    migrationRequired: true,
    migrationComplexity: 'moderate' as const,
    changes: [
      {
        type: 'modify' as const,
        path: 'global.scrape_interval',
        reason: '配置项重命名',
        risk: 'low' as const,
        automatic: true
      },
      {
        type: 'add' as const,
        path: 'global.external_labels.cluster',
        reason: '添加集群标识',
        risk: 'low' as const,
        automatic: true
      }
    ]
  },
  {
    path: '/etc/grafana/grafana.ini',
    name: 'grafana.ini',
    type: 'ini' as const,
    size: 4096,
    lastModified: new Date().toISOString(),
    migrationRequired: true,
    migrationComplexity: 'simple' as const,
    changes: [
      {
        type: 'modify' as const,
        path: 'auth.anonymous.enabled',
        reason: '安全配置迁移',
        risk: 'medium' as const,
        automatic: true
      }
    ]
  }
]

export default function SmartInstallPage() {
  const [currentStep, setCurrentStep] = useState<'host' | 'analysis' | 'migration' | 'install' | 'complete'>('host')
  const [selectedHost, setSelectedHost] = useState<any>(null)
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [targetVersions, setTargetVersions] = useState<Record<string, string>>({})
  const [installationDecisions, setInstallationDecisions] = useState<Record<string, any>>({})
  const [migrationResults, setMigrationResults] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)

  // 可用的监控组件
  const availableComponents = [
    { id: 'prometheus', name: 'Prometheus', description: '时序数据库和监控系统', defaultVersion: '2.45.0' },
    { id: 'grafana', name: 'Grafana', description: '数据可视化和仪表板', defaultVersion: '10.1.0' },
    { id: 'victoriametrics', name: 'VictoriaMetrics', description: '高性能时序数据库', defaultVersion: '1.93.0' },
    { id: 'alertmanager', name: 'Alertmanager', description: '告警管理器', defaultVersion: '0.26.0' },
    { id: 'node-exporter', name: 'Node Exporter', description: '系统指标采集器', defaultVersion: '1.6.1' },
    { id: 'categraf', name: 'Categraf', description: '多协议指标采集器', defaultVersion: '0.3.0' }
  ]

  // 初始化目标版本
  useEffect(() => {
    const versions: Record<string, string> = {}
    availableComponents.forEach(comp => {
      versions[comp.id] = comp.defaultVersion
    })
    setTargetVersions(versions)
  }, [])

  // 处理主机选择
  const handleHostSelected = (host: any) => {
    setSelectedHost(host)
    setCurrentStep('analysis')
  }

  // 处理组件选择
  const handleComponentToggle = (componentId: string) => {
    setSelectedComponents(prev => 
      prev.includes(componentId) 
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    )
  }

  // 处理版本变更
  const handleVersionChange = (componentId: string, version: string) => {
    setTargetVersions(prev => ({
      ...prev,
      [componentId]: version
    }))
  }

  // 处理安装决策完成
  const handleDecisionMade = (decisions: Record<string, any>) => {
    setInstallationDecisions(decisions)
  }

  // 处理配置迁移完成
  const handleMigrationComplete = (results: any[]) => {
    setMigrationResults(results)
  }

  // 开始安装流程
  const startInstallation = async () => {
    setIsProcessing(true)
    setProcessProgress(0)
    setCurrentStep('install')

    try {
      // 模拟安装过程
      for (let i = 0; i <= 100; i += 10) {
        setProcessProgress(i)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      setCurrentStep('complete')
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 需要配置迁移的组件
  const componentsNeedingMigration = selectedComponents.filter(comp => 
    installationDecisions[comp]?.configMigration
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">智能监控安装向导</h1>
          <p className="text-gray-600 mt-2">
            自动检测现有组件，智能决策安装策略，无缝配置迁移
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600">
          <Zap className="h-4 w-4 mr-1" />
          智能模式
        </Badge>
      </div>

      {/* 进度指示器 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-8">
              <div className={`flex items-center gap-2 ${currentStep === 'host' ? 'text-blue-600' : currentStep === 'analysis' || currentStep === 'migration' || currentStep === 'install' || currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'host' ? 'bg-blue-100 text-blue-600' : currentStep === 'analysis' || currentStep === 'migration' || currentStep === 'install' || currentStep === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {currentStep === 'analysis' || currentStep === 'migration' || currentStep === 'install' || currentStep === 'complete' ? <CheckCircle className="h-4 w-4" /> : '1'}
                </div>
                <span className="font-medium">选择主机</span>
              </div>
              
              <div className={`flex items-center gap-2 ${currentStep === 'analysis' ? 'text-blue-600' : currentStep === 'migration' || currentStep === 'install' || currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'analysis' ? 'bg-blue-100 text-blue-600' : currentStep === 'migration' || currentStep === 'install' || currentStep === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {currentStep === 'migration' || currentStep === 'install' || currentStep === 'complete' ? <CheckCircle className="h-4 w-4" /> : '2'}
                </div>
                <span className="font-medium">智能分析</span>
              </div>
              
              <div className={`flex items-center gap-2 ${currentStep === 'migration' ? 'text-blue-600' : currentStep === 'install' || currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'migration' ? 'bg-blue-100 text-blue-600' : currentStep === 'install' || currentStep === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {currentStep === 'install' || currentStep === 'complete' ? <CheckCircle className="h-4 w-4" /> : '3'}
                </div>
                <span className="font-medium">配置迁移</span>
              </div>
              
              <div className={`flex items-center gap-2 ${currentStep === 'install' ? 'text-blue-600' : currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'install' ? 'bg-blue-100 text-blue-600' : currentStep === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {currentStep === 'complete' ? <CheckCircle className="h-4 w-4" /> : '4'}
                </div>
                <span className="font-medium">执行安装</span>
              </div>
            </div>
          </div>
          
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>安装进度</span>
                <span>{processProgress}%</span>
              </div>
              <Progress value={processProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 步骤内容 */}
      {currentStep === 'host' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              选择目标主机
            </CardTitle>
            <CardDescription>
              选择要安装监控组件的主机，系统将自动检测现有组件状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IntegratedHostSelection
              onHostSelected={handleHostSelected}
              showCreateNew={true}
            />
          </CardContent>
        </Card>
      )}

      {currentStep === 'analysis' && selectedHost && (
        <div className="space-y-6">
          {/* 组件选择 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                选择监控组件
              </CardTitle>
              <CardDescription>
                选择要安装的监控组件和目标版本
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableComponents.map(component => (
                  <Card key={component.id} className={`cursor-pointer transition-colors ${selectedComponents.includes(component.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedComponents.includes(component.id)}
                              onChange={() => handleComponentToggle(component.id)}
                              className="rounded"
                            />
                            <span className="font-medium">{component.name}</span>
                          </div>
                          <p className="text-sm text-gray-600">{component.description}</p>
                          
                          {selectedComponents.includes(component.id) && (
                            <div className="space-y-2">
                              <Label className="text-xs">目标版本:</Label>
                              <Select
                                value={targetVersions[component.id]}
                                onValueChange={(value) => handleVersionChange(component.id, value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={component.defaultVersion}>{component.defaultVersion} (推荐)</SelectItem>
                                  <SelectItem value="latest">latest</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {selectedComponents.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setCurrentStep('migration')}>
                    <Eye className="h-4 w-4 mr-2" />
                    开始智能分析
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 智能决策引擎 */}
          {selectedComponents.length > 0 && (
            <SmartInstallationDecisionEngine
              hostId={selectedHost.id}
              components={selectedComponents}
              targetVersions={targetVersions}
              onDecisionMade={handleDecisionMade}
            />
          )}
        </div>
      )}

      {currentStep === 'migration' && (
        <div className="space-y-6">
          {componentsNeedingMigration.length > 0 ? (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  检测到 {componentsNeedingMigration.length} 个组件需要配置迁移，请逐一处理。
                </AlertDescription>
              </Alert>
              
              {componentsNeedingMigration.map(componentId => (
                <ConfigMigrationManager
                  key={componentId}
                  componentName={componentId}
                  fromVersion="2.0.5" // 这里应该从检测结果中获取
                  toVersion={targetVersions[componentId]}
                  configFiles={mockConfigFiles.filter(f => f.name.includes(componentId))}
                  onMigrationComplete={handleMigrationComplete}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">无需配置迁移</h3>
                  <p className="text-gray-600 mb-4">
                    所选组件均为全新安装或无需配置迁移，可直接进行安装。
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('analysis')}>
              返回分析
            </Button>
            <Button onClick={startInstallation}>
              <Play className="h-4 w-4 mr-2" />
              开始安装
            </Button>
          </div>
        </div>
      )}

      {currentStep === 'install' && (
        <InstallProgress
          isInstalling={isProcessing}
          components={selectedComponents}
          onInstall={() => {}}
          onCancel={() => setIsProcessing(false)}
        />
      )}

      {currentStep === 'complete' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">安装完成！</h2>
              <p className="text-gray-600 mb-6">
                所有监控组件已成功安装并配置完成。
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2">安装摘要</h3>
                    <div className="space-y-1 text-sm">
                      <div>已安装组件: {selectedComponents.length}</div>
                      <div>配置迁移: {migrationResults.length}</div>
                      <div>总耗时: {Math.floor(Math.random() * 10) + 5} 分钟</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2">快速访问</h3>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        打开 Grafana
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <Database className="h-4 w-4 mr-2" />
                        查看 Prometheus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={() => window.location.href = '/monitoring-installer/dashboard'}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  查看监控面板
                </Button>
                <Button variant="outline" onClick={() => {
                  setCurrentStep('host')
                  setSelectedHost(null)
                  setSelectedComponents([])
                  setInstallationDecisions({})
                  setMigrationResults([])
                }}>
                  安装更多组件
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}