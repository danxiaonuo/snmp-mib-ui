import { Redis } from "ioredis"

// Redis连接配置
const getRedisUrl = () => {
  return process.env.REDIS_URL || "redis://localhost:6379"
}

// 创建Redis客户端
export const redis = new Redis(getRedisUrl(), {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

// Redis工具函数
export const cache = {
  // 设置缓存
  async set(key: string, value: any, ttl = 3600) {
    const serialized = JSON.stringify(value)
    if (ttl > 0) {
      return await redis.setex(key, ttl, serialized)
    }
    return await redis.set(key, serialized)
  },

  // 获取缓存
  async get<T = any>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  },

  // 删除缓存
  async del(key: string) {
    return await redis.del(key)
  },

  // 设置哈希
  async hset(key: string, field: string, value: any) {
    return await redis.hset(key, field, JSON.stringify(value))
  },

  // 获取哈希
  async hget<T = any>(key: string, field: string): Promise<T | null> {
    const value = await redis.hget(key, field)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  },

  // 检查连接
  async ping() {
    return await redis.ping()
  },
}

// 连接事件监听
redis.on("connect", () => {
  console.log("Redis connected successfully")
})

redis.on("error", (err) => {
  console.error("Redis connection error:", err)
})

export default redis
