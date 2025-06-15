// 使用Neon数据库连接（替代本地PostgreSQL）
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// 数据库查询辅助函数
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const result = await sql(query, params)
    return { success: true, data: result }
  } catch (error) {
    console.error("Database query error:", error)
    return { success: false, error: error.message }
  }
}

// 测试数据库连接
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`
    console.log("Database connected successfully:", result[0])
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}
