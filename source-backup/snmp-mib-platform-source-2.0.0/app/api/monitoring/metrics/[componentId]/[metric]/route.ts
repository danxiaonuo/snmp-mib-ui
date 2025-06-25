import { NextRequest, NextResponse } from 'next/server'

// 真实时序数据API
export async function GET(
  request: NextRequest,
  { params }: { params: { componentId: string; metric: string } }
) {
  try {
    const { componentId, metric } = params
    
    // 这里应该从真实的时序数据库获取指标数据
    // 例如：从VictoriaMetrics、Prometheus等查询
    
    // 目前返回空数据，等待真实时序数据库接入
    const metrics = []
    
    return NextResponse.json({
      success: true,
      componentId,
      metric,
      metrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to fetch time series data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch time series data',
        metrics: []
      },
      { status: 500 }
    )
  }
}