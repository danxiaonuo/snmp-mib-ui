import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 尝试连接后端API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || process.env.API_BASE_URL || 'http://backend:8080'
    console.log('Attempting to connect to backend at:', backendUrl)
    
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to backend',
      backendStatus: data,
      backendUrl,
    })
  } catch (error) {
    console.error('Error connecting to backend:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        backendUrl: process.env.API_BASE_URL || 'http://backend:8080',
      },
      { status: 500 }
    )
  }
}