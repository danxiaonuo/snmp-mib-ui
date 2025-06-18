import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, hostIds, components, configs, commands, ...otherData } = body
    
    const results = []
    let overallSuccess = true
    
    switch (operation) {
      case 'deploy_components':
        // 批量组件部署
        const deployResponse = await fetch(`${BACKEND_URL}/api/v1/deployment/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
          },
          body: JSON.stringify({
            host_ids: hostIds,
            components: components
          }),
        })
        
        if (deployResponse.ok) {
          const deployData = await deployResponse.json()
          results.push({
            operation: 'deploy_components',
            success: true,
            data: deployData
          })
        } else {
          overallSuccess = false
          results.push({
            operation: 'deploy_components',
            success: false,
            error: 'Failed to deploy components'
          })
        }
        break
        
      case 'ssh_commands':
        // 批量SSH命令执行
        for (const hostId of hostIds || []) {
          // 获取主机信息
          const hostResponse = await fetch(`${BACKEND_URL}/api/v1/hosts/${hostId}`, {
            headers: {
              'Authorization': request.headers.get('Authorization') || '',
            },
          })
          
          if (hostResponse.ok) {
            const hostData = await hostResponse.json()
            const host = hostData.data
            
            for (const command of commands || []) {
              try {
                const sshResponse = await fetch(`${BACKEND_URL}/api/v1/ssh/execute`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': request.headers.get('Authorization') || '',
                  },
                  body: JSON.stringify({
                    host: host.ip,
                    port: host.port || 22,
                    username: host.username,
                    password: host.password,
                    privateKey: host.private_key,
                    command: command
                  }),
                })
                
                if (sshResponse.ok) {
                  const sshData = await sshResponse.json()
                  results.push({
                    operation: 'ssh_command',
                    host_id: hostId,
                    host_ip: host.ip,
                    command: command,
                    success: sshData.success,
                    stdout: sshData.stdout,
                    stderr: sshData.stderr
                  })
                }
              } catch (error) {
                overallSuccess = false
                results.push({
                  operation: 'ssh_command',
                  host_id: hostId,
                  command: command,
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error'
                })
              }
            }
          }
        }
        break
        
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unsupported bulk operation'
          },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: overallSuccess,
      operation: operation,
      results: results
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Bulk operations API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute bulk operations'
      },
      { status: 500 }
    )
  }
}

// 获取批量操作状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const executionId = searchParams.get('executionId')

    if (!executionId) {
      return NextResponse.json(
        { success: false, error: '缺少执行ID' },
        { status: 400 }
      )
    }

    // 模拟获取执行状态
    const status = {
      executionId,
      status: 'completed', // running, completed, failed
      progress: 100,
      startTime: new Date(Date.now() - 120000).toISOString(), // 2分钟前开始
      endTime: new Date().toISOString(),
      results: [
        {
          hostId: '1',
          host: 'web-server-01',
          status: 'success',
          message: '操作执行成功',
          duration: 15
        },
        {
          hostId: '2',
          host: 'db-server-01',
          status: 'success',
          message: '操作执行成功',
          duration: 23
        }
      ]
    }

    return NextResponse.json({
      success: true,
      status
    })
  } catch (error) {
    console.error('获取执行状态失败:', error)
    return NextResponse.json(
      { success: false, error: '获取执行状态失败' },
      { status: 500 }
    )
  }
}