import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:17880'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 转发到后端告警部署API
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/alert-deployment/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 转发原始请求头
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
    console.error('Alert rules deployment API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to deploy alert rules',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}