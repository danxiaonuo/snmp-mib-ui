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
import { Lightbulb, Brain, Target, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock, Settings, Eye, Play, Pause, Router, Server, Monitor, Smartphone, Laptop, HardDrive, Network, Zap, Activity, BarChart3, PieChart, LineChart, RefreshCw, Download, Upload, Plus, Minus, Star, ThumbsUp, ThumbsDown, Wand2 } from "lucide-react"
import { toast } from "sonner"

// 智能推荐数据
const mockRecommendations = [
  {
    id: "1",
    type: "missing_rules",
    priority: "high",
    title: "核心交换机缺少关键监控",
    description: "发现3台核心交换机缺少CPU和内存监控规则",
    devices: [
      { id: "sw-01", name: "core-sw-01", ip: "192.168.1.1" },
      { id: "sw-02", name: "core-sw-02", ip: "192.168.1.2" },
      { id: "sw-03", name: "core-sw-03", ip: "192.168.1.3" }
    ],
    suggestedRules: [
      {
        name: "CPU使用率告警",
        expr: "cpu_usage{job=\"switch\"} > 80",
        severity: "warning",
        description: "CPU使用率超过80%时告警"
      },
      {
        name: "内存使用率告警",
        expr: "memory_usage{job=\"switch\"} > 85",
        severity: "critical",
        description: "内存使用率超过85%时告警"
      }
    ],
    confidence: 95,
    impact: "high",
    effort: "low",
    status: "pending",
    createdAt: "2024-01-15T14:30:00Z"
  },
  {
    id: "2",
    type: "threshold_optimization",
    priority: "medium",
    title: "告警阈值优化建议",
    description: "基于历史数据分析，建议调整部分告警阈值以减少误报",
    devices: [
      { id: "sw-10", name: "access-sw-10", ip: "192.168.1.10" }
    ],
    suggestedChanges: [
      {
        ruleName: "接口流量告警",
        currentThreshold: "80%",
        suggestedThreshold: "90%",
        reason: "过去30天内该设备流量峰值为85%，当前阈值过于敏感",
        falseAlerts: 15
      },
      {
        ruleName: "温度告警",
        currentThreshold: "45°C",
        suggestedThreshold: "50°C",
        reason: "设备正常工作温度范围为35-48°C，建议提高阈值",
        falseAlerts: 8
      }
    ],
    confidence: 87,
    impact: "medium",
    effort: "low",
    status: "pending",
    createdAt: "2024-01-15T13:45:00Z"
  },
  {
    id: "3",
    type: "new_metrics",
    priority: "low",
    title: "新指标监控建议",
    description: "发现设备支持新的监控指标，建议添加相关告警规则",
    devices: [
      { id: "srv-01", name: "server-01", ip: "192.168.2.5" }
    ],
    newMetrics: [
      {
        name: "disk_io_wait",
        description: "磁盘IO等待时间",
        suggestedThreshold: "> 20ms",
        importance: "medium"
      },
      {
        name: "network_errors",
        description: "网络错误包率",
        suggestedThreshold: "> 0.1%",
        importance: "high"
      }
    ],
    confidence: 72,
    impact: "low",
    effort: "medium",
    status: "pending",
    createdAt: "2024-01-15T12:20:00Z"
  },
  {
    id: "4",
    type: "rule_consolidation",
    priority: "low",
    title: "规则整合建议",
    description: "发现多个相似的告警规则，建议整合以简化管理",
    duplicateRules: [
      {
        group: "CPU监控",
        rules: [
          "CPU使用率 > 80% (交换机)",
          "CPU利用率 > 80% (路由器)",
          "处理器使用率 > 80% (防火墙)"
        ],
        suggestedRule: "CPU使用率 > 80% (网络设备)"
      }
    ],
    confidence: 68,
    impact: "low",
    effort: "high",
    status: "pending",
    createdAt: "2024-01-15T11:10:00Z"
  }
]

// 推荐历史数据
const mockRecommendationHistory = [
  {
    id: "h1",
    recommendationId: "old-1",
    title: "服务器内存监控优化",
    action: "applied",
    appliedAt: "2024-01-14T16:30:00Z",
    appliedBy: "admin",
    result: "success",
    impact: "减少了85%的内存告警误报",
    feedback: "positive"
  },
  {
    id: "h2",
    recommendationId: "old-2",
    title: "网络设备温度阈值调整",
    action: "rejected",
    rejectedAt: "2024-01-14T14:15:00Z",
    rejectedBy: "operator",
    reason: "当前阈值符合机房环境要求",
    feedback: "neutral"
  },
  {
    id: "h3",
    recommendationId: "old-3",
    title: "新增磁盘空间监控",
    action: "applied",
    appliedAt: "2024-01-13T10:20:00Z",
    appliedBy: "admin",
    result: "success",
    impact: "及时发现了2台服务器的磁盘空间不足问题",
    feedback: "positive"
  }
]

// 推荐统计数据
const mockRecommendationStats = {
  total: 24,
  pending: 4,
  applied: 18,
  rejected: 2,
  successRate: 89,
  avgConfidence: 82,
  impactDistribution: {
    high: 8,
    medium: 12,
    low: 4
  },
  typeDistribution: {
    missing_rules: 10,
    threshold_optimization: 8,
    new_metrics: 4,
    rule_consolidation: 2
  }
}

const RECOMMENDATION_TYPES = {
  missing_rules: { label: "缺失规则", icon: AlertTriangle, color: "text-red-600" },
  threshold_optimization: { label: "阈值优化", icon: TrendingUp, color: "text-blue-600" },
  new_metrics: { label: "新指标", icon: Plus, color: "text-green-600" },
  rule_consolidation: { label: "规则整合", icon: Target, color: "text-purple-600" }
}

const PRIORITY_COLORS = {
  high: "border-red-200 bg-red-50",
  medium: "border-orange-200 bg-orange-50",
  low: "border-blue-200 bg-blue-50"
}

interface RuleRecommendationsProps {
  onRecommendationApply?: (recommendationId: string) => void
  onRecommendationReject?: (recommendationId: string, reason: string) => void
}

export function RuleRecommendations({ onRecommendationApply, onRecommendationReject }: RuleRecommendationsProps) {
  const [recommendations, setRecommendations] = useState(mockRecommendations)
  const [history, setHistory] = useState(mockRecommendationHistory)
  const [stats, setStats] = useState(mockRecommendationStats)
  const [activeTab, setActiveTab] = useState("recommendations")
  const [filterType, setFilterType] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  // 过滤推荐
  const filteredRecommendations = recommendations.filter(rec => {
    const matchesType = filterType === "all" || rec.type === filterType
    const matchesPriority = filterPriority === "all" || rec.priority === filterPriority
    return matchesType && matchesPriority
  })

  // 生成新推荐
  const generateRecommendations = async () => {
    setIsGenerating(true)
    
    try {
      // 模拟AI分析过程
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // 模拟生成新推荐
      const newRecommendation = {
        id: Date.now().toString(),
        type: "missing_rules",
        priority: "medium",
        title: "新发现设备监控配置",
        description: "AI分析发现2台新设备需要配置基础监控规则",
        devices: [
          { id: "new-01", name: "new-switch-01", ip: "192.168.1.50" },
          { id: "new-02", name: "new-switch-02", ip: "192.168.1.51" }
        ],
        suggestedRules: [
          {
            name: "设备在线状态",
            expr: "up{instance=~\"192.168.1.5[01].*\"} == 0",
            severity: "critical",
            description: "设备离线时立即告警"
          }
        ],
        confidence: 88,
        impact: "medium",
        effort: "low",
        status: "pending",
        createdAt: new Date().toISOString()
      }
      
      setRecommendations(prev => [newRecommendation, ...prev])
      toast.success("AI分析完成，生成1条新推荐")
      
    } catch (error) {
      toast.error("生成推荐失败")
    } finally {
      setIsGenerating(false)
    }
  }

  // 应用推荐
  const applyRecommendation = async (recommendationId: string) => {
    const recommendation = recommendations.find(r => r.id === recommendationId)
    if (!recommendation) return
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "正在应用推荐...",
        success: "推荐应用成功",
        error: "推荐应用失败"
      }
    )
    
    // 更新推荐状态
    setRecommendations(prev => prev.map(r => 
      r.id === recommendationId ? { ...r, status: "applied" } : r
    ))
    
    // 添加到历史记录
    const historyRecord = {
      id: Date.now().toString(),
      recommendationId,
      title: recommendation.title,
      action: "applied",
      appliedAt: new Date().toISOString(),
      appliedBy: "admin",
      result: "success",
      impact: "推荐已成功应用",
      feedback: "positive"
    }
    
    setHistory(prev => [historyRecord, ...prev])
    onRecommendationApply?.(recommendationId)
  }

  // 拒绝推荐
  const rejectRecommendation = async (recommendationId: string, reason: string) => {
    const recommendation = recommendations.find(r => r.id === recommendationId)
    if (!recommendation) return
    
    // 更新推荐状态
    setRecommendations(prev => prev.map(r => 
      r.id === recommendationId ? { ...r, status: "rejected" } : r
    ))
    
    // 添加到历史记录
    const historyRecord = {
      id: Date.now().toString(),
      recommendationId,
      title: recommendation.title,
      action: "rejected",
      rejectedAt: new Date().toISOString(),
      rejectedBy: "admin",
      reason,
      feedback: "neutral"
    }
    
    setHistory(prev => [historyRecord, ...prev])
    toast.success("推荐已拒绝")
    onRecommendationReject?.(recommendationId, reason)
  }

  // 批量应用推荐
  const batchApplyRecommendations = async () => {
    if (selectedRecommendations.length === 0) {
      toast.error("请选择要应用的推荐")
      return
    }
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: `正在批量应用 ${selectedRecommendations.length} 条推荐...`,
        success: `已成功应用 ${selectedRecommendations.length} 条推荐`,
        error: "批量应用失败"
      }
    )
    
    // 更新推荐状态
    setRecommendations(prev => prev.map(r => 
      selectedRecommendations.includes(r.id) ? { ...r, status: "applied" } : r
    ))
    
    setSelectedRecommendations([])
  }

  // 显示推荐详情
  const showRecommendationDetails = (recommendation: any) => {
    setSelectedRecommendation(recommendation)
    setShowDetails(true)
  }

  // 获取推荐类型信息
  const getRecommendationType = (type: string) => {
    return RECOMMENDATION_TYPES[type as keyof typeof RECOMMENDATION_TYPES] || 
           { label: "未知", icon: Lightbulb, color: "text-gray-600" }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">智能规则推荐</h2>
          <p className="text-muted-foreground">基于AI分析的告警规则优化建议</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={generateRecommendations}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            AI分析
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            导出报告
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">待处理推荐</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.applied}</div>
              <div className="text-sm text-muted-foreground">已应用推荐</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.successRate}%</div>
              <div className="text-sm text-muted-foreground">成功率</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.avgConfidence}%</div>
              <div className="text-sm text-muted-foreground">平均置信度</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="recommendations">推荐列表</TabsTrigger>
          <TabsTrigger value="history">历史记录</TabsTrigger>
          <TabsTrigger value="analytics">分析报告</TabsTrigger>
          <TabsTrigger value="settings">推荐设置</TabsTrigger>
        </TabsList>

        {/* 推荐列表 */}
        <TabsContent value="recommendations" className="space-y-4">
          {/* 过滤器 */}
          <div className="flex items-center space-x-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="推荐类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                {Object.entries(RECOMMENDATION_TYPES).map(([key, type]) => (
                  <SelectItem key={key} value={key}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有优先级</SelectItem>
                <SelectItem value="high">高优先级</SelectItem>
                <SelectItem value="medium">中优先级</SelectItem>
                <SelectItem value="low">低优先级</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 推荐卡片 */}
          <div className="space-y-4">
            {filteredRecommendations.filter(r => r.status === "pending").map((recommendation) => {
              const typeInfo = getRecommendationType(recommendation.type)
              const Icon = typeInfo.icon
              const priorityClass = PRIORITY_COLORS[recommendation.priority as keyof typeof PRIORITY_COLORS]
              
              return (
                <Card key={recommendation.id} className={priorityClass}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedRecommendations.includes(recommendation.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRecommendations([...selectedRecommendations, recommendation.id])
                            } else {
                              setSelectedRecommendations(selectedRecommendations.filter(id => id !== recommendation.id))
                            }
                          }}
                        />
                        <Icon className={`h-5 w-5 ${typeInfo.color}`} />
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{recommendation.title}</span>
                            <Badge 
                              variant={recommendation.priority === 'high' ? 'destructive' : 
                                      recommendation.priority === 'medium' ? 'default' : 'secondary'}
                            >
                              {recommendation.priority === 'high' ? '高优先级' : 
                               recommendation.priority === 'medium' ? '中优先级' : '低优先级'}
                            </Badge>
                            <Badge variant="outline">{typeInfo.label}</Badge>
                          </CardTitle>
                          <CardDescription>{recommendation.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => showRecommendationDetails(recommendation)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setRejectingId(recommendation.id)
                            setShowRejectDialog(true)
                          }}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => applyRecommendation(recommendation.id)}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          应用
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* 影响设备 */}
                      {recommendation.devices && (
                        <div>
                          <h4 className="font-medium mb-2">影响设备</h4>
                          <div className="flex flex-wrap gap-1">
                            {recommendation.devices.map((device: any) => (
                              <Badge key={device.id} variant="outline">
                                {device.name} ({device.ip})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 建议规则 */}
                      {recommendation.suggestedRules && (
                        <div>
                          <h4 className="font-medium mb-2">建议规则</h4>
                          <div className="space-y-2">
                            {recommendation.suggestedRules.slice(0, 2).map((rule: any, index: number) => (
                              <div key={index} className="text-sm border rounded p-2">
                                <div className="font-medium">{rule.name}</div>
                                <div className="text-muted-foreground font-mono text-xs">{rule.expr}</div>
                              </div>
                            ))}
                            {recommendation.suggestedRules.length > 2 && (
                              <div className="text-sm text-muted-foreground">
                                还有 {recommendation.suggestedRules.length - 2} 条规则...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* 阈值优化 */}
                      {recommendation.suggestedChanges && (
                        <div>
                          <h4 className="font-medium mb-2">优化建议</h4>
                          <div className="space-y-2">
                            {recommendation.suggestedChanges.slice(0, 2).map((change: any, index: number) => (
                              <div key={index} className="text-sm border rounded p-2">
                                <div className="font-medium">{change.ruleName}</div>
                                <div className="text-muted-foreground">
                                  {change.currentThreshold} → {change.suggestedThreshold}
                                  <span className="ml-2 text-red-600">({change.falseAlerts} 次误报)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 置信度和影响 */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{recommendation.confidence}%</div>
                          <div className="text-sm text-muted-foreground">置信度</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${
                            recommendation.impact === 'high' ? 'text-red-600' : 
                            recommendation.impact === 'medium' ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {recommendation.impact === 'high' ? '高' : 
                             recommendation.impact === 'medium' ? '中' : '低'}
                          </div>
                          <div className="text-sm text-muted-foreground">影响程度</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${
                            recommendation.effort === 'high' ? 'text-red-600' : 
                            recommendation.effort === 'medium' ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {recommendation.effort === 'high' ? '高' : 
                             recommendation.effort === 'medium' ? '中' : '低'}
                          </div>
                          <div className="text-sm text-muted-foreground">实施难度</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        生成时间: {new Date(recommendation.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 批量操作 */}
          {selectedRecommendations.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedRecommendations.length} 条推荐
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Button 
                size="sm" 
                onClick={batchApplyRecommendations}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                批量应用
              </Button>
            </div>
          )}

          {filteredRecommendations.filter(r => r.status === "pending").length === 0 && (
            <div className="text-center py-8">
              <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无新推荐</h3>
              <p className="text-muted-foreground">点击"AI分析"按钮生成新的优化建议</p>
            </div>
          )}
        </TabsContent>

        {/* 历史记录 */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">推荐历史记录</h3>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              导出历史
            </Button>
          </div>

          <div className="space-y-4">
            {history.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{record.title}</span>
                        {record.action === 'applied' ? (
                          <Badge variant="secondary">已应用</Badge>
                        ) : (
                          <Badge variant="outline">已拒绝</Badge>
                        )}
                        {record.result === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {record.action === 'applied' 
                          ? `${record.appliedBy} 于 ${new Date(record.appliedAt!).toLocaleString()} 应用`
                          : `${record.rejectedBy} 于 ${new Date(record.rejectedAt!).toLocaleString()} 拒绝`
                        }
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {record.feedback === 'positive' && <ThumbsUp className="h-4 w-4 text-green-500" />}
                      {record.feedback === 'negative' && <ThumbsDown className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {record.impact && (
                      <div className="text-sm">
                        <span className="font-medium">影响: </span>
                        <span>{record.impact}</span>
                      </div>
                    )}
                    {record.reason && (
                      <div className="text-sm">
                        <span className="font-medium">拒绝原因: </span>
                        <span>{record.reason}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 分析报告 */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>推荐类型分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.typeDistribution).map(([type, count]) => {
                    const typeInfo = getRecommendationType(type)
                    const Icon = typeInfo.icon
                    const percentage = Math.round((count / stats.total) * 100)
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                          <span>{typeInfo.label}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{count} ({percentage}%)</span>
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

            <Card>
              <CardHeader>
                <CardTitle>影响程度分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.impactDistribution).map(([impact, count]) => {
                    const percentage = Math.round((count / stats.total) * 100)
                    const color = impact === 'high' ? 'text-red-600' : 
                                 impact === 'medium' ? 'text-orange-600' : 'text-green-600'
                    
                    return (
                      <div key={impact} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            impact === 'high' ? 'bg-red-500' : 
                            impact === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                          }`} />
                          <span className={color}>
                            {impact === 'high' ? '高影响' : 
                             impact === 'medium' ? '中影响' : '低影响'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{count} ({percentage}%)</span>
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
              <CardTitle>推荐效果统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">总推荐数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.applied}</div>
                  <div className="text-sm text-muted-foreground">已应用</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-sm text-muted-foreground">已拒绝</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.successRate}%</div>
                  <div className="text-sm text-muted-foreground">成功率</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 推荐设置 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI推荐设置</CardTitle>
              <CardDescription>配置智能推荐的行为和参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">启用自动推荐</Label>
                  <p className="text-sm text-muted-foreground">定期分析并生成新的优化建议</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div>
                <Label>推荐频率</Label>
                <Select defaultValue="daily">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">每小时</SelectItem>
                    <SelectItem value="daily">每天</SelectItem>
                    <SelectItem value="weekly">每周</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div>
                <Label>最低置信度阈值</Label>
                <div className="mt-2">
                  <Input type="number" defaultValue="70" min="0" max="100" />
                  <p className="text-sm text-muted-foreground mt-1">只显示置信度高于此值的推荐</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>推荐类型</Label>
                <div className="space-y-2">
                  {Object.entries(RECOMMENDATION_TYPES).map(([key, type]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox id={key} defaultChecked />
                      <Label htmlFor={key}>{type.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 推荐详情对话框 */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>推荐详情</DialogTitle>
            <DialogDescription>
              查看推荐的详细信息和建议内容
            </DialogDescription>
          </DialogHeader>
          {selectedRecommendation && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">基本信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">推荐类型:</span>
                      <span>{getRecommendationType(selectedRecommendation.type).label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">优先级:</span>
                      <Badge variant={selectedRecommendation.priority === 'high' ? 'destructive' : 
                                    selectedRecommendation.priority === 'medium' ? 'default' : 'secondary'}>
                        {selectedRecommendation.priority === 'high' ? '高' : 
                         selectedRecommendation.priority === 'medium' ? '中' : '低'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">置信度:</span>
                      <span>{selectedRecommendation.confidence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">影响程度:</span>
                      <span>{selectedRecommendation.impact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">实施难度:</span>
                      <span>{selectedRecommendation.effort}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">生成信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">生成时间:</span>
                      <span>{new Date(selectedRecommendation.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">状态:</span>
                      <Badge variant={selectedRecommendation.status === 'pending' ? 'outline' : 'secondary'}>
                        {selectedRecommendation.status === 'pending' ? '待处理' : 
                         selectedRecommendation.status === 'applied' ? '已应用' : '已拒绝'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">推荐描述</h4>
                <p className="text-sm text-muted-foreground">{selectedRecommendation.description}</p>
              </div>
              
              {selectedRecommendation.suggestedRules && (
                <div>
                  <h4 className="font-medium mb-2">建议规则</h4>
                  <div className="space-y-2">
                    {selectedRecommendation.suggestedRules.map((rule: any, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">{rule.description}</div>
                        <div className="mt-2 p-2 bg-muted rounded text-sm font-mono">{rule.expr}</div>
                        <div className="mt-1">
                          <Badge variant={rule.severity === 'critical' ? 'destructive' : 'default'}>
                            {rule.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedRecommendation.devices && (
                <div>
                  <h4 className="font-medium mb-2">影响设备</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {selectedRecommendation.devices.map((device: any) => (
                      <div key={device.id} className="border rounded p-2 text-sm">
                        <div className="font-medium">{device.name}</div>
                        <div className="text-muted-foreground">{device.ip}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 拒绝推荐对话框 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝推荐</DialogTitle>
            <DialogDescription>
              请说明拒绝此推荐的原因，这将帮助改进AI推荐算法
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>拒绝原因</Label>
              <Textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因..."
                className="mt-2"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRejectDialog(false)
                  setRejectReason("")
                  setRejectingId(null)
                }}
              >
                取消
              </Button>
              <Button 
                onClick={() => {
                  if (rejectingId && rejectReason.trim()) {
                    rejectRecommendation(rejectingId, rejectReason)
                    setShowRejectDialog(false)
                    setRejectReason("")
                    setRejectingId(null)
                  }
                }}
                disabled={!rejectReason.trim()}
              >
                确认拒绝
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}