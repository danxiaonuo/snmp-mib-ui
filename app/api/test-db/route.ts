// 测试数据库连接的API端点
import { NextResponse } from "next/server"
import { sql } from "@/lib/database-neon"

export async function GET() {
  try {
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
