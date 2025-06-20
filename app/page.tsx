"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Settings,
  Server,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Database,
  Zap,
  GitBranch,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const stats = [
    {
      title: "MIB Files",
      value: "24",
      change: "+3 this week",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Generated Configs",
      value: "12",
      change: "+2 today",
      icon: Settings,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Monitored Devices",
      value: "156",
      change: "+8 this month",
      icon: Server,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "OID Definitions",
      value: "2,847",
      change: "+124 new",
      icon: Database,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  const recentActivity = [
    {
      action: "Uploaded MIB file",
      file: "CISCO-MEMORY-POOL-MIB.txt",
      time: "2 minutes ago",
      status: "success",
    },
    {
      action: "Generated config",
      file: "prometheus-snmp.yml",
      time: "15 minutes ago",
      status: "success",
    },
    {
      action: "Validated MIB",
      file: "IF-MIB.txt",
      time: "1 hour ago",
      status: "warning",
    },
    {
      action: "Added device template",
      file: "Cisco Switch Template",
      time: "2 hours ago",
      status: "success",
    },
  ]

  const quickActions = [
    {
      title: "Upload MIB File",
      description: "Add new MIB files to your library",
      icon: Upload,
      href: "/mibs",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Generate Config",
      description: "Create monitoring configurations",
      icon: Settings,
      href: "/config-gen",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Add Device",
      description: "Register new network devices",
      icon: Server,
      href: "/devices",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Browse OIDs",
      description: "Explore OID definitions",
      icon: Database,
      href: "/mibs/oid-browser",
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground mt-2">Manage your SNMP MIB files and monitoring configurations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Quick Upload
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`p-3 rounded-full text-white ${action.color}`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest operations and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex-shrink-0">
                    {activity.status === "success" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground truncate">{activity.file}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              System Status
            </CardTitle>
            <CardDescription>Platform health and performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>MIB Parser</span>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>
              <Progress value={98} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Config Generator</span>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>
              <Progress value={95} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Database</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <Progress value={92} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Storage Usage</span>
                <Badge className="bg-yellow-100 text-yellow-800">75% Used</Badge>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
