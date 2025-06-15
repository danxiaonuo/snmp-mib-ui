'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Download, 
  Settings, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Server, 
  Database, 
  BarChart3, 
  Bell, 
  Network, 
  Activity,
  RefreshCw,
  FileText,
  Zap,
  Package,
  Puzzle,
  Globe,
  Monitor,
  Cloud,
  Shield,
  Users,
  Calendar,
  TrendingUp,
  GitBranch,
  Layers,
  Cpu,
  HardDrive,
  Wifi,
  Eye,
  Edit,
  Trash2,
  Copy,
  Plus,
  Search,
  Filter,
  Upload,
  Download as DownloadIcon,
  ExternalLink,
  Square,
  Pause,
  RotateCcw
} from 'lucide-react'

import ComponentDetails, { COMPONENT_CONFIGS } from './components/ComponentDetails'
import InstallProgress from './components/InstallProgress'

interface Component {
  id: string
  name: string
  description: string
  category: 'collector' | 'storage' | 'visualization' | 'alerting'
  required: boolean
  versions: string[]
  latestVersion: string
  status: 'not-installed' | 'installing' | 'installed' | 'error'
  config?: string
}

interface InstallProgress {
  component: string
  status: 'pending' | 'downloading' | 'configuring' | 'starting' | 'completed' | 'error'
  progress: number
  message: string
}

interface InstallTemplate {
  id: string
  name: string
  description: string
  category: 'basic' | 'advanced' | 'enterprise' | 'custom'
  components: string[]
  config: Record<string, any>
  author: string
  version: string
  downloads: number
  rating: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface Plugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  category: 'collector' | 'processor' | 'output' | 'visualization'
  status: 'available' | 'installed' | 'updating'
  size: string
  dependencies: string[]
  config?: Record<string, any>
}

interface Environment {
  id: string
  name: string
  type: 'development' | 'staging' | 'production'
  status: 'active' | 'inactive' | 'error'
  endpoint: string
  components: Component[]
  lastSync: string
  health: 'healthy' | 'warning' | 'critical'
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  actions?: { label: string; action: () => void }[]
}

const MONITORING_COMPONENTS: Component[] = [
  {
    id: 'node-exporter',
    name: 'Node Exporter',
    description: '🏥 系统体检医生 - 每隔几秒就给服务器做一次全身体检，测量CPU心跳、内存血压、磁盘健康度等生命体征\n\n【技术说明】收集Linux/Windows主机的硬件和操作系统指标，如CPU使用率、内存占用、磁盘I/O、网络流量等。通过HTTP接口暴露指标，支持自定义收集器，是服务器监控的基础组件。\n\n💡 **小贴士**: 默认端口9100，记住这个数字就像记住急救电话一样重要！\n🎯 **彩蛋**: 它能收集超过1000种不同的指标，比你的体检报告还详细！',
    category: 'collector',
    required: true,
    versions: ['1.7.0', '1.6.1', '1.6.0'],
    latestVersion: '1.7.0',
    status: 'not-installed'
  },
  {
    id: 'categraf',
    name: 'Categraf',
    description: '🕵️ 万能侦探 - 像福尔摩斯一样，能从各种奇怪的地方收集线索（指标），支持数据库、中间件、应用等多种"案发现场"\n\n【技术说明】全能型指标采集器，支持200+种数据源，包括MySQL、Redis、Kafka、Nginx等。采用插件化架构，低资源占用，配置简单，可替代Telegraf和多种Exporter。\n\n🔍 **侦探技能**: 支持200+种"案发现场"，从MySQL到MongoDB，从Redis到RabbitMQ！\n🎪 **马戏团表演**: 一个程序顶十个Exporter，堪称监控界的"瑞士军刀"！\n🏆 **成就解锁**: 夜神月同款全能收集器，"我要成为新世界的神！"',
    category: 'collector',
    required: false,
    versions: ['0.3.60', '0.3.59', '0.3.58'],
    latestVersion: '0.3.60',
    status: 'not-installed'
  },
  {
    id: 'vmagent',
    name: 'VMAgent',
    description: '🕷️ 勤劳小爬虫 - 就像浏览器一样，每隔15秒就去"访问"各个监控目标，把看到的数字全部"抄"下来并转发给数据库\n\n【技术说明】轻量级的指标收集代理，负责从各种Exporter拉取(Pull)指标数据，支持服务发现、指标过滤和重写，并将数据高效压缩后转发到存储后端，可大幅减少网络带宽和存储空间。\n\n🕸️ **蜘蛛侠技能**: 能同时"爬"成千上万个目标，比真正的蜘蛛还厉害！\n💾 **压缩大师**: 数据压缩率高达90%，堪比WinRAR的监控版！\n⚡ **闪电侠**: 15秒一轮巡逻，比保安大叔还勤快！\n🎮 **游戏彩蛋**: 支持服务发现，就像开了"全图透视"外挂！',
    category: 'collector',
    required: true,
    versions: ['1.96.0', '1.95.1', '1.95.0'],
    latestVersion: '1.96.0',
    status: 'not-installed'
  },
  {
    id: 'victoriametrics',
    name: 'VictoriaMetrics',
    description: '📚 超级图书馆（单机版）- 一个人管理整个图书馆，既负责收书、整理书，也负责借书给读者，适合小型"图书馆"\n\n【技术说明】高性能、低资源消耗的时序数据库单机版，完全兼容Prometheus API，支持PromQL查询语言，具有高压缩比(10x+)和快速查询能力，单个实例可处理百万级时间序列，适合中小规模部署。\n\n🏃‍♂️ **超人管理员**: 一个人干三个人的活，效率爆表！\n🗜️ **压缩魔法**: 10倍压缩比，1TB数据压成100GB，比魔术还神奇！\n🚀 **火箭速度**: 查询速度比Prometheus快20倍，嗖的一下就出结果！\n💰 **省钱小能手**: 内存占用只有Prometheus的1/7，老板看了都流泪！',
    category: 'storage',
    required: true,
    versions: ['1.96.0', '1.95.1', '1.95.0'],
    latestVersion: '1.96.0',
    status: 'not-installed'
  },
  {
    id: 'vmstorage',
    name: 'VMStorage',
    description: '🏛️ 图书馆仓库管理员 - 专门负责把书（数据）分类存放到不同的书架上，确保每本书都能安全保存且快速找到\n\n【技术说明】VictoriaMetrics集群版的存储组件，负责原始数据的持久化存储和管理。采用特殊的存储格式和索引结构，实现高压缩比和快速查询。支持水平扩展，可通过增加节点线性提升存储容量。\n\n📦 **收纳达人**: 数据整理得井井有条，连Marie Kondo都要拜师！\n🔐 **保险箱**: 数据安全性堪比瑞士银行，丢失率接近0！\n🏗️ **乐高积木**: 想要更多存储？再加一块"积木"就行！\n⚡ **闪电查找**: 从PB级数据中找到你要的那一条，比Google搜索还快！',
    category: 'storage',
    required: false,
    versions: ['1.96.0', '1.95.1', '1.95.0'],
    latestVersion: '1.96.0',
    status: 'not-installed'
  },
  {
    id: 'vminsert',
    name: 'VMInsert',
    description: '📮 图书馆前台接待员 - 专门负责接收新书（数据），检查后分发给合适的仓库管理员，确保每本书都能妥善入库\n\n【技术说明】VictoriaMetrics集群版的数据接收组件，处理所有写入请求，根据一致性哈希算法将数据分片并分发到多个vmstorage节点。支持多种数据接收协议，包括Prometheus remote write、InfluxDB和OpenTSDB等。\n\n🎯 **神射手**: 用一致性哈希算法精准投递，百发百中！\n🌐 **多语言专家**: 支持Prometheus、InfluxDB、OpenTSDB等多种"方言"！\n⚖️ **负载均衡大师**: 数据分发比快递小哥还均匀！\n🛡️ **守门员**: 严格检查每个数据包，坏数据一个都别想进来！',
    category: 'storage',
    required: false,
    versions: ['1.96.0', '1.95.1', '1.95.0'],
    latestVersion: '1.96.0',
    status: 'not-installed'
  },
  {
    id: 'vmselect',
    name: 'VMSelect',
    description: '🔍 图书馆查询专家 - 当读者想找书时，它会快速跑遍所有书架，把相关的书都找出来，整理好后交给读者\n\n【技术说明】VictoriaMetrics集群版的查询组件，处理所有读取请求，将查询请求分发到所有vmstorage节点，并合并结果返回给客户端。支持PromQL、MetricsQL查询语言，提供高性能的查询能力和结果缓存。\n\n🏃‍♂️ **马拉松选手**: 同时跑遍所有存储节点，体力无限！\n🧩 **拼图大师**: 把分散的数据片段完美拼接成完整答案！\n🧠 **记忆大师**: 查询结果缓存，问过的问题秒回答！\n🎭 **变脸艺术家**: 支持PromQL和MetricsQL两种"表演"风格！',
    category: 'storage',
    required: false,
    versions: ['1.96.0', '1.95.1', '1.95.0'],
    latestVersion: '1.96.0',
    status: 'not-installed'
  },
  {
    id: 'vmalert',
    name: 'VMAlert',
    description: '🚨 智能警报器 - 像烟雾报警器一样，24小时监控各种指标，一旦发现异常就立即"大喊大叫"通知相关人员\n\n【技术说明】告警规则评估引擎，定期执行PromQL/MetricsQL查询并根据结果触发告警。支持Prometheus兼容的告警规则，可将告警发送到Alertmanager，同时支持记录规则(recording rules)用于预计算常用查询，提高查询效率。\n\n👁️ **千里眼**: 24/7不眨眼监控，比保安摄像头还敬业！\n🎺 **号角手**: 一有异常立马"吹号"，比古代烽火台还快！\n🧮 **数学天才**: 预计算常用查询，让复杂运算变成"1+1=2"！\n🎪 **杂技演员**: 既能发警报，又能做记录，一专多能！\n💤 **贴心管家**: 深夜不会因为小问题吵醒你，只有真正紧急才会"敲门"！',
    category: 'alerting',
    required: false,
    versions: ['1.96.0', '1.95.1', '1.95.0'],
    latestVersion: '1.96.0',
    status: 'not-installed'
  },
  {
    id: 'grafana',
    name: 'Grafana',
    description: '🎨 数据艺术家 - 把枯燥的数字变成漂亮的图表和仪表盘，让你一眼就能看懂系统的"健康状况"，堪比数据界的毕加索\n\n【技术说明】开源的可视化和分析平台，支持多种数据源(VictoriaMetrics、Prometheus、MySQL等)，提供丰富的图表类型和交互式仪表盘。支持告警、注释、变量和模板等高级功能，是监控系统的"眼睛"。\n\n🌈 **调色盘大师**: 50+种图表类型，比画家的颜料盒还丰富！\n🎭 **变装达人**: 支持无数种主题和插件，想要什么风格都有！\n🔮 **时光机**: 可以穿越到任何时间点查看历史数据！\n🎪 **魔术师**: 把复杂的SQL查询变成简单的拖拽操作！\n🏆 **奥斯卡得主**: 全球500万+用户选择，监控界的"小金人"！',
    category: 'visualization',
    required: true,
    versions: ['10.2.3', '10.2.2', '10.2.1'],
    latestVersion: '10.2.3',
    status: 'not-installed'
  },
  {
    id: 'snmp-exporter',
    name: 'SNMP Exporter',
    description: '📡 网络设备翻译官 - 专门和路由器、交换机等网络设备"聊天"，把它们说的"设备语言"翻译成人类能懂的监控数据\n\n【技术说明】通过SNMP协议采集网络设备(路由器、交换机、防火墙等)的性能指标，将SNMP数据转换为Prometheus格式的指标。支持自动生成配置，可监控设备状态、接口流量、错误率、CPU和内存使用等。\n\n🗣️ **联合国翻译**: 能听懂上千种网络设备的"方言"！\n🔧 **设备驯兽师**: 连最古老的网络设备都能"驯服"！\n📊 **数据炼金术士**: 把神秘的OID数字变成有意义的监控指标！\n🎯 **狙击手**: 精准定位网络问题，一击必中！\n🏛️ **考古学家**: 能从1990年代的老设备中挖掘出有用信息！',
    category: 'collector',
    required: false,
    versions: ['0.24.1', '0.24.0', '0.23.0'],
    latestVersion: '0.24.1',
    status: 'not-installed'
  },
  {
    id: 'alertmanager',
    name: 'Alertmanager',
    description: '📢 告警管家 - 收到警报后不会盲目转发，而是智能分析：哪些警报需要合并？发给谁？什么时候发？避免半夜被垃圾警报吵醒\n\n【技术说明】告警处理中心，负责对告警进行分组、抑制、静默和路由。支持多种通知方式(邮件、Slack、钉钉、微信等)，提供告警去重、升级和时间静默等高级功能，确保告警及时送达但不会造成骚扰。\n\n🧠 **AI管家**: 智能分析告警，比真人秘书还贴心！\n🤐 **静音大师**: 深夜自动静音，让你安心睡觉！\n📱 **全能信使**: 支持邮件、微信、钉钉、Slack等十几种通知方式！\n🎯 **精准投递**: 根据告警级别和内容，精确发给对应负责人！\n🛡️ **垃圾过滤器**: 自动过滤重复和无意义告警，告别"狼来了"！\n⏰ **时间管理大师**: 工作时间紧急通知，休息时间只发重要告警！',
    category: 'alerting',
    required: false,
    versions: ['0.26.0', '0.25.1', '0.25.0'],
    latestVersion: '0.26.0',
    status: 'not-installed'
  }
]

// 模拟安装模板数据
const INSTALL_TEMPLATES: InstallTemplate[] = [
  {
    id: 'simple-monitoring',
    name: '简单监控套件',
    description: '单机版VictoriaMetrics，适合小型项目和快速部署',
    category: 'basic',
    components: ['node-exporter', 'vmagent', 'victoriametrics', 'grafana'],
    config: { deploymentMode: 'standalone', retention: '30d' },
    author: 'System',
    version: '1.0.0',
    downloads: 1850,
    rating: 4.6,
    tags: ['基础', '单机版', '快速部署', '简单'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: 'basic-monitoring',
    name: '基础监控套件',
    description: '包含基本的系统监控组件，VM集群模式，适合中型项目',
    category: 'basic',
    components: ['node-exporter', 'vmstorage', 'vminsert', 'vmselect', 'grafana'],
    config: { deploymentMode: 'cluster', retention: '30d', vmstorageReplicas: 1, vminsertReplicas: 1, vmselectReplicas: 1 },
    author: 'System',
    version: '1.0.0',
    downloads: 1250,
    rating: 4.5,
    tags: ['基础', 'VM集群', '快速部署'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: 'enterprise-monitoring',
    name: '企业级监控方案',
    description: '完整的企业级监控解决方案，包含高可用VM集群和告警',
    category: 'enterprise',
    components: ['node-exporter', 'categraf', 'vmagent', 'vmstorage', 'vminsert', 'vmselect', 'vmalert', 'grafana', 'alertmanager'],
    config: { deploymentMode: 'cluster', retention: '1y', ha: true, vmstorageReplicas: 3, vminsertReplicas: 2, vmselectReplicas: 2 },
    author: 'Enterprise Team',
    version: '2.1.0',
    downloads: 856,
    rating: 4.8,
    tags: ['企业级', '高可用', 'VM集群', '告警', '扩容'],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-25'
  },
  {
    id: 'network-monitoring-standalone',
    name: '网络设备监控(单机版)',
    description: '单机版网络设备监控，适合小规模网络环境',
    category: 'advanced',
    components: ['snmp-exporter', 'victoriametrics', 'vmalert', 'grafana', 'alertmanager'],
    config: { deploymentMode: 'standalone', snmpVersion: 'v2c', community: 'public', retention: '90d' },
    author: 'Network Team',
    version: '1.3.0',
    downloads: 632,
    rating: 4.4,
    tags: ['网络', 'SNMP', '设备监控', '单机版'],
    createdAt: '2024-01-12',
    updatedAt: '2024-01-22'
  },
  {
    id: 'network-monitoring',
    name: '网络设备监控(集群版)',
    description: '专门用于网络设备监控的组件组合，集群部署',
    category: 'advanced',
    components: ['snmp-exporter', 'vmstorage', 'vminsert', 'vmselect', 'vmalert', 'grafana', 'alertmanager'],
    config: { deploymentMode: 'cluster', snmpVersion: 'v2c', community: 'public', vmstorageReplicas: 2, vminsertReplicas: 1, vmselectReplicas: 1 },
    author: 'Network Team',
    version: '1.5.0',
    downloads: 432,
    rating: 4.3,
    tags: ['网络', 'SNMP', '设备监控', 'VM集群'],
    createdAt: '2024-01-12',
    updatedAt: '2024-01-22'
  },
  {
    id: 'vm-cluster-ha',
    name: 'VM高可用集群',
    description: 'VictoriaMetrics高可用集群部署，支持动态扩容',
    category: 'enterprise',
    components: ['vmagent', 'vmstorage', 'vminsert', 'vmselect', 'vmalert', 'grafana'],
    config: { deploymentMode: 'cluster', retention: '2y', ha: true, vmstorageReplicas: 5, vminsertReplicas: 3, vmselectReplicas: 3, autoScale: true },
    author: 'VM Team',
    version: '1.0.0',
    downloads: 324,
    rating: 4.9,
    tags: ['VM集群', '高可用', '自动扩容', '企业级'],
    createdAt: '2024-01-20',
    updatedAt: '2024-01-25'
  }
]

// 模拟插件数据
const AVAILABLE_PLUGINS: Plugin[] = [
  {
    id: 'mysql-exporter',
    name: 'MySQL Exporter',
    description: 'MySQL数据库监控插件',
    version: '0.14.0',
    author: 'Prometheus Community',
    category: 'collector',
    status: 'available',
    size: '15.2 MB',
    dependencies: ['node-exporter']
  },
  {
    id: 'redis-exporter',
    name: 'Redis Exporter',
    description: 'Redis缓存监控插件',
    version: '1.55.0',
    author: 'Redis Team',
    category: 'collector',
    status: 'installed',
    size: '12.8 MB',
    dependencies: []
  },
  {
    id: 'log-processor',
    name: '日志处理器',
    description: '日志收集和处理插件',
    version: '2.1.0',
    author: 'Log Team',
    category: 'processor',
    status: 'available',
    size: '28.5 MB',
    dependencies: ['victoriametrics']
  }
]

// 模拟环境数据
const ENVIRONMENTS: Environment[] = [
  {
    id: 'dev',
    name: '开发环境',
    type: 'development',
    status: 'active',
    endpoint: 'https://dev-monitoring.example.com',
    components: MONITORING_COMPONENTS.slice(0, 3),
    lastSync: '2024-01-25 14:30:00',
    health: 'healthy'
  },
  {
    id: 'staging',
    name: '测试环境',
    type: 'staging',
    status: 'active',
    endpoint: 'https://staging-monitoring.example.com',
    components: MONITORING_COMPONENTS.slice(0, 5),
    lastSync: '2024-01-25 14:25:00',
    health: 'warning'
  },
  {
    id: 'prod',
    name: '生产环境',
    type: 'production',
    status: 'active',
    endpoint: 'https://monitoring.example.com',
    components: MONITORING_COMPONENTS,
    lastSync: '2024-01-25 14:35:00',
    health: 'healthy'
  }
]

export default function MonitoringInstaller() {
  const [components, setComponents] = useState<Component[]>(MONITORING_COMPONENTS)
  const [selectedComponents, setSelectedComponents] = useState<string[]>(
    MONITORING_COMPONENTS.filter(c => c.required).map(c => c.id)
  )
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>(
    Object.fromEntries(MONITORING_COMPONENTS.map(c => [c.id, c.latestVersion]))
  )
  const [installProgress, setInstallProgress] = useState<InstallProgress[]>([])
  const [isInstalling, setIsInstalling] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [deploymentMode, setDeploymentMode] = useState<'single' | 'cluster'>('single')
  const [customConfig, setCustomConfig] = useState<Record<string, string>>({})
  
  // 新增状态
  const [templates, setTemplates] = useState<InstallTemplate[]>(INSTALL_TEMPLATES)
  const [plugins, setPlugins] = useState<Plugin[]>(AVAILABLE_PLUGINS)
  const [environments, setEnvironments] = useState<Environment[]>(ENVIRONMENTS)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showPluginDialog, setShowPluginDialog] = useState(false)
  const [selectedEnvironment, setSelectedEnvironment] = useState('dev')

  const categoryColors = {
    collector: 'bg-blue-100 text-blue-800',
    storage: 'bg-green-100 text-green-800',
    visualization: 'bg-purple-100 text-purple-800',
    alerting: 'bg-orange-100 text-orange-800'
  }

  const categoryNames = {
    collector: '数据采集',
    storage: '数据存储',
    visualization: '数据可视化',
    alerting: '告警管理'
  }

  const handleComponentToggle = (componentId: string, checked: boolean) => {
    const component = components.find(c => c.id === componentId)
    if (component?.required && !checked) {
      // toast.error('必需组件不能取消选择')
      return
    }

    setSelectedComponents(prev => 
      checked 
        ? [...prev, componentId]
        : prev.filter(id => id !== componentId)
    )
  }

  const handleDeploymentModeChange = (mode: 'single' | 'cluster') => {
    setDeploymentMode(mode)
    
    // 根据部署模式自动选择必需组件
    setSelectedComponents(prev => {
      let newSelected = prev.filter(id => {
        // 保留非存储类组件
        const comp = components.find(c => c.id === id)
        return comp && comp.category !== 'storage'
      })
      
      if (mode === 'single') {
        // 单机模式：添加VictoriaMetrics，移除集群组件
        newSelected = newSelected.filter(id => !['vmstorage', 'vminsert', 'vmselect'].includes(id))
        if (!newSelected.includes('victoriametrics')) {
          newSelected.push('victoriametrics')
        }
      } else {
        // 集群模式：添加VM集群组件，移除单机版
        newSelected = newSelected.filter(id => id !== 'victoriametrics')
        const clusterComponents = ['vmstorage', 'vminsert', 'vmselect']
        clusterComponents.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id)
          }
        })
      }
      
      // 确保必需组件被选中
      components.filter(c => c.required).forEach(comp => {
        if (!newSelected.includes(comp.id)) {
          newSelected.push(comp.id)
        }
      })
      
      return newSelected
    })
  }

  const handleVersionChange = (componentId: string, version: string) => {
    setSelectedVersions(prev => ({
      ...prev,
      [componentId]: version
    }))
  }

  const generateConfig = async () => {
    try {
      const response = await fetch('/api/monitoring/generate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          components: selectedComponents,
          versions: selectedVersions,
          deploymentMode
        })
      })

      if (!response.ok) throw new Error('配置生成失败')

      const configs = await response.json()
      setCustomConfig(configs)
      setActiveTab('configuration')
      // toast.success('配置文件生成成功')
    } catch (error) {
      // toast.error('配置生成失败: ' + (error as Error).message)
    }
  }

  const startInstallation = async () => {
    setIsInstalling(true)
    setActiveTab('installation')
    
    const selectedComps = components.filter(c => selectedComponents.includes(c.id))
    const progress: InstallProgress[] = selectedComps.map(c => ({
      component: c.name,
      status: 'pending',
      progress: 0,
      message: '等待开始...'
    }))
    
    setInstallProgress(progress)

    try {
      const response = await fetch('/api/monitoring/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          components: selectedComponents,
          versions: selectedVersions,
          deploymentMode,
          configs: customConfig
        })
      })

      if (!response.ok) throw new Error('安装启动失败')

      // 模拟安装进度
      for (let i = 0; i < selectedComps.length; i++) {
        const comp = selectedComps[i]
        
        // 下载阶段
        setInstallProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'downloading', progress: 25, message: '正在下载...' } : p
        ))
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // 配置阶段
        setInstallProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'configuring', progress: 50, message: '正在配置...' } : p
        ))
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 启动阶段
        setInstallProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'starting', progress: 75, message: '正在启动服务...' } : p
        ))
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 完成
        setInstallProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'completed', progress: 100, message: '安装完成' } : p
        ))
        
        setComponents(prev => prev.map(c => 
          c.id === comp.id ? { ...c, status: 'installed' } : c
        ))
      }
      
      // toast.success('所有组件安装完成')
    } catch (error) {
      // toast.error('安装失败: ' + (error as Error).message)
      setInstallProgress(prev => prev.map(p => ({ ...p, status: 'error', message: '安装失败' })))
    } finally {
      setIsInstalling(false)
    }
  }

  const getStatusIcon = (status: Component['status']) => {
    switch (status) {
      case 'installed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'installing': return <Download className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const getProgressColor = (status: InstallProgress['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      case 'downloading': case 'configuring': case 'starting': return 'bg-blue-500'
      default: return 'bg-gray-300'
    }
  }

  // 新增函数
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedComponents(template.components)
      setDeploymentMode(template.config.deploymentMode || 'single')
      setShowTemplateDialog(false)
      // toast.success(`已应用模板: ${template.name}`)
    }
  }

  const installPlugin = (pluginId: string) => {
    setPlugins(prev => prev.map(p => 
      p.id === pluginId ? { ...p, status: 'installed' } : p
    ))
    // toast.success('插件安装成功')
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Web可视化监控组件安装平台</h1>
          <p className="text-muted-foreground mt-2">
            企业级监控组件一站式安装、配置和管理平台
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {environments.map(env => (
                <SelectItem key={env.id} value={env.id}>
                  {env.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-sm">
            {selectedComponents.length} 个组件已选择
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dashboard">控制台</TabsTrigger>
          <TabsTrigger value="components">组件管理</TabsTrigger>
          <TabsTrigger value="templates">安装模板</TabsTrigger>
          <TabsTrigger value="plugins">插件市场</TabsTrigger>
          <TabsTrigger value="configuration">配置管理</TabsTrigger>
          <TabsTrigger value="installation">部署执行</TabsTrigger>
          <TabsTrigger value="monitoring">状态监控</TabsTrigger>
          <TabsTrigger value="environments">多环境管理</TabsTrigger>
        </TabsList>

        {/* 控制台 */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已安装组件</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {components.filter(c => c.status === 'installed').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  总共 {components.length} 个可用组件
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">活跃环境</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {environments.filter(e => e.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  总共 {environments.length} 个环境
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">可用模板</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.length}</div>
                <p className="text-xs text-muted-foreground">
                  包含 {templates.filter(t => t.category === 'enterprise').length} 个企业级模板
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">插件数量</CardTitle>
                <Puzzle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {plugins.filter(p => p.status === 'installed').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  总共 {plugins.length} 个可用插件
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>系统状态</CardTitle>
                <CardDescription>监控平台整体运行状态</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    <span>CPU 使用率</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={65} className="w-20" />
                    <span className="text-sm">65%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span>内存使用率</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={78} className="w-20" />
                    <span className="text-sm">78%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    <span>网络状态</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">正常</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>最近活动</CardTitle>
                <CardDescription>系统最新操作记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">Grafana 组件安装完成</p>
                      <p className="text-xs text-muted-foreground">2分钟前</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">应用企业级监控模板</p>
                      <p className="text-xs text-muted-foreground">5分钟前</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">配置文件已更新</p>
                      <p className="text-xs text-muted-foreground">10分钟前</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 组件管理 */}
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>部署模式</CardTitle>
              <CardDescription>选择监控系统的部署架构</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={deploymentMode} onValueChange={handleDeploymentModeChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">单机模式</SelectItem>
                  <SelectItem value="cluster">集群模式</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {Object.entries(
              components
                .filter(comp => {
                  // 根据部署模式过滤组件
                  if (deploymentMode === 'single') {
                    // 单机模式：显示VictoriaMetrics单机版，隐藏集群组件
                    return !['vmstorage', 'vminsert', 'vmselect'].includes(comp.id)
                  } else {
                    // 集群模式：显示VM集群组件，隐藏单机版
                    return comp.id !== 'victoriametrics'
                  }
                })
                .reduce((acc, comp) => {
                  if (!acc[comp.category]) acc[comp.category] = []
                  acc[comp.category].push(comp)
                  return acc
                }, {} as Record<string, Component[]>)
            ).map(([category, categoryComponents]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={categoryColors[category as keyof typeof categoryColors]}>
                      {categoryNames[category as keyof typeof categoryNames]}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {categoryComponents.map((component) => (
                      <div key={component.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Checkbox
                            checked={selectedComponents.includes(component.id)}
                            onCheckedChange={(checked) => handleComponentToggle(component.id, checked as boolean)}
                            disabled={component.required || (deploymentMode === 'single' && component.id === 'victoriametrics') || (deploymentMode === 'cluster' && ['vmstorage', 'vminsert', 'vmselect'].includes(component.id))}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{component.name}</h3>
                              {(component.required || (deploymentMode === 'single' && component.id === 'victoriametrics') || (deploymentMode === 'cluster' && ['vmstorage', 'vminsert', 'vmselect'].includes(component.id))) && <Badge variant="secondary">必需</Badge>}
                              {getStatusIcon(component.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{component.description}</p>
                          </div>
                        </div>
                        
                        {selectedComponents.includes(component.id) && (
                          <Select
                            value={selectedVersions[component.id]}
                            onValueChange={(version) => handleVersionChange(component.id, version)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {component.versions.map((version) => (
                                <SelectItem key={version} value={version}>
                                  {version}
                                  {version === component.latestVersion && (
                                    <Badge variant="outline" className="ml-2 text-xs">最新</Badge>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-4">
            <Button onClick={generateConfig} disabled={selectedComponents.length === 0}>
              <Settings className="h-4 w-4 mr-2" />
              生成配置
            </Button>
            <Button 
              onClick={startInstallation} 
              disabled={selectedComponents.length === 0 || isInstalling}
              variant="default"
            >
              <Play className="h-4 w-4 mr-2" />
              开始安装
            </Button>
          </div>
        </TabsContent>

        {/* 安装模板 */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索模板..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  <SelectItem value="basic">基础</SelectItem>
                  <SelectItem value="advanced">高级</SelectItem>
                  <SelectItem value="enterprise">企业级</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建模板
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>创建安装模板</DialogTitle>
                  <DialogDescription>
                    创建自定义的组件安装模板，方便重复使用
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">模板名称</Label>
                    <Input id="template-name" placeholder="输入模板名称" />
                  </div>
                  <div>
                    <Label htmlFor="template-desc">模板描述</Label>
                    <Textarea id="template-desc" placeholder="描述模板用途和特点" />
                  </div>
                  <div>
                    <Label>选择组件</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {components.map(comp => (
                        <div key={comp.id} className="flex items-center space-x-2">
                          <Checkbox id={comp.id} />
                          <Label htmlFor={comp.id} className="text-sm">{comp.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>取消</Button>
                    <Button>创建模板</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={template.category === 'enterprise' ? 'default' : 'secondary'}>
                          {template.category === 'basic' ? '基础' :
                           template.category === 'advanced' ? '高级' :
                           template.category === 'enterprise' ? '企业级' : '自定义'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm">{template.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">包含组件:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.components.map(compId => {
                        const comp = components.find(c => c.id === compId)
                        return comp ? (
                          <Badge key={compId} variant="outline" className="text-xs">
                            {comp.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>下载: {template.downloads}</span>
                    <span>v{template.version}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => applyTemplate(template.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      应用模板
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 插件市场 */}
        <TabsContent value="plugins" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索插件..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              上传插件
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins.map((plugin) => (
              <Card key={plugin.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{plugin.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={categoryColors[plugin.category]}>
                          {categoryNames[plugin.category] || plugin.category}
                        </Badge>
                        <Badge variant={plugin.status === 'installed' ? 'default' : 'outline'}>
                          {plugin.status === 'installed' ? '已安装' : 
                           plugin.status === 'updating' ? '更新中' : '可安装'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription>{plugin.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>版本: {plugin.version}</span>
                    <span>大小: {plugin.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>作者: {plugin.author}</span>
                  </div>
                  {plugin.dependencies.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">依赖:</p>
                      <div className="flex flex-wrap gap-1">
                        {plugin.dependencies.map(dep => (
                          <Badge key={dep} variant="outline" className="text-xs">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button 
                    size="sm" 
                    className="w-full"
                    disabled={plugin.status === 'installed'}
                    onClick={() => installPlugin(plugin.id)}
                  >
                    {plugin.status === 'installed' ? (
                      <><CheckCircle className="h-4 w-4 mr-1" />已安装</>
                    ) : (
                      <><Download className="h-4 w-4 mr-1" />安装插件</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 配置管理 */}
        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>配置文件管理</CardTitle>
              <CardDescription>查看和编辑生成的配置文件</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(customConfig).length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    请先在组件管理页面生成配置文件
                  </AlertDescription>
                </Alert>
              ) : (
                <Tabs defaultValue={Object.keys(customConfig)[0]} className="space-y-4">
                  <TabsList>
                    {Object.keys(customConfig).map(component => (
                      <TabsTrigger key={component} value={component}>
                        {component}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {Object.entries(customConfig).map(([component, config]) => (
                    <TabsContent key={component} value={component} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{component} 配置</Label>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Copy className="h-4 w-4 mr-1" />
                            复制
                          </Button>
                          <Button size="sm" variant="outline">
                            <DownloadIcon className="h-4 w-4 mr-1" />
                            下载
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={config}
                        onChange={(e) => setCustomConfig(prev => ({ ...prev, [component]: e.target.value }))}
                        className="font-mono text-sm min-h-[300px]"
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 部署执行 */}
        <TabsContent value="installation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>部署进度</CardTitle>
              <CardDescription>监控组件安装和部署状态</CardDescription>
            </CardHeader>
            <CardContent>
              {installProgress.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    尚未开始安装，请返回组件管理页面开始安装
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {installProgress.map((progress, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{progress.component}</span>
                        <Badge 
                          variant={progress.status === 'completed' ? 'default' : 
                                 progress.status === 'error' ? 'destructive' : 'secondary'}
                        >
                          {progress.message}
                        </Badge>
                      </div>
                      <Progress 
                        value={progress.progress} 
                        className={`h-2 ${getProgressColor(progress.status)}`}
                      />
                    </div>
                  ))}
                  
                  {isInstalling && (
                    <div className="flex justify-center mt-6">
                      <Button variant="outline" onClick={() => setIsInstalling(false)}>
                        <Square className="h-4 w-4 mr-2" />
                        取消安装
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 状态监控 */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {components.filter(c => c.status === 'installed').map((component) => (
              <Card key={component.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{component.name}</CardTitle>
                    <Badge className="bg-green-100 text-green-800">
                      运行中
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU 使用率</span>
                      <span>12%</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>内存使用率</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>运行时间</span>
                    <span>2天 14小时</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Pause className="h-4 w-4 mr-1" />
                      停止
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <RotateCcw className="h-4 w-4 mr-1" />
                      重启
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {components.filter(c => c.status === 'installed').length === 0 && (
              <div className="col-span-full">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    暂无已安装的组件可监控
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 多环境管理 */}
        <TabsContent value="environments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">环境管理</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加环境
            </Button>
          </div>

          <div className="grid gap-6">
            {environments.map((env) => (
              <Card key={env.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {env.name}
                        <Badge variant={env.type === 'production' ? 'default' : 'secondary'}>
                          {env.type === 'development' ? '开发' :
                           env.type === 'staging' ? '测试' : '生产'}
                        </Badge>
                        <Badge variant={env.status === 'active' ? 'default' : 'secondary'}>
                          {env.status === 'active' ? '活跃' : '非活跃'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{env.endpoint}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getHealthColor(env.health)}`}></div>
                      <span className={`text-sm ${getHealthColor(env.health)}`}>
                        {env.health === 'healthy' ? '健康' :
                         env.health === 'warning' ? '警告' : '严重'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">已部署组件 ({env.components.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {env.components.map(comp => (
                        <Badge key={comp.id} variant="outline" className="text-xs">
                          {comp.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>最后同步: {env.lastSync}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      同步
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-1" />
                      配置
                    </Button>
                    <Button size="sm" variant="outline">
                      <Monitor className="h-4 w-4 mr-1" />
                      监控
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}