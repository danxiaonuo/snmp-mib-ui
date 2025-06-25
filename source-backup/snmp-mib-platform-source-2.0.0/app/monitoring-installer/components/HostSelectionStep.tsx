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
  User
} from 'lucide-react'

import { Host, hostManager } from '@/lib/host-management'

interface HostComponent {
  name: string
  type: string
  version: string
  status: 'running' | 'stopped' | 'failed'
  port: number
}

interface HostSelectionStepProps {
  selectedComponent: {
    id: string
    name: string
    category: string
    requirements: {
      cpu: string
      memory: string
      disk: string
    }
  }
  onHostsSelected: (hosts: Host[]) => void
  onBack: () => void
}

// 模拟主机数据
const MOCK_HOSTS: Host[] = [
  {
    id: 'host-1',
    name: 'prod-web-01',
    ip: '192.168.1.10',
    os: 'Ubuntu',
    osVersion: '22.04 LTS',
    arch: 'amd64',
    status: 'online',
    lastSeen: '2024-01-15 10:30:00',
    cpuCores: 8,
    memory: 16384,
    disk: 500,
    location: '北京数据中心',
    group: 'production',
    tags: ['web', 'frontend'],
    components: [
      { name: 'node-exporter', type: 'collector', version: '1.7.0', status: 'running', port: 9100 }
    ]
  },
  {
    id: 'host-2',
    name: 'prod-db-01',
    ip: '192.168.1.20',
    os: 'CentOS',
    osVersion: '7.9',
    arch: 'amd64',
    status: 'online',
    lastSeen: '2024-01-15 10:25:00',
    cpuCores: 16,
    memory: 32768,
    disk: 1000,
    location: '北京数据中心',
    group: 'production',
    tags: ['database', 'mysql'],
    components: []
  },
  {
    id: 'host-3',
    name: 'test-app-01',
    ip: '192.168.2.10',
    os: 'Ubuntu',
    osVersion: '20.04 LTS',
    arch: 'amd64',
    status: 'online',
    lastSeen: '2024-01-15 10:20:00',
    cpuCores: 4,
    memory: 8192,
    disk: 200,
    location: '上海数据中心',
    group: 'testing',
    tags: ['app', 'testing'],
    components: [
      { name: 'node-exporter', type: 'collector', version: '1.6.1', status: 'running', port: 9100 },
      { name: 'grafana', type: 'visualization', version: '10.2.0', status: 'running', port: 3000 }
    ]
  },
  {
    id: 'host-4',
    name: 'monitor-01',
    ip: '192.168.1.100',
    os: 'Ubuntu',
    osVersion: '22.04 LTS',
    arch: 'amd64',
    status: 'online',
    lastSeen: '2024-01-15 10:35:00',
    cpuCores: 8,
    memory: 16384,
    disk: 500,
    location: '北京数据中心',
    group: 'monitoring',
    tags: ['monitoring', 'infrastructure'],
    components: [
      { name: 'victoria-metrics', type: 'storage', version: '1.96.0', status: 'running', port: 8428 },
      { name: 'alertmanager', type: 'alerting', version: '0.26.0', status: 'running', port: 9093 }
    ]
  },
  {
    id: 'host-5',
    name: 'edge-gateway-01',
    ip: '10.0.1.50',
    os: 'Alpine',
    osVersion: '3.18',
    arch: 'arm64',
    status: 'offline',
    lastSeen: '2024-01-15 08:15:00',
    cpuCores: 2,
    memory: 4096,
    disk: 64,
    location: '边缘节点',
    group: 'edge',
    tags: ['gateway', 'edge'],
    components: []
  }
]

export function HostSelectionStep({ selectedComponent, onHostsSelected, onBack }: HostSelectionStepProps) {
  const [hosts, setHosts] = useState<Host[]>(MOCK_HOSTS)
  const [selectedHosts, setSelectedHosts] = useState<Host[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // 检查主机是否满足组件要求
  const checkHostCompatibility = (host: Host) => {
    const requirements = selectedComponent.requirements
    const issues: string[] = []

    // 检查CPU
    const cpuReq = parseInt(requirements.cpu.replace(/[^\d]/g, ''))
    if (host.cpuCores < cpuReq) {
      issues.push(`CPU不足 (需要${cpuReq}核，当前${host.cpuCores}核)`)
    }

    // 检查内存
    const memReq = parseInt(requirements.memory.replace(/[^\d]/g, '')) * 1024 // GB to MB
    if (host.memory < memReq) {
      issues.push(`内存不足 (需要${requirements.memory}，当前${Math.round(host.memory/1024)}GB)`)
    }

    // 检查磁盘
    const diskReq = parseInt(requirements.disk.replace(/[^\d]/g, ''))
    if (host.disk < diskReq) {
      issues.push(`磁盘空间不足 (需要${requirements.disk}，当前${host.disk}GB)`)
    }

    // 检查是否已安装相同组件
    const hasComponent = host.components.some(comp => comp.name === selectedComponent.id)
    if (hasComponent) {
      issues.push('已安装此组件')
    }

    return {
      compatible: issues.length === 0,
      issues
    }
  }

  // 过滤主机
  const filteredHosts = hosts.filter(host => {
    const matchesSearch = host.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         host.ip.includes(searchTerm) ||
                         host.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || host.status === statusFilter
    const matchesGroup = groupFilter === 'all' || host.group === groupFilter

    return matchesSearch && matchesStatus && matchesGroup
  })

  // 获取所有分组
  const groups = Array.from(new Set(hosts.map(host => host.group)))

  const handleHostToggle = (host: Host) => {
    const isSelected = selectedHosts.some(h => h.id === host.id)
    if (isSelected) {
      setSelectedHosts(selectedHosts.filter(h => h.id !== host.id))
    } else {
      setSelectedHosts([...selectedHosts, host])
    }
  }

  const handleSelectAll = () => {
    const compatibleHosts = filteredHosts.filter(host => 
      checkHostCompatibility(host).compatible && host.status === 'online'
    )
    setSelectedHosts(compatibleHosts)
  }

  const handleClearSelection = () => {
    setSelectedHosts([])
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-100 text-green-800">在线</Badge>
      case 'offline':
        return <Badge variant="destructive">离线</Badge>
      default:
        return <Badge variant="secondary">未知</Badge>
    }
  }

  const getComponentStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">运行中</Badge>
      case 'stopped':
        return <Badge variant="secondary" className="text-xs">已停止</Badge>
      case 'failed':
        return <Badge variant="destructive" className="text-xs">失败</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">未知</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            选择目标主机
          </CardTitle>
          <CardDescription>
            为 <strong>{selectedComponent.name}</strong> 选择要部署的主机。系统会自动检查主机兼容性。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">组件类型</Label>
              <p className="font-medium">{selectedComponent.category}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">系统要求</Label>
              <p className="font-medium">
                {selectedComponent.requirements.cpu} / {selectedComponent.requirements.memory} / {selectedComponent.requirements.disk}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">已选择主机</Label>
              <p className="font-medium">{selectedHosts.length} 台</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 过滤和搜索 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索主机名、IP地址或位置..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="online">在线</SelectItem>
                <SelectItem value="offline">离线</SelectItem>
                <SelectItem value="unknown">未知</SelectItem>
              </SelectContent>
            </Select>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分组</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                选择兼容主机
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearSelection}>
                清除选择
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              显示 {filteredHosts.length} 台主机，已选择 {selectedHosts.length} 台
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 主机列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">选择</TableHead>
                <TableHead>主机信息</TableHead>
                <TableHead>系统配置</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>已安装组件</TableHead>
                <TableHead>兼容性</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHosts.map((host) => {
                const compatibility = checkHostCompatibility(host)
                const isSelected = selectedHosts.some(h => h.id === host.id)
                
                return (
                  <TableRow key={host.id} className={isSelected ? 'bg-blue-50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleHostToggle(host)}
                        disabled={!compatibility.compatible || host.status !== 'online'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{host.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Network className="h-3 w-3" />
                          {host.ip}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {host.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          {host.cpuCores} 核
                        </div>
                        <div className="flex items-center gap-1">
                          <MemoryStick className="h-3 w-3" />
                          {Math.round(host.memory / 1024)} GB
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {host.disk} GB
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {host.os} {host.osVersion} ({host.arch})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {getStatusBadge(host.status)}
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {host.lastSeen}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {host.components.length === 0 ? (
                          <span className="text-sm text-muted-foreground">无</span>
                        ) : (
                          host.components.map((comp, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs">{comp.name}</span>
                              {getComponentStatusBadge(comp.status)}
                            </div>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {compatibility.compatible ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">兼容</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">不兼容</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {compatibility.issues.map((issue, idx) => (
                              <div key={idx}>• {issue}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          上一步
        </Button>
        <Button 
          onClick={() => onHostsSelected(selectedHosts)}
          disabled={selectedHosts.length === 0}
        >
          下一步：配置部署 ({selectedHosts.length})
        </Button>
      </div>

      {/* 选择提示 */}
      {selectedHosts.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            请至少选择一台兼容的在线主机进行部署。
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}