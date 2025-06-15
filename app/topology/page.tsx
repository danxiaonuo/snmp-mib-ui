"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Network,
  Router,
  Server,
  Shield,
  Wifi,
  Zap,
  Eye,
  Settings,
  RefreshCw,
  Download,
  Activity,
  AlertTriangle,
} from "lucide-react"

interface NetworkNode {
  id: string
  name: string
  type: "router" | "switch" | "firewall" | "server" | "access_point"
  status: "online" | "offline" | "warning"
  ip: string
  connections: string[]
  position: { x: number; y: number }
  metrics: {
    cpu: number
    memory: number
    bandwidth: number
    latency: number
  }
}

export default function TopologyPage() {
  const [viewMode, setViewMode] = useState("logical")
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const networkNodes: NetworkNode[] = [
    {
      id: "core-router-01",
      name: "Core-Router-01",
      type: "router",
      status: "online",
      ip: "192.168.1.1",
      connections: ["switch-floor-01", "switch-floor-02", "firewall-main"],
      position: { x: 400, y: 200 },
      metrics: { cpu: 45, memory: 62, bandwidth: 78, latency: 12 },
    },
    {
      id: "switch-floor-01",
      name: "Switch-Floor-01",
      type: "switch",
      status: "online",
      ip: "192.168.1.10",
      connections: ["core-router-01", "server-web-01", "ap-lobby-01"],
      position: { x: 200, y: 350 },
      metrics: { cpu: 32, memory: 45, bandwidth: 65, latency: 8 },
    },
    {
      id: "switch-floor-02",
      name: "Switch-Floor-02",
      type: "switch",
      status: "warning",
      ip: "192.168.1.11",
      connections: ["core-router-01", "server-db-01", "ap-floor2-01"],
      position: { x: 600, y: 350 },
      metrics: { cpu: 78, memory: 82, bandwidth: 45, latency: 15 },
    },
    {
      id: "firewall-main",
      name: "Firewall-Main",
      type: "firewall",
      status: "online",
      ip: "10.0.0.1",
      connections: ["core-router-01"],
      position: { x: 400, y: 50 },
      metrics: { cpu: 28, memory: 35, bandwidth: 89, latency: 5 },
    },
    {
      id: "server-web-01",
      name: "Server-Web-01",
      type: "server",
      status: "online",
      ip: "192.168.100.10",
      connections: ["switch-floor-01"],
      position: { x: 100, y: 500 },
      metrics: { cpu: 65, memory: 78, bandwidth: 92, latency: 3 },
    },
    {
      id: "server-db-01",
      name: "Server-DB-01",
      type: "server",
      status: "online",
      ip: "192.168.100.11",
      connections: ["switch-floor-02"],
      position: { x: 700, y: 500 },
      metrics: { cpu: 89, memory: 91, bandwidth: 67, latency: 4 },
    },
    {
      id: "ap-lobby-01",
      name: "AP-Lobby-01",
      type: "access_point",
      status: "online",
      ip: "192.168.2.5",
      connections: ["switch-floor-01"],
      position: { x: 50, y: 350 },
      metrics: { cpu: 23, memory: 34, bandwidth: 56, latency: 18 },
    },
    {
      id: "ap-floor2-01",
      name: "AP-Floor2-01",
      type: "access_point",
      status: "offline",
      ip: "192.168.2.6",
      connections: ["switch-floor-02"],
      position: { x: 750, y: 350 },
      metrics: { cpu: 0, memory: 0, bandwidth: 0, latency: 0 },
    },
  ]

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "router":
        return Router
      case "switch":
        return Network
      case "firewall":
        return Shield
      case "server":
        return Server
      case "access_point":
        return Wifi
      default:
        return Network
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500 border-green-500 bg-green-50"
      case "offline":
        return "text-red-500 border-red-500 bg-red-50"
      case "warning":
        return "text-yellow-500 border-yellow-500 bg-yellow-50"
      default:
        return "text-gray-500 border-gray-500 bg-gray-50"
    }
  }

  const getMetricColor = (value: number) => {
    if (value >= 80) return "text-red-500"
    if (value >= 60) return "text-yellow-500"
    return "text-green-500"
  }

  const networkStats = {
    totalNodes: networkNodes.length,
    onlineNodes: networkNodes.filter((n) => n.status === "online").length,
    offlineNodes: networkNodes.filter((n) => n.status === "offline").length,
    warningNodes: networkNodes.filter((n) => n.status === "warning").length,
    totalConnections: networkNodes.reduce((acc, node) => acc + node.connections.length, 0) / 2,
  }

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        console.log("Refreshing topology data...")
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8" />
            Network Topology
          </h1>
          <p className="text-muted-foreground">Visual representation of your network infrastructure</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="logical">Logical</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="layer2">Layer 2</SelectItem>
              <SelectItem value="layer3">Layer 3</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.totalNodes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.onlineNodes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.warningNodes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <div className="h-2 w-2 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.offlineNodes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.totalConnections}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Network Topology Visualization */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Network Topology - {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View</CardTitle>
            <CardDescription>Interactive network diagram showing device connections and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-96 border rounded-lg bg-gray-50 overflow-hidden">
              <svg width="100%" height="100%" className="absolute inset-0">
                {/* Draw connections */}
                {networkNodes.map((node) =>
                  node.connections.map((connectionId) => {
                    const targetNode = networkNodes.find((n) => n.id === connectionId)
                    if (!targetNode) return null
                    return (
                      <line
                        key={`${node.id}-${connectionId}`}
                        x1={node.position.x}
                        y1={node.position.y}
                        x2={targetNode.position.x}
                        y2={targetNode.position.y}
                        stroke="#e5e7eb"
                        strokeWidth="2"
                        className="transition-colors hover:stroke-blue-500"
                      />
                    )
                  }),
                )}

                {/* Draw nodes */}
                {networkNodes.map((node) => {
                  const Icon = getNodeIcon(node.type)
                  return (
                    <g key={node.id}>
                      <circle
                        cx={node.position.x}
                        cy={node.position.y}
                        r="25"
                        className={`cursor-pointer transition-all hover:scale-110 ${getStatusColor(node.status)}`}
                        onClick={() => setSelectedNode(node)}
                      />
                      <foreignObject
                        x={node.position.x - 12}
                        y={node.position.y - 12}
                        width="24"
                        height="24"
                        className="pointer-events-none"
                      >
                        <Icon className="h-6 w-6" />
                      </foreignObject>
                      <text
                        x={node.position.x}
                        y={node.position.y + 45}
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-700"
                      >
                        {node.name}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Node Details Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Node Details</CardTitle>
            <CardDescription>
              {selectedNode ? `Information for ${selectedNode.name}` : "Select a node to view details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getNodeIcon(selectedNode.type)
                    return <Icon className="h-5 w-5" />
                  })()}
                  <div>
                    <p className="font-medium">{selectedNode.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedNode.ip}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm">Status:</span>
                  <Badge
                    className={
                      selectedNode.status === "online"
                        ? "bg-green-100 text-green-800"
                        : selectedNode.status === "offline"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {selectedNode.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span className={getMetricColor(selectedNode.metrics.cpu)}>{selectedNode.metrics.cpu}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${selectedNode.metrics.cpu}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span className={getMetricColor(selectedNode.metrics.memory)}>
                        {selectedNode.metrics.memory}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${selectedNode.metrics.memory}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Bandwidth</span>
                      <span className={getMetricColor(selectedNode.metrics.bandwidth)}>
                        {selectedNode.metrics.bandwidth}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${selectedNode.metrics.bandwidth}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Latency</span>
                    <span className="font-medium">{selectedNode.metrics.latency}ms</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button className="w-full" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click on a node in the topology to view its details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Network Health Summary */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Performance Overview</CardTitle>
              <CardDescription>Real-time performance metrics across the network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {networkNodes
                  .filter((node) => node.status === "online")
                  .map((node) => (
                    <div key={node.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        {(() => {
                          const Icon = getNodeIcon(node.type)
                          return <Icon className="h-4 w-4" />
                        })()}
                        <span className="font-medium text-sm">{node.name}</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>CPU:</span>
                          <span className={getMetricColor(node.metrics.cpu)}>{node.metrics.cpu}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Memory:</span>
                          <span className={getMetricColor(node.metrics.memory)}>{node.metrics.memory}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Latency:</span>
                          <span>{node.metrics.latency}ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Connectivity Status</CardTitle>
              <CardDescription>Connection health and path analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {networkNodes.map((node) => (
                  <div key={node.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const Icon = getNodeIcon(node.type)
                        return <Icon className="h-4 w-4" />
                      })()}
                      <div>
                        <p className="font-medium">{node.name}</p>
                        <p className="text-sm text-muted-foreground">{node.connections.length} connections</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          node.status === "online"
                            ? "bg-green-100 text-green-800"
                            : node.status === "offline"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {node.status}
                      </Badge>
                      {node.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Security Status</CardTitle>
              <CardDescription>Security posture and threat detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Firewall Status</span>
                  </div>
                  <p className="text-sm text-muted-foreground">All firewalls operational</p>
                  <Badge className="bg-green-100 text-green-800 mt-2">Secure</Badge>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Traffic Analysis</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Normal traffic patterns</p>
                  <Badge className="bg-blue-100 text-blue-800 mt-2">Normal</Badge>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Threat Detection</span>
                  </div>
                  <p className="text-sm text-muted-foreground">2 potential threats detected</p>
                  <Badge className="bg-yellow-100 text-yellow-800 mt-2">Monitoring</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
