"use client"

import { SystemHealthMonitor } from "@/components/enhanced-ui/system-health-monitor"

export default function SystemHealthPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Health</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system performance, resource usage, and service health in real-time
        </p>
      </div>
      
      <SystemHealthMonitor />
    </div>
  )
}