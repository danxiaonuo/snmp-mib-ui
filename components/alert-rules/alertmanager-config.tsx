"use client"

import { useState } from "react"
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
import { Slider } from "@/components/ui/slider"
import { Plus, Search, Filter, Edit, Trash2, Settings, Bell, Route, Users, Mail, MessageSquare, Phone, Webhook, Clock, Volume, VolumeX, Play, Pause, TestTube, Download, Upload, Copy, Eye, EyeOff, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

// 路由规则数据
const mockRoutes = [
  {
    id: "1",
    name: "核心设备告警",
    description: "核心交换机和服务器的告警路由",
    match: {
      severity: "critical",
      group: "core"
    },
    receiver: "ops-team",
    groupWait: "10s",
    groupInterval: "5m",
    repeatInterval: "12h",
    enabled: true,
    priority: 1
  },
  {
    id: "2",
    name: "业务告警",
    description: "业务相关的告警通知",
    match: {
      service: "business",
      severity: "warning|critical"
    },
    receiver: "business-team",
    groupWait: "30s",
    groupInterval: "10m",
    repeatInterval: "4h",
    enabled: true,
    priority: 2
  },
  {
    id: "3",
    name: "默认路由",
    description: "其他所有告警的默认处理",
    match: {},
    receiver: "default",
    groupWait: "1m",
    groupInterval: "15m",
    repeatInterval: "24h",
    enabled: true,
    priority: 999
  }
]

// 接收器数据
const mockReceivers = [
  {
    id: "1",
    name: "ops-team",
    description: "运维团队通知组",
    type: "multi",
    channels: [
      { type: "email", config: { to: ["ops@company.com"], subject: "[CRITICAL] 核心设备告警" } },
      { type: "dingtalk", config: { webhook: "https://oapi.dingtalk.com/robot/send?access_token=xxx", secret: "xxx" } },
      { type: "sms", config: { phones: ["+86138****1234", "+86139****5678"] } }
    ],
    enabled: true
  },
  {
    id: "2",
    name: "business-team",
    description: "业务团队通知组",
    type: "multi",
    channels: [
      { type: "email", config: { to: ["business@company.com"] } },
      { type: "wechat", config: { webhook: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx" } }
    ],
    enabled: true
  },
  {
    id: "3",
    name: "default",
    description: "默认通知接收器",
    type: "email",
    channels: [
      { type: "email", config: { to: ["admin@company.com"] } }
    ],
    enabled: true
  }
]

// 抑制规则数据
const mockInhibitRules = [
  {
    id: "1",
    name: "主机宕机抑制",
    description: "主机宕机时抑制该主机上的其他告警",
    sourceMatch: {
      alertname: "HostDown"
    },
    targetMatch: {
      instance: "{{ $labels.instance }}"
    },
    equal: ["instance"],
    enabled: true
  },
  {
    id: "2",
    name: "网络中断抑制",
    description: "网络中断时抑制相关的连接告警",
    sourceMatch: {
      alertname: "NetworkDown"
    },
    targetMatch: {
      alertname: "HighLatency|PacketLoss"
    },
    equal: ["datacenter"],
    enabled: true
  }
]

// 静默规则数据
const mockSilences = [
  {
    id: "1",
    comment: "维护窗口 - 核心交换机升级",
    matchers: [
      { name: "instance", value: "192.168.1.1", isRegex: false },
      { name: "severity", value: "warning|critical", isRegex: true }
    ],
    startsAt: "2024-01-20T02:00:00Z",
    endsAt: "2024-01-20T06:00:00Z",
    createdBy: "admin",
    status: "pending"
  },
  {
    id: "2",
    comment: "测试环境静默",
    matchers: [
      { name: "env", value: "test", isRegex: false }
    ],
    startsAt: "2024-01-15T00:00:00Z",
    endsAt: "2024-01-25T23:59:59Z",
    createdBy: "developer",
    status: "active"
  }
]

const CHANNEL_TYPES = [
  { value: "email", label: "邮件", icon: Mail },
  { value: "dingtalk", label: "钉钉", icon: MessageSquare },
  { value: "wechat", label: "企业微信", icon: MessageSquare },
  { value: "sms", label: "短信", icon: Phone },
  { value: "webhook", label: "Webhook", icon: Webhook }
]

const SEVERITY_LEVELS = [
  { value: "critical", label: "严重", color: "bg-red-500" },
  { value: "warning", label: "警告", color: "bg-orange-500" },
  { value: "info", label: "信息", color: "bg-blue-500" }
]

interface AlertmanagerConfigProps {
  onConfigChange?: (config: any) => void
}

export function AlertmanagerConfig({ onConfigChange }: AlertmanagerConfigProps) {
  const [routes, setRoutes] = useState(mockRoutes)
  const [receivers, setReceivers] = useState(mockReceivers)
  const [inhibitRules, setInhibitRules] = useState(mockInhibitRules)
  const [silences, setSilences] = useState(mockSilences)
  const [activeTab, setActiveTab] = useState("routes")
  const [showRouteEditor, setShowRouteEditor] = useState(false)
  const [showReceiverEditor, setShowReceiverEditor] = useState(false)
  const [showInhibitEditor, setShowInhibitEditor] = useState(false)
  const [showSilenceEditor, setShowSilenceEditor] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [testingReceiver, setTestingReceiver] = useState<string | null>(null)
  const [showConfigPreview, setShowConfigPreview] = useState(false)

  // 测试接收器
  const testReceiver = async (receiverId: string) => {
    setTestingReceiver(receiverId)
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "正在发送测试消息...",
        success: "测试消息发送成功",
        error: "测试消息发送失败"
      }
    )
    setTimeout(() => setTestingReceiver(null), 2000)
  }

  // 生成配置文件
  const generateConfig = () => {
    const config = {
      global: {
        smtp_smarthost: "smtp.company.com:587",
        smtp_from: "alerts@company.com"
      },
      route: {
        group_by: ["alertname", "cluster", "service"],
        group_wait: "10s",
        group_interval: "10s",
        repeat_interval: "1h",
        receiver: "default",
        routes: routes.filter(r => r.enabled).map(route => ({
          match: route.match,
          receiver: route.receiver,
          group_wait: route.groupWait,
          group_interval: route.groupInterval,
          repeat_interval: route.repeatInterval
        }))
      },
      receivers: receivers.filter(r => r.enabled).map(receiver => ({
        name: receiver.name,
        ...receiver.channels.reduce((acc: any, channel) => {
          if (channel.type === 'email') {
            acc.email_configs = acc.email_configs || []
            acc.email_configs.push(channel.config)
          } else if (channel.type === 'webhook') {
            acc.webhook_configs = acc.webhook_configs || []
            acc.webhook_configs.push(channel.config)
          }
          return acc
        }, {})
      })),
      inhibit_rules: inhibitRules.filter(r => r.enabled).map(rule => ({
        source_match: rule.sourceMatch,
        target_match: rule.targetMatch,
        equal: rule.equal
      }))
    }
    return config
  }

  // 导出配置
  const exportConfig = () => {
    const config = generateConfig()
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'alertmanager.yml'
    a.click()
    URL.revokeObjectURL(url)
    toast.success("配置文件已导出")
  }

  // 同步配置
  const syncConfig = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: "正在同步配置到Alertmanager...",
        success: "配置同步成功，Alertmanager已重新加载",
        error: "配置同步失败"
      }
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alertmanager 配置</h2>
          <p className="text-muted-foreground">管理告警路由、接收器和抑制规则</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowConfigPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            预览配置
          </Button>
          <Button variant="outline" onClick={exportConfig}>
            <Download className="mr-2 h-4 w-4" />
            导出配置
          </Button>
          <Button onClick={syncConfig}>
            <Upload className="mr-2 h-4 w-4" />
            同步配置
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="routes">路由规则</TabsTrigger>
          <TabsTrigger value="receivers">接收器</TabsTrigger>
          <TabsTrigger value="inhibit">抑制规则</TabsTrigger>
          <TabsTrigger value="silences">静默管理</TabsTrigger>
          <TabsTrigger value="templates">通知模板</TabsTrigger>
        </TabsList>

        {/* 路由规则 */}
        <TabsContent value="routes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">路由规则配置</h3>
            <Button onClick={() => {
              setEditingItem(null)
              setShowRouteEditor(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              新建路由
            </Button>
          </div>

          <div className="space-y-4">
            {routes.map((route, index) => (
              <Card key={route.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Route className="h-4 w-4" />
                        <span>{route.name}</span>
                        <Badge variant="outline">优先级 {route.priority}</Badge>
                        {route.enabled ? (
                          <Badge variant="secondary">启用</Badge>
                        ) : (
                          <Badge variant="outline">禁用</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{route.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => testReceiver(route.receiver)}>
                        <TestTube className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingItem(route)
                        setShowRouteEditor(true)
                      }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Switch 
                        checked={route.enabled}
                        onCheckedChange={(checked) => {
                          setRoutes(prev => prev.map(r => 
                            r.id === route.id ? { ...r, enabled: checked } : r
                          ))
                        }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">匹配条件</h4>
                      <div className="space-y-1">
                        {Object.entries(route.match).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2 text-sm">
                            <Badge variant="outline">{key}</Badge>
                            <span>=</span>
                            <code className="bg-muted px-1 rounded">{value}</code>
                          </div>
                        ))}
                        {Object.keys(route.match).length === 0 && (
                          <span className="text-muted-foreground text-sm">匹配所有告警</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">路由配置</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">接收器:</span>
                          <Badge>{route.receiver}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">分组等待:</span>
                          <span>{route.groupWait}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">分组间隔:</span>
                          <span>{route.groupInterval}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">重复间隔:</span>
                          <span>{route.repeatInterval}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 接收器 */}
        <TabsContent value="receivers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">通知接收器</h3>
            <Button onClick={() => {
              setEditingItem(null)
              setShowReceiverEditor(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              新建接收器
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {receivers.map((receiver) => (
              <Card key={receiver.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{receiver.name}</span>
                        {receiver.enabled ? (
                          <Badge variant="secondary">启用</Badge>
                        ) : (
                          <Badge variant="outline">禁用</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{receiver.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => testReceiver(receiver.id)}
                        disabled={testingReceiver === receiver.id}
                      >
                        {testingReceiver === receiver.id ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingItem(receiver)
                        setShowReceiverEditor(true)
                      }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Switch 
                        checked={receiver.enabled}
                        onCheckedChange={(checked) => {
                          setReceivers(prev => prev.map(r => 
                            r.id === receiver.id ? { ...r, enabled: checked } : r
                          ))
                        }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">通知渠道</h4>
                      <div className="space-y-2">
                        {receiver.channels.map((channel, index) => {
                          const channelType = CHANNEL_TYPES.find(t => t.type === channel.type)
                          const Icon = channelType?.icon || Bell
                          
                          return (
                            <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                              <Icon className="h-4 w-4" />
                              <Badge variant="outline">{channelType?.label}</Badge>
                              <span className="text-sm text-muted-foreground flex-1">
                                {channel.type === 'email' && channel.config.to?.join(', ')}
                                {channel.type === 'sms' && channel.config.phones?.join(', ')}
                                {(channel.type === 'dingtalk' || channel.type === 'wechat') && 'Webhook配置'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 抑制规则 */}
        <TabsContent value="inhibit" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">抑制规则</h3>
            <Button onClick={() => {
              setEditingItem(null)
              setShowInhibitEditor(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              新建抑制规则
            </Button>
          </div>

          <div className="space-y-4">
            {inhibitRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <VolumeX className="h-4 w-4" />
                        <span>{rule.name}</span>
                        {rule.enabled ? (
                          <Badge variant="secondary">启用</Badge>
                        ) : (
                          <Badge variant="outline">禁用</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingItem(rule)
                        setShowInhibitEditor(true)
                      }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Switch 
                        checked={rule.enabled}
                        onCheckedChange={(checked) => {
                          setInhibitRules(prev => prev.map(r => 
                            r.id === rule.id ? { ...r, enabled: checked } : r
                          ))
                        }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">源告警匹配</h4>
                      <div className="space-y-1">
                        {Object.entries(rule.sourceMatch).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2 text-sm">
                            <Badge variant="outline">{key}</Badge>
                            <span>=</span>
                            <code className="bg-muted px-1 rounded">{value}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">目标告警匹配</h4>
                      <div className="space-y-1">
                        {Object.entries(rule.targetMatch).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2 text-sm">
                            <Badge variant="outline">{key}</Badge>
                            <span>=</span>
                            <code className="bg-muted px-1 rounded">{value}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">相等标签</h4>
                    <div className="flex flex-wrap gap-1">
                      {rule.equal.map(label => (
                        <Badge key={label} variant="secondary">{label}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 静默管理 */}
        <TabsContent value="silences" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">静默规则</h3>
            <Button onClick={() => {
              setEditingItem(null)
              setShowSilenceEditor(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              新建静默
            </Button>
          </div>

          <div className="space-y-4">
            {silences.map((silence) => {
              const isActive = silence.status === 'active'
              const isPending = silence.status === 'pending'
              const isExpired = silence.status === 'expired'
              
              return (
                <Card key={silence.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Volume className="h-4 w-4" />
                          <span>{silence.comment}</span>
                          {isActive && <Badge variant="secondary">生效中</Badge>}
                          {isPending && <Badge variant="outline">待生效</Badge>}
                          {isExpired && <Badge variant="destructive">已过期</Badge>}
                        </CardTitle>
                        <CardDescription>
                          创建者: {silence.createdBy} | 
                          生效时间: {new Date(silence.startsAt).toLocaleString()} - {new Date(silence.endsAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="font-medium mb-2">匹配条件</h4>
                      <div className="space-y-1">
                        {silence.matchers.map((matcher, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <Badge variant="outline">{matcher.name}</Badge>
                            <span>{matcher.isRegex ? '=~' : '='}</span>
                            <code className="bg-muted px-1 rounded">{matcher.value}</code>
                            {matcher.isRegex && <Badge variant="secondary">正则</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* 通知模板 */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">通知模板</h3>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建模板
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>邮件模板</CardTitle>
                <CardDescription>自定义邮件通知的格式和内容</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>邮件主题</Label>
                    <Input defaultValue="[{{ .Status | toUpper }}] {{ .GroupLabels.alertname }}" />
                  </div>
                  <div>
                    <Label>邮件内容</Label>
                    <Textarea 
                      rows={6}
                      defaultValue={`告警详情:
{{ range .Alerts }}
- 告警名称: {{ .Labels.alertname }}
- 严重程度: {{ .Labels.severity }}
- 实例: {{ .Labels.instance }}
- 描述: {{ .Annotations.description }}
{{ end }}`}
                    />
                  </div>
                  <Button size="sm" variant="outline">
                    <TestTube className="mr-2 h-4 w-4" />
                    测试模板
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>钉钉模板</CardTitle>
                <CardDescription>自定义钉钉机器人消息格式</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>消息类型</Label>
                    <Select defaultValue="markdown">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">文本消息</SelectItem>
                        <SelectItem value="markdown">Markdown消息</SelectItem>
                        <SelectItem value="actionCard">卡片消息</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>消息内容</Label>
                    <Textarea 
                      rows={6}
                      defaultValue={`## 告警通知

**告警状态**: {{ .Status | toUpper }}

{{ range .Alerts }}
**告警名称**: {{ .Labels.alertname }}
**严重程度**: {{ .Labels.severity }}
**实例**: {{ .Labels.instance }}
**描述**: {{ .Annotations.description }}

{{ end }}`}
                    />
                  </div>
                  <Button size="sm" variant="outline">
                    <TestTube className="mr-2 h-4 w-4" />
                    测试模板
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 配置预览对话框 */}
      <Dialog open={showConfigPreview} onOpenChange={setShowConfigPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alertmanager 配置预览</DialogTitle>
            <DialogDescription>
              生成的 YAML 配置文件内容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">配置验证通过</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(generateConfig(), null, 2))
                toast.success("配置已复制到剪贴板")
              }}>
                <Copy className="mr-2 h-4 w-4" />
                复制配置
              </Button>
            </div>
            <ScrollArea className="h-96">
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{JSON.stringify(generateConfig(), null, 2)}</code>
              </pre>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}