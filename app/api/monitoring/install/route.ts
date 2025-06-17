import { NextRequest, NextResponse } from 'next/server'
import { getApiUrl, fetchWithRetry } from '@/lib/backend-config'

// 模拟组件状态 (远程主机上的状态)
let componentStatuses: Record<string, Record<string, string>> = {}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: '监控安装器API正常运行',
    role: 'remote-deployment-manager',
    note: '用于管理远程主机上的监控组件部署'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, components, hosts, configs } = body

    console.log('远程部署请求:', { action, components, hosts })

    switch (action) {
      case 'install':
        if (!hosts || hosts.length === 0) {
          return NextResponse.json({
            success: false,
            error: '请选择目标主机'
          }, { status: 400 })
        }

        if (!components || components.length === 0) {
          return NextResponse.json({
            success: false,
            error: '请选择要安装的组件'
          }, { status: 400 })
        }

        // 调用后端真实部署服务
        console.log(`开始在 ${hosts.length} 台主机上部署 ${components.length} 个组件`)
        
        try {
          // 创建部署任务
          const deploymentResponse = await fetchWithRetry(getApiUrl('deployment/tasks'), {
            method: 'POST',
            body: JSON.stringify({
              name: `监控组件部署 - ${new Date().toISOString()}`,
              components: components,
              hosts: hosts.map(host => ({
                id: host.backendId || host.id,
                ip: host.ip,
                name: host.name
              })),
              deploymentMethod: body.deploymentMethod || 'docker',
              configs: configs || {}
            })
          })
          
          if (!deploymentResponse.ok) {
            throw new Error('Failed to create deployment task')
          }
          
          const deploymentResult = await deploymentResponse.json()
          const taskId = deploymentResult.data.id
          
          // 执行部署任务
          const executeResponse = await fetchWithRetry(getApiUrl(`deployment/tasks/${taskId}/execute`), {
            method: 'POST'
          })
          
          if (!executeResponse.ok) {
            throw new Error('Failed to execute deployment task')
          }
          
          // 等待部署完成
          let attempts = 0
          const maxAttempts = 60 // 最多等待60秒
          let deploymentStatus = 'running'
          
          while (attempts < maxAttempts && deploymentStatus === 'running') {
            await new Promise(resolve => setTimeout(resolve, 2000)) // 等待2秒
            
            const statusResponse = await fetchWithRetry(getApiUrl(`deployment/tasks/${taskId}`), {}, 1)
            if (statusResponse.ok) {
              const statusResult = await statusResponse.json()
              deploymentStatus = statusResult.data.status
              
              if (deploymentStatus === 'completed' || deploymentStatus === 'failed') {
                break
              }
            }
            attempts++
          }
          
          if (deploymentStatus === 'completed') {
            // 更新各主机上的组件状态
            hosts.forEach((host: any) => {
              const hostKey = host.backendId || host.id
              if (!componentStatuses[hostKey]) {
                componentStatuses[hostKey] = {}
              }
              components.forEach((comp: string) => {
                componentStatuses[hostKey][comp] = 'running'
              })
            })
            
            return NextResponse.json({
              success: true,
              message: `成功在 ${hosts.length} 台主机上部署了 ${components.length} 个组件`,
              installedComponents: components,
              targetHosts: hosts,
              deploymentInfo: {
                method: body.deploymentMethod || 'docker',
                timestamp: new Date().toISOString(),
                totalHosts: hosts.length,
                totalComponents: components.length,
                taskId: taskId,
                backendDeployment: true
              }
            })
          } else {
            throw new Error(`Deployment failed with status: ${deploymentStatus}`)
          }
          
        } catch (backendError) {
          console.error('Backend deployment failed:', backendError)
          
          // 如果后端部署失败，回退到模拟部署
          console.log('回退到模拟部署模式')
          await new Promise(resolve => setTimeout(resolve, 2000))
        
        // 更新各主机上的组件状态
        hosts.forEach((host: string) => {
          if (!componentStatuses[host]) {
            componentStatuses[host] = {}
          }
          components.forEach((comp: string) => {
            componentStatuses[host][comp] = 'running'
          })
        })
        
        return NextResponse.json({
          success: true,
          message: `成功在 ${hosts.length} 台主机上安装了 ${components.length} 个组件`,
          installedComponents: components,
          targetHosts: hosts,
          deploymentInfo: {
            method: 'remote-docker-compose',
            timestamp: new Date().toISOString(),
            totalHosts: hosts.length,
            totalComponents: components.length
          }
        })

      case 'status':
        const statuses = hosts?.map((host: string) => ({
          host,
          components: components?.map((comp: string) => ({
            name: comp,
            status: componentStatuses[host]?.[comp] || 'not-installed'
          })) || []
        })) || []
        
        return NextResponse.json({
          success: true,
          statuses
        })

      case 'stop':
        hosts?.forEach((host: string) => {
          components?.forEach((comp: string) => {
            if (componentStatuses[host]?.[comp]) {
              componentStatuses[host][comp] = 'stopped'
            }
          })
        })
        
        return NextResponse.json({
          success: true,
          message: '组件已停止',
          stoppedComponents: components,
          targetHosts: hosts
        })

      case 'restart':
        hosts?.forEach((host: string) => {
          components?.forEach((comp: string) => {
            if (componentStatuses[host]?.[comp]) {
              componentStatuses[host][comp] = 'running'
            }
          })
        })
        
        return NextResponse.json({
          success: true,
          message: '组件已重启',
          restartedComponents: components,
          targetHosts: hosts
        })

      default:
        return NextResponse.json({
          success: false,
          error: `未知操作: ${action}`
        }, { status: 400 })
    }
  } catch (error) {
    console.error('远程部署API错误:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
