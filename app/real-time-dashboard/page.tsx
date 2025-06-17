"use client"

import { RealTimeDashboard } from "@/components/enhanced-ui/real-time-dashboard"

export default function RealTimeDashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Real-Time Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Live monitoring of system performance, network activity, and alerts
        </p>
      </div>
      
      <RealTimeDashboard />
    </div>
  )
}