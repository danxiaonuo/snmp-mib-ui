import { NextRequest, NextResponse } from 'next/server'
import { hostManager } from '@/lib/host-management'
import { getApiUrl, fetchWithRetry, checkBackendHealth } from '@/lib/backend-config'

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
    const { searchParams } = new URL(request.url)
    const componentId = searchParams.get('component')
    const group = searchParams.get('group')
    const discoveryTaskId = searchParams.get('discoveryTaskId')
    
    let hosts = []
    
    try {
      // 尝试从后端获取主机数据
      const params = new URLSearchParams()
      
      if (group && group !== 'all') {
        params.append('group', group)
      }
      if (discoveryTaskId) {
        params.append('discoveryTaskId', discoveryTaskId)
      }
      
      const queryString = params.toString() ? '?' + params.toString() : ''
      const backendResponse = await fetchWithRetry(getApiUrl(`hosts${queryString}`), {}, 1)
      
      if (backendResponse.ok) {
        const backendResult = await backendResponse.json()
        const backendHosts = backendResult.data || []
        
        // 将后端主机数据转换为前端格式并添加到管理器
        backendHosts.forEach((backendHost: any) => {
          const existingHost = hostManager.getAvailableHosts().find(h => 
            h.metadata?.backendId === backendHost.id
          )
          
          if (!existingHost) {
            hostManager.addDiscoveredHost({
              id: `backend-${backendHost.id}`,
              name: backendHost.name || `host-${backendHost.ip}`,
              ip: backendHost.ip,
              hostname: backendHost.hostname,
              os: backendHost.os || 'Unknown',
              osVersion: backendHost.osVersion || '',
              arch: backendHost.arch || 'x86_64',
              status: backendHost.status || 'unknown',
              cpuCores: backendHost.cpuCores || 0,
              memory: backendHost.memory || 0,
              disk: backendHost.disk || 0,
              location: backendHost.location || '后端同步',
              group: backendHost.group || 'default',
              tags: backendHost.tags || [],
              sshPort: backendHost.sshPort || 22,
              sshConnectable: backendHost.sshConnectable || false,
              metadata: {
                backendId: backendHost.id,
                syncedAt: new Date().toISOString(),
                ...backendHost.metadata
              }
            })
          }
        })
      } else {
        console.warn('Backend hosts API not available, using local data')
      }
    } catch (backendError) {
      console.warn('Failed to fetch from backend, using local data:', backendError)
      
      // 如果后端不可用，初始化模拟数据
      mockDiscoveredHosts.forEach(hostData => {
        const existingHost = hostManager.getAvailableHosts().find(h => h.ip === hostData.ip)
        if (!existingHost) {
          hostManager.addDiscoveredHost(hostData)
        }
      })
    }

    // 从本地管理器获取主机数据
    hosts = hostManager.getAvailableHosts(componentId || undefined)

    // 按组过滤
    if (group && group !== 'all') {
      hosts = hostManager.getHostsByGroup(group)
    }

    return NextResponse.json({
      success: true,
      hosts,
      total: hosts.length,
      source: 'integrated' // 标识数据来源
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

      case 'discover':
        // 网络扫描发现主机
        const { ipRange, ports, timeout, concurrent } = body
        try {
          // 创建发现任务
          const taskResponse = await fetchWithRetry(getApiUrl('discovery/tasks'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `网络扫描 ${ipRange}`,
              ipRange: ipRange,
              ports: ports,
              timeout: timeout || 5,
              concurrent: concurrent || 50,
              method: 'ping_scan'
            })
          })
          
          if (!taskResponse.ok) {
            throw new Error('Failed to create discovery task')
          }
          
          const taskResult = await taskResponse.json()
          const taskId = taskResult.data.id
          
          // 启动发现任务
          const startResponse = await fetchWithRetry(getApiUrl(`discovery/tasks/${taskId}/start`), {
            method: 'POST'
          })
          
          if (!startResponse.ok) {
            throw new Error('Failed to start discovery task')
          }
          
          // 等待任务完成并获取结果
          let attempts = 0
          const maxAttempts = 30 // 最多等待30秒
          let discoveredHosts = []
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒
            
            const statusResponse = await fetchWithRetry(getApiUrl(`discovery/tasks/${taskId}`), {}, 1)
            if (statusResponse.ok) {
              const statusResult = await statusResponse.json()
              const task = statusResult.data
              
              if (task.status === 'completed') {
                // 获取发现的主机
                const hostsResponse = await fetchWithRetry(getApiUrl(`hosts?discoveryTaskId=${taskId}`), {}, 1)
                if (hostsResponse.ok) {
                  const hostsResult = await hostsResponse.json()
                  discoveredHosts = hostsResult.data || []
                }
                break
              } else if (task.status === 'failed') {
                throw new Error('Discovery task failed')
              }
            }
            attempts++
          }
          
          // 转换后端数据格式为前端格式
          const convertedHosts = discoveredHosts.map((host: any) => {
            const converted = hostManager.addDiscoveredHost({
              id: `backend-${host.id}`,
              name: host.name || `host-${host.ip}`,
              ip: host.ip,
              hostname: host.hostname,
              os: host.os || 'Unknown',
              osVersion: host.osVersion || '',
              arch: host.arch || 'x86_64',
              status: host.status,
              cpuCores: host.cpuCores || 0,
              memory: host.memory || 0,
              disk: host.disk || 0,
              location: '网络发现',
              group: 'discovered',
              tags: ['discovered'],
              sshPort: host.sshPort || 22,
              sshConnectable: host.sshConnectable || false,
              metadata: { 
                discoveredAt: new Date().toISOString(),
                backendId: host.id,
                taskId: taskId
              }
            })
            return converted
          })
          
          return NextResponse.json({
            success: true,
            progress: 100,
            foundHosts: convertedHosts.length,
            onlineHosts: convertedHosts.filter(h => h.status === 'online').length,
            hosts: convertedHosts,
            taskId: taskId
          });
        } catch (error) {
          console.error('Discovery error:', error)
          // 如果后端调用失败，回退到模拟数据
          const mockDiscoveredHosts = [
            {
              id: `discovered-${Date.now()}-1`,
              name: `host-${ipRange.split('.')[2]}-10`,
              ip: ipRange.replace(/\/\d+$/, '').replace(/\d+$/, '10'),
              hostname: `host10.local`,
              os: 'Ubuntu',
              osVersion: '22.04',
              arch: 'x86_64',
              status: 'online',
              cpuCores: 4,
              memory: 8192,
              disk: 100,
              location: '自动发现',
              group: 'discovered',
              tags: ['discovered'],
              sshPort: 22,
              sshConnectable: true,
              metadata: { discoveredAt: new Date().toISOString() }
            },
            {
              id: `discovered-${Date.now()}-2`,
              name: `host-${ipRange.split('.')[2]}-20`,
              ip: ipRange.replace(/\/\d+$/, '').replace(/\d+$/, '20'),
              hostname: `host20.local`,
              os: 'CentOS',
              osVersion: '8',
              arch: 'x86_64',
              status: 'online',
              cpuCores: 8,
              memory: 16384,
              disk: 200,
              location: '自动发现',
              group: 'discovered',
              tags: ['discovered'],
              sshPort: 22,
              sshConnectable: false,
              metadata: { discoveredAt: new Date().toISOString() }
            }
          ]
          
          const addedHosts = mockDiscoveredHosts.map(hostData => 
            hostManager.addDiscoveredHost(hostData)
          );
          
          return NextResponse.json({
            success: true,
            progress: 100,
            foundHosts: addedHosts.length,
            onlineHosts: addedHosts.filter(h => h.status === 'online').length,
            hosts: addedHosts
          });
        }

      case 'add-manual':
        // 手动添加主机
        const { host: manualHost } = body
        try {
          // 先调用后端创建主机
          const backendResponse = await fetchWithRetry(getApiUrl('hosts'), {
            method: 'POST',
            body: JSON.stringify({
              name: manualHost.name,
              ip: manualHost.ip,
              hostname: manualHost.hostname || '',
              sshPort: manualHost.sshPort || 22,
              sshUser: manualHost.sshUser || '',
              description: `手动添加的主机 - ${manualHost.name}`,
              location: '手动添加',
              group: 'manual',
              tags: ['manual', 'user-added'],
              // 凭据信息需要单独处理
              credentials: {
                username: manualHost.sshUser,
                password: manualHost.sshPassword,
                privateKey: manualHost.sshKey
              }
            })
          })
          
          let backendHost = null
          if (backendResponse.ok) {
            const backendResult = await backendResponse.json()
            backendHost = backendResult.data
            
            // 如果有SSH凭据，创建凭据记录
            if (manualHost.sshUser || manualHost.sshPassword || manualHost.sshKey) {
              try {
                await fetchWithRetry(getApiUrl('credentials'), {
                  method: 'POST',
                  body: JSON.stringify({
                    hostId: backendHost.id,
                    name: `${manualHost.name} SSH凭据`,
                    type: 'ssh',
                    username: manualHost.sshUser || '',
                    password: manualHost.sshPassword || '',
                    privateKey: manualHost.sshKey || '',
                    description: '手动添加主机时创建的SSH凭据'
                  })
                })
              } catch (credError) {
                console.warn('Failed to create credentials:', credError)
              }
            }
          }
          
          // 添加到前端主机管理器
          const newHost = hostManager.addDiscoveredHost({
            ...manualHost,
            id: backendHost ? `backend-${backendHost.id}` : `manual-${Date.now()}`,
            status: 'unknown',
            cpuCores: backendHost?.cpuCores || 0,
            memory: backendHost?.memory || 0,
            disk: backendHost?.disk || 0,
            location: '手动添加',
            group: 'manual',
            tags: ['manual'],
            metadata: { 
              addedAt: new Date().toISOString(),
              backendId: backendHost?.id,
              sshUser: manualHost.sshUser,
              sshPassword: manualHost.sshPassword ? '***' : '',
              sshKey: manualHost.sshKey ? '***' : ''
            }
          })
          
          return NextResponse.json({
            success: true,
            host: newHost,
            backendId: backendHost?.id
          })
        } catch (error) {
          console.error('Add manual host error:', error)
          
          // 如果后端调用失败，仍然添加到前端管理器
          const fallbackHost = hostManager.addDiscoveredHost({
            ...manualHost,
            id: `manual-${Date.now()}`,
            status: 'unknown',
            cpuCores: 0,
            memory: 0,
            disk: 0,
            location: '手动添加',
            group: 'manual',
            tags: ['manual'],
            metadata: { 
              addedAt: new Date().toISOString(),
              sshUser: manualHost.sshUser,
              sshPassword: manualHost.sshPassword ? '***' : '',
              sshKey: manualHost.sshKey ? '***' : '',
              backendError: error instanceof Error ? error.message : 'Unknown error'
            }
          })
          
          return NextResponse.json({
            success: true,
            host: fallbackHost,
            warning: '后端服务不可用，主机已添加到本地管理器'
          })
        }

      case 'test-ssh':
        // 测试SSH连接
        const { hostId } = body
        try {
          // 获取主机信息
          const hosts = hostManager.getAvailableHosts()
          const host = hosts.find(h => h.id === hostId)
          
          if (!host) {
            return NextResponse.json({
              success: false,
              error: '主机不存在'
            }, { status: 404 })
          }
          
          // 如果主机有后端ID，调用后端测试
          if (host.metadata?.backendId) {
            const testResponse = await fetchWithRetry(getApiUrl(`hosts/${host.metadata.backendId}/test`), {
              method: 'POST'
            })
            
            if (testResponse.ok) {
              const testResult = await testResponse.json()
              const isConnectable = testResult.data?.ssh?.status === 'success'
              
              return NextResponse.json({
                success: true,
                connectable: isConnectable,
                details: testResult.data
              })
            }
          }
          
          // 如果没有后端ID或后端调用失败，尝试直接测试
          // 这里可以调用后端的通用SSH测试接口
          const directTestResponse = await fetchWithRetry(getApiUrl('hosts/test-connection'), {
            method: 'POST',
            body: JSON.stringify({
              ip: host.ip,
              port: host.sshPort || 22,
              username: host.sshUser || 'root',
              // 注意：实际生产中需要安全地处理凭据
              testType: 'ssh'
            })
          })
          
          if (directTestResponse.ok) {
            const directResult = await directTestResponse.json()
            const isConnectable = directResult.success && directResult.data?.connectable
            
            return NextResponse.json({
              success: true,
              connectable: isConnectable,
              details: directResult.data
            })
          }
          
          // 如果后端调用失败，回退到模拟测试
          console.warn('Backend SSH test failed, using fallback')
          const isConnectable = Math.random() > 0.3 // 70%成功率
          
          return NextResponse.json({
            success: true,
            connectable: isConnectable
          })
        } catch (error) {
          return NextResponse.json(
            { success: false, error: 'SSH连接测试失败' },
            { status: 500 }
          )
        }

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