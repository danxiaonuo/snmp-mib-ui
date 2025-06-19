"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Download,
  Eye,
  Copy,
  Search,
  Code,
  Save,
  Star,
  TrendingUp,
  Lightbulb,
  Zap,
  Target,
  Brain,
  Sparkles,
  Rocket,
} from "lucide-react"

import { ConfigDeploymentFlow } from './components/ConfigDeploymentFlow'
import { ServerConfigWizard } from '@/components/server-config-wizard'
import { ALL_CONFIG_TEMPLATES, getTemplatesByType, renderConfigTemplate, ConfigTemplate } from '@/lib/config-templates'

// Enhanced OID data structure with intelligence features
interface EnhancedOID {
  oid: string
  name: string
  type: string
  access: string
  description: string
  category: string
  subcategory: string
  importance: number // 1-5 scale
  frequency: number // Usage frequency
  deviceTypes: string[]
  tags: string[]
  relatedOids: string[]
  monitoringValue: number // Business value for monitoring
  complexity: "basic" | "intermediate" | "advanced"
  isRecommended?: boolean
  recommendationReason?: string
}

export default function ConfigGenPage() {
  const [configType, setConfigType] = useState("server_wizard")
  const [selectedTemplate, setSelectedTemplate] = useState<ConfigTemplate | null>(null)
  const [templateParameters, setTemplateParameters] = useState<Record<string, any>>({})
  const [generatedConfig, setGeneratedConfig] = useState("")
  const [configName, setConfigName] = useState("")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [showDeploymentFlow, setShowDeploymentFlow] = useState(false)
  const [deviceTemplate, setDeviceTemplate] = useState("generic")
  
  // 获取当前类型的模板
  const availableTemplates = getTemplatesByType(configType)

  // 配置模板数据
  const configTemplates = [
    {
      id: 'snmp-exporter-basic',
      name: 'SNMP Exporter 基础配置',
      type: 'snmp_exporter' as const,
      description: '基础SNMP监控配置，包含常用系统指标',
      category: '监控配置',
      content: `modules:
  default:
    walk:
      - 1.3.6.1.2.1.1.1.0  # sysDescr
      - 1.3.6.1.2.1.1.3.0  # sysUpTime
      - 1.3.6.1.2.1.2.2.1.10  # ifInOctets
      - 1.3.6.1.2.1.2.2.1.16  # ifOutOctets
    metrics:
      - name: snmp_up
        oid: 1.3.6.1.2.1.1.1.0
        type: gauge
        help: SNMP device availability
    auth:
      community: {{community}}
    version: {{version}}
    timeout: {{timeout}}s
    retries: {{retries}}`,
      parameters: [
        {
          name: 'community',
          type: 'string' as const,
          description: 'SNMP Community字符串',
          defaultValue: 'public',
          required: true
        },
        {
          name: 'version',
          type: 'select' as const,
          description: 'SNMP版本',
          defaultValue: '2',
          required: true,
          options: ['1', '2', '3']
        },
        {
          name: 'timeout',
          type: 'number' as const,
          description: '超时时间(秒)',
          defaultValue: 5,
          required: true
        },
        {
          name: 'retries',
          type: 'number' as const,
          description: '重试次数',
          defaultValue: 3,
          required: true
        }
      ],
      targetComponents: ['snmp-exporter']
    },
    {
      id: 'prometheus-config',
      name: 'Prometheus 监控配置',
      type: 'prometheus' as const,
      description: 'Prometheus服务发现和抓取配置',
      category: '监控配置',
      content: `global:
  scrape_interval: {{scrape_interval}}
  evaluation_interval: {{evaluation_interval}}

scrape_configs:
  - job_name: 'snmp'
    static_configs:
      - targets: {{targets}}
    metrics_path: /snmp
    params:
      module: [default]
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: {{snmp_exporter_address}}`,
      parameters: [
        {
          name: 'scrape_interval',
          type: 'string' as const,
          description: '抓取间隔',
          defaultValue: '15s',
          required: true
        },
        {
          name: 'evaluation_interval',
          type: 'string' as const,
          description: '评估间隔',
          defaultValue: '15s',
          required: true
        },
        {
          name: 'targets',
          type: 'string' as const,
          description: '监控目标(JSON数组格式)',
          defaultValue: '["192.168.1.1:161", "192.168.1.2:161"]',
          required: true
        },
        {
          name: 'snmp_exporter_address',
          type: 'string' as const,
          description: 'SNMP Exporter地址',
          defaultValue: 'localhost:9116',
          required: true
        }
      ],
      targetComponents: ['prometheus']
    }
  ]

  // Enhanced OID dataset with intelligence features
  const enhancedOids: EnhancedOID[] = [
    {
      oid: "1.3.6.1.2.1.1.1.0",
      name: "sysDescr",
      type: "DisplayString",
      access: "read-only",
      description: "A textual description of the entity including hardware, OS, and networking software",
      category: "System",
      subcategory: "Basic Info",
      importance: 5,
      frequency: 95,
      deviceTypes: ["router", "switch", "server", "firewall"],
      tags: ["essential", "identification", "basic"],
      relatedOids: ["1.3.6.1.2.1.1.2.0", "1.3.6.1.2.1.1.5.0"],
      monitoringValue: 4,
      complexity: "basic",
    },
    {
      oid: "1.3.6.1.2.1.1.3.0",
      name: "sysUpTime",
      type: "TimeTicks",
      access: "read-only",
      description: "Time since the network management portion of the system was last re-initialized",
      category: "System",
      subcategory: "Status",
      importance: 5,
      frequency: 90,
      deviceTypes: ["router", "switch", "server", "firewall"],
      tags: ["essential", "uptime", "availability"],
      relatedOids: ["1.3.6.1.2.1.1.1.0"],
      monitoringValue: 5,
      complexity: "basic",
    },
    {
      oid: "1.3.6.1.2.1.2.2.1.10",
      name: "ifInOctets",
      type: "Counter32",
      access: "read-only",
      description: "The total number of octets received on the interface, including framing characters",
      category: "Network",
      subcategory: "Interface Traffic",
      importance: 5,
      frequency: 85,
      deviceTypes: ["router", "switch"],
      tags: ["traffic", "performance", "bandwidth"],
      relatedOids: ["1.3.6.1.2.1.2.2.1.16", "1.3.6.1.2.1.2.2.1.2"],
      monitoringValue: 5,
      complexity: "basic",
    },
    {
      oid: "1.3.6.1.2.1.2.2.1.16",
      name: "ifOutOctets",
      type: "Counter32",
      access: "read-only",
      description: "The total number of octets transmitted out of the interface, including framing characters",
      category: "Network",
      subcategory: "Interface Traffic",
      importance: 5,
      frequency: 85,
      deviceTypes: ["router", "switch"],
      tags: ["traffic", "performance", "bandwidth"],
      relatedOids: ["1.3.6.1.2.1.2.2.1.10", "1.3.6.1.2.1.2.2.1.2"],
      monitoringValue: 5,
      complexity: "basic",
    },
    {
      oid: "1.3.6.1.2.1.2.2.1.8",
      name: "ifOperStatus",
      type: "Integer32",
      access: "read-only",
      description: "The current operational state of the interface",
      category: "Network",
      subcategory: "Interface Status",
      importance: 5,
      frequency: 80,
      deviceTypes: ["router", "switch"],
      tags: ["status", "availability", "critical"],
      relatedOids: ["1.3.6.1.2.1.2.2.1.7", "1.3.6.1.2.1.2.2.1.2"],
      monitoringValue: 5,
      complexity: "basic",
    },
    {
      oid: "1.3.6.1.2.1.25.3.3.1.2",
      name: "hrProcessorLoad",
      type: "Integer32",
      access: "read-only",
      description: "The average percentage of time that this processor was not idle during the last minute",
      category: "Performance",
      subcategory: "CPU",
      importance: 4,
      frequency: 75,
      deviceTypes: ["server", "router", "switch"],
      tags: ["cpu", "performance", "load"],
      relatedOids: ["1.3.6.1.2.1.25.2.3.1.6"],
      monitoringValue: 4,
      complexity: "intermediate",
    },
    {
      oid: "1.3.6.1.2.1.25.2.3.1.6",
      name: "hrStorageUsed",
      type: "Integer32",
      access: "read-only",
      description: "The amount of the storage represented by this entry that is allocated",
      category: "Performance",
      subcategory: "Memory/Storage",
      importance: 4,
      frequency: 70,
      deviceTypes: ["server", "router", "switch"],
      tags: ["memory", "storage", "capacity"],
      relatedOids: ["1.3.6.1.2.1.25.2.3.1.5", "1.3.6.1.2.1.25.3.3.1.2"],
      monitoringValue: 4,
      complexity: "intermediate",
    },
    {
      oid: "1.3.6.1.4.1.9.9.109.1.1.1.1.8",
      name: "cpmCPUTotal5minRev",
      type: "Gauge32",
      access: "read-only",
      description: "The overall CPU busy percentage in the last 5 minute period (Cisco specific)",
      category: "Performance",
      subcategory: "CPU",
      importance: 4,
      frequency: 60,
      deviceTypes: ["cisco_router", "cisco_switch"],
      tags: ["cisco", "cpu", "performance", "vendor-specific"],
      relatedOids: ["1.3.6.1.4.1.9.9.109.1.1.1.1.7"],
      monitoringValue: 4,
      complexity: "advanced",
    },
    {
      oid: "1.3.6.1.2.1.1.5.0",
      name: "sysName",
      type: "DisplayString",
      access: "read-write",
      description: "An administratively-assigned name for this managed node",
      category: "System",
      subcategory: "Basic Info",
      importance: 3,
      frequency: 65,
      deviceTypes: ["router", "switch", "server", "firewall"],
      tags: ["identification", "name", "basic"],
      relatedOids: ["1.3.6.1.2.1.1.1.0", "1.3.6.1.2.1.1.6.0"],
      monitoringValue: 3,
      complexity: "basic",
    },
    {
      oid: "1.3.6.1.2.1.2.2.1.14",
      name: "ifInErrors",
      type: "Counter32",
      access: "read-only",
      description: "The number of inbound packets that contained errors preventing them from being deliverable",
      category: "Network",
      subcategory: "Interface Errors",
      importance: 4,
      frequency: 55,
      deviceTypes: ["router", "switch"],
      tags: ["errors", "quality", "troubleshooting"],
      relatedOids: ["1.3.6.1.2.1.2.2.1.20", "1.3.6.1.2.1.2.2.1.10"],
      monitoringValue: 4,
      complexity: "intermediate",
    },
  ]

  // MIB files data
  const mibFiles = [
    { id: "1", name: "SNMPv2-MIB", filename: "SNMPv2-MIB.txt", oids: 156 },
    { id: "2", name: "IF-MIB", filename: "IF-MIB.txt", oids: 234 },
    { id: "3", name: "CISCO-MEMORY-POOL-MIB", filename: "CISCO-MEMORY-POOL-MIB.txt", oids: 89 },
    { id: "4", name: "HOST-RESOURCES-MIB", filename: "HOST-RESOURCES-MIB.txt", oids: 178 },
    { id: "5", name: "ENTITY-MIB", filename: "ENTITY-MIB.txt", oids: 145 },
  ]

  // Enhanced device templates with intelligence
  const deviceTemplates = [
    {
      id: "cisco_switch",
      name: "Cisco Switch",
      description: "Optimized for Cisco switch monitoring",
      deviceType: "cisco_switch",
      defaultOids: ["1.3.6.1.2.1.1.1.0", "1.3.6.1.2.1.1.3.0", "1.3.6.1.2.1.2.2.1.10", "1.3.6.1.2.1.2.2.1.16"],
      priority: ["System", "Network", "Performance"],
    },
    {
      id: "linux_server",
      name: "Linux Server",
      description: "Comprehensive Linux server monitoring",
      deviceType: "server",
      defaultOids: ["1.3.6.1.2.1.1.1.0", "1.3.6.1.2.1.25.2.3.1.6", "1.3.6.1.2.1.25.3.3.1.2"],
      priority: ["System", "Performance"],
    },
    {
      id: "network_router",
      name: "Network Router",
      description: "Router performance and interface monitoring",
      deviceType: "router",
      defaultOids: ["1.3.6.1.2.1.1.1.0", "1.3.6.1.2.1.1.3.0", "1.3.6.1.2.1.2.2.1.8"],
      priority: ["System", "Network"],
    },
    {
      id: "custom",
      name: "Custom Template",
      description: "Create a custom monitoring template",
      deviceType: "custom",
      defaultOids: [],
      priority: [],
    },
  ]

  // Intelligence functions
  const getRecommendedOids = (deviceType: string, selectedOids: string[]): EnhancedOID[] => {
    return enhancedOids
      .filter((oid) => {
        // Filter by device type compatibility
        if (deviceType && deviceType !== "custom") {
          return oid.deviceTypes.includes(deviceType) || oid.deviceTypes.includes("all")
        }
        return true
      })
      .map((oid) => {
        // Add recommendation logic
        let isRecommended = false
        let recommendationReason = ""

        // High importance and frequency
        if (oid.importance >= 4 && oid.frequency >= 70) {
          isRecommended = true
          recommendationReason = "High importance and frequently used"
        }

        // Related to already selected OIDs
        if (selectedOids.some((selectedOid) => oid.relatedOids.includes(selectedOid))) {
          isRecommended = true
          recommendationReason = "Related to your current selection"
        }

        // Essential for device type
        if (deviceType && oid.deviceTypes.includes(deviceType) && oid.importance === 5) {
          isRecommended = true
          recommendationReason = `Essential for ${deviceType} monitoring`
        }

        return { ...oid, isRecommended, recommendationReason }
      })
      .sort((a, b) => {
        // Sort by recommendation, then importance, then frequency
        if (a.isRecommended && !b.isRecommended) return -1
        if (!a.isRecommended && b.isRecommended) return 1
        if (a.importance !== b.importance) return b.importance - a.importance
        return b.frequency - a.frequency
      })
  }

  // Get current device type from template
  const currentDeviceType = useMemo(() => {
    const template = deviceTemplates.find((t) => t.id === deviceTemplate)
    return template?.deviceType || ""
  }, [deviceTemplate])

  // Get intelligent OID recommendations
  const intelligentOids = useMemo(() => {
    return getRecommendedOids(currentDeviceType, selectedOids)
  }, [currentDeviceType, selectedOids])

  // Filter and sort OIDs based on user preferences
  const filteredAndSortedOids = useMemo(() => {
    let filtered = intelligentOids

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (oid) =>
          oid.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          oid.oid.includes(searchTerm) ||
          oid.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          oid.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((oid) => oid.category === selectedCategory)
    }

    // Apply complexity filter
    if (selectedComplexity !== "all") {
      filtered = filtered.filter((oid) => oid.complexity === selectedComplexity)
    }

    // Apply recommended filter
    if (showRecommendedOnly) {
      filtered = filtered.filter((oid) => oid.isRecommended)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "importance":
          return b.importance - a.importance
        case "frequency":
          return b.frequency - a.frequency
        case "name":
          return a.name.localeCompare(b.name)
        case "category":
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

    return filtered
  }, [intelligentOids, searchTerm, selectedCategory, selectedComplexity, showRecommendedOnly, sortBy])

  // Get categories for filter
  const categories = useMemo(() => {
    const cats = Array.from(new Set(enhancedOids.map((oid) => oid.category)))
    return cats.sort()
  }, [])

  // Get category statistics
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; recommended: number }> = {}
    intelligentOids.forEach((oid) => {
      if (!stats[oid.category]) {
        stats[oid.category] = { count: 0, recommended: 0 }
      }
      stats[oid.category].count++
      if (oid.isRecommended) {
        stats[oid.category].recommended++
      }
    })
    return stats
  }, [intelligentOids])

  const handleOidToggle = (oid: string) => {
    setSelectedOids((prev) => (prev.includes(oid) ? prev.filter((o) => o !== oid) : [...prev, oid]))
  }

  const handleTemplateSelect = (templateId: string) => {
    setDeviceTemplate(templateId)
    const template = deviceTemplates.find((t) => t.id === templateId)
    if (template) {
      setSelectedOids(template.defaultOids)
    }
  }

  const handleQuickSelectRecommended = () => {
    const recommendedOids = intelligentOids.filter((oid) => oid.isRecommended).map((oid) => oid.oid)
    setSelectedOids(recommendedOids)
  }

  const handleQuickSelectByCategory = (category: string) => {
    const categoryOids = intelligentOids
      .filter((oid) => oid.category === category && oid.importance >= 4)
      .map((oid) => oid.oid)
    setSelectedOids((prev) => [...new Set([...prev, ...categoryOids])])
  }

  const getImportanceColor = (importance: number) => {
    switch (importance) {
      case 5:
        return "text-red-600"
      case 4:
        return "text-orange-600"
      case 3:
        return "text-yellow-600"
      case 2:
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const getComplexityBadge = (complexity: string) => {
    switch (complexity) {
      case "basic":
        return <Badge className="bg-green-100 text-green-800">Basic</Badge>
      case "intermediate":
        return <Badge className="bg-yellow-100 text-yellow-800">Intermediate</Badge>
      case "advanced":
        return <Badge className="bg-red-100 text-red-800">Advanced</Badge>
      default:
        return <Badge variant="outline">{complexity}</Badge>
    }
  }

  // Generate configuration (simplified for demo)
  const handleGenerateConfig = () => {
    const selectedOidData = intelligentOids.filter((oid) => selectedOids.includes(oid.oid))
    let config = `# Generated Configuration
# Device Type: ${currentDeviceType}
# Selected OIDs: ${selectedOids.length}
# Recommended OIDs included: ${selectedOidData.filter((oid) => oid.isRecommended).length}

`
    selectedOidData.forEach((oid) => {
      config += `# ${oid.name} - ${oid.description}
# Importance: ${oid.importance}/5, Frequency: ${oid.frequency}%
# Tags: ${oid.tags.join(", ")}
${oid.oid}

`
    })
    setGeneratedConfig(config)
  }

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(generatedConfig)
  }

  const handleDownloadConfig = () => {
    const element = document.createElement("a")
    const file = new Blob([generatedConfig], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `${configName || "snmp_config"}.${configType === "snmp_exporter" ? "yml" : "toml"}`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // 显示部署流程
  if (showDeploymentFlow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" onClick={() => setShowDeploymentFlow(false)}>
            ← 返回配置生成
          </Button>
          <h2 className="text-2xl font-bold">配置部署流程</h2>
        </div>
        <ConfigDeploymentFlow templates={configTemplates} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Intelligent Configuration Generator</h1>
          <p className="text-muted-foreground">
            AI-powered OID selection with smart recommendations and categorization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowDeploymentFlow(true)}>
            <Rocket className="h-4 w-4 mr-2" />
            配置部署
          </Button>
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)} disabled={!generatedConfig}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleGenerateConfig} disabled={selectedOids.length === 0}>
            <Settings className="h-4 w-4 mr-2" />
            Generate Config
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Enhanced Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Smart Configuration
              </CardTitle>
              <CardDescription>AI-powered configuration settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="config-name">Configuration Name</Label>
                <Input
                  id="config-name"
                  placeholder="my_device_config"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="config-type">Configuration Type</Label>
                <Select value={configType} onValueChange={setConfigType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="snmp_exporter">SNMP Exporter (YAML)</SelectItem>
                    <SelectItem value="categraf">Categraf (TOML)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-template">Device Template</Label>
                <Select value={deviceTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Quick Actions
                </Label>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={handleQuickSelectRecommended}>
                    <Target className="h-4 w-4 mr-2" />
                    Select Recommended
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleQuickSelectByCategory("System")}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Add System Essentials
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleQuickSelectByCategory("Network")}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Add Network Metrics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intelligence Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Intelligence Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Device Type:</span>
                  <Badge variant="outline">{currentDeviceType || "Not set"}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Selected OIDs:</span>
                  <Badge variant="outline">{selectedOids.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Recommended:</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {intelligentOids.filter((oid) => oid.isRecommended).length}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>High Priority:</span>
                  <Badge className="bg-red-100 text-red-800">
                    {intelligentOids.filter((oid) => oid.importance >= 4).length}
                  </Badge>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Category Distribution</Label>
                {Object.entries(categoryStats).map(([category, stats]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{category}</span>
                      <span>
                        {stats.recommended}/{stats.count}
                      </span>
                    </div>
                    <Progress value={(stats.recommended / stats.count) * 100} className="h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced OID Selection Panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Intelligent OID Selection
              </CardTitle>
              <CardDescription>AI-powered OID recommendations and smart filtering</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="intelligent" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="intelligent">Intelligent View</TabsTrigger>
                  <TabsTrigger value="category">Category View</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Filters</TabsTrigger>
                </TabsList>

                <TabsContent value="intelligent" className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search OIDs, descriptions, or tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="recommended-only"
                        checked={showRecommendedOnly}
                        onCheckedChange={setShowRecommendedOnly}
                      />
                      <Label htmlFor="recommended-only" className="text-sm">
                        Recommended only
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="importance">Importance</SelectItem>
                        <SelectItem value="frequency">Frequency</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setSelectedOids([])}>
                      Clear All
                    </Button>
                  </div>

                  <ScrollArea className="h-[600px] border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Select</TableHead>
                          <TableHead>Name & OID</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Importance</TableHead>
                          <TableHead>Tags</TableHead>
                          <TableHead>Recommendation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedOids.map((oid, index) => (
                          <TableRow key={index} className={oid.isRecommended ? "bg-blue-50" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={selectedOids.includes(oid.oid)}
                                onCheckedChange={() => handleOidToggle(oid.oid)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{oid.name}</span>
                                  {oid.isRecommended && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                                </div>
                                <div className="text-xs font-mono text-muted-foreground">{oid.oid}</div>
                                <div
                                  className="text-xs text-muted-foreground max-w-xs truncate"
                                  title={oid.description}
                                >
                                  {oid.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge variant="secondary">{oid.category}</Badge>
                                <div className="text-xs text-muted-foreground">{oid.subcategory}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < oid.importance ? "text-yellow-500 fill-current" : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <div className="text-xs text-muted-foreground">Used: {oid.frequency}%</div>
                                {getComplexityBadge(oid.complexity)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {oid.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {oid.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{oid.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {oid.isRecommended && (
                                <div className="space-y-1">
                                  <Badge className="bg-blue-100 text-blue-800">Recommended</Badge>
                                  <div className="text-xs text-muted-foreground">{oid.recommendationReason}</div>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="category" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => {
                      const categoryOids = intelligentOids.filter((oid) => oid.category === category)
                      const recommendedCount = categoryOids.filter((oid) => oid.isRecommended).length
                      const selectedCount = categoryOids.filter((oid) => selectedOids.includes(oid.oid)).length

                      return (
                        <Card key={category} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{category}</CardTitle>
                              <Badge variant="outline">{categoryOids.length}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{recommendedCount} recommended</span>
                              <span>•</span>
                              <span>{selectedCount} selected</span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <Progress value={(selectedCount / categoryOids.length) * 100} className="h-2" />
                              <div className="flex justify-between">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickSelectByCategory(category)}
                                >
                                  Add Essentials
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(category)}>
                                  View All
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Category Filter</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Complexity Level</Label>
                      <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Sort By</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="importance">Importance</SelectItem>
                          <SelectItem value="frequency">Usage Frequency</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Filter Results</h4>
                    <div className="grid gap-2 md:grid-cols-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total OIDs:</span>
                        <span className="ml-2 font-medium">{filteredAndSortedOids.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Recommended:</span>
                        <span className="ml-2 font-medium">
                          {filteredAndSortedOids.filter((oid) => oid.isRecommended).length}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">High Priority:</span>
                        <span className="ml-2 font-medium">
                          {filteredAndSortedOids.filter((oid) => oid.importance >= 4).length}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Selected:</span>
                        <span className="ml-2 font-medium">{selectedOids.length}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="categraf" className="space-y-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Categraf配置生成功能开发中...</p>
                  </div>
                </TabsContent>

                <TabsContent value="prometheus" className="space-y-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Prometheus配置生成功能开发中...</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generated Configuration Preview */}
      {generatedConfig && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Generated Configuration
                </CardTitle>
                <CardDescription>
                  Intelligent {configType === "snmp_exporter" ? "SNMP Exporter YAML" : "Categraf TOML"} configuration
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(generatedConfig)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Apply Config
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
                <code>{generatedConfig}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
