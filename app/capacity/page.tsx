"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { TrendingUp, Server, HardDrive, Cpu } from "lucide-react"

export default function CapacityPage() {
  const capacityData = [
    { month: "Jan", cpu: 45, memory: 60, storage: 35, bandwidth: 70 },
    { month: "Feb", cpu: 52, memory: 65, storage: 40, bandwidth: 75 },
    { month: "Mar", cpu: 48, memory: 70, storage: 45, bandwidth: 80 },
    { month: "Apr", cpu: 55, memory: 75, storage: 50, bandwidth: 85 },
    { month: "May", cpu: 60, memory: 80, storage: 55, bandwidth: 90 },
    { month: "Jun", cpu: 65, memory: 85, storage: 60, bandwidth: 95 },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Capacity Planning</h1>
          <p className="text-muted-foreground mt-2">This is the capacity planning page - navigation is working!</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Utilization</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <Progress value={65} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <Progress value={85} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">60%</div>
            <Progress value={60} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bandwidth Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
            <Progress value={95} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Capacity Trends</CardTitle>
          <CardDescription>Resource utilization trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              cpu: { label: "CPU", color: "#3b82f6" },
              memory: { label: "Memory", color: "#10b981" },
              storage: { label: "Storage", color: "#f59e0b" },
              bandwidth: { label: "Bandwidth", color: "#ef4444" },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={capacityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="storage" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="bandwidth" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
