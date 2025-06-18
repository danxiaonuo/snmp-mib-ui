import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:17880'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 根据配置类型转发到相应的后端API
    const { configType, ...otherData } = body
    
    let backendEndpoint: string
    switch (configType) {
      case 'monitoring':
        backendEndpoint = `${BACKEND_URL}/api/v1/config-deployment/monitoring`
        break
      case 'alerting':
        backendEndpoint = `${BACKEND_URL}/api/v1/config-deployment/alerting`
        break
      case 'snmp':
        backendEndpoint = `${BACKEND_URL}/api/v1/config-deployment/snmp`
        break
      default:
        // 通用配置部署任务
        backendEndpoint = `${BACKEND_URL}/api/v1/config-deployment/tasks`
        break
    }
    
    const backendResponse = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    })

    const responseData = await backendResponse.json()

    return NextResponse.json(responseData, {
      status: backendResponse.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Config deployment API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to deploy configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取配置部署模板
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/config-deployment/templates`, {
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
    console.error('Config templates API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get config templates',
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