"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, CheckCircle, XCircle, Search, Filter, Download } from "lucide-react"

export default function SecurityPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const securityMetrics = [
    {
      title: "Security Score",
      value: "87%",
      change: "+5%",
      icon: Shield,
      color: "text-green-600",
    },
    {
      title: "Active Threats",
      value: "3",
      change: "-2",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      title: "Vulnerabilities",
      value: "12",
      change: "-8",
      icon: XCircle,
      color: "text-orange-600",
    },
    {
      title: "Compliance Rate",
      value: "94%",
      change: "+2%",
      icon: CheckCircle,
      color: "text-blue-600",
    },
  ]

  const recentAlerts = [
    {
      id: 1,
      type: "Critical",
      title: "Unauthorized Access Attempt",
      description: "Multiple failed login attempts detected from IP 192.168.1.100",
      time: "2 minutes ago",
      status: "Active",
    },
    {
      id: 2,
      type: "Warning",
      title: "Suspicious Network Traffic",
      description: "Unusual data transfer patterns detected on port 443",
      time: "15 minutes ago",
      status: "Investigating",
    },
    {
      id: 3,
      type: "Info",
      title: "Security Policy Updated",
      description: "Password policy has been updated with new requirements",
      time: "1 hour ago",
      status: "Resolved",
    },
  ]

  const securityPolicies = [
    {
      name: "Password Policy",
      status: "Active",
      compliance: 98,
      lastUpdated: "2024-01-15",
    },
    {
      name: "Access Control Policy",
      status: "Active",
      compliance: 95,
      lastUpdated: "2024-01-10",
    },
    {
      name: "Data Encryption Policy",
      status: "Active",
      compliance: 100,
      lastUpdated: "2024-01-08",
    },
    {
      name: "Network Security Policy",
      status: "Review Required",
      compliance: 87,
      lastUpdated: "2023-12-20",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your network security</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Security Scan
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {securityMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={metric.change.startsWith("+") ? "text-green-600" : "text-red-600"}>
                  {metric.change}
                </span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Alerts</CardTitle>
              <CardDescription>Latest security events and incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    className={
                      alert.type === "Critical"
                        ? "border-red-200 bg-red-50"
                        : alert.type === "Warning"
                          ? "border-orange-200 bg-orange-50"
                          : "border-blue-200 bg-blue-50"
                    }
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                alert.type === "Critical"
                                  ? "destructive"
                                  : alert.type === "Warning"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {alert.type}
                            </Badge>
                            <span className="font-medium">{alert.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                        </div>
                        <Badge variant="outline">{alert.status}</Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>Manage and monitor security policy compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityPolicies.map((policy, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{policy.name}</h4>
                        <Badge variant={policy.status === "Active" ? "default" : "secondary"}>{policy.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Last updated: {policy.lastUpdated}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-sm font-medium">{policy.compliance}% Compliance</div>
                      <Progress value={policy.compliance} className="w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Network Traffic Monitor</CardTitle>
                <CardDescription>Real-time network security monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Inbound Traffic</span>
                    <span className="text-sm font-medium">2.4 GB/s</span>
                  </div>
                  <Progress value={65} />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Outbound Traffic</span>
                    <span className="text-sm font-medium">1.8 GB/s</span>
                  </div>
                  <Progress value={45} />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Blocked Requests</span>
                    <span className="text-sm font-medium text-red-600">127</span>
                  </div>
                  <Progress value={12} className="bg-red-100" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Security Scans</CardTitle>
                <CardDescription>Ongoing security assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Vulnerability Scan</p>
                      <p className="text-sm text-muted-foreground">Network devices</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">78%</p>
                      <Progress value={78} className="w-16" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Compliance Check</p>
                      <p className="text-sm text-muted-foreground">Security policies</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">45%</p>
                      <Progress value={45} className="w-16" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Penetration Test</p>
                      <p className="text-sm text-muted-foreground">External interfaces</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Queued</p>
                      <Progress value={0} className="w-16" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
