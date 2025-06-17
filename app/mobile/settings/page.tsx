"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Smartphone, Bell, Palette, Database, Shield, Wifi } from "lucide-react"

export default function MobileSettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSync: true,
    cacheSize: [50],
    refreshInterval: "30",
    biometric: false,
    offlineMode: true
  })

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Smartphone className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Mobile App Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure mobile app preferences and behavior
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage alert notifications and push messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive alerts on your mobile device</p>
              </div>
              <Switch 
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting('notifications', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Alert Frequency</Label>
              <Select value={settings.refreshInterval} onValueChange={(value) => updateSetting('refreshInterval', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Every 15 seconds</SelectItem>
                  <SelectItem value="30">Every 30 seconds</SelectItem>
                  <SelectItem value="60">Every minute</SelectItem>
                  <SelectItem value="300">Every 5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the app's look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkMode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Use dark theme for better visibility</p>
              </div>
              <Switch 
                id="darkMode"
                checked={settings.darkMode}
                onCheckedChange={(checked) => updateSetting('darkMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data & Storage
            </CardTitle>
            <CardDescription>Manage data synchronization and storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoSync">Auto Sync</Label>
                <p className="text-sm text-muted-foreground">Automatically sync data when connected</p>
              </div>
              <Switch 
                id="autoSync"
                checked={settings.autoSync}
                onCheckedChange={(checked) => updateSetting('autoSync', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Cache Size: {settings.cacheSize[0]} MB</Label>
              <Slider
                value={settings.cacheSize}
                onValueChange={(value) => updateSetting('cacheSize', value)}
                max={200}
                min={10}
                step={10}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Amount of data to store locally for offline access
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="offlineMode">Offline Mode</Label>
                <p className="text-sm text-muted-foreground">Enable offline functionality</p>
              </div>
              <Switch 
                id="offlineMode"
                checked={settings.offlineMode}
                onCheckedChange={(checked) => updateSetting('offlineMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Security and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="biometric">Biometric Authentication</Label>
                <p className="text-sm text-muted-foreground">Use fingerprint or face recognition</p>
              </div>
              <Switch 
                id="biometric"
                checked={settings.biometric}
                onCheckedChange={(checked) => updateSetting('biometric', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button className="flex-1">Save Settings</Button>
          <Button variant="outline">Reset to Default</Button>
        </div>
      </div>
    </div>
  )
}
