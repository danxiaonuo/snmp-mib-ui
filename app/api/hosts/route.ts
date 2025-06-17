import { NextRequest, NextResponse } from 'next/server'
import { hostManager } from '@/lib/host-management'

// 模拟从发现模块获取的主机数据
const mockDiscoveredHosts = [
  {
    id: '1',
    name: 'web-server-01',
    ip: '192.168.1.10',
    hostname: 'web01.company.com',
    os: 'Ubuntu',
    osVersion: '22.04',
    arch: 'x86_64',
    status: 'online' as const,
    cpuCores: 8,
    memory: 16384,
    disk: 500,
    location: '数据中心A',
    group: 'web-servers',
    tags: ['production', 'web'],
    metadata: {
      openPorts: [22, 80, 443, 9100],
      services: ['nginx', 'node-exporter']
    }
  },
  {
    id: '2',
    name: 'db-server-01',
    ip: '192.168.1.20',
    hostname: 'db01.company.com',
    os: 'Ubuntu',
    osVersion: '20.04',
    arch: 'x86_64',
    status: 'online' as const,
    cpuCores: 16,
    memory: 32768,
    disk: 2000,
    location: '数据中心A',
    group: 'database-servers',
    tags: ['production', 'database'],
    metadata: {
      openPorts: [22, 3306, 9104],
      services: ['mysql', 'mysqld-exporter']
    }
  },
  {
    id: '3',
    name: 'monitor-server-01',
    ip: '192.168.1.30',
    hostname: 'monitor01.company.com',
    os: 'Ubuntu',
    osVersion: '22.04',
    arch: 'x86_64',
    status: 'online' as const,
    cpuCores: 12,
    memory: 24576,
    disk: 1000,
    location: '数据中心B',
    group: 'monitoring-servers',
    tags: ['production', 'monitoring'],
    metadata: {
      openPorts: [22, 3000, 9090, 8428],
      services: ['grafana', 'prometheus', 'victoriametrics']
    }
  },
  {
    id: '4',
    name: 'app-server-01',
    ip: '192.168.1.40',
    hostname: 'app01.company.com',
    os: 'CentOS',
    osVersion: '8',
    arch: 'x86_64',
    status: 'online' as const,
    cpuCores: 4,
    memory: 8192,
    disk: 200,
    location: '数据中心A',
    group: 'app-servers',
    tags: ['production', 'application'],
    metadata: {
      openPorts: [22, 8080, 9100],
      services: ['java', 'node-exporter']
    }
  },
  {
    id: '5',
    name: 'cache-server-01',
    ip: '192.168.1.50',
    hostname: 'cache01.company.com',
    os: 'Ubuntu',
    osVersion: '22.04',
    arch: 'x86_64',
    status: 'online' as const,
    cpuCores: 8,
    memory: 16384,
    disk: 100,
    location: '数据中心B',
    group: 'cache-servers',
    tags: ['production', 'cache'],
    metadata: {
      openPorts: [22, 6379, 9121],
      services: ['redis', 'redis-exporter']
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    // 初始化模拟数据到主机管理器
    mockDiscoveredHosts.forEach(hostData => {
      hostManager.addDiscoveredHost(hostData)
    })

    const { searchParams } = new URL(request.url)
    const componentId = searchParams.get('component')
    const group = searchParams.get('group')

    let hosts = hostManager.getAvailableHosts(componentId || undefined)

    // 按组过滤
    if (group && group !== 'all') {
      hosts = hostManager.getHostsByGroup(group)
    }

    return NextResponse.json({
      success: true,
      hosts,
      total: hosts.length
    })
  } catch (error) {
    console.error('获取主机列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取主机列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, hostData, hostIds, components } = body

    switch (action) {
      case 'add':
        // 添加新发现的主机
        const host = hostManager.addDiscoveredHost(hostData)
        return NextResponse.json({
          success: true,
          host
        })

      case 'update-monitoring':
        // 更新主机监控状态
        if (hostIds && components) {
          hostIds.forEach((hostId: string) => {
            hostManager.updateHostMonitoring(hostId, components)
          })
        }
        return NextResponse.json({
          success: true,
          message: '主机监控状态已更新'
        })

      case 'bulk-add':
        // 批量添加发现的主机
        const addedHosts = body.hosts.map((hostData: any) => 
          hostManager.addDiscoveredHost(hostData)
        )
        return NextResponse.json({
          success: true,
          hosts: addedHosts,
          count: addedHosts.length
        })

      default:
        return NextResponse.json(
          { success: false, error: '不支持的操作' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('主机操作失败:', error)
    return NextResponse.json(
      { success: false, error: '主机操作失败' },
      { status: 500 }
    )
  }
}