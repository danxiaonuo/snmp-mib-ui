"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Key,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Activity,
  Book,
  Webhook,
  BarChart3,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"

export default function ApiManagementPage() {
  const [apiKeys, setApiKeys] = useState([
    {
      id: 1,
      name: "Production Dashboard",
      key: "nm_prod_1234567890abcdef",
      permissions: ["read", "devices", "alerts"],
      status: "active",
      createdAt: "2024-01-15 10:30:00",
      lastUsed: "2024-01-20 15:25:00",
      requestCount: 15420,
      rateLimit: "1000/hour",
      description: "Main production dashboard API access",
    },
    {
      id: 2,
      name: "Mobile App",
      key: "nm_mobile_abcdef1234567890",
      permissions: ["read", "alerts"],
      status: "active",
      createdAt: "2024-01-10 14:20:00",
      lastUsed: "2024-01-20 14:50:00",
      requestCount: 8750,
      rateLimit: "500/hour",
      description: "Mobile application API access",
    },
    {
      id: 3,
      name: "Third Party Integration",
      key: "nm_3rd_fedcba0987654321",
      permissions: ["read", "write", "devices"],
      status: "suspended",
      createdAt: "2024-01-05 09:15:00",
      lastUsed: "2024-01-18 11:30:00",
      requestCount: 2340,
      rateLimit: "200/hour",
      description: "External system integration",
    },
  ])

  const [webhooks, setWebhooks] = useState([
    {
      id: 1,
      name: "Slack Notifications",
      url: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
      events: ["alert.triggered", "device.offline"],
      status: "active",
      lastTriggered: "2024-01-20 15:30:00",
      successRate: 98.5,
      description: "Send alerts to Slack channel",
    },
    {
      id: 2,
      name: "ITSM Integration",
      url: "https://itsm.company.com/api/incidents",
      events: ["alert.critical"],
      status: "active",
      lastTriggered: "2024-01-20 12:15:00",
      successRate: 95.2,
      description: "Create incidents in ITSM system",
    },
  ])

  const [apiStats, setApiStats] = useState([
    { endpoint: "/api/v1/devices", requests: 5420, avgResponse: 120, errors: 12 },
    { endpoint: "/api/v1/alerts", requests: 3210, avgResponse: 85, errors: 5 },
    { endpoint: "/api/v1/metrics", requests: 8750, avgResponse: 200, errors: 23 },
    { endpoint: "/api/v1/topology", requests: 1230, avgResponse: 350, errors: 8 },
  ])

  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = useState(false)
  const [isAddWebhookDialogOpen, setIsAddWebhookDialogOpen] = useState(false)
  const [newApiKey, setNewApiKey] = useState({
    name: "",
    permissions: [] as string[],
    rateLimit: "1000",
    description: "",
  })

  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as string[],
    description: "",
  })

  const [showApiKey, setShowApiKey] = useState<number | null>(null)

  const availablePermissions = [
    { id: "read", name: "Read", description: "Read access to all resources" },
    { id: "write", name: "Write", description: "Create and update resources" },
    { id: "delete", name: "Delete", description: "Delete resources" },
    { id: "devices", name: "Devices", description: "Device management" },
    { id: "alerts", name: "Alerts", description: "Alert management" },
    { id: "reports", name: "Reports", description: "Generate reports" },
    { id: "admin", name: "Admin", description: "Administrative functions" },
  ]

  const availableEvents = [
    { id: "alert.triggered", name: "Alert Triggered", description: "When an alert is triggered" },
    { id: "alert.resolved", name: "Alert Resolved", description: "When an alert is resolved" },
    { id: "alert.critical", name: "Critical Alert", description: "When a critical alert occurs" },
    { id: "device.offline", name: "Device Offline", description: "When a device goes offline" },
    { id: "device.online", name: "Device Online", description: "When a device comes online" },
    { id: "service.down", name: "Service Down", description: "When a service goes down" },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      case "expired":
        return <Badge variant="secondary">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleAddApiKey = () => {
    const apiKey = {
      id: apiKeys.length + 1,
      ...newApiKey,
      key: `nm_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
      status: "active",
      createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      lastUsed: "Never",
      requestCount: 0,
      rateLimit: `${newApiKey.rateLimit}/hour`,
    }
    setApiKeys([...apiKeys, apiKey])
    setIsAddKeyDialogOpen(false)
    setNewApiKey({ name: "", permissions: [], rateLimit: "1000", description: "" })
  }

  const handleAddWebhook = () => {
    const webhook = {
      id: webhooks.length + 1,
      ...newWebhook,
      status: "active",
      lastTriggered: "Never",
      successRate: 100,
    }
    setWebhooks([...webhooks, webhook])
    setIsAddWebhookDialogOpen(false)
    setNewWebhook({ name: "", url: "", events: [], description: "" })
  }

  const handlePermissionToggle = (permissionId: string) => {
    setNewApiKey((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }))
  }

  const handleEventToggle = (eventId: string) => {
    setNewWebhook((prev) => ({
      ...prev,
      events: prev.events.includes(eventId) ? prev.events.filter((e) => e !== eventId) : [...prev.events, eventId],
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Management</h1>
          <p className="text-muted-foreground">Manage API keys, webhooks, and integrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddWebhookDialogOpen} onOpenChange={setIsAddWebhookDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Webhook className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isAddKeyDialogOpen} onOpenChange={setIsAddKeyDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* API Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.length}</div>
            <p className="text-xs text-muted-foreground">
              {apiKeys.filter((k) => k.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiStats.reduce((acc, stat) => acc + stat.requests, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhooks.length}</div>
            <p className="text-xs text-muted-foreground">
              {webhooks.filter((w) => w.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                (apiStats.reduce((acc, stat) => acc + (stat.requests - stat.errors), 0) /
                  apiStats.reduce((acc, stat) => acc + stat.requests, 0)) *
                100
              ).toFixed(1)}
              %
            </div>
            <p className="text-xs text-muted-foreground">API success rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API access keys and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{apiKey.name}</div>
                          <div className="text-sm text-muted-foreground">{apiKey.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {showApiKey === apiKey.id ? apiKey.key : "••••••••••••••••"}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                          >
                            {showApiKey === apiKey.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiKey.key)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {apiKey.permissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(apiKey.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div>{apiKey.requestCount.toLocaleString()} requests</div>
                          <div className="text-muted-foreground">Limit: {apiKey.rateLimit}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{apiKey.lastUsed}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Manage webhook endpoints and event subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{webhook.name}</div>
                          <div className="text-sm text-muted-foreground">{webhook.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded break-all">
                          {webhook.url.length > 50 ? `${webhook.url.substring(0, 50)}...` : webhook.url}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{webhook.successRate}%</span>
                          {webhook.successRate >= 95 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{webhook.lastTriggered}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                API Documentation
              </CardTitle>
              <CardDescription>Complete API reference and examples</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Authentication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Include your API key in the Authorization header:
                        </p>
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                          <code>{`Authorization: Bearer YOUR_API_KEY`}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Base URL</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">All API requests should be made to:</p>
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                          <code>https://api.netmonitor.com/v1</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Available Endpoints</h3>
                  <div className="space-y-3">
                    {[
                      { method: "GET", endpoint: "/devices", description: "List all devices" },
                      { method: "POST", endpoint: "/devices", description: "Create a new device" },
                      { method: "GET", endpoint: "/devices/{id}", description: "Get device details" },
                      { method: "GET", endpoint: "/alerts", description: "List all alerts" },
                      { method: "POST", endpoint: "/alerts/{id}/acknowledge", description: "Acknowledge an alert" },
                      { method: "GET", endpoint: "/metrics", description: "Get metrics data" },
                      { method: "GET", endpoint: "/topology", description: "Get network topology" },
                    ].map((endpoint, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                        <Badge variant={endpoint.method === "GET" ? "secondary" : "default"}>{endpoint.method}</Badge>
                        <code className="flex-1 text-sm">{endpoint.endpoint}</code>
                        <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Example Request</h3>
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                    <code>{`curl -X GET "https://api.netmonitor.com/v1/devices" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</code>
                  </pre>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Example Response</h3>
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                    <code>{`{
  "data": [
    {
      "id": 1,
      "name": "Switch-Core-01",
      "ip": "192.168.1.10",
      "type": "switch",
      "status": "online",
      "last_seen": "2024-01-20T15:30:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "per_page": 50
  }
}`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Analytics</CardTitle>
              <CardDescription>API usage statistics and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Avg Response Time</TableHead>
                    <TableHead>Errors</TableHead>
                    <TableHead>Success Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiStats.map((stat, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <code className="text-sm">{stat.endpoint}</code>
                      </TableCell>
                      <TableCell>{stat.requests.toLocaleString()}</TableCell>
                      <TableCell>{stat.avgResponse}ms</TableCell>
                      <TableCell>
                        <span className={stat.errors > 20 ? "text-red-600" : "text-green-600"}>{stat.errors}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{(((stat.requests - stat.errors) / stat.requests) * 100).toFixed(1)}%</span>
                          {stat.errors / stat.requests < 0.05 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add API Key Dialog */}
      <Dialog open={isAddKeyDialogOpen} onOpenChange={setIsAddKeyDialogOpen}>
        <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>Generate a new API key with specific permissions</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keyName">API Key Name</Label>
            <Input
              id="keyName"
              value={newApiKey.name}
              onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
              placeholder="e.g., Production Dashboard"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyDescription">Description</Label>
            <Textarea
              id="keyDescription"
              value={newApiKey.description}
              onChange={(e) => setNewApiKey({ ...newApiKey, description: e.target.value })}
              placeholder="Describe the purpose of this API key"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rateLimit">Rate Limit (requests per hour)</Label>
            <Select
              value={newApiKey.rateLimit}
              onValueChange={(value) => setNewApiKey({ ...newApiKey, rateLimit: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100/hour</SelectItem>
                <SelectItem value="500">500/hour</SelectItem>
                <SelectItem value="1000">1000/hour</SelectItem>
                <SelectItem value="5000">5000/hour</SelectItem>
                <SelectItem value="10000">10000/hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Permissions</Label>
            <ScrollArea className="h-48 border rounded-lg p-3">
              <div className="space-y-2">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={permission.id}
                      checked={newApiKey.permissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      className="rounded"
                    />
                    <div className="space-y-1">
                      <Label htmlFor={permission.id} className="text-sm font-medium">
                        {permission.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddKeyDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddApiKey}>Create API Key</Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Webhook Dialog */}
      <Dialog open={isAddWebhookDialogOpen} onOpenChange={setIsAddWebhookDialogOpen}>
        <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Webhook</DialogTitle>
          <DialogDescription>Configure a new webhook endpoint for event notifications</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookName">Webhook Name</Label>
            <Input
              id="webhookName"
              value={newWebhook.name}
              onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
              placeholder="e.g., Slack Notifications"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              value={newWebhook.url}
              onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
              placeholder="https://your-endpoint.com/webhook"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhookDescription">Description</Label>
            <Textarea
              id="webhookDescription"
              value={newWebhook.description}
              onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
              placeholder="Describe what this webhook does"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Events to Subscribe</Label>
            <ScrollArea className="h-48 border rounded-lg p-3">
              <div className="space-y-2">
                {availableEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={event.id}
                      checked={newWebhook.events.includes(event.id)}
                      onChange={() => handleEventToggle(event.id)}
                      className="rounded"
                    />
                    <div className="space-y-1">
                      <Label htmlFor={event.id} className="text-sm font-medium">
                        {event.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddWebhookDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddWebhook}>Add Webhook</Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
