// 真实API客户端 - 替换模拟数据
import { Device, MIB, AlertRule, MonitoringComponent } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // 设备管理API
  async getDevices(params?: {
    page?: number
    limit?: number
    search?: string
    type?: string
    status?: string
  }): Promise<{ devices: Device[], total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.type) searchParams.set('type', params.type)
    if (params?.status) searchParams.set('status', params.status)

    return this.request(`/devices?${searchParams}`)
  }

  async getDevice(id: string): Promise<Device> {
    return this.request(`/devices/${id}`)
  }

  async createDevice(device: Omit<Device, 'id'>): Promise<Device> {
    return this.request('/devices', {
      method: 'POST',
      body: JSON.stringify(device),
    })
  }

  async updateDevice(id: string, device: Partial<Device>): Promise<Device> {
    return this.request(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(device),
    })
  }

  async deleteDevice(id: string): Promise<void> {
    return this.request(`/devices/${id}`, {
      method: 'DELETE',
    })
  }

  // MIB管理API
  async getMIBs(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<{ mibs: MIB[], total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)

    return this.request(`/mibs?${searchParams}`)
  }

  async getMIB(id: string): Promise<MIB> {
    return this.request(`/mibs/${id}`)
  }

  async uploadMIB(file: File): Promise<MIB> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/mibs/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`MIB上传失败: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async deleteMIB(id: string): Promise<void> {
    return this.request(`/mibs/${id}`, {
      method: 'DELETE',
    })
  }

  // 告警规则API
  async getAlertRules(params?: {
    page?: number
    limit?: number
    search?: string
    groupId?: string
    status?: string
  }): Promise<{ rules: AlertRule[], total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.groupId) searchParams.set('groupId', params.groupId)
    if (params?.status) searchParams.set('status', params.status)

    return this.request(`/alert-rules?${searchParams}`)
  }

  async getAlertRule(id: string): Promise<AlertRule> {
    return this.request(`/alert-rules/${id}`)
  }

  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    return this.request('/alert-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    })
  }

  async updateAlertRule(id: string, rule: Partial<AlertRule>): Promise<AlertRule> {
    return this.request(`/alert-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    })
  }

  async deleteAlertRule(id: string): Promise<void> {
    return this.request(`/alert-rules/${id}`, {
      method: 'DELETE',
    })
  }

  // 监控组件API
  async getMonitoringComponents(): Promise<MonitoringComponent[]> {
    return this.request('/monitoring/components')
  }

  async installMonitoringComponent(componentId: string, config: any): Promise<{ success: boolean, message: string }> {
    return this.request('/monitoring/install', {
      method: 'POST',
      body: JSON.stringify({ componentId, config }),
    })
  }

  async getMonitoringStatus(): Promise<{ components: Array<{ id: string, status: string, health: string }> }> {
    return this.request('/monitoring/status')
  }

  // SNMP操作API
  async performSNMPWalk(target: string, oid: string, community: string): Promise<any> {
    return this.request('/snmp/walk', {
      method: 'POST',
      body: JSON.stringify({ target, oid, community }),
    })
  }

  async performSNMPGet(target: string, oid: string, community: string): Promise<any> {
    return this.request('/snmp/get', {
      method: 'POST',
      body: JSON.stringify({ target, oid, community }),
    })
  }

  // 系统健康检查API
  async getHealthStatus(): Promise<{
    status: string
    services: Record<string, string>
    timestamp: string
    version: string
    uptime: number
  }> {
    return this.request('/health')
  }
}

export const apiClient = new ApiClient()
export default apiClient