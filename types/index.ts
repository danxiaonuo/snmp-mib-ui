// 平台核心类型定义

export interface Device {
  id: string
  name: string
  type: 'switch' | 'router' | 'server' | 'firewall' | 'other'
  ip: string
  status: 'online' | 'offline' | 'warning' | 'error'
  location: string
  model: string
  vendor?: string
  uptime: string
  lastSeen: string
  snmpCommunity?: string
  snmpVersion?: '1' | '2c' | '3'
  description?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface MIB {
  id: string
  name: string
  filename: string
  size: string
  uploadDate: string
  status: 'validated' | 'error' | 'pending' | 'processing'
  description?: string
  version?: string
  organization?: string
  oids?: OID[]
  errors?: string[]
  createdAt: string
  updatedAt: string
}

export interface OID {
  id: string
  name: string
  oid: string
  type: 'INTEGER' | 'STRING' | 'COUNTER' | 'GAUGE' | 'TIMETICKS' | 'OBJECT_IDENTIFIER'
  access: 'read-only' | 'read-write' | 'write-only' | 'not-accessible'
  description?: string
  syntax?: string
  parent?: string
  children?: OID[]
}

export interface AlertRule {
  id: string
  name: string
  description: string
  expression: string
  duration: string
  severity: 'info' | 'warning' | 'critical'
  status: 'active' | 'inactive' | 'pending'
  groupId?: string
  deviceGroupId?: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface AlertRuleTemplate {
  id: string
  name: string
  description: string
  category: string
  vendor?: string
  deviceType?: string
  expression: string
  duration: string
  severity: 'info' | 'warning' | 'critical'
  labels?: Record<string, string>
  annotations?: Record<string, string>
  variables?: Record<string, any>
  isBuiltin: boolean
  usageCount: number
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface DeviceGroup {
  id: string
  name: string
  description: string
  tags?: Record<string, string>
  selector?: Record<string, any>
  devices?: Device[]
  deviceCount?: number
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface MonitoringComponent {
  id: string
  name: string
  description: string
  category: 'collector' | 'storage' | 'visualization' | 'alerting'
  version: string
  status: 'available' | 'installed' | 'running' | 'stopped' | 'error'
  health?: 'healthy' | 'unhealthy' | 'unknown'
  dependencies?: string[]
  ports?: number[]
  configurable: boolean
  required: boolean
  dockerImage?: string
  documentation?: string
}

export interface SNMPRequest {
  target: string
  oid: string
  community: string
  version: '1' | '2c' | '3'
  operation: 'get' | 'walk' | 'set'
  value?: string
  timeout?: number
  retries?: number
}

export interface SNMPResponse {
  success: boolean
  data?: any
  error?: string
  timestamp: string
  duration: number
}

export interface BulkOperation {
  id: string
  type: 'snmp' | 'discovery' | 'config'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  message?: string
  targets: string[]
  results?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Alert {
  id: string
  ruleId: string
  ruleName: string
  status: 'firing' | 'resolved'
  severity: 'info' | 'warning' | 'critical'
  message: string
  labels: Record<string, string>
  annotations: Record<string, string>
  startsAt: string
  endsAt?: string
  generatorURL?: string
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded'
  services: Record<string, 'healthy' | 'unhealthy' | 'unknown'>
  timestamp: string
  version: string
  uptime: number
  environment: string
}

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'operator' | 'viewer'
  permissions: string[]
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 请求类型
export interface CreateDeviceRequest {
  name: string
  type: Device['type']
  ip: string
  location: string
  model: string
  vendor?: string
  snmpCommunity?: string
  snmpVersion?: Device['snmpVersion']
  description?: string
  tags?: string[]
}

export interface UpdateDeviceRequest extends Partial<CreateDeviceRequest> {}

export interface CreateAlertRuleRequest {
  name: string
  description: string
  expression: string
  duration: string
  severity: AlertRule['severity']
  groupId?: string
  deviceGroupId?: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
}

export interface UpdateAlertRuleRequest extends Partial<CreateAlertRuleRequest> {}

export interface DiscoveryRequest {
  ipRange: string
  community: string
  snmpVersion: '1' | '2c' | '3'
  timeout?: number
  concurrent?: number
}

export interface DiscoveryResult {
  ip: string
  hostname?: string
  vendor?: string
  model?: string
  description?: string
  uptime?: string
  contact?: string
  location?: string
  services?: string[]
  success: boolean
  error?: string
}

// 配置类型
export interface AppConfig {
  app: {
    name: string
    version: string
    environment: string
  }
  database: {
    url: string
    maxConnections: number
  }
  redis: {
    url: string
    keyPrefix: string
  }
  monitoring: {
    enabled: boolean
    components: string[]
  }
  snmp: {
    defaultCommunity: string
    defaultVersion: string
    timeout: number
    retries: number
  }
}

// 事件类型
export interface SystemEvent {
  id: string
  type: 'device' | 'alert' | 'system' | 'user'
  action: string
  description: string
  severity: 'info' | 'warning' | 'error'
  source: string
  userId?: string
  deviceId?: string
  metadata?: Record<string, any>
  timestamp: string
}

// 统计类型
export interface DashboardStats {
  devices: {
    total: number
    online: number
    offline: number
    warning: number
  }
  mibs: {
    total: number
    validated: number
    errors: number
  }
  alerts: {
    total: number
    firing: number
    resolved: number
  }
  system: {
    health: 'healthy' | 'unhealthy' | 'degraded'
    uptime: number
    version: string
  }
}