"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Server, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Filter,
  RefreshCw,
  Monitor,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  MapPin,
  Clock,
  User,
  Package,
  Terminal,
  Settings,
  Download,
  Info
} from 'lucide-react'

import { Host, hostManager } from '@/lib/host-management'

interface DeploymentMethod {
  id: 'docker' | 'binary' | 'systemd' | 'package'
  name: string
  description: string
  icon: React.ReactNode
  requirements: string[]
  advantages: string[]
  disadvantages: string[]
}

const deploymentMethods: DeploymentMethod[] = [
  {
    id: 'binary',
    name: '二进制部署',
    description: '直接使用编译好的二进制文件部署，无需容器环境',
    icon: <Terminal className="h-5 w-5" />,
    requirements: ['SSH访问权限', '目标目录写入权限'],
    advantages: ['性能最优', '资源占用最少', '启动速度快', '无需Docker环境'],
    disadvantages: ['需要手动管理依赖', '升级相对复杂']
  },
  {
    id: 'docker',
    name: 'Docker容器',
    description: '使用Docker容器部署，环境隔离性好',
    icon: <Package className="h-5 w-5" />,
    requirements: ['Docker环境', 'Docker Compose（可选）'],
    advantages: ['环境隔离', '部署简单', '版本管理方便', '回滚容易'],
    disadvantages: ['需要Docker环境', '资源开销较大']
  },
  {
    id: 'systemd',
    name: 'Systemd服务',
    description: '作为系统服务运行，由systemd管理',
    icon: <Settings className="h-5 w-5" />,
    requirements: ['Systemd支持', 'Root权限'],
    advantages: ['系统集成度高', '开机自启', '日志管理完善'],
    disadvantages: ['仅支持Linux', '需要Root权限']
  },
  {
    id: 'package',
    name: '包管理器',
    description: '通过系统包管理器安装（apt、yum等）',
    icon: <Download className="h-5 w-5" />,
    requirements: ['包管理器', '软件源配置'],
    advantages: ['系统集成', '依赖自动处理', '安全更新'],
    disadvantages: ['版本可能滞后', '需要配置软件源']
  }
]

interface FlexibleHostSelectionProps {
  selectedComponent: {
    id: string
    name: string
    category: string
  }
  onHostsSelected: (hosts: Host[], deploymentMethod: string) => void
  onBack: () => void
}

export function FlexibleHostSelection({ 
  selectedComponent, 
  onHostsSelected, 
  onBack 
}: FlexibleHostSelectionProps) {
  const [hosts, setHosts] = useState<Host[]>([])
  const [selectedHosts, setSelectedHosts] = useState<Set<string>>(new Set())
  const [selectedDeploymentMethod, setSelectedDeploymentMethod] = useState<string>('binary')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [activeTab, setActiveTab] = useState('method')

  // 获取主机列表
  const fetchHosts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/hosts?component=${selectedComponent.id}`)
      const result = await response.json()
      if (result.success) {
        setHosts(result.hosts)
      }
    } catch (error) {
      console.error('获取主机列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 过滤主机
  const filteredHosts = hosts.filter(host => {
    const matchesSearch = host.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         host.ip.includes(searchTerm) ||
                         host.hostname?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup = filterGroup === 'all' || host.group === filterGroup
    return matchesSearch && matchesGroup
  })

  // 获取主机组列表
  const hostGroups = Array.from(new Set(hosts.map(host => host.group)))

  // 切换主机选择
  const toggleHostSelection = (hostId: string) => {
    const newSelected = new Set(selectedHosts)
    if (newSelected.has(hostId)) {
      newSelected.delete(hostId)
    } else {
      newSelected.add(hostId)
    }
    setSelectedHosts(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedHosts.size === filteredHosts.length) {
      setSelectedHosts(new Set())
    } else {
      setSelectedHosts(new Set(filteredHosts.map(host => host.id)))
    }
  }

  // 继续到下一步
  const handleContinue = () => {
    const selectedHostObjects = hosts.filter(host => selectedHosts.has(host.id))
    onHostsSelected(selectedHostObjects, selectedDeploymentMethod)
  }

  // 检查部署方法是否适用于主机
  const isMethodCompatible = (host: Host, methodId: string): boolean => {
    switch (methodId) {
      case 'docker':
        // Docker需要Linux环境，这里简化检查
        return host.os.toLowerCase().includes('linux') || host.os.toLowerCase().includes('ubuntu')
      case 'binary':
        // 二进制部署支持所有平台
        return true
      case 'systemd':
        // Systemd仅支持Linux
        return host.os.toLowerCase().includes('linux') || host.os.toLowerCase().includes('ubuntu')
      case 'package':
        // 包管理器需要特定系统
        return host.os.toLowerCase().includes('ubuntu') || host.os.toLowerCase().includes('centos')
      default:
        return true
    }
  }

  // 获取兼容的主机数量
  const getCompatibleHostsCount = (methodId: string): number => {
    return hosts.filter(host => isMethodCompatible(host, methodId)).length
  }

  useEffect(() => {
    fetchHosts()
  }, [selectedComponent.id])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">选择部署方式和目标主机</h2>
          <p className="text-muted-foreground">
            为 {selectedComponent.name} 选择合适的部署方式和目标主机
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          返回
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="method">部署方式</TabsTrigger>
          <TabsTrigger value="hosts">目标主机</TabsTrigger>
        </TabsList>

        {/* 部署方式选择 */}
        <TabsContent value="method" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>选择部署方式</CardTitle>
              <CardDescription>
                根据您的环境和需求选择最适合的部署方式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={selectedDeploymentMethod} 
                onValueChange={setSelectedDeploymentMethod}
                className="space-y-4"
              >
                {deploymentMethods.map((method) => (
                  <div key={method.id} className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {method.icon}
                          <Label htmlFor={method.id} className="text-base font-medium cursor-pointer">
                            {method.name}
                          </Label>
                          <Badge variant="outline">
                            {getCompatibleHostsCount(method.id)} 台兼容主机
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {method.description}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">系统要求:</h5>
                            <ul className="space-y-1">
                              {method.requirements.map((req, index) => (
                                <li key={index} className="text-muted-foreground">• {req}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-green-700 mb-1">优势:</h5>
                            <ul className="space-y-1">
                              {method.advantages.map((adv, index) => (
                                <li key={index} className="text-green-600">• {adv}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-orange-700 mb-1">注意事项:</h5>
                            <ul className="space-y-1">
                              {method.disadvantages.map((dis, index) => (
                                <li key={index} className="text-orange-600">• {dis}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={() => setActiveTab('hosts')}
                  className="flex items-center gap-2"
                >
                  下一步：选择主机
                  <Server className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 主机选择 */}
        <TabsContent value="hosts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                选择目标主机
                <Badge variant="outline">
                  {selectedDeploymentMethod === 'binary' ? '二进制部署' :
                   selectedDeploymentMethod === 'docker' ? 'Docker部署' :
                   selectedDeploymentMethod === 'systemd' ? 'Systemd服务' : '包管理器'}
                </Badge>
              </CardTitle>
              <CardDescription>
                选择要部署 {selectedComponent.name} 的目标主机
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 搜索和过滤 */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索主机名、IP或主机名..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="选择主机组" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有主机组</SelectItem>
                    {hostGroups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchHosts} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* 主机列表 */}
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>加载主机列表...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedHosts.size === filteredHosts.length && filteredHosts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                      <span className="text-sm text-muted-foreground">
                        已选择 {selectedHosts.size} / {filteredHosts.length} 台主机
                      </span>
                    </div>
                    <Badge variant="outline">
                      {filteredHosts.filter(host => isMethodCompatible(host, selectedDeploymentMethod)).length} 台兼容主机
                    </Badge>
                  </div>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>主机信息</TableHead>
                          <TableHead>系统信息</TableHead>
                          <TableHead>资源配置</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>兼容性</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHosts.map((host) => {
                          const isCompatible = isMethodCompatible(host, selectedDeploymentMethod)
                          return (
                            <TableRow 
                              key={host.id}
                              className={!isCompatible ? 'opacity-50' : ''}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedHosts.has(host.id)}
                                  onCheckedChange={() => toggleHostSelection(host.id)}
                                  disabled={!isCompatible}
                                />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{host.name}</div>
                                  <div className="text-sm text-muted-foreground">{host.ip}</div>
                                  {host.hostname && (
                                    <div className="text-xs text-muted-foreground">{host.hostname}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="text-sm">{host.os} {host.osVersion}</div>
                                  <div className="text-xs text-muted-foreground">{host.arch}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-xs">
                                    <Cpu className="h-3 w-3" />
                                    {host.cpuCores} 核
                                  </div>
                                  <div className="flex items-center gap-1 text-xs">
                                    <MemoryStick className="h-3 w-3" />
                                    {Math.round(host.memory / 1024)} GB
                                  </div>
                                  <div className="flex items-center gap-1 text-xs">
                                    <HardDrive className="h-3 w-3" />
                                    {host.disk} GB
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={host.status === 'online' ? 'default' : 'secondary'}>
                                  {host.status === 'online' ? '在线' : '离线'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {isCompatible ? (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    兼容
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    不兼容
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {filteredHosts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      没有找到匹配的主机
                    </div>
                  )}
                </>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('method')}
                >
                  返回选择部署方式
                </Button>
                <Button 
                  onClick={handleContinue}
                  disabled={selectedHosts.size === 0}
                  className="flex items-center gap-2"
                >
                  继续部署 ({selectedHosts.size} 台主机)
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 兼容性说明 */}
          {selectedDeploymentMethod && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>部署方式说明:</strong> {deploymentMethods.find(m => m.id === selectedDeploymentMethod)?.description}
                <br />
                <strong>系统要求:</strong> {deploymentMethods.find(m => m.id === selectedDeploymentMethod)?.requirements.join('、')}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}