"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Shield
} from "lucide-react"
import { toast } from "sonner"

// 模拟数据
const mockDiscoveryTasks = [
  {
    id: "1",
    name: "数据中心网段扫描",
    ipRange: "192.168.1.0/24",
    ports: "22,80,443,9100",
    status: "completed",
    progress: 100,
    totalHosts: 254,
    foundHosts: 45,
    onlineHosts: 38,
    startedAt: "2024-01-15 10:00:00",
    completedAt: "2024-01-15 10:15:00"
  },
  {
    id: "2", 
    name: "办公网络扫描",
    ipRange: "10.0.0.0/16",
    ports: "22,3389",
    status: "running",
    progress: 65,
    totalHosts: 65536,
    foundHosts: 1250,
    onlineHosts: 980,
    startedAt: "2024-01-15 14:30:00",
    completedAt: null
  }
]

const mockHosts = [
  {
    id: "1",
    name: "web-server-01",
    ip: "192.168.1.10",
    hostname: "web01.company.com",
    os: "Ubuntu",
    osVersion: "22.04",
    arch: "x86_64",
    status: "online",
    cpuCores: 8,
    memory: 16384,
    disk: 500,
    lastSeen: "2024-01-15 16:45:00",
    group: "Web服务器",
    location: "数据中心A",
    components: [
      { name: "node-exporter", status: "running", port: 9100 },
      { name: "nginx", status: "running", port: 80 }
    ]
  },
  {
    id: "2",
    name: "db-server-01", 
    ip: "192.168.1.20",
    hostname: "db01.company.com",
    os: "CentOS",
    osVersion: "8.5",
    arch: "x86_64",
    status: "online",
    cpuCores: 16,
    memory: 32768,
    disk: 2000,
    lastSeen: "2024-01-15 16:44:00",
    group: "数据库服务器",
    location: "数据中心A",
    components: [
      { name: "node-exporter", status: "running", port: 9100 },
      { name: "mysql", status: "running", port: 3306 }
    ]
  }
]

const mockCredentials = [
  {
    id: "1",
    name: "默认SSH凭据",
    username: "admin",
    authType: "password",
    description: "数据中心默认SSH凭据"
  },
  {
    id: "2",
    name: "生产环境密钥",
    username: "deploy",
    authType: "key",
    description: "生产环境部署密钥"
  }
]

export default function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState("discovery")
  const [discoveryTasks, setDiscoveryTasks] = useState(mockDiscoveryTasks)
  const [hosts, setHosts] = useState(mockHosts)

  // 将发现的主机添加到主机管理器
  const addHostsToManager = async (discoveredHosts: any[]) => {
    try {
      const response = await fetch('/api/hosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk-add',
          hosts: discoveredHosts
        })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success(`成功添加 ${result.count} 台主机到主机库`)
      }
    } catch (error) {
      console.error('添加主机到管理器失败:', error)
      toast.error('添加主机失败')
    }
  }
  const [credentials, setCredentials] = useState(mockCredentials)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedGroup, setSelectedGroup] = useState("all")

  // 新建发现任务对话框状态
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    name: "",
    ipRange: "",
    ports: "22,80,443,9100",
    timeout: 5,
    username: "",
    authType: "password",
    password: "",
    privateKey: ""
  })

  // 新建凭据对话框状态
  const [isNewCredentialDialogOpen, setIsNewCredentialDialogOpen] = useState(false)
  const [newCredential, setNewCredential] = useState({
    name: "",
    username: "",
    authType: "password",
    password: "",
    privateKey: "",
    description: ""
  })

  // 主机详情对话框状态
  const [selectedHost, setSelectedHost] = useState(null)
  const [isHostDetailDialogOpen, setIsHostDetailDialogOpen] = useState(false)

  // 过滤主机
  const filteredHosts = hosts.filter(host => {
    const matchesSearch = host.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         host.ip.includes(searchTerm) ||
                         host.hostname.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || host.status === selectedStatus
    const matchesGroup = selectedGroup === "all" || host.group === selectedGroup
    return matchesSearch && matchesStatus && matchesGroup
  })

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case "online": return "text-green-600 bg-green-100"
      case "offline": return "text-red-600 bg-red-100"
      case "running": return "text-blue-600 bg-blue-100"
      case "completed": return "text-green-600 bg-green-100"
      case "failed": return "text-red-600 bg-red-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case "online":
      case "running":
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "offline":
      case "failed":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // 创建发现任务
  const handleCreateTask = () => {
    const task = {
      id: Date.now().toString(),
      ...newTask,
      status: "pending",
      progress: 0,
      totalHosts: 0,
      foundHosts: 0,
      onlineHosts: 0,
      startedAt: null,
      completedAt: null
    }
    
    setDiscoveryTasks([...discoveryTasks, task])
    setIsNewTaskDialogOpen(false)
    setNewTask({
      name: "",
      ipRange: "",
      ports: "22,80,443,9100",
      timeout: 5,
      username: "",
      authType: "password",
      password: "",
      privateKey: ""
    })
    toast.success("发现任务创建成功")
  }

  // 启动发现任务
  const handleStartTask = async (taskId) => {
    setDiscoveryTasks(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: "running", startedAt: new Date().toLocaleString(), progress: 0 }
          : task
      )
    )
    
    // 模拟发现进度
    const interval = setInterval(() => {
      setDiscoveryTasks(tasks => 
        tasks.map(task => {
          if (task.id === taskId && task.status === "running") {
            const newProgress = Math.min(task.progress + Math.random() * 15, 100)
            const isCompleted = newProgress >= 100
            
            return {
              ...task,
              progress: newProgress,
              status: isCompleted ? "completed" : "running",
              completedAt: isCompleted ? new Date().toLocaleString() : null,
              totalHosts: isCompleted ? 254 : Math.floor(newProgress * 2.54),
              foundHosts: isCompleted ? 45 : Math.floor(newProgress * 0.45),
              onlineHosts: isCompleted ? 38 : Math.floor(newProgress * 0.38)
            }
          }
          return task
        })
      )
    }, 2000)

    // 清理定时器
    setTimeout(() => {
      clearInterval(interval)
      // 自动添加发现的主机到主机库
      const discoveredHosts = mockHosts.slice(0, 3).map(host => ({
        ...host,
        discoveredAt: new Date().toISOString()
      }))
      addHostsToManager(discoveredHosts)
    }, 20000)
    
    toast.success("发现任务已启动")
  }

  // 停止发现任务
  const handleStopTask = (taskId) => {
    setDiscoveryTasks(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: "stopped", completedAt: new Date().toLocaleString() }
          : task
      )
    )
    toast.success("发现任务已停止")
  }

  // 删除发现任务
  const handleDeleteTask = (taskId) => {
    setDiscoveryTasks(tasks => tasks.filter(task => task.id !== taskId))
    toast.success("发现任务已删除")
  }

  // 查看主机详情
  const handleViewHost = (host) => {
    setSelectedHost(host)
    setIsHostDetailDialogOpen(true)
  }

  // 编辑主机信息
  const handleEditHost = (host) => {
    setSelectedHost(host)
    // 这里可以打开编辑对话框
    toast.info("编辑主机功能")
  }

  // 测试主机连接
  const handleTestConnection = async (hostId) => {
    toast.loading("正在测试连接...")
    
    // 模拟连接测试
    setTimeout(() => {
      const success = Math.random() > 0.2 // 80%成功率
      if (success) {
        toast.success("连接测试成功")
        // 更新主机状态
        setHosts(hosts => 
          hosts.map(host => 
            host.id === hostId 
              ? { ...host, status: "online", lastSeen: new Date().toLocaleString() }
              : host
          )
        )
      } else {
        toast.error("连接测试失败")
        setHosts(hosts => 
          hosts.map(host => 
            host.id === hostId 
              ? { ...host, status: "offline" }
              : host
          )
        )
      }
    }, 2000)
  }

  // 批量添加主机到主机库
  const handleBatchAddToManager = () => {
    const selectedHosts = hosts.filter(host => host.selected)
    if (selectedHosts.length === 0) {
      toast.error("请先选择要添加的主机")
      return
    }
    addHostsToManager(selectedHosts)
  }

  // 切换主机选择状态
  const toggleHostSelection = (hostId) => {
    setHosts(hosts => 
      hosts.map(host => 
        host.id === hostId 
          ? { ...host, selected: !host.selected }
          : host
      )
    )
  }

  // 全选/取消全选主机
  const toggleAllHostsSelection = () => {
    const allSelected = hosts.every(host => host.selected)
    setHosts(hosts => 
      hosts.map(host => ({ ...host, selected: !allSelected }))
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* 页面标题 */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-blue-600">
              <Search className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">主机发现</h2>
          </div>
          <p className="text-muted-foreground">
            发现网络中的主机并管理监控组件部署
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discovery">主机发现</TabsTrigger>
          <TabsTrigger value="hosts">主机管理</TabsTrigger>
          <TabsTrigger value="credentials">凭据管理</TabsTrigger>
          <TabsTrigger value="deployment">组件部署</TabsTrigger>
        </TabsList>

        {/* 主机发现标签页 */}
        <TabsContent value="discovery" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">发现任务</h3>
            <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新建任务
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>创建主机发现任务</DialogTitle>
                  <DialogDescription>
                    配置网络扫描参数以发现主机
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-name">任务名称</Label>
                      <Input
                        id="task-name"
                        value={newTask.name}
                        onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                        placeholder="输入任务名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ip-range">IP范围</Label>
                      <Input
                        id="ip-range"
                        value={newTask.ipRange}
                        onChange={(e) => setNewTask({...newTask, ipRange: e.target.value})}
                        placeholder="192.168.1.0/24 或 192.168.1.1-192.168.1.100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ports">扫描端口</Label>
                      <Input
                        id="ports"
                        value={newTask.ports}
                        onChange={(e) => setNewTask({...newTask, ports: e.target.value})}
                        placeholder="22,80,443,9100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeout">超时时间(秒)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={newTask.timeout}
                        onChange={(e) => setNewTask({...newTask, timeout: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">SSH认证配置</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">用户名</Label>
                        <Input
                          id="username"
                          value={newTask.username}
                          onChange={(e) => setNewTask({...newTask, username: e.target.value})}
                          placeholder="SSH用户名"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="auth-type">认证方式</Label>
                        <Select value={newTask.authType} onValueChange={(value) => setNewTask({...newTask, authType: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="password">密码</SelectItem>
                            <SelectItem value="key">私钥</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {newTask.authType === "password" ? (
                      <div className="space-y-2">
                        <Label htmlFor="password">密码</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newTask.password}
                          onChange={(e) => setNewTask({...newTask, password: e.target.value})}
                          placeholder="SSH密码"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="private-key">私钥</Label>
                        <Textarea
                          id="private-key"
                          value={newTask.privateKey}
                          onChange={(e) => setNewTask({...newTask, privateKey: e.target.value})}
                          placeholder="粘贴SSH私钥内容"
                          rows={4}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateTask}>
                    创建任务
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {discoveryTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{task.name}</CardTitle>
                      <CardDescription>
                        IP范围: {task.ipRange} | 端口: {task.ports}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                        <span className="ml-1">
                          {task.status === "running" ? "运行中" : 
                           task.status === "completed" ? "已完成" : 
                           task.status === "failed" ? "失败" : "待启动"}
                        </span>
                      </Badge>
                      {task.status === "pending" && (
                        <Button size="sm" onClick={() => handleStartTask(task.id)}>
                          <Play className="h-4 w-4 mr-1" />
                          启动
                        </Button>
                      )}
                      {task.status === "running" && (
                        <Button size="sm" variant="outline" onClick={() => handleStopTask(task.id)}>
                          <Pause className="h-4 w-4 mr-1" />
                          停止
                        </Button>
                      )}
                      {(task.status === "completed" || task.status === "stopped" || task.status === "failed") && (
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(task.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          删除
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {task.status !== "pending" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>进度</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">总主机数</div>
                        <div className="font-medium">{task.totalHosts}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">发现主机</div>
                        <div className="font-medium text-blue-600">{task.foundHosts}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">在线主机</div>
                        <div className="font-medium text-green-600">{task.onlineHosts}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">开始时间</div>
                        <div className="font-medium">{task.startedAt || "-"}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 主机管理标签页 */}
        <TabsContent value="hosts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">主机列表</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索主机..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="online">在线</SelectItem>
                  <SelectItem value="offline">离线</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分组</SelectItem>
                  <SelectItem value="Web服务器">Web服务器</SelectItem>
                  <SelectItem value="数据库服务器">数据库服务器</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleBatchAddToManager}
                disabled={!hosts.some(host => host.selected)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                批量添加到主机库 ({hosts.filter(host => host.selected).length})
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={hosts.length > 0 && hosts.every(host => host.selected)}
                        onChange={toggleAllHostsSelection}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>主机信息</TableHead>
                    <TableHead>系统信息</TableHead>
                    <TableHead>资源配置</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>组件</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHosts.map((host) => (
                    <TableRow key={host.id} className={host.selected ? 'bg-blue-50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={host.selected || false}
                          onChange={() => toggleHostSelection(host.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{host.name}</div>
                          <div className="text-sm text-muted-foreground">{host.ip}</div>
                          <div className="text-xs text-muted-foreground">{host.hostname}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{host.os} {host.osVersion}</div>
                          <div className="text-xs text-muted-foreground">{host.arch}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <Cpu className="h-3 w-3 mr-1" />
                            {host.cpuCores} 核
                          </div>
                          <div className="flex items-center">
                            <MemoryStick className="h-3 w-3 mr-1" />
                            {(host.memory / 1024).toFixed(1)} GB
                          </div>
                          <div className="flex items-center">
                            <HardDrive className="h-3 w-3 mr-1" />
                            {host.disk} GB
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Badge className={getStatusColor(host.status)}>
                            {getStatusIcon(host.status)}
                            <span className="ml-1">
                              {host.status === "online" ? "在线" : "离线"}
                            </span>
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {host.lastSeen}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {host.components.map((component, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {component.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => handleViewHost(host)} title="查看详情">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleTestConnection(host.id)} title="测试连接">
                            <Wifi className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditHost(host)} title="编辑主机">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 凭据管理标签页 */}
        <TabsContent value="credentials" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">认证凭据</h3>
            <Dialog open={isNewCredentialDialogOpen} onOpenChange={setIsNewCredentialDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新建凭据
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建认证凭据</DialogTitle>
                  <DialogDescription>
                    添加SSH认证凭据用于主机连接
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cred-name">凭据名称</Label>
                    <Input
                      id="cred-name"
                      value={newCredential.name}
                      onChange={(e) => setNewCredential({...newCredential, name: e.target.value})}
                      placeholder="输入凭据名称"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cred-username">用户名</Label>
                    <Input
                      id="cred-username"
                      value={newCredential.username}
                      onChange={(e) => setNewCredential({...newCredential, username: e.target.value})}
                      placeholder="SSH用户名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cred-auth-type">认证方式</Label>
                    <Select value={newCredential.authType} onValueChange={(value) => setNewCredential({...newCredential, authType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="password">密码</SelectItem>
                        <SelectItem value="key">私钥</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newCredential.authType === "password" ? (
                    <div className="space-y-2">
                      <Label htmlFor="cred-password">密码</Label>
                      <Input
                        id="cred-password"
                        type="password"
                        value={newCredential.password}
                        onChange={(e) => setNewCredential({...newCredential, password: e.target.value})}
                        placeholder="SSH密码"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="cred-private-key">私钥</Label>
                      <Textarea
                        id="cred-private-key"
                        value={newCredential.privateKey}
                        onChange={(e) => setNewCredential({...newCredential, privateKey: e.target.value})}
                        placeholder="粘贴SSH私钥内容"
                        rows={4}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="cred-description">描述</Label>
                    <Textarea
                      id="cred-description"
                      value={newCredential.description}
                      onChange={(e) => setNewCredential({...newCredential, description: e.target.value})}
                      placeholder="凭据描述"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewCredentialDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={() => {
                    setCredentials([...credentials, {...newCredential, id: Date.now().toString()}])
                    setIsNewCredentialDialogOpen(false)
                    setNewCredential({
                      name: "",
                      username: "",
                      authType: "password",
                      password: "",
                      privateKey: "",
                      description: ""
                    })
                    toast.success("凭据创建成功")
                  }}>
                    创建
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {credentials.map((credential) => (
              <Card key={credential.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center">
                        <Key className="h-5 w-5 mr-2" />
                        {credential.name}
                      </CardTitle>
                      <CardDescription>{credential.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {credential.authType === "password" ? "密码" : "私钥"}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <span className="text-muted-foreground">用户名: </span>
                    <span className="font-medium">{credential.username}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 组件部署标签页 */}
        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>组件部署</CardTitle>
              <CardDescription>
                选择主机并部署监控组件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-4" />
                <p>组件部署功能正在开发中...</p>
                <p className="text-sm mt-2">将支持拖拽式组件部署到选定主机</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 主机详情对话框 */}
      <Dialog open={isHostDetailDialogOpen} onOpenChange={setIsHostDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>主机详情</DialogTitle>
            <DialogDescription>
              查看主机的详细信息和组件状态
            </DialogDescription>
          </DialogHeader>
          {selectedHost && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">基本信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">主机名:</div>
                      <div className="font-medium">{selectedHost.name}</div>
                      <div className="text-muted-foreground">IP地址:</div>
                      <div className="font-medium">{selectedHost.ip}</div>
                      <div className="text-muted-foreground">域名:</div>
                      <div className="font-medium">{selectedHost.hostname}</div>
                      <div className="text-muted-foreground">分组:</div>
                      <div className="font-medium">{selectedHost.group}</div>
                      <div className="text-muted-foreground">位置:</div>
                      <div className="font-medium">{selectedHost.location}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">系统信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">操作系统:</div>
                      <div className="font-medium">{selectedHost.os}</div>
                      <div className="text-muted-foreground">版本:</div>
                      <div className="font-medium">{selectedHost.osVersion}</div>
                      <div className="text-muted-foreground">架构:</div>
                      <div className="font-medium">{selectedHost.arch}</div>
                      <div className="text-muted-foreground">最后在线:</div>
                      <div className="font-medium">{selectedHost.lastSeen}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">资源配置</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <Cpu className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">{selectedHost.cpuCores}</div>
                      <div className="text-sm text-muted-foreground">CPU 核心</div>
                    </div>
                    <div className="text-center">
                      <MemoryStick className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">{(selectedHost.memory / 1024).toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">内存 (GB)</div>
                    </div>
                    <div className="text-center">
                      <HardDrive className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold">{selectedHost.disk}</div>
                      <div className="text-sm text-muted-foreground">磁盘 (GB)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">已部署组件</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedHost.components.map((component, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Server className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">{component.name}</div>
                            <div className="text-sm text-muted-foreground">端口: {component.port}</div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(component.status)}>
                          {getStatusIcon(component.status)}
                          <span className="ml-1">
                            {component.status === "running" ? "运行中" : "已停止"}
                          </span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}