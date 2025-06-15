"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, CheckCircle, Clock, Search, Plus, Eye, MessageSquare, X, Bell } from "lucide-react"

interface Alert {
  id: string
  title: string
  description: string
  severity: "critical" | "high" | "medium" | "low" | "info"
  status: "active" | "acknowledged" | "resolved" | "suppressed"
  source: string
  timestamp: string
  category: string
  assignee?: string
}

export default function AlertsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  const alerts: Alert[] = [
    {
      id: "ALT-001",
      title: "High CPU Usage",
      description: "Router Core-Router-01 experiencing 95% CPU utilization for over 10 minutes",
      severity: "critical",
      status: "active",
      source: "Core-Router-01 (192.168.1.1)",
      timestamp: "2024-01-27 14:30:25",
      category: "Performance",
      assignee: "John Doe",
    },
    {
      id: "ALT-002",
      title: "Interface Down",
      description: "Port 24 on Switch-Floor-03 has been down for 15 minutes",
      severity: "high",
      status: "acknowledged",
      source: "Switch-Floor-03 (192.168.1.10)",
      timestamp: "2024-01-27 14:15:10",
      category: "Connectivity",
    },
    {
      id: "ALT-003",
      title: "Backup Completed",
      description: "Configuration backup for Firewall-Edge-01 completed successfully",
      severity: "info",
      status: "resolved",
      source: "Firewall-Edge-01 (10.0.0.1)",
      timestamp: "2024-01-27 13:45:00",
      category: "Maintenance",
    },
    {
      id: "ALT-004",
      title: "High Memory Usage",
      description: "Server-DB-01 memory utilization at 88%",
      severity: "medium",
      status: "active",
      source: "Server-DB-01 (192.168.100.10)",
      timestamp: "2024-01-27 13:20:45",
      category: "Performance",
    },
    {
      id: "ALT-005",
      title: "Authentication Failure",
      description: "Multiple failed login attempts detected from external IP",
      severity: "high",
      status: "active",
      source: "Firewall-Edge-01 (10.0.0.1)",
      timestamp: "2024-01-27 12:55:30",
      category: "Security",
    },
  ]

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: "destructive",
      high: "destructive",
      medium: "secondary",
      low: "outline",
      info: "default",
    } as const

    const colors = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
      info: "bg-gray-100 text-gray-800",
    } as const

    return <Badge className={colors[severity as keyof typeof colors]}>{severity.toUpperCase()}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-red-100 text-red-800",
      acknowledged: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      suppressed: "bg-gray-100 text-gray-800",
    } as const

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "low":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "info":
        return <CheckCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.source.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const alertStats = {
    total: alerts.length,
    active: alerts.filter((a) => a.status === "active").length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alert Management</h1>
          <p className="text-muted-foreground">Monitor and respond to network alerts and events</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Alert Rule</DialogTitle>
              <DialogDescription>Configure a new alert rule for monitoring</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rule-name" className="text-right">
                  Name
                </Label>
                <Input id="rule-name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="condition" className="text-right">
                  Condition
                </Label>
                <Input id="condition" placeholder="e.g., CPU > 90%" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="severity" className="text-right">
                  Severity
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline">Cancel</Button>
              <Button>Create Rule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.acknowledged}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="suppressed">Suppressed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts ({filteredAlerts.length})</CardTitle>
          <CardDescription>Current network alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div className="flex items-start space-x-2">
                      {getSeverityIcon(alert.severity)}
                      <div>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-muted-foreground">{alert.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                  <TableCell>{getStatusBadge(alert.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{alert.source.split(" ")[0]}</div>
                      <div className="text-muted-foreground">{alert.source.split(" ")[1]}</div>
                    </div>
                  </TableCell>
                  <TableCell>{alert.category}</TableCell>
                  <TableCell className="text-sm">{alert.timestamp}</TableCell>
                  <TableCell>{alert.assignee || "Unassigned"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(alert)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alert Detail Dialog */}
      {selectedAlert && (
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getSeverityIcon(selectedAlert.severity)}
                <span>{selectedAlert.title}</span>
              </DialogTitle>
              <DialogDescription>Alert ID: {selectedAlert.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1">{selectedAlert.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Severity</Label>
                  <div className="mt-1">{getSeverityBadge(selectedAlert.severity)}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedAlert.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source</Label>
                  <p className="text-sm mt-1">{selectedAlert.source}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="text-sm mt-1">{selectedAlert.category}</p>
                </div>
              </div>
              <div>
                <Label>Timestamp</Label>
                <p className="text-sm mt-1">{selectedAlert.timestamp}</p>
              </div>
              <div>
                <Label>Comments</Label>
                <Textarea placeholder="Add a comment..." className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline">Acknowledge</Button>
              <Button variant="outline">Suppress</Button>
              <Button>Resolve</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
