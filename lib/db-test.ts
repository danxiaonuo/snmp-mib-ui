import { neon } from "@neondatabase/serverless"
import Redis from "redis"

// 测试数据库连接
export async function testDatabase() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const result = await sql`SELECT NOW() as current_time`
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 测试Redis连接
export async function testRedis() {
  try {
    const redis = Redis.createClient({
      url: process.env.REDIS_URL,
    })
    await redis.connect()
    await redis.set("test", "hello")
    const result = await redis.get("test")
    await redis.disconnect()
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
