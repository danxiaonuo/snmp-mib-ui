"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Smartphone,
  Tablet,
  Monitor,
  Bell,
  Download,
  QrCode,
  Settings,
  Shield,
  Wifi,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

export default function MobilePage() {
  const [pushNotifications, setPushNotifications] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // Mock mobile analytics data
  const mobileStats = {
    totalUsers: 1247,
    activeUsers: 892,
    mobileUsers: 456,
    tabletUsers: 234,
    desktopUsers: 557,
    appDownloads: 2341,
    pushNotificationsSent: 15678,
    offlineUsage: 23.5,
  }

  const deviceBreakdown = [
    { device: "Mobile", users: 456, percentage: 36.6, icon: Smartphone },
    { device: "Tablet", users: 234, percentage: 18.8, icon: Tablet },
    { device: "Desktop", users: 557, percentage: 44.6, icon: Monitor },
  ]

  const mobileFeatures = [
    {
      id: "pwa",
      name: "Progressive Web App",
      description: "Install the app on mobile devices for native-like experience",
      status: "active",
      usage: 78,
      icon: Download,
    },
    {
      id: "offline",
      name: "Offline Mode",
      description: "Access critical data even without internet connection",
      status: "active",
      usage: 23,
      icon: Wifi,
    },
    {
      id: "push",
      name: "Push Notifications",
      description: "Real-time alerts and notifications on mobile devices",
      status: "active",
      usage: 89,
      icon: Bell,
    },
    {
      id: "qr",
      name: "QR Code Scanner",
      description: "Scan device QR codes for quick access and configuration",
      status: "active",
      usage: 45,
      icon: QrCode,
    },
  ]

  const mobileAlerts = [
    {
      id: 1,
      type: "critical",
      title: "Core Switch Down",
      message: "Core-Switch-01 is not responding",
      time: "2 min ago",
      sent: true,
    },
    {
      id: 2,
      type: "warning",
      title: "High CPU Usage",
      message: "Router-DMZ-02 CPU at 95%",
      time: "15 min ago",
      sent: true,
    },
    {
      id: 3,
      type: "info",
      title: "Maintenance Window",
      message: "Scheduled maintenance in 2 hours",
      time: "1 hour ago",
      sent: false,
    },
  ]

  const responsiveBreakpoints = [
    { name: "Mobile", range: "< 768px", status: "optimized", coverage: 95 },
    { name: "Tablet", range: "768px - 1024px", status: "optimized", coverage: 92 },
    { name: "Desktop", range: "> 1024px", status: "optimized", coverage: 98 },
  ]

  const performanceMetrics = [
    { metric: "Page Load Time", mobile: "2.3s", tablet: "1.8s", desktop: "1.2s", target: "< 3s" },
    { metric: "First Paint", mobile: "1.1s", tablet: "0.9s", desktop: "0.7s", target: "< 1.5s" },
    { metric: "Interactive", mobile: "3.2s", tablet: "2.5s", desktop: "1.8s", target: "< 4s" },
    { metric: "Bundle Size", mobile: "245KB", tablet: "245KB", desktop: "312KB", target: "< 500KB" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimized":
        return "bg-green-100 text-green-800"
      case "needs-work":
        return "bg-yellow-100 text-yellow-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Smartphone className="h-8 w-8" />
            Mobile Support & PWA
          </h1>
          <p className="text-muted-foreground">Mobile-optimized interface and progressive web app capabilities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
          <Button variant="outline">
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
        </div>
      </div>

      {/* Mobile Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mobileStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{mobileStats.activeUsers} currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile Users</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mobileStats.mobileUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((mobileStats.mobileUsers / mobileStats.totalUsers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mobileStats.appDownloads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Usage</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mobileStats.offlineUsage}%</div>
            <p className="text-xs text-muted-foreground">Users accessing offline</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Mobile Features</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Device Usage Breakdown</CardTitle>
              <CardDescription>User distribution across different device types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deviceBreakdown.map((device, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <device.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{device.device}</p>
                        <p className="text-sm text-muted-foreground">{device.users} users</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={device.percentage} className="w-24" />
                      <span className="text-sm font-medium w-12">{device.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Responsive Design Status */}
          <Card>
            <CardHeader>
              <CardTitle>Responsive Design Status</CardTitle>
              <CardDescription>Optimization status across different screen sizes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {responsiveBreakpoints.map((breakpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{breakpoint.name}</p>
                      <p className="text-sm text-muted-foreground">{breakpoint.range}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(breakpoint.status)}>{breakpoint.status}</Badge>
                      <span className="text-sm font-medium">{breakpoint.coverage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Features</CardTitle>
              <CardDescription>Progressive web app features and capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mobileFeatures.map((feature) => (
                  <div key={feature.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <feature.icon className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{feature.name}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(feature.status)}>{feature.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage</span>
                        <span>{feature.usage}%</span>
                      </div>
                      <Progress value={feature.usage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Mobile notification management and history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        {mobileStats.pushNotificationsSent.toLocaleString()} sent this month
                      </p>
                    </div>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recent Notifications</h4>
                  {mobileAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{alert.time}</p>
                        <Badge variant={alert.sent ? "default" : "outline"}>{alert.sent ? "Sent" : "Pending"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Mobile performance optimization metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{metric.metric}</h4>
                      <Badge variant="outline">Target: {metric.target}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <Smartphone className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="font-medium">{metric.mobile}</p>
                        <p className="text-muted-foreground">Mobile</p>
                      </div>
                      <div className="text-center">
                        <Tablet className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="font-medium">{metric.tablet}</p>
                        <p className="text-muted-foreground">Tablet</p>
                      </div>
                      <div className="text-center">
                        <Monitor className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="font-medium">{metric.desktop}</p>
                        <p className="text-muted-foreground">Desktop</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Settings</CardTitle>
              <CardDescription>Configure mobile app behavior and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive real-time alerts on mobile devices</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Offline Mode</p>
                    <p className="text-sm text-muted-foreground">Cache data for offline access</p>
                  </div>
                  <Switch checked={offlineMode} onCheckedChange={setOfflineMode} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Use dark theme for mobile interface</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Advanced Settings
                    </Button>
                    <Button variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Security Settings
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
