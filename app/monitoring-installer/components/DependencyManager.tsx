"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  GitBranch,
  ArrowRight,
  ArrowDown,
  Network,
  Zap,
  Clock,
  Play,
  Pause,
  SkipForward
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ComponentDependency {
  component: string
  dependencies: string[]
  dependents: string[]
  optional: string[]
  conflicts: string[]
  startupOrder: number
  healthCheckDelay: number
}

interface DependencyGraph {
  nodes: ComponentNode[]
  edges: DependencyEdge[]
  installOrder: string[]
  startupOrder: string[]
  conflicts: ConflictInfo[]
}

interface ComponentNode {
  id: string
  name: string
  status: 'pending' | 'installing' | 'installed' | 'failed' | 'skipped'
  dependencies: string[]
  dependents: string[]
  level: number
}

interface DependencyEdge {
  from: string
  to: string
  type: 'required' | 'optional' | 'conflict'
  description: string
}

interface ConflictInfo {
  components: string[]
  reason: string
  resolution: string
  severity: 'warning' | 'error'
}

interface DependencyManagerProps {
  selectedComponents: string[]
  onInstallOrderChange?: (order: string[]) => void
  onConflictsDetected?: (conflicts: ConflictInfo[]) => void
  className?: string
}

export function DependencyManager({
  selectedComponents,
  onInstallOrderChange,
  onConflictsDetected,
  className
}: DependencyManagerProps) {
  const [dependencyGraph, setDependencyGraph] = useState<DependencyGraph | null>(null)
  const [autoResolve, setAutoResolve] = useState(true)
  const [showOptionalDeps, setShowOptionalDeps] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // 组件依赖关系定义
  const componentDependencies: Record<string, ComponentDependency> = {
    'prometheus': {
      component: 'prometheus',
      dependencies: [],
      dependents: ['grafana', 'alertmanager', 'vmalert'],
      optional: ['node-exporter', 'categraf'],
      conflicts: ['victoriametrics'],
      startupOrder: 1,
      healthCheckDelay: 30
    },
    'victoriametrics': {
      component: 'victoriametrics',
      dependencies: [],
      dependents: ['grafana', 'vmalert'],
      optional: ['node-exporter', 'categraf', 'vmagent'],
      conflicts: ['prometheus'],
      startupOrder: 1,
      healthCheckDelay: 20
    },
    'grafana': {
      component: 'grafana',
      dependencies: ['prometheus', 'victoriametrics'], // 至少需要一个数据源
      dependents: [],
      optional: ['alertmanager'],
      conflicts: [],
      startupOrder: 3,
      healthCheckDelay: 45
    },
    'alertmanager': {
      component: 'alertmanager',
      dependencies: [],
      dependents: ['vmalert'],
      optional: ['grafana'],
      conflicts: [],
      startupOrder: 2,
      healthCheckDelay: 15
    },
    'vmalert': {
      component: 'vmalert',
      dependencies: ['alertmanager'],
      dependents: [],
      optional: ['prometheus', 'victoriametrics'],
      conflicts: [],
      startupOrder: 4,
      healthCheckDelay: 20
    },
    'vmagent': {
      component: 'vmagent',
      dependencies: ['victoriametrics'],
      dependents: [],
      optional: [],
      conflicts: [],
      startupOrder: 2,
      healthCheckDelay: 15
    },
    'node-exporter': {
      component: 'node-exporter',
      dependencies: [],
      dependents: [],
      optional: [],
      conflicts: [],
      startupOrder: 1,
      healthCheckDelay: 10
    },
    'categraf': {
      component: 'categraf',
      dependencies: [],
      dependents: [],
      optional: [],
      conflicts: ['node-exporter'], // 功能重叠，建议选择其一
      startupOrder: 1,
      healthCheckDelay: 10
    },
    'snmp-exporter': {
      component: 'snmp-exporter',
      dependencies: [],
      dependents: [],
      optional: [],
      conflicts: [],
      startupOrder: 1,
      healthCheckDelay: 15
    }
  }

  // 分析依赖关系
  useEffect(() => {
    if (selectedComponents.length > 0) {
      analyzeDependencies()
    }
  }, [selectedComponents, autoResolve, showOptionalDeps])

  const analyzeDependencies = async () => {
    setIsAnalyzing(true)
    
    try {
      // 构建依赖图
      const graph = buildDependencyGraph(selectedComponents)
      
      // 检测冲突
      const conflicts = detectConflicts(graph)
      
      // 解析安装顺序
      const installOrder = resolveInstallOrder(graph)
      
      // 解析启动顺序
      const startupOrder = resolveStartupOrder(graph)
      
      const finalGraph: DependencyGraph = {
        ...graph,
        installOrder,
        startupOrder,
        conflicts
      }
      
      setDependencyGraph(finalGraph)
      onInstallOrderChange?.(installOrder)
      onConflictsDetected?.(conflicts)
      
    } catch (error) {
      console.error('Dependency analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 构建依赖图
  const buildDependencyGraph = (components: string[]): Omit<DependencyGraph, 'installOrder' | 'startupOrder' | 'conflicts'> => {
    const nodes: ComponentNode[] = []
    const edges: DependencyEdge[] = []
    const processedComponents = new Set<string>()

    // 递归添加组件及其依赖
    const addComponent = (componentId: string, level: number = 0) => {
      if (processedComponents.has(componentId)) return
      
      const depInfo = componentDependencies[componentId]
      if (!depInfo) return

      processedComponents.add(componentId)

      // 添加节点
      nodes.push({
        id: componentId,
        name: componentId,
        status: 'pending',
        dependencies: depInfo.dependencies,
        dependents: depInfo.dependents,
        level
      })

      // 处理必需依赖
      depInfo.dependencies.forEach(dep => {
        // 检查是否为互斥依赖（如 prometheus 或 victoriametrics）
        if (dep === 'prometheus' || dep === 'victoriametrics') {
          const hasPrometheus = components.includes('prometheus') || processedComponents.has('prometheus')
          const hasVictoriaMetrics = components.includes('victoriametrics') || processedComponents.has('victoriametrics')
          
          if (dep === 'prometheus' && hasVictoriaMetrics) return
          if (dep === 'victoriametrics' && hasPrometheus) return
        }

        edges.push({
          from: dep,
          to: componentId,
          type: 'required',
          description: `${componentId} 需要 ${dep}`
        })

        if (autoResolve && !components.includes(dep)) {
          addComponent(dep, level + 1)
        }
      })

      // 处理可选依赖
      if (showOptionalDeps) {
        depInfo.optional.forEach(opt => {
          if (components.includes(opt) || processedComponents.has(opt)) {
            edges.push({
              from: opt,
              to: componentId,
              type: 'optional',
              description: `${componentId} 可选依赖 ${opt}`
            })
          }
        })
      }
    }

    // 处理所有选中的组件
    components.forEach(comp => addComponent(comp))

    return { nodes, edges }
  }

  // 检测冲突
  const detectConflicts = (graph: Omit<DependencyGraph, 'installOrder' | 'startupOrder' | 'conflicts'>): ConflictInfo[] => {
    const conflicts: ConflictInfo[] = []
    const componentIds = graph.nodes.map(n => n.id)

    componentIds.forEach(componentId => {
      const depInfo = componentDependencies[componentId]
      if (!depInfo) return

      depInfo.conflicts.forEach(conflictComponent => {
        if (componentIds.includes(conflictComponent)) {
          // 检查是否已经添加过这个冲突
          const existingConflict = conflicts.find(c => 
            c.components.includes(componentId) && c.components.includes(conflictComponent)
          )

          if (!existingConflict) {
            conflicts.push({
              components: [componentId, conflictComponent],
              reason: getConflictReason(componentId, conflictComponent),
              resolution: getConflictResolution(componentId, conflictComponent),
              severity: getConflictSeverity(componentId, conflictComponent)
            })
          }
        }
      })
    })

    return conflicts
  }

  // 获取冲突原因
  const getConflictReason = (comp1: string, comp2: string): string => {
    const conflictReasons: Record<string, string> = {
      'prometheus-victoriametrics': '两者都是时序数据库，功能重叠',
      'node-exporter-categraf': '两者都是系统指标采集器，可能产生重复数据'
    }
    
    const key = [comp1, comp2].sort().join('-')
    return conflictReasons[key] || '组件间存在功能冲突'
  }

  // 获取冲突解决方案
  const getConflictResolution = (comp1: string, comp2: string): string => {
    const resolutions: Record<string, string> = {
      'prometheus-victoriametrics': '建议选择其中一个作为主要时序数据库',
      'node-exporter-categraf': '建议选择 Categraf（功能更全面）或配置不同的采集目标'
    }
    
    const key = [comp1, comp2].sort().join('-')
    return resolutions[key] || '请手动解决冲突或选择其中一个组件'
  }

  // 获取冲突严重程度
  const getConflictSeverity = (comp1: string, comp2: string): 'warning' | 'error' => {
    const errorConflicts = ['prometheus-victoriametrics']
    const key = [comp1, comp2].sort().join('-')
    return errorConflicts.includes(key) ? 'error' : 'warning'
  }

  // 解析安装顺序（拓扑排序）
  const resolveInstallOrder = (graph: Omit<DependencyGraph, 'installOrder' | 'startupOrder' | 'conflicts'>): string[] => {
    const nodes = [...graph.nodes]
    const edges = graph.edges.filter(e => e.type === 'required')
    const result: string[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected involving ${nodeId}`)
      }
      if (visited.has(nodeId)) return

      visiting.add(nodeId)

      // 访问所有依赖
      edges
        .filter(e => e.to === nodeId)
        .forEach(e => visit(e.from))

      visiting.delete(nodeId)
      visited.add(nodeId)
      result.push(nodeId)
    }

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        visit(node.id)
      }
    })

    return result
  }

  // 解析启动顺序
  const resolveStartupOrder = (graph: Omit<DependencyGraph, 'installOrder' | 'startupOrder' | 'conflicts'>): string[] => {
    const componentIds = graph.nodes.map(n => n.id)
    
    return componentIds.sort((a, b) => {
      const orderA = componentDependencies[a]?.startupOrder || 999
      const orderB = componentDependencies[b]?.startupOrder || 999
      return orderA - orderB
    })
  }

  // 自动解决冲突
  const autoResolveConflicts = () => {
    if (!dependencyGraph) return

    const resolvedComponents = [...selectedComponents]
    
    dependencyGraph.conflicts.forEach(conflict => {
      if (conflict.severity === 'error') {
        // 对于错误级别的冲突，移除优先级较低的组件
        if (conflict.components.includes('prometheus') && conflict.components.includes('victoriametrics')) {
          // 保留 VictoriaMetrics（性能更好）
          const index = resolvedComponents.indexOf('prometheus')
          if (index > -1) {
            resolvedComponents.splice(index, 1)
          }
        }
      }
    })

    // 重新分析
    analyzeDependencies()
  }

  // 获取组件状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'installed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'installing': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'skipped': return <SkipForward className="h-4 w-4 text-gray-600" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            依赖关系管理
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-resolve">自动解决依赖</Label>
                <Switch
                  id="auto-resolve"
                  checked={autoResolve}
                  onCheckedChange={setAutoResolve}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="show-optional">显示可选依赖</Label>
                <Switch
                  id="show-optional"
                  checked={showOptionalDeps}
                  onCheckedChange={setShowOptionalDeps}
                />
              </div>
            </div>
            <Button onClick={analyzeDependencies} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  重新分析
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dependencyGraph && (
            <div className="space-y-6">
              {/* 冲突检测 */}
              {dependencyGraph.conflicts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-red-600">检测到冲突</h3>
                  {dependencyGraph.conflicts.map((conflict, index) => (
                    <Alert key={index} variant={conflict.severity === 'error' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div>
                            <strong>冲突组件:</strong> {conflict.components.join(' ↔ ')}
                          </div>
                          <div>
                            <strong>冲突原因:</strong> {conflict.reason}
                          </div>
                          <div>
                            <strong>解决方案:</strong> {conflict.resolution}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                  <Button onClick={autoResolveConflicts} variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    自动解决冲突
                  </Button>
                </div>
              )}

              {/* 依赖图可视化 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">依赖关系图</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {dependencyGraph.nodes.map(node => (
                        <div key={node.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                          {getStatusIcon(node.status)}
                          <span className="font-medium">{node.name}</span>
                          <Badge variant="outline">Level {node.level}</Badge>
                          
                          {node.dependencies.length > 0 && (
                            <div className="flex items-center gap-1 ml-auto">
                              <span className="text-sm text-gray-600">依赖:</span>
                              {node.dependencies.map(dep => (
                                <Badge key={dep} variant="outline" className="text-xs">
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* 安装顺序 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">推荐安装顺序</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {dependencyGraph.installOrder.map((component, index) => (
                    <div key={component} className="flex items-center gap-2">
                      <Badge variant="outline" className="px-3 py-1">
                        {index + 1}. {component}
                      </Badge>
                      {index < dependencyGraph.installOrder.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 启动顺序 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">推荐启动顺序</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {dependencyGraph.startupOrder.map((component, index) => (
                    <div key={component} className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-3 py-1">
                        {index + 1}. {component}
                      </Badge>
                      {index < dependencyGraph.startupOrder.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 健康检查延迟 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">健康检查配置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dependencyGraph.nodes.map(node => {
                    const depInfo = componentDependencies[node.id]
                    return (
                      <Card key={node.id}>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="font-medium">{node.name}</div>
                            <div className="text-sm text-gray-600">
                              健康检查延迟: {depInfo?.healthCheckDelay || 30}秒
                            </div>
                            <div className="text-sm text-gray-600">
                              启动优先级: {depInfo?.startupOrder || 999}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}