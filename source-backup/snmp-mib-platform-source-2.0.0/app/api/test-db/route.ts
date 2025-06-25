// 测试数据库连接的API端点
import { NextResponse } from "next/server"
import { DatabaseUtils } from "@/lib/database"

export async function GET() {
  try {
    // 测试SQLite数据库连接
    const isConnected = DatabaseUtils.checkConnection()
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'SQLite database connection failed',
        timestamp: new Date().toISOString(),
      }, { status: 503 })
    }

    // 测试数据库初始化状态
    const isInitialized = DatabaseUtils.initializeDatabase()

    return NextResponse.json({
      success: true,
      data: {
        connected: isConnected,
        initialized: isInitialized,
        database_type: 'SQLite',
        message: 'Hello from SQLite!'
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Database test failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
