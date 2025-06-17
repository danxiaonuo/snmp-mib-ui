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
  Plus,
  Eye
} from 'lucide-react'

import { Host, hostManager } from '@/lib/host-management'

interface IntegratedHostSelectionProps {
  selectedComponents: string[]
  onHostsSelected: (hosts: string[]) => void
  onBack: () => void
}

export function IntegratedHostSelection({ selectedComponents, onHostsSelected, onBack }: IntegratedHostSelectionProps) {
  const [selectedHosts, setSelectedHosts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDiscovery, setShowDiscovery] = useState(false)
  const [availableHosts, setAvailableHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)

  // 从API获取主机列表
  const fetchHosts = async () => {
    try {
      setLoading(true)
      const componentParam = selectedComponents.length > 0 ? `?component=${selectedComponents[0]}` : ''
      const response = await fetch(`/api/hosts${componentParam}`)
      const result = await response.json()
      
      if (result.success) {
        setAvailableHosts(result.hosts)
      }
    } catch (error) {
      console.error('获取主机列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHosts()
  }, [selectedComponents])
  
  // 过滤主机
  const filteredHosts = availableHosts.filter(host => {
    const matchesSearch = host.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         host.ip.includes(searchTerm) ||
                         host.hostname?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGroup = filterGroup === 'all' || host.group === filterGroup
    const matchesStatus = filterStatus === 'all' || host.status === filterStatus
    
    // 检查主机是否支持选中的组件
    const supportsComponents = selectedComponents.every(componentId => 
      host.availableComponents.includes(componentId)
    )
    
    return matchesSearch && matchesGroup && matchesStatus && supportsComponents
  })

  // 获取所有组
  const groups = [...new Set(availableHosts.map(host => host.group))]

  const handleHostSelect = (hostId: string, checked: boolean) => {
    if (checked) {
      setSelectedHosts(prev => [...prev, hostId])
    } else {
      setSelectedHosts(prev => prev.filter(id => id !== hostId))
    }
  }

  const handleSelectAll = () => {
    const allHostIds = filteredHosts.map(host => host.id)
    setSelectedHosts(allHostIds)
  }

  const handleClearAll = () => {
    setSelectedHosts([])
  }

  const handleNext = () => {
    if (selectedHosts.length > 0) {
      onHostsSelected(selectedHosts)
    }
  }

  // 启动主机发现
  const handleStartDiscovery = () => {
    setShowDiscovery(true)
    // 这里可以集成主机发现功能
    // 发现完成后自动刷新主机列表
  }

  const formatMemory = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)}GB`
    }
    return `${mb}MB`
  }

  const formatDisk = (gb: number) => {
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)}TB`
    }
    return `${gb}GB`
  }

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">选择目标主机</h3>
          <p className="text-sm text-muted-foreground">
            为以下组件选择部署主机: {selectedComponents.join(', ')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleStartDiscovery}>
            <Plus className="mr-2 h-4 w-4" />
            发现新主机
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* 过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">搜索</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="主机名、IP或标签"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="group">主机组</Label>
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="选择组" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有组</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">状态</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value="online">在线</SelectItem>
                  <SelectItem value="offline">离线</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end space-x-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                全选
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                清空
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主机列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              可用主机 ({filteredHosts.length}) - 已选择 ({selectedHosts.length})
            </CardTitle>
            {selectedHosts.length > 0 && (
              <Badge variant="default">
                {selectedHosts.length} 台主机已选择
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredHosts.length === 0 ? (
            <div className="text-center py-8">
              <Server className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">没有找到合适的主机</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                请检查筛选条件或启动主机发现来添加新主机
              </p>
              <Button className="mt-4" onClick={handleStartDiscovery}>
                <Plus className="mr-2 h-4 w-4" />
                发现主机
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">选择</TableHead>
                  <TableHead>主机信息</TableHead>
                  <TableHead>系统信息</TableHead>
                  <TableHead>资源配置</TableHead>
                  <TableHead>支持组件</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHosts.map((host) => (
                  <TableRow key={host.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedHosts.includes(host.id)}
                        onCheckedChange={(checked) => 
                          handleHostSelect(host.id, checked as boolean)
                        }
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
                        <div className="flex items-center text-xs">
                          <Cpu className="mr-1 h-3 w-3" />
                          {host.cpuCores} 核
                        </div>
                        <div className="flex items-center text-xs">
                          <MemoryStick className="mr-1 h-3 w-3" />
                          {formatMemory(host.memory)}
                        </div>
                        <div className="flex items-center text-xs">
                          <HardDrive className="mr-1 h-3 w-3" />
                          {formatDisk(host.disk)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {selectedComponents.map(componentId => (
                          <Badge 
                            key={componentId}
                            variant={host.availableComponents.includes(componentId) ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {componentId}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {host.status === 'online' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm ${
                          host.status === 'online' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {host.status === 'online' ? '在线' : '离线'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {host.lastSeen}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          返回
        </Button>
        <Button 
          onClick={handleNext}
          disabled={selectedHosts.length === 0}
        >
          下一步: 配置确认 ({selectedHosts.length} 台主机)
        </Button>
      </div>
    </div>
  )
}