// 实时监控数据预览和测试系统
import { EventEmitter } from 'events'
import WebSocket from 'ws'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface MonitoringMetric {
  name: string
  oid: string
  value: string | number
  unit?: string
  timestamp: Date
  deviceId: string
  type: 'gauge' | 'counter' | 'histogram' | 'summary'
  labels: Record<string, string>
  help?: string
}

export interface MonitoringAlert {
  id: string
  name: string
  severity: 'info' | 'warning' | 'critical'
  status: 'firing' | 'resolved'
  message: string
  deviceId: string
  metric: string
  threshold: number
  value: number
  timestamp: Date
  labels: Record<string, string>
}

export interface DeviceStatus {
  deviceId: string
  status: 'online' | 'offline' | 'degraded' | 'unknown'
  lastSeen: Date
  responseTime: number
  availability: number
  errors: string[]
  metrics: MonitoringMetric[]
  alerts: MonitoringAlert[]
}

export interface MonitoringSession {
  id: string
  deviceIds: string[]
  oids: string[]
  interval: number
  duration?: number
  startTime: Date
  endTime?: Date
  status: 'running' | 'stopped' | 'completed' | 'error'
  collectedMetrics: MonitoringMetric[]
  alerts: MonitoringAlert[]
  config: {
    enableAlerts: boolean
    alertThresholds: Record<string, number>
    exportFormat: 'prometheus' | 'influxdb' | 'json'
    storageEnabled: boolean
  }
}

export interface MonitoringTemplate {
  id: string
  name: string
  description: string
  vendor: string
  deviceType: string
  metrics: Array<{
    name: string
    oid: string
    type: 'gauge' | 'counter'
    unit?: string
    description: string
    alertThresholds?: {
      warning?: number
      critical?: number
    }
  }>
  intervals: {
    default: number
    fast: number
    slow: number
  }
  labels: Record<string, string>
}

export class RealTimeMonitoringPreview extends EventEmitter {
  private activeSessions: Map<string, MonitoringSession> = new Map()
  private deviceStatuses: Map<string, DeviceStatus> = new Map()
  private wsServer?: WebSocket.Server
  private templates: Map<string, MonitoringTemplate> = new Map()
  private alertRules: Map<string, any> = new Map()

  constructor() {
    super()
    this.initializeTemplates()
    this.initializeWebSocketServer()
  }

  // 初始化监控模板
  private initializeTemplates() {
    const templates: MonitoringTemplate[] = [
      {
        id: 'cisco_switch_basic',
        name: 'Cisco Switch Basic Monitoring',
        description: '思科交换机基础监控',
        vendor: 'cisco',
        deviceType: 'switch',
        metrics: [
          {
            name: 'system_uptime',
            oid: '1.3.6.1.2.1.1.3.0',
            type: 'gauge',
            unit: 'seconds',
            description: '系统运行时间'
          },
          {
            name: 'cpu_usage_1min',
            oid: '1.3.6.1.4.1.9.9.109.1.1.1.1.2',
            type: 'gauge',
            unit: 'percent',
            description: 'CPU使用率(1分钟)',
            alertThresholds: { warning: 80, critical: 90 }
          },
          {
            name: 'memory_used',
            oid: '1.3.6.1.4.1.9.9.48.1.1.1.5',
            type: 'gauge',
            unit: 'bytes',
            description: '内存使用量',
            alertThresholds: { warning: 80, critical: 90 }
          },
          {
            name: 'interface_in_octets',
            oid: '1.3.6.1.2.1.2.2.1.10',
            type: 'counter',
            unit: 'bytes',
            description: '接口入流量'
          },
          {
            name: 'interface_out_octets',
            oid: '1.3.6.1.2.1.2.2.1.16',
            type: 'counter',
            unit: 'bytes',
            description: '接口出流量'
          },
          {
            name: 'interface_oper_status',
            oid: '1.3.6.1.2.1.2.2.1.8',
            type: 'gauge',
            description: '接口运行状态'
          }
        ],
        intervals: {
          default: 30,
          fast: 10,
          slow: 60
        },
        labels: {
          vendor: 'cisco',
          type: 'switch'
        }
      },
      {
        id: 'h3c_switch_basic',
        name: 'H3C Switch Basic Monitoring',
        description: 'H3C交换机基础监控',
        vendor: 'h3c',
        deviceType: 'switch',
        metrics: [
          {
            name: 'system_uptime',
            oid: '1.3.6.1.2.1.1.3.0',
            type: 'gauge',
            unit: 'seconds',
            description: '系统运行时间'
          },
          {
            name: 'cpu_usage',
            oid: '1.3.6.1.4.1.25506.2.6.1.1.1.1.6',
            type: 'gauge',
            unit: 'percent',
            description: 'CPU使用率',
            alertThresholds: { warning: 80, critical: 90 }
          },
          {
            name: 'memory_usage',
            oid: '1.3.6.1.4.1.25506.2.6.1.1.1.1.8',
            type: 'gauge',
            unit: 'percent',
            description: '内存使用率',
            alertThresholds: { warning: 80, critical: 90 }
          },
          {
            name: 'temperature',
            oid: '1.3.6.1.4.1.25506.2.6.1.1.1.1.12',
            type: 'gauge',
            unit: 'celsius',
            description: '设备温度',
            alertThresholds: { warning: 65, critical: 75 }
          }
        ],
        intervals: {
          default: 30,
          fast: 10,
          slow: 60
        },
        labels: {
          vendor: 'h3c',
          type: 'switch'
        }
      },
      {
        id: 'huawei_switch_basic',
        name: 'Huawei Switch Basic Monitoring',
        description: '华为交换机基础监控',
        vendor: 'huawei',
        deviceType: 'switch',
        metrics: [
          {
            name: 'system_uptime',
            oid: '1.3.6.1.2.1.1.3.0',
            type: 'gauge',
            unit: 'seconds',
            description: '系统运行时间'
          },
          {
            name: 'cpu_usage',
            oid: '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.5',
            type: 'gauge',
            unit: 'percent',
            description: 'CPU使用率',
            alertThresholds: { warning: 80, critical: 90 }
          },
          {
            name: 'memory_usage',
            oid: '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.7',
            type: 'gauge',
            unit: 'percent',
            description: '内存使用率',
            alertThresholds: { warning: 80, critical: 90 }
          },
          {
            name: 'temperature',
            oid: '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.11',
            type: 'gauge',
            unit: 'celsius',
            description: '设备温度',
            alertThresholds: { warning: 65, critical: 75 }
          }
        ],
        intervals: {
          default: 30,
          fast: 10,
          slow: 60
        },
        labels: {
          vendor: 'huawei',
          type: 'switch'
        }
      }
    ]

    templates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  // 初始化WebSocket服务器
  private initializeWebSocketServer() {
    try {
      this.wsServer = new WebSocket.Server({ port: 8080 })
      
      this.wsServer.on('connection', (ws) => {
        console.log('WebSocket client connected')
        
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString())
            this.handleWebSocketMessage(ws, data)
          } catch (error) {
            console.error('Invalid WebSocket message:', error)
          }
        })
        
        ws.on('close', () => {
          console.log('WebSocket client disconnected')
        })
      })
      
      console.log('WebSocket server started on port 8080')
    } catch (error) {
      console.error('Failed to start WebSocket server:', error)
    }
  }

  // 处理WebSocket消息
  private handleWebSocketMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'subscribe_device':
        this.subscribeToDevice(ws, data.deviceId)
        break
      case 'unsubscribe_device':
        this.unsubscribeFromDevice(ws, data.deviceId)
        break
      case 'subscribe_session':
        this.subscribeToSession(ws, data.sessionId)
        break
      case 'request_metrics':
        this.sendCurrentMetrics(ws, data.deviceId)
        break
    }
  }

  // 订阅设备监控
  private subscribeToDevice(ws: WebSocket, deviceId: string) {
    // 实现设备订阅逻辑
    const deviceStatus = this.deviceStatuses.get(deviceId)
    if (deviceStatus) {
      ws.send(JSON.stringify({
        type: 'device_status',
        deviceId,
        data: deviceStatus
      }))
    }
  }

  // 取消设备订阅
  private unsubscribeFromDevice(ws: WebSocket, deviceId: string) {
    // 实现取消订阅逻辑
  }

  // 订阅监控会话
  private subscribeToSession(ws: WebSocket, sessionId: string) {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      ws.send(JSON.stringify({
        type: 'session_status',
        sessionId,
        data: session
      }))
    }
  }

  // 发送当前指标
  private sendCurrentMetrics(ws: WebSocket, deviceId: string) {
    const deviceStatus = this.deviceStatuses.get(deviceId)
    if (deviceStatus) {
      ws.send(JSON.stringify({
        type: 'current_metrics',
        deviceId,
        metrics: deviceStatus.metrics
      }))
    }
  }

  // 创建监控会话
  async createMonitoringSession(
    deviceIds: string[],
    templateId?: string,
    customOids?: string[],
    config?: Partial<MonitoringSession['config']>
  ): Promise<MonitoringSession> {
    const sessionId = `session_${Date.now()}`
    
    let oids: string[] = []
    if (templateId) {
      const template = this.templates.get(templateId)
      if (template) {
        oids = template.metrics.map(m => m.oid)
      }
    }
    
    if (customOids) {
      oids = [...oids, ...customOids]
    }
    
    const session: MonitoringSession = {
      id: sessionId,
      deviceIds,
      oids,
      interval: 30, // 默认30秒
      startTime: new Date(),
      status: 'running',
      collectedMetrics: [],
      alerts: [],
      config: {
        enableAlerts: config?.enableAlerts ?? true,
        alertThresholds: config?.alertThresholds || {},
        exportFormat: config?.exportFormat || 'prometheus',
        storageEnabled: config?.storageEnabled ?? false
      }
    }
    
    this.activeSessions.set(sessionId, session)
    
    // 开始数据收集
    this.startDataCollection(session)
    
    this.emit('sessionCreated', session)
    return session
  }

  // 开始数据收集
  private async startDataCollection(session: MonitoringSession) {
    const intervalId = setInterval(async () => {
      if (session.status !== 'running') {
        clearInterval(intervalId)
        return
      }
      
      try {
        await this.collectSessionData(session)
      } catch (error) {
        console.error(`Data collection error for session ${session.id}:`, error)
        session.status = 'error'
        clearInterval(intervalId)
      }
    }, session.interval * 1000)
    
    // 如果设置了持续时间，自动停止
    if (session.duration) {
      setTimeout(() => {
        session.status = 'completed'
        session.endTime = new Date()
        clearInterval(intervalId)
        this.emit('sessionCompleted', session)
      }, session.duration * 1000)
    }
  }

  // 收集会话数据
  private async collectSessionData(session: MonitoringSession) {
    const collectionPromises = session.deviceIds.map(deviceId => 
      this.collectDeviceMetrics(deviceId, session.oids)
    )
    
    const results = await Promise.allSettled(collectionPromises)
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const deviceId = session.deviceIds[i]
      
      if (result.status === 'fulfilled') {
        const metrics = result.value
        session.collectedMetrics.push(...metrics)
        
        // 更新设备状态
        this.updateDeviceStatus(deviceId, metrics)
        
        // 检查告警
        if (session.config.enableAlerts) {
          const alerts = this.checkAlerts(deviceId, metrics, session.config.alertThresholds)
          session.alerts.push(...alerts)
        }
        
        // 通过WebSocket广播实时数据
        this.broadcastMetrics(deviceId, metrics)
        
      } else {
        console.error(`Failed to collect metrics for device ${deviceId}:`, result.reason)
        this.updateDeviceStatus(deviceId, [], false)
      }
    }
    
    this.emit('dataCollected', {
      sessionId: session.id,
      metricsCount: session.collectedMetrics.length,
      alertsCount: session.alerts.length
    })
  }

  // 收集设备指标
  private async collectDeviceMetrics(deviceId: string, oids: string[]): Promise<MonitoringMetric[]> {
    const metrics: MonitoringMetric[] = []
    
    // 这里需要从设备管理器获取设备信息
    // 为了演示，我们使用模拟数据
    const device = {
      id: deviceId,
      ip: '192.168.1.1',
      snmpConfig: {
        community: 'public',
        version: '2c' as const,
        port: 161
      }
    }
    
    // 批量获取OID值
    const oidPromises = oids.map(oid => this.getSNMPValue(device, oid))
    const oidResults = await Promise.allSettled(oidPromises)
    
    for (let i = 0; i < oids.length; i++) {
      const oid = oids[i]
      const result = oidResults[i]
      
      if (result.status === 'fulfilled' && result.value.success) {
        const metric: MonitoringMetric = {
          name: this.getMetricNameFromOID(oid),
          oid,
          value: this.parseMetricValue(result.value.value, result.value.type),
          timestamp: new Date(),
          deviceId,
          type: this.getMetricType(oid),
          labels: {
            device: deviceId,
            oid
          }
        }
        
        metrics.push(metric)
      }
    }
    
    return metrics
  }

  // 获取SNMP值
  private async getSNMPValue(device: any, oid: string): Promise<{ success: boolean, value: string, type: string }> {
    try {
      const command = `snmpget -v${device.snmpConfig.version} -c ${device.snmpConfig.community} -r1 -t3 ${device.ip}:${device.snmpConfig.port} ${oid}`
      
      const { stdout } = await execAsync(command, { timeout: 5000 })
      
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n')
        for (const line of lines) {
          if (line.includes('=')) {
            const parts = line.split('=', 2)
            if (parts.length === 2) {
              const valueWithType = parts[1].trim()
              let type = 'STRING'
              let value = valueWithType
              
              if (valueWithType.includes(':')) {
                const typeParts = valueWithType.split(':', 2)
                type = typeParts[0].trim()
                value = typeParts[1].trim()
              }
              
              value = value.replace(/^"(.*)"$/, '$1')
              
              return { success: true, value, type }
            }
          }
        }
      }
      
      return { success: false, value: '', type: '' }
      
    } catch (error) {
      console.error(`SNMP get failed for ${oid}:`, error)
      return { success: false, value: '', type: '' }
    }
  }

  // 解析指标值
  private parseMetricValue(value: string, type: string): string | number {
    switch (type.toUpperCase()) {
      case 'INTEGER':
      case 'GAUGE32':
      case 'COUNTER32':
      case 'COUNTER64':
      case 'TIMETICKS':
        const num = parseInt(value)
        return isNaN(num) ? value : num
      case 'STRING':
      case 'OCTET STRING':
      default:
        return value
    }
  }

  // 从OID获取指标名称
  private getMetricNameFromOID(oid: string): string {
    const oidMap: Record<string, string> = {
      '1.3.6.1.2.1.1.3.0': 'system_uptime',
      '1.3.6.1.4.1.9.9.109.1.1.1.1.2': 'cisco_cpu_1min',
      '1.3.6.1.4.1.9.9.48.1.1.1.5': 'cisco_memory_used',
      '1.3.6.1.4.1.25506.2.6.1.1.1.1.6': 'h3c_cpu_usage',
      '1.3.6.1.4.1.25506.2.6.1.1.1.1.8': 'h3c_memory_usage',
      '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.5': 'huawei_cpu_usage',
      '1.3.6.1.2.1.2.2.1.10': 'interface_in_octets',
      '1.3.6.1.2.1.2.2.1.16': 'interface_out_octets',
      '1.3.6.1.2.1.2.2.1.8': 'interface_oper_status'
    }
    
    // 处理表格OID（带索引）
    for (const baseOid in oidMap) {
      if (oid.startsWith(baseOid)) {
        const index = oid.substring(baseOid.length + 1)
        return `${oidMap[baseOid]}{index="${index}"}`
      }
    }
    
    return oidMap[oid] || `oid_${oid.replace(/\./g, '_')}`
  }

  // 获取指标类型
  private getMetricType(oid: string): MonitoringMetric['type'] {
    if (oid.includes('octets') || oid.includes('counter')) {
      return 'counter'
    }
    return 'gauge'
  }

  // 更新设备状态
  private updateDeviceStatus(deviceId: string, metrics: MonitoringMetric[], success: boolean = true) {
    const now = new Date()
    let deviceStatus = this.deviceStatuses.get(deviceId)
    
    if (!deviceStatus) {
      deviceStatus = {
        deviceId,
        status: 'unknown',
        lastSeen: now,
        responseTime: 0,
        availability: 0,
        errors: [],
        metrics: [],
        alerts: []
      }
    }
    
    if (success) {
      deviceStatus.status = 'online'
      deviceStatus.lastSeen = now
      deviceStatus.metrics = metrics
      deviceStatus.errors = []
    } else {
      deviceStatus.status = 'offline'
      deviceStatus.errors.push(`Failed to collect metrics at ${now.toISOString()}`)
    }
    
    this.deviceStatuses.set(deviceId, deviceStatus)
    
    // 通过WebSocket广播设备状态
    this.broadcastDeviceStatus(deviceStatus)
  }

  // 检查告警
  private checkAlerts(deviceId: string, metrics: MonitoringMetric[], thresholds: Record<string, number>): MonitoringAlert[] {
    const alerts: MonitoringAlert[] = []
    
    for (const metric of metrics) {
      const threshold = thresholds[metric.name]
      if (threshold !== undefined && typeof metric.value === 'number') {
        if (metric.value > threshold) {
          const alert: MonitoringAlert = {
            id: `alert_${Date.now()}_${deviceId}_${metric.name}`,
            name: `${metric.name}_high`,
            severity: metric.value > threshold * 1.2 ? 'critical' : 'warning',
            status: 'firing',
            message: `${metric.name} is ${metric.value}${metric.unit || ''}, exceeds threshold ${threshold}${metric.unit || ''}`,
            deviceId,
            metric: metric.name,
            threshold,
            value: metric.value,
            timestamp: new Date(),
            labels: metric.labels
          }
          
          alerts.push(alert)
        }
      }
    }
    
    return alerts
  }

  // 广播指标数据
  private broadcastMetrics(deviceId: string, metrics: MonitoringMetric[]) {
    if (!this.wsServer) return
    
    const message = JSON.stringify({
      type: 'metrics_update',
      deviceId,
      metrics,
      timestamp: new Date().toISOString()
    })
    
    this.wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  // 广播设备状态
  private broadcastDeviceStatus(deviceStatus: DeviceStatus) {
    if (!this.wsServer) return
    
    const message = JSON.stringify({
      type: 'device_status_update',
      deviceId: deviceStatus.deviceId,
      status: deviceStatus,
      timestamp: new Date().toISOString()
    })
    
    this.wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  // 停止监控会话
  async stopSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.status = 'stopped'
      session.endTime = new Date()
      this.emit('sessionStopped', session)
    }
  }

  // 获取会话
  getSession(sessionId: string): MonitoringSession | undefined {
    return this.activeSessions.get(sessionId)
  }

  // 获取所有活动会话
  getActiveSessions(): MonitoringSession[] {
    return Array.from(this.activeSessions.values())
  }

  // 获取设备状态
  getDeviceStatus(deviceId: string): DeviceStatus | undefined {
    return this.deviceStatuses.get(deviceId)
  }

  // 获取监控模板
  getTemplates(): MonitoringTemplate[] {
    return Array.from(this.templates.values())
  }

  // 导出会话数据
  async exportSessionData(sessionId: string, format: 'json' | 'csv' | 'prometheus'): Promise<string> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }
    
    switch (format) {
      case 'json':
        return JSON.stringify({
          session: {
            id: session.id,
            startTime: session.startTime,
            endTime: session.endTime,
            status: session.status
          },
          metrics: session.collectedMetrics,
          alerts: session.alerts
        }, null, 2)
        
      case 'csv':
        const csvHeaders = 'timestamp,device_id,metric_name,oid,value,unit,type'
        const csvRows = session.collectedMetrics.map(metric => 
          `${metric.timestamp.toISOString()},${metric.deviceId},${metric.name},${metric.oid},${metric.value},${metric.unit || ''},${metric.type}`
        )
        return [csvHeaders, ...csvRows].join('\n')
        
      case 'prometheus':
        return this.exportPrometheusFormat(session.collectedMetrics)
        
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  // 导出Prometheus格式
  private exportPrometheusFormat(metrics: MonitoringMetric[]): string {
    const lines: string[] = []
    const metricGroups = new Map<string, MonitoringMetric[]>()
    
    // 按指标名分组
    for (const metric of metrics) {
      const baseName = metric.name.split('{')[0]
      if (!metricGroups.has(baseName)) {
        metricGroups.set(baseName, [])
      }
      metricGroups.get(baseName)!.push(metric)
    }
    
    // 生成Prometheus格式
    for (const [metricName, metricList] of metricGroups) {
      if (metricList.length > 0) {
        const sample = metricList[0]
        lines.push(`# HELP ${metricName} ${sample.help || 'Metric from SNMP'}`)
        lines.push(`# TYPE ${metricName} ${sample.type}`)
        
        for (const metric of metricList) {
          const labels = Object.entries(metric.labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(',')
          
          const labelString = labels ? `{${labels}}` : ''
          lines.push(`${metricName}${labelString} ${metric.value} ${metric.timestamp.getTime()}`)
        }
        
        lines.push('')
      }
    }
    
    return lines.join('\n')
  }

  // 测试设备连接和指标收集
  async testDeviceMetrics(
    deviceId: string,
    deviceConfig: {
      ip: string
      snmpConfig: {
        community: string
        version: '1' | '2c' | '3'
        port?: number
      }
    },
    templateId?: string
  ): Promise<{
    success: boolean
    metrics: MonitoringMetric[]
    errors: string[]
    responseTime: number
  }> {
    const startTime = Date.now()
    const result = {
      success: false,
      metrics: [] as MonitoringMetric[],
      errors: [] as string[],
      responseTime: 0
    }
    
    try {
      let oids: string[] = []
      
      if (templateId) {
        const template = this.templates.get(templateId)
        if (template) {
          oids = template.metrics.map(m => m.oid)
        } else {
          result.errors.push(`Template ${templateId} not found`)
          return result
        }
      } else {
        // 使用基础系统OID进行测试
        oids = [
          '1.3.6.1.2.1.1.1.0', // sysDescr
          '1.3.6.1.2.1.1.3.0', // sysUpTime
          '1.3.6.1.2.1.1.5.0'  // sysName
        ]
      }
      
      const device = {
        id: deviceId,
        ip: deviceConfig.ip,
        snmpConfig: {
          ...deviceConfig.snmpConfig,
          port: deviceConfig.snmpConfig.port || 161
        }
      }
      
      const metrics = await this.collectDeviceMetrics(deviceId, oids)
      
      result.metrics = metrics
      result.success = metrics.length > 0
      
      if (metrics.length === 0) {
        result.errors.push('No metrics collected')
      }
      
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }
    
    result.responseTime = Date.now() - startTime
    return result
  }
}

// 导出监控预览实例
export const realTimeMonitoringPreview = new RealTimeMonitoringPreview()