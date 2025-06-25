"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Settings, Save, RefreshCw, CheckCircle, Database } from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    systemName: "MIB Configuration Platform",
    timezone: "UTC",
    language: "en",
    theme: "system",
    autoRefresh: true,
    refreshInterval: 30,
  })

  // MIB Processing Settings
  const [mibSettings, setMibSettings] = useState({
    maxFileSize: 10, // MB
    allowedFormats: ["mib", "txt", "asn1"],
    autoValidation: true,
    strictMode: false,
    cacheEnabled: true,
    cacheExpiry: 24, // hours
  })

  // Configuration Generation Settings
  const [configSettings, setConfigSettings] = useState({
    defaultFormat: "prometheus",
    includeComments: true,
    compressOutput: false,
    templateValidation: true,
    backupConfigs: true,
    maxBackups: 10,
  })

  const handleSaveSettings = async (section: string) => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Settings Saved",
        description: `${section} settings have been updated successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Configure system preferences and processing parameters</p>
        </div>
        <Badge variant="outline" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          All systems operational
        </Badge>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="mib" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            MIB Processing
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Config Generation
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systemName">System Name</Label>
                  <Input
                    id="systemName"
                    value={generalSettings.systemName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, systemName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select
                    value={generalSettings.language}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={generalSettings.theme}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, theme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Refresh</Label>
                    <p className="text-sm text-muted-foreground">Automatically refresh dashboard data</p>
                  </div>
                  <Switch
                    checked={generalSettings.autoRefresh}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, autoRefresh: checked })}
                  />
                </div>

                {generalSettings.autoRefresh && (
                  <div className="space-y-2">
                    <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
                    <Input
                      id="refreshInterval"
                      type="number"
                      value={generalSettings.refreshInterval}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, refreshInterval: Number.parseInt(e.target.value) })
                      }
                      min="10"
                      max="300"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("General")} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mib" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MIB Processing Configuration</CardTitle>
              <CardDescription>Configure MIB file processing and validation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={mibSettings.maxFileSize}
                    onChange={(e) => setMibSettings({ ...mibSettings, maxFileSize: Number.parseInt(e.target.value) })}
                    min="1"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cacheExpiry">Cache Expiry (hours)</Label>
                  <Input
                    id="cacheExpiry"
                    type="number"
                    value={mibSettings.cacheExpiry}
                    onChange={(e) => setMibSettings({ ...mibSettings, cacheExpiry: Number.parseInt(e.target.value) })}
                    min="1"
                    max="168"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Validation</Label>
                    <p className="text-sm text-muted-foreground">Automatically validate MIB files on upload</p>
                  </div>
                  <Switch
                    checked={mibSettings.autoValidation}
                    onCheckedChange={(checked) => setMibSettings({ ...mibSettings, autoValidation: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Strict Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable strict syntax validation</p>
                  </div>
                  <Switch
                    checked={mibSettings.strictMode}
                    onCheckedChange={(checked) => setMibSettings({ ...mibSettings, strictMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Caching</Label>
                    <p className="text-sm text-muted-foreground">Cache parsed MIB data for faster access</p>
                  </div>
                  <Switch
                    checked={mibSettings.cacheEnabled}
                    onCheckedChange={(checked) => setMibSettings({ ...mibSettings, cacheEnabled: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("MIB Processing")} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Generation</CardTitle>
              <CardDescription>Configure output format and generation options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultFormat">Default Output Format</Label>
                  <Select
                    value={configSettings.defaultFormat}
                    onValueChange={(value) => setConfigSettings({ ...configSettings, defaultFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prometheus">Prometheus</SelectItem>
                      <SelectItem value="categraf">Categraf</SelectItem>
                      <SelectItem value="zabbix">Zabbix</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxBackups">Max Config Backups</Label>
                  <Input
                    id="maxBackups"
                    type="number"
                    value={configSettings.maxBackups}
                    onChange={(e) =>
                      setConfigSettings({ ...configSettings, maxBackups: Number.parseInt(e.target.value) })
                    }
                    min="1"
                    max="50"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Comments</Label>
                    <p className="text-sm text-muted-foreground">Add descriptive comments to generated configs</p>
                  </div>
                  <Switch
                    checked={configSettings.includeComments}
                    onCheckedChange={(checked) => setConfigSettings({ ...configSettings, includeComments: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Template Validation</Label>
                    <p className="text-sm text-muted-foreground">Validate generated configurations</p>
                  </div>
                  <Switch
                    checked={configSettings.templateValidation}
                    onCheckedChange={(checked) => setConfigSettings({ ...configSettings, templateValidation: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Backup Configurations</Label>
                    <p className="text-sm text-muted-foreground">Automatically backup generated configs</p>
                  </div>
                  <Switch
                    checked={configSettings.backupConfigs}
                    onCheckedChange={(checked) => setConfigSettings({ ...configSettings, backupConfigs: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Configuration Generation")} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Management</CardTitle>
              <CardDescription>Manage file storage and cleanup policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">2.4 GB</div>
                  <div className="text-sm text-muted-foreground">MIB Files</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">1.2 GB</div>
                  <div className="text-sm text-muted-foreground">Generated Configs</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">0.8 GB</div>
                  <div className="text-sm text-muted-foreground">Cache Data</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Cleanup Old Files</h4>
                    <p className="text-sm text-muted-foreground">Remove files older than 90 days</p>
                  </div>
                  <Button variant="outline">Run Cleanup</Button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Clear Cache</h4>
                    <p className="text-sm text-muted-foreground">Clear all cached MIB data</p>
                  </div>
                  <Button variant="outline">Clear Cache</Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Storage")} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
