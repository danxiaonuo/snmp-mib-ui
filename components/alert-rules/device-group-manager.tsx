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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, Edit, Trash2, Users, Tag, MapPin, Building, Layers, Settings, Bell, Eye, Copy, Move, Merge, Split, RefreshCw } from "lucide-react"
import { toast } from "sonner"

// 设备分组数据
const mockDeviceGroups = [
  {
    id: "1",
    name: "核心交换机",
    description: "数据中心核心交换机组，承载关键业务流量",
    deviceCount: 8,
    ruleCount: 15,
    location: "机房A",
    floor: "B1",
    businessLine: "核心网络",
    importance: "critical",
    tags: ["核心", "关键业务", "7x24"],
    devices: [
      { id: "1", name: "Core-SW-01", ip: "192.168.1.1", vendor: "华为", model: "S12700", status: "online" },
      { id: "2", name: "Core-SW-02", ip: "192.168.1.2", vendor: "华为", model: "S12700", status: "online" },
      { id: "3", name: "Core-SW-03", ip: "192.168.1.3", vendor: "思科", model: "Nexus 9000", status: "online" },
      { id: "4", name: "Core-SW-04", ip: "192.168.1.4", vendor: "思科", model: "Nexus 9000", status: "offline" }
    ],
    createdAt: "2024-01-10",
    updatedAt: "2024-01-15"
  },
  {
    id: "2",
    name: "接入交换机",
    description: "楼层接入交换机组，连接终端用户设备",
    deviceCount: 45,
    ruleCount: 32,
    location: "各楼层",
    floor: "1F-10F",
    businessLine: "办公网络",
    importance: "normal",
    tags: ["接入", "办公区域", "用户接入"],
    devices: [],
    createdAt: "2024-01-08",
    updatedAt: "2024-01-14"
  },
  {
    id: "3",
    name: "汇聚交换机",
    description: "楼层汇聚交换机组，连接接入层和核心层",
    deviceCount: 12,
    ruleCount: 18,
    location: "机房B",
    floor: "B1",
    businessLine: "汇聚网络",
    importance: "high",
    tags: ["汇聚", "中间层", "流量汇聚"],
    devices: [],
    createdAt: "2024-01-12",
    updatedAt: "2024-01-13"
  }
]

const mockAvailableDevices = [
  { id: "5", name: "Access-SW-01", ip: "192.168.2.1", vendor: "H3C", model: "S5130", status: "online", group: null },
  { id: "6", name: "Access-SW-02", ip: "192.168.2.2", vendor: "H3C", model: "S5130", status: "online", group: null },
  { id: "7", name: "Agg-SW-01", ip: "192.168.3.1", vendor: "华为", model: "S6720", status: "online", group: null },
  { id: "8", name: "Agg-SW-02", ip: "192.168.3.2", vendor: "华为", model: "S6720", status: "offline", group: null }
]

const IMPORTANCE_LEVELS = [
  { value: "critical", label: "关键", color: "bg-red-500" },
  { value: "high", label: "重要", color: "bg-orange-500" },
  { value: "normal", label: "普通", color: "bg-blue-500" },
  { value: "low", label: "低", color: "bg-gray-500" }
]

const BUSINESS_LINES = [
  "核心网络", "办公网络", "汇聚网络", "存储网络", "管理网络", "DMZ网络"
]

const LOCATIONS = [
  "机房A", "机房B", "机房C", "各楼层", "数据中心", "分支机构"
]

interface DeviceGroupManagerProps {
  onGroupChange?: (groups: any[]) => void
}

export function DeviceGroupManager({ onGroupChange }: DeviceGroupManagerProps) {
  const [groups, setGroups] = useState(mockDeviceGroups)
  const [availableDevices, setAvailableDevices] = useState(mockAvailableDevices)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterImportance, setFilterImportance] = useState("all")
  const [filterLocation, setFilterLocation] = useState("all")
  const [showGroupEditor, setShowGroupEditor] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [showDeviceManager, setShowDeviceManager] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [showTagEditor, setShowTagEditor] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // 过滤分组
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesImportance = filterImportance === "all" || group.importance === filterImportance
    const matchesLocation = filterLocation === "all" || group.location === filterLocation
    
    return matchesSearch && matchesImportance && matchesLocation
  })

  // 创建或更新分组
  const saveGroup = (groupData: any) => {
    if (editingGroup) {
      setGroups(prev => prev.map(g => 
        g.id === editingGroup.id 
          ? { ...g, ...groupData, updatedAt: new Date().toISOString().split('T')[0] }
          : g
      ))
      toast.success("分组更新成功")
    } else {
      const newGroup = {
        ...groupData,
        id: Date.now().toString(),
        deviceCount: 0,
        ruleCount: 0,
        devices: [],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      }
      setGroups(prev => [newGroup, ...prev])
      toast.success("分组创建成功")
    }
    setShowGroupEditor(false)
    setEditingGroup(null)
    onGroupChange?.(groups)
  }

  // 删除分组
  const deleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (group && group.devices.length > 0) {
      toast.error("请先移除分组中的所有设备")
      return
    }
    setGroups(prev => prev.filter(g => g.id !== groupId))
    toast.success("分组删除成功")
    onGroupChange?.(groups)
  }

  // 批量操作
  const handleBatchOperation = (operation: string) => {
    if (selectedGroups.length === 0) {
      toast.error("请先选择要操作的分组")
      return
    }
    
    switch (operation) {
      case "delete":
        const hasDevices = groups.some(g => selectedGroups.includes(g.id) && g.devices.length > 0)
        if (hasDevices) {
          toast.error("部分分组包含设备，无法删除")
          return
        }
        setGroups(prev => prev.filter(g => !selectedGroups.includes(g.id)))
        toast.success(`已删除 ${selectedGroups.length} 个分组`)
        break
      case "export":
        toast.success(`已导出 ${selectedGroups.length} 个分组配置`)
        break
      case "merge":
        if (selectedGroups.length < 2) {
          toast.error("至少选择两个分组进行合并")
          return
        }
        toast.success(`已合并 ${selectedGroups.length} 个分组`)
        break
    }
    setSelectedGroups([])
  }

  // 打开设备管理器
  const openDeviceManager = (group: any) => {
    setSelectedGroup(group)
    setShowDeviceManager(true)
  }

  // 添加设备到分组
  const addDevicesToGroup = (groupId: string, deviceIds: string[]) => {
    const devicesToAdd = availableDevices.filter(d => deviceIds.includes(d.id))
    setGroups(prev => prev.map(g => 
      g.id === groupId 
        ? { 
            ...g, 
            devices: [...g.devices, ...devicesToAdd],
            deviceCount: g.deviceCount + devicesToAdd.length
          }
        : g
    ))
    setAvailableDevices(prev => prev.filter(d => !deviceIds.includes(d.id)))
    toast.success(`已添加 ${devicesToAdd.length} 台设备到分组`)
  }

  // 从分组移除设备
  const removeDevicesFromGroup = (groupId: string, deviceIds: string[]) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    
    const devicesToRemove = group.devices.filter((d: any) => deviceIds.includes(d.id))
    setGroups(prev => prev.map(g => 
      g.id === groupId 
        ? { 
            ...g, 
            devices: g.devices.filter((d: any) => !deviceIds.includes(d.id)),
            deviceCount: g.deviceCount - devicesToRemove.length
          }
        : g
    ))
    setAvailableDevices(prev => [...prev, ...devicesToRemove])
    toast.success(`已从分组移除 ${devicesToRemove.length} 台设备`)
  }

  // 自动发现设备
  const autoDiscoverDevices = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "正在扫描网络设备...",
        success: "发现了 5 台新设备，已添加到可用设备列表",
        error: "设备发现失败"
      }
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">分组概览</TabsTrigger>
          <TabsTrigger value="devices">设备管理</TabsTrigger>
          <TabsTrigger value="tags">标签管理</TabsTrigger>
          <TabsTrigger value="discovery">设备发现</TabsTrigger>
        </TabsList>

        {/* 分组概览 */}
        <TabsContent value="overview" className="space-y-4">
          {/* 工具栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索分组..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={filterImportance} onValueChange={setFilterImportance}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="重要性" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {IMPORTANCE_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${level.color}`} />
                        {level.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="位置" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部位置</SelectItem>
                  {LOCATIONS.map(location => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={autoDiscoverDevices}>
                <RefreshCw className="mr-2 h-4 w-4" />
                发现设备
              </Button>
              <Button onClick={() => {
                setEditingGroup(null)
                setShowGroupEditor(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                新建分组
              </Button>
            </div>
          </div>

          {/* 批量操作 */}
          {selectedGroups.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedGroups.length} 个分组
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Button size="sm" variant="outline" onClick={() => handleBatchOperation("merge")}>
                <Merge className="mr-1 h-3 w-3" />
                合并分组
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBatchOperation("export")}>
                <Copy className="mr-1 h-3 w-3" />
                导出配置
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBatchOperation("delete")}>
                <Trash2 className="mr-1 h-3 w-3" />
                批量删除
              </Button>
            </div>
          )}

          {/* 分组网格 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.map((group) => {
              const importanceInfo = IMPORTANCE_LEVELS.find(l => l.value === group.importance)
              
              return (
                <Card key={group.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedGroups([...selectedGroups, group.id])
                            } else {
                              setSelectedGroups(selectedGroups.filter(id => id !== group.id))
                            }
                          }}
                        />
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{group.name}</span>
                          </CardTitle>
                          <CardDescription>{group.description}</CardDescription>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${importanceInfo?.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{group.deviceCount}</div>
                          <div className="text-sm text-muted-foreground">设备数量</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{group.ruleCount}</div>
                          <div className="text-sm text-muted-foreground">告警规则</div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">位置:</span>
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-3 w-3" />
                            <span>{group.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">楼层:</span>
                          <div className="flex items-center">
                            <Building className="mr-1 h-3 w-3" />
                            <span>{group.floor}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">业务线:</span>
                          <span>{group.businessLine}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">重要性:</span>
                          <Badge variant="outline">
                            <div className={`w-2 h-2 rounded-full mr-1 ${importanceInfo?.color}`} />
                            {importanceInfo?.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {group.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="mr-1 h-2 w-2" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => openDeviceManager(group)}
                        >
                          <Settings className="mr-1 h-3 w-3" />
                          管理设备
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                        >
                          <Bell className="mr-1 h-3 w-3" />
                          配置规则
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingGroup(group)
                            setShowGroupEditor(true)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteGroup(group.id)}
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
        </TabsContent>

        {/* 设备管理 */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>设备分配管理</CardTitle>
              <CardDescription>管理设备在分组中的分配和移动</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* 已分组设备 */}
                <div>
                  <h3 className="text-lg font-medium mb-3">已分组设备</h3>
                  <ScrollArea className="h-64 border rounded-lg p-4">
                    {groups.map(group => (
                      <div key={group.id} className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{group.name}</span>
                          <Badge variant="outline">{group.devices.length}台</Badge>
                        </div>
                        <div className="space-y-1">
                          {group.devices.map((device: any) => (
                            <div key={device.id} className="flex items-center justify-between p-2 border rounded text-sm">
                              <div>
                                <span className="font-medium">{device.name}</span>
                                <span className="text-muted-foreground ml-2">({device.ip})</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={device.status === 'online' ? 'secondary' : 'destructive'}>
                                  {device.status === 'online' ? '在线' : '离线'}
                                </Badge>
                                <Button size="sm" variant="ghost">
                                  <Move className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                
                {/* 未分组设备 */}
                <div>
                  <h3 className="text-lg font-medium mb-3">未分组设备</h3>
                  <ScrollArea className="h-64 border rounded-lg p-4">
                    <div className="space-y-2">
                      {availableDevices.map(device => (
                        <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">{device.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {device.ip} - {device.vendor} {device.model}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={device.status === 'online' ? 'secondary' : 'destructive'}>
                              {device.status === 'online' ? '在线' : '离线'}
                            </Badge>
                            <Select>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="选择分组" />
                              </SelectTrigger>
                              <SelectContent>
                                {groups.map(group => (
                                  <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 标签管理 */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>标签管理</CardTitle>
              <CardDescription>管理设备分组的标签系统</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input placeholder="添加新标签..." className="flex-1" />
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    添加标签
                  </Button>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h4 className="font-medium mb-2">位置标签</h4>
                    <div className="flex flex-wrap gap-1">
                      {["机房A", "机房B", "1F", "2F", "B1"].map(tag => (
                        <Badge key={tag} variant="outline" className="cursor-pointer">
                          <MapPin className="mr-1 h-2 w-2" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">设备类型</h4>
                    <div className="flex flex-wrap gap-1">
                      {["核心", "汇聚", "接入", "服务器"].map(tag => (
                        <Badge key={tag} variant="outline" className="cursor-pointer">
                          <Layers className="mr-1 h-2 w-2" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">业务标签</h4>
                    <div className="flex flex-wrap gap-1">
                      {["关键业务", "办公网络", "存储网络", "管理网络"].map(tag => (
                        <Badge key={tag} variant="outline" className="cursor-pointer">
                          <Tag className="mr-1 h-2 w-2" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 设备发现 */}
        <TabsContent value="discovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>自动设备发现</CardTitle>
              <CardDescription>自动发现网络中的设备并智能分组</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>扫描网段</Label>
                    <Input placeholder="192.168.1.0/24" />
                  </div>
                  <div>
                    <Label>SNMP Community</Label>
                    <Input placeholder="public" type="password" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button onClick={autoDiscoverDevices}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    开始扫描
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-group" />
                    <Label htmlFor="auto-group">自动分组</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-rules" />
                    <Label htmlFor="auto-rules">自动创建规则</Label>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">发现历史</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">发现 5 台新设备</div>
                        <div className="text-sm text-muted-foreground">2024-01-15 14:30:00</div>
                      </div>
                      <Badge variant="secondary">已处理</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">网段扫描完成</div>
                        <div className="text-sm text-muted-foreground">2024-01-15 14:25:00</div>
                      </div>
                      <Badge variant="secondary">成功</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 分组编辑器对话框 */}
      <Dialog open={showGroupEditor} onOpenChange={setShowGroupEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "编辑分组" : "新建分组"}
            </DialogTitle>
            <DialogDescription>
              配置设备分组的基本信息和标签
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>分组名称</Label>
                <Input defaultValue={editingGroup?.name} placeholder="输入分组名称" />
              </div>
              <div>
                <Label>重要性级别</Label>
                <Select defaultValue={editingGroup?.importance}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择重要性" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPORTANCE_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${level.color}`} />
                          {level.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>描述</Label>
              <Textarea defaultValue={editingGroup?.description} placeholder="输入分组描述" />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>位置</Label>
                <Select defaultValue={editingGroup?.location}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择位置" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>楼层</Label>
                <Input defaultValue={editingGroup?.floor} placeholder="如: B1, 1F" />
              </div>
              <div>
                <Label>业务线</Label>
                <Select defaultValue={editingGroup?.businessLine}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择业务线" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_LINES.map(line => (
                      <SelectItem key={line} value={line}>
                        {line}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>标签</Label>
              <Input placeholder="输入标签，用逗号分隔" />
            </div>
            
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowGroupEditor(false)}>
                取消
              </Button>
              <Button onClick={() => saveGroup({})}>
                {editingGroup ? "更新分组" : "创建分组"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 设备管理器对话框 */}
      <Dialog open={showDeviceManager} onOpenChange={setShowDeviceManager}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>管理分组设备 - {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              添加或移除分组中的设备
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* 分组内设备 */}
              <div>
                <h4 className="font-medium mb-2">分组内设备 ({selectedGroup?.devices?.length || 0}台)</h4>
                <ScrollArea className="h-64 border rounded-lg p-4">
                  <div className="space-y-2">
                    {selectedGroup?.devices?.map((device: any) => (
                      <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {device.ip} - {device.vendor} {device.model}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          移除
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              {/* 可用设备 */}
              <div>
                <h4 className="font-medium mb-2">可用设备 ({availableDevices.length}台)</h4>
                <ScrollArea className="h-64 border rounded-lg p-4">
                  <div className="space-y-2">
                    {availableDevices.map(device => (
                      <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {device.ip} - {device.vendor} {device.model}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          添加
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeviceManager(false)}>
                关闭
              </Button>
              <Button>
                保存更改
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}