// 系统集成管理器 - 整合所有功能模块
import { EventEmitter } from 'events'
import { configVersionManager } from './config-version-manager'
import { batchDeviceManager } from './batch-device-manager'
import { realTimeMonitoringPreview } from './real-time-monitoring-preview'
import { advancedAlertRulesManager } from './advanced-alert-rules-manager'
import { configComplianceScanner } from './config-compliance-scanner'
import { performanceBenchmarkOptimizer } from './performance-benchmark-optimizer'
import { enhancedOIDManager } from './enhanced-oid-manager'

export interface SystemHealth {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  components: {
    deviceManager: ComponentHealth
    configManager: ComponentHealth
    monitoring: ComponentHealth
    alerting: ComponentHealth
    compliance: ComponentHealth
    performance: ComponentHealth
  }
  metrics: {
    totalDevices: number
    onlineDevices: number
    activeAlerts: number
    complianceScore: number
    performanceScore: number
    lastUpdate: Date
  }
  recommendations: SystemRecommendation[]
}

export interface ComponentHealth {
  status: 'healthy' | 'warning' | 'error'
  uptime: number
  lastError?: string
  metrics: Record<string, number>
}

export interface SystemRecommendation {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'performance' | 'security' | 'reliability' | 'maintenance'
  action: string
  estimatedImpact: string
  automated: boolean
}

export interface SystemConfiguration {
  environment: 'development' | 'staging' | 'production'
  features: {
    autoDiscovery: boolean
    realTimeMonitoring: boolean
    autoAlerts: boolean
    complianceScanning: boolean
    performanceTesting: boolean
    autoOptimization: boolean
  }
  thresholds: {
    deviceTimeout: number
    alertLatency: number
    complianceScore: number
    performanceScore: number
  }
  integration: {
    prometheus: { enabled: boolean, endpoint: string }
    grafana: { enabled: boolean, endpoint: string }
    slack: { enabled: boolean, webhook: string }
    email: { enabled: boolean, smtp: any }
  }
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  trigger: 'manual' | 'scheduled' | 'event'
  triggerConfig: any
  steps: WorkflowStep[]
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  status: 'idle' | 'running' | 'completed' | 'failed'
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'device_discovery' | 'config_deployment' | 'compliance_scan' | 
        'performance_test' | 'alert_rule_update' | 'custom_script'
  config: any
  dependencies?: string[]
  timeout: number
  retries: number
  onFailure: 'stop' | 'continue' | 'retry'
}

export class SystemIntegrationManager extends EventEmitter {
  private systemHealth: SystemHealth
  private systemConfig: SystemConfiguration
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private activeJobs: Map<string, any> = new Map()
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.initializeSystem()
    this.startHealthMonitoring()
  }

  // 初始化系统
  private initializeSystem() {
    this.systemConfig = {
      environment: 'production',
      features: {
        autoDiscovery: true,
        realTimeMonitoring: true,
        autoAlerts: true,
        complianceScanning: true,
        performanceTesting: true,
        autoOptimization: false
      },
      thresholds: {
        deviceTimeout: 300,
        alertLatency: 1000,
        complianceScore: 80,
        performanceScore: 70
      },
      integration: {
        prometheus: { enabled: true, endpoint: 'http://localhost:9090' },
        grafana: { enabled: true, endpoint: 'http://localhost:3000' },
        slack: { enabled: false, webhook: '' },
        email: { enabled: false, smtp: {} }
      }
    }

    this.systemHealth = {
      overall: 'good',
      components: {
        deviceManager: { status: 'healthy', uptime: 0, metrics: {} },
        configManager: { status: 'healthy', uptime: 0, metrics: {} },
        monitoring: { status: 'healthy', uptime: 0, metrics: {} },
        alerting: { status: 'healthy', uptime: 0, metrics: {} },
        compliance: { status: 'healthy', uptime: 0, metrics: {} },
        performance: { status: 'healthy', uptime: 0, metrics: {} }
      },
      metrics: {
        totalDevices: 0,
        onlineDevices: 0,
        activeAlerts: 0,
        complianceScore: 0,
        performanceScore: 0,
        lastUpdate: new Date()
      },
      recommendations: []
    }

    this.initializeDefaultWorkflows()
  }

  // 初始化默认工作流
  private initializeDefaultWorkflows() {
    const defaultWorkflows: WorkflowDefinition[] = [
      {
        id: 'daily_device_discovery',
        name: '每日设备发现',
        description: '自动发现网络中的新SNMP设备',
        trigger: 'scheduled',
        triggerConfig: { cron: '0 2 * * *' }, // 每天凌晨2点
        steps: [
          {
            id: 'discover_devices',
            name: '发现设备',
            type: 'device_discovery',
            config: {
              ipRanges: ['192.168.1.0/24', '10.0.0.0/24'],
              snmpCommunity: 'public',
              snmpVersion: '2c'
            },
            timeout: 1800,
            retries: 2,
            onFailure: 'continue'
          },
          {
            id: 'deploy_basic_config',
            name: '部署基础配置',
            type: 'config_deployment',
            config: {
              configType: 'snmp_exporter',
              template: 'basic_monitoring'
            },
            dependencies: ['discover_devices'],
            timeout: 900,
            retries: 1,
            onFailure: 'continue'
          }
        ],
        enabled: true,
        status: 'idle'
      },
      {
        id: 'weekly_compliance_scan',
        name: '每周合规扫描',
        description: '对所有配置进行安全合规扫描',
        trigger: 'scheduled',
        triggerConfig: { cron: '0 1 * * 0' }, // 每周日凌晨1点
        steps: [
          {
            id: 'scan_configurations',
            name: '扫描配置',
            type: 'compliance_scan',
            config: {
              profile: 'production_security',
              autoFix: false
            },
            timeout: 3600,
            retries: 1,
            onFailure: 'stop'
          }
        ],
        enabled: true,
        status: 'idle'
      },
      {
        id: 'monthly_performance_test',
        name: '每月性能测试',
        description: '运行全面的性能基准测试',
        trigger: 'scheduled',
        triggerConfig: { cron: '0 3 1 * *' }, // 每月1号凌晨3点
        steps: [
          {
            id: 'run_benchmarks',
            name: '运行基准测试',
            type: 'performance_test',
            config: {
              testSuites: ['snmp_performance', 'network_latency', 'prometheus_performance']
            },
            timeout: 7200,
            retries: 1,
            onFailure: 'continue'
          }
        ],
        enabled: true,
        status: 'idle'
      }
    ]

    defaultWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow)
    })
  }

  // 开始健康监控
  private startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      await this.updateSystemHealth()
      this.generateRecommendations()
    }, 30000) // 每30秒检查一次
  }

  // 更新系统健康状态
  private async updateSystemHealth() {
    try {
      // 更新设备管理器健康状态
      const deviceStats = batchDeviceManager.getDeploymentStats()
      this.systemHealth.components.deviceManager = {
        status: deviceStats.onlineDevices / deviceStats.totalDevices > 0.9 ? 'healthy' : 'warning',
        uptime: Date.now(),
        metrics: {
          totalDevices: deviceStats.totalDevices,
          onlineDevices: deviceStats.onlineDevices,
          monitoredDevices: deviceStats.monitoredDevices
        }
      }

      // 更新配置管理器健康状态
      this.systemHealth.components.configManager = {
        status: 'healthy',
        uptime: Date.now(),
        metrics: {}
      }

      // 更新监控组件健康状态
      const activeSessions = realTimeMonitoringPreview.getActiveSessions()
      this.systemHealth.components.monitoring = {
        status: activeSessions.length > 0 ? 'healthy' : 'warning',
        uptime: Date.now(),
        metrics: {
          activeSessions: activeSessions.length
        }
      }

      // 更新告警组件健康状态
      const alertRules = advancedAlertRulesManager.getRules({ enabled: true })
      this.systemHealth.components.alerting = {
        status: alertRules.length > 0 ? 'healthy' : 'warning',
        uptime: Date.now(),
        metrics: {
          activeRules: alertRules.length
        }
      }

      // 更新合规组件健康状态
      this.systemHealth.components.compliance = {
        status: 'healthy',
        uptime: Date.now(),
        metrics: {}
      }

      // 更新性能组件健康状态
      const benchmarkConfigs = performanceBenchmarkOptimizer.getBenchmarkConfigs({ enabled: true })
      this.systemHealth.components.performance = {
        status: benchmarkConfigs.length > 0 ? 'healthy' : 'warning',
        uptime: Date.now(),
        metrics: {
          activeBenchmarks: benchmarkConfigs.length
        }
      }

      // 更新系统指标
      this.systemHealth.metrics = {
        totalDevices: deviceStats.totalDevices,
        onlineDevices: deviceStats.onlineDevices,
        activeAlerts: 0, // TODO: 实际获取告警数量
        complianceScore: 85, // TODO: 实际获取合规分数
        performanceScore: 78, // TODO: 实际获取性能分数
        lastUpdate: new Date()
      }

      // 计算整体健康状态
      this.calculateOverallHealth()

    } catch (error) {
      console.error('Health check failed:', error)
    }
  }

  // 计算整体健康状态
  private calculateOverallHealth() {
    const componentStatuses = Object.values(this.systemHealth.components).map(c => c.status)
    const healthyCount = componentStatuses.filter(s => s === 'healthy').length
    const warningCount = componentStatuses.filter(s => s === 'warning').length
    const errorCount = componentStatuses.filter(s => s === 'error').length

    if (errorCount > 0) {
      this.systemHealth.overall = 'poor'
    } else if (warningCount > componentStatuses.length / 2) {
      this.systemHealth.overall = 'fair'
    } else if (warningCount > 0) {
      this.systemHealth.overall = 'good'
    } else {
      this.systemHealth.overall = 'excellent'
    }
  }

  // 生成系统建议
  private generateRecommendations() {
    const recommendations: SystemRecommendation[] = []

    // 设备相关建议
    if (this.systemHealth.metrics.onlineDevices / this.systemHealth.metrics.totalDevices < 0.9) {
      recommendations.push({
        id: 'device_connectivity',
        title: '设备连通性问题',
        description: '部分设备离线，建议检查网络连接和设备状态',
        priority: 'high',
        category: 'reliability',
        action: '运行设备连通性检查',
        estimatedImpact: '提高监控覆盖率',
        automated: true
      })
    }

    // 性能相关建议
    if (this.systemHealth.metrics.performanceScore < this.systemConfig.thresholds.performanceScore) {
      recommendations.push({
        id: 'performance_optimization',
        title: '性能优化',
        description: '系统性能低于阈值，建议运行性能优化',
        priority: 'medium',
        category: 'performance',
        action: '应用性能优化建议',
        estimatedImpact: '提高系统响应速度',
        automated: true
      })
    }

    // 合规相关建议
    if (this.systemHealth.metrics.complianceScore < this.systemConfig.thresholds.complianceScore) {
      recommendations.push({
        id: 'compliance_improvement',
        title: '合规性改进',
        description: '合规分数低于标准，建议修复安全问题',
        priority: 'high',
        category: 'security',
        action: '运行合规扫描并修复问题',
        estimatedImpact: '提高系统安全性',
        automated: false
      })
    }

    // 告警相关建议
    if (this.systemHealth.metrics.activeAlerts > 10) {
      recommendations.push({
        id: 'alert_optimization',
        title: '告警优化',
        description: '活跃告警过多，建议优化告警规则',
        priority: 'medium',
        category: 'maintenance',
        action: '优化告警规则和阈值',
        estimatedImpact: '减少误报，提高告警质量',
        automated: true
      })
    }

    this.systemHealth.recommendations = recommendations
  }

  // 执行工作流
  async executeWorkflow(workflowId: string, parameters: any = {}): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    if (this.activeJobs.has(workflowId)) {
      throw new Error(`Workflow ${workflowId} is already running`)
    }

    const jobId = `job_${workflowId}_${Date.now()}`
    
    this.activeJobs.set(workflowId, {
      id: jobId,
      workflowId,
      startTime: new Date(),
      status: 'running',
      currentStep: 0,
      results: []
    })

    this.emit('workflowStarted', { workflowId, jobId })

    try {
      workflow.status = 'running'
      
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i]
        
        // 检查依赖
        if (step.dependencies) {
          for (const depId of step.dependencies) {
            const depStep = workflow.steps.find(s => s.id === depId)
            if (!depStep) {
              throw new Error(`Dependency step ${depId} not found`)
            }
          }
        }

        try {
          this.emit('stepStarted', { workflowId, stepId: step.id })
          
          const result = await this.executeWorkflowStep(step, parameters)
          
          this.activeJobs.get(workflowId)!.results.push({
            stepId: step.id,
            status: 'completed',
            result
          })
          
          this.emit('stepCompleted', { workflowId, stepId: step.id, result })
          
        } catch (error) {
          const errorResult = {
            stepId: step.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
          
          this.activeJobs.get(workflowId)!.results.push(errorResult)
          
          this.emit('stepFailed', { workflowId, stepId: step.id, error })
          
          if (step.onFailure === 'stop') {
            throw error
          } else if (step.onFailure === 'retry' && step.retries > 0) {
            // 实现重试逻辑
            i-- // 重试当前步骤
            step.retries--
          }
        }
      }

      workflow.status = 'completed'
      workflow.lastRun = new Date()
      
      this.emit('workflowCompleted', { workflowId, jobId })

    } catch (error) {
      workflow.status = 'failed'
      
      this.emit('workflowFailed', { workflowId, jobId, error })
      
    } finally {
      this.activeJobs.delete(workflowId)
    }
  }

  // 执行工作流步骤
  private async executeWorkflowStep(step: WorkflowStep, parameters: any): Promise<any> {
    switch (step.type) {
      case 'device_discovery':
        return await this.executeDeviceDiscovery(step.config)
      
      case 'config_deployment':
        return await this.executeConfigDeployment(step.config, parameters)
      
      case 'compliance_scan':
        return await this.executeComplianceScan(step.config)
      
      case 'performance_test':
        return await this.executePerformanceTest(step.config)
      
      case 'alert_rule_update':
        return await this.executeAlertRuleUpdate(step.config)
      
      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  }

  // 执行设备发现
  private async executeDeviceDiscovery(config: any): Promise<any> {
    const devices = []
    
    for (const ipRange of config.ipRanges) {
      const discoveredDevices = await batchDeviceManager.discoverDevices(
        ipRange,
        config.snmpCommunity,
        config.snmpVersion
      )
      devices.push(...discoveredDevices)
    }
    
    return { discoveredDevices: devices.length, devices }
  }

  // 执行配置部署
  private async executeConfigDeployment(config: any, parameters: any): Promise<any> {
    // 获取目标设备
    const targetDevices = parameters.targetDevices || 
      batchDeviceManager.getDevices({ status: ['online'] }).map(d => d.id)
    
    if (targetDevices.length === 0) {
      return { message: 'No target devices found' }
    }

    // 创建配置版本
    const configContent = this.getConfigTemplate(config.template, config.configType)
    const configVersion = await configVersionManager.createVersion(
      `auto_deploy_${Date.now()}`,
      config.configType,
      configContent,
      'system',
      'Automated deployment'
    )

    // 执行批量部署
    const deploymentJob = await batchDeviceManager.deployConfigBatch(
      { deviceIds: targetDevices },
      config.configType,
      configVersion.id,
      {
        mode: 'parallel',
        batchSize: 10,
        rollbackOnFailure: true,
        maxFailureRate: 0.1
      },
      'system'
    )

    return { deploymentJobId: deploymentJob.id, targetDevices: targetDevices.length }
  }

  // 执行合规扫描
  private async executeComplianceScan(config: any): Promise<any> {
    // 获取所有配置文件进行扫描
    const configFiles = [
      '/etc/snmp_exporter/snmp.yml',
      '/etc/categraf/conf/input.snmp',
      '/etc/prometheus/prometheus.yml'
    ]

    const scanResults = []
    
    for (const configFile of configFiles) {
      try {
        const result = await configComplianceScanner.scanConfiguration(
          configFile,
          config.profile,
          { autoFix: config.autoFix }
        )
        scanResults.push(result)
      } catch (error) {
        console.error(`Failed to scan ${configFile}:`, error)
      }
    }

    return { scannedFiles: scanResults.length, results: scanResults }
  }

  // 执行性能测试
  private async executePerformanceTest(config: any): Promise<any> {
    const testResults = []
    
    for (const testSuite of config.testSuites) {
      try {
        const result = await performanceBenchmarkOptimizer.runBenchmark(testSuite)
        testResults.push(result)
      } catch (error) {
        console.error(`Failed to run benchmark ${testSuite}:`, error)
      }
    }

    return { completedTests: testResults.length, results: testResults }
  }

  // 执行告警规则更新
  private async executeAlertRuleUpdate(config: any): Promise<any> {
    // 根据配置创建或更新告警规则
    const rules = await advancedAlertRulesManager.createRulesFromTemplate(
      config.templateId,
      config.variables || {},
      config.options || {}
    )

    return { createdRules: rules.length, rules }
  }

  // 获取配置模板
  private getConfigTemplate(templateName: string, configType: string): string {
    // 这里应该从模板库获取配置模板
    // 简化实现
    switch (templateName) {
      case 'basic_monitoring':
        if (configType === 'snmp_exporter') {
          return `
modules:
  default:
    walk:
      - 1.3.6.1.2.1.1.1.0
      - 1.3.6.1.2.1.1.3.0
      - 1.3.6.1.2.1.2.2.1.2
    auth:
      community: public
      version: 2
`
        }
        break
      
      default:
        return '# Default configuration'
    }
    
    return '# Template not found'
  }

  // 应用系统建议
  async applyRecommendation(recommendationId: string): Promise<void> {
    const recommendation = this.systemHealth.recommendations.find(r => r.id === recommendationId)
    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`)
    }

    if (!recommendation.automated) {
      throw new Error(`Recommendation ${recommendationId} requires manual action`)
    }

    switch (recommendationId) {
      case 'device_connectivity':
        await this.executeDeviceConnectivityCheck()
        break
      
      case 'performance_optimization':
        await this.applyPerformanceOptimizations()
        break
      
      case 'alert_optimization':
        await this.optimizeAlertRules()
        break
      
      default:
        throw new Error(`Unknown recommendation: ${recommendationId}`)
    }
  }

  // 执行设备连通性检查
  private async executeDeviceConnectivityCheck() {
    const devices = batchDeviceManager.getDevices({ status: ['offline', 'error'] })
    
    for (const device of devices) {
      try {
        // 测试设备连通性
        const response = await fetch('/api/snmp/real-test/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip: device.ip,
            community: device.snmpConfig.community,
            version: device.snmpConfig.version
          })
        })
        
        const result = await response.json()
        if (result.success) {
          device.status = 'online'
          device.lastSeen = new Date()
        }
      } catch (error) {
        console.error(`Connectivity check failed for device ${device.id}:`, error)
      }
    }
  }

  // 应用性能优化
  private async applyPerformanceOptimizations() {
    const optimizations = performanceBenchmarkOptimizer.getOptimizations()
    
    for (const optimization of optimizations) {
      if (optimization.automated && optimization.priority === 'high') {
        try {
          await performanceBenchmarkOptimizer.applyOptimization(optimization.id)
        } catch (error) {
          console.error(`Failed to apply optimization ${optimization.id}:`, error)
        }
      }
    }
  }

  // 优化告警规则
  private async optimizeAlertRules() {
    const suggestions = await advancedAlertRulesManager.getOptimizationSuggestions()
    
    for (const suggestion of suggestions) {
      if (suggestion.confidence > 0.7) {
        try {
          await advancedAlertRulesManager.applyOptimizationSuggestion(suggestion)
        } catch (error) {
          console.error(`Failed to apply alert optimization:`, error)
        }
      }
    }
  }

  // 获取系统健康状态
  getSystemHealth(): SystemHealth {
    return { ...this.systemHealth }
  }

  // 获取系统配置
  getSystemConfig(): SystemConfiguration {
    return { ...this.systemConfig }
  }

  // 更新系统配置
  async updateSystemConfig(config: Partial<SystemConfiguration>): Promise<void> {
    this.systemConfig = { ...this.systemConfig, ...config }
    this.emit('configUpdated', this.systemConfig)
  }

  // 获取工作流
  getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
  }

  // 创建工作流
  async createWorkflow(workflow: Omit<WorkflowDefinition, 'id' | 'status'>): Promise<WorkflowDefinition> {
    const newWorkflow: WorkflowDefinition = {
      ...workflow,
      id: `workflow_${Date.now()}`,
      status: 'idle'
    }
    
    this.workflows.set(newWorkflow.id, newWorkflow)
    this.emit('workflowCreated', newWorkflow)
    
    return newWorkflow
  }

  // 获取活跃任务
  getActiveJobs(): any[] {
    return Array.from(this.activeJobs.values())
  }

  // 停止工作流
  async stopWorkflow(workflowId: string): Promise<void> {
    const job = this.activeJobs.get(workflowId)
    if (job) {
      job.status = 'cancelled'
      this.activeJobs.delete(workflowId)
      this.emit('workflowCancelled', { workflowId })
    }
  }

  // 生成系统报告
  async generateSystemReport(): Promise<any> {
    const health = this.getSystemHealth()
    const config = this.getSystemConfig()
    const workflows = this.getWorkflows()
    const activeJobs = this.getActiveJobs()

    return {
      timestamp: new Date(),
      health,
      config,
      workflows: {
        total: workflows.length,
        enabled: workflows.filter(w => w.enabled).length,
        active: activeJobs.length
      },
      statistics: {
        devices: {
          total: health.metrics.totalDevices,
          online: health.metrics.onlineDevices,
          coverage: health.metrics.onlineDevices / health.metrics.totalDevices
        },
        monitoring: {
          activeSessions: realTimeMonitoringPreview.getActiveSessions().length,
          alertRules: advancedAlertRulesManager.getRules().length
        },
        performance: {
          score: health.metrics.performanceScore,
          benchmarks: performanceBenchmarkOptimizer.getBenchmarkConfigs().length
        },
        compliance: {
          score: health.metrics.complianceScore,
          rules: configComplianceScanner.getRules().length
        }
      },
      recommendations: health.recommendations
    }
  }

  // 清理资源
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    
    this.removeAllListeners()
  }
}

// 导出系统集成管理器实例
export const systemIntegrationManager = new SystemIntegrationManager()