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
import { Plus, Search, Filter, Copy, Edit, Trash2, Target, Download, Upload, Star, StarOff, Cpu, HardDrive, Thermometer, Wifi, Activity, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { PromQLEditor } from "./promql-editor"

// 模板分类
const TEMPLATE_CATEGORIES = [
  { value: "huawei", label: "华为", icon: "🔶" },
  { value: "cisco", label: "思科", icon: "🔵" },
  { value: "h3c", label: "H3C", icon: "🟢" },
  { value: "juniper", label: "瞻博", icon: "🟡" },
  { value: "generic", label: "通用", icon: "⚪" }
]

const TEMPLATE_TYPES = [
  { value: "cpu", label: "CPU", icon: Cpu },
  { value: "memory", label: "内存", icon: HardDrive },
  { value: "temperature", label: "温度", icon: Thermometer },
  { value: "interface", label: "接口", icon: Wifi },
  { value: "performance", label: "性能", icon: Activity },
  { value: "availability", label: "可用性", icon: AlertTriangle }
]

const DEVICE_LEVELS = [
  { value: "core", label: "核心" },
  { value: "aggregation", label: "汇聚" },
  { value: "access", label: "接入" }
]

// 模拟模板数据
const mockTemplates = [
  {
    id: "1",
    name: "华为交换机CPU监控",
    description: "监控华为交换机CPU使用率，支持S系列交换机",
    category: "huawei",
    type: "cpu",
    level: "core",
    promql: "(hwCpuDevCpuUsage{job=\"snmp\", vendor=\"huawei\"} > {{threshold}})",
    defaultThreshold: 80,
    severity: "warning",
    duration: "5m",
    variables: [
      { name: "threshold", description: "CPU使用率阈值", defaultValue: "80", type: "number" }
    ],
    tags: ["华为", "CPU", "性能"],
    isStarred: true,
    usageCount: 25,
    createdAt: "2024-01-10",
    updatedAt: "2024-01-15"
  },
  {
    id: "2",
    name: "思科交换机内存监控",
    description: "监控思科交换机内存使用率，适用于Catalyst系列",
    category: "cisco",
    type: "memory",
    level: "aggregation",
    promql: "((ciscoMemoryPoolUsed{job=\"snmp\", vendor=\"cisco\"} / (ciscoMemoryPoolUsed + ciscoMemoryPoolFree)) * 100 > {{threshold}})",
    defaultThreshold: 85,
    severity: "warning",
    duration: "3m",
    variables: [
      { name: "threshold", description: "内存使用率阈值", defaultValue: "85", type: "number" }
    ],
    tags: ["思科", "内存", "性能"],
    isStarred: false,
    usageCount: 18,
    createdAt: "2024-01-08",
    updatedAt: "2024-01-12"
  },
  {
    id: "3",
    name: "通用接口流量监控",
    description: "监控网络接口流量，适用于所有支持SNMP的设备",
    category: "generic",
    type: "interface",
    level: "access",
    promql: "(rate(ifInOctets{job=\"snmp\"}[5m]) * 8 / 1024 / 1024 > {{threshold}})",
    defaultThreshold: 100,
    severity: "warning",
    duration: "2m",
    variables: [
      { name: "threshold", description: "流量阈值(Mbps)", defaultValue: "100", type: "number" }
    ],
    tags: ["通用", "接口", "流量"],
    isStarred: true,
    usageCount: 42,
    createdAt: "2024-01-05",
    updatedAt: "2024-01-14"
  },
  {
    id: "4",
    name: "设备温度告警",
    description: "监控设备温度传感器，防止过热",
    category: "generic",
    type: "temperature",
    level: "core",
    promql: "(entPhySensorValue{entPhySensorType=\"8\", job=\"snmp\"} > {{threshold}})",
    defaultThreshold: 70,
    severity: "critical",
    duration: "1m",
    variables: [
      { name: "threshold", description: "温度阈值(°C)", defaultValue: "70", type: "number" }
    ],
    tags: ["通用", "温度", "硬件"],
    isStarred: false,
    usageCount: 12,
    createdAt: "2024-01-12",
    updatedAt: "2024-01-13"
  }
]

interface RuleTemplateManagerProps {
  onApplyTemplate?: (template: any, deviceGroups: string[]) => void
}

export function RuleTemplateManager({ onApplyTemplate }: RuleTemplateManagerProps) {
  const [templates, setTemplates] = useState(mockTemplates)
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterLevel, setFilterLevel] = useState("all")
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [promqlCode, setPromqlCode] = useState("")
  const [templateVariables, setTemplateVariables] = useState<any[]>([])

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = filterCategory === "all" || template.category === filterCategory
    const matchesType = filterType === "all" || template.type === filterType
    const matchesLevel = filterLevel === "all" || template.level === filterLevel
    const matchesStarred = !showStarredOnly || template.isStarred
    
    return matchesSearch && matchesCategory && matchesType && matchesLevel && matchesStarred
  })

  // 切换收藏状态
  const toggleStar = (templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isStarred: !template.isStarred }
        : template
    ))
  }

  // 复制模板
  const duplicateTemplate = (template: any) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (副本)`,
      usageCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    setTemplates(prev => [newTemplate, ...prev])
    toast.success("模板复制成功")
  }

  // 删除模板
  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
    toast.success("模板删除成功")
  }

  // 批量操作
  const handleBatchOperation = (operation: string) => {
    if (selectedTemplates.length === 0) {
      toast.error("请先选择要操作的模板")
      return
    }
    
    switch (operation) {
      case "star":
        setTemplates(prev => prev.map(template => 
          selectedTemplates.includes(template.id)
            ? { ...template, isStarred: true }
            : template
        ))
        toast.success(`已收藏 ${selectedTemplates.length} 个模板`)
        break
      case "unstar":
        setTemplates(prev => prev.map(template => 
          selectedTemplates.includes(template.id)
            ? { ...template, isStarred: false }
            : template
        ))
        toast.success(`已取消收藏 ${selectedTemplates.length} 个模板`)
        break
      case "delete":
        setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)))
        toast.success(`已删除 ${selectedTemplates.length} 个模板`)
        break
      case "export":
        toast.success(`已导出 ${selectedTemplates.length} 个模板`)
        break
    }
    setSelectedTemplates([])
  }

  // 打开模板编辑器
  const openTemplateEditor = (template?: any) => {
    setEditingTemplate(template)
    setPromqlCode(template?.promql || "")
    setTemplateVariables(template?.variables || [])
    setShowTemplateEditor(true)
  }

  // 保存模板
  const saveTemplate = (templateData: any) => {
    if (editingTemplate) {
      // 更新现有模板
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...templateData, updatedAt: new Date().toISOString().split('T')[0] }
          : t
      ))
      toast.success("模板更新成功")
    } else {
      // 创建新模板
      const newTemplate = {
        ...templateData,
        id: Date.now().toString(),
        usageCount: 0,
        isStarred: false,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      }
      setTemplates(prev => [newTemplate, ...prev])
      toast.success("模板创建成功")
    }
    setShowTemplateEditor(false)
    setEditingTemplate(null)
  }

  // 应用模板
  const applyTemplate = (template: any) => {
    setSelectedTemplate(template)
    setShowApplyDialog(true)
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索模板..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="厂商" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部厂商</SelectItem>
              {TEMPLATE_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {TEMPLATE_TYPES.map(type => {
                const Icon = type.icon
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center">
                      <Icon className="mr-2 h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="级别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部级别</SelectItem>
              {DEVICE_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showStarredOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowStarredOnly(!showStarredOnly)}
          >
            <Star className="mr-1 h-3 w-3" />
            收藏
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            导入
          </Button>
          <Button onClick={() => openTemplateEditor()}>
            <Plus className="mr-2 h-4 w-4" />
            新建模板
          </Button>
        </div>
      </div>

      {/* 批量操作 */}
      {selectedTemplates.length > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            已选择 {selectedTemplates.length} 个模板
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Button size="sm" variant="outline" onClick={() => handleBatchOperation("star")}>
            <Star className="mr-1 h-3 w-3" />
            批量收藏
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBatchOperation("unstar")}>
            <StarOff className="mr-1 h-3 w-3" />
            取消收藏
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBatchOperation("export")}>
            <Download className="mr-1 h-3 w-3" />
            批量导出
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBatchOperation("delete")}>
            <Trash2 className="mr-1 h-3 w-3" />
            批量删除
          </Button>
        </div>
      )}

      {/* 模板网格 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => {
          const categoryInfo = TEMPLATE_CATEGORIES.find(c => c.value === template.category)
          const typeInfo = TEMPLATE_TYPES.find(t => t.value === template.type)
          const TypeIcon = typeInfo?.icon || Activity
          
          return (
            <Card key={template.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedTemplates.includes(template.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTemplates([...selectedTemplates, template.id])
                        } else {
                          setSelectedTemplates(selectedTemplates.filter(id => id !== template.id))
                        }
                      }}
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <TypeIcon className="h-4 w-4" />
                        <span>{template.name}</span>
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleStar(template.id)}
                  >
                    {template.isStarred ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">厂商:</span>
                    <Badge variant="outline">
                      {categoryInfo?.icon} {categoryInfo?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">类型:</span>
                    <Badge variant="secondary">{typeInfo?.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">级别:</span>
                    <span>{DEVICE_LEVELS.find(l => l.value === template.level)?.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">默认阈值:</span>
                    <span>{template.defaultThreshold}{template.type === 'temperature' ? '°C' : '%'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">使用次数:</span>
                    <Badge variant="outline">{template.usageCount}</Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => applyTemplate(template)}
                    >
                      <Target className="mr-1 h-3 w-3" />
                      应用
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openTemplateEditor(template)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 模板编辑器对话框 */}
      <Dialog open={showTemplateEditor} onOpenChange={setShowTemplateEditor}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "编辑模板" : "新建模板"}
            </DialogTitle>
            <DialogDescription>
              创建或编辑告警规则模板，支持变量和PromQL编辑
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>模板名称</Label>
                <Input defaultValue={editingTemplate?.name} placeholder="输入模板名称" />
              </div>
              <div>
                <Label>厂商分类</Label>
                <Select defaultValue={editingTemplate?.category}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择厂商" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>描述</Label>
              <Textarea defaultValue={editingTemplate?.description} placeholder="输入模板描述" />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>监控类型</Label>
                <Select defaultValue={editingTemplate?.type}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map(type => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <Icon className="mr-2 h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>设备级别</Label>
                <Select defaultValue={editingTemplate?.level}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择级别" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>严重程度</Label>
                <Select defaultValue={editingTemplate?.severity}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择严重程度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">严重</SelectItem>
                    <SelectItem value="warning">警告</SelectItem>
                    <SelectItem value="info">信息</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>PromQL查询模板</Label>
              <PromQLEditor
                value={promqlCode}
                onChange={setPromqlCode}
                placeholder="输入PromQL查询模板，使用 {{变量名}} 定义变量..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>默认阈值</Label>
                <Input type="number" defaultValue={editingTemplate?.defaultThreshold} placeholder="80" />
              </div>
              <div>
                <Label>持续时间</Label>
                <Input defaultValue={editingTemplate?.duration} placeholder="5m" />
              </div>
            </div>
            
            <div>
              <Label>标签</Label>
              <Input placeholder="输入标签，用逗号分隔" />
            </div>
            
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTemplateEditor(false)}>
                取消
              </Button>
              <Button onClick={() => saveTemplate({})}>
                {editingTemplate ? "更新模板" : "创建模板"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 应用模板对话框 */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>应用模板到设备组</DialogTitle>
            <DialogDescription>
              选择要应用模板 "{selectedTemplate?.name}" 的设备组
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>选择设备组</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="core-switches" />
                  <Label htmlFor="core-switches">核心交换机 (8台设备)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="access-switches" />
                  <Label htmlFor="access-switches">接入交换机 (45台设备)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="server-switches" />
                  <Label htmlFor="server-switches">服务器交换机 (12台设备)</Label>
                </div>
              </div>
            </div>
            
            {selectedTemplate?.variables?.map((variable: any, index: number) => (
              <div key={index}>
                <Label>{variable.description}</Label>
                <Input 
                  type={variable.type}
                  defaultValue={variable.defaultValue}
                  placeholder={variable.description}
                />
              </div>
            ))}
            
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                取消
              </Button>
              <Button onClick={() => {
                onApplyTemplate?.(selectedTemplate, [])
                setShowApplyDialog(false)
                toast.success("模板应用成功")
              }}>
                应用模板
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}