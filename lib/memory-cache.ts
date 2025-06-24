/**
 * 内存缓存系统
 * 替代Redis，提供轻量级内存缓存功能
 */

interface CacheItem<T = any> {
  value: T;
  expires: number;
  created: number;
}

class MemoryCache {
  private static instance: MemoryCache;
  private cache: Map<string, CacheItem> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // 每5分钟清理一次过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  public static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  // 设置缓存
  set<T = any>(key: string, value: T, ttl = 3600): boolean {
    const expires = Date.now() + (ttl * 1000);
    this.cache.set(key, {
      value,
      expires,
      created: Date.now()
    });
    return true;
  }

  // 获取缓存
  get<T = any>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  // 删除缓存
  del(key: string): boolean {
    return this.cache.delete(key);
  }

  // 检查缓存是否存在
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    // 检查是否过期
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // 清空所有缓存
  clear(): void {
    this.cache.clear();
  }

  // 获取缓存统计信息
  stats(): {
    size: number;
    hits: number;
    misses: number;
    expired: number;
  } {
    let expired = 0;
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      hits: 0, // 简化实现，不统计命中率
      misses: 0,
      expired
    };
  }

  // 清理过期缓存
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`清理了 ${cleaned} 个过期缓存项`);
    }
  }

  // 销毁缓存实例
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// 哈希表缓存（模拟Redis Hash）
class HashCache {
  private cache: Map<string, Map<string, CacheItem>> = new Map();

  // 设置哈希字段
  hset(key: string, field: string, value: any, ttl = 3600): boolean {
    if (!this.cache.has(key)) {
      this.cache.set(key, new Map());
    }

    const hash = this.cache.get(key)!;
    const expires = Date.now() + (ttl * 1000);
    hash.set(field, {
      value,
      expires,
      created: Date.now()
    });

    return true;
  }

  // 获取哈希字段
  hget<T = any>(key: string, field: string): T | null {
    const hash = this.cache.get(key);
    if (!hash) {
      return null;
    }

    const item = hash.get(field);
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expires) {
      hash.delete(field);
      if (hash.size === 0) {
        this.cache.delete(key);
      }
      return null;
    }

    return item.value as T;
  }

  // 获取哈希所有字段
  hgetall(key: string): Record<string, any> | null {
    const hash = this.cache.get(key);
    if (!hash) {
      return null;
    }

    const result: Record<string, any> = {};
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [field, item] of hash.entries()) {
      if (now > item.expires) {
        keysToDelete.push(field);
      } else {
        result[field] = item.value;
      }
    }

    // 清理过期字段
    keysToDelete.forEach(field => hash.delete(field));
    if (hash.size === 0) {
      this.cache.delete(key);
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  // 删除哈希字段
  hdel(key: string, field: string): boolean {
    const hash = this.cache.get(key);
    if (!hash) {
      return false;
    }

    const deleted = hash.delete(field);
    if (hash.size === 0) {
      this.cache.delete(key);
    }

    return deleted;
  }

  // 删除整个哈希
  del(key: string): boolean {
    return this.cache.delete(key);
  }
}

// 创建缓存实例
const memoryCache = MemoryCache.getInstance();
const hashCache = new HashCache();

// 缓存工具函数，兼容Redis接口
export const cache = {
  // 基础缓存操作
  async set(key: string, value: any, ttl = 3600): Promise<boolean> {
    return memoryCache.set(key, value, ttl);
  },

  async get<T = any>(key: string): Promise<T | null> {
    return memoryCache.get<T>(key);
  },

  async del(key: string): Promise<boolean> {
    return memoryCache.del(key);
  },

  async has(key: string): Promise<boolean> {
    return memoryCache.has(key);
  },

  // 哈希操作
  async hset(key: string, field: string, value: any, ttl = 3600): Promise<boolean> {
    return hashCache.hset(key, field, value, ttl);
  },

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    return hashCache.hget<T>(key, field);
  },

  async hgetall(key: string): Promise<Record<string, any> | null> {
    return hashCache.hgetall(key);
  },

  async hdel(key: string, field: string): Promise<boolean> {
    return hashCache.hdel(key, field);
  },

  // 检查连接（内存缓存总是可用的）
  async ping(): Promise<string> {
    return 'PONG';
  },

  // 获取统计信息
  async stats(): Promise<any> {
    return memoryCache.stats();
  },

  // 清空缓存
  async clear(): Promise<boolean> {
    memoryCache.clear();
    return true;
  }
};

// 速率限制器（替代Redis的速率限制功能）
export class RateLimiter {
  private static requests: Map<string, { count: number; resetTime: number }> = new Map();

  static async checkLimit(
    key: string, 
    limit: number, 
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const resetTime = now + windowMs;
    
    const existing = this.requests.get(key);
    
    if (!existing || now > existing.resetTime) {
      // 新的时间窗口
      this.requests.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: limit - 1, resetTime };
    }
    
    if (existing.count >= limit) {
      // 超出限制
      return { allowed: false, remaining: 0, resetTime: existing.resetTime };
    }
    
    // 增加计数
    existing.count++;
    this.requests.set(key, existing);
    
    return { allowed: true, remaining: limit - existing.count, resetTime: existing.resetTime };
  }

  static async reset(key: string): Promise<void> {
    this.requests.delete(key);
  }

  static async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// 定期清理速率限制器
setInterval(() => {
  RateLimiter.cleanup();
}, 60 * 1000); // 每分钟清理一次

// 导出默认缓存实例
export default cache;

// 导出内存缓存类
export { MemoryCache, HashCache };

// 模拟Redis事件
export const redis = {
  on: (event: string, callback: Function) => {
    if (event === 'connect') {
      // 内存缓存立即可用
      setTimeout(() => callback(), 0);
    }
    if (event === 'error') {
      // 内存缓存不会出错，但为了兼容性保留
    }
  },
  ping: () => cache.ping(),
  get: (key: string) => cache.get(key),
  set: (key: string, value: any) => cache.set(key, value),
  del: (key: string) => cache.del(key),
  hset: (key: string, field: string, value: any) => cache.hset(key, field, value),
  hget: (key: string, field: string) => cache.hget(key, field),
  setex: (key: string, ttl: number, value: any) => cache.set(key, value, ttl)
};