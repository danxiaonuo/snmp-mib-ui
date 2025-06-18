// 配置验证和服务管理功能
// 支持多种监控系统的配置验证

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  details?: any
}

export interface ServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'failed' | 'unknown'
  pid?: number
  uptime?: string
  memory?: string
  cpu?: string
  port?: number
  healthy?: boolean
  lastCheck?: Date
}

export interface ConfigValidationOptions {
  strictMode?: boolean
  validatePromQL?: boolean
  checkConnectivity?: boolean
  validateSyntax?: boolean
  checkPermissions?: boolean
}

export class ConfigValidationService {
  
  // 验证 Prometheus 配置
  validatePrometheusConfig(config: string, options?: ConfigValidationOptions): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    try {
      // 基本的 YAML 语法检查
      const yamlValidation = this.validateYAMLSyntax(config)
      if (!yamlValidation.valid) {
        result.valid = false
        result.errors.push(...yamlValidation.errors)
        return result
      }

      // 解析 YAML 内容
      const configObj = this.parseYAML(config)

      // 检查必需的部分
      this.validatePrometheusStructure(configObj, result)

      // 验证 scrape_configs
      this.validateScrapeConfigs(configObj.scrape_configs || [], result)

      // 验证 rule_files
      this.validateRuleFiles(configObj.rule_files || [], result)

      // 验证 alerting 配置
      if (configObj.alerting) {
        this.validateAlertingConfig(configObj.alerting, result)
      }

      // 性能和最佳实践建议
      this.addPrometheusRecommendations(configObj, result)

    } catch (error) {
      result.valid = false
      result.errors.push(`配置解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  // 验证 Alertmanager 配置
  validateAlertmanagerConfig(config: string, options?: ConfigValidationOptions): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    try {
      const yamlValidation = this.validateYAMLSyntax(config)
      if (!yamlValidation.valid) {
        result.valid = false
        result.errors.push(...yamlValidation.errors)
        return result
      }

      const configObj = this.parseYAML(config)

      // 检查必需的部分
      this.validateAlertmanagerStructure(configObj, result)

      // 验证路由配置
      if (configObj.route) {
        this.validateRouteConfig(configObj.route, result)
      }

      // 验证接收器
      this.validateReceivers(configObj.receivers || [], result)

      // 验证抑制规则
      if (configObj.inhibit_rules) {
        this.validateInhibitRules(configObj.inhibit_rules, result)
      }

    } catch (error) {
      result.valid = false
      result.errors.push(`Alertmanager 配置解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  // 验证 SNMP Exporter 配置
  validateSNMPExporterConfig(config: string, options?: ConfigValidationOptions): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    try {
      const yamlValidation = this.validateYAMLSyntax(config)
      if (!yamlValidation.valid) {
        result.valid = false
        result.errors.push(...yamlValidation.errors)
        return result
      }

      const configObj = this.parseYAML(config)

      // 检查 modules 结构
      if (!configObj.modules || typeof configObj.modules !== 'object') {
        result.valid = false
        result.errors.push('缺少 modules 配置')
        return result
      }

      // 验证每个模块
      for (const [moduleName, moduleConfig] of Object.entries(configObj.modules)) {
        this.validateSNMPModule(moduleName, moduleConfig as any, result)
      }

    } catch (error) {
      result.valid = false
      result.errors.push(`SNMP Exporter 配置解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  // 验证 Categraf 配置
  validateCategrafConfig(config: string, options?: ConfigValidationOptions): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    try {
      // TOML 语法检查
      const tomlValidation = this.validateTOMLSyntax(config)
      if (!tomlValidation.valid) {
        result.valid = false
        result.errors.push(...tomlValidation.errors)
        return result
      }

      // 解析 TOML 内容
      const configObj = this.parseTOML(config)

      // 检查全局配置
      if (configObj.global) {
        this.validateCategrafGlobal(configObj.global, result)
      }

      // 检查 writer 配置
      if (configObj.writers) {
        this.validateCategrafWriters(configObj.writers, result)
      }

      // 检查输入插件
      this.validateCategrafInputs(configObj, result)

    } catch (error) {
      result.valid = false
      result.errors.push(`Categraf 配置解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  // 验证 VMAlert 配置
  validateVMAlertConfig(config: string, options?: ConfigValidationOptions): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    try {
      const yamlValidation = this.validateYAMLSyntax(config)
      if (!yamlValidation.valid) {
        result.valid = false
        result.errors.push(...yamlValidation.errors)
        return result
      }

      const configObj = this.parseYAML(config)

      // 检查 groups 结构
      if (!configObj.groups || !Array.isArray(configObj.groups)) {
        result.valid = false
        result.errors.push('缺少 groups 配置或格式错误')
        return result
      }

      // 验证每个组
      for (const group of configObj.groups) {
        this.validateVMAlertGroup(group, result, options)
      }

    } catch (error) {
      result.valid = false
      result.errors.push(`VMAlert 配置解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  // PromQL 表达式验证
  validatePromQL(expression: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    try {
      if (!expression || expression.trim() === '') {
        result.valid = false
        result.errors.push('PromQL 表达式不能为空')
        return result
      }

      // 基本语法检查
      this.validatePromQLSyntax(expression, result)

      // 性能建议
      this.addPromQLPerformanceHints(expression, result)

      // 最佳实践建议
      this.addPromQLBestPractices(expression, result)

    } catch (error) {
      result.valid = false
      result.errors.push(`PromQL 验证失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  // 服务状态检查
  async checkServiceStatus(serviceName: string, host: string, port?: number): Promise<ServiceStatus> {
    const status: ServiceStatus = {
      name: serviceName,
      status: 'unknown',
      lastCheck: new Date()
    }

    try {
      // 健康检查端点映射
      const healthEndpoints: Record<string, string> = {
        'prometheus': '/-/healthy',
        'alertmanager': '/-/healthy',
        'grafana': '/api/health',
        'victoriametrics': '/health',
        'vmagent': '/health',
        'vmalert': '/health'
      }

      const endpoint = healthEndpoints[serviceName] || '/health'
      const checkPort = port || this.getDefaultPort(serviceName)
      const healthUrl = `http://${host}:${checkPort}${endpoint}`

      // 执行健康检查
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        status.status = 'running'
        status.healthy = true
        status.port = checkPort

        // 尝试获取更多状态信息
        const statusInfo = await this.getServiceDetails(serviceName, host, checkPort)
        Object.assign(status, statusInfo)
      } else {
        status.status = 'failed'
        status.healthy = false
      }

    } catch (error) {
      status.status = 'unknown'
      status.healthy = false
    }

    return status
  }

  // 批量服务状态检查
  async checkMultipleServices(services: Array<{name: string, host: string, port?: number}>): Promise<ServiceStatus[]> {
    const statusPromises = services.map(service => 
      this.checkServiceStatus(service.name, service.host, service.port)
    )

    return await Promise.all(statusPromises)
  }

  // 私有方法

  private validateYAMLSyntax(yaml: string): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [], suggestions: [] }

    try {
      const lines = yaml.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.trim() && !line.trim().startsWith('#')) {
          // 检查缩进
          const indent = line.length - line.trimStart().length
          if (indent % 2 !== 0) {
            result.valid = false
            result.errors.push(`第 ${i + 1} 行: 缩进应为偶数空格`)
          }

          // 检查冒号语法
          if (line.includes(':') && !line.includes('://')) {
            const colonIndex = line.indexOf(':')
            const afterColon = line.substring(colonIndex + 1).trim()
            if (afterColon && !afterColon.startsWith(' ')) {
              result.warnings.push(`第 ${i + 1} 行: 冒号后建议添加空格`)
            }
          }
        }
      }
    } catch (error) {
      result.valid = false
      result.errors.push(`YAML 语法检查失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  private validateTOMLSyntax(toml: string): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [], suggestions: [] }

    try {
      const lines = toml.split('\n')
      let inTable = false
      let inArrayOfTables = false

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (!line || line.startsWith('#')) continue

        // 检查表头
        if (line.startsWith('[') && line.endsWith(']')) {
          if (line.startsWith('[[') && line.endsWith(']]')) {
            inArrayOfTables = true
            inTable = false
          } else {
            inTable = true
            inArrayOfTables = false
          }
          continue
        }

        // 检查键值对
        if (line.includes('=')) {
          const [key, ...valueParts] = line.split('=')
          const value = valueParts.join('=').trim()
          
          if (!key.trim()) {
            result.valid = false
            result.errors.push(`第 ${i + 1} 行: 缺少键名`)
          }
          
          if (!value) {
            result.valid = false
            result.errors.push(`第 ${i + 1} 行: 缺少值`)
          }
        }
      }
    } catch (error) {
      result.valid = false
      result.errors.push(`TOML 语法检查失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  private parseYAML(yaml: string): any {
    // 简化的 YAML 解析，实际应该使用专业的 YAML 解析库
    try {
      // 这里应该使用 js-yaml 或类似库
      return {} // 模拟解析结果
    } catch (error) {
      throw new Error(`YAML 解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private parseTOML(toml: string): any {
    // 简化的 TOML 解析，实际应该使用专业的 TOML 解析库
    try {
      // 这里应该使用 @iarna/toml 或类似库
      return {} // 模拟解析结果
    } catch (error) {
      throw new Error(`TOML 解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private validatePrometheusStructure(config: any, result: ValidationResult): void {
    // 检查全局配置
    if (!config.global) {
      result.warnings.push('建议配置 global 部分')
    } else {
      if (!config.global.scrape_interval) {
        result.warnings.push('建议设置 global.scrape_interval')
      }
    }

    // 检查 scrape_configs
    if (!config.scrape_configs || !Array.isArray(config.scrape_configs)) {
      result.valid = false
      result.errors.push('缺少 scrape_configs 配置')
    }
  }

  private validateScrapeConfigs(scrapeConfigs: any[], result: ValidationResult): void {
    scrapeConfigs.forEach((config, index) => {
      if (!config.job_name) {
        result.valid = false
        result.errors.push(`scrape_configs[${index}]: 缺少 job_name`)
      }

      if (!config.static_configs && !config.kubernetes_sd_configs && !config.file_sd_configs) {
        result.valid = false
        result.errors.push(`scrape_configs[${index}]: 缺少服务发现配置`)
      }

      // 检查间隔设置
      if (config.scrape_interval) {
        if (!this.isValidDuration(config.scrape_interval)) {
          result.errors.push(`scrape_configs[${index}]: scrape_interval 格式错误`)
        }
      }
    })
  }

  private validatePromQLSyntax(expr: string, result: ValidationResult): void {
    // 检查括号匹配
    const openBrackets = (expr.match(/\(/g) || []).length
    const closeBrackets = (expr.match(/\)/g) || []).length
    if (openBrackets !== closeBrackets) {
      result.valid = false
      result.errors.push('括号不匹配')
    }

    // 检查方括号匹配
    const openSquareBrackets = (expr.match(/\[/g) || []).length
    const closeSquareBrackets = (expr.match(/\]/g) || []).length
    if (openSquareBrackets !== closeSquareBrackets) {
      result.valid = false
      result.errors.push('方括号不匹配')
    }

    // 检查花括号匹配
    const openCurlyBrackets = (expr.match(/\{/g) || []).length
    const closeCurlyBrackets = (expr.match(/\}/g) || []).length
    if (openCurlyBrackets !== closeCurlyBrackets) {
      result.valid = false
      result.errors.push('花括号不匹配')
    }

    // 检查时间范围格式
    const timeRanges = expr.match(/\[\d+[smhdwy]\]/g)
    if (timeRanges) {
      timeRanges.forEach(range => {
        if (!this.isValidDuration(range.slice(1, -1))) {
          result.errors.push(`无效的时间范围: ${range}`)
        }
      })
    }
  }

  private isValidDuration(duration: string): boolean {
    return /^\d+[smhdwy]$/.test(duration)
  }

  private getDefaultPort(serviceName: string): number {
    const defaultPorts: Record<string, number> = {
      'prometheus': 9090,
      'alertmanager': 9093,
      'grafana': 3000,
      'victoriametrics': 8428,
      'vmagent': 8429,
      'vmalert': 8880,
      'node-exporter': 9100,
      'snmp-exporter': 9116,
      'categraf': 9100
    }

    return defaultPorts[serviceName] || 8080
  }

  private async getServiceDetails(serviceName: string, host: string, port: number): Promise<Partial<ServiceStatus>> {
    const details: Partial<ServiceStatus> = {}

    try {
      // 获取版本信息
      const versionUrl = `http://${host}:${port}/api/v1/status/buildinfo`
      const versionResponse = await fetch(versionUrl, {
        signal: AbortSignal.timeout(3000)
      })

      if (versionResponse.ok) {
        const versionData = await versionResponse.json()
        details.details = versionData
      }

      // 获取运行时信息（如果支持）
      const runtimeUrl = `http://${host}:${port}/api/v1/status/runtimeinfo`
      const runtimeResponse = await fetch(runtimeUrl, {
        signal: AbortSignal.timeout(3000)
      })

      if (runtimeResponse.ok) {
        const runtimeData = await runtimeResponse.json()
        if (runtimeData.data) {
          details.uptime = runtimeData.data.startTime
          details.memory = runtimeData.data.memStats
        }
      }

    } catch (error) {
      // 忽略详细信息获取失败
    }

    return details
  }

  private validateSNMPModule(moduleName: string, moduleConfig: any, result: ValidationResult): void {
    if (!moduleConfig.walk && !moduleConfig.get) {
      result.valid = false
      result.errors.push(`模块 ${moduleName}: 必须配置 walk 或 get`)
    }

    if (moduleConfig.walk && !Array.isArray(moduleConfig.walk)) {
      result.valid = false
      result.errors.push(`模块 ${moduleName}: walk 必须是数组`)
    }

    if (moduleConfig.lookups) {
      this.validateSNMPLookups(moduleConfig.lookups, moduleName, result)
    }
  }

  private validateSNMPLookups(lookups: any[], moduleName: string, result: ValidationResult): void {
    lookups.forEach((lookup, index) => {
      if (!lookup.source_indexes || !Array.isArray(lookup.source_indexes)) {
        result.errors.push(`模块 ${moduleName} lookups[${index}]: 缺少 source_indexes`)
      }

      if (!lookup.lookup) {
        result.errors.push(`模块 ${moduleName} lookups[${index}]: 缺少 lookup`)
      }
    })
  }

  private validateCategrafGlobal(global: any, result: ValidationResult): void {
    if (!global.interval) {
      result.warnings.push('建议设置 global.interval')
    }

    if (global.interval && !this.isValidDuration(global.interval)) {
      result.errors.push('global.interval 格式错误')
    }
  }

  private validateCategrafWriters(writers: any[], result: ValidationResult): void {
    if (!Array.isArray(writers) || writers.length === 0) {
      result.valid = false
      result.errors.push('至少需要配置一个 writer')
      return
    }

    writers.forEach((writer, index) => {
      if (!writer.url) {
        result.valid = false
        result.errors.push(`writers[${index}]: 缺少 url`)
      }
    })
  }

  private validateCategrafInputs(config: any, result: ValidationResult): void {
    const inputPlugins = Object.keys(config).filter(key => key.startsWith('inputs.'))
    
    if (inputPlugins.length === 0) {
      result.warnings.push('建议至少配置一个输入插件')
    }

    inputPlugins.forEach(plugin => {
      const pluginConfig = config[plugin]
      if (Array.isArray(pluginConfig)) {
        pluginConfig.forEach((instance, index) => {
          this.validateCategrafInputInstance(plugin, instance, index, result)
        })
      }
    })
  }

  private validateCategrafInputInstance(plugin: string, instance: any, index: number, result: ValidationResult): void {
    if (plugin === 'inputs.snmp') {
      if (!instance.agents || !Array.isArray(instance.agents)) {
        result.errors.push(`${plugin}[${index}]: 缺少 agents 配置`)
      }

      if (!instance.version) {
        result.warnings.push(`${plugin}[${index}]: 建议设置 SNMP version`)
      }
    }
  }

  private validateVMAlertGroup(group: any, result: ValidationResult, options?: ConfigValidationOptions): void {
    if (!group.name) {
      result.valid = false
      result.errors.push('告警组缺少 name')
    }

    if (!group.rules || !Array.isArray(group.rules)) {
      result.valid = false
      result.errors.push(`告警组 ${group.name}: 缺少 rules`)
      return
    }

    group.rules.forEach((rule: any, index: number) => {
      this.validateVMAlertRule(rule, index, group.name, result, options)
    })
  }

  private validateVMAlertRule(rule: any, index: number, groupName: string, result: ValidationResult, options?: ConfigValidationOptions): void {
    if (!rule.alert) {
      result.valid = false
      result.errors.push(`组 ${groupName} 规则[${index}]: 缺少 alert 名称`)
    }

    if (!rule.expr) {
      result.valid = false
      result.errors.push(`组 ${groupName} 规则[${index}]: 缺少 expr`)
    } else if (options?.validatePromQL) {
      const promqlResult = this.validatePromQL(rule.expr)
      if (!promqlResult.valid) {
        result.errors.push(`组 ${groupName} 规则[${index}] PromQL: ${promqlResult.errors.join(', ')}`)
      }
    }

    if (rule.for && !this.isValidDuration(rule.for)) {
      result.errors.push(`组 ${groupName} 规则[${index}]: for 时间格式错误`)
    }
  }

  private validateAlertmanagerStructure(config: any, result: ValidationResult): void {
    if (!config.route) {
      result.valid = false
      result.errors.push('缺少 route 配置')
    }

    if (!config.receivers || !Array.isArray(config.receivers)) {
      result.valid = false
      result.errors.push('缺少 receivers 配置')
    }
  }

  private validateRouteConfig(route: any, result: ValidationResult): void {
    if (!route.receiver) {
      result.valid = false
      result.errors.push('route 缺少默认 receiver')
    }

    if (route.group_wait && !this.isValidDuration(route.group_wait)) {
      result.errors.push('route.group_wait 时间格式错误')
    }

    if (route.group_interval && !this.isValidDuration(route.group_interval)) {
      result.errors.push('route.group_interval 时间格式错误')
    }

    if (route.repeat_interval && !this.isValidDuration(route.repeat_interval)) {
      result.errors.push('route.repeat_interval 时间格式错误')
    }
  }

  private validateReceivers(receivers: any[], result: ValidationResult): void {
    if (receivers.length === 0) {
      result.valid = false
      result.errors.push('至少需要一个 receiver')
      return
    }

    receivers.forEach((receiver, index) => {
      if (!receiver.name) {
        result.valid = false
        result.errors.push(`receivers[${index}]: 缺少 name`)
      }

      // 检查是否至少有一种通知方式
      const notificationTypes = ['email_configs', 'webhook_configs', 'slack_configs', 'pagerduty_configs']
      const hasNotification = notificationTypes.some(type => receiver[type] && Array.isArray(receiver[type]) && receiver[type].length > 0)
      
      if (!hasNotification) {
        result.warnings.push(`receivers[${index}]: 没有配置任何通知方式`)
      }
    })
  }

  private validateInhibitRules(inhibitRules: any[], result: ValidationResult): void {
    inhibitRules.forEach((rule, index) => {
      if (!rule.source_match && !rule.source_matchers) {
        result.errors.push(`inhibit_rules[${index}]: 缺少 source_match 或 source_matchers`)
      }

      if (!rule.target_match && !rule.target_matchers) {
        result.errors.push(`inhibit_rules[${index}]: 缺少 target_match 或 target_matchers`)
      }
    })
  }

  private validateRuleFiles(ruleFiles: string[], result: ValidationResult): void {
    if (ruleFiles.length === 0) {
      result.warnings.push('建议配置告警规则文件')
    }

    ruleFiles.forEach((file, index) => {
      if (!file.trim()) {
        result.errors.push(`rule_files[${index}]: 文件路径不能为空`)
      }
    })
  }

  private validateAlertingConfig(alerting: any, result: ValidationResult): void {
    if (!alerting.alertmanagers || !Array.isArray(alerting.alertmanagers)) {
      result.warnings.push('建议配置 alertmanagers')
      return
    }

    alerting.alertmanagers.forEach((am: any, index: number) => {
      if (!am.static_configs && !am.kubernetes_sd_configs && !am.file_sd_configs) {
        result.errors.push(`alerting.alertmanagers[${index}]: 缺少服务发现配置`)
      }
    })
  }

  private addPrometheusRecommendations(config: any, result: ValidationResult): void {
    // 性能建议
    if (config.global?.scrape_interval) {
      const interval = config.global.scrape_interval
      if (interval.includes('s') && parseInt(interval) < 15) {
        result.suggestions.push('建议 scrape_interval 不要小于 15s，以避免性能问题')
      }
    }

    // 安全建议
    if (!config.global?.external_labels) {
      result.suggestions.push('建议配置 external_labels 用于多集群识别')
    }
  }

  private addPromQLPerformanceHints(expr: string, result: ValidationResult): void {
    // 检查可能的性能问题
    if (expr.includes('rate(') && expr.includes('[1m]')) {
      result.suggestions.push('使用 1m 的时间窗口可能会有噪音，建议使用 5m 或更长')
    }

    if (expr.includes('increase(') && !expr.includes('rate(')) {
      result.suggestions.push('通常建议使用 rate() 而不是 increase() 来计算速率')
    }

    if ((expr.match(/sum\s*\(/g) || []).length > 1) {
      result.suggestions.push('多层嵌套的 sum() 可能影响性能，考虑优化查询')
    }
  }

  private addPromQLBestPractices(expr: string, result: ValidationResult): void {
    // 最佳实践建议
    if (expr.includes('==') && expr.includes('1')) {
      result.suggestions.push('比较布尔值时建议使用 > 0 而不是 == 1')
    }

    if (expr.includes('by (') && expr.includes('without (')) {
      result.suggestions.push('同时使用 by 和 without 可能会造成混淆')
    }

    if (!expr.includes('[') && (expr.includes('rate(') || expr.includes('irate('))) {
      result.warnings.push('rate() 和 irate() 函数需要时间窗口参数')
    }
  }
}

// 导出服务实例
export const configValidationService = new ConfigValidationService()