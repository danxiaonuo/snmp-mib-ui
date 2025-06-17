"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { WifiOff, Download, Database, Sync, CheckCircle, AlertTriangle } from "lucide-react"

export default function OfflineModePage() {
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [offlineData, setOfflineData] = useState({
    devices: 12,
    mibs: 45,
    alerts: 8,
    lastSync: "2024-01-20 14:30:00"
  })

  useEffect(() => {
    // 检查离线状态
    const checkOfflineStatus = () => {
      setIsOfflineMode(!navigator.onLine)
    }
    
    window.addEventListener('online', checkOfflineStatus)
    window.addEventListener('offline', checkOfflineStatus)
    checkOfflineStatus()

    return () => {
      window.removeEventListener('online', checkOfflineStatus)
      window.removeEventListener('offline', checkOfflineStatus)
    }
  }, [])

  const handleSyncData = () => {
    setSyncProgress(0)
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <WifiOff className="h-8 w-8" />
            Offline Mode
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage offline data synchronization and local storage
          </p>
        </div>
        <Badge variant={isOfflineMode ? "destructive" : "default"}>
          {isOfflineMode ? "Offline" : "Online"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cached Devices</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offlineData.devices}</div>
            <p className="text-xs text-muted-foreground">Available offline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cached MIBs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offlineData.mibs}</div>
            <p className="text-xs text-muted-foreground">Available offline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offlineData.alerts}</div>
            <p className="text-xs text-muted-foreground">Waiting for sync</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Sync className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{offlineData.lastSync}</div>
            <p className="text-xs text-muted-foreground">Data synchronized</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offline Settings</CardTitle>
          <CardDescription>Configure offline mode behavior and data synchronization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Auto Sync</h4>
              <p className="text-sm text-muted-foreground">Automatically sync when connection is available</p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Cache Critical Data</h4>
              <p className="text-sm text-muted-foreground">Store critical alerts and device status offline</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Sync Progress</h4>
              <span className="text-sm text-muted-foreground">{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} className="w-full" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSyncData} disabled={syncProgress > 0 && syncProgress < 100}>
              <Download className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
