// API集成路由 - 整合所有后端API接口
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:17880'

// 系统集成管理器
export const systemIntegrationManager = {
  async handleSystemAPI(request: NextRequest) {
    try {
      const url = new URL(request.url)
      const searchParams = url.searchParams.toString()
      const backendUrl = `${BACKEND_URL}/api/v1/system${searchParams ? '?' + searchParams : ''}`
      
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: request.body
      })
      
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('System API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// 配置版本管理器
export const configVersionManager = {
  async handleConfigAPI(request: NextRequest) {
    try {
      const url = new URL(request.url)
      const searchParams = url.searchParams.toString()
      const backendUrl = `${BACKEND_URL}/api/v1/config${searchParams ? '?' + searchParams : ''}`
      
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: request.body
      })
      
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('Config API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// 批量设备管理器
export const batchDeviceManager = {
  async handleBatchAPI(request: NextRequest) {
    try {
      const url = new URL(request.url)
      const searchParams = url.searchParams.toString()
      const backendUrl = `${BACKEND_URL}/api/v1/devices/batch${searchParams ? '?' + searchParams : ''}`
      
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: request.body
      })
      
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('Batch Device API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// 实时监控预览
export const realTimeMonitoringPreview = {
  async handleMonitoringAPI(request: NextRequest) {
    try {
      const url = new URL(request.url)
      const searchParams = url.searchParams.toString()
      const backendUrl = `${BACKEND_URL}/api/v1/monitoring${searchParams ? '?' + searchParams : ''}`
      
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: request.body
      })
      
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('Monitoring API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// 高级告警规则管理器
export const advancedAlertRulesManager = {
  async handleAlertAPI(request: NextRequest) {
    try {
      const url = new URL(request.url)
      const searchParams = url.searchParams.toString()
      const backendUrl = `${BACKEND_URL}/api/v1/alerts${searchParams ? '?' + searchParams : ''}`
      
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: request.body
      })
      
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('Alert API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// 配置合规扫描器
export const configComplianceScanner = {
  async handleComplianceAPI(request: NextRequest) {
    try {
      const url = new URL(request.url)
      const searchParams = url.searchParams.toString()
      const backendUrl = `${BACKEND_URL}/api/v1/compliance${searchParams ? '?' + searchParams : ''}`
      
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: request.body
      })
      
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('Compliance API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// 性能基准优化器
export const performanceBenchmarkOptimizer = {
  async handlePerformanceAPI(request: NextRequest) {
    try {
      const url = new URL(request.url)
      const searchParams = url.searchParams.toString()
      const backendUrl = `${BACKEND_URL}/api/v1/performance${searchParams ? '?' + searchParams : ''}`
      
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: request.body
      })
      
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('Performance API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// 增强OID管理器
export const enhancedOIDManager = {
  async handleOIDAPI(request: NextRequest) {
    try {
      const url = new URL(request.url)
      const searchParams = url.searchParams.toString()
      const backendUrl = `${BACKEND_URL}/api/v1/oids${searchParams ? '?' + searchParams : ''}`
      
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: request.body
      })
      
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('OID API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// 导出所有处理函数
export const handleSystemAPI = systemIntegrationManager.handleSystemAPI
export const handleConfigAPI = configVersionManager.handleConfigAPI
export const handleBatchAPI = batchDeviceManager.handleBatchAPI
export const handleMonitoringAPI = realTimeMonitoringPreview.handleMonitoringAPI
export const handleAlertAPI = advancedAlertRulesManager.handleAlertAPI
export const handleComplianceAPI = configComplianceScanner.handleComplianceAPI
export const handlePerformanceAPI = performanceBenchmarkOptimizer.handlePerformanceAPI
export const handleOIDAPI = enhancedOIDManager.handleOIDAPI