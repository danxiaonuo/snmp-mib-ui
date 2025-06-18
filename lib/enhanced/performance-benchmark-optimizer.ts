// 性能基准测试和优化建议系统
import fs from 'fs/promises'
import path from 'path'
import { performance } from 'perf_hooks'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import { EventEmitter } from 'events'

const execAsync = promisify(exec)

export interface BenchmarkConfig {
  id: string
  name: string
  description: string
  type: 'snmp_performance' | 'prometheus_performance' | 'network_latency' | 'throughput' | 'resource_usage'
  target: {
    host: string
    port: number
    protocol: 'http' | 'https' | 'snmp' | 'tcp' | 'udp'
    path?: string
  }
  parameters: {
    duration: number // 测试持续时间(秒)
    concurrency: number // 并发数
    requestRate?: number // 请求速率(QPS)
    timeout: number // 超时时间(秒)
    iterations?: number // 迭代次数
    warmupTime?: number // 预热时间(秒)
    cooldownTime?: number // 冷却时间(秒)
  }
  thresholds: {
    maxLatency: number // 最大延迟(ms)
    maxErrorRate: number // 最大错误率(%)
    minThroughput: number // 最小吞吐量
    maxCpuUsage: number // 最大CPU使用率(%)
    maxMemoryUsage: number // 最大内存使用率(%)
  }
  enabled: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface BenchmarkResult {
  id: string
  configId: string
  startTime: Date
  endTime: Date
  duration: number
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  metrics: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    errorRate: number
    averageLatency: number
    medianLatency: number
    p95Latency: number
    p99Latency: number
    minLatency: number
    maxLatency: number
    throughput: number // requests per second
    dataTransferred: number // bytes
    bandwidth: number // bytes per second
  }
  resourceUsage: {
    cpu: {
      average: number
      peak: number
      samples: Array<{ timestamp: Date, value: number }>
    }
    memory: {
      average: number
      peak: number
      samples: Array<{ timestamp: Date, value: number }>
    }
    network: {
      bytesIn: number
      bytesOut: number
      packetsIn: number
      packetsOut: number
    }
    disk: {
      readBytes: number
      writeBytes: number
      readOps: number
      writeOps: number
    }
  }
  errors: Array<{
    timestamp: Date
    type: string
    message: string
    count: number
  }>
  thresholdResults: {
    latency: { passed: boolean, value: number, threshold: number }
    errorRate: { passed: boolean, value: number, threshold: number }
    throughput: { passed: boolean, value: number, threshold: number }
    cpuUsage: { passed: boolean, value: number, threshold: number }
    memoryUsage: { passed: boolean, value: number, threshold: number }
  }
  score: number // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface PerformanceOptimization {
  id: string
  title: string
  description: string
  category: 'configuration' | 'infrastructure' | 'network' | 'application' | 'monitoring'
  priority: 'low' | 'medium' | 'high' | 'critical'
  impact: {
    latency?: number // 预期延迟改善(ms)
    throughput?: number // 预期吞吐量改善(%)
    resourceUsage?: number // 预期资源使用率改善(%)
    reliability?: number // 预期可靠性改善(%)
  }
  implementation: {
    effort: 'low' | 'medium' | 'high'
    complexity: 'simple' | 'moderate' | 'complex'
    riskLevel: 'low' | 'medium' | 'high'
    prerequisites: string[]
    steps: string[]
    rollbackPlan: string[]
  }
  applicableScenarios: string[]
  metrics: string[]
  references: string[]
  automated: boolean
  automationScript?: string
}

export interface PerformanceReport {
  id: string
  name: string
  generatedAt: Date
  timeRange: { start: Date, end: Date }
  summary: {
    totalBenchmarks: number
    passedBenchmarks: number
    failedBenchmarks: number
    averageScore: number
    overallGrade: string
    keyFindings: string[]
  }
  results: BenchmarkResult[]
  optimizations: PerformanceOptimization[]
  trends: {
    latencyTrend: 'improving' | 'degrading' | 'stable'
    throughputTrend: 'improving' | 'degrading' | 'stable'
    errorRateTrend: 'improving' | 'degrading' | 'stable'
    resourceUsageTrend: 'improving' | 'degrading' | 'stable'
  }
  recommendations: {
    immediate: PerformanceOptimization[]
    shortTerm: PerformanceOptimization[]
    longTerm: PerformanceOptimization[]
  }
}

export interface LoadTestScenario {
  id: string
  name: string
  description: string
  type: 'load' | 'stress' | 'spike' | 'volume' | 'endurance'
  pattern: 'constant' | 'ramp_up' | 'ramp_down' | 'spike' | 'sawtooth' | 'step'
  phases: Array<{
    name: string
    duration: number
    load: number
    description: string
  }>
  targets: Array<{
    type: 'snmp_device' | 'prometheus' | 'categraf' | 'api_endpoint'
    config: any
  }>
  expectedBehavior: {
    maxResponseTime: number
    maxErrorRate: number
    resourceUtilization: {
      cpu: number
      memory: number
      network: number
    }
  }
}

export class PerformanceBenchmarkOptimizer extends EventEmitter {
  private configsPath: string
  private resultsPath: string
  private reportsPath: string
  private configs: Map<string, BenchmarkConfig> = new Map()
  private results: Map<string, BenchmarkResult> = new Map()
  private runningBenchmarks: Map<string, any> = new Map()
  private optimizations: Map<string, PerformanceOptimization> = new Map()

  constructor(basePath: string = '/etc/snmp-configs/performance') {
    super()
    this.configsPath = path.join(basePath, 'configs')
    this.resultsPath = path.join(basePath, 'results')
    this.reportsPath = path.join(basePath, 'reports')
    this.initializeStorage()
    this.initializeDefaultConfigs()
    this.initializeOptimizations()
  }

  // 初始化存储
  private async initializeStorage() {
    try {
      await fs.mkdir(this.configsPath, { recursive: true })
      await fs.mkdir(this.resultsPath, { recursive: true })
      await fs.mkdir(this.reportsPath, { recursive: true })
    } catch (error) {
      console.error('Failed to initialize performance storage:', error)
    }
  }

  // 初始化默认配置
  private initializeDefaultConfigs() {
    const defaultConfigs: BenchmarkConfig[] = [
      {
        id: 'snmp_device_performance',
        name: 'SNMP设备性能测试',
        description: '测试SNMP设备的响应性能和吞吐量',
        type: 'snmp_performance',
        target: {
          host: '192.168.1.1',
          port: 161,
          protocol: 'snmp'
        },
        parameters: {
          duration: 300,
          concurrency: 10,
          timeout: 5,
          iterations: 1000,
          warmupTime: 30,
          cooldownTime: 10
        },
        thresholds: {
          maxLatency: 1000,
          maxErrorRate: 5,
          minThroughput: 50,
          maxCpuUsage: 80,
          maxMemoryUsage: 70
        },
        enabled: true,
        tags: ['snmp', 'device', 'network'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'prometheus_query_performance',
        name: 'Prometheus查询性能测试',
        description: '测试Prometheus查询的响应时间和资源使用',
        type: 'prometheus_performance',
        target: {
          host: 'localhost',
          port: 9090,
          protocol: 'http',
          path: '/api/v1/query'
        },
        parameters: {
          duration: 180,
          concurrency: 5,
          requestRate: 10,
          timeout: 10,
          warmupTime: 15
        },
        thresholds: {
          maxLatency: 5000,
          maxErrorRate: 2,
          minThroughput: 8,
          maxCpuUsage: 70,
          maxMemoryUsage: 80
        },
        enabled: true,
        tags: ['prometheus', 'query', 'monitoring'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'network_latency_test',
        name: '网络延迟测试',
        description: '测试网络连接的延迟和丢包率',
        type: 'network_latency',
        target: {
          host: '8.8.8.8',
          port: 53,
          protocol: 'udp'
        },
        parameters: {
          duration: 60,
          concurrency: 1,
          timeout: 5,
          iterations: 100
        },
        thresholds: {
          maxLatency: 100,
          maxErrorRate: 1,
          minThroughput: 95,
          maxCpuUsage: 20,
          maxMemoryUsage: 10
        },
        enabled: true,
        tags: ['network', 'latency', 'connectivity'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'categraf_collection_performance',
        name: 'Categraf采集性能测试',
        description: '测试Categraf数据采集的性能和稳定性',
        type: 'throughput',
        target: {
          host: 'localhost',
          port: 8080,
          protocol: 'http',
          path: '/metrics'
        },
        parameters: {
          duration: 240,
          concurrency: 3,
          requestRate: 2,
          timeout: 30
        },
        thresholds: {
          maxLatency: 10000,
          maxErrorRate: 1,
          minThroughput: 1.8,
          maxCpuUsage: 50,
          maxMemoryUsage: 60
        },
        enabled: true,
        tags: ['categraf', 'collection', 'monitoring'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    defaultConfigs.forEach(config => {
      this.configs.set(config.id, config)
    })
  }

  // 初始化优化建议
  private initializeOptimizations() {
    const optimizations: PerformanceOptimization[] = [
      {
        id: 'snmp_bulk_requests',
        title: '启用SNMP批量请求',
        description: '使用SNMP getBulk操作减少网络往返次数',
        category: 'configuration',
        priority: 'high',
        impact: {
          latency: -200,
          throughput: 30,
          resourceUsage: -15
        },
        implementation: {
          effort: 'low',
          complexity: 'simple',
          riskLevel: 'low',
          prerequisites: ['设备支持SNMPv2c或v3'],
          steps: [
            '检查设备SNMP版本支持',
            '配置SNMP Exporter使用getBulk',
            '调整max_repetitions参数',
            '测试批量请求功能',
            '监控性能改善'
          ],
          rollbackPlan: [
            '恢复原始配置',
            '重启SNMP Exporter',
            '验证功能正常'
          ]
        },
        applicableScenarios: [
          'SNMP设备延迟较高',
          '需要采集大量OID',
          '网络带宽有限'
        ],
        metrics: ['snmp_request_latency', 'snmp_throughput', 'network_utilization'],
        references: [
          'RFC 1905 - Protocol Operations for SNMPv2',
          'SNMP Exporter Documentation'
        ],
        automated: true,
        automationScript: 'optimizeSNMPBulkRequests'
      },
      {
        id: 'prometheus_query_optimization',
        title: 'Prometheus查询优化',
        description: '优化PromQL查询以减少计算复杂度',
        category: 'configuration',
        priority: 'medium',
        impact: {
          latency: -500,
          resourceUsage: -25
        },
        implementation: {
          effort: 'medium',
          complexity: 'moderate',
          riskLevel: 'medium',
          prerequisites: ['访问Prometheus配置', '了解PromQL语法'],
          steps: [
            '分析慢查询日志',
            '识别复杂查询',
            '优化查询语法',
            '添加适当的标签过滤',
            '测试查询性能',
            '更新告警规则'
          ],
          rollbackPlan: [
            '恢复原始查询',
            '重新加载配置',
            '验证告警正常'
          ]
        },
        applicableScenarios: [
          'Prometheus查询延迟高',
          '资源使用率高',
          '大量时间序列数据'
        ],
        metrics: ['query_duration', 'prometheus_cpu_usage', 'prometheus_memory_usage'],
        references: [
          'Prometheus Query Optimization Guide',
          'PromQL Best Practices'
        ],
        automated: false
      },
      {
        id: 'monitoring_interval_tuning',
        title: '监控间隔调优',
        description: '根据监控需求调整采集间隔以平衡性能和精度',
        category: 'configuration',
        priority: 'medium',
        impact: {
          resourceUsage: -20,
          reliability: 10
        },
        implementation: {
          effort: 'low',
          complexity: 'simple',
          riskLevel: 'low',
          prerequisites: ['了解监控需求', '访问配置文件'],
          steps: [
            '分析当前采集间隔',
            '评估监控精度需求',
            '调整关键指标间隔',
            '优化非关键指标间隔',
            '测试性能影响',
            '监控数据质量'
          ],
          rollbackPlan: [
            '恢复原始间隔设置',
            '重启监控服务',
            '验证数据采集正常'
          ]
        },
        applicableScenarios: [
          '监控系统负载高',
          '网络带宽有限',
          '存储空间不足'
        ],
        metrics: ['collection_rate', 'system_load', 'network_bandwidth'],
        references: [
          'Monitoring Best Practices',
          'Data Collection Optimization'
        ],
        automated: true,
        automationScript: 'optimizeMonitoringIntervals'
      },
      {
        id: 'connection_pooling',
        title: '连接池优化',
        description: '配置连接池以减少连接建立开销',
        category: 'infrastructure',
        priority: 'high',
        impact: {
          latency: -150,
          throughput: 25,
          resourceUsage: -10
        },
        implementation: {
          effort: 'medium',
          complexity: 'moderate',
          riskLevel: 'medium',
          prerequisites: ['支持连接池的客户端', '了解并发需求'],
          steps: [
            '评估当前连接模式',
            '配置连接池大小',
            '设置连接超时参数',
            '启用连接复用',
            '监控连接使用情况',
            '调优连接池参数'
          ],
          rollbackPlan: [
            '禁用连接池',
            '恢复原始连接模式',
            '重启相关服务'
          ]
        },
        applicableScenarios: [
          '高并发访问',
          '频繁建立连接',
          '网络延迟较高'
        ],
        metrics: ['connection_count', 'connection_latency', 'resource_utilization'],
        references: [
          'Connection Pooling Best Practices',
          'Network Performance Optimization'
        ],
        automated: false
      },
      {
        id: 'cache_optimization',
        title: '缓存策略优化',
        description: '实施智能缓存以减少重复查询',
        category: 'application',
        priority: 'medium',
        impact: {
          latency: -300,
          throughput: 40,
          resourceUsage: -20
        },
        implementation: {
          effort: 'high',
          complexity: 'complex',
          riskLevel: 'medium',
          prerequisites: ['缓存系统', '数据一致性策略'],
          steps: [
            '分析查询模式',
            '设计缓存键策略',
            '配置缓存TTL',
            '实施缓存更新机制',
            '监控缓存命中率',
            '优化缓存大小'
          ],
          rollbackPlan: [
            '禁用缓存',
            '清空缓存数据',
            '恢复直接查询'
          ]
        },
        applicableScenarios: [
          '重复查询较多',
          '数据变化不频繁',
          '查询延迟要求严格'
        ],
        metrics: ['cache_hit_rate', 'query_latency', 'memory_usage'],
        references: [
          'Caching Strategies',
          'Performance Caching Patterns'
        ],
        automated: false
      },
      {
        id: 'parallel_processing',
        title: '并行处理优化',
        description: '启用并行处理以提高数据处理效率',
        category: 'application',
        priority: 'high',
        impact: {
          throughput: 50,
          latency: -100
        },
        implementation: {
          effort: 'medium',
          complexity: 'moderate',
          riskLevel: 'medium',
          prerequisites: ['多核CPU', '线程安全的代码'],
          steps: [
            '分析处理瓶颈',
            '识别可并行化的任务',
            '配置工作线程数',
            '实施任务分配策略',
            '监控并行效果',
            '调优线程参数'
          ],
          rollbackPlan: [
            '恢复串行处理',
            '调整线程配置',
            '验证数据一致性'
          ]
        },
        applicableScenarios: [
          'CPU密集型任务',
          '大量数据处理',
          '多核系统环境'
        ],
        metrics: ['processing_throughput', 'cpu_utilization', 'task_completion_time'],
        references: [
          'Parallel Processing Patterns',
          'Concurrent Programming Best Practices'
        ],
        automated: true,
        automationScript: 'enableParallelProcessing'
      }
    ]

    optimizations.forEach(opt => {
      this.optimizations.set(opt.id, opt)
    })
  }

  // 创建基准测试配置
  async createBenchmarkConfig(configData: Omit<BenchmarkConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<BenchmarkConfig> {
    const config: BenchmarkConfig = {
      ...configData,
      id: `benchmark_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.configs.set(config.id, config)
    await this.saveBenchmarkConfig(config)

    return config
  }

  // 保存基准测试配置
  private async saveBenchmarkConfig(config: BenchmarkConfig) {
    const configFile = path.join(this.configsPath, `${config.id}.json`)
    await fs.writeFile(configFile, JSON.stringify(config, null, 2))
  }

  // 运行基准测试
  async runBenchmark(configId: string): Promise<BenchmarkResult> {
    const config = this.configs.get(configId)
    if (!config) {
      throw new Error(`Benchmark config ${configId} not found`)
    }

    if (!config.enabled) {
      throw new Error(`Benchmark config ${configId} is disabled`)
    }

    const resultId = `result_${Date.now()}_${configId}`
    const result: BenchmarkResult = {
      id: resultId,
      configId,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      status: 'running',
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        errorRate: 0,
        averageLatency: 0,
        medianLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        minLatency: 0,
        maxLatency: 0,
        throughput: 0,
        dataTransferred: 0,
        bandwidth: 0
      },
      resourceUsage: {
        cpu: { average: 0, peak: 0, samples: [] },
        memory: { average: 0, peak: 0, samples: [] },
        network: { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 },
        disk: { readBytes: 0, writeBytes: 0, readOps: 0, writeOps: 0 }
      },
      errors: [],
      thresholdResults: {
        latency: { passed: false, value: 0, threshold: config.thresholds.maxLatency },
        errorRate: { passed: false, value: 0, threshold: config.thresholds.maxErrorRate },
        throughput: { passed: false, value: 0, threshold: config.thresholds.minThroughput },
        cpuUsage: { passed: false, value: 0, threshold: config.thresholds.maxCpuUsage },
        memoryUsage: { passed: false, value: 0, threshold: config.thresholds.maxMemoryUsage }
      },
      score: 0,
      grade: 'F'
    }

    this.results.set(resultId, result)
    this.emit('benchmarkStarted', { configId, resultId })

    try {
      // 预热阶段
      if (config.parameters.warmupTime && config.parameters.warmupTime > 0) {
        await this.warmupPhase(config, result)
      }

      // 执行主要测试
      await this.executeBenchmark(config, result)

      // 冷却阶段
      if (config.parameters.cooldownTime && config.parameters.cooldownTime > 0) {
        await this.cooldownPhase(config, result)
      }

      result.status = 'completed'
      result.endTime = new Date()
      result.duration = result.endTime.getTime() - result.startTime.getTime()

      // 计算最终指标
      this.calculateFinalMetrics(result)
      this.evaluateThresholds(config, result)
      this.calculateScore(result)

      this.emit('benchmarkCompleted', result)

    } catch (error) {
      result.status = 'failed'
      result.endTime = new Date()
      result.errors.push({
        timestamp: new Date(),
        type: 'execution_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        count: 1
      })

      this.emit('benchmarkFailed', { resultId, error })
    }

    await this.saveBenchmarkResult(result)
    return result
  }

  // 预热阶段
  private async warmupPhase(config: BenchmarkConfig, result: BenchmarkResult) {
    this.emit('warmupStarted', { configId: config.id })
    
    // 简单的预热逻辑
    const warmupRequests = Math.min(config.parameters.concurrency * 10, 100)
    
    for (let i = 0; i < warmupRequests; i++) {
      try {
        await this.executeRequest(config)
        
        // 小延迟以避免过载
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (error) {
        // 预热阶段的错误不计入结果
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, config.parameters.warmupTime! * 1000))
    this.emit('warmupCompleted', { configId: config.id })
  }

  // 冷却阶段
  private async cooldownPhase(config: BenchmarkConfig, result: BenchmarkResult) {
    this.emit('cooldownStarted', { configId: config.id })
    await new Promise(resolve => setTimeout(resolve, config.parameters.cooldownTime! * 1000))
    this.emit('cooldownCompleted', { configId: config.id })
  }

  // 执行基准测试
  private async executeBenchmark(config: BenchmarkConfig, result: BenchmarkResult) {
    const startTime = performance.now()
    const endTime = startTime + (config.parameters.duration * 1000)
    
    const latencies: number[] = []
    let totalRequests = 0
    let successfulRequests = 0
    let failedRequests = 0
    let totalDataTransferred = 0

    // 启动资源监控
    const resourceMonitor = this.startResourceMonitoring(result)

    // 根据测试类型执行不同的测试逻辑
    switch (config.type) {
      case 'snmp_performance':
        await this.executeSNMPPerformanceTest(config, result, latencies)
        break
      case 'prometheus_performance':
        await this.executePrometheusPerformanceTest(config, result, latencies)
        break
      case 'network_latency':
        await this.executeNetworkLatencyTest(config, result, latencies)
        break
      case 'throughput':
        await this.executeThroughputTest(config, result, latencies)
        break
      case 'resource_usage':
        await this.executeResourceUsageTest(config, result, latencies)
        break
    }

    // 停止资源监控
    resourceMonitor.stop()

    // 更新指标
    result.metrics.totalRequests = totalRequests
    result.metrics.successfulRequests = successfulRequests
    result.metrics.failedRequests = failedRequests
    result.metrics.dataTransferred = totalDataTransferred
  }

  // 执行SNMP性能测试
  private async executeSNMPPerformanceTest(
    config: BenchmarkConfig, 
    result: BenchmarkResult, 
    latencies: number[]
  ) {
    const oids = [
      '1.3.6.1.2.1.1.1.0', // sysDescr
      '1.3.6.1.2.1.1.3.0', // sysUpTime
      '1.3.6.1.2.1.1.5.0', // sysName
      '1.3.6.1.2.1.2.1.0'  // ifNumber
    ]

    const promises: Promise<void>[] = []
    const startTime = Date.now()
    const endTime = startTime + (config.parameters.duration * 1000)

    for (let i = 0; i < config.parameters.concurrency; i++) {
      promises.push(this.snmpWorker(config, oids, endTime, latencies, result))
    }

    await Promise.all(promises)
  }

  // SNMP工作器
  private async snmpWorker(
    config: BenchmarkConfig, 
    oids: string[], 
    endTime: number, 
    latencies: number[], 
    result: BenchmarkResult
  ) {
    while (Date.now() < endTime) {
      for (const oid of oids) {
        try {
          const startTime = performance.now()
          
          const command = `snmpget -v2c -c public -r1 -t${config.parameters.timeout} ${config.target.host}:${config.target.port} ${oid}`
          await execAsync(command, { timeout: config.parameters.timeout * 1000 })
          
          const latency = performance.now() - startTime
          latencies.push(latency)
          result.metrics.totalRequests++
          result.metrics.successfulRequests++
          
        } catch (error) {
          result.metrics.totalRequests++
          result.metrics.failedRequests++
          
          result.errors.push({
            timestamp: new Date(),
            type: 'snmp_error',
            message: error instanceof Error ? error.message : 'Unknown SNMP error',
            count: 1
          })
        }
      }
      
      // 小延迟以控制请求速率
      if (config.parameters.requestRate) {
        const delay = (1000 / config.parameters.requestRate) * oids.length
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // 执行Prometheus性能测试
  private async executePrometheusPerformanceTest(
    config: BenchmarkConfig, 
    result: BenchmarkResult, 
    latencies: number[]
  ) {
    const queries = [
      'up',
      'prometheus_notifications_total',
      'prometheus_rule_evaluations_total',
      'rate(prometheus_http_requests_total[5m])'
    ]

    const promises: Promise<void>[] = []
    const startTime = Date.now()
    const endTime = startTime + (config.parameters.duration * 1000)

    for (let i = 0; i < config.parameters.concurrency; i++) {
      promises.push(this.prometheusWorker(config, queries, endTime, latencies, result))
    }

    await Promise.all(promises)
  }

  // Prometheus工作器
  private async prometheusWorker(
    config: BenchmarkConfig, 
    queries: string[], 
    endTime: number, 
    latencies: number[], 
    result: BenchmarkResult
  ) {
    while (Date.now() < endTime) {
      for (const query of queries) {
        try {
          const startTime = performance.now()
          
          const url = `${config.target.protocol}://${config.target.host}:${config.target.port}${config.target.path}?query=${encodeURIComponent(query)}`
          const response = await fetch(url, { 
            signal: AbortSignal.timeout(config.parameters.timeout * 1000) 
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const data = await response.json()
          const latency = performance.now() - startTime
          
          latencies.push(latency)
          result.metrics.totalRequests++
          result.metrics.successfulRequests++
          result.metrics.dataTransferred += JSON.stringify(data).length
          
        } catch (error) {
          result.metrics.totalRequests++
          result.metrics.failedRequests++
          
          result.errors.push({
            timestamp: new Date(),
            type: 'prometheus_error',
            message: error instanceof Error ? error.message : 'Unknown Prometheus error',
            count: 1
          })
        }
      }
      
      if (config.parameters.requestRate) {
        const delay = (1000 / config.parameters.requestRate) * queries.length
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // 执行网络延迟测试
  private async executeNetworkLatencyTest(
    config: BenchmarkConfig, 
    result: BenchmarkResult, 
    latencies: number[]
  ) {
    const iterations = config.parameters.iterations || 100
    
    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now()
        
        // 使用ping测试网络延迟
        const { stdout } = await execAsync(`ping -c 1 -W ${config.parameters.timeout} ${config.target.host}`)
        
        const latency = performance.now() - startTime
        latencies.push(latency)
        result.metrics.totalRequests++
        result.metrics.successfulRequests++
        
        // 解析ping结果获取更精确的延迟
        const match = stdout.match(/time=(\d+(?:\.\d+)?)\s*ms/)
        if (match) {
          const pingLatency = parseFloat(match[1])
          latencies[latencies.length - 1] = pingLatency
        }
        
      } catch (error) {
        result.metrics.totalRequests++
        result.metrics.failedRequests++
        
        result.errors.push({
          timestamp: new Date(),
          type: 'ping_error',
          message: error instanceof Error ? error.message : 'Ping failed',
          count: 1
        })
      }
      
      // 控制ping频率
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // 执行吞吐量测试
  private async executeThroughputTest(
    config: BenchmarkConfig, 
    result: BenchmarkResult, 
    latencies: number[]
  ) {
    const promises: Promise<void>[] = []
    const startTime = Date.now()
    const endTime = startTime + (config.parameters.duration * 1000)

    for (let i = 0; i < config.parameters.concurrency; i++) {
      promises.push(this.throughputWorker(config, endTime, latencies, result))
    }

    await Promise.all(promises)
  }

  // 吞吐量工作器
  private async throughputWorker(
    config: BenchmarkConfig, 
    endTime: number, 
    latencies: number[], 
    result: BenchmarkResult
  ) {
    while (Date.now() < endTime) {
      try {
        const startTime = performance.now()
        
        const url = `${config.target.protocol}://${config.target.host}:${config.target.port}${config.target.path || ''}`
        const response = await fetch(url, { 
          signal: AbortSignal.timeout(config.parameters.timeout * 1000) 
        })
        
        const content = await response.text()
        const latency = performance.now() - startTime
        
        latencies.push(latency)
        result.metrics.totalRequests++
        result.metrics.successfulRequests++
        result.metrics.dataTransferred += content.length
        
      } catch (error) {
        result.metrics.totalRequests++
        result.metrics.failedRequests++
        
        result.errors.push({
          timestamp: new Date(),
          type: 'http_error',
          message: error instanceof Error ? error.message : 'HTTP request failed',
          count: 1
        })
      }
      
      if (config.parameters.requestRate) {
        const delay = 1000 / config.parameters.requestRate
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // 执行资源使用测试
  private async executeResourceUsageTest(
    config: BenchmarkConfig, 
    result: BenchmarkResult, 
    latencies: number[]
  ) {
    // 资源使用测试主要通过资源监控来实现
    // 这里执行一些基本的操作来产生负载
    const endTime = Date.now() + (config.parameters.duration * 1000)
    
    while (Date.now() < endTime) {
      // 模拟CPU和内存使用
      const data = new Array(10000).fill(0).map((_, i) => Math.random() * i)
      data.sort()
      
      result.metrics.totalRequests++
      result.metrics.successfulRequests++
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // 启动资源监控
  private startResourceMonitoring(result: BenchmarkResult): { stop: () => void } {
    const interval = setInterval(async () => {
      try {
        // 获取CPU使用率
        const { stdout: cpuData } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//'")
        const cpuUsage = parseFloat(cpuData.trim()) || 0
        
        // 获取内存使用率
        const { stdout: memData } = await execAsync("free | grep Mem | awk '{print ($3/$2) * 100.0}'")
        const memUsage = parseFloat(memData.trim()) || 0
        
        const timestamp = new Date()
        
        // 记录CPU样本
        result.resourceUsage.cpu.samples.push({ timestamp, value: cpuUsage })
        if (cpuUsage > result.resourceUsage.cpu.peak) {
          result.resourceUsage.cpu.peak = cpuUsage
        }
        
        // 记录内存样本
        result.resourceUsage.memory.samples.push({ timestamp, value: memUsage })
        if (memUsage > result.resourceUsage.memory.peak) {
          result.resourceUsage.memory.peak = memUsage
        }
        
      } catch (error) {
        console.error('Resource monitoring error:', error)
      }
    }, 1000)

    return {
      stop: () => {
        clearInterval(interval)
        
        // 计算平均值
        if (result.resourceUsage.cpu.samples.length > 0) {
          result.resourceUsage.cpu.average = result.resourceUsage.cpu.samples
            .reduce((sum, sample) => sum + sample.value, 0) / result.resourceUsage.cpu.samples.length
        }
        
        if (result.resourceUsage.memory.samples.length > 0) {
          result.resourceUsage.memory.average = result.resourceUsage.memory.samples
            .reduce((sum, sample) => sum + sample.value, 0) / result.resourceUsage.memory.samples.length
        }
      }
    }
  }

  // 执行单个请求
  private async executeRequest(config: BenchmarkConfig): Promise<void> {
    switch (config.type) {
      case 'snmp_performance':
        await execAsync(`snmpget -v2c -c public -r1 -t${config.parameters.timeout} ${config.target.host}:${config.target.port} 1.3.6.1.2.1.1.1.0`)
        break
      case 'prometheus_performance':
        const url = `${config.target.protocol}://${config.target.host}:${config.target.port}${config.target.path}?query=up`
        await fetch(url, { signal: AbortSignal.timeout(config.parameters.timeout * 1000) })
        break
      default:
        await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // 计算最终指标
  private calculateFinalMetrics(result: BenchmarkResult) {
    const latencies = [] // 这里应该从实际执行中收集延迟数据
    
    if (latencies.length > 0) {
      latencies.sort((a, b) => a - b)
      
      result.metrics.averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      result.metrics.medianLatency = latencies[Math.floor(latencies.length / 2)]
      result.metrics.p95Latency = latencies[Math.floor(latencies.length * 0.95)]
      result.metrics.p99Latency = latencies[Math.floor(latencies.length * 0.99)]
      result.metrics.minLatency = latencies[0]
      result.metrics.maxLatency = latencies[latencies.length - 1]
    }
    
    // 计算错误率
    if (result.metrics.totalRequests > 0) {
      result.metrics.errorRate = (result.metrics.failedRequests / result.metrics.totalRequests) * 100
    }
    
    // 计算吞吐量
    if (result.duration > 0) {
      result.metrics.throughput = (result.metrics.successfulRequests / result.duration) * 1000 // per second
      result.metrics.bandwidth = (result.metrics.dataTransferred / result.duration) * 1000 // bytes per second
    }
  }

  // 评估阈值
  private evaluateThresholds(config: BenchmarkConfig, result: BenchmarkResult) {
    result.thresholdResults.latency.value = result.metrics.averageLatency
    result.thresholdResults.latency.passed = result.metrics.averageLatency <= config.thresholds.maxLatency
    
    result.thresholdResults.errorRate.value = result.metrics.errorRate
    result.thresholdResults.errorRate.passed = result.metrics.errorRate <= config.thresholds.maxErrorRate
    
    result.thresholdResults.throughput.value = result.metrics.throughput
    result.thresholdResults.throughput.passed = result.metrics.throughput >= config.thresholds.minThroughput
    
    result.thresholdResults.cpuUsage.value = result.resourceUsage.cpu.peak
    result.thresholdResults.cpuUsage.passed = result.resourceUsage.cpu.peak <= config.thresholds.maxCpuUsage
    
    result.thresholdResults.memoryUsage.value = result.resourceUsage.memory.peak
    result.thresholdResults.memoryUsage.passed = result.resourceUsage.memory.peak <= config.thresholds.maxMemoryUsage
  }

  // 计算分数
  private calculateScore(result: BenchmarkResult) {
    const thresholds = Object.values(result.thresholdResults)
    const passedCount = thresholds.filter(t => t.passed).length
    const totalCount = thresholds.length
    
    result.score = Math.round((passedCount / totalCount) * 100)
    
    // 计算等级
    if (result.score >= 90) result.grade = 'A'
    else if (result.score >= 80) result.grade = 'B'
    else if (result.score >= 70) result.grade = 'C'
    else if (result.score >= 60) result.grade = 'D'
    else result.grade = 'F'
  }

  // 保存基准测试结果
  private async saveBenchmarkResult(result: BenchmarkResult) {
    const resultFile = path.join(this.resultsPath, `${result.id}.json`)
    await fs.writeFile(resultFile, JSON.stringify(result, null, 2))
  }

  // 生成性能报告
  async generatePerformanceReport(
    timeRange: { start: Date, end: Date },
    configIds?: string[]
  ): Promise<PerformanceReport> {
    const reportId = `report_${Date.now()}`
    
    // 获取指定时间范围内的结果
    const allResults = Array.from(this.results.values())
    const filteredResults = allResults.filter(result => {
      const inTimeRange = result.startTime >= timeRange.start && result.startTime <= timeRange.end
      const inConfigFilter = !configIds || configIds.includes(result.configId)
      return inTimeRange && inConfigFilter
    })

    // 计算摘要统计
    const totalBenchmarks = filteredResults.length
    const passedBenchmarks = filteredResults.filter(r => r.score >= 70).length
    const failedBenchmarks = totalBenchmarks - passedBenchmarks
    const averageScore = totalBenchmarks > 0 ? 
      filteredResults.reduce((sum, r) => sum + r.score, 0) / totalBenchmarks : 0

    // 分析优化建议
    const applicableOptimizations = this.analyzeOptimizationOpportunities(filteredResults)

    const report: PerformanceReport = {
      id: reportId,
      name: `Performance Report ${new Date().toISOString()}`,
      generatedAt: new Date(),
      timeRange,
      summary: {
        totalBenchmarks,
        passedBenchmarks,
        failedBenchmarks,
        averageScore: Math.round(averageScore),
        overallGrade: this.calculateOverallGrade(averageScore),
        keyFindings: this.generateKeyFindings(filteredResults)
      },
      results: filteredResults,
      optimizations: applicableOptimizations,
      trends: this.analyzeTrends(filteredResults),
      recommendations: this.categorizeOptimizations(applicableOptimizations)
    }

    // 保存报告
    await this.savePerformanceReport(report)

    return report
  }

  // 分析优化机会
  private analyzeOptimizationOpportunities(results: BenchmarkResult[]): PerformanceOptimization[] {
    const applicableOptimizations: PerformanceOptimization[] = []
    const allOptimizations = Array.from(this.optimizations.values())

    for (const optimization of allOptimizations) {
      let applicable = false

      for (const result of results) {
        // 根据结果分析是否适用该优化
        if (this.isOptimizationApplicable(optimization, result)) {
          applicable = true
          break
        }
      }

      if (applicable) {
        applicableOptimizations.push(optimization)
      }
    }

    return applicableOptimizations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // 判断优化是否适用
  private isOptimizationApplicable(optimization: PerformanceOptimization, result: BenchmarkResult): boolean {
    switch (optimization.id) {
      case 'snmp_bulk_requests':
        return !result.thresholdResults.latency.passed && 
               result.metrics.averageLatency > 500
      
      case 'prometheus_query_optimization':
        return !result.thresholdResults.latency.passed && 
               result.resourceUsage.cpu.peak > 70
      
      case 'monitoring_interval_tuning':
        return !result.thresholdResults.cpuUsage.passed || 
               !result.thresholdResults.memoryUsage.passed
      
      case 'connection_pooling':
        return !result.thresholdResults.throughput.passed && 
               result.metrics.throughput < result.thresholdResults.throughput.threshold * 0.8
      
      case 'cache_optimization':
        return !result.thresholdResults.latency.passed && 
               result.metrics.errorRate < 5
      
      case 'parallel_processing':
        return !result.thresholdResults.throughput.passed && 
               result.resourceUsage.cpu.average < 60
      
      default:
        return false
    }
  }

  // 计算总体等级
  private calculateOverallGrade(averageScore: number): string {
    if (averageScore >= 90) return 'A'
    if (averageScore >= 80) return 'B'
    if (averageScore >= 70) return 'C'
    if (averageScore >= 60) return 'D'
    return 'F'
  }

  // 生成关键发现
  private generateKeyFindings(results: BenchmarkResult[]): string[] {
    const findings: string[] = []
    
    if (results.length === 0) {
      findings.push('没有可用的测试结果')
      return findings
    }

    const avgLatency = results.reduce((sum, r) => sum + r.metrics.averageLatency, 0) / results.length
    const avgErrorRate = results.reduce((sum, r) => sum + r.metrics.errorRate, 0) / results.length
    const avgThroughput = results.reduce((sum, r) => sum + r.metrics.throughput, 0) / results.length

    if (avgLatency > 1000) {
      findings.push('平均响应延迟较高，需要优化')
    }

    if (avgErrorRate > 5) {
      findings.push('错误率超过可接受范围')
    }

    if (avgThroughput < 10) {
      findings.push('系统吞吐量偏低')
    }

    const highResourceUsage = results.filter(r => 
      r.resourceUsage.cpu.peak > 80 || r.resourceUsage.memory.peak > 80
    )
    
    if (highResourceUsage.length > results.length * 0.5) {
      findings.push('资源使用率普遍偏高')
    }

    if (findings.length === 0) {
      findings.push('整体性能表现良好')
    }

    return findings
  }

  // 分析趋势
  private analyzeTrends(results: BenchmarkResult[]): PerformanceReport['trends'] {
    // 简化的趋势分析
    const sortedResults = results.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    
    if (sortedResults.length < 2) {
      return {
        latencyTrend: 'stable',
        throughputTrend: 'stable',
        errorRateTrend: 'stable',
        resourceUsageTrend: 'stable'
      }
    }

    const firstHalf = sortedResults.slice(0, Math.floor(sortedResults.length / 2))
    const secondHalf = sortedResults.slice(Math.floor(sortedResults.length / 2))

    const firstAvgLatency = firstHalf.reduce((sum, r) => sum + r.metrics.averageLatency, 0) / firstHalf.length
    const secondAvgLatency = secondHalf.reduce((sum, r) => sum + r.metrics.averageLatency, 0) / secondHalf.length

    const firstAvgThroughput = firstHalf.reduce((sum, r) => sum + r.metrics.throughput, 0) / firstHalf.length
    const secondAvgThroughput = secondHalf.reduce((sum, r) => sum + r.metrics.throughput, 0) / secondHalf.length

    return {
      latencyTrend: secondAvgLatency < firstAvgLatency * 0.9 ? 'improving' : 
                   secondAvgLatency > firstAvgLatency * 1.1 ? 'degrading' : 'stable',
      throughputTrend: secondAvgThroughput > firstAvgThroughput * 1.1 ? 'improving' : 
                      secondAvgThroughput < firstAvgThroughput * 0.9 ? 'degrading' : 'stable',
      errorRateTrend: 'stable', // 简化处理
      resourceUsageTrend: 'stable' // 简化处理
    }
  }

  // 分类优化建议
  private categorizeOptimizations(optimizations: PerformanceOptimization[]): PerformanceReport['recommendations'] {
    return {
      immediate: optimizations.filter(opt => opt.priority === 'critical'),
      shortTerm: optimizations.filter(opt => opt.priority === 'high'),
      longTerm: optimizations.filter(opt => opt.priority === 'medium' || opt.priority === 'low')
    }
  }

  // 保存性能报告
  private async savePerformanceReport(report: PerformanceReport) {
    const reportFile = path.join(this.reportsPath, `${report.id}.json`)
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2))
  }

  // 应用自动优化
  async applyOptimization(optimizationId: string, targetConfig?: any): Promise<void> {
    const optimization = this.optimizations.get(optimizationId)
    if (!optimization) {
      throw new Error(`Optimization ${optimizationId} not found`)
    }

    if (!optimization.automated || !optimization.automationScript) {
      throw new Error(`Optimization ${optimizationId} does not support automation`)
    }

    // 执行自动化脚本
    await this.executeOptimizationScript(optimization.automationScript, targetConfig)
  }

  // 执行优化脚本
  private async executeOptimizationScript(scriptName: string, config?: any): Promise<void> {
    switch (scriptName) {
      case 'optimizeSNMPBulkRequests':
        // 实现SNMP批量请求优化
        console.log('Applying SNMP bulk request optimization...')
        break
      
      case 'optimizeMonitoringIntervals':
        // 实现监控间隔优化
        console.log('Optimizing monitoring intervals...')
        break
      
      case 'enableParallelProcessing':
        // 实现并行处理优化
        console.log('Enabling parallel processing...')
        break
      
      default:
        throw new Error(`Unknown optimization script: ${scriptName}`)
    }
  }

  // 获取基准测试配置
  getBenchmarkConfigs(filter?: { type?: string; enabled?: boolean }): BenchmarkConfig[] {
    let configs = Array.from(this.configs.values())
    
    if (filter) {
      if (filter.type) {
        configs = configs.filter(c => c.type === filter.type)
      }
      
      if (filter.enabled !== undefined) {
        configs = configs.filter(c => c.enabled === filter.enabled)
      }
    }
    
    return configs
  }

  // 获取基准测试结果
  getBenchmarkResults(configId?: string, limit: number = 10): BenchmarkResult[] {
    let results = Array.from(this.results.values())
    
    if (configId) {
      results = results.filter(r => r.configId === configId)
    }
    
    return results
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit)
  }

  // 获取优化建议
  getOptimizations(category?: string): PerformanceOptimization[] {
    let optimizations = Array.from(this.optimizations.values())
    
    if (category) {
      optimizations = optimizations.filter(opt => opt.category === category)
    }
    
    return optimizations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // 取消正在运行的基准测试
  async cancelBenchmark(resultId: string): Promise<void> {
    const result = this.results.get(resultId)
    if (result && result.status === 'running') {
      result.status = 'cancelled'
      result.endTime = new Date()
      
      this.emit('benchmarkCancelled', { resultId })
    }
  }
}

// 导出性能基准测试优化器实例
export const performanceBenchmarkOptimizer = new PerformanceBenchmarkOptimizer()