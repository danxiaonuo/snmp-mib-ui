"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Settings, Server, Upload, Download, Eye } from "lucide-react"
import Link from "next/link"

export default function SimpleDashboard() {
  const stats = {
    mibFiles: 15,
    configTemplates: 8,
    devices: 42,
    recentConfigs: 6,
  }

  const recentActivity = [
    {
      id: 1,
      type: "mib_upload",
      title: "CISCO-MEMORY-POOL-MIB uploaded",
      time: "2 hours ago",
      status: "success",
    },
    {
      id: 2,
      type: "config_generated",
      title: "SNMP Exporter config generated for Cisco Switch",
      time: "4 hours ago",
      status: "success",
    },
    {
      id: 3,
      type: "device_added",
      title: "New device added: Core-Switch-01",
      time: "6 hours ago",
      status: "success",
    },
    {
      id: 4,
      type: "mib_upload",
      title: "IF-MIB updated",
      time: "1 day ago",
      status: "success",
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "mib_upload":
        return <Upload className="h-4 w-4 text-blue-500" />
      case "config_generated":
        return <Settings className="h-4 w-4 text-green-500" />
      case "device_added":
        return <Server className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MIB Management & Configuration Platform</h1>
        <p className="text-muted-foreground">
          Upload MIB files, generate monitoring configurations, and manage network devices
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MIB Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mibFiles}</div>
            <p className="text-xs text-muted-foreground">+2 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Config Templates</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.configTemplates}</div>
            <p className="text-xs text-muted-foreground">+1 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devices</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.devices}</div>
            <p className="text-xs text-muted-foreground">+3 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Configs</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentConfigs}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload MIB Files
            </CardTitle>
            <CardDescription>Upload and manage SNMP MIB files for OID resolution</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/mibs">
              <Button className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Manage MIBs
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Generate Configurations
            </CardTitle>
            <CardDescription>Create monitoring configurations from MIB data</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/config-gen">
              <Button className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Config Generator
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Device Management
            </CardTitle>
            <CardDescription>Manage network devices and their configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/devices">
              <Button className="w-full">
                <Server className="h-4 w-4 mr-2" />
                Manage Devices
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest MIB uploads and configuration generations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getActivityIcon(activity.type)}
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">{activity.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MIB Processing Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>MIB Processing Status</CardTitle>
            <CardDescription>Current status of MIB file processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Processed MIBs</span>
                  <span>13/15</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>OIDs Extracted</span>
                  <span>2,847</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Validation Status</span>
                  <span>12/13</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration Templates</CardTitle>
            <CardDescription>Available monitoring configuration templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">SNMP Exporter</span>
                <Badge variant="outline">4 templates</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Categraf</span>
                <Badge variant="outline">2 templates</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Prometheus</span>
                <Badge variant="outline">2 templates</Badge>
              </div>
              <div className="pt-2">
                <Link href="/config-gen">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Templates
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
