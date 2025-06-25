import { NextRequest, NextResponse } from 'next/server'

// 真实监控概览API
export async function GET(request: NextRequest) {
  try {
    // 这里应该从真实的监控系统获取概览数据
    // 例如：从VictoriaMetrics、Prometheus等获取
    
    // 目前返回空数据，等待真实监控系统接入
    const overview = {
      totalComponents: 0,
      healthyComponents: 0,
      warningComponents: 0,
      criticalComponents: 0,
      totalAlerts: 0,
      activeIncidents: 0,
      dataIngestionRate: 0,
      queryRate: 0,
      storageUsed: 0,
      storageTotal: 0,
      networkTraffic: 0,
      uptime: '0d 0h 0m'
    }
    
    return NextResponse.json({
      success: true,
      overview,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to fetch monitoring overview:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch monitoring overview',
        overview: {
          totalComponents: 0,
          healthyComponents: 0,
          warningComponents: 0,
          criticalComponents: 0,
          totalAlerts: 0,
          activeIncidents: 0,
          dataIngestionRate: 0,
          queryRate: 0,
          storageUsed: 0,
          storageTotal: 0,
          networkTraffic: 0,
          uptime: '0d 0h 0m'
        }
      },
      { status: 500 }
    )
  }
}