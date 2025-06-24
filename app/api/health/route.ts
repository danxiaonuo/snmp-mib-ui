import { NextRequest, NextResponse } from 'next/server'
import { DatabaseUtils } from '@/lib/database'
import { cache } from '@/lib/memory-cache'

// Health check response interface
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: HealthCheck
    cache: HealthCheck
    memory: HealthCheck
    disk: HealthCheck
    external: HealthCheck
  }
  metrics: {
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage: NodeJS.CpuUsage
    processUptime: number
    systemUptime: number
  }
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn'
  responseTime?: number
  message?: string
  lastChecked: string
}

// Start time for uptime calculation
const startTime = Date.now()
let lastCpuUsage = process.cpuUsage()

// Check database connectivity
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now()
  
  try {
    const isConnected = DatabaseUtils.checkConnection()
    
    if (!isConnected) {
      return {
        status: 'fail',
        responseTime: Date.now() - start,
        message: 'SQLite database connection failed',
        lastChecked: new Date().toISOString(),
      }
    }
    
    return {
      status: 'pass',
      responseTime: Date.now() - start,
      message: 'SQLite database connection successful',
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: `Database connection failed: ${error}`,
      lastChecked: new Date().toISOString(),
    }
  }
}

// Check cache connectivity
async function checkCache(): Promise<HealthCheck> {
  const start = Date.now()
  
  try {
    const pingResult = await cache.ping()
    
    if (pingResult === 'PONG') {
      return {
        status: 'pass',
        responseTime: Date.now() - start,
        message: 'Memory cache is working',
        lastChecked: new Date().toISOString(),
      }
    } else {
      return {
        status: 'fail',
        responseTime: Date.now() - start,
        message: 'Memory cache ping failed',
        lastChecked: new Date().toISOString(),
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: `Cache check failed: ${error}`,
      lastChecked: new Date().toISOString(),
    }
  }
}

// Check memory usage
function checkMemory(): HealthCheck {
  const memUsage = process.memoryUsage()
  const totalMemory = memUsage.heapTotal
  const usedMemory = memUsage.heapUsed
  const memoryUsagePercent = (usedMemory / totalMemory) * 100
  
  let status: 'pass' | 'warn' | 'fail' = 'pass'
  let message = `Memory usage: ${memoryUsagePercent.toFixed(2)}%`
  
  if (memoryUsagePercent > 90) {
    status = 'fail'
    message += ' - Critical memory usage'
  } else if (memoryUsagePercent > 75) {
    status = 'warn'
    message += ' - High memory usage'
  }
  
  return {
    status,
    message,
    lastChecked: new Date().toISOString(),
  }
}

// Check disk space (simplified)
function checkDisk(): HealthCheck {
  // In production, implement actual disk space check
  // This is a simplified version
  
  return {
    status: 'pass',
    message: 'Disk space check not implemented',
    lastChecked: new Date().toISOString(),
  }
}

// Check external dependencies
async function checkExternal(): Promise<HealthCheck> {
  const start = Date.now()
  
  try {
    // Check external services (example: GitHub API)
    const response = await fetch('https://api.github.com/zen', {
      method: 'GET',
      timeout: 5000,
    })
    
    if (response.ok) {
      return {
        status: 'pass',
        responseTime: Date.now() - start,
        message: 'External dependencies accessible',
        lastChecked: new Date().toISOString(),
      }
    } else {
      return {
        status: 'warn',
        responseTime: Date.now() - start,
        message: `External service returned ${response.status}`,
        lastChecked: new Date().toISOString(),
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: `External dependencies check failed: ${error}`,
      lastChecked: new Date().toISOString(),
    }
  }
}

// Get system metrics
function getSystemMetrics() {
  const currentCpuUsage = process.cpuUsage(lastCpuUsage)
  lastCpuUsage = process.cpuUsage()
  
  return {
    memoryUsage: process.memoryUsage(),
    cpuUsage: currentCpuUsage,
    processUptime: process.uptime(),
    systemUptime: require('os').uptime(),
  }
}

// Determine overall health status
function determineOverallStatus(checks: HealthCheckResponse['checks']): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map(check => check.status)
  
  if (statuses.includes('fail')) {
    return 'unhealthy'
  }
  
  if (statuses.includes('warn')) {
    return 'degraded'
  }
  
  return 'healthy'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'
    
    // Perform health checks
    const checks = {
      database: await checkDatabase(),
      cache: await checkCache(),
      memory: checkMemory(),
      disk: checkDisk(),
      external: await checkExternal(),
    }
    
    const overallStatus = determineOverallStatus(checks)
    
    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      metrics: getSystemMetrics(),
    }
    
    // Return simplified response if not detailed
    if (!detailed) {
      return NextResponse.json({
        status: response.status,
        timestamp: response.timestamp,
        uptime: response.uptime,
        version: response.version,
      })
    }
    
    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503
    
    return NextResponse.json(response, { status: httpStatus })
    
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}

// Simple ping endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}