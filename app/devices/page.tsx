"use client"

import { useState } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { useGlobalShortcuts, usePageShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { AutoRefreshIndicator } from "@/components/enhanced-ui/auto-refresh-indicator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit, Trash2, Eye, WifiIcon, Router, Server, Shield, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Device {
  id: string
  name: string
  type: string
  ip: string
  status: "online" | "offline" | "warning"
  location: string
  model: string
  uptime: string
  lastSeen: string
}

export default function DevicesPage() {
  // 使用持久化存储
  const [searchTerm, setSearchTerm] = useLocalStorage("devices-search", "")
  const [statusFilter, setStatusFilter] = useLocalStorage("devices-status-filter", "all")
  const [typeFilter, setTypeFilter] = useLocalStorage("devices-type-filter", "all")
  const [selectedDevices, setSelectedDevices] = useLocalStorage<string[]>("devices-selected", [])
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [newDevice, setNewDevice] = useState<Partial<Device>>({
    name: "",
    type: "router",
    ip: "",
    location: "",
    model: ""
  })

  // 启用快捷键
  useGlobalShortcuts()
  usePageShortcuts('devices')

  // 模拟数据获取函数
  const fetchDevices = async () => {
    // 这里可以替换为真实的API调用
    console.log('刷新设备列表...')
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // 自动刷新
  const {
    isRefreshing,
    lastRefresh,
    retryCount,
    currentInterval,
    manualRefresh,
    pause,
    resume
  } = useAutoRefresh(fetchDevices, {
    interval: 30000, // 30秒刷新一次
    enabled: true
  })

  const [devices, setDevices] = useState<Device[]>([
    {
      id: "1",
      name: "Core-Router-01",
      type: "router",
      ip: "192.168.1.1",
      status: "online",
      location: "Data Center",
      model: "Cisco ISR4321",
      uptime: "45 days",
      lastSeen: "Now",
    },
    {
      id: "2",
      name: "Switch-Floor-03",
      type: "switch",
      ip: "192.168.1.10",
      status: "warning",
      location: "Floor 3",
      model: "HP Aruba 2930F",
      uptime: "23 days",
      lastSeen: "2 min ago",
    },
    {
      id: "3",
      name: "Firewall-Edge-01",
      type: "firewall",
      ip: "10.0.0.1",
      status: "online",
      location: "Edge",
      model: "Fortinet FortiGate",
      uptime: "67 days",
      lastSeen: "Now",
    },
    {
      id: "4",
      name: "AP-Lobby-05",
      type: "access_point",
      ip: "192.168.2.5",
      status: "offline",
      location: "Lobby",
      model: "Ubiquiti UniFi",
      uptime: "0 days",
      lastSeen: "1 hour ago",
    },
    {
      id: "5",
      name: "Server-DB-01",
      type: "server",
      ip: "192.168.100.10",
      status: "online",
      location: "Data Center",
      model: "Dell PowerEdge R740",
      uptime: "89 days",
      lastSeen: "Now",
    },
  ]

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "router":
        return <Router className="h-4 w-4" />
      case "switch":
        return <WifiIcon className="h-4 w-4" />
      case "firewall":
        return <Shield className="h-4 w-4" />
      case "server":
        return <Server className="h-4 w-4" />
      case "access_point":
        return <WifiIcon className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800">Online</Badge>
      case "offline":
        return <Badge variant="destructive">Offline</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  })

  // 添加设备
  const handleAddDevice = () => {
    if (!newDevice.name || !newDevice.ip) {
      toast.error("请填写设备名称和IP地址")
      return
    }

    const device: Device = {
      id: Date.now().toString(),
      name: newDevice.name!,
      type: newDevice.type!,
      ip: newDevice.ip!,
      location: newDevice.location || "",
      model: newDevice.model || "",
      status: "online",
      uptime: "0 days",
      lastSeen: "刚刚"
    }

    setDevices([...devices, device])
    setIsAddDialogOpen(false)
    setNewDevice({
      name: "",
      type: "router",
      ip: "",
      location: "",
      model: ""
    })
    toast.success("设备添加成功")
  }

  // 编辑设备
  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device)
    setNewDevice(device)
    setIsEditDialogOpen(true)
  }

  // 更新设备
  const handleUpdateDevice = () => {
    if (!newDevice.name || !newDevice.ip) {
      toast.error("请填写设备名称和IP地址")
      return
    }

    setDevices(devices.map(device => 
      device.id === selectedDevice?.id 
        ? { ...device, ...newDevice } as Device
        : device
    ))
    setIsEditDialogOpen(false)
    setSelectedDevice(null)
    setNewDevice({
      name: "",
      type: "router",
      ip: "",
      location: "",
      model: ""
    })
    toast.success("设备更新成功")
  }

  // 删除设备
  const handleDeleteDevice = (device: Device) => {
    setSelectedDevice(device)
    setIsDeleteDialogOpen(true)
  }

  // 确认删除设备
  const confirmDeleteDevice = () => {
    if (selectedDevice) {
      setDevices(devices.filter(device => device.id !== selectedDevice.id))
      setIsDeleteDialogOpen(false)
      setSelectedDevice(null)
      toast.success("设备删除成功")
    }
  }

  // 测试设备连接
  const handleTestConnection = async (device: Device) => {
    toast.loading("正在测试连接...")
    
    // 模拟连接测试
    setTimeout(() => {
      const success = Math.random() > 0.3 // 70%成功率
      if (success) {
        toast.success(`${device.name} 连接测试成功`)
        // 更新设备状态
        setDevices(devices.map(d => 
          d.id === device.id 
            ? { ...d, status: "online", lastSeen: "刚刚" }
            : d
        ))
      } else {
        toast.error(`${device.name} 连接测试失败`)
        setDevices(devices.map(d => 
          d.id === device.id 
            ? { ...d, status: "offline" }
            : d
        ))
      }
    }, 2000)
  }

  // 刷新设备状态
  const handleRefreshDevices = () => {
    toast.success("设备状态已刷新")
    // 模拟状态更新
    setDevices(devices.map(device => ({
      ...device,
      lastSeen: Math.random() > 0.5 ? "刚刚" : `${Math.floor(Math.random() * 10) + 1} 分钟前`
    })))
  }

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.ip.includes(searchTerm) ||
      device.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || device.status === statusFilter
    const matchesType = typeFilter === "all" || device.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Device Management</h1>
          <p className="text-muted-foreground">Monitor and manage your network devices</p>
        </div>
        <div className="flex items-center space-x-2">
          <AutoRefreshIndicator
            isRefreshing={isRefreshing}
            lastRefresh={lastRefresh}
            retryCount={retryCount}
            currentInterval={currentInterval}
            onManualRefresh={manualRefresh}
            onPause={pause}
            onResume={resume}
          />
          <Button 
            variant="outline" 
            onClick={handleRefreshDevices}
            data-shortcut="refresh"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新状态
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-shortcut="new">
                <Plus className="mr-2 h-4 w-4" />
                添加设备
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新设备</DialogTitle>
              <DialogDescription>配置新的网络设备进行监控</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  设备名称
                </Label>
                <Input 
                  id="name" 
                  className="col-span-3" 
                  value={newDevice.name || ""}
                  onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                  placeholder="输入设备名称"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ip" className="text-right">
                  IP地址
                </Label>
                <Input 
                  id="ip" 
                  className="col-span-3" 
                  value={newDevice.ip || ""}
                  onChange={(e) => setNewDevice({...newDevice, ip: e.target.value})}
                  placeholder="192.168.1.1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  设备类型
                </Label>
                <Select value={newDevice.type} onValueChange={(value) => setNewDevice({...newDevice, type: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择设备类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="router">路由器</SelectItem>
                    <SelectItem value="switch">交换机</SelectItem>
                    <SelectItem value="firewall">防火墙</SelectItem>
                    <SelectItem value="server">服务器</SelectItem>
                    <SelectItem value="access_point">接入点</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  位置
                </Label>
                <Input 
                  id="location" 
                  className="col-span-3" 
                  value={newDevice.location || ""}
                  onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
                  placeholder="数据中心A"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  型号
                </Label>
                <Input 
                  id="model" 
                  className="col-span-3" 
                  value={newDevice.model || ""}
                  onChange={(e) => setNewDevice({...newDevice, model: e.target.value})}
                  placeholder="Cisco ISR4321"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
              <Button onClick={handleAddDevice}>添加设备</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="router">Router</SelectItem>
                <SelectItem value="switch">Switch</SelectItem>
                <SelectItem value="firewall">Firewall</SelectItem>
                <SelectItem value="server">Server</SelectItem>
                <SelectItem value="access_point">Access Point</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Device Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.filter((d) => d.status === "online").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.filter((d) => d.status === "warning").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <div className="h-2 w-2 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.filter((d) => d.status === "offline").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Device Table */}
      <Card>
        <CardHeader>
          <CardTitle>Devices ({filteredDevices.length})</CardTitle>
          <CardDescription>Overview of all network devices</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {getDeviceIcon(device.type)}
                      <div>
                        <div>{device.name}</div>
                        <div className="text-sm text-muted-foreground">{device.model}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{device.type.replace("_", " ")}</TableCell>
                  <TableCell>{device.ip}</TableCell>
                  <TableCell>{getStatusBadge(device.status)}</TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell>{device.uptime}</TableCell>
                  <TableCell>{device.lastSeen}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleTestConnection(device)} title="测试连接">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditDevice(device)} title="编辑设备">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDevice(device)} title="删除设备">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 编辑设备对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑设备</DialogTitle>
            <DialogDescription>修改设备信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">设备名称</Label>
              <Input 
                id="edit-name" 
                className="col-span-3" 
                value={newDevice.name || ""}
                onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-ip" className="text-right">IP地址</Label>
              <Input 
                id="edit-ip" 
                className="col-span-3" 
                value={newDevice.ip || ""}
                onChange={(e) => setNewDevice({...newDevice, ip: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">设备类型</Label>
              <Select value={newDevice.type} onValueChange={(value) => setNewDevice({...newDevice, type: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="router">路由器</SelectItem>
                  <SelectItem value="switch">交换机</SelectItem>
                  <SelectItem value="firewall">防火墙</SelectItem>
                  <SelectItem value="server">服务器</SelectItem>
                  <SelectItem value="access_point">接入点</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-location" className="text-right">位置</Label>
              <Input 
                id="edit-location" 
                className="col-span-3" 
                value={newDevice.location || ""}
                onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-model" className="text-right">型号</Label>
              <Input 
                id="edit-model" 
                className="col-span-3" 
                value={newDevice.model || ""}
                onChange={(e) => setNewDevice({...newDevice, model: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleUpdateDevice}>更新设备</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除设备 "{selectedDevice?.name}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={confirmDeleteDevice}>删除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
