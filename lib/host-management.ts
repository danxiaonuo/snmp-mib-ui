// 主机管理核心服务
export interface Host {
  id: string
  name: string
  ip: string
  hostname?: string
  os: string
  osVersion: string
  arch: string
  status: 'online' | 'offline' | 'unknown'
  cpuCores: number
  memory: number // MB
  disk: number // GB
  location: string
  group: string
  tags: string[]
  discoveredAt: string
  lastSeen: string
  // 监控相关
  monitoringEnabled: boolean
  installedComponents: string[]
  availableComponents: string[]
  // 连接信息
  sshPort: number
  sshUser?: string
  sshKeyPath?: string
  // 元数据
  metadata: Record<string, any>
}

export interface HostGroup {
  id: string
  name: string
  description: string
  hostIds: string[]
  defaultComponents: string[]
  deploymentTemplate: string
}

export class HostManager {
  private hosts: Map<string, Host> = new Map()
  private groups: Map<string, HostGroup> = new Map()

  // 从发现模块添加主机
  addDiscoveredHost(hostData: Partial<Host>): Host {
    const host: Host = {
      id: hostData.id || this.generateId(),
      name: hostData.name || `host-${hostData.ip}`,
      ip: hostData.ip!,
      hostname: hostData.hostname,
      os: hostData.os || 'Unknown',
      osVersion: hostData.osVersion || '',
      arch: hostData.arch || 'x86_64',
      status: hostData.status || 'unknown',
      cpuCores: hostData.cpuCores || 0,
      memory: hostData.memory || 0,
      disk: hostData.disk || 0,
      location: hostData.location || '',
      group: hostData.group || 'default',
      tags: hostData.tags || [],
      discoveredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      monitoringEnabled: false,
      installedComponents: [],
      availableComponents: this.detectAvailableComponents(hostData),
      sshPort: 22,
      metadata: hostData.metadata || {}
    }

    this.hosts.set(host.id, host)
    return host
  }

  // 检测主机可用的监控组件
  private detectAvailableComponents(hostData: Partial<Host>): string[] {
    const components: string[] = []
    
    // 基础组件 - 所有Linux主机都支持
    if (hostData.os?.toLowerCase().includes('linux') || hostData.os?.toLowerCase().includes('ubuntu')) {
      components.push('node-exporter', 'categraf')
    }
    
    // Windows主机
    if (hostData.os?.toLowerCase().includes('windows')) {
      components.push('windows-exporter')
    }
    
    // 根据开放端口检测服务
    if (hostData.metadata?.openPorts?.includes(3306)) {
      components.push('mysqld-exporter')
    }
    if (hostData.metadata?.openPorts?.includes(5432)) {
      components.push('postgres-exporter')
    }
    if (hostData.metadata?.openPorts?.includes(6379)) {
      components.push('redis-exporter')
    }
    
    // 高配置主机可以部署存储和可视化组件
    if ((hostData.memory || 0) >= 4096) {
      components.push('victoriametrics', 'grafana')
    }
    if ((hostData.memory || 0) >= 8192) {
      components.push('vmstorage', 'vminsert', 'vmselect')
    }
    
    return components
  }

  // 获取可用于部署的主机
  getAvailableHosts(componentId?: string): Host[] {
    const hosts = Array.from(this.hosts.values()).filter(host => 
      host.status === 'online' && 
      (!componentId || host.availableComponents.includes(componentId))
    )
    return hosts
  }

  // 按组获取主机
  getHostsByGroup(groupId: string): Host[] {
    const group = this.groups.get(groupId)
    if (!group) return []
    
    return group.hostIds.map(id => this.hosts.get(id)).filter(Boolean) as Host[]
  }

  // 更新主机监控状态
  updateHostMonitoring(hostId: string, components: string[]): void {
    const host = this.hosts.get(hostId)
    if (host) {
      host.installedComponents = components
      host.monitoringEnabled = components.length > 0
      host.lastSeen = new Date().toISOString()
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}

// 全局主机管理器实例
export const hostManager = new HostManager()