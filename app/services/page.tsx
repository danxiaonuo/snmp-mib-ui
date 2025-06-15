"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Server,
  Database,
  Globe,
  Shield,
  Mail,
  HardDrive,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"

interface Service {
  id: string
  name: string
  type: string
  host: string
  port: number
  status: "running" | "stopped" | "error" | "warning"
  uptime: string
  responseTime: number
  lastCheck: string
  description: string
  dependencies: string[]
  metrics: {
    cpu: number
    memory: number
    connections: number
    throughput: number
  }
}

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const services: Service[] = [
    {
      id: "web-server",
      name: "Web Server",
      type: "HTTP",
      host: "192.168.1.100",
      port: 80,
      status: "running",
      uptime: "15 days, 4 hours",
      responseTime: 45,
      lastCheck: "2024-01-27 15:30:00",
      description: "Main web server hosting company website",
      dependencies: ["database", "cache"],
      metrics: { cpu: 35, memory: 62, connections: 1247, throughput: 89 },
    },
    {
      id: "database",
      name: "MySQL Database",
      type: "Database",
      host: "192.168.1.101",
      port: 3306,
      status: "running",
      uptime: "23 days, 12 hours",
      responseTime: 12,
      lastCheck: "2024-01-27 15:29:45",
      description: "Primary MySQL database server",
      dependencies: [],
      metrics: { cpu: 78, memory: 85, connections: 156, throughput: 67 },
    },
    {
      id: "mail-server",
      name: "Mail Server",
      type: "SMTP",
      host: "192.168.1.102",
      port: 25,
      status: "warning",
      uptime: "8 days, 2 hours",
      responseTime: 234,
      lastCheck: "2024-01-27 15:28:30",
      description: "Corporate email server",
      dependencies: ["dns"],
      metrics: { cpu: 45, memory: 56, connections: 89, throughput: 23 },
    },
    {
      id: "dns-server",
      name: "DNS Server",
      type: "DNS",
      host: "192.168.1.103",
      port: 53,
      status: "running",
      uptime: "45 days, 8 hours",
      responseTime: 8,
      lastCheck: "2024-01-27 15:30:15",
      description: "Internal DNS resolution service",
      dependencies: [],
      metrics: { cpu: 12, memory: 23, connections: 2341, throughput: 95 },
    },
    {
      id: "file-server",
      name: "File Server",
      type: "SMB",
      host: "192.168.1.104",
      port: 445,
      status: "running",
      uptime: "67 days, 15 hours",
      responseTime: 67,
      lastCheck: "2024-01-27 15:27:20",
      description: "Network file sharing service",
      dependencies: ["authentication"],
      metrics: { cpu: 23, memory: 34, connections: 67, throughput: 78 },
    },
    {
      id: "backup-service",
      name: "Backup Service",
      type: "Backup",
      host: "192.168.1.105",
      port: 8080,
      status: "error",
      uptime: "0 days, 0 hours",
      responseTime: 0,
      lastCheck: "2024-01-27 15:25:10",
      description: "Automated backup and recovery service",
      dependencies: ["file-server"],
      metrics: { cpu: 0, memory: 0, connections: 0, throughput: 0 },
    },
  ]

  const getServiceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "http":
      case "https":
        return Globe
      case "database":
      case "mysql":
      case "postgresql":
        return Database
      case "smtp":
      case "mail":
        return Mail
      case "dns":
        return Server
      case "smb":
      case "file":
        return HardDrive
      case "backup":
        return Shield
      default:
        return Server
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-100 text-green-800">Running</Badge>
      case "stopped":
        return <Badge variant="secondary">Stopped</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "stopped":
        return <Clock className="h-4 w-4 text-gray-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getMetricColor = (value: number) => {
    if (value >= 80) return "text-red-500"
    if (value >= 60) return "text-yellow-500"
    return "text-green-500"
  }

  const filteredServices = services.filter((service) => {
    const matchesStatus = statusFilter === "all" || service.status === statusFilter
    const matchesType = typeFilter === "all" || service.type.toLowerCase() === typeFilter.toLowerCase()
    return matchesStatus && matchesType
  })

  const serviceStats = {
    total: services.length,
    running: services.filter((s) => s.status === "running").length,
    stopped: services.filter((s) => s.status === "stopped").length,
    error: services.filter((s) => s.status === "error").length,
    warning: services.filter((s) => s.status === "warning").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Server className="h-8 w-8" />
            Service Monitoring
          </h1>
          <p className="text-muted-foreground">Monitor and manage network services and applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>Configure a new service for monitoring</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="service-name" className="text-right">
                    Name
                  </Label>
                  <Input id="service-name" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="service-host" className="text-right">
                    Host
                  </Label>
                  <Input id="service-host" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="service-port" className="text-right">
                    Port
                  </Label>
                  <Input id="service-port" type="number" className="col-span-3" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Add Service</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Service Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.running}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.warning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stopped</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.stopped}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.error}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Service Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="stopped">Stopped</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="smtp">SMTP</SelectItem>
                    <SelectItem value="dns">DNS</SelectItem>
                    <SelectItem value="smb">SMB</SelectItem>
                    <SelectItem value="backup">Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Services Table */}
          <Card>
            <CardHeader>
              <CardTitle>Services ({filteredServices.length})</CardTitle>
              <CardDescription>Current status of all monitored services</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Host:Port</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Last Check</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(service.status)}
                          {(() => {
                            const Icon = getServiceIcon(service.type)
                            return <Icon className="h-4 w-4" />
                          })()}
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">{service.type}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {service.host}:{service.port}
                      </TableCell>
                      <TableCell>{getStatusBadge(service.status)}</TableCell>
                      <TableCell>{service.uptime}</TableCell>
                      <TableCell>{service.responseTime > 0 ? `${service.responseTime}ms` : "N/A"}</TableCell>
                      <TableCell className="text-sm">{service.lastCheck}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedService(service)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {service.status === "running" ? (
                            <Button variant="ghost" size="sm">
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Performance Metrics</CardTitle>
              <CardDescription>Real-time performance data for all services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredServices
                  .filter((service) => service.status === "running")
                  .map((service) => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        {(() => {
                          const Icon = getServiceIcon(service.type)
                          return <Icon className="h-5 w-5" />
                        })()}
                        <h4 className="font-medium">{service.name}</h4>
                        {getStatusBadge(service.status)}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>CPU Usage</span>
                            <span className={getMetricColor(service.metrics.cpu)}>{service.metrics.cpu}%</span>
                          </div>
                          <Progress value={service.metrics.cpu} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Memory Usage</span>
                            <span className={getMetricColor(service.metrics.memory)}>{service.metrics.memory}%</span>
                          </div>
                          <Progress value={service.metrics.memory} className="h-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Connections:</span>
                            <p className="font-medium">{service.metrics.connections}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Throughput:</span>
                            <p className="font-medium">{service.metrics.throughput}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Dependencies</CardTitle>
              <CardDescription>Service dependency mapping and health status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = getServiceIcon(service.type)
                          return <Icon className="h-5 w-5" />
                        })()}
                        <h4 className="font-medium">{service.name}</h4>
                        {getStatusBadge(service.status)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                    <div>
                      <span className="text-sm font-medium">Dependencies:</span>
                      {service.dependencies.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {service.dependencies.map((dep) => {
                            const depService = services.find((s) => s.id === dep)
                            return (
                              <div key={dep} className="flex items-center gap-1 text-sm">
                                {depService && getStatusIcon(depService.status)}
                                <Badge variant="outline">{dep}</Badge>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">No dependencies</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Detail Dialog */}
      {selectedService && (
        <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = getServiceIcon(selectedService.type)
                  return <Icon className="h-5 w-5" />
                })()}
                {selectedService.name}
              </DialogTitle>
              <DialogDescription>{selectedService.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedService.status)}</div>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="text-sm mt-1">{selectedService.type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Host</Label>
                  <p className="text-sm mt-1 font-mono">{selectedService.host}</p>
                </div>
                <div>
                  <Label>Port</Label>
                  <p className="text-sm mt-1 font-mono">{selectedService.port}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Uptime</Label>
                  <p className="text-sm mt-1">{selectedService.uptime}</p>
                </div>
                <div>
                  <Label>Response Time</Label>
                  <p className="text-sm mt-1">{selectedService.responseTime}ms</p>
                </div>
              </div>
              <div>
                <Label>Performance Metrics</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU</span>
                      <span>{selectedService.metrics.cpu}%</span>
                    </div>
                    <Progress value={selectedService.metrics.cpu} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory</span>
                      <span>{selectedService.metrics.memory}%</span>
                    </div>
                    <Progress value={selectedService.metrics.memory} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
              <Button variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart
              </Button>
              {selectedService.status === "running" ? (
                <Button variant="destructive">
                  <Pause className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
