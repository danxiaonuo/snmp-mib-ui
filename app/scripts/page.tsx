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
import { Search, Filter, Plus, Play, Edit, Trash2, Copy, Download, FileText, Terminal, Code, Clock } from "lucide-react"

export default function ScriptsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  const scripts = [
    {
      id: 1,
      name: "Network Discovery",
      type: "Python",
      category: "Discovery",
      lastRun: "2024-01-15 10:30",
      status: "Success",
      runtime: "2.3s",
      author: "Evan",
    },
    {
      id: 2,
      name: "Config Backup",
      type: "Bash",
      category: "Backup",
      lastRun: "2024-01-15 02:00",
      status: "Success",
      runtime: "45s",
      author: "Evan",
    },
    {
      id: 3,
      name: "Health Check",
      type: "PowerShell",
      category: "Monitoring",
      lastRun: "2024-01-15 09:15",
      status: "Failed",
      runtime: "0s",
      author: "Evan",
    },
    {
      id: 4,
      name: "Log Cleanup",
      type: "Python",
      category: "Maintenance",
      lastRun: "2024-01-15 04:00",
      status: "Success",
      runtime: "12s",
      author: "Evan",
    },
    {
      id: 5,
      name: "Security Scan",
      type: "Bash",
      category: "Security",
      lastRun: "2024-01-14 23:00",
      status: "Running",
      runtime: "120s",
      author: "Evan",
    },
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      Success: "default",
      Failed: "destructive",
      Running: "secondary",
    } as const
    return <Badge variant={variants[status as keyof typeof variants] || "default"}>{status}</Badge>
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Python":
        return <Code className="h-4 w-4 text-blue-500" />
      case "Bash":
        return <Terminal className="h-4 w-4 text-green-500" />
      case "PowerShell":
        return <Terminal className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Script Management</h1>
          <p className="text-muted-foreground mt-2">Create, manage and execute automation scripts</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Script
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Script</DialogTitle>
              <DialogDescription>Create a new automation script</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="code">Script Code</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="script-name">Script Name</Label>
                    <Input id="script-name" placeholder="Enter script name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="script-type">Script Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select script type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="bash">Bash</SelectItem>
                        <SelectItem value="powershell">PowerShell</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
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
                        <SelectItem value="discovery">Discovery</SelectItem>
                        <SelectItem value="backup">Backup</SelectItem>
                        <SelectItem value="monitoring">Monitoring</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <Input id="timeout" type="number" placeholder="300" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe what this script does" />
                </div>
              </TabsContent>
              <TabsContent value="code" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="script-code">Script Code</Label>
                  <Textarea
                    id="script-code"
                    placeholder="Enter your script code here..."
                    className="min-h-[400px] font-mono"
                  />
                </div>
              </TabsContent>
              <TabsContent value="schedule" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Execution Schedule</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Only</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="cron">Custom (Cron)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cron-expression">Cron Expression</Label>
                    <Input id="cron-expression" placeholder="0 2 * * *" />
                    <p className="text-sm text-muted-foreground">Example: 0 2 * * * (runs daily at 2:00 AM)</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Create Script</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scripts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">+4 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executions Today</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Runtime</CardTitle>
            <Terminal className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23.4s</div>
            <p className="text-xs text-muted-foreground">Per execution</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Script Library</CardTitle>
          <CardDescription>Manage and execute automation scripts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scripts..."
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
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="bash">Bash</SelectItem>
                <SelectItem value="powershell">PowerShell</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Script Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Runtime</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scripts.map((script) => (
                <TableRow key={script.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(script.type)}
                      <span className="font-medium">{script.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{script.type}</TableCell>
                  <TableCell>{script.category}</TableCell>
                  <TableCell className="font-mono text-sm">{script.lastRun}</TableCell>
                  <TableCell>{getStatusBadge(script.status)}</TableCell>
                  <TableCell>{script.runtime}</TableCell>
                  <TableCell>{script.author}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
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
