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
import { Plus, Search, Edit, Trash2, Eye, WifiIcon, Router, Server, Shield } from "lucide-react"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const devices: Device[] = [
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
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Device</DialogTitle>
              <DialogDescription>Configure a new network device for monitoring</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ip" className="text-right">
                  IP Address
                </Label>
                <Input id="ip" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="router">Router</SelectItem>
                    <SelectItem value="switch">Switch</SelectItem>
                    <SelectItem value="firewall">Firewall</SelectItem>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="access_point">Access Point</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline">Cancel</Button>
              <Button>Add Device</Button>
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
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
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
    </div>
  )
}
