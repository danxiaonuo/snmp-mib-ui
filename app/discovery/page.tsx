"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/real-api-client"
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

export default function DiscoveryPage() {
  // 状态管理
  const [discoveryTasks, setDiscoveryTasks] = useState([])
  const [hosts, setHosts] = useState([])
  const [credentials, setCredentials] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // UI状态
  const [activeTab, setActiveTab] = useState("tasks")
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [isCreateCredentialOpen, setIsCreateCredentialOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // 真实API数据获取函数
  const fetchDiscoveryTasks = async () => {
    try {
      setIsLoading(true)
      // 这里调用真实API
      // const response = await apiClient.getDiscoveryTasks()
      // setDiscoveryTasks(response.tasks || [])
    } catch (error) {
      console.error('Failed to fetch discovery tasks:', error)
      toast.error('Failed to load discovery tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHosts = async () => {
    try {
      const response = await apiClient.getHosts()
      setHosts(response.hosts || [])
    } catch (error) {
      console.error('Failed to fetch hosts:', error)
      toast.error('Failed to load hosts')
    }
  }

  // 初始加载
  useEffect(() => {
    fetchDiscoveryTasks()
    fetchHosts()
  }, [])

  // 创建发现任务
  const handleCreateTask = async (taskData: any) => {
    try {
      // await apiClient.createDiscoveryTask(taskData)
      toast.success('Discovery task created successfully')
      setIsCreateTaskOpen(false)
      fetchDiscoveryTasks()
    } catch (error) {
      console.error('Failed to create discovery task:', error)
      toast.error('Failed to create discovery task')
    }
  }

  // 启动发现任务
  const handleStartTask = async (taskId: string) => {
    try {
      // await apiClient.startDiscoveryTask(taskId)
      toast.success('Discovery task started')
      fetchDiscoveryTasks()
    } catch (error) {
      console.error('Failed to start discovery task:', error)
      toast.error('Failed to start discovery task')
    }
  }

  // 停止发现任务
  const handleStopTask = async (taskId: string) => {
    try {
      // await apiClient.stopDiscoveryTask(taskId)
      toast.success('Discovery task stopped')
      fetchDiscoveryTasks()
    } catch (error) {
      console.error('Failed to stop discovery task:', error)
      toast.error('Failed to stop discovery task')
    }
  }

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  // 过滤数据
  const filteredHosts = hosts.filter((host: any) =>
    host.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    host.ip?.includes(searchTerm) ||
    host.hostname?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Discovery</h1>
          <p className="text-muted-foreground">
            Discover and manage network hosts and devices
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchDiscoveryTasks} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Discovery
          </Button>
        </div>
      </div>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tasks">Discovery Tasks</TabsTrigger>
          <TabsTrigger value="hosts">Discovered Hosts</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
        </TabsList>

        {/* 发现任务标签页 */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discovery Tasks</CardTitle>
              <CardDescription>
                Network discovery and scanning tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Loading discovery tasks...
                </div>
              ) : discoveryTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No discovery tasks found</p>
                  <Button className="mt-4" onClick={() => setIsCreateTaskOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {discoveryTasks.map((task: any) => (
                    <Card key={task.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-medium">{task.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              IP Range: {task.ipRange} | Ports: {task.ports}
                            </p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span>Found: {task.foundHosts}/{task.totalHosts}</span>
                              <span>Online: {task.onlineHosts}</span>
                              {task.startedAt && (
                                <span>Started: {task.startedAt}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(task.status)}
                            {task.status === 'running' ? (
                              <Button size="sm" variant="outline" onClick={() => handleStopTask(task.id)}>
                                <Pause className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleStartTask(task.id)}>
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {task.status === 'running' && (
                          <div className="mt-4">
                            <Progress value={task.progress} className="w-full" />
                            <p className="text-sm text-muted-foreground mt-1">
                              Progress: {task.progress}%
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 发现的主机标签页 */}
        <TabsContent value="hosts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Discovered Hosts</CardTitle>
                  <CardDescription>
                    Hosts found through network discovery
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search hosts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Host</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resources</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHosts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No hosts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHosts.map((host: any) => (
                        <TableRow key={host.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Server className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{host.name}</div>
                                <div className="text-sm text-muted-foreground">{host.hostname}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{host.ip}</TableCell>
                          <TableCell>
                            <div>
                              <div>{host.os}</div>
                              <div className="text-sm text-muted-foreground">{host.osVersion}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={host.status === 'online' ? 'default' : 'secondary'}>
                              {host.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center space-x-1">
                                <Cpu className="h-3 w-3" />
                                <span>{host.cpuCores} cores</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MemoryStick className="h-3 w-3" />
                                <span>{host.memory}MB</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <HardDrive className="h-3 w-3" />
                                <span>{host.disk}GB</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{host.lastSeen}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 凭据标签页 */}
        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SSH Credentials</CardTitle>
                  <CardDescription>
                    Manage SSH credentials for host access
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCreateCredentialOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Credential
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Credentials will be loaded from API</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 创建发现任务对话框 */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Discovery Task</DialogTitle>
            <DialogDescription>
              Configure network discovery parameters
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Task Name</Label>
              <Input placeholder="Enter task name" className="mt-1" />
            </div>
            <div>
              <Label>IP Range</Label>
              <Input 
                placeholder="192.168.1.0/24 or 192.168.1.1-192.168.1.100" 
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Ports to Scan</Label>
              <Input 
                placeholder="22,80,443,9100" 
                className="mt-1" 
              />
            </div>
            <div>
              <Label>SSH Credentials (Optional)</Label>
              <div className="space-y-2 mt-1">
                <Input placeholder="SSH Username" />
                <Input type="password" placeholder="SSH Password" />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateTask({})}>
              Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 创建凭据对话框 */}
      <Dialog open={isCreateCredentialOpen} onOpenChange={setIsCreateCredentialOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add SSH Credential</DialogTitle>
            <DialogDescription>
              Add SSH credentials for host access
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Credential Name</Label>
              <Input placeholder="Enter credential name" className="mt-1" />
            </div>
            <div>
              <Label>Username</Label>
              <Input placeholder="SSH Username" className="mt-1" />
            </div>
            <div>
              <Label>Authentication Method</Label>
              <Select defaultValue="password">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="password">Password</SelectItem>
                  <SelectItem value="key">SSH Key</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" placeholder="SSH Password" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Credential description" className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateCredentialOpen(false)}>
              Cancel
            </Button>
            <Button>
              Add Credential
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}