"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Search, 
  Plus, 
  Play, 
  Pause, 
  RefreshCw, 
  Settings, 
  Monitor, 
  Server, 
  Network, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Key,
  Shield,
  Terminal,
  AlertTriangle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface DiscoveryTask {
  id: string
  name: string
  ipRange: string
  ports: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  totalHosts: number
  foundHosts: number
  onlineHosts: number
  startedAt?: string
  completedAt?: string
}

interface DiscoveredHost {
  id: string
  name: string
  ip: string
  hostname?: string
  os: string
  osVersion: string
  arch: string
  status: 'online' | 'offline' | 'unknown'
  cpuCores: number
  memory: number
  disk: number
  lastSeen: string
  group: string
  location: string
  sshPort: number
  sshConnectable: boolean
  components: Array<{
    name: string
    status: string
    port: number
  }>
}

interface RemoteHostDiscoveryProps {
  onHostsSelected: (hosts: DiscoveredHost[]) => void
  onBack: () => void
}

export function RemoteHostDiscovery({ onHostsSelected, onBack }: RemoteHostDiscoveryProps) {
  const [activeTab, setActiveTab] = useState('discover')
  const [discoveryTasks, setDiscoveryTasks] = useState<DiscoveryTask[]>([])
  const [discoveredHosts, setDiscoveredHosts] = useState<DiscoveredHost[]>([])
  const [selectedHosts, setSelectedHosts] = useState<Set<string>>(new Set())
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  // 新发现任务表单
  const [newTask, setNewTask] = useState({
    name: '',
    ipRange: '',
    ports: '22,80,443,9100',
    timeout: 5,
    concurrent: 50
  })

  // 手动添加主机表单
  const [manualHost, setManualHost] = useState({
    name: '',
    ip: '',
    sshPort: 22,
    sshUser: '',
    sshPassword: '',
    sshKey: ''
  })

  // 开始发现任务
  const startDiscovery = async () => {
    if (!newTask.name || !newTask.ipRange) {
      toast.error('请填写任务名称和IP范围')
      return
    }

    const task: DiscoveryTask = {
      id: Date.now().toString(),
      name: newTask.name,
      ipRange: newTask.ipRange,
      ports: newTask.ports,
      status: 'running',
      progress: 0,
      totalHosts: 0,
      foundHosts: 0,
      onlineHosts: 0,
      startedAt: new Date().toISOString()
    }

    setDiscoveryTasks(prev => [...prev, task])
    setIsDiscovering(true)

    try {
      const response = await fetch('/api/hosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'discover',
          ipRange: newTask.ipRange,
          ports: newTask.ports.split(',').map(p => parseInt(p.trim())),
          timeout: newTask.timeout,
          concurrent: newTask.concurrent
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // 直接处理发现结果，因为API已经返回完整结果
        setIsDiscovering(false)
        setDiscoveryTasks(prev => prev.map(t => 
          t.id === task.id ? {
            ...t,
            status: 'completed',
            progress: 100,
            foundHosts: result.foundHosts,
            onlineHosts: result.onlineHosts,
            completedAt: new Date().toISOString()
          } : t
        ))
        
        // 添加发现的主机到列表
        if (result.hosts) {
          setDiscoveredHosts(prev => [...prev, ...result.hosts])
        }
        
        toast.success(`发现任务完成，找到 ${result.foundHosts} 台主机`)
      } else {
        setIsDiscovering(false)
        setDiscoveryTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'failed' } : t
        ))
        toast.error('发现任务启动失败')
      }
    } catch (error) {
      setIsDiscovering(false)
      setDiscoveryTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'failed' } : t
      ))
      toast.error('发现任务启动失败')
    }

    // 重置表单
    setNewTask({
      name: '',
      ipRange: '',
      ports: '22,80,443,9100',
      timeout: 5,
      concurrent: 50
    })
  }

  // 手动添加主机
  const addManualHost = async () => {
    if (!manualHost.name || !manualHost.ip) {
      toast.error('请填写主机名称和IP地址')
      return
    }

    try {
      const response = await fetch('/api/hosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add-manual',
          host: {
            name: manualHost.name,
            ip: manualHost.ip,
            sshPort: manualHost.sshPort,
            sshUser: manualHost.sshUser,
            sshPassword: manualHost.sshPassword,
            sshKey: manualHost.sshKey
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setDiscoveredHosts(prev => [...prev, result.host])
        setShowAddDialog(false)
        setManualHost({
          name: '',
          ip: '',
          sshPort: 22,
          sshUser: '',
          sshPassword: '',
          sshKey: ''
        })
        toast.success('主机添加成功')
      } else {
        toast.error('主机添加失败')
      }
    } catch (error) {
      toast.error('主机添加失败')
    }
  }

  // 测试SSH连接
  const testSSHConnection = async (host: DiscoveredHost) => {
    try {
      const response = await fetch('/api/hosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test-ssh',
          hostId: host.id
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setDiscoveredHosts(prev => prev.map(h => 
          h.id === host.id ? { ...h, sshConnectable: result.connectable } : h
        ))
        toast.success(result.connectable ? 'SSH连接成功' : 'SSH连接失败')
      }
    } catch (error) {
      toast.error('SSH连接测试失败')
    }
  }

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
    if (selectedHosts.size === discoveredHosts.length) {
      setSelectedHosts(new Set())
    } else {
      setSelectedHosts(new Set(discoveredHosts.map(host => host.id)))
    }
  }

  // 继续到下一步
  const handleContinue = () => {
    const selectedHostObjects = discoveredHosts.filter(host => selectedHosts.has(host.id))
    onHostsSelected(selectedHostObjects)
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取任务状态颜色
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 加载已有的主机数据
  useEffect(() => {
    const loadExistingHosts = async () => {
      try {
        const response = await fetch('/api/hosts')
        const result = await response.json()
        if (result.success) {
          setDiscoveredHosts(result.hosts || [])
        }
      } catch (error) {
        console.error('加载主机数据失败:', error)
      }
    }
    
    loadExistingHosts()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">远程主机发现与连接</h2>
          <p className="text-muted-foreground">
            发现网络中的主机并建立连接，为监控组件部署做准备
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          返回
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover">主机发现</TabsTrigger>
          <TabsTrigger value="hosts">发现的主机</TabsTrigger>
          <TabsTrigger value="manual">手动添加</TabsTrigger>
        </TabsList>

        {/* 主机发现 */}
        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                网络扫描发现
              </CardTitle>
              <CardDescription>
                扫描指定网络范围，自动发现在线主机
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task-name">任务名称</Label>
                  <Input
                    id="task-name"
                    placeholder="例如：数据中心扫描"
                    value={newTask.name}
                    onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ip-range">IP范围</Label>
                  <Input
                    id="ip-range"
                    placeholder="例如：192.168.1.0/24 或 10.0.0.1-10.0.0.100"
                    value={newTask.ipRange}
                    onChange={(e) => setNewTask(prev => ({ ...prev, ipRange: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ports">扫描端口</Label>
                  <Input
                    id="ports"
                    placeholder="例如：22,80,443,9100"
                    value={newTask.ports}
                    onChange={(e) => setNewTask(prev => ({ ...prev, ports: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="timeout">超时时间(秒)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={newTask.timeout}
                    onChange={(e) => setNewTask(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <Button 
                onClick={startDiscovery} 
                disabled={isDiscovering}
                className="w-full"
              >
                {isDiscovering ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    发现中...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    开始发现
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 发现任务列表 */}
          {discoveryTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>发现任务</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {discoveryTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{task.name}</h4>
                        <Badge className={getTaskStatusColor(task.status)}>
                          {task.status === 'running' ? '运行中' :
                           task.status === 'completed' ? '已完成' :
                           task.status === 'failed' ? '失败' : '等待中'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        IP范围: {task.ipRange} | 端口: {task.ports}
                      </div>
                      {task.status === 'running' && (
                        <div className="space-y-2">
                          <Progress value={task.progress} />
                          <div className="text-sm text-muted-foreground">
                            进度: {task.progress}% | 发现: {task.foundHosts} 台 | 在线: {task.onlineHosts} 台
                          </div>
                        </div>
                      )}
                      {task.status === 'completed' && (
                        <div className="text-sm text-muted-foreground">
                          完成时间: {task.completedAt} | 发现: {task.foundHosts} 台主机
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 发现的主机 */}
        <TabsContent value="hosts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  发现的主机 ({discoveredHosts.length})
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedHosts.size === discoveredHosts.length && discoveredHosts.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    已选择 {selectedHosts.size} / {discoveredHosts.length}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {discoveredHosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无发现的主机</p>
                  <p className="text-sm">请先进行网络扫描或手动添加主机</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>主机信息</TableHead>
                        <TableHead>系统信息</TableHead>
                        <TableHead>资源配置</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>SSH连接</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discoveredHosts.map((host) => (
                        <TableRow key={host.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedHosts.has(host.id)}
                              onCheckedChange={() => toggleHostSelection(host.id)}
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
                            <div className="flex items-center gap-2">
                              {getStatusIcon(host.status)}
                              <span className="text-sm">
                                {host.status === 'online' ? '在线' : 
                                 host.status === 'offline' ? '离线' : '未知'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {host.sshConnectable ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  可连接
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  无法连接
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testSSHConnection(host)}
                            >
                              <Terminal className="h-3 w-3 mr-1" />
                              测试SSH
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 手动添加 */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                手动添加主机
              </CardTitle>
              <CardDescription>
                手动添加已知的远程主机，配置SSH连接信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manual-name">主机名称</Label>
                  <Input
                    id="manual-name"
                    placeholder="例如：web-server-01"
                    value={manualHost.name}
                    onChange={(e) => setManualHost(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="manual-ip">IP地址</Label>
                  <Input
                    id="manual-ip"
                    placeholder="例如：192.168.1.10"
                    value={manualHost.ip}
                    onChange={(e) => setManualHost(prev => ({ ...prev, ip: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="manual-ssh-port">SSH端口</Label>
                  <Input
                    id="manual-ssh-port"
                    type="number"
                    value={manualHost.sshPort}
                    onChange={(e) => setManualHost(prev => ({ ...prev, sshPort: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="manual-ssh-user">SSH用户名</Label>
                  <Input
                    id="manual-ssh-user"
                    placeholder="例如：root"
                    value={manualHost.sshUser}
                    onChange={(e) => setManualHost(prev => ({ ...prev, sshUser: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="manual-ssh-password">SSH密码</Label>
                  <Input
                    id="manual-ssh-password"
                    type="password"
                    placeholder="SSH密码（可选）"
                    value={manualHost.sshPassword}
                    onChange={(e) => setManualHost(prev => ({ ...prev, sshPassword: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="manual-ssh-key">SSH私钥</Label>
                <Textarea
                  id="manual-ssh-key"
                  placeholder="粘贴SSH私钥内容（可选）"
                  value={manualHost.sshKey}
                  onChange={(e) => setManualHost(prev => ({ ...prev, sshKey: e.target.value }))}
                  rows={6}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>安全提示：</strong> SSH密码和私钥将被加密存储。建议使用SSH密钥认证而非密码认证。
                </AlertDescription>
              </Alert>
              
              <Button onClick={addManualHost} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                添加主机
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 底部操作按钮 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          返回上一步
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
    </div>
  )
}