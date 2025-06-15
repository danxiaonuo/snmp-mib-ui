"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Filter,
  Plus,
  Play,
  RotateCcw,
  Download,
  Upload,
  HardDrive,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"

export default function BackupPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const backups = [
    {
      id: 1,
      name: "Daily Config Backup",
      type: "Configuration",
      device: "All Routers",
      schedule: "Daily 2:00 AM",
      lastRun: "2024-01-15 02:00",
      status: "Success",
      size: "2.3 MB",
      retention: "30 days",
    },
    {
      id: 2,
      name: "Weekly Full Backup",
      type: "Full System",
      device: "Core Switches",
      schedule: "Weekly Sunday",
      lastRun: "2024-01-14 03:00",
      status: "Success",
      size: "156 MB",
      retention: "90 days",
    },
    {
      id: 3,
      name: "Firewall Rules Backup",
      type: "Security",
      device: "Firewalls",
      schedule: "Daily 1:00 AM",
      lastRun: "2024-01-15 01:00",
      status: "Failed",
      size: "0 MB",
      retention: "60 days",
    },
    {
      id: 4,
      name: "Database Backup",
      type: "Database",
      device: "DB Servers",
      schedule: "Every 6 hours",
      lastRun: "2024-01-15 06:00",
      status: "Running",
      size: "1.2 GB",
      retention: "180 days",
    },
    {
      id: 5,
      name: "Log Archive",
      type: "Logs",
      device: "All Devices",
      schedule: "Daily 4:00 AM",
      lastRun: "2024-01-15 04:00",
      status: "Success",
      size: "45 MB",
      retention: "365 days",
    },
  ]

  const restorePoints = [
    {
      id: 1,
      timestamp: "2024-01-15 02:00:00",
      type: "Configuration",
      device: "Router-01",
      size: "1.2 MB",
      verified: true,
    },
    {
      id: 2,
      timestamp: "2024-01-14 02:00:00",
      type: "Configuration",
      device: "Router-01",
      size: "1.1 MB",
      verified: true,
    },
    {
      id: 3,
      timestamp: "2024-01-13 02:00:00",
      type: "Configuration",
      device: "Router-01",
      size: "1.1 MB",
      verified: true,
    },
    {
      id: 4,
      timestamp: "2024-01-12 02:00:00",
      type: "Configuration",
      device: "Router-01",
      size: "1.0 MB",
      verified: false,
    },
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      Success: "default",
      Failed: "destructive",
      Running: "secondary",
      Scheduled: "outline",
    } as const
    return <Badge variant={variants[status as keyof typeof variants] || "default"}>{status}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "Failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "Running":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Backup & Restore</h1>
          <p className="text-muted-foreground mt-2">Manage system backups and restore operations</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Restore
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restore from Backup</DialogTitle>
                <DialogDescription>Select a backup point to restore from</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="device">Target Device</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="router-01">Router-01</SelectItem>
                      <SelectItem value="switch-01">Switch-01</SelectItem>
                      <SelectItem value="firewall-01">Firewall-01</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Available Restore Points</Label>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {restorePoints.map((point) => (
                      <div
                        key={point.id}
                        className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                      >
                        <div>
                          <div className="font-medium">{point.timestamp}</div>
                          <div className="text-sm text-muted-foreground">
                            {point.type} - {point.size}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {point.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Start Restore</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Backup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Backup Job</DialogTitle>
                <DialogDescription>Configure a new backup job</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="backup-name" className="text-right">
                    Name
                  </Label>
                  <Input id="backup-name" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="backup-type" className="text-right">
                    Type
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select backup type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="configuration">Configuration</SelectItem>
                      <SelectItem value="full">Full System</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="logs">Logs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="schedule" className="text-right">
                    Schedule
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Create Backup Job</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+23 today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 TB</div>
            <Progress value={65} className="mt-2" />
            <p className="text-xs text-muted-foreground">65% of 3.7 TB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Backups</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup Jobs</CardTitle>
          <CardDescription>Manage scheduled backup operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search backup jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Backup Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Device/Target</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">{backup.name}</TableCell>
                  <TableCell>{backup.type}</TableCell>
                  <TableCell>{backup.device}</TableCell>
                  <TableCell>{backup.schedule}</TableCell>
                  <TableCell className="font-mono text-sm">{backup.lastRun}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(backup.status)}
                      {getStatusBadge(backup.status)}
                    </div>
                  </TableCell>
                  <TableCell>{backup.size}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
