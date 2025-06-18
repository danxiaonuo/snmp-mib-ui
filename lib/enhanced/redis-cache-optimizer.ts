/**
 * Redis缓存优化策略
 * 智能缓存策略、缓存预热和失效机制、分布式缓存管理
 * 
 * @author SNMP Platform Team
 * @version 1.0.0
 * @date 2024-12-18
 */

import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { z } from 'zod';

// 类型定义
export interface CacheConfig {
  prefix: string;
  defaultTTL: number;
  maxRetries: number;
  retryDelayMs: number;
  compressionThreshold: number;
  enableMetrics: boolean;
  clusterMode: boolean;
  nodes?: string[];
}

export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  version: string;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  totalOperations: number;
  averageResponseTime: number;
  memoryUsage: number;
  keyCount: number;
}

export interface PrewarmConfig {
  pattern: string;
  refreshInterval: number;
  priority: number;
  maxConcurrency: number;
  batchSize: number;
}

// 验证模式
const cacheConfigSchema = z.object({
  prefix: z.string().min(1),
  defaultTTL: z.number().positive(),
  maxRetries: z.number().min(0),
  retryDelayMs: z.number().positive(),
  compressionThreshold: z.number().positive(),
  enableMetrics: z.boolean(),
  clusterMode: z.boolean(),
  nodes: z.array(z.string()).optional()
});

const prewarmConfigSchema = z.object({
  pattern: z.string().min(1),
  refreshInterval: z.number().positive(),
  priority: z.number().min(1).max(10),
  maxConcurrency: z.number().positive(),
  batchSize: z.number().positive()
});

/**
 * Redis缓存优化器
 */
export class RedisCacheOptimizer extends EventEmitter {
  private redis: Redis.Redis | Redis.Cluster;
  private config: CacheConfig;
  private stats: CacheStats;
  private prewarmConfigs: Map<string, PrewarmConfig>;
  private prewarmTimers: Map<string, NodeJS.Timeout>;
  private compressionEnabled: boolean;
  private metricsEnabled: boolean;
  private readonly VERSION = '1.0.0';

  constructor(config: CacheConfig) {
    super();
    
    // 验证配置
    const validatedConfig = cacheConfigSchema.parse(config);
    this.config = validatedConfig;
    
    // 初始化统计信息
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalOperations: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      keyCount: 0
    };
    
    this.prewarmConfigs = new Map();
    this.prewarmTimers = new Map();
    this.compressionEnabled = config.compressionThreshold > 0;
    this.metricsEnabled = config.enableMetrics;
    
    this.initializeRedisConnection();
    this.setupEventHandlers();
    this.startMetricsCollection();
  }

  /**
   * 初始化Redis连接
   */
  private initializeRedisConnection(): void {
    try {
      if (this.config.clusterMode && this.config.nodes) {
        this.redis = new Redis.Cluster(this.config.nodes, {
          redisOptions: {
            retryDelayOnFailover: this.config.retryDelayMs,
            maxRetriesPerRequest: this.config.maxRetries,
            lazyConnect: true
          },
          enableOfflineQueue: false
        });
      } else {
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          retryDelayOnFailover: this.config.retryDelayMs,
          maxRetriesPerRequest: this.config.maxRetries,
          lazyConnect: true
        });
      }

      this.emit('redis:connected');
    } catch (error) {
      this.handleError('Redis connection failed', error);
    }
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      console.log('Redis连接已建立');
      this.emit('redis:ready');
    });

    this.redis.on('error', (error) => {
      this.handleError('Redis连接错误', error);
    });

    this.redis.on('close', () => {
      console.log('Redis连接已关闭');
      this.emit('redis:disconnected');
    });
  }

  /**
   * 智能缓存获取
   */
  async get<T>(key: string, fallback?: () => Promise<T>, ttl?: number): Promise<T | null> {
    const startTime = Date.now();
    const cacheKey = this.buildKey(key);
    
    try {
      // 尝试从缓存获取
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const entry = this.deserialize<CacheEntry<T>>(cached);
        if (this.isValid(entry)) {
          this.updateStats('hit', Date.now() - startTime);
          this.emit('cache:hit', { key, value: entry.value });
          return entry.value;
        }
      }
      
      // 缓存未命中，使用回退函数
      if (fallback) {
        const value = await fallback();
        await this.set(key, value, ttl);
        this.updateStats('miss', Date.now() - startTime);
        this.emit('cache:miss', { key, value });
        return value;
      }
      
      this.updateStats('miss', Date.now() - startTime);
      return null;
      
    } catch (error) {
      this.handleError(`缓存获取失败: ${key}`, error);
      this.updateStats('error', Date.now() - startTime);
      
      // 降级处理
      if (fallback) {
        return await fallback();
      }
      
      return null;
    }
  }

  /**
   * 智能缓存设置
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const startTime = Date.now();
    const cacheKey = this.buildKey(key);
    const actualTTL = ttl || this.config.defaultTTL;
    
    try {
      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl: actualTTL,
        version: this.VERSION,
        metadata: {
          size: this.calculateSize(value),
          compressed: false
        }
      };
      
      let serialized = this.serialize(entry);
      
      // 压缩大数据
      if (this.compressionEnabled && serialized.length > this.config.compressionThreshold) {
        serialized = await this.compress(serialized);
        entry.metadata!.compressed = true;
      }
      
      await this.redis.setex(cacheKey, actualTTL, serialized);
      
      this.updateStats('set', Date.now() - startTime);
      this.emit('cache:set', { key, value, ttl: actualTTL });
      
      return true;
      
    } catch (error) {
      this.handleError(`缓存设置失败: ${key}`, error);
      this.updateStats('error', Date.now() - startTime);
      return false;
    }
  }

  /**
   * 批量获取
   */
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const startTime = Date.now();
    const cacheKeys = keys.map(k => this.buildKey(k));
    const result = new Map<string, T | null>();
    
    try {
      const values = await this.redis.mget(...cacheKeys);
      
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = values[i];
        
        if (value) {
          try {
            const entry = this.deserialize<CacheEntry<T>>(value);
            if (this.isValid(entry)) {
              result.set(key, entry.value);
              this.stats.hits++;
            } else {
              result.set(key, null);
              this.stats.misses++;
            }
          } catch {
            result.set(key, null);
            this.stats.errors++;
          }
        } else {
          result.set(key, null);
          this.stats.misses++;
        }
      }
      
      this.updateStats('mget', Date.now() - startTime);
      this.emit('cache:mget', { keys, results: result });
      
      return result;
      
    } catch (error) {
      this.handleError('批量获取缓存失败', error);
      this.updateStats('error', Date.now() - startTime);
      
      // 返回空结果
      keys.forEach(key => result.set(key, null));
      return result;
    }
  }

  /**
   * 批量设置
   */
  async mset<T>(entries: Map<string, T>, ttl?: number): Promise<boolean> {
    const startTime = Date.now();
    const actualTTL = ttl || this.config.defaultTTL;
    
    try {
      const pipeline = this.redis.pipeline();
      
      for (const [key, value] of entries) {
        const cacheKey = this.buildKey(key);
        const entry: CacheEntry<T> = {
          value,
          timestamp: Date.now(),
          ttl: actualTTL,
          version: this.VERSION
        };
        
        const serialized = this.serialize(entry);
        pipeline.setex(cacheKey, actualTTL, serialized);
      }
      
      await pipeline.exec();
      
      this.updateStats('mset', Date.now() - startTime);
      this.emit('cache:mset', { entries, ttl: actualTTL });
      
      return true;
      
    } catch (error) {
      this.handleError('批量设置缓存失败', error);
      this.updateStats('error', Date.now() - startTime);
      return false;
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string | string[]): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const keys = Array.isArray(key) ? key : [key];
      const cacheKeys = keys.map(k => this.buildKey(k));
      
      const result = await this.redis.del(...cacheKeys);
      
      this.updateStats('del', Date.now() - startTime);
      this.emit('cache:del', { keys, deletedCount: result });
      
      return result > 0;
      
    } catch (error) {
      this.handleError('删除缓存失败', error);
      this.updateStats('error', Date.now() - startTime);
      return false;
    }
  }

  /**
   * 按模式删除
   */
  async delByPattern(pattern: string): Promise<number> {
    const startTime = Date.now();
    const fullPattern = this.buildKey(pattern);
    
    try {
      const keys = await this.redis.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      const result = await this.redis.del(...keys);
      
      this.updateStats('delByPattern', Date.now() - startTime);
      this.emit('cache:delByPattern', { pattern, deletedCount: result });
      
      return result;
      
    } catch (error) {
      this.handleError('按模式删除缓存失败', error);
      this.updateStats('error', Date.now() - startTime);
      return 0;
    }
  }

  /**
   * 缓存预热配置
   */
  configurePrewarm(name: string, config: PrewarmConfig): void {
    try {
      const validatedConfig = prewarmConfigSchema.parse(config);
      this.prewarmConfigs.set(name, validatedConfig);
      
      // 清除现有定时器
      const existingTimer = this.prewarmTimers.get(name);
      if (existingTimer) {
        clearInterval(existingTimer);
      }
      
      // 设置新的预热定时器
      const timer = setInterval(() => {
        this.performPrewarm(name, validatedConfig);
      }, validatedConfig.refreshInterval);
      
      this.prewarmTimers.set(name, timer);
      
      this.emit('prewarm:configured', { name, config: validatedConfig });
      
    } catch (error) {
      this.handleError(`预热配置失败: ${name}`, error);
    }
  }

  /**
   * 执行预热
   */
  private async performPrewarm(name: string, config: PrewarmConfig): Promise<void> {
    try {
      const pattern = this.buildKey(config.pattern);
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return;
      }
      
      // 按优先级和批次处理
      const batches = this.chunkArray(keys, config.batchSize);
      const concurrencyLimit = Math.min(config.maxConcurrency, batches.length);
      
      const promises = batches.slice(0, concurrencyLimit).map(async (batch) => {
        try {
          const pipeline = this.redis.pipeline();
          
          for (const key of batch) {
            pipeline.touch(key);
          }
          
          await pipeline.exec();
        } catch (error) {
          console.error(`预热批次失败:`, error);
        }
      });
      
      await Promise.allSettled(promises);
      
      this.emit('prewarm:completed', { name, keysProcessed: keys.length });
      
    } catch (error) {
      this.handleError(`预热执行失败: ${name}`, error);
    }
  }

  /**
   * 停止预热
   */
  stopPrewarm(name: string): void {
    const timer = this.prewarmTimers.get(name);
    if (timer) {
      clearInterval(timer);
      this.prewarmTimers.delete(name);
      this.prewarmConfigs.delete(name);
      
      this.emit('prewarm:stopped', { name });
    }
  }

  /**
   * 缓存失效管理
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    const startTime = Date.now();
    let totalDeleted = 0;
    
    try {
      for (const tag of tags) {
        const pattern = this.buildKey(`tag:${tag}:*`);
        const keys = await this.redis.keys(pattern);
        
        if (keys.length > 0) {
          const deleted = await this.redis.del(...keys);
          totalDeleted += deleted;
        }
      }
      
      this.updateStats('invalidateByTags', Date.now() - startTime);
      this.emit('cache:invalidated', { tags, deletedCount: totalDeleted });
      
      return totalDeleted;
      
    } catch (error) {
      this.handleError('标签失效失败', error);
      this.updateStats('error', Date.now() - startTime);
      return 0;
    }
  }

  /**
   * 分布式锁
   */
  async acquireLock(key: string, ttl: number = 30000): Promise<string | null> {
    const lockKey = this.buildKey(`lock:${key}`);
    const lockValue = `${Date.now()}-${Math.random()}`;
    
    try {
      const result = await this.redis.set(lockKey, lockValue, 'PX', ttl, 'NX');
      
      if (result === 'OK') {
        this.emit('lock:acquired', { key, value: lockValue, ttl });
        return lockValue;
      }
      
      return null;
      
    } catch (error) {
      this.handleError(`获取锁失败: ${key}`, error);
      return null;
    }
  }

  /**
   * 释放分布式锁
   */
  async releaseLock(key: string, lockValue: string): Promise<boolean> {
    const lockKey = this.buildKey(`lock:${key}`);
    
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.redis.eval(script, 1, lockKey, lockValue);
      
      if (result === 1) {
        this.emit('lock:released', { key, value: lockValue });
        return true;
      }
      
      return false;
      
    } catch (error) {
      this.handleError(`释放锁失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalOperations: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      keyCount: 0
    };
    
    this.emit('stats:reset');
  }

  /**
   * 获取缓存信息
   */
  async getInfo(): Promise<Record<string, any>> {
    try {
      const info = await this.redis.info();
      const memory = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        info,
        memory,
        keyspace,
        stats: this.getStats(),
        prewarmConfigs: Array.from(this.prewarmConfigs.entries())
      };
      
    } catch (error) {
      this.handleError('获取缓存信息失败', error);
      return {};
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    try {
      // 停止所有预热定时器
      for (const timer of this.prewarmTimers.values()) {
        clearInterval(timer);
      }
      
      this.prewarmTimers.clear();
      this.prewarmConfigs.clear();
      
      // 关闭Redis连接
      await this.redis.quit();
      
      this.emit('cache:closed');
      
    } catch (error) {
      this.handleError('关闭缓存连接失败', error);
    }
  }

  // 私有辅助方法

  private buildKey(key: string): string {
    return `${this.config.prefix}:${key}`;
  }

  private serialize<T>(data: T): string {
    return JSON.stringify(data);
  }

  private deserialize<T>(data: string): T {
    return JSON.parse(data);
  }

  private async compress(data: string): Promise<string> {
    // 这里可以实现压缩算法，如gzip
    // 为简单起见，返回原数据
    return data;
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private isValid<T>(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    return age < (entry.ttl * 1000);
  }

  private updateStats(operation: string, responseTime: number): void {
    this.stats.totalOperations++;
    
    // 更新平均响应时间
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (this.stats.totalOperations - 1) + responseTime) / 
      this.stats.totalOperations;
    
    if (this.metricsEnabled) {
      this.emit('metrics:updated', { operation, responseTime, stats: this.stats });
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private startMetricsCollection(): void {
    if (!this.metricsEnabled) {
      return;
    }
    
    // 每分钟收集一次内存使用情况
    setInterval(async () => {
      try {
        const info = await this.redis.info('memory');
        const memoryMatch = info.match(/used_memory:(\d+)/);
        if (memoryMatch) {
          this.stats.memoryUsage = parseInt(memoryMatch[1]);
        }
        
        const keyspaceInfo = await this.redis.info('keyspace');
        const keyCountMatch = keyspaceInfo.match(/keys=(\d+)/);
        if (keyCountMatch) {
          this.stats.keyCount = parseInt(keyCountMatch[1]);
        }
        
        this.emit('metrics:collected', this.stats);
        
      } catch (error) {
        console.error('收集指标失败:', error);
      }
    }, 60000);
  }

  private handleError(message: string, error: any): void {
    console.error(`${message}:`, error);
    this.emit('error', { message, error });
    this.stats.errors++;
  }
}

/**
 * 缓存装饰器
 */
export function Cached(key: string, ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`;
      const cacheOptimizer = this.cacheOptimizer as RedisCacheOptimizer;
      
      if (cacheOptimizer) {
        const cached = await cacheOptimizer.get(cacheKey);
        if (cached !== null) {
          return cached;
        }
        
        const result = await originalMethod.apply(this, args);
        await cacheOptimizer.set(cacheKey, result, ttl);
        
        return result;
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// 默认实例
let defaultOptimizer: RedisCacheOptimizer | null = null;

/**
 * 获取默认缓存优化器实例
 */
export function getDefaultCacheOptimizer(): RedisCacheOptimizer {
  if (!defaultOptimizer) {
    const config: CacheConfig = {
      prefix: 'snmp',
      defaultTTL: 3600,
      maxRetries: 3,
      retryDelayMs: 1000,
      compressionThreshold: 1024,
      enableMetrics: true,
      clusterMode: process.env.REDIS_CLUSTER === 'true',
      nodes: process.env.REDIS_NODES?.split(',')
    };
    
    defaultOptimizer = new RedisCacheOptimizer(config);
  }
  
  return defaultOptimizer;
}

export default RedisCacheOptimizer;