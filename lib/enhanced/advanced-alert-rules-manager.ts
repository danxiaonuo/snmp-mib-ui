// 高级告警规则模板和自动优化系统
import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface AlertRule {
  id: string
  name: string
  description: string
  expr: string // PromQL表达式
  for: string // 持续时间
  severity: 'info' | 'warning' | 'critical'
  labels: Record<string, string>
  annotations: Record<string, string>
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  category: string
  tags: string[]
  dependencies?: string[] // 依赖的其他规则ID
  conditions?: AlertCondition[]
  actions?: AlertAction[]
  metrics: {
    fireCount: number
    lastFired?: Date
    avgDuration: number
    falsePositiveRate: number
  }
}

export interface AlertCondition {
  type: 'threshold' | 'rate_of_change' | 'absence' | 'anomaly'
  metric: string
  operator: '>' | '<' | '>=' | '<=' | '==' | '!='
  value: number
  duration: string
  aggregation?: 'avg' | 'max' | 'min' | 'sum' | 'count'
  groupBy?: string[]
}

export interface AlertAction {
  type: 'webhook' | 'email' | 'slack' | 'pagerduty' | 'script'
  config: Record<string, any>
  conditions?: {
    severity?: string[]
    timeRange?: { start: string, end: string }
    repeatInterval?: string
  }
}

export interface AlertTemplate {
  id: string
  name: string
  description: string
  category: string
  vendor?: string
  deviceType?: string
  rules: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'metrics'>[]
  variables: Array<{
    name: string
    description: string
    type: 'string' | 'number' | 'boolean'
    defaultValue: any
    validation?: {
      min?: number
      max?: number
      pattern?: string
      required?: boolean
    }
  }>
  prerequisites: string[]
  tags: string[]
}

export interface AlertRuleGroup {
  id: string
  name: string
  description: string
  interval: string
  rules: AlertRule[]
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  deployedTo: string[]
}

export interface AlertMetrics {
  ruleId: string
  timestamp: Date
  status: 'firing' | 'resolved'
  duration: number
  labels: Record<string, string>
  annotations: Record<string, string>
  value: number
}

export interface AlertOptimizationSuggestion {
  ruleId: string
  type: 'threshold_adjustment' | 'duration_adjustment' | 'expression_optimization' | 'false_positive_reduction'
  description: string
  currentValue: any
  suggestedValue: any
  confidence: number
  reasoning: string
  impact: 'low' | 'medium' | 'high'
}

export class AdvancedAlertRulesManager {
  private rulesPath: string
  private templatesPath: string
  private groupsPath: string
  private metricsPath: string
  private rules: Map<string, AlertRule> = new Map()
  private templates: Map<string, AlertTemplate> = new Map()
  private ruleGroups: Map<string, AlertRuleGroup> = new Map()
  private alertMetrics: Map<string, AlertMetrics[]> = new Map()

  constructor(basePath: string = '/etc/snmp-configs/alerts') {
    this.rulesPath = path.join(basePath, 'rules')
    this.templatesPath = path.join(basePath, 'templates')
    this.groupsPath = path.join(basePath, 'groups')
    this.metricsPath = path.join(basePath, 'metrics')
    this.initializeStorage()
    this.initializeDefaultTemplates()
  }

  // 初始化存储
  private async initializeStorage() {
    try {
      await fs.mkdir(this.rulesPath, { recursive: true })
      await fs.mkdir(this.templatesPath, { recursive: true })
      await fs.mkdir(this.groupsPath, { recursive: true })
      await fs.mkdir(this.metricsPath, { recursive: true })
    } catch (error) {
      console.error('Failed to initialize alert storage:', error)
    }
  }

  // 初始化默认模板
  private initializeDefaultTemplates() {
    const defaultTemplates: AlertTemplate[] = [
      {
        id: 'cisco_switch_alerts',
        name: 'Cisco Switch Alert Template',
        description: 'Cisco交换机告警规则模板',
        category: 'network',
        vendor: 'cisco',
        deviceType: 'switch',
        rules: [
          {
            name: 'cisco_cpu_high',
            description: 'Cisco CPU使用率过高',
            expr: 'cisco_cpu_1min{job="snmp"} > {{cpu_threshold}}',
            for: '{{cpu_duration}}',
            severity: 'warning',
            labels: {
              alert_type: 'performance',
              component: 'cpu'
            },
            annotations: {
              summary: 'Cisco设备CPU使用率过高',
              description: '设备 {{ $labels.instance }} CPU使用率为 {{ $value }}%，超过阈值 {{cpu_threshold}}%',
              runbook_url: 'https://wiki.company.com/cisco-cpu-high'
            },
            enabled: true,
            category: 'performance',
            tags: ['cpu', 'performance', 'cisco'],
            conditions: [
              {
                type: 'threshold',
                metric: 'cisco_cpu_1min',
                operator: '>',
                value: 80,
                duration: '5m',
                aggregation: 'avg'
              }
            ],
            actions: [
              {
                type: 'webhook',
                config: {
                  url: '{{webhook_url}}',
                  method: 'POST'
                },
                conditions: {
                  severity: ['warning', 'critical']
                }
              }
            ],
            metrics: {
              fireCount: 0,
              avgDuration: 0,
              falsePositiveRate: 0
            }
          },
          {
            name: 'cisco_memory_high',
            description: 'Cisco内存使用率过高',
            expr: '(cisco_memory_used{job="snmp"} / (cisco_memory_used{job="snmp"} + cisco_memory_free{job="snmp"})) * 100 > {{memory_threshold}}',
            for: '{{memory_duration}}',
            severity: 'warning',
            labels: {
              alert_type: 'performance',
              component: 'memory'
            },
            annotations: {
              summary: 'Cisco设备内存使用率过高',
              description: '设备 {{ $labels.instance }} 内存使用率为 {{ $value }}%，超过阈值 {{memory_threshold}}%'
            },
            enabled: true,
            category: 'performance',
            tags: ['memory', 'performance', 'cisco'],
            conditions: [
              {
                type: 'threshold',
                metric: 'cisco_memory_usage',
                operator: '>',
                value: 85,
                duration: '5m'
              }
            ],
            metrics: {
              fireCount: 0,
              avgDuration: 0,
              falsePositiveRate: 0
            }
          },
          {
            name: 'cisco_interface_down',
            description: 'Cisco接口状态异常',
            expr: 'interface_oper_status{job="snmp",device_type="cisco"} == 2',
            for: '1m',
            severity: 'critical',
            labels: {
              alert_type: 'connectivity',
              component: 'interface'
            },
            annotations: {
              summary: 'Cisco设备接口状态异常',
              description: '设备 {{ $labels.instance }} 接口 {{ $labels.interface }} 状态为down'
            },
            enabled: true,
            category: 'connectivity',
            tags: ['interface', 'connectivity', 'cisco'],
            metrics: {
              fireCount: 0,
              avgDuration: 0,
              falsePositiveRate: 0
            }
          },
          {
            name: 'cisco_temperature_high',
            description: 'Cisco设备温度过高',
            expr: 'cisco_temperature{job="snmp"} > {{temperature_threshold}}',
            for: '{{temperature_duration}}',
            severity: 'critical',
            labels: {
              alert_type: 'environmental',
              component: 'temperature'
            },
            annotations: {
              summary: 'Cisco设备温度过高',
              description: '设备 {{ $labels.instance }} 温度为 {{ $value }}°C，超过阈值 {{temperature_threshold}}°C'
            },
            enabled: true,
            category: 'environmental',
            tags: ['temperature', 'environmental', 'cisco'],
            metrics: {
              fireCount: 0,
              avgDuration: 0,
              falsePositiveRate: 0
            }
          }
        ],
        variables: [
          {
            name: 'cpu_threshold',
            description: 'CPU使用率告警阈值',
            type: 'number',
            defaultValue: 80,
            validation: { min: 50, max: 95, required: true }
          },
          {
            name: 'cpu_duration',
            description: 'CPU告警持续时间',
            type: 'string',
            defaultValue: '5m',
            validation: { pattern: '^\\d+[smhd]$', required: true }
          },
          {
            name: 'memory_threshold',
            description: '内存使用率告警阈值',
            type: 'number',
            defaultValue: 85,
            validation: { min: 60, max: 98, required: true }
          },
          {
            name: 'memory_duration',
            description: '内存告警持续时间',
            type: 'string',
            defaultValue: '5m'
          },
          {
            name: 'temperature_threshold',
            description: '温度告警阈值',
            type: 'number',
            defaultValue: 65,
            validation: { min: 40, max: 80, required: true }
          },
          {
            name: 'temperature_duration',
            description: '温度告警持续时间',
            type: 'string',
            defaultValue: '2m'
          },
          {
            name: 'webhook_url',
            description: 'Webhook通知URL',
            type: 'string',
            defaultValue: 'https://hooks.slack.com/services/xxx'
          }
        ],
        prerequisites: [
          '确保SNMP监控已启用',
          '确保设备OID配置正确',
          '确保Prometheus正在收集指标'
        ],
        tags: ['cisco', 'switch', 'network', 'performance']
      },
      {
        id: 'h3c_switch_alerts',
        name: 'H3C Switch Alert Template',
        description: 'H3C交换机告警规则模板',
        category: 'network',
        vendor: 'h3c',
        deviceType: 'switch',
        rules: [
          {
            name: 'h3c_cpu_high',
            description: 'H3C CPU使用率过高',
            expr: 'h3c_cpu_usage{job="snmp"} > {{cpu_threshold}}',
            for: '{{cpu_duration}}',
            severity: 'warning',
            labels: {
              alert_type: 'performance',
              component: 'cpu'
            },
            annotations: {
              summary: 'H3C设备CPU使用率过高',
              description: '设备 {{ $labels.instance }} CPU使用率为 {{ $value }}%，超过阈值 {{cpu_threshold}}%'
            },
            enabled: true,
            category: 'performance',
            tags: ['cpu', 'performance', 'h3c'],
            metrics: {
              fireCount: 0,
              avgDuration: 0,
              falsePositiveRate: 0
            }
          },
          {
            name: 'h3c_memory_high',
            description: 'H3C内存使用率过高',
            expr: 'h3c_memory_usage{job="snmp"} > {{memory_threshold}}',
            for: '{{memory_duration}}',
            severity: 'warning',
            labels: {
              alert_type: 'performance',
              component: 'memory'
            },
            annotations: {
              summary: 'H3C设备内存使用率过高',
              description: '设备 {{ $labels.instance }} 内存使用率为 {{ $value }}%，超过阈值 {{memory_threshold}}%'
            },
            enabled: true,
            category: 'performance',
            tags: ['memory', 'performance', 'h3c'],
            metrics: {
              fireCount: 0,
              avgDuration: 0,
              falsePositiveRate: 0
            }
          }
        ],
        variables: [
          {
            name: 'cpu_threshold',
            description: 'CPU使用率告警阈值',
            type: 'number',
            defaultValue: 80
          },
          {
            name: 'cpu_duration',
            description: 'CPU告警持续时间',
            type: 'string',
            defaultValue: '5m'
          },
          {
            name: 'memory_threshold',
            description: '内存使用率告警阈值',
            type: 'number',
            defaultValue: 85
          },
          {
            name: 'memory_duration',
            description: '内存告警持续时间',
            type: 'string',
            defaultValue: '5m'
          }
        ],
        prerequisites: [
          '确保H3C SNMP配置正确',
          '确保监控采集器正常工作'
        ],
        tags: ['h3c', 'switch', 'network']
      },
      {
        id: 'generic_snmp_alerts',
        name: 'Generic SNMP Alert Template',
        description: '通用SNMP设备告警规则模板',
        category: 'network',
        rules: [
          {
            name: 'snmp_device_unreachable',
            description: 'SNMP设备不可达',
            expr: 'up{job="snmp"} == 0',
            for: '3m',
            severity: 'critical',
            labels: {
              alert_type: 'connectivity',
              component: 'device'
            },
            annotations: {
              summary: 'SNMP设备不可达',
              description: '设备 {{ $labels.instance }} 无法通过SNMP访问，已持续 {{ $for }}'
            },
            enabled: true,
            category: 'connectivity',
            tags: ['connectivity', 'snmp', 'device'],
            metrics: {
              fireCount: 0,
              avgDuration: 0,
              falsePositiveRate: 0
            }
          },
          {
            name: 'system_uptime_reset',
            description: '系统运行时间重置',
            expr: 'increase(system_uptime{job="snmp"}[5m]) < 0',
            for: '1m',
            severity: 'warning',
            labels: {
              alert_type: 'system',
              component: 'uptime'
            },
            annotations: {
              summary: '设备重启检测',
              description: '设备 {{ $labels.instance }} 运行时间发生重置，可能已重启'
            },
            enabled: true,
            category: 'system',
            tags: ['uptime', 'reboot', 'system'],
            metrics: {
              fireCount: 0,
              avgDuration: 0,
              falsePositiveRate: 0
            }
          },
          {
            name: 'interface_utilization_high',
            description: '接口利用率过高',
            expr: 'rate(interface_in_octets{job="snmp"}[5m]) * 8 / interface_speed{job="snmp"} * 100 > {{interface_threshold}}',
            for: '{{interface_duration}}',
            severity: 'warning',
            labels: {
              alert_type: 'performance',
              component: 'interface'
            },
            annotations: {
              summary: '接口利用率过高',
              description: '设备 {{ $labels.instance }} 接口 {{ $labels.interface }} 利用率为 {{ $value }}%'
            },
            enabled: true,
            category: 'performance',
            tags: ['interface', 'utilization', 'performance'],
            metrics: {
              fireCount: 0,
              avgDuration: 0,
              falsePositiveRate: 0
            }
          }
        ],
        variables: [
          {
            name: 'interface_threshold',
            description: '接口利用率告警阈值',
            type: 'number',
            defaultValue: 80
          },
          {
            name: 'interface_duration',
            description: '接口告警持续时间',
            type: 'string',
            defaultValue: '5m'
          }
        ],
        prerequisites: [
          '确保SNMP设备配置正确',
          '确保基础指标正常采集'
        ],
        tags: ['generic', 'snmp', 'universal']
      }
    ]

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  // 创建告警规则
  async createRule(ruleData: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>): Promise<AlertRule> {
    const rule: AlertRule = {
      ...ruleData,
      id: `rule_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      metrics: {
        fireCount: 0,
        avgDuration: 0,
        falsePositiveRate: 0
      }
    }

    // 验证PromQL表达式
    await this.validatePromQLExpression(rule.expr)

    this.rules.set(rule.id, rule)
    await this.saveRule(rule)

    return rule
  }

  // 从模板创建规则
  async createRulesFromTemplate(
    templateId: string,
    variables: Record<string, any>,
    options: {
      groupName?: string
      enabled?: boolean
      overrides?: Record<string, Partial<AlertRule>>
    } = {}
  ): Promise<AlertRule[]> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    // 验证变量
    this.validateTemplateVariables(template, variables)

    const createdRules: AlertRule[] = []

    for (const ruleTemplate of template.rules) {
      // 替换变量
      const processedRule = this.processRuleTemplate(ruleTemplate, variables, template.variables)
      
      // 应用覆盖设置
      const overrideKey = ruleTemplate.name
      if (options.overrides && options.overrides[overrideKey]) {
        Object.assign(processedRule, options.overrides[overrideKey])
      }

      if (options.enabled !== undefined) {
        processedRule.enabled = options.enabled
      }

      const rule = await this.createRule(processedRule)
      createdRules.push(rule)
    }

    // 如果指定了组名，创建规则组
    if (options.groupName) {
      await this.createRuleGroup({
        name: options.groupName,
        description: `Rules created from template: ${template.name}`,
        interval: '30s',
        rules: createdRules,
        enabled: true
      })
    }

    return createdRules
  }

  // 处理规则模板
  private processRuleTemplate(
    ruleTemplate: any,
    variables: Record<string, any>,
    templateVariables: AlertTemplate['variables']
  ): Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt' | 'metrics'> {
    const processedRule = JSON.parse(JSON.stringify(ruleTemplate))

    // 替换表达式中的变量
    processedRule.expr = this.replaceVariables(processedRule.expr, variables)
    processedRule.for = this.replaceVariables(processedRule.for, variables)

    // 替换注释中的变量
    if (processedRule.annotations) {
      for (const [key, value] of Object.entries(processedRule.annotations)) {
        processedRule.annotations[key] = this.replaceVariables(value as string, variables)
      }
    }

    // 处理条件中的变量
    if (processedRule.conditions) {
      for (const condition of processedRule.conditions) {
        if (typeof condition.value === 'string' && condition.value.startsWith('{{')) {
          const varName = condition.value.slice(2, -2)
          condition.value = variables[varName] || condition.value
        }
      }
    }

    // 处理动作中的变量
    if (processedRule.actions) {
      for (const action of processedRule.actions) {
        if (action.config) {
          for (const [key, value] of Object.entries(action.config)) {
            if (typeof value === 'string') {
              action.config[key] = this.replaceVariables(value, variables)
            }
          }
        }
      }
    }

    return processedRule
  }

  // 替换变量
  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? variables[varName].toString() : match
    })
  }

  // 验证模板变量
  private validateTemplateVariables(template: AlertTemplate, variables: Record<string, any>) {
    for (const variable of template.variables) {
      const value = variables[variable.name]
      
      if (variable.validation?.required && (value === undefined || value === null)) {
        throw new Error(`Required variable '${variable.name}' is missing`)
      }
      
      if (value !== undefined && variable.validation) {
        const validation = variable.validation
        
        if (variable.type === 'number' && typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            throw new Error(`Variable '${variable.name}' value ${value} is below minimum ${validation.min}`)
          }
          if (validation.max !== undefined && value > validation.max) {
            throw new Error(`Variable '${variable.name}' value ${value} is above maximum ${validation.max}`)
          }
        }
        
        if (variable.type === 'string' && typeof value === 'string') {
          if (validation.pattern) {
            const regex = new RegExp(validation.pattern)
            if (!regex.test(value)) {
              throw new Error(`Variable '${variable.name}' value '${value}' does not match pattern ${validation.pattern}`)
            }
          }
        }
      }
    }
  }

  // 验证PromQL表达式
  private async validatePromQLExpression(expr: string): Promise<void> {
    try {
      // 使用promtool验证表达式
      await execAsync(`echo '${expr}' | promtool query expr`, { timeout: 5000 })
    } catch (error) {
      throw new Error(`Invalid PromQL expression: ${expr}`)
    }
  }

  // 保存规则
  private async saveRule(rule: AlertRule) {
    const ruleFile = path.join(this.rulesPath, `${rule.id}.json`)
    await fs.writeFile(ruleFile, JSON.stringify(rule, null, 2))
  }

  // 创建规则组
  async createRuleGroup(groupData: Omit<AlertRuleGroup, 'id' | 'createdAt' | 'updatedAt' | 'deployedTo'>): Promise<AlertRuleGroup> {
    const group: AlertRuleGroup = {
      ...groupData,
      id: `group_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      deployedTo: []
    }

    this.ruleGroups.set(group.id, group)
    await this.saveRuleGroup(group)

    return group
  }

  // 保存规则组
  private async saveRuleGroup(group: AlertRuleGroup) {
    const groupFile = path.join(this.groupsPath, `${group.id}.json`)
    await fs.writeFile(groupFile, JSON.stringify(group, null, 2))
  }

  // 生成Prometheus告警规则文件
  async generatePrometheusRulesFile(groupId: string): Promise<string> {
    const group = this.ruleGroups.get(groupId)
    if (!group) {
      throw new Error(`Rule group ${groupId} not found`)
    }

    const prometheusRules = {
      groups: [
        {
          name: group.name,
          interval: group.interval,
          rules: group.rules
            .filter(rule => rule.enabled)
            .map(rule => ({
              alert: rule.name,
              expr: rule.expr,
              for: rule.for,
              labels: rule.labels,
              annotations: rule.annotations
            }))
        }
      ]
    }

    return yaml.dump(prometheusRules, { indent: 2 })
  }

  // 部署告警规则到Prometheus
  async deployRulesToPrometheus(
    groupId: string,
    prometheusConfig: {
      host: string
      port: number
      rulesPath: string
      reloadEndpoint?: string
    }
  ): Promise<void> {
    const rulesYaml = await this.generatePrometheusRulesFile(groupId)
    const group = this.ruleGroups.get(groupId)
    
    if (!group) {
      throw new Error(`Rule group ${groupId} not found`)
    }

    // 生成规则文件名
    const filename = `${group.name.replace(/[^a-zA-Z0-9]/g, '_')}.yml`
    const fullPath = path.join(prometheusConfig.rulesPath, filename)

    try {
      // 写入规则文件
      await fs.writeFile(fullPath, rulesYaml)

      // 重新加载Prometheus配置
      if (prometheusConfig.reloadEndpoint) {
        const response = await fetch(`http://${prometheusConfig.host}:${prometheusConfig.port}${prometheusConfig.reloadEndpoint}`, {
          method: 'POST'
        })
        
        if (!response.ok) {
          throw new Error(`Failed to reload Prometheus config: ${response.statusText}`)
        }
      }

      // 标记为已部署
      const deploymentTarget = `${prometheusConfig.host}:${prometheusConfig.port}`
      if (!group.deployedTo.includes(deploymentTarget)) {
        group.deployedTo.push(deploymentTarget)
        group.updatedAt = new Date()
        await this.saveRuleGroup(group)
      }

    } catch (error) {
      throw new Error(`Failed to deploy rules: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 分析告警指标并生成优化建议
  async analyzeAndOptimizeRules(ruleId?: string): Promise<AlertOptimizationSuggestion[]> {
    const suggestions: AlertOptimizationSuggestion[] = []
    const rulesToAnalyze = ruleId ? [this.rules.get(ruleId)].filter(Boolean) : Array.from(this.rules.values())

    for (const rule of rulesToAnalyze as AlertRule[]) {
      const ruleMetrics = this.alertMetrics.get(rule.id) || []
      
      // 分析误报率
      if (rule.metrics.falsePositiveRate > 0.3) {
        suggestions.push({
          ruleId: rule.id,
          type: 'threshold_adjustment',
          description: '告警规则误报率过高，建议调整阈值',
          currentValue: this.extractThresholdFromExpression(rule.expr),
          suggestedValue: this.calculateOptimalThreshold(ruleMetrics),
          confidence: 0.8,
          reasoning: `当前误报率为 ${(rule.metrics.falsePositiveRate * 100).toFixed(1)}%，超过30%阈值`,
          impact: 'medium'
        })
      }

      // 分析触发频率
      if (rule.metrics.fireCount > 100 && rule.metrics.avgDuration < 300) {
        suggestions.push({
          ruleId: rule.id,
          type: 'duration_adjustment',
          description: '告警规则触发过于频繁且持续时间短，建议增加持续时间',
          currentValue: rule.for,
          suggestedValue: this.suggestOptimalDuration(rule.metrics.avgDuration),
          confidence: 0.7,
          reasoning: `触发次数 ${rule.metrics.fireCount}，平均持续时间 ${rule.metrics.avgDuration}秒`,
          impact: 'low'
        })
      }

      // 分析表达式复杂度
      if (this.isComplexExpression(rule.expr)) {
        suggestions.push({
          ruleId: rule.id,
          type: 'expression_optimization',
          description: '告警表达式过于复杂，建议简化',
          currentValue: rule.expr,
          suggestedValue: this.simplifyExpression(rule.expr),
          confidence: 0.6,
          reasoning: '复杂的表达式可能影响性能和维护性',
          impact: 'low'
        })
      }

      // 检查依赖关系
      if (rule.dependencies && rule.dependencies.length > 0) {
        const dependencyIssues = this.analyzeDependencies(rule)
        if (dependencyIssues.length > 0) {
          suggestions.push({
            ruleId: rule.id,
            type: 'false_positive_reduction',
            description: '依赖规则可能导致误报，建议优化依赖关系',
            currentValue: rule.dependencies,
            suggestedValue: this.optimizeDependencies(rule),
            confidence: 0.5,
            reasoning: dependencyIssues.join('; '),
            impact: 'medium'
          })
        }
      }
    }

    return suggestions
  }

  // 从表达式提取阈值
  private extractThresholdFromExpression(expr: string): number | null {
    const match = expr.match(/>\s*(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null
  }

  // 计算最优阈值
  private calculateOptimalThreshold(metrics: AlertMetrics[]): number {
    if (metrics.length === 0) return 0
    
    const values = metrics.map(m => m.value).sort((a, b) => a - b)
    const p95Index = Math.floor(values.length * 0.95)
    return values[p95Index] || values[values.length - 1]
  }

  // 建议最优持续时间
  private suggestOptimalDuration(avgDuration: number): string {
    const suggestedDuration = Math.max(avgDuration * 2, 300) // 至少5分钟
    
    if (suggestedDuration < 60) return `${Math.round(suggestedDuration)}s`
    if (suggestedDuration < 3600) return `${Math.round(suggestedDuration / 60)}m`
    return `${Math.round(suggestedDuration / 3600)}h`
  }

  // 检查表达式复杂度
  private isComplexExpression(expr: string): boolean {
    const complexity = (expr.match(/[()]/g) || []).length +
                      (expr.match(/\b(and|or|unless)\b/g) || []).length +
                      (expr.match(/\b(sum|avg|max|min|count)\b/g) || []).length
    
    return complexity > 10
  }

  // 简化表达式
  private simplifyExpression(expr: string): string {
    // 简单的表达式简化逻辑
    return expr.replace(/\s+/g, ' ').trim()
  }

  // 分析依赖关系
  private analyzeDependencies(rule: AlertRule): string[] {
    const issues: string[] = []
    
    if (rule.dependencies && rule.dependencies.length > 3) {
      issues.push('依赖规则过多')
    }
    
    // 检查循环依赖
    if (this.hasCircularDependency(rule)) {
      issues.push('存在循环依赖')
    }
    
    return issues
  }

  // 检查循环依赖
  private hasCircularDependency(rule: AlertRule, visited: Set<string> = new Set()): boolean {
    if (visited.has(rule.id)) return true
    
    visited.add(rule.id)
    
    if (rule.dependencies) {
      for (const depId of rule.dependencies) {
        const depRule = this.rules.get(depId)
        if (depRule && this.hasCircularDependency(depRule, new Set(visited))) {
          return true
        }
      }
    }
    
    return false
  }

  // 优化依赖关系
  private optimizeDependencies(rule: AlertRule): string[] {
    if (!rule.dependencies) return []
    
    // 移除循环依赖和过多依赖
    return rule.dependencies.slice(0, 2).filter(depId => {
      const depRule = this.rules.get(depId)
      return depRule && !this.hasCircularDependency(depRule)
    })
  }

  // 应用优化建议
  async applyOptimizationSuggestion(suggestion: AlertOptimizationSuggestion): Promise<void> {
    const rule = this.rules.get(suggestion.ruleId)
    if (!rule) {
      throw new Error(`Rule ${suggestion.ruleId} not found`)
    }

    switch (suggestion.type) {
      case 'threshold_adjustment':
        // 更新表达式中的阈值
        rule.expr = rule.expr.replace(
          />\s*\d+(?:\.\d+)?/,
          `> ${suggestion.suggestedValue}`
        )
        break
        
      case 'duration_adjustment':
        rule.for = suggestion.suggestedValue as string
        break
        
      case 'expression_optimization':
        rule.expr = suggestion.suggestedValue as string
        break
        
      case 'false_positive_reduction':
        rule.dependencies = suggestion.suggestedValue as string[]
        break
    }

    rule.updatedAt = new Date()
    await this.saveRule(rule)
  }

  // 记录告警指标
  async recordAlertMetrics(metric: AlertMetrics): Promise<void> {
    const ruleMetrics = this.alertMetrics.get(metric.ruleId) || []
    ruleMetrics.push(metric)
    
    // 保留最近1000条记录
    if (ruleMetrics.length > 1000) {
      ruleMetrics.splice(0, ruleMetrics.length - 1000)
    }
    
    this.alertMetrics.set(metric.ruleId, ruleMetrics)
    
    // 更新规则统计信息
    const rule = this.rules.get(metric.ruleId)
    if (rule) {
      if (metric.status === 'firing') {
        rule.metrics.fireCount++
        rule.metrics.lastFired = metric.timestamp
      }
      
      // 计算平均持续时间
      const firingMetrics = ruleMetrics.filter(m => m.status === 'firing')
      if (firingMetrics.length > 0) {
        rule.metrics.avgDuration = firingMetrics.reduce((sum, m) => sum + m.duration, 0) / firingMetrics.length
      }
      
      await this.saveRule(rule)
    }
    
    // 保存指标到文件
    const metricsFile = path.join(this.metricsPath, `${metric.ruleId}_${new Date().toISOString().split('T')[0]}.jsonl`)
    await fs.appendFile(metricsFile, JSON.stringify(metric) + '\n')
  }

  // 获取规则
  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId)
  }

  // 获取所有规则
  getRules(filter?: { category?: string; enabled?: boolean; tags?: string[] }): AlertRule[] {
    let rules = Array.from(this.rules.values())
    
    if (filter) {
      if (filter.category) {
        rules = rules.filter(r => r.category === filter.category)
      }
      
      if (filter.enabled !== undefined) {
        rules = rules.filter(r => r.enabled === filter.enabled)
      }
      
      if (filter.tags) {
        rules = rules.filter(r => filter.tags!.some(tag => r.tags.includes(tag)))
      }
    }
    
    return rules
  }

  // 获取模板
  getTemplates(filter?: { vendor?: string; deviceType?: string; category?: string }): AlertTemplate[] {
    let templates = Array.from(this.templates.values())
    
    if (filter) {
      if (filter.vendor) {
        templates = templates.filter(t => t.vendor === filter.vendor)
      }
      
      if (filter.deviceType) {
        templates = templates.filter(t => t.deviceType === filter.deviceType)
      }
      
      if (filter.category) {
        templates = templates.filter(t => t.category === filter.category)
      }
    }
    
    return templates
  }

  // 获取规则组
  getRuleGroups(): AlertRuleGroup[] {
    return Array.from(this.ruleGroups.values())
  }

  // 获取优化建议
  async getOptimizationSuggestions(ruleId?: string): Promise<AlertOptimizationSuggestion[]> {
    return await this.analyzeAndOptimizeRules(ruleId)
  }
}

// 导出告警规则管理器实例
export const advancedAlertRulesManager = new AdvancedAlertRulesManager()