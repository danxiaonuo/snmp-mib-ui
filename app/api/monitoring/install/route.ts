import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:17880'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hostIds, components, deploymentMethod, ...otherData } = body
    
    // 转换为后端部署任务格式
    const deploymentTasks = []
    
    for (const hostId of hostIds || []) {
      // 为每个主机创建部署任务
      const taskPayload = {
        host_id: hostId,
        components: components.map((comp: any) => ({
          name: comp.name || comp.component,
          version: comp.version,
          port: comp.port || comp.defaultPort,
          config: comp.config || {},
          deployment_method: deploymentMethod || 'docker'
        }))
      }
      
      // 创建部署任务
      const taskResponse = await fetch(`${BACKEND_URL}/api/v1/deployment/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify(taskPayload),
      })
      
      if (taskResponse.ok) {
        const taskData = await taskResponse.json()
        deploymentTasks.push(taskData.task)
        
        // 立即执行部署任务
        await fetch(`${BACKEND_URL}/api/v1/deployment/tasks/${taskData.task.id}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Monitoring components installation started',
      tasks: deploymentTasks,
      components_installed: components.length,
      hosts_targeted: hostIds?.length || 0
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Monitoring installation API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to install monitoring components',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取可用的监控组件列表
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/deployment/components`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    })

    const responseData = await backendResponse.json()

    return NextResponse.json(responseData, {
      status: backendResponse.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Get monitoring components API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get monitoring components',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}