"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  Search, 
  Filter, 
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
  FileText,
  Layers,
  Tag,
  Clock,
  User,
  Star,
  Eye,
  GitBranch
} from 'lucide-react'

interface TemplateComponent {
  id: string
  name: string
  version: string
  category: 'collector' | 'storage' | 'visualization' | 'alerting'
  required: boolean
  config?: Record<string, any>
}

interface InstallTemplate {
  id: string
  name: string
  description: string
  category: 'basic' | 'advanced' | 'enterprise' | 'custom'
  version: string
  author: string
  createdAt: string
  updatedAt: string
  downloads: number
  rating: number
  tags: string[]
  components: TemplateComponent[]
  deploymentMode: 'standalone' | 'cluster'
  requirements: {
    cpu: string
    memory: string
    disk: string
    network: string[]
  }
  isPublic: boolean
  isFavorite: boolean
}

// 模拟模板数据
const MOCK_TEMPLATES: InstallTemplate[] = [
  {
    id: 'basic-monitoring',
    name: '基础监控套件',
    description: '包含基本的系统监控组件，适合小型项目和开发环境',
    category: 'basic',
    version: '1.0.0',
    author: 'System Admin',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    downloads: 1250,
    rating: 4.5,
    tags: ['监控', '基础', '开发'],
    components: [
      { id: 'node-exporter', name: 'Node Exporter', version: '1.7.0', category: 'collector', required: true },
      { id: 'victoriametrics', name: 'VictoriaMetrics', version: '1.96.0', category: 'storage', required: true },
      { id: 'grafana', name: 'Grafana', version: '10.2.3', category: 'visualization', required: true }
    ],
    deploymentMode: 'standalone',
    requirements: {
      cpu: '4 cores',
      memory: '4GB',
      disk: '20GB',
      network: ['HTTP', 'HTTPS']
    },
    isPublic: true,
    isFavorite: false
  },
  {
    id: 'enterprise-monitoring',
    name: '企业级监控平台',
    description: '完整的企业级监控解决方案，包含告警、可视化和高可用配置',
    category: 'enterprise',
    version: '2.1.0',
    author: 'Enterprise Team',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-22',
    downloads: 856,
    rating: 4.8,
    tags: ['企业级', '高可用', '告警', '完整'],
    components: [
      { id: 'node-exporter', name: 'Node Exporter', version: '1.7.0', category: 'collector', required: true },
      { id: 'categraf', name: 'Categraf', version: '0.3.60', category: 'collector', required: true },
      { id: 'vmagent', name: 'VMAgent', version: '1.96.0', category: 'collector', required: true },
      { id: 'victoriametrics', name: 'VictoriaMetrics', version: '1.96.0', category: 'storage', required: true },
      { id: 'grafana', name: 'Grafana', version: '10.2.3', category: 'visualization', required: true },
      { id: 'alertmanager', name: 'Alertmanager', version: '0.26.0', category: 'alerting', required: true }
    ],
    deploymentMode: 'cluster',
    requirements: {
      cpu: '16 cores',
      memory: '32GB',
      disk: '500GB',
      network: ['HTTP', 'HTTPS', 'gRPC']
    },
    isPublic: true,
    isFavorite: true
  },
  {
    id: 'network-monitoring',
    name: '网络设备监控',
    description: '专门用于监控网络设备的模板，支持SNMP协议',
    category: 'advanced',
    version: '1.2.0',
    author: 'Network Team',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-18',
    downloads: 432,
    rating: 4.2,
    tags: ['网络', 'SNMP', '设备监控'],
    components: [
      { id: 'snmp-exporter', name: 'SNMP Exporter', version: '0.24.1', category: 'collector', required: true },
      { id: 'victoriametrics', name: 'VictoriaMetrics', version: '1.96.0', category: 'storage', required: true },
      { id: 'grafana', name: 'Grafana', version: '10.2.3', category: 'visualization', required: true }
    ],
    deploymentMode: 'standalone',
    requirements: {
      cpu: '2 cores',
      memory: '2GB',
      disk: '50GB',
      network: ['HTTP', 'SNMP']
    },
    isPublic: true,
    isFavorite: false
  },
  {
    id: 'custom-dev',
    name: '开发环境定制',
    description: '我的自定义开发环境监控配置',
    category: 'custom',
    version: '1.0.0',
    author: 'Developer',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-22',
    downloads: 0,
    rating: 0,
    tags: ['自定义', '开发', '轻量'],
    components: [
      { id: 'node-exporter', name: 'Node Exporter', version: '1.7.0', category: 'collector', required: true },
      { id: 'victoriametrics', name: 'VictoriaMetrics', version: '1.96.0', category: 'storage', required: true }
    ],
    deploymentMode: 'standalone',
    requirements: {
      cpu: '2 cores',
      memory: '1GB',
      disk: '10GB',
      network: ['HTTP']
    },
    isPublic: false,
    isFavorite: true
  }
]

const CategoryBadge = ({ category }: { category: string }) => {
  const categoryColors: Record<string, string> = {
    basic: 'bg-blue-100 text-blue-800',
    advanced: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-green-100 text-green-800',
    custom: 'bg-orange-100 text-orange-800'
  }

  const categoryNames: Record<string, string> = {
    basic: '基础',
    advanced: '高级',
    enterprise: '企业级',
    custom: '自定义'
  }

  return (
    <Badge className={categoryColors[category]}>
      {categoryNames[category] || category}
    </Badge>
  )
}

const ComponentBadge = ({ category }: { category: string }) => {
  const categoryColors: Record<string, string> = {
    collector: 'bg-blue-100 text-blue-800',
    storage: 'bg-green-100 text-green-800',
    visualization: 'bg-purple-100 text-purple-800',
    alerting: 'bg-orange-100 text-orange-800'
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    collector: <Activity className="h-3 w-3" />,
    storage: <Database className="h-3 w-3" />,
    visualization: <BarChart3 className="h-3 w-3" />,
    alerting: <Bell className="h-3 w-3" />
  }

  return (
    <Badge variant="outline" className={`${categoryColors[category]} flex items-center gap-1`}>
      {categoryIcons[category]}
      {category}
    </Badge>
  )
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function TemplateManagementPage() {
  const [templates, setTemplates] = useState<InstallTemplate[]>(MOCK_TEMPLATES)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<InstallTemplate | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesFavorites = !showFavoritesOnly || template.isFavorite
    
    return matchesSearch && matchesCategory && matchesFavorites
  })

  const handleToggleFavorite = (templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isFavorite: !template.isFavorite }
        : template
    ))
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(template => template.id !== templateId))
  }

  const handleDuplicateTemplate = (template: InstallTemplate) => {
    const newTemplate: InstallTemplate = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (副本)`,
      author: 'Current User',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      downloads: 0,
      rating: 0,
      isPublic: false
    }
    setTemplates(prev => [newTemplate, ...prev])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">模板管理</h1>
          <p className="text-gray-600 mt-1">管理和创建监控组件安装模板</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            导入模板
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建模板
          </Button>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索模板名称、描述或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="basic">基础</SelectItem>
                <SelectItem value="advanced">高级</SelectItem>
                <SelectItem value="enterprise">企业级</SelectItem>
                <SelectItem value="custom">自定义</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                id="favorites-only"
                checked={showFavoritesOnly}
                onCheckedChange={setShowFavoritesOnly}
              />
              <Label htmlFor="favorites-only" className="text-sm">仅显示收藏</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 模板统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">总模板数</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">收藏模板</p>
                <p className="text-2xl font-bold">{templates.filter(t => t.isFavorite).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">自定义模板</p>
                <p className="text-2xl font-bold">{templates.filter(t => t.category === 'custom').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">总下载量</p>
                <p className="text-2xl font-bold">{templates.reduce((sum, t) => sum + t.downloads, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 模板列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CategoryBadge category={template.category} />
                  </div>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleFavorite(template.id)}
                >
                  <Star className={`h-4 w-4 ${
                    template.isFavorite ? 'text-yellow-400 fill-current' : 'text-gray-400'
                  }`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 模板信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">版本:</span>
                  <span className="ml-1 font-medium">{template.version}</span>
                </div>
                <div>
                  <span className="text-gray-600">作者:</span>
                  <span className="ml-1 font-medium">{template.author}</span>
                </div>
                <div>
                  <span className="text-gray-600">下载:</span>
                  <span className="ml-1 font-medium">{template.downloads}</span>
                </div>
                <div>
                  <span className="text-gray-600">更新:</span>
                  <span className="ml-1 font-medium">{template.updatedAt}</span>
                </div>
              </div>

              {/* 评分 */}
              {template.rating > 0 && (
                <div>
                  <StarRating rating={template.rating} />
                </div>
              )}

              {/* 标签 */}
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* 组件列表 */}
              <div>
                <p className="text-sm font-medium mb-2">包含组件 ({template.components.length}):</p>
                <div className="flex flex-wrap gap-1">
                  {template.components.slice(0, 3).map((component) => (
                    <ComponentBadge key={component.id} category={component.category} />
                  ))}
                  {template.components.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.components.length - 3} 更多
                    </Badge>
                  )}
                </div>
              </div>

              {/* 系统需求 */}
              <div className="text-xs text-gray-600">
                <p>需求: {template.requirements.cpu} | {template.requirements.memory} | {template.requirements.disk}</p>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" className="flex-1">
                  <Play className="h-4 w-4 mr-1" />
                  使用模板
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicateTemplate(template)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {template.category === 'custom' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">没有找到匹配的模板</p>
              <p>尝试调整搜索条件或创建新的模板</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 模板详情对话框 */}
      {selectedTemplate && (
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTemplate.name}
                <CategoryBadge category={selectedTemplate.category} />
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate.description}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="components">组件</TabsTrigger>
                <TabsTrigger value="requirements">需求</TabsTrigger>
                <TabsTrigger value="config">配置</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>版本</Label>
                    <p className="text-sm">{selectedTemplate.version}</p>
                  </div>
                  <div>
                    <Label>作者</Label>
                    <p className="text-sm">{selectedTemplate.author}</p>
                  </div>
                  <div>
                    <Label>创建时间</Label>
                    <p className="text-sm">{selectedTemplate.createdAt}</p>
                  </div>
                  <div>
                    <Label>更新时间</Label>
                    <p className="text-sm">{selectedTemplate.updatedAt}</p>
                  </div>
                  <div>
                    <Label>下载次数</Label>
                    <p className="text-sm">{selectedTemplate.downloads}</p>
                  </div>
                  <div>
                    <Label>部署模式</Label>
                    <p className="text-sm">{selectedTemplate.deploymentMode === 'standalone' ? '单机' : '集群'}</p>
                  </div>
                </div>
                
                {selectedTemplate.rating > 0 && (
                  <div>
                    <Label>评分</Label>
                    <StarRating rating={selectedTemplate.rating} />
                  </div>
                )}
                
                <div>
                  <Label>标签</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTemplate.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="components" className="space-y-4">
                <div className="space-y-3">
                  {selectedTemplate.components.map((component) => (
                    <Card key={component.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{component.name}</p>
                              <p className="text-sm text-gray-600">版本: {component.version}</p>
                            </div>
                            <ComponentBadge category={component.category} />
                            {component.required && (
                              <Badge variant="outline" className="text-red-600 border-red-600">
                                必需
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="requirements" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CPU</Label>
                    <p className="text-sm">{selectedTemplate.requirements.cpu}</p>
                  </div>
                  <div>
                    <Label>内存</Label>
                    <p className="text-sm">{selectedTemplate.requirements.memory}</p>
                  </div>
                  <div>
                    <Label>磁盘</Label>
                    <p className="text-sm">{selectedTemplate.requirements.disk}</p>
                  </div>
                  <div>
                    <Label>网络协议</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTemplate.requirements.network.map((protocol, index) => (
                        <Badge key={index} variant="outline">
                          {protocol}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="config" className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    配置详情将在使用模板时显示，您可以根据需要调整各组件的参数。
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                关闭
              </Button>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                使用此模板
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}