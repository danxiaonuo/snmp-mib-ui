"use client"

import React, { useState } from 'react'
import { useLanguage } from '@/contexts/language-context' // Added
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
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
  ExternalLink,
  Info,
  HelpCircle,
  Code,
  Terminal,
  Cpu,
  HardDrive,
  Wifi,
  Globe,
  Clock,
  Layers
} from 'lucide-react'

interface ComponentVersion {
  version: string
  releaseDate: string
  downloadUrl: string
  changelog: string
  isLatest: boolean
}

// Architecture detection and download link generation
const getSystemArchitecture = (): string => {
  if (typeof window !== 'undefined') {
    const userAgent = window.navigator.userAgent.toLowerCase()
    if (userAgent.includes('arm64') || userAgent.includes('aarch64')) {
      return 'arm64'
    }
    if (userAgent.includes('armv7')) {
      return 'armv7'
    }
  }
  return 'amd64' // Default architecture
}

const generateDownloadUrl = (baseUrl: string, version: string, component: string, arch: string = getSystemArchitecture()): string => {
  // Generate correct download links based on different components and architectures
  const archMap: { [key: string]: string } = {
    'amd64': 'linux-amd64',
    'arm64': 'linux-arm64', 
    'armv7': 'linux-armv7'
  }
  
  const archSuffix = archMap[arch] || 'linux-amd64'
  
  // Special handling for different component naming conventions
  switch (component) {
    case 'node_exporter':
      return `https://github.com/prometheus/node_exporter/releases/download/v${version}/node_exporter-${version}.${archSuffix}.tar.gz`
    case 'categraf':
      return `https://github.com/flashcatcloud/categraf/releases/download/v${version}/categraf-v${version}-${archSuffix}.tar.gz`
    case 'vmutils':
      return `https://github.com/VictoriaMetrics/VictoriaMetrics/releases/download/v${version}/vmutils-${archSuffix}-v${version}.tar.gz`
    case 'victoria-metrics':
      return `https://github.com/VictoriaMetrics/VictoriaMetrics/releases/download/v${version}/victoria-metrics-${archSuffix}-v${version}.tar.gz`
    case 'grafana':
      return `${baseUrl}grafana-${version}.${archSuffix}.tar.gz`
    case 'snmp_exporter':
      return `https://github.com/prometheus/snmp_exporter/releases/download/v${version}/snmp_exporter-${version}.${archSuffix}.tar.gz`
    case 'alertmanager':
      return `https://github.com/prometheus/alertmanager/releases/download/v${version}/alertmanager-${version}.${archSuffix}.tar.gz`
    default:
      return baseUrl
  }
}

interface MonitoringComponent {
  id: string
  name: string
  description: string
  category: 'collector' | 'storage' | 'visualization' | 'alerting'
  versions: ComponentVersion[]
  defaultPort: number
  configurable: boolean
  dependencies: string[]
  features: string[]
  documentation: string
  requirements: {
    cpu: string
    memory: string
    disk: string
  }
}

// Mock component configuration data
export const COMPONENT_CONFIGS: Record<string, MonitoringComponent> = {
  'node-exporter': {
    id: 'node-exporter',
    name: 'Node Exporter',
    description: 'System metrics collector for CPU, memory, disk and other system metrics',
    category: 'collector',
    versions: [
      { 
        version: '1.7.0', 
        releaseDate: '2023-12-15', 
        downloadUrl: generateDownloadUrl('', '1.7.0', 'node_exporter'),
        changelog: '- Added network interface monitoring metrics\n- Fixed disk IO statistics issues\n- Performance optimization',
        isLatest: true
      },
      { 
        version: '1.6.1', 
        releaseDate: '2023-10-10', 
        downloadUrl: generateDownloadUrl('', '1.6.1', 'node_exporter'),
        changelog: '- Fixed memory statistics issues\n- Improved CPU usage calculation',
        isLatest: false
      },
      { 
        version: '1.6.0', 
        releaseDate: '2023-09-01', 
        downloadUrl: generateDownloadUrl('', '1.6.0', 'node_exporter'),
        changelog: '- Added filesystem monitoring\n- Support for more Linux kernel metrics',
        isLatest: false
      }
    ],
    defaultPort: 9100,
    configurable: false,
    dependencies: [],
    features: ['System Load Monitoring', 'CPU Usage', 'Memory Usage', 'Disk Usage', 'Network Traffic'],
    documentation: 'https://github.com/prometheus/node_exporter',
    requirements: {
      cpu: '1 core',
      memory: '64MB',
      disk: '20MB'
    }
  },
  'categraf': {
    id: 'categraf',
    name: 'Categraf',
    description: 'Multi-functional metrics collector supporting various data sources',
    category: 'collector',
    versions: [
      { 
        version: '0.3.60', 
        releaseDate: '2024-01-10', 
        downloadUrl: generateDownloadUrl('', '0.3.60', 'categraf'),
        changelog: '- Added Kafka collection plugin\n- Improved MySQL monitoring\n- Fixed log rotation issues',
        isLatest: true
      },
      { 
        version: '0.3.59', 
        releaseDate: '2023-12-20', 
        downloadUrl: generateDownloadUrl('', '0.3.59', 'categraf'),
        changelog: '- Added Redis monitoring module\n- Optimized configuration loading performance',
        isLatest: false
      },
      { 
        version: '0.3.58', 
        releaseDate: '2023-12-01', 
        downloadUrl: generateDownloadUrl('', '0.3.58', 'categraf'),
        changelog: '- Support for more protocols\n- Fixed memory leak issues',
        isLatest: false
      }
    ],
    defaultPort: 9100,
    configurable: true,
    dependencies: [],
    features: ['Multi-protocol Support', 'Plugin Architecture', 'Low Resource Usage', 'High Performance', 'Configuration Hot Reload'],
    documentation: 'https://github.com/flashcatcloud/categraf',
    requirements: {
      cpu: '1 core',
      memory: '128MB',
      disk: '50MB'
    }
  },
  'vmagent': {
    id: 'vmagent',
    name: 'VMAgent',
    description: '轻量级指标代理，负责指标收集和转发',
    category: 'collector',
    versions: [
      { 
        version: '1.96.0', 
        releaseDate: '2024-01-15', 
        downloadUrl: generateDownloadUrl('', '1.96.0', 'vmutils'),
        changelog: '- 提高数据压缩率\n- 改进服务发现机制\n- 新增Prometheus兼容API',
        isLatest: true
      },
      { 
        version: '1.95.1', 
        releaseDate: '2023-12-20', 
        downloadUrl: generateDownloadUrl('', '1.95.1', 'vmutils'),
        changelog: '- 修复高并发下的稳定性问题\n- 优化内存使用',
        isLatest: false
      },
      { 
        version: '1.95.0', 
        releaseDate: '2023-12-10', 
        downloadUrl: generateDownloadUrl('', '1.95.0', 'vmutils'),
        changelog: '- 新增远程写入功能\n- 支持多种服务发现机制',
        isLatest: false
      }
    ],
    defaultPort: 8429,
    configurable: true,
    dependencies: ['victoriametrics'],
    features: ['高性能', '低资源消耗', '数据压缩', '服务发现', '远程写入'],
    documentation: 'https://docs.victoriametrics.com/vmagent.html',
    requirements: {
      cpu: '2 cores',
      memory: '512MB',
      disk: '100MB'
    }
  },
  'victoriametrics': {
    id: 'victoriametrics',
    name: 'VictoriaMetrics',
    description: 'VictoriaMetrics单机版，高性能时序数据库，适合中小规模部署',
    category: 'storage',
    versions: [
      { 
        version: '1.96.0', 
        releaseDate: '2024-01-15', 
        downloadUrl: generateDownloadUrl('', '1.96.0', 'victoria-metrics'),
        changelog: '- 改进查询性能\n- 新增数据压缩算法\n- 修复内存使用问题',
        isLatest: true
      },
      { 
        version: '1.95.1', 
        releaseDate: '2023-12-20', 
        downloadUrl: generateDownloadUrl('', '1.95.1', 'victoria-metrics'),
        changelog: '- 修复查询bug\n- 优化存储引擎',
        isLatest: false
      },
      { 
        version: '1.95.0', 
        releaseDate: '2023-12-01', 
        downloadUrl: generateDownloadUrl('', '1.95.0', 'victoria-metrics'),
        changelog: '- 新增流式聚合\n- 改进HTTP API',
        isLatest: false
      }
    ],
    defaultPort: 8428,
    configurable: true,
    dependencies: [],
    features: ['高性能存储', 'PromQL兼容', '数据压缩', '快速查询', '低资源占用', '单机部署'],
    documentation: 'https://docs.victoriametrics.com/',
    requirements: {
      cpu: '2 cores',
      memory: '1GB',
      disk: '10GB'
    }
  },
  'vmstorage': {
    id: 'vmstorage',
    name: 'VMStorage',
    description: 'VictoriaMetrics集群存储节点，负责数据持久化存储',
    category: 'storage',
    versions: [
      { 
        version: '1.96.0', 
        releaseDate: '2024-01-15', 
        downloadUrl: generateDownloadUrl('', '1.96.0', 'victoria-metrics'),
        changelog: '- 提高存储性能\n- 优化数据压缩\n- 支持动态扩容',
        isLatest: true
      },
      { 
        version: '1.95.1', 
        releaseDate: '2023-12-20', 
        downloadUrl: generateDownloadUrl('', '1.95.1', 'victoria-metrics'),
        changelog: '- 修复存储稳定性问题\n- 优化内存使用',
        isLatest: false
      },
      { 
        version: '1.95.0', 
        releaseDate: '2023-12-10', 
        downloadUrl: generateDownloadUrl('', '1.95.0', 'victoria-metrics'),
        changelog: '- 新增集群模式\n- 支持水平扩展',
        isLatest: false
      }
    ],
    defaultPort: 8482,
    configurable: true,
    dependencies: [],
    features: ['数据持久化', '高压缩率', '快速查询', '水平扩展', '数据复制'],
    documentation: 'https://docs.victoriametrics.com/Cluster-VictoriaMetrics.html#vmstorage',
    requirements: {
      cpu: '4 cores',
      memory: '8GB',
      disk: '100GB SSD'
    }
  },
  'vminsert': {
    id: 'vminsert',
    name: 'VMInsert',
    description: 'VictoriaMetrics集群插入节点，负责接收和分发写入请求',
    category: 'storage',
    versions: [
      { 
        version: '1.96.0', 
        releaseDate: '2024-01-15', 
        downloadUrl: generateDownloadUrl('', '1.96.0', 'victoria-metrics'),
        changelog: '- 提高写入性能\n- 优化负载均衡\n- 支持批量写入',
        isLatest: true
      },
      { 
        version: '1.95.1', 
        releaseDate: '2023-12-20', 
        downloadUrl: generateDownloadUrl('', '1.95.1', 'victoria-metrics'),
        changelog: '- 修复高并发写入问题\n- 优化内存使用',
        isLatest: false
      },
      { 
        version: '1.95.0', 
        releaseDate: '2023-12-10', 
        downloadUrl: generateDownloadUrl('', '1.95.0', 'victoria-metrics'),
        changelog: '- 新增集群写入支持\n- 支持多种数据格式',
        isLatest: false
      }
    ],
    defaultPort: 8480,
    configurable: true,
    dependencies: ['vmstorage'],
    features: ['高并发写入', '负载均衡', '数据分片', '故障转移', '批量处理'],
    documentation: 'https://docs.victoriametrics.com/Cluster-VictoriaMetrics.html#vminsert',
    requirements: {
      cpu: '2 cores',
      memory: '2GB',
      disk: '10GB'
    }
  },
  'vmselect': {
    id: 'vmselect',
    name: 'VMSelect',
    description: 'VictoriaMetrics集群查询节点，负责处理查询请求',
    category: 'storage',
    versions: [
      { 
        version: '1.96.0', 
        releaseDate: '2024-01-15', 
        downloadUrl: generateDownloadUrl('', '1.96.0', 'victoria-metrics'),
        changelog: '- 提高查询性能\n- 优化聚合计算\n- 新增缓存机制',
        isLatest: true
      },
      { 
        version: '1.95.1', 
        releaseDate: '2023-12-20', 
        downloadUrl: generateDownloadUrl('', '1.95.1', 'victoria-metrics'),
        changelog: '- 修复查询稳定性问题\n- 改进高基数指标处理',
        isLatest: false
      },
      { 
        version: '1.95.0', 
        releaseDate: '2023-12-10', 
        downloadUrl: generateDownloadUrl('', '1.95.0', 'victoria-metrics'),
        changelog: '- 新增集群查询支持\n- 优化查询性能',
        isLatest: false
      }
    ],
    defaultPort: 8481,
    configurable: true,
    dependencies: ['vmstorage'],
    features: ['高性能查询', 'Prometheus兼容', '查询缓存', '多租户支持', '聚合计算'],
    documentation: 'https://docs.victoriametrics.com/Cluster-VictoriaMetrics.html#vmselect',
    requirements: {
      cpu: '2 cores',
      memory: '4GB',
      disk: '10GB'
    }
  },
  'vmalert': {
    id: 'vmalert',
    name: 'VMAlert',
    description: 'VictoriaMetrics告警组件，支持告警规则评估和通知',
    category: 'alerting',
    versions: [
      { 
        version: '1.96.0', 
        releaseDate: '2024-01-15', 
        downloadUrl: generateDownloadUrl('', '1.96.0', 'vmutils'),
        changelog: '- 新增告警规则模板\n- 改进通知机制\n- 支持多种通知渠道',
        isLatest: true
      },
      { 
        version: '1.95.1', 
        releaseDate: '2023-12-20', 
        downloadUrl: generateDownloadUrl('', '1.95.1', 'vmutils'),
        changelog: '- 修复告警规则解析问题\n- 优化性能',
        isLatest: false
      },
      { 
        version: '1.95.0', 
        releaseDate: '2023-12-10', 
        downloadUrl: generateDownloadUrl('', '1.95.0', 'vmutils'),
        changelog: '- 新增告警功能\n- 支持Prometheus告警规则',
        isLatest: false
      }
    ],
    defaultPort: 8880,
    configurable: true,
    dependencies: ['vmselect'],
    features: ['告警规则评估', 'Prometheus兼容', '多种通知渠道', '告警抑制', '告警分组'],
    documentation: 'https://docs.victoriametrics.com/vmalert.html',
    requirements: {
      cpu: '1 core',
      memory: '512MB',
      disk: '1GB'
    }
  },
  'grafana': {
    id: 'grafana',
    name: 'Grafana',
    description: '数据可视化和监控面板',
    category: 'visualization',
    versions: [
      { 
        version: '10.2.3', 
        releaseDate: '2024-01-20', 
        downloadUrl: generateDownloadUrl('https://dl.grafana.com/oss/release/', '10.2.3', 'grafana'),
        changelog: '- 新增仪表盘模板\n- 改进告警管理\n- 修复安全漏洞',
        isLatest: true
      },
      { 
        version: '10.2.2', 
        releaseDate: '2023-12-15', 
        downloadUrl: generateDownloadUrl('https://dl.grafana.com/oss/release/', '10.2.2', 'grafana'),
        changelog: '- 修复UI渲染问题\n- 改进用户认证',
        isLatest: false
      },
      { 
        version: '10.2.1', 
        releaseDate: '2023-12-01', 
        downloadUrl: generateDownloadUrl('https://dl.grafana.com/oss/release/', '10.2.1', 'grafana'),
        changelog: '- 新增数据源支持\n- 优化查询性能',
        isLatest: false
      }
    ],
    defaultPort: 3000,
    configurable: true,
    dependencies: [],
    features: ['多数据源支持', '丰富的可视化', '告警管理', '用户认证', '插件生态'],
    documentation: 'https://grafana.com/docs/grafana/latest/',
    requirements: {
      cpu: '2 cores',
      memory: '512MB',
      disk: '200MB'
    }
  },
  'snmp-exporter': {
    id: 'snmp-exporter',
    name: 'SNMP Exporter',
    description: 'SNMP设备监控导出器',
    category: 'collector',
    versions: [
      { 
        version: '0.24.1', 
        releaseDate: '2023-12-10', 
        downloadUrl: generateDownloadUrl('', '0.24.1', 'snmp_exporter'),
        changelog: '- 新增设备MIB支持\n- 修复SNMP v3认证问题',
        isLatest: true
      },
      { 
        version: '0.24.0', 
        releaseDate: '2023-11-15', 
        downloadUrl: generateDownloadUrl('', '0.24.0', 'snmp_exporter'),
        changelog: '- 改进错误处理\n- 优化性能',
        isLatest: false
      },
      { 
        version: '0.23.0', 
        releaseDate: '2023-10-01', 
        downloadUrl: generateDownloadUrl('', '0.23.0', 'snmp_exporter'),
        changelog: '- 支持更多网络设备\n- 新增自动发现功能',
        isLatest: false
      }
    ],
    defaultPort: 9116,
    configurable: true,
    dependencies: [],
    features: ['SNMP v1/v2c/v3支持', '自动MIB转换', '多设备监控', '自定义指标'],
    documentation: 'https://github.com/prometheus/snmp_exporter',
    requirements: {
      cpu: '1 core',
      memory: '128MB',
      disk: '50MB'
    }
  },
  'alertmanager': {
    id: 'alertmanager',
    name: 'Alertmanager',
    description: '告警管理和通知系统',
    category: 'alerting',
    versions: [
      { 
        version: '0.26.0', 
        releaseDate: '2023-12-20', 
        downloadUrl: generateDownloadUrl('', '0.26.0', 'alertmanager'),
        changelog: '- 新增告警分组功能\n- 改进通知模板\n- 支持更多通知渠道',
        isLatest: true
      },
      { 
        version: '0.25.1', 
        releaseDate: '2023-11-10', 
        downloadUrl: generateDownloadUrl('', '0.25.1', 'alertmanager'),
        changelog: '- 修复高可用模式下的同步问题\n- 改进Web UI',
        isLatest: false
      },
      { 
        version: '0.25.0', 
        releaseDate: '2023-10-15', 
        downloadUrl: generateDownloadUrl('', '0.25.0', 'alertmanager'),
        changelog: '- 新增静默功能\n- 支持更多集成',
        isLatest: false
      }
    ],
    defaultPort: 9093,
    configurable: true,
    dependencies: [],
    features: ['告警分组', '告警抑制', '告警静默', '多种通知方式', '高可用模式'],
    documentation: 'https://prometheus.io/docs/alerting/latest/alertmanager/',
    requirements: {
      cpu: '1 core',
      memory: '128MB',
      disk: '50MB'
    }
  }
}

const CategoryBadge = ({ category, t }: { category: string; t: (key: string) => string }) => {
  const categoryColors: Record<string, string> = {
    collector: 'bg-blue-100 text-blue-800',
    storage: 'bg-green-100 text-green-800',
    visualization: 'bg-purple-100 text-purple-800',
    alerting: 'bg-orange-100 text-orange-800'
  }

  // Using t function for names now
  const categoryKeyMap: Record<string, string> = {
    collector: 'categories.collector',
    storage: 'categories.storage',
    visualization: 'categories.visualization',
    alerting: 'categories.alerting'
  }

  return (
    <Badge className={categoryColors[category]}>
      {t(categoryKeyMap[category] || category)}
    </Badge>
  )
}

// Forward declaration for t type, or import from LanguageContext if preferred
type TFunction = (key: string, params?: Record<string, string | number>) => string;

const ComponentSettings = ({ componentId, t }: { componentId: string; t: TFunction }) => {
  const [settings, setSettings] = useState<Record<string, any>>({})

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (componentId === 'node-exporter') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="ne-enabled" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            {t('componentSettings.nodeExporter.enableHostMetrics.label')}
          </Label>
          <Switch 
            id="ne-enabled" 
            checked={settings.enabled !== false}
            onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ne-port">{t('componentSettings.nodeExporter.listenPort.label')}</Label>
          <Input 
            id="ne-port" 
            type="number" 
            defaultValue="9100" 
            onChange={(e) => handleSettingChange('port', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('componentSettings.nodeExporter.enabledCollectors.label')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {['cpu', 'diskstats', 'filesystem', 'loadavg', 'meminfo', 'netdev'].map(collector => (
              <div key={collector} className="flex items-center space-x-2">
                <Checkbox 
                  id={`collector-${collector}`} 
                  defaultChecked 
                  onCheckedChange={(checked) => {
                    const collectors = settings.collectors || ['cpu', 'diskstats', 'filesystem', 'loadavg', 'meminfo', 'netdev']
                    if (checked) {
                      handleSettingChange('collectors', [...collectors, collector])
                    } else {
                      handleSettingChange('collectors', collectors.filter((c: string) => c !== collector))
                    }
                  }}
                />
                <Label htmlFor={`collector-${collector}`} className="text-sm">{collector}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (componentId === 'categraf') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cat-interval">{t('componentSettings.categraf.interval.label')}</Label>
          <Input 
            id="cat-interval" 
            type="number" 
            defaultValue="15" 
            onChange={(e) => handleSettingChange('interval', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-hostname">{t('componentSettings.categraf.hostname.label')}</Label>
          <Input 
            id="cat-hostname" 
            defaultValue="auto" 
            onChange={(e) => handleSettingChange('hostname', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('componentSettings.categraf.enabledPlugins.label')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {['cpu', 'disk', 'diskio', 'mem', 'net', 'processes'].map(plugin => (
              <div key={plugin} className="flex items-center space-x-2">
                <Checkbox 
                  id={`plugin-${plugin}`} 
                  defaultChecked 
                  onCheckedChange={(checked) => {
                    const plugins = settings.plugins || ['cpu', 'disk', 'diskio', 'mem', 'net', 'processes']
                    if (checked) {
                      handleSettingChange('plugins', [...plugins, plugin])
                    } else {
                      handleSettingChange('plugins', plugins.filter((p: string) => p !== plugin))
                    }
                  }}
                />
                <Label htmlFor={`plugin-${plugin}`} className="text-sm">{plugin}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (componentId === 'victoriametrics') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vm-retention">{t('componentSettings.victoriametrics.retentionPeriod.label')}</Label>
          <Input 
            id="vm-retention" 
            type="number" 
            defaultValue="30" 
            onChange={(e) => handleSettingChange('retention', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vm-port">{t('componentSettings.victoriametrics.httpListenPort.label')}</Label>
          <Input 
            id="vm-port" 
            type="number" 
            defaultValue="8428" 
            onChange={(e) => handleSettingChange('httpPort', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vm-storage">{t('componentSettings.victoriametrics.storagePath.label')}</Label>
          <Input 
            id="vm-storage" 
            defaultValue="/var/lib/victoriametrics" 
            onChange={(e) => handleSettingChange('storagePath', e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="vm-dedup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {t('componentSettings.victoriametrics.enableDeduplication.label')}
          </Label>
          <Switch 
            id="vm-dedup" 
            defaultChecked={true}
            onCheckedChange={(checked) => handleSettingChange('deduplication', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="vm-remote-write" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            {t('componentSettings.victoriametrics.enableRemoteWrite.label')}
          </Label>
          <Switch 
            id="vm-remote-write" 
            defaultChecked={false}
            onCheckedChange={(checked) => handleSettingChange('remoteWrite', checked)}
          />
        </div>
      </div>
    )
  }

  if (componentId === 'vmstorage') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vms-retention">{t('componentSettings.vmstorage.retentionPeriod.label')}</Label>
          <Input 
            id="vms-retention" 
            type="number" 
            defaultValue="30" 
            onChange={(e) => handleSettingChange('retention', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vms-port">{t('componentSettings.vmstorage.httpListenPort.label')}</Label>
          <Input 
            id="vms-port" 
            type="number" 
            defaultValue="8482" 
            onChange={(e) => handleSettingChange('httpPort', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vms-storage">{t('componentSettings.vmstorage.storagePath.label')}</Label>
          <Input 
            id="vms-storage" 
            defaultValue="/var/lib/vmstorage" 
            onChange={(e) => handleSettingChange('storagePath', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vms-replicas">{t('componentSettings.vmstorage.replicas.label')}</Label>
          <div className="flex items-center space-x-4">
            <Slider
              id="vms-replicas"
              min={1}
              max={10}
              step={1}
              defaultValue={[3]}
              onValueChange={(value) => handleSettingChange('replicas', value[0])}
              className="flex-1"
            />
            <span className="text-sm font-medium w-8">{settings.replicas || 3}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="vms-dedup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {t('componentSettings.vmstorage.enableDeduplication.label')}
          </Label>
          <Switch 
            id="vms-dedup" 
            defaultChecked={true}
            onCheckedChange={(checked) => handleSettingChange('deduplication', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="vms-autoscale" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {t('componentSettings.vmstorage.enableAutoScale.label')}
          </Label>
          <Switch 
            id="vms-autoscale" 
            defaultChecked={false}
            onCheckedChange={(checked) => handleSettingChange('autoScale', checked)}
          />
        </div>
      </div>
    )
  }

  if (componentId === 'vminsert') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vmi-port">{t('componentSettings.vminsert.httpListenPort.label')}</Label>
          <Input 
            id="vmi-port" 
            type="number" 
            defaultValue="8480" 
            onChange={(e) => handleSettingChange('httpPort', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vmi-storage-nodes">{t('componentSettings.vminsert.storageNodes.label')}</Label>
          <Textarea 
            id="vmi-storage-nodes" 
            defaultValue="vmstorage-1:8400,vmstorage-2:8400,vmstorage-3:8400" 
            onChange={(e) => handleSettingChange('storageNodes', e.target.value)}
            placeholder={t('componentSettings.vminsert.storageNodes.placeholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vmi-replicas">{t('componentSettings.vminsert.replicas.label')}</Label>
          <div className="flex items-center space-x-4">
            <Slider
              id="vmi-replicas"
              min={1}
              max={5}
              step={1}
              defaultValue={[2]}
              onValueChange={(value) => handleSettingChange('replicas', value[0])}
              className="flex-1"
            />
            <span className="text-sm font-medium w-8">{settings.replicas || 2}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="vmi-autoscale" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {t('componentSettings.vminsert.enableAutoScale.label')}
          </Label>
          <Switch 
            id="vmi-autoscale" 
            defaultChecked={false}
            onCheckedChange={(checked) => handleSettingChange('autoScale', checked)}
          />
        </div>
      </div>
    )
  }

  if (componentId === 'vmselect') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vmsel-port">{t('componentSettings.vmselect.httpListenPort.label')}</Label>
          <Input 
            id="vmsel-port" 
            type="number" 
            defaultValue="8481" 
            onChange={(e) => handleSettingChange('httpPort', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vmsel-storage-nodes">{t('componentSettings.vmselect.storageNodes.label')}</Label>
          <Textarea 
            id="vmsel-storage-nodes" 
            defaultValue="vmstorage-1:8401,vmstorage-2:8401,vmstorage-3:8401" 
            onChange={(e) => handleSettingChange('storageNodes', e.target.value)}
            placeholder={t('componentSettings.vmselect.storageNodes.placeholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vmsel-replicas">{t('componentSettings.vmselect.replicas.label')}</Label>
          <div className="flex items-center space-x-4">
            <Slider
              id="vmsel-replicas"
              min={1}
              max={5}
              step={1}
              defaultValue={[2]}
              onValueChange={(value) => handleSettingChange('replicas', value[0])}
              className="flex-1"
            />
            <span className="text-sm font-medium w-8">{settings.replicas || 2}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vmsel-cache-size">{t('componentSettings.vmselect.cacheSizeMB.label')}</Label>
          <Input 
            id="vmsel-cache-size" 
            type="number" 
            defaultValue="512" 
            onChange={(e) => handleSettingChange('cacheSize', e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="vmsel-autoscale" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {t('componentSettings.vmselect.enableAutoScale.label')}
          </Label>
          <Switch 
            id="vmsel-autoscale" 
            defaultChecked={false}
            onCheckedChange={(checked) => handleSettingChange('autoScale', checked)}
          />
        </div>
      </div>
    )
  }

  if (componentId === 'vmalert') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vma-port">{t('componentSettings.vmalert.httpListenPort.label')}</Label>
          <Input 
            id="vma-port" 
            type="number" 
            defaultValue="8880" 
            onChange={(e) => handleSettingChange('httpPort', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vma-datasource">{t('componentSettings.vmalert.datasourceUrl.label')}</Label>
          <Input 
            id="vma-datasource" 
            defaultValue="http://vmselect:8481/select/0/prometheus" 
            onChange={(e) => handleSettingChange('datasourceUrl', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vma-notifier">{t('componentSettings.vmalert.notifierUrl.label')}</Label>
          <Input 
            id="vma-notifier" 
            defaultValue="http://alertmanager:9093" 
            onChange={(e) => handleSettingChange('notifierUrl', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vma-eval-interval">{t('componentSettings.vmalert.evaluationInterval.label')}</Label>
          <Input 
            id="vma-eval-interval" 
            type="number" 
            defaultValue="15" 
            onChange={(e) => handleSettingChange('evaluationInterval', e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="vma-external-labels" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('componentSettings.vmalert.enableExternalLabels.label')}
          </Label>
          <Switch 
            id="vma-external-labels" 
            defaultChecked={true}
            onCheckedChange={(checked) => handleSettingChange('externalLabels', checked)}
          />
        </div>
      </div>
    )
  }

  if (componentId === 'vmagent') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vma-remote-url">{t('componentSettings.vmagent.remoteWriteUrl.label')}</Label>
          <Input 
            id="vma-remote-url" 
            defaultValue="http://localhost:8428/api/v1/write" 
            onChange={(e) => handleSettingChange('remoteWriteUrl', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vma-scrape-interval">{t('componentSettings.vmagent.scrapeInterval.label')}</Label>
          <Input 
            id="vma-scrape-interval" 
            type="number" 
            defaultValue="15" 
            onChange={(e) => handleSettingChange('scrapeInterval', e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="vma-discovery" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            {t('componentSettings.vmagent.enableServiceDiscovery.label')}
          </Label>
          <Switch 
            id="vma-discovery" 
            defaultChecked={false}
            onCheckedChange={(checked) => handleSettingChange('serviceDiscovery', checked)}
          />
        </div>
      </div>
    )
  }

  if (componentId === 'grafana') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="grafana-port">{t('componentSettings.grafana.httpPort.label')}</Label>
          <Input 
            id="grafana-port" 
            type="number" 
            defaultValue="3000" 
            onChange={(e) => handleSettingChange('port', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="grafana-admin">{t('componentSettings.grafana.adminUser.label')}</Label>
          <Input 
            id="grafana-admin" 
            defaultValue="admin" 
            onChange={(e) => handleSettingChange('adminUser', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="grafana-password">{t('componentSettings.grafana.adminPassword.label')}</Label>
          <Input 
            id="grafana-password" 
            type="password" 
            defaultValue="admin" 
            onChange={(e) => handleSettingChange('adminPassword', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('componentSettings.grafana.autoConfigDataSource.label')}</Label>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="grafana-ds-vm" 
                defaultChecked 
                onCheckedChange={(checked) => handleSettingChange('configureVMDataSource', checked)}
              />
              <Label htmlFor="grafana-ds-vm" className="text-sm">{t('componentSettings.grafana.vmDataSource.label')}</Label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (componentId === 'alertmanager') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="am-port">{t('componentSettings.alertmanager.httpPort.label')}</Label>
          <Input 
            id="am-port" 
            type="number" 
            defaultValue="9093" 
            onChange={(e) => handleSettingChange('port', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="am-cluster">{t('componentSettings.alertmanager.clusterPeers.label')}</Label>
          <Textarea 
            id="am-cluster" 
            placeholder={t('componentSettings.alertmanager.clusterPeers.placeholder')}
            onChange={(e) => handleSettingChange('peers', e.target.value.split('\n'))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('componentSettings.alertmanager.notificationChannel.label')}</Label>
          <Select defaultValue="email" onValueChange={(value) => handleSettingChange('notifier', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">{t('componentSettings.alertmanager.notifiers.email')}</SelectItem>
              <SelectItem value="webhook">{t('componentSettings.alertmanager.notifiers.webhook')}</SelectItem>
              <SelectItem value="slack">{t('componentSettings.alertmanager.notifiers.slack')}</SelectItem>
              <SelectItem value="wechat">{t('componentSettings.alertmanager.notifiers.wechat')}</SelectItem>
              <SelectItem value="dingtalk">{t('componentSettings.alertmanager.notifiers.dingtalk')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  if (componentId === 'snmp-exporter') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="snmp-port">{t('componentSettings.snmpExporter.httpPort.label')}</Label>
          <Input 
            id="snmp-port" 
            type="number" 
            defaultValue="9116" 
            onChange={(e) => handleSettingChange('port', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="snmp-version">{t('componentSettings.snmpExporter.snmpVersion.label')}</Label>
          <Select defaultValue="v2c" onValueChange={(value) => handleSettingChange('snmpVersion', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="v1">{t('componentSettings.snmpExporter.versions.v1')}</SelectItem>
              <SelectItem value="v2c">{t('componentSettings.snmpExporter.versions.v2c')}</SelectItem>
              <SelectItem value="v3">{t('componentSettings.snmpExporter.versions.v3')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="snmp-community">{t('componentSettings.snmpExporter.communityString.label')}</Label>
          <Input 
            id="snmp-community" 
            defaultValue="public" 
            onChange={(e) => handleSettingChange('community', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="snmp-targets">{t('componentSettings.snmpExporter.targetDevices.label')}</Label>
          <Textarea 
            id="snmp-targets" 
            placeholder={t('componentSettings.snmpExporter.targetDevices.placeholder')}
            onChange={(e) => handleSettingChange('targets', e.target.value.split('\n'))}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border rounded-md bg-muted/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Info className="h-4 w-4" />
        <p>{t('componentSettings.noSettingsAvailable')}</p>
      </div>
    </div>
  )
}

interface ComponentDetailsProps {
  componentId: string
  onVersionChange: (version: string) => void
  selectedVersion: string
}

export default function ComponentDetails({ componentId, onVersionChange, selectedVersion }: ComponentDetailsProps) {
  const { t } = useLanguage() // Added
  const component = COMPONENT_CONFIGS[componentId]
  
  if (!component) {
    return (
      <div className="p-4 border rounded-md">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <p>{t('componentDetails.notFound')}</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{component.name}</CardTitle> {/* Assuming component.name is a proper noun or translated in data */}
            <div className="flex items-center gap-2 mt-1">
              <CategoryBadge category={component.category} t={t} />
              <Badge variant="outline" className="text-xs">
                {t('componentDetails.portLabel')} {component.defaultPort}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription>{component.description}</CardDescription> {/* Assuming component.description is translated in data or proper noun */}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('componentDetails.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="versions">{t('componentDetails.tabs.versions')}</TabsTrigger>
            <TabsTrigger value="config">{t('componentDetails.tabs.config')}</TabsTrigger>
            <TabsTrigger value="docs">{t('componentDetails.tabs.docs')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">{t('componentDetails.overview.mainFeatures')}</h4>
              <div className="grid grid-cols-2 gap-2">
                {component.features.map((feature, index) => ( // Features are from data - translate in data source if needed
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">{t('componentDetails.overview.defaultPort')}</h4>
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-blue-500" />
                <span className="text-sm">{component.defaultPort}</span>
              </div>
            </div>
            
            {component.dependencies.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">{t('componentDetails.overview.dependencies')}</h4>
                <div className="flex flex-wrap gap-1">
                  {component.dependencies.map(dep => { // dep names are from data
                    const depComponent = COMPONENT_CONFIGS[dep]
                    return (
                      <Badge key={dep} variant="outline" className="text-xs">
                        {depComponent?.name || dep}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium mb-2">{t('componentDetails.overview.systemRequirements')}</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{t('componentDetails.overview.cpuLabel')} {component.requirements.cpu}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('componentDetails.overview.memoryLabel')} {component.requirements.memory}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">{t('componentDetails.overview.diskLabel')} {component.requirements.disk}</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="versions" className="space-y-4">
            <div className="space-y-4">
              {component.versions.map((version) => (
                <Card key={version.version} className={`border ${version.version === selectedVersion ? 'border-primary' : ''}`}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{version.version}</CardTitle>
                        {version.isLatest && <Badge>{t('componentDetails.versions.latestBadge')}</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant={version.version === selectedVersion ? "default" : "outline"}
                          onClick={() => onVersionChange(version.version)}
                        >
                          {version.version === selectedVersion ? t('componentDetails.versions.selectedButton') : t('componentDetails.versions.selectButton')}
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={version.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{t('componentDetails.versions.releaseDateLabel')} {version.releaseDate}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">{t('componentDetails.versions.changelogLabel')}</h4>
                      <div className="text-sm whitespace-pre-line">
                        {version.changelog} {/* Changelog is data */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="config" className="space-y-4">
            {component.configurable ? (
              <ComponentSettings componentId={component.id} t={t} />
            ) : (
              <div className="p-4 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <p>{t('componentDetails.config.defaultSettingsSufficient')}</p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="docs" className="space-y-4">
            <div className="p-4 border rounded-md">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{t('componentDetails.docs.officialDocsTitle')}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('componentDetails.docs.visitOfficialDocsDescription', { componentName: component.name })}
                </p>
                <Button asChild>
                  <a href={component.documentation} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('componentDetails.docs.accessDocsButton')}
                  </a>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}