"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Plus, Edit, Trash2, Copy, Download, FileText, Settings, Router } from "lucide-react"

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  const templates = [
    {
      id: 1,
      name: "Basic Router Config",
      type: "Router",
      deviceType: "Cisco IOS",
      version: "1.2",
      lastModified: "2024-01-15",
      author: "Evan",
      status: "Active",
    },
    {
      id: 2,
      name: "Switch VLAN Setup",
      type: "Switch",
      deviceType: "Cisco Catalyst",
      version: "2.1",
      lastModified: "2024-01-10",
      author: "Evan",
      status: "Active",
    },
    {
      id: 3,
      name: "Firewall Security Policy",
      type: "Firewall",
      deviceType: "FortiGate",
      version: "1.5",
      lastModified: "2024-01-08",
      author: "Evan",
      status: "Draft",
    },
    {
      id: 4,
      name: "Server Monitoring",
      type: "Server",
      deviceType: "Linux",
      version: "3.0",
      lastModified: "2024-01-05",
      author: "Evan",
      status: "Active",
    },
    {
      id: 5,
      name: "Backup Configuration",
      type: "Storage",
      deviceType: "NetApp",
      version: "1.0",
      lastModified: "2024-01-03",
      author: "Evan",
      status: "Deprecated",
    },
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      Active: "default",
      Draft: "secondary",
      Deprecated: "destructive",
    } as const
    return <Badge variant={variants[status as keyof typeof variants] || "default"}>{status}</Badge>
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Router":
      case "Switch":
        return <Router className="h-4 w-4" />
      case "Server":
        return <Settings className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuration Templates</h1>
          <p className="text-muted-foreground mt-2">Manage device configuration templates and automation scripts</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create Configuration Template</DialogTitle>
              <DialogDescription>Create a new configuration template for network devices</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input id="template-name" placeholder="Enter template name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="device-type">Device Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cisco-ios">Cisco IOS</SelectItem>
                        <SelectItem value="cisco-catalyst">Cisco Catalyst</SelectItem>
                        <SelectItem value="fortigate">FortiGate</SelectItem>
                        <SelectItem value="linux">Linux Server</SelectItem>
                        <SelectItem value="windows">Windows Server</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="router">Router</SelectItem>
                        <SelectItem value="switch">Switch</SelectItem>
                        <SelectItem value="firewall">Firewall</SelectItem>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="storage">Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <Input id="version" placeholder="1.0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe the purpose of this template" />
                </div>
              </TabsContent>
              <TabsContent value="config" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="config-content">Configuration Content</Label>
                  <Textarea
                    id="config-content"
                    placeholder="Enter configuration commands..."
                    className="min-h-[300px] font-mono"
                  />
                </div>
              </TabsContent>
              <TabsContent value="variables" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Template Variables</Label>
                    <Button variant="outline" size="sm">
                      Add Variable
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <Label className="text-sm font-medium">Variable Name</Label>
                      <Label className="text-sm font-medium">Default Value</Label>
                      <Label className="text-sm font-medium">Description</Label>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Input placeholder="hostname" />
                      <Input placeholder="router-01" />
                      <Input placeholder="Device hostname" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Create Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">+3 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <Settings className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">38</div>
            <p className="text-xs text-muted-foreground">81% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Templates</CardTitle>
            <Edit className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">13% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployments</CardTitle>
            <Download className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Templates</CardTitle>
          <CardDescription>Manage and deploy configuration templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="router">Router</SelectItem>
                <SelectItem value="switch">Switch</SelectItem>
                <SelectItem value="firewall">Firewall</SelectItem>
                <SelectItem value="server">Server</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Device Type</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <span className="font-medium">{template.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{template.type}</TableCell>
                  <TableCell>{template.deviceType}</TableCell>
                  <TableCell>{template.version}</TableCell>
                  <TableCell>{template.lastModified}</TableCell>
                  <TableCell>{template.author}</TableCell>
                  <TableCell>{getStatusBadge(template.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
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
