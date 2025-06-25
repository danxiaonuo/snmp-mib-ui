"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Copy, Router, Server, Shield, Wifi } from "lucide-react"

interface DeviceTemplate {
  id: string
  name: string
  deviceType: string
  manufacturer: string
  model: string
  description: string
  snmpVersion: string
  defaultCommunity: string
  defaultPort: number
  oidCount: number
  isActive: boolean
  createdAt: string
}

export default function DeviceTemplatesPage() {
  const [templates, setTemplates] = useState<DeviceTemplate[]>([
    {
      id: "1",
      name: "Cisco ISR Router",
      deviceType: "router",
      manufacturer: "Cisco",
      model: "ISR 4000 Series",
      description: "Template for Cisco ISR 4000 series routers",
      snmpVersion: "v2c",
      defaultCommunity: "public",
      defaultPort: 161,
      oidCount: 45,
      isActive: true,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "HP ProCurve Switch",
      deviceType: "switch",
      manufacturer: "HP",
      model: "ProCurve 2900",
      description: "Template for HP ProCurve 2900 series switches",
      snmpVersion: "v2c",
      defaultCommunity: "public",
      defaultPort: 161,
      oidCount: 38,
      isActive: true,
      createdAt: "2024-01-14",
    },
    {
      id: "3",
      name: "Linux Server",
      deviceType: "server",
      manufacturer: "Generic",
      model: "Linux",
      description: "Generic Linux server template with NET-SNMP",
      snmpVersion: "v3",
      defaultCommunity: "",
      defaultPort: 161,
      oidCount: 52,
      isActive: true,
      createdAt: "2024-01-13",
    },
  ])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "router":
        return <Router className="h-4 w-4" />
      case "switch":
        return <Wifi className="h-4 w-4" />
      case "server":
        return <Server className="h-4 w-4" />
      case "firewall":
        return <Shield className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Device Templates</h1>
          <p className="text-muted-foreground">Manage device-specific monitoring templates</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Device Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input id="template-name" placeholder="Device Template Name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device-type">Device Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="switch">Switch</SelectItem>
                      <SelectItem value="server">Server</SelectItem>
                      <SelectItem value="firewall">Firewall</SelectItem>
                      <SelectItem value="access_point">Access Point</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input id="manufacturer" placeholder="e.g., Cisco, HP, Dell" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" placeholder="e.g., ISR 4000, ProCurve 2900" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Template description..." rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="snmp-version">SNMP Version</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v1">SNMPv1</SelectItem>
                      <SelectItem value="v2c">SNMPv2c</SelectItem>
                      <SelectItem value="v3">SNMPv3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="community">Default Community</Label>
                  <Input id="community" placeholder="public" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Default Port</Label>
                  <Input id="port" type="number" placeholder="161" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>Create Template</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Templates</CardTitle>
          <CardDescription>Configured device templates for monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Device Type</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>SNMP Version</TableHead>
                <TableHead>OIDs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(template.deviceType)}
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{template.model}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{template.deviceType}</TableCell>
                  <TableCell>{template.manufacturer}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.snmpVersion.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{template.oidCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={template.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
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
