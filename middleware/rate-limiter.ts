/**
 * API限流和配额管理中间件
 * 智能限流策略、配额监控、过载保护
 * 
 * @author SNMP Platform Team
 * @version 1.0.0
 * @date 2024-12-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 基础类型定义
export interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  max: number; // 最大请求数
  message?: string; // 限流消息
  standardHeaders?: boolean; // 是否返回标准headers
  legacyHeaders?: boolean; // 是否返回legacy headers
  store?: RateLimitStore; // 存储后端
  keyGenerator?: (req: NextRequest) => string; // 键生成器
  handler?: (req: NextRequest, res: NextResponse) => NextResponse; // 处理器
  skipSuccessfulRequests?: boolean; // 跳过成功请求
  skipFailedRequests?: boolean; // 跳过失败请求
  requestWasSuccessful?: (req: NextRequest, res: NextResponse) => boolean;
}

export interface QuotaConfig {
  daily?: number;
  hourly?: number;
  monthly?: number;
  perUser?: number;
  perTenant?: number;
  resetTime?: string; // 重置时间 (HH:mm)
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  remaining: number;
}

export interface QuotaEntry {
  used: number;
  limit: number;
  resetTime: number;
  percentage: number;
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry, ttl: number): Promise<void>;
  increment(key: string, ttl: number): Promise<RateLimitEntry>;
  reset(key: string): Promise<void>;
  resetAll(): Promise<void>;
}

export interface ThrottleConfig {
  enabled: boolean;
  threshold: number; // CPU/内存阈值
  maxConcurrent: number; // 最大并发数
  queueSize: number; // 队列大小
  timeout: number; // 超时时间
}

export interface ClientInfo {
  ip: string;
  userAgent: string;
  userId?: string;
  tenantId?: string;
  apiKey?: string;
  userTier?: string;
  isBot?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
  retryAfter?: number;
}

export interface AdaptiveConfig {
  enabled: boolean;
  baseLimit: number;
  maxLimit: number;
  minLimit: number;
  adjustmentFactor: number; // 调整因子
  monitoringWindow: number; // 监控窗口
  errorThreshold: number; // 错误阈值
  responseTimeThreshold: number; // 响应时间阈值
}

// 验证模式
const rateLimitConfigSchema = z.object({
  windowMs: z.number().positive(),
  max: z.number().positive(),
  message: z.string().optional(),
  standardHeaders: z.boolean().optional(),
  legacyHeaders: z.boolean().optional(),
  skipSuccessfulRequests: z.boolean().optional(),
  skipFailedRequests: z.boolean().optional()
});

const quotaConfigSchema = z.object({
  daily: z.number().positive().optional(),
  hourly: z.number().positive().optional(),
  monthly: z.number().positive().optional(),
  perUser: z.number().positive().optional(),
  perTenant: z.number().positive().optional(),
  resetTime: z.string().regex(/^\d{2}:\d{2}$/).optional()
});

/**
 * 内存存储实现
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  async set(key: string, entry: RateLimitEntry, ttl: number): Promise<void> {
    this.store.set(key, entry);
    
    // 设置过期定时器
    this.clearTimer(key);
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);
  }

  async increment(key: string, ttl: number): Promise<RateLimitEntry> {
    const now = Date.now();
    const resetTime = now + ttl;
    
    const existing = await this.get(key);
    
    if (existing && now < existing.resetTime) {
      // 增加计数
      existing.count++;
      existing.remaining = Math.max(0, existing.remaining - 1);
      await this.set(key, existing, existing.resetTime - now);
      return existing;
    } else {
      // 创建新条目
      const entry: RateLimitEntry = {
        count: 1,
        resetTime,
        remaining: Math.max(0, 0) // 将在调用处设置正确值
      };
      await this.set(key, entry, ttl);
      return entry;
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
    this.clearTimer(key);
  }

  async resetAll(): Promise<void> {
    this.store.clear();
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  private clearTimer(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }
}

/**
 * Redis存储实现
 */
export class RedisRateLimitStore implements RateLimitStore {
  private redis: any; // Redis客户端

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, entry: RateLimitEntry, ttl: number): Promise<void> {
    try {
      await this.redis.setex(key, Math.ceil(ttl / 1000), JSON.stringify(entry));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async increment(key: string, ttl: number): Promise<RateLimitEntry> {
    try {
      const lua = `
        local key = KEYS[1]
        local ttl = ARGV[1]
        local now = ARGV[2]
        local resetTime = now + ttl
        
        local current = redis.call('GET', key)
        if current then
          local entry = cjson.decode(current)
          if now < entry.resetTime then
            entry.count = entry.count + 1
            entry.remaining = math.max(0, entry.remaining - 1)
            redis.call('SETEX', key, math.ceil((entry.resetTime - now) / 1000), cjson.encode(entry))
            return cjson.encode(entry)
          end
        end
        
        local newEntry = {
          count = 1,
          resetTime = resetTime,
          remaining = 0
        }
        redis.call('SETEX', key, math.ceil(ttl / 1000), cjson.encode(newEntry))
        return cjson.encode(newEntry)
      `;
      
      const result = await this.redis.eval(lua, 1, key, ttl, Date.now());
      return JSON.parse(result);
    } catch (error) {
      console.error('Redis increment error:', error);
      // 降级到简单实现
      const now = Date.now();
      const entry: RateLimitEntry = {
        count: 1,
        resetTime: now + ttl,
        remaining: 0
      };
      await this.set(key, entry, ttl);
      return entry;
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis reset error:', error);
    }
  }

  async resetAll(): Promise<void> {
    try {
      const keys = await this.redis.keys('ratelimit:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis resetAll error:', error);
    }
  }
}

/**
 * 自适应限流器
 */
export class AdaptiveRateLimiter {
  private config: AdaptiveConfig;
  private currentLimit: number;
  private metrics: {
    requestCount: number;
    errorCount: number;
    totalResponseTime: number;
    windowStart: number;
  };

  constructor(config: AdaptiveConfig) {
    this.config = config;
    this.currentLimit = config.baseLimit;
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      windowStart: Date.now()
    };
  }

  /**
   * 获取当前限制
   */
  getCurrentLimit(): number {
    return this.currentLimit;
  }

  /**
   * 记录请求指标
   */
  recordRequest(responseTime: number, isError: boolean): void {
    if (!this.config.enabled) return;

    const now = Date.now();
    
    // 检查是否需要重置窗口
    if (now - this.metrics.windowStart > this.config.monitoringWindow) {
      this.adjustLimit();
      this.resetMetrics(now);
    }

    this.metrics.requestCount++;
    this.metrics.totalResponseTime += responseTime;
    
    if (isError) {
      this.metrics.errorCount++;
    }
  }

  /**
   * 调整限制
   */
  private adjustLimit(): void {
    if (this.metrics.requestCount === 0) return;

    const errorRate = this.metrics.errorCount / this.metrics.requestCount;
    const avgResponseTime = this.metrics.totalResponseTime / this.metrics.requestCount;

    let adjustment = 0;

    // 根据错误率调整
    if (errorRate > this.config.errorThreshold) {
      adjustment -= this.config.adjustmentFactor;
    } else if (errorRate < this.config.errorThreshold / 2) {
      adjustment += this.config.adjustmentFactor / 2;
    }

    // 根据响应时间调整
    if (avgResponseTime > this.config.responseTimeThreshold) {
      adjustment -= this.config.adjustmentFactor;
    } else if (avgResponseTime < this.config.responseTimeThreshold / 2) {
      adjustment += this.config.adjustmentFactor / 2;
    }

    // 应用调整
    this.currentLimit = Math.max(
      this.config.minLimit,
      Math.min(this.config.maxLimit, this.currentLimit + adjustment)
    );
  }

  /**
   * 重置指标
   */
  private resetMetrics(now: number): void {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      windowStart: now
    };
  }
}

/**
 * 客户端识别器
 */
export class ClientIdentifier {
  /**
   * 提取客户端信息
   */
  static extractClientInfo(req: NextRequest): ClientInfo {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0].trim() || realIp || 'unknown';
    
    const userAgent = req.headers.get('user-agent') || '';
    const authorization = req.headers.get('authorization');
    
    // 从URL或header提取用户和租户信息
    const userId = req.headers.get('x-user-id') || undefined;
    const tenantId = req.headers.get('x-tenant-id') || undefined;
    const apiKey = authorization?.startsWith('Bearer ') ? 
      authorization.substring(7) : undefined;
    
    const userTier = req.headers.get('x-user-tier') || 'basic';
    
    // 检测机器人
    const isBot = this.detectBot(userAgent);

    return {
      ip,
      userAgent,
      userId,
      tenantId,
      apiKey,
      userTier,
      isBot
    };
  }

  /**
   * 检测机器人
   */
  private static detectBot(userAgent: string): boolean {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http-client/i
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * 生成限流键
   */
  static generateKey(prefix: string, clientInfo: ClientInfo, granularity: string): string {
    const parts = [prefix];
    
    switch (granularity) {
      case 'ip':
        parts.push(clientInfo.ip);
        break;
      case 'user':
        parts.push(clientInfo.userId || clientInfo.ip);
        break;
      case 'tenant':
        parts.push(clientInfo.tenantId || clientInfo.ip);
        break;
      case 'api-key':
        parts.push(clientInfo.apiKey || clientInfo.ip);
        break;
      default:
        parts.push(clientInfo.ip);
    }
    
    return parts.join(':');
  }
}

/**
 * 智能限流中间件
 */
export class IntelligentRateLimiter {
  private store: RateLimitStore;
  private adaptiveLimiter?: AdaptiveRateLimiter;
  private quotaStore: Map<string, QuotaEntry> = new Map();
  private throttleConfig: ThrottleConfig;
  private currentConcurrent: number = 0;
  private requestQueue: Array<() => void> = [];

  constructor(
    store?: RateLimitStore,
    adaptiveConfig?: AdaptiveConfig,
    throttleConfig?: ThrottleConfig
  ) {
    this.store = store || new MemoryRateLimitStore();
    
    if (adaptiveConfig?.enabled) {
      this.adaptiveLimiter = new AdaptiveRateLimiter(adaptiveConfig);
    }

    this.throttleConfig = throttleConfig || {
      enabled: false,
      threshold: 80,
      maxConcurrent: 100,
      queueSize: 50,
      timeout: 30000
    };
  }

  /**
   * 创建限流中间件
   */
  createRateLimitMiddleware(config: RateLimitConfig) {
    const validatedConfig = rateLimitConfigSchema.parse(config);
    
    return async (req: NextRequest): Promise<NextResponse> => {
      try {
        // 提取客户端信息
        const clientInfo = ClientIdentifier.extractClientInfo(req);
        
        // 检查节流
        if (this.throttleConfig.enabled) {
          const throttleResult = await this.checkThrottle();
          if (!throttleResult.allowed) {
            return new NextResponse('Service Temporarily Unavailable', {
              status: 503,
              headers: {
                'Retry-After': '60',
                'X-RateLimit-Reason': 'server-overload'
              }
            });
          }
        }

        // 生成限流键
        const keyGenerator = config.keyGenerator || 
          ((req: NextRequest) => ClientIdentifier.generateKey('ratelimit', clientInfo, 'ip'));
        const key = keyGenerator(req);

        // 获取当前限制（自适应或固定）
        const currentMax = this.adaptiveLimiter ? 
          this.adaptiveLimiter.getCurrentLimit() : validatedConfig.max;

        // 检查限流
        const result = await this.checkRateLimit(key, currentMax, validatedConfig.windowMs);
        
        if (!result.allowed) {
          const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
          
          return new NextResponse(validatedConfig.message || 'Too Many Requests', {
            status: 429,
            headers: {
              'X-RateLimit-Limit': currentMax.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Reason': 'rate-limit-exceeded'
            }
          });
        }

        // 设置限流headers
        const response = NextResponse.next();
        
        if (validatedConfig.standardHeaders !== false) {
          response.headers.set('X-RateLimit-Limit', currentMax.toString());
          response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
          response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
        }

        // 增加并发计数
        this.currentConcurrent++;

        return response;

      } catch (error) {
        console.error('Rate limit middleware error:', error);
        return NextResponse.next();
      } finally {
        // 减少并发计数
        this.currentConcurrent = Math.max(0, this.currentConcurrent - 1);
        this.processQueue();
      }
    };
  }

  /**
   * 创建配额中间件
   */
  createQuotaMiddleware(config: QuotaConfig) {
    const validatedConfig = quotaConfigSchema.parse(config);
    
    return async (req: NextRequest): Promise<NextResponse> => {
      try {
        const clientInfo = ClientIdentifier.extractClientInfo(req);
        
        // 检查各种配额
        const quotaChecks = [];
        
        if (validatedConfig.daily) {
          quotaChecks.push(this.checkQuota('daily', clientInfo, validatedConfig.daily));
        }
        
        if (validatedConfig.hourly) {
          quotaChecks.push(this.checkQuota('hourly', clientInfo, validatedConfig.hourly));
        }
        
        if (validatedConfig.monthly) {
          quotaChecks.push(this.checkQuota('monthly', clientInfo, validatedConfig.monthly));
        }

        const quotaResults = await Promise.all(quotaChecks);
        const failedQuota = quotaResults.find(r => !r.allowed);
        
        if (failedQuota) {
          return new NextResponse('Quota Exceeded', {
            status: 429,
            headers: {
              'X-Quota-Limit': failedQuota.limit.toString(),
              'X-Quota-Used': failedQuota.used.toString(),
              'X-Quota-Reset': failedQuota.resetTime.toString(),
              'X-RateLimit-Reason': 'quota-exceeded'
            }
          });
        }

        return NextResponse.next();

      } catch (error) {
        console.error('Quota middleware error:', error);
        return NextResponse.next();
      }
    };
  }

  /**
   * 检查限流
   */
  private async checkRateLimit(
    key: string, 
    max: number, 
    windowMs: number
  ): Promise<RateLimitResult> {
    const entry = await this.store.increment(key, windowMs);
    
    // 设置正确的remaining值
    entry.remaining = Math.max(0, max - entry.count);
    
    return {
      allowed: entry.count <= max,
      remaining: entry.remaining,
      resetTime: entry.resetTime,
      totalHits: entry.count,
      retryAfter: entry.count > max ? Math.ceil((entry.resetTime - Date.now()) / 1000) : undefined
    };
  }

  /**
   * 检查配额
   */
  private async checkQuota(
    type: string, 
    clientInfo: ClientInfo, 
    limit: number
  ): Promise<{ allowed: boolean; used: number; limit: number; resetTime: number }> {
    const key = `quota:${type}:${clientInfo.userId || clientInfo.ip}`;
    const now = Date.now();
    
    // 计算重置时间
    let resetTime: number;
    switch (type) {
      case 'hourly':
        resetTime = now + (60 * 60 * 1000) - (now % (60 * 60 * 1000));
        break;
      case 'daily':
        resetTime = now + (24 * 60 * 60 * 1000) - (now % (24 * 60 * 60 * 1000));
        break;
      case 'monthly':
        const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
        resetTime = nextMonth.getTime();
        break;
      default:
        resetTime = now + (60 * 60 * 1000);
    }

    let quota = this.quotaStore.get(key);
    
    if (!quota || now >= quota.resetTime) {
      quota = {
        used: 1,
        limit,
        resetTime,
        percentage: (1 / limit) * 100
      };
    } else {
      quota.used++;
      quota.percentage = (quota.used / quota.limit) * 100;
    }
    
    this.quotaStore.set(key, quota);
    
    return {
      allowed: quota.used <= quota.limit,
      used: quota.used,
      limit: quota.limit,
      resetTime: quota.resetTime
    };
  }

  /**
   * 检查节流
   */
  private async checkThrottle(): Promise<{ allowed: boolean }> {
    if (!this.throttleConfig.enabled) {
      return { allowed: true };
    }

    // 检查并发限制
    if (this.currentConcurrent >= this.throttleConfig.maxConcurrent) {
      // 如果队列未满，加入队列
      if (this.requestQueue.length < this.throttleConfig.queueSize) {
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve({ allowed: false });
          }, this.throttleConfig.timeout);

          this.requestQueue.push(() => {
            clearTimeout(timeout);
            resolve({ allowed: true });
          });
        });
      } else {
        return { allowed: false };
      }
    }

    return { allowed: true };
  }

  /**
   * 处理队列
   */
  private processQueue(): void {
    if (this.requestQueue.length > 0 && 
        this.currentConcurrent < this.throttleConfig.maxConcurrent) {
      const next = this.requestQueue.shift();
      if (next) {
        next();
      }
    }
  }

  /**
   * 记录请求指标（用于自适应限流）
   */
  recordMetrics(responseTime: number, isError: boolean): void {
    if (this.adaptiveLimiter) {
      this.adaptiveLimiter.recordRequest(responseTime, isError);
    }
  }

  /**
   * 重置限流数据
   */
  async resetRateLimit(key?: string): Promise<void> {
    if (key) {
      await this.store.reset(key);
    } else {
      await this.store.resetAll();
    }
  }

  /**
   * 重置配额数据
   */
  resetQuota(key?: string): void {
    if (key) {
      this.quotaStore.delete(key);
    } else {
      this.quotaStore.clear();
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): any {
    return {
      currentConcurrent: this.currentConcurrent,
      queueLength: this.requestQueue.length,
      quotaEntries: this.quotaStore.size,
      adaptiveLimit: this.adaptiveLimiter?.getCurrentLimit()
    };
  }
}

/**
 * 预设配置
 */
export const RATE_LIMIT_PRESETS = {
  // 严格限制
  strict: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100,
    message: 'Too many requests, please try again later.'
  },
  
  // 标准限制
  standard: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 1000,
    message: 'Rate limit exceeded.'
  },
  
  // 宽松限制
  lenient: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5000,
    message: 'Rate limit exceeded.'
  },
  
  // API限制
  api: {
    windowMs: 60 * 1000, // 1分钟
    max: 60,
    message: 'API rate limit exceeded.'
  }
};

export const QUOTA_PRESETS = {
  // 免费用户
  free: {
    daily: 1000,
    hourly: 100,
    monthly: 10000
  },
  
  // 专业用户
  professional: {
    daily: 10000,
    hourly: 1000,
    monthly: 100000
  },
  
  // 企业用户
  enterprise: {
    daily: 100000,
    hourly: 10000,
    monthly: 1000000
  }
};

// 默认实例
export const defaultRateLimiter = new IntelligentRateLimiter(
  new MemoryRateLimitStore(),
  {
    enabled: true,
    baseLimit: 1000,
    maxLimit: 5000,
    minLimit: 100,
    adjustmentFactor: 100,
    monitoringWindow: 5 * 60 * 1000, // 5分钟
    errorThreshold: 0.1, // 10%
    responseTimeThreshold: 2000 // 2秒
  },
  {
    enabled: true,
    threshold: 80,
    maxConcurrent: 100,
    queueSize: 50,
    timeout: 30000
  }
);

/**
 * 便捷函数：创建基本限流中间件
 */
export function createRateLimit(config: RateLimitConfig) {
  return defaultRateLimiter.createRateLimitMiddleware(config);
}

/**
 * 便捷函数：创建配额中间件
 */
export function createQuotaLimit(config: QuotaConfig) {
  return defaultRateLimiter.createQuotaMiddleware(config);
}

export default IntelligentRateLimiter;