// 增强的告警配置部署服务
// 支持 Prometheus + Alertmanager, VMAlert, 以及混合部署

export interface AlertRule {
  id: string
  name: string
  description: string
  expr: string  // PromQL 表达式
  for: string   // 持续时间
  severity: 'info' | 'warning' | 'critical'
  labels: Record<string, string>
  annotations: Record<string, string>
  category: string
  targetSystem: 'prometheus' | 'vmalert' | 'both'
}

export interface AlertTarget {
  id: string
  ip: string
  name: string
  system: 'prometheus' | 'vmalert' | 'alertmanager'
  port: number
  configPath: string
  reloadEndpoint?: string
  username?: string
  password?: string
  privateKey?: string
}

export interface NotificationConfig {
  receivers: Array<{
    name: string
    type: 'email' | 'webhook' | 'slack' | 'dingtalk' | 'wechat'
    config: Record<string, any>
  }>
  routes: Array<{
    match: Record<string, string>
    receiver: string
    groupWait?: string
    groupInterval?: string
    repeatInterval?: string
  }>
  globalConfig?: Record<string, any>
}

export interface AlertDeploymentResult {
  targetId: string
  targetIp: string
  targetSystem: string
  success: boolean
  deployedRules: Array<{
    ruleName: string
    status: 'deployed' | 'failed'
    error?: string
  }>
  configFiles: Array<{
    path: string
    status: 'uploaded' | 'failed'
    error?: string
  }>
  reloadStatus: {
    attempted: boolean
    success: boolean
    error?: string
  }
  validationResults: Array<{
    rule: string
    valid: boolean
    error?: string
  }>
  message: string
  timestamp: Date
}

export class EnhancedAlertDeploymentService {
  
  // 部署告警规则到多个目标系统
  async deployAlertRules(
    rules: AlertRule[],
    targets: AlertTarget[],
    notificationConfig?: NotificationConfig
  ): Promise<AlertDeploymentResult[]> {
    const results: AlertDeploymentResult[] = []

    for (const target of targets) {
      const result = await this.deployToSingleTarget(rules, target, notificationConfig)
      results.push(result)
    }

    return results
  }

  // 部署到单个目标系统
  private async deployToSingleTarget(
    rules: AlertRule[],
    target: AlertTarget,
    notificationConfig?: NotificationConfig
  ): Promise<AlertDeploymentResult> {
    const result: AlertDeploymentResult = {
      targetId: target.id,
      targetIp: target.ip,
      targetSystem: target.system,
      success: false,
      deployedRules: [],
      configFiles: [],
      reloadStatus: { attempted: false, success: false },
      validationResults: [],
      message: '',
      timestamp: new Date()
    }

    try {
      // 根据目标系统类型生成配置
      const configs = await this.generateConfigsForTarget(rules, target, notificationConfig)
      
      // 验证配置
      const validationResults = await this.validateConfigs(configs, target.system)
      result.validationResults = validationResults

      // 检查是否有验证失败
      const hasValidationErrors = validationResults.some(v => !v.valid)
      if (hasValidationErrors) {
        result.message = '配置验证失败'
        return result
      }

      // 上传配置文件
      for (const [filename, content] of Object.entries(configs)) {
        try {
          const configPath = `${target.configPath}/${filename}`
          await this.uploadConfigFile(target, configPath, content)
          
          result.configFiles.push({
            path: configPath,
            status: 'uploaded'
          })
        } catch (error) {
          result.configFiles.push({
            path: `${target.configPath}/${filename}`,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // 重载配置
      if (target.reloadEndpoint) {
        result.reloadStatus.attempted = true
        try {
          await this.reloadTargetConfig(target)
          result.reloadStatus.success = true
        } catch (error) {
          result.reloadStatus.error = error instanceof Error ? error.message : 'Reload failed'
        }
      }

      // 标记规则部署状态
      rules.forEach(rule => {
        if (rule.targetSystem === target.system || rule.targetSystem === 'both') {
          result.deployedRules.push({
            ruleName: rule.name,
            status: 'deployed'
          })
        }
      })

      result.success = result.configFiles.every(f => f.status === 'uploaded') && 
                     result.reloadStatus.success
      result.message = result.success ? '告警规则部署成功' : '部分配置部署失败'

    } catch (error) {
      result.message = `部署失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return result
  }

  // 根据目标系统生成配置文件
  private async generateConfigsForTarget(
    rules: AlertRule[],
    target: AlertTarget,
    notificationConfig?: NotificationConfig
  ): Promise<Record<string, string>> {
    const configs: Record<string, string> = {}

    if (target.system === 'prometheus') {
      // 生成 Prometheus 规则文件
      configs['alert_rules.yml'] = this.generatePrometheusRules(rules.filter(r => 
        r.targetSystem === 'prometheus' || r.targetSystem === 'both'
      ))

      // 如果有通知配置，生成 Alertmanager 配置
      if (notificationConfig) {
        configs['alertmanager.yml'] = this.generateAlertmanagerConfig(notificationConfig)
      }

    } else if (target.system === 'vmalert') {
      // 生成 VMAlert 规则文件
      configs['vmalert_rules.yml'] = this.generateVMAlertRules(rules.filter(r => 
        r.targetSystem === 'vmalert' || r.targetSystem === 'both'
      ))

    } else if (target.system === 'alertmanager') {
      // 只生成 Alertmanager 配置
      if (notificationConfig) {
        configs['alertmanager.yml'] = this.generateAlertmanagerConfig(notificationConfig)
      }
    }

    return configs
  }

  // 生成 Prometheus 告警规则
  private generatePrometheusRules(rules: AlertRule[]): string {
    const groups = this.groupRulesByCategory(rules)
    
    let yaml = 'groups:\n'
    
    for (const [category, categoryRules] of Object.entries(groups)) {
      yaml += `  - name: ${category}-alerts\n`
      yaml += `    interval: 30s\n`
      yaml += `    rules:\n`
      
      for (const rule of categoryRules) {
        yaml += `      - alert: ${rule.name.replace(/\s+/g, '_')}\n`
        yaml += `        expr: ${rule.expr}\n`
        yaml += `        for: ${rule.for}\n`
        yaml += `        labels:\n`
        yaml += `          severity: ${rule.severity}\n`
        
        for (const [key, value] of Object.entries(rule.labels)) {
          yaml += `          ${key}: ${value}\n`
        }
        
        yaml += `        annotations:\n`
        yaml += `          summary: "${rule.name}"\n`
        yaml += `          description: "${rule.description}"\n`
        
        for (const [key, value] of Object.entries(rule.annotations)) {
          yaml += `          ${key}: "${value}"\n`
        }
        
        yaml += '\n'
      }
    }
    
    return yaml
  }

  // 生成 VMAlert 告警规则
  private generateVMAlertRules(rules: AlertRule[]): string {
    const groups = this.groupRulesByCategory(rules)
    
    let yaml = 'groups:\n'
    
    for (const [category, categoryRules] of Object.entries(groups)) {
      yaml += `  - name: ${category}-alerts\n`
      yaml += `    interval: 30s\n`
      yaml += `    concurrency: 2\n`
      yaml += `    rules:\n`
      
      for (const rule of categoryRules) {
        yaml += `      - alert: ${rule.name.replace(/\s+/g, '_')}\n`
        yaml += `        expr: ${rule.expr}\n`
        yaml += `        for: ${rule.for}\n`
        yaml += `        keep_firing_for: 5m\n`
        yaml += `        labels:\n`
        yaml += `          severity: ${rule.severity}\n`
        yaml += `          category: ${rule.category}\n`
        
        for (const [key, value] of Object.entries(rule.labels)) {
          yaml += `          ${key}: ${value}\n`
        }
        
        yaml += `        annotations:\n`
        yaml += `          summary: "${rule.name}"\n`
        yaml += `          description: "${rule.description}"\n`
        yaml += `          runbook_url: "https://runbooks.example.com/${rule.id}"\n`
        
        for (const [key, value] of Object.entries(rule.annotations)) {
          yaml += `          ${key}: "${value}"\n`
        }
        
        yaml += '\n'
      }
    }
    
    return yaml
  }

  // 生成 Alertmanager 配置
  private generateAlertmanagerConfig(notificationConfig: NotificationConfig): string {
    let yaml = ''

    // 全局配置
    if (notificationConfig.globalConfig) {
      yaml += 'global:\n'
      for (const [key, value] of Object.entries(notificationConfig.globalConfig)) {
        yaml += `  ${key}: ${typeof value === 'string' ? `'${value}'` : value}\n`
      }
      yaml += '\n'
    }

    // 模板
    yaml += 'templates:\n'
    yaml += '  - "/etc/alertmanager/templates/*.tmpl"\n\n'

    // 路由配置
    yaml += 'route:\n'
    yaml += '  group_by: [\'alertname\', \'cluster\', \'service\']\n'
    yaml += '  group_wait: 10s\n'
    yaml += '  group_interval: 10s\n'
    yaml += '  repeat_interval: 1h\n'
    yaml += '  receiver: \'default\'\n'

    if (notificationConfig.routes && notificationConfig.routes.length > 0) {
      yaml += '  routes:\n'
      for (const route of notificationConfig.routes) {
        yaml += '    - match:\n'
        for (const [key, value] of Object.entries(route.match)) {
          yaml += `        ${key}: ${value}\n`
        }
        yaml += `      receiver: ${route.receiver}\n`
        if (route.groupWait) yaml += `      group_wait: ${route.groupWait}\n`
        if (route.groupInterval) yaml += `      group_interval: ${route.groupInterval}\n`
        if (route.repeatInterval) yaml += `      repeat_interval: ${route.repeatInterval}\n`
      }
    }

    yaml += '\n'

    // 接收器配置
    yaml += 'receivers:\n'
    for (const receiver of notificationConfig.receivers) {
      yaml += `  - name: '${receiver.name}'\n`
      
      if (receiver.type === 'email') {
        yaml += '    email_configs:\n'
        yaml += `      - to: '${receiver.config.to}'\n`
        yaml += `        subject: '${receiver.config.subject || '[Alert] {{ .GroupLabels.alertname }}'}'\n`
        yaml += `        body: |\n`
        yaml += `          ${receiver.config.body || '{{ range .Alerts }}Alert: {{ .Annotations.summary }}{{ end }}'}\n`
        
      } else if (receiver.type === 'webhook') {
        yaml += '    webhook_configs:\n'
        yaml += `      - url: '${receiver.config.url}'\n`
        yaml += `        send_resolved: ${receiver.config.send_resolved || true}\n`
        if (receiver.config.http_config) {
          yaml += '        http_config:\n'
          for (const [key, value] of Object.entries(receiver.config.http_config)) {
            yaml += `          ${key}: ${value}\n`
          }
        }
        
      } else if (receiver.type === 'slack') {
        yaml += '    slack_configs:\n'
        yaml += `      - api_url: '${receiver.config.api_url}'\n`
        yaml += `        channel: '${receiver.config.channel}'\n`
        yaml += `        title: '${receiver.config.title || 'Alert Notification'}'\n`
        yaml += `        text: '${receiver.config.text || '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'}'\n`
        
      } else if (receiver.type === 'dingtalk') {
        yaml += '    webhook_configs:\n'
        yaml += `      - url: '${receiver.config.url}'\n`
        yaml += '        send_resolved: true\n'
      }
    }

    // 抑制规则
    yaml += '\ninhibit_rules:\n'
    yaml += '  - source_match:\n'
    yaml += '      severity: \'critical\'\n'
    yaml += '    target_match:\n'
    yaml += '      severity: \'warning\'\n'
    yaml += '    equal: [\'alertname\', \'instance\']\n'

    return yaml
  }

  // 按类别分组规则
  private groupRulesByCategory(rules: AlertRule[]): Record<string, AlertRule[]> {
    const groups: Record<string, AlertRule[]> = {}
    
    for (const rule of rules) {
      const category = rule.category || 'general'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(rule)
    }
    
    return groups
  }

  // 验证配置
  private async validateConfigs(
    configs: Record<string, string>,
    targetSystem: string
  ): Promise<Array<{rule: string, valid: boolean, error?: string}>> {
    const results = []

    for (const [filename, content] of Object.entries(configs)) {
      try {
        if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
          // 验证 YAML 语法
          await this.validateYAML(content)
          
          // 验证 PromQL 表达式（如果是告警规则文件）
          if (filename.includes('rules') || filename.includes('alert')) {
            await this.validatePromQLInRules(content)
          }
        }
        
        results.push({ rule: filename, valid: true })
      } catch (error) {
        results.push({
          rule: filename,
          valid: false,
          error: error instanceof Error ? error.message : 'Validation failed'
        })
      }
    }

    return results
  }

  // 验证 YAML 语法
  private async validateYAML(content: string): Promise<void> {
    try {
      // 简单的 YAML 语法检查
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.trim() && !line.startsWith('#')) {
          // 检查缩进
          const indent = line.length - line.trimStart().length
          if (indent % 2 !== 0) {
            throw new Error(`第 ${i + 1} 行缩进错误`)
          }
        }
      }
    } catch (error) {
      throw new Error(`YAML 语法错误: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 验证规则中的 PromQL 表达式
  private async validatePromQLInRules(content: string): Promise<void> {
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('expr:')) {
        const expr = line.substring(5).trim()
        try {
          await this.validatePromQL(expr)
        } catch (error) {
          throw new Error(`第 ${i + 1} 行 PromQL 表达式错误: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }
  }

  // 验证 PromQL 表达式
  private async validatePromQL(expr: string): Promise<void> {
    // 基本的 PromQL 语法检查
    if (!expr || expr.trim() === '') {
      throw new Error('PromQL 表达式不能为空')
    }

    // 检查括号匹配
    const openBrackets = (expr.match(/\(/g) || []).length
    const closeBrackets = (expr.match(/\)/g) || []).length
    if (openBrackets !== closeBrackets) {
      throw new Error('括号不匹配')
    }

    // 检查基本的 PromQL 函数
    const validFunctions = [
      'rate', 'irate', 'increase', 'sum', 'avg', 'max', 'min', 'count',
      'by', 'without', 'group_left', 'group_right', 'on', 'ignoring',
      'and', 'or', 'unless', 'bool'
    ]

    // 简单的函数检查
    const functionRegex = /(\w+)\s*\(/g
    let match
    while ((match = functionRegex.exec(expr)) !== null) {
      const func = match[1]
      if (!validFunctions.includes(func) && !expr.includes(`${func}{`)) {
        // 如果不是已知函数且不是指标名称，可能有问题
        console.warn(`未知函数或指标: ${func}`)
      }
    }
  }

  // 上传配置文件到目标主机
  private async uploadConfigFile(target: AlertTarget, remotePath: string, content: string): Promise<void> {
    try {
      const response = await fetch('/api/ssh/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: target.ip,
          port: 22,
          username: target.username,
          password: target.password,
          privateKey: target.privateKey,
          remotePath,
          content
        })
      })

      if (!response.ok) {
        throw new Error(`文件上传失败: ${await response.text()}`)
      }
    } catch (error) {
      throw new Error(`上传配置文件到 ${target.ip}:${remotePath} 失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 重载目标系统配置
  private async reloadTargetConfig(target: AlertTarget): Promise<void> {
    if (!target.reloadEndpoint) {
      throw new Error('未配置重载端点')
    }

    try {
      const reloadUrl = `http://${target.ip}:${target.port}${target.reloadEndpoint}`
      const response = await fetch(reloadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      })

      if (!response.ok) {
        throw new Error(`重载失败: HTTP ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      throw new Error(`重载 ${target.system} 配置失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 批量部署到多种告警系统
  async batchDeployToMixedSystems(
    rules: AlertRule[],
    prometheusTargets: AlertTarget[],
    vmalertTargets: AlertTarget[],
    alertmanagerTargets: AlertTarget[],
    notificationConfig?: NotificationConfig
  ): Promise<{
    prometheus: AlertDeploymentResult[]
    vmalert: AlertDeploymentResult[]
    alertmanager: AlertDeploymentResult[]
    summary: {
      totalTargets: number
      successfulDeployments: number
      failedDeployments: number
      partialDeployments: number
    }
  }> {
    const results = {
      prometheus: [] as AlertDeploymentResult[],
      vmalert: [] as AlertDeploymentResult[],
      alertmanager: [] as AlertDeploymentResult[],
      summary: {
        totalTargets: 0,
        successfulDeployments: 0,
        failedDeployments: 0,
        partialDeployments: 0
      }
    }

    // 部署到 Prometheus
    if (prometheusTargets.length > 0) {
      const prometheusResults = await this.deployAlertRules(
        rules.filter(r => r.targetSystem === 'prometheus' || r.targetSystem === 'both'),
        prometheusTargets,
        notificationConfig
      )
      results.prometheus = prometheusResults
    }

    // 部署到 VMAlert
    if (vmalertTargets.length > 0) {
      const vmalertResults = await this.deployAlertRules(
        rules.filter(r => r.targetSystem === 'vmalert' || r.targetSystem === 'both'),
        vmalertTargets
      )
      results.vmalert = vmalertResults
    }

    // 部署到 Alertmanager
    if (alertmanagerTargets.length > 0 && notificationConfig) {
      const alertmanagerResults = await this.deployAlertRules(
        [], // Alertmanager 不需要告警规则
        alertmanagerTargets,
        notificationConfig
      )
      results.alertmanager = alertmanagerResults
    }

    // 计算统计信息
    const allResults = [...results.prometheus, ...results.vmalert, ...results.alertmanager]
    results.summary.totalTargets = allResults.length
    results.summary.successfulDeployments = allResults.filter(r => r.success).length
    results.summary.failedDeployments = allResults.filter(r => !r.success).length
    results.summary.partialDeployments = allResults.filter(r => 
      r.configFiles.some(f => f.status === 'uploaded') && r.configFiles.some(f => f.status === 'failed')
    ).length

    return results
  }
}

// 预定义的告警规则模板
export const PREDEFINED_ALERT_RULES: AlertRule[] = [
  {
    id: 'host-down',
    name: 'Host Down',
    description: '主机离线超过1分钟',
    expr: 'up == 0',
    for: '1m',
    severity: 'critical',
    labels: { team: 'infrastructure' },
    annotations: { 
      summary: 'Host {{ $labels.instance }} is down',
      description: 'Host {{ $labels.instance }} has been down for more than 1 minute'
    },
    category: 'system',
    targetSystem: 'both'
  },
  {
    id: 'high-cpu',
    name: 'High CPU Usage',
    description: 'CPU使用率超过80%',
    expr: '100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80',
    for: '5m',
    severity: 'warning',
    labels: { team: 'infrastructure' },
    annotations: {
      summary: 'High CPU usage on {{ $labels.instance }}',
      description: 'CPU usage is above 80% for more than 5 minutes'
    },
    category: 'system',
    targetSystem: 'both'
  },
  {
    id: 'snmp-device-down',
    name: 'SNMP Device Down',
    description: 'SNMP设备无法访问',
    expr: 'up{job="snmp-devices"} == 0',
    for: '2m',
    severity: 'critical',
    labels: { team: 'network' },
    annotations: {
      summary: 'SNMP device {{ $labels.instance }} is unreachable',
      description: 'SNMP device {{ $labels.instance }} has been unreachable for more than 2 minutes'
    },
    category: 'network',
    targetSystem: 'both'
  },
  {
    id: 'interface-down',
    name: 'Network Interface Down',
    description: '网络接口状态异常',
    expr: 'ifOperStatus != 1',
    for: '1m',
    severity: 'warning',
    labels: { team: 'network' },
    annotations: {
      summary: 'Interface down on {{ $labels.instance }}',
      description: 'Interface {{ $labels.ifDescr }} is down'
    },
    category: 'network',
    targetSystem: 'both'
  }
]

// 导出服务实例
export const enhancedAlertDeploymentService = new EnhancedAlertDeploymentService()