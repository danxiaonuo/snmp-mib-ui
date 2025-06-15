import { NextRequest, NextResponse } from 'next/server'
import { createAuditLog } from '@/lib/security'

// Analytics data interface
interface AnalyticsData {
  type: 'web-vital' | 'error' | 'interaction' | 'performance'
  metric?: string
  value?: number
  rating?: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
  userAgent: string
  sessionId?: string
  userId?: string
  errorMessage?: string
  stackTrace?: string
}

// In-memory storage for demo (use database in production)
const analyticsStore: AnalyticsData[] = []

export async function POST(request: NextRequest) {
  try {
    const data: AnalyticsData = await request.json()
    
    // Validate required fields
    if (!data.type || !data.timestamp || !data.url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Add client IP and additional metadata
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    const enhancedData = {
      ...data,
      clientIP,
      receivedAt: new Date().toISOString(),
    }
    
    // Store analytics data (in production, save to database)
    analyticsStore.push(enhancedData)
    
    // Keep only last 1000 entries in memory
    if (analyticsStore.length > 1000) {
      analyticsStore.splice(0, analyticsStore.length - 1000)
    }
    
    // Create audit log for errors
    if (data.type === 'error') {
      const auditLog = createAuditLog(
        'client_error',
        'application',
        {
          errorMessage: data.errorMessage,
          url: data.url,
          userAgent: data.userAgent,
        },
        false,
        data.userId
      )
      
      // In production, save audit log to database
      console.error('Client Error:', auditLog)
    }
    
    // Log performance issues
    if (data.type === 'web-vital' && data.rating === 'poor') {
      console.warn('Performance Issue:', {
        metric: data.metric,
        value: data.value,
        url: data.url,
        timestamp: data.timestamp,
      })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Analytics API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '100')
    const since = searchParams.get('since')
    
    let filteredData = analyticsStore
    
    // Filter by type
    if (type) {
      filteredData = filteredData.filter(item => item.type === type)
    }
    
    // Filter by timestamp
    if (since) {
      const sinceTimestamp = new Date(since).getTime()
      filteredData = filteredData.filter(item => item.timestamp >= sinceTimestamp)
    }
    
    // Limit results
    filteredData = filteredData.slice(-limit)
    
    // Generate summary statistics
    const summary = {
      total: filteredData.length,
      byType: filteredData.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byRating: filteredData
        .filter(item => item.rating)
        .reduce((acc, item) => {
          acc[item.rating!] = (acc[item.rating!] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      averageValues: {} as Record<string, number>,
    }
    
    // Calculate average values for web vitals
    const webVitals = filteredData.filter(item => item.type === 'web-vital')
    const metricGroups = webVitals.reduce((acc, item) => {
      if (item.metric && item.value !== undefined) {
        if (!acc[item.metric]) acc[item.metric] = []
        acc[item.metric].push(item.value)
      }
      return acc
    }, {} as Record<string, number[]>)
    
    Object.entries(metricGroups).forEach(([metric, values]) => {
      summary.averageValues[metric] = values.reduce((a, b) => a + b, 0) / values.length
    })
    
    return NextResponse.json({
      data: filteredData,
      summary,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('Analytics GET API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}