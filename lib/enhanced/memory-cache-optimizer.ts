/**
 * 内存缓存优化策略
 * 智能缓存策略、缓存预热和失效机制、内存缓存管理
 * 替代Redis，提供轻量级高性能缓存方案
 * 
 * @author SNMP Platform Team
 * @version 1.0.0
 * @date 2024-12-18
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// 类型定义
export interface CacheConfig {
  prefix: string;
  defaultTTL: number;
  maxRetries: number;
  retryDelayMs: number;
  compressionThreshold: number;
  enableMetrics: boolean;
  maxMemoryMB: number;
  cleanupInterval: number;
}

export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  version: string;
  metadata?: Record<string, any>;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  totalOperations: number;
  averageResponseTime: number;
  memoryUsage: number;
  keyCount: number;
  evictions: number;
}

export interface PrewarmConfig {
  pattern: string;
  refreshInterval: number;
  priority: number;
  maxConcurrency: number;
  batchSize: number;
}

export interface CachePolicy {
  type: 'LRU' | 'LFU' | 'TTL' | 'FIFO';
  maxSize: number;
  cleanupThreshold: number;
}

export interface CacheMetrics {
  hitRatio: number;
  missRatio: number;
  errorRatio: number;
  averageGetTime: number;
  averageSetTime: number;
  totalMemoryUsage: number;
  keyDistribution: Record<string, number>;
}

// 验证模式
const cacheConfigSchema = z.object({
  prefix: z.string().min(1),
  defaultTTL: z.number().positive(),
  maxRetries: z.number().min(0),
  retryDelayMs: z.number().positive(),
  compressionThreshold: z.number().positive(),
  enableMetrics: z.boolean(),
  maxMemoryMB: z.number().positive(),
  cleanupInterval: z.number().positive()
});

const prewarmConfigSchema = z.object({
  pattern: z.string().min(1),
  refreshInterval: z.number().positive(),
  priority: z.number().min(1).max(10),
  maxConcurrency: z.number().positive(),
  batchSize: z.number().positive()
});

/**
 * 内存缓存管理器
 */
export class MemoryCacheManager extends EventEmitter {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private prewarmTasks: Map<string, NodeJS.Timeout> = new Map();
  private operationTimes: number[] = [];
  private maxOperationHistory = 1000;

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    
    this.config = cacheConfigSchema.parse({
      prefix: 'cache',
      defaultTTL: 3600,
      maxRetries: 3,
      retryDelayMs: 100,
      compressionThreshold: 1024,
      enableMetrics: true,
      maxMemoryMB: 256,
      cleanupInterval: 60000,
      ...config
    });

    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalOperations: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      keyCount: 0,
      evictions: 0
    };

    this.startCleanupTimer();
    this.emit('connected');
  }

  /**
   * 获取缓存值
   */
  async get<T = any>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const fullKey = this.buildKey(key);
      const entry = this.cache.get(fullKey);
      
      if (!entry) {
        this.recordMiss();
        return null;
      }

      // 检查是否过期
      if (this.isExpired(entry)) {
        this.cache.delete(fullKey);
        this.recordMiss();
        return null;
      }

      // 更新访问统计
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      this.recordHit();
      this.recordOperationTime(Date.now() - startTime);
      
      return entry.value as T;

    } catch (error) {
      this.recordError();
      this.emit('error', new Error(`Cache get error for key ${key}: ${error}`));
      return null;
    }
  }

  /**
   * 设置缓存值
   */
  async set<T = any>(
    key: string, 
    value: T, 
    ttl?: number, 
    metadata?: Record<string, any>
  ): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const fullKey = this.buildKey(key);
      const effectiveTTL = ttl || this.config.defaultTTL;
      const size = this.estimateSize(value);
      
      // 检查内存使用量
      if (this.shouldEvict(size)) {
        this.performEviction();
      }

      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl: effectiveTTL * 1000, // 转换为毫秒
        version: this.generateVersion(),
        metadata,
        size,
        accessCount: 0,
        lastAccessed: Date.now()
      };

      this.cache.set(fullKey, entry);
      this.updateMemoryUsage();
      this.recordOperationTime(Date.now() - startTime);
      
      this.emit('set', key, value);
      return true;

    } catch (error) {
      this.recordError();
      this.emit('error', new Error(`Cache set error for key ${key}: ${error}`));
      return false;
    }
  }

  /**
   * 删除缓存值
   */
  async del(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const deleted = this.cache.delete(fullKey);
      
      if (deleted) {
        this.updateMemoryUsage();
        this.emit('deleted', key);
      }
      
      return deleted;

    } catch (error) {
      this.recordError();
      this.emit('error', new Error(`Cache delete error for key ${key}: ${error}`));
      return false;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const entry = this.cache.get(fullKey);
      
      if (!entry) {
        return false;
      }

      if (this.isExpired(entry)) {
        this.cache.delete(fullKey);
        return false;
      }

      return true;

    } catch (error) {
      this.recordError();
      return false;
    }
  }

  /**
   * 获取多个键的值
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    const promises = keys.map(key => this.get<T>(key));
    return Promise.all(promises);
  }

  /**
   * 设置多个键值对
   */
  async mset<T = any>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean[]> {
    const promises = entries.map(({ key, value, ttl }) => this.set(key, value, ttl));
    return Promise.all(promises);
  }

  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    try {
      this.cache.clear();
      this.updateMemoryUsage();
      this.emit('cleared');

    } catch (error) {
      this.recordError();
      this.emit('error', new Error(`Cache clear error: ${error}`));
    }
  }

  /**
   * 获取匹配模式的键
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const regex = this.patternToRegex(pattern);
      const matchingKeys: string[] = [];
      
      for (const [fullKey] of this.cache.entries()) {
        const key = this.extractKey(fullKey);
        if (regex.test(key)) {
          matchingKeys.push(key);
        }
      }
      
      return matchingKeys;

    } catch (error) {
      this.recordError();
      this.emit('error', new Error(`Cache keys error: ${error}`));
      return [];
    }
  }

  /**
   * 设置键的过期时间
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const entry = this.cache.get(fullKey);
      
      if (!entry) {
        return false;
      }

      entry.ttl = ttl * 1000; // 转换为毫秒
      entry.timestamp = Date.now();
      
      return true;

    } catch (error) {
      this.recordError();
      return false;
    }
  }

  /**
   * 获取键的剩余过期时间
   */
  async ttl(key: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      const entry = this.cache.get(fullKey);
      
      if (!entry) {
        return -1;
      }

      const remaining = (entry.timestamp + entry.ttl - Date.now()) / 1000;
      return Math.max(0, Math.floor(remaining));

    } catch (error) {
      this.recordError();
      return -1;
    }
  }

  /**
   * 启动缓存预热
   */
  async startPrewarm(config: PrewarmConfig, dataLoader: (key: string) => Promise<any>): Promise<void> {
    const validatedConfig = prewarmConfigSchema.parse(config);
    
    const prewarmFunction = async () => {
      try {
        const keys = await this.keys(validatedConfig.pattern);
        
        // 按批次处理
        for (let i = 0; i < keys.length; i += validatedConfig.batchSize) {
          const batch = keys.slice(i, i + validatedConfig.batchSize);
          
          const promises = batch.map(async (key) => {
            try {
              const data = await dataLoader(key);
              if (data !== null && data !== undefined) {
                await this.set(key, data);
              }
            } catch (error) {
              this.emit('prewarmError', key, error);
            }
          });

          await Promise.all(promises);
        }

        this.emit('prewarmCompleted', validatedConfig.pattern);

      } catch (error) {
        this.emit('prewarmError', validatedConfig.pattern, error);
      }
    };

    // 立即执行一次
    await prewarmFunction();

    // 设置定期刷新
    const timer = setInterval(prewarmFunction, validatedConfig.refreshInterval);
    this.prewarmTasks.set(validatedConfig.pattern, timer);
  }

  /**
   * 停止缓存预热
   */
  stopPrewarm(pattern: string): void {
    const timer = this.prewarmTasks.get(pattern);
    if (timer) {
      clearInterval(timer);
      this.prewarmTasks.delete(pattern);
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * 获取详细指标
   */
  getMetrics(): CacheMetrics {
    const stats = this.getStats();
    
    return {
      hitRatio: stats.totalOperations > 0 ? stats.hits / stats.totalOperations : 0,
      missRatio: stats.totalOperations > 0 ? stats.misses / stats.totalOperations : 0,
      errorRatio: stats.totalOperations > 0 ? stats.errors / stats.totalOperations : 0,
      averageGetTime: this.calculateAverageOperationTime(),
      averageSetTime: this.calculateAverageOperationTime(),
      totalMemoryUsage: stats.memoryUsage,
      keyDistribution: this.getKeyDistribution()
    };
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalOperations: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      keyCount: 0,
      evictions: 0
    };
    this.operationTimes = [];
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    for (const timer of this.prewarmTasks.values()) {
      clearInterval(timer);
    }
    this.prewarmTasks.clear();

    this.cache.clear();
    this.removeAllListeners();
  }

  // 私有方法

  private buildKey(key: string): string {
    return `${this.config.prefix}:${key}`;
  }

  private extractKey(fullKey: string): string {
    return fullKey.replace(`${this.config.prefix}:`, '');
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > (entry.timestamp + entry.ttl);
  }

  private generateVersion(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // 简单估算，UTF-16编码
    } catch {
      return 1000; // 默认大小
    }
  }

  private shouldEvict(newEntrySize: number): boolean {
    const maxBytes = this.config.maxMemoryMB * 1024 * 1024;
    return (this.stats.memoryUsage + newEntrySize) > maxBytes;
  }

  private performEviction(): void {
    // LRU 淘汰策略
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const evictCount = Math.ceil(entries.length * 0.1); // 淘汰10%
    
    for (let i = 0; i < evictCount && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
    
    this.updateMemoryUsage();
    this.emit('eviction', evictCount);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.updateMemoryUsage();
      this.emit('cleanup', cleanedCount);
    }
  }

  private updateMemoryUsage(): void {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    this.stats.memoryUsage = totalSize;
    this.stats.keyCount = this.cache.size;
  }

  private updateStats(): void {
    this.stats.totalOperations = this.stats.hits + this.stats.misses + this.stats.errors;
    this.stats.averageResponseTime = this.calculateAverageOperationTime();
  }

  private recordHit(): void {
    this.stats.hits++;
  }

  private recordMiss(): void {
    this.stats.misses++;
  }

  private recordError(): void {
    this.stats.errors++;
  }

  private recordOperationTime(time: number): void {
    this.operationTimes.push(time);
    if (this.operationTimes.length > this.maxOperationHistory) {
      this.operationTimes.shift();
    }
  }

  private calculateAverageOperationTime(): number {
    if (this.operationTimes.length === 0) return 0;
    const sum = this.operationTimes.reduce((a, b) => a + b, 0);
    return sum / this.operationTimes.length;
  }

  private getKeyDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const [fullKey] of this.cache.entries()) {
      const key = this.extractKey(fullKey);
      const namespace = key.split(':')[0] || 'default';
      distribution[namespace] = (distribution[namespace] || 0) + 1;
    }
    
    return distribution;
  }

  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\*/g, '.*')
      .replace(/\\\?/g, '.');
    return new RegExp(`^${escaped}$`);
  }
}

/**
 * 分层缓存管理器
 */
export class TieredCacheManager {
  private l1Cache: MemoryCacheManager; // 内存缓存
  private l2Cache?: MemoryCacheManager; // 扩展内存缓存

  constructor(
    l1Config: Partial<CacheConfig> = {},
    l2Config?: Partial<CacheConfig>
  ) {
    this.l1Cache = new MemoryCacheManager({
      ...l1Config,
      prefix: 'l1'
    });

    if (l2Config) {
      this.l2Cache = new MemoryCacheManager({
        ...l2Config,
        prefix: 'l2'
      });
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    // 先从L1缓存获取
    let value = await this.l1Cache.get<T>(key);
    if (value !== null) {
      return value;
    }

    // 如果L1缓存没有，从L2缓存获取
    if (this.l2Cache) {
      value = await this.l2Cache.get<T>(key);
      if (value !== null) {
        // 回写到L1缓存
        await this.l1Cache.set(key, value);
        return value;
      }
    }

    return null;
  }

  async set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    // 同时写入L1和L2缓存
    const l1Result = await this.l1Cache.set(key, value, ttl);
    const l2Result = this.l2Cache ? await this.l2Cache.set(key, value, ttl) : true;
    
    return l1Result && l2Result;
  }

  async del(key: string): Promise<boolean> {
    const l1Result = await this.l1Cache.del(key);
    const l2Result = this.l2Cache ? await this.l2Cache.del(key) : true;
    
    return l1Result || l2Result;
  }

  getStats() {
    return {
      l1: this.l1Cache.getStats(),
      l2: this.l2Cache?.getStats()
    };
  }

  destroy(): void {
    this.l1Cache.destroy();
    this.l2Cache?.destroy();
  }
}

// 默认实例
export const defaultCacheManager = new MemoryCacheManager({
  prefix: 'snmp',
  defaultTTL: 3600,
  maxMemoryMB: 128,
  enableMetrics: true
});

// 分层缓存实例
export const tieredCacheManager = new TieredCacheManager(
  { maxMemoryMB: 64, defaultTTL: 300 }, // L1: 小而快
  { maxMemoryMB: 256, defaultTTL: 3600 } // L2: 大而持久
);

export default MemoryCacheManager;