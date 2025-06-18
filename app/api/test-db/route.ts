// 测试数据库连接的API端点
import { NextResponse } from "next/server"
import { sql } from "@/lib/database-neon"

export async function GET() {
  try {
    // 运行时检查数据库URL
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL not configured',
        timestamp: new Date().toISOString(),
      }, { status: 503 })
    }

    // 测试简单查询
    const result = await sql`SELECT NOW() as current_time, 'Hello from Neon!' as message`

    return NextResponse.json({
      success: true,
      data: result[0],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
