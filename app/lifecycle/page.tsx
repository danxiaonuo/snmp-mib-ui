"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Search, Filter, Calendar, TrendingUp, Package, AlertTriangle, Clock } from "lucide-react"

export default function LifecyclePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStage, setFilterStage] = useState("all")

  const assets = [
    {
      id: 1,
      name: "Dell PowerEdge R740",
      category: "Server",
      stage: "Production",
      age: 18,
      expectedLife: 60,
      nextMaintenance: "2024-02-15",
      replacement: "2026-01-15",
    },
    {
      id: 2,
      name: "Cisco Catalyst 9300",
      category: "Switch",
      stage: "Production",
      age: 12,
      expectedLife: 84,
      nextMaintenance: "2024-03-01",
      replacement: "2027-03-20",
    },
    {
      id: 3,
      name: "HP ProLiant DL380",
      category: "Server",
      stage: "End of Life",
      age: 48,
      expectedLife: 60,
      nextMaintenance: "2024-01-20",
      replacement: "2024-06-10",
    },
    {
      id: 4,
      name: "Fortinet FortiGate 100F",
      category: "Firewall",
      stage: "Production",
      age: 8,
      expectedLife: 72,
      nextMaintenance: "2024-02-10",
      replacement: "2026-05-05",
    },
    {
      id: 5,
      name: "NetApp FAS2750",
      category: "Storage",
      stage: "Retirement",
      age: 36,
      expectedLife: 48,
      nextMaintenance: "N/A",
      replacement: "Completed",
    },
  ]

  const lifecycleData = [
    { name: "Planning", value: 15, color: "#3b82f6" },
    { name: "Procurement", value: 8, color: "#10b981" },
    { name: "Deployment", value: 12, color: "#f59e0b" },
    { name: "Production", value: 180, color: "#06d6a0" },
    { name: "End of Life", value: 25, color: "#ef4444" },
    { name: "Retirement", value: 7, color: "#6b7280" },
  ]

  const ageDistribution = [
    { range: "0-1 years", count: 45 },
    { range: "1-2 years", count: 38 },
    { range: "2-3 years", count: 52 },
    { range: "3-4 years", count: 41 },
    { range: "4-5 years", count: 28 },
    { range: "5+ years", count: 15 },
  ]

  const getStageBadge = (stage: string) => {
    const variants = {
      Planning: "secondary",
      Procurement: "default",
      Deployment: "default",
      Production: "default",
      "End of Life": "destructive",
      Retirement: "secondary",
    } as const
    return <Badge variant={variants[stage as keyof typeof variants] || "default"}>{stage}</Badge>
  }

  const getHealthPercentage = (age: number, expectedLife: number) => {
    return Math.max(0, Math.min(100, ((expectedLife - age) / expectedLife) * 100))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Asset Lifecycle Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage the complete lifecycle of IT assets</p>
        </div>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Review
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">Across all stages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">End of Life</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Maintenance</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Asset Age</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8</div>
            <p className="text-xs text-muted-foreground">Years</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle Stage Distribution</CardTitle>
            <CardDescription>Assets by lifecycle stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Assets", color: "#3b82f6" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lifecycleData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {lifecycleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Age Distribution</CardTitle>
            <CardDescription>Number of assets by age range</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Count", color: "#10b981" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Lifecycle Tracking</CardTitle>
          <CardDescription>Detailed view of asset lifecycle stages and health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="procurement">Procurement</SelectItem>
                <SelectItem value="deployment">Deployment</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="end-of-life">End of Life</SelectItem>
                <SelectItem value="retirement">Retirement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Age (Months)</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Next Maintenance</TableHead>
                <TableHead>Replacement Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                const health = getHealthPercentage(asset.age, asset.expectedLife)
                return (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>{getStageBadge(asset.stage)}</TableCell>
                    <TableCell>
                      {asset.age} / {asset.expectedLife}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={health} className="w-16" />
                        <span className="text-sm">{Math.round(health)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{asset.nextMaintenance}</TableCell>
                    <TableCell>{asset.replacement}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
