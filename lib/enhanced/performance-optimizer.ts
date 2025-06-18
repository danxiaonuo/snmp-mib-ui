// ÿ'˝h - à˘'ƒ!æ—ßÑ'˝
import { EventEmitter } from 'events'

// ÿ'˝Mn¬p
export const PERFORMANCE_CONFIG = {
  BATCH_SIZE: 50,
  CONCURRENT_OPERATIONS: 20,
  DEFAULT_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CONNECTION_POOL_SIZE: 100,
  QUERY_CACHE_TTL: 300,
  ADAPTIVE_BATCH_SIZE: true,
  PERFORMANCE_MONITORING: true,
  WORKER_THREAD_COUNT: 4,
  MAX_MEMORY_USAGE: 512 * 1024 * 1024, // 512MB
  COMPRESSION_ENABLED: true,
  BATCH_OPTIMIZATION: true
}

// '˝—ß•„
export interface PerformanceMetrics {
  totalDevices: number
  activeConnections: number
  averageResponseTime: number
  successRate: number
  errorCount: number
  cacheHitRate: number
  memoryUsage: number
  cpuUsage: number
  lastUpdate: Date
  throughput: number // œ“Ñæp
}

// ﬁ•`°h
export class ConnectionPool {
  private connections: Map<string, any> = new Map()
  private maxSize: number
  private metrics: PerformanceMetrics
  
  constructor(maxSize: number = PERFORMANCE_CONFIG.CONNECTION_POOL_SIZE) {
    this.maxSize = maxSize
    this.metrics = this.initMetrics()
  }
  
  private initMetrics(): PerformanceMetrics {
    return {
      totalDevices: 0,
      activeConnections: 0,
      averageResponseTime: 0,
      successRate: 0,
      errorCount: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      lastUpdate: new Date(),
      throughput: 0
    }
  }
  
  async getConnection(deviceId: string, config: any): Promise<any> {
    const startTime = Date.now()
    
    if (this.connections.has(deviceId)) {
      const connection = this.connections.get(deviceId)
      this.updateMetrics('hit', Date.now() - startTime)
      return connection
    }
    
    if (this.connections.size >= this.maxSize) {
      // LRUÿpVe
      const oldestKey = this.getOldestConnection()
      await this.releaseConnection(oldestKey)
    }
    
    try {
      const connection = await this.createConnection(config)
      this.connections.set(deviceId, {
        ...connection,
        lastUsed: new Date(),
        useCount: 0
      })
      
      this.updateMetrics('miss', Date.now() - startTime)
      return connection
    } catch (error) {
      this.metrics.errorCount++
      throw error
    }
  }
  
  private async createConnection(config: any): Promise<any> {
    // Ñﬁ•˙;ë
    return {
      config,
      created: new Date(),
      connectionPool: true,
      timeout: PERFORMANCE_CONFIG.DEFAULT_TIMEOUT,
      retries: PERFORMANCE_CONFIG.RETRY_ATTEMPTS
    }
  }
  
  private getOldestConnection(): string {
    let oldestKey = ''
    let oldestTime = new Date()
    
    for (const [key, connection] of this.connections.entries()) {
      if (connection.lastUsed < oldestTime) {
        oldestTime = connection.lastUsed
        oldestKey = key
      }
    }
    
    return oldestKey
  }
  
  async releaseConnection(deviceId: string): Promise<void> {
    const connection = this.connections.get(deviceId)
    if (connection && connection.close) {
      await connection.close()
    }
    this.connections.delete(deviceId)
  }
  
  private updateMetrics(type: 'hit' | 'miss', responseTime: number): void {
    this.metrics.activeConnections = this.connections.size
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + responseTime) / 2
    this.metrics.lastUpdate = new Date()
    
    if (type === 'hit') {
      this.metrics.cacheHitRate = 
        (this.metrics.cacheHitRate * 0.9) + (1 * 0.1)
    } else {
      this.metrics.cacheHitRate = 
        (this.metrics.cacheHitRate * 0.9) + (0 * 0.1)
    }
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }
  
  getActiveCount(): number {
    return this.connections.size
  }
}

// Â‚X°h
export class QueryCache {
  private cache: Map<string, { data: any, expires: Date, hits: number }> = new Map()
  private ttl: number
  private maxSize: number
  private hitCount: number = 0
  private missCount: number = 0
  
  constructor(
    ttl: number = PERFORMANCE_CONFIG.QUERY_CACHE_TTL * 1000,
    maxSize: number = 10000
  ) {
    this.ttl = ttl
    this.maxSize = maxSize
    
    // ö«X
    setInterval(() => this.cleanup(), 60000)
    
    // ÖXãõ—ß
    setInterval(() => this.memoryPressureCheck(), 30000)
  }
  
  set(key: string, data: any): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }
    
    const expires = new Date(Date.now() + this.ttl)
    this.cache.set(key, { data, expires, hits: 0 })
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) {
      this.missCount++
      return null
    }
    
    if (entry.expires < new Date()) {
      this.cache.delete(key)
      this.missCount++
      return null
    }
    
    entry.hits++
    this.hitCount++
    return entry.data
  }
  
  private evictLeastUsed(): void {
    let leastUsedKey = ''
    let leastHits = Infinity
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits
        leastUsedKey = key
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }
  
  private cleanup(): void {
    const now = new Date()
    let cleanedCount = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cache cleanup: removed ${cleanedCount} expired entries`)
    }
  }
  
  private memoryPressureCheck(): void {
    const memUsage = process.memoryUsage()
    if (memUsage.heapUsed > PERFORMANCE_CONFIG.MAX_MEMORY_USAGE) {
      // 30%ÑX
      const toRemove = Math.floor(this.cache.size * 0.3)
      const keys = Array.from(this.cache.keys()).slice(0, toRemove)
      keys.forEach(key => this.cache.delete(key))
      
      console.log(`Memory pressure: cleared ${toRemove} cache entries`)
    }
  }
  
  getHitRate(): number {
    const total = this.hitCount + this.missCount
    return total > 0 ? this.hitCount / total : 0
  }
  
  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.getHitRate(),
      hitCount: this.hitCount,
      missCount: this.missCount
    }
  }
}

// Íîy°h
export class AdaptiveBatchManager {
  private currentBatchSize: number = PERFORMANCE_CONFIG.BATCH_SIZE
  private performanceHistory: number[] = []
  private maxHistory: number = 10
  
  constructor() {
    setInterval(() => this.optimizeBatchSize(), 10000)
  }
  
  getBatchSize(): number {
    return this.currentBatchSize
  }
  
  recordPerformance(responseTime: number, batchSize: number): void {
    const throughput = batchSize / (responseTime / 1000) // œ“p
    this.performanceHistory.push(throughput)
    
    if (this.performanceHistory.length > this.maxHistory) {
      this.performanceHistory.shift()
    }
  }
  
  private optimizeBatchSize(): void {
    if (this.performanceHistory.length < 3) return
    
    const avgThroughput = this.performanceHistory.reduce((a, b) => a + b, 0) / 
                         this.performanceHistory.length
    const recentThroughput = this.performanceHistory.slice(-3).reduce((a, b) => a + b, 0) / 3
    
    if (recentThroughput > avgThroughput * 1.1) {
      // '˝9Ñ’û†y'
      this.currentBatchSize = Math.min(this.currentBatchSize + 5, 100)
    } else if (recentThroughput < avgThroughput * 0.9) {
      // '˝Mœy'
      this.currentBatchSize = Math.max(this.currentBatchSize - 5, 10)
    }
  }
}

// ÿ'˝æ°h
export class HighPerformanceDeviceManager extends EventEmitter {
  private connectionPool: ConnectionPool
  private queryCache: QueryCache
  private batchManager: AdaptiveBatchManager
  private metrics: PerformanceMetrics
  
  constructor() {
    super()
    this.connectionPool = new ConnectionPool()
    this.queryCache = new QueryCache()
    this.batchManager = new AdaptiveBatchManager()
    this.metrics = this.initMetrics()
    
    // /®'˝—ß
    setInterval(() => this.updateMetrics(), 5000)
  }
  
  private initMetrics(): PerformanceMetrics {
    return {
      totalDevices: 0,
      activeConnections: 0,
      averageResponseTime: 0,
      successRate: 0,
      errorCount: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      lastUpdate: new Date(),
      throughput: 0
    }
  }
  
  async queryDevices(deviceIds: string[], options: any = {}): Promise<any[]> {
    const startTime = Date.now()
    const batchSize = this.batchManager.getBatchSize()
    const results: any[] = []
    
    // y
    for (let i = 0; i < deviceIds.length; i += batchSize) {
      const batch = deviceIds.slice(i, i + batchSize)
      const batchResults = await this.processBatch(batch, options)
      results.push(...batchResults)
    }
    
    const totalTime = Date.now() - startTime
    this.batchManager.recordPerformance(totalTime, deviceIds.length)
    
    return results
  }
  
  private async processBatch(deviceIds: string[], options: any): Promise<any[]> {
    const promises = deviceIds.map(deviceId => 
      this.queryDevice(deviceId, options)
    )
    
    return Promise.allSettled(promises).then(results =>
      results.map((result, index) => ({
        deviceId: deviceIds[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }))
    )
  }
  
  private async queryDevice(deviceId: string, options: any): Promise<any> {
    const cacheKey = `${deviceId}_${JSON.stringify(options)}`
    
    // ¿ÂX
    const cached = this.queryCache.get(cacheKey)
    if (cached) {
      return cached
    }
    
    // gLÂ‚
    const startTime = Date.now()
    try {
      const connection = await this.connectionPool.getConnection(deviceId, options)
      const result = await this.executeQuery(connection, options)
      
      // X”ú
      this.queryCache.set(cacheKey, result)
      
      const responseTime = Date.now() - startTime
      this.updateSuccessMetrics(responseTime)
      
      return result
    } catch (error) {
      this.metrics.errorCount++
      throw error
    }
  }
  
  private async executeQuery(connection: any, options: any): Promise<any> {
    // !ﬂSNMPÂ‚
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          deviceInfo: { name: 'Device', status: 'online' },
          interfaces: [],
          timestamp: new Date()
        })
      }, Math.random() * 100 + 50)
    })
  }
  
  private updateSuccessMetrics(responseTime: number): void {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + responseTime) / 2
    this.metrics.successRate = 
      (this.metrics.successRate * 0.95) + (1 * 0.05)
  }
  
  private updateMetrics(): void {
    const memUsage = process.memoryUsage()
    const poolMetrics = this.connectionPool.getMetrics()
    const cacheStats = this.queryCache.getStats()
    
    this.metrics = {
      ...poolMetrics,
      memoryUsage: memUsage.heapUsed,
      cacheHitRate: cacheStats.hitRate,
      lastUpdate: new Date()
    }
    
    this.emit('metricsUpdated', this.metrics)
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }
  
  async cleanup(): Promise<void> {
    // ﬁ•`IDê
  }
}

export default HighPerformanceDeviceManager