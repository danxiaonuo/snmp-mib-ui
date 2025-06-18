// 配置合规性检查和安全扫描系统
import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'
import crypto from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface ComplianceRule {
  id: string
  name: string
  description: string
  category: 'security' | 'performance' | 'reliability' | 'best_practice'
  severity: 'info' | 'warning' | 'critical'
  configType: 'snmp_exporter' | 'categraf' | 'prometheus' | 'vmalert' | 'all'
  rule: ComplianceCheck
  remediation: {
    description: string
    automaticFix?: boolean
    fixScript?: string
    manualSteps?: string[]
  }
  references: string[]
  tags: string[]
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ComplianceCheck {
  type: 'path_exists' | 'path_not_exists' | 'value_equals' | 'value_not_equals' | 
        'value_greater_than' | 'value_less_than' | 'value_in_range' | 'regex_match' | 
        'regex_not_match' | 'custom_function' | 'file_permission' | 'credential_check'
  path?: string
  expectedValue?: any
  minValue?: number
  maxValue?: number
  pattern?: string
  permission?: string
  customFunction?: string
  parameters?: Record<string, any>
}

export interface ComplianceResult {
  ruleId: string
  ruleName: string
  status: 'pass' | 'fail' | 'warning' | 'not_applicable'
  severity: 'info' | 'warning' | 'critical'
  category: string
  message: string
  details?: string
  actualValue?: any
  expectedValue?: any
  fixAvailable: boolean
  fixApplied?: boolean
  timestamp: Date
}

export interface SecurityVulnerability {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  cve?: string
  category: 'authentication' | 'authorization' | 'encryption' | 'injection' | 'exposure' | 'configuration'
  affectedConfig: string
  location: string
  impact: string
  exploitability: 'low' | 'medium' | 'high'
  remediation: {
    effort: 'low' | 'medium' | 'high'
    description: string
    steps: string[]
    references: string[]
  }
  detectedAt: Date
}

export interface ComplianceReport {
  id: string
  configPath: string
  configType: string
  scanDate: Date
  duration: number
  summary: {
    totalRules: number
    passed: number
    failed: number
    warnings: number
    notApplicable: number
    score: number
  }
  results: ComplianceResult[]
  vulnerabilities: SecurityVulnerability[]
  recommendations: string[]
  fixable: number
  autoFixApplied: number
}

export interface ComplianceProfile {
  id: string
  name: string
  description: string
  version: string
  targetEnvironment: 'development' | 'staging' | 'production'
  rules: string[] // rule IDs
  excludedRules: string[]
  customRules: ComplianceRule[]
  settings: {
    autoFix: boolean
    stopOnCritical: boolean
    parallelExecution: boolean
    maxParallelJobs: number
  }
  createdAt: Date
  updatedAt: Date
}

export class ConfigComplianceScanner {
  private rulesPath: string
  private profilesPath: string
  private reportsPath: string
  private rules: Map<string, ComplianceRule> = new Map()
  private profiles: Map<string, ComplianceProfile> = new Map()
  private customFunctions: Map<string, Function> = new Map()

  constructor(basePath: string = '/etc/snmp-configs/compliance') {
    this.rulesPath = path.join(basePath, 'rules')
    this.profilesPath = path.join(basePath, 'profiles')
    this.reportsPath = path.join(basePath, 'reports')
    this.initializeStorage()
    this.initializeDefaultRules()
    this.registerCustomFunctions()
  }

  // 初始化存储
  private async initializeStorage() {
    try {
      await fs.mkdir(this.rulesPath, { recursive: true })
      await fs.mkdir(this.profilesPath, { recursive: true })
      await fs.mkdir(this.reportsPath, { recursive: true })
    } catch (error) {
      console.error('Failed to initialize compliance storage:', error)
    }
  }

  // 初始化默认规则
  private initializeDefaultRules() {
    const defaultRules: ComplianceRule[] = [
      // SNMP安全规则
      {
        id: 'snmp_weak_community',
        name: 'SNMP弱社区字符串检查',
        description: '检查是否使用了弱的SNMP社区字符串',
        category: 'security',
        severity: 'critical',
        configType: 'snmp_exporter',
        rule: {
          type: 'custom_function',
          customFunction: 'checkWeakSNMPCommunity'
        },
        remediation: {
          description: '使用强密码社区字符串或升级到SNMPv3',
          automaticFix: false,
          manualSteps: [
            '更改默认社区字符串(public/private)',
            '使用复杂的社区字符串',
            '考虑升级到SNMPv3以获得更好的安全性'
          ]
        },
        references: [
          'RFC 3414 - User-based Security Model (USM) for version 3 of the Simple Network Management Protocol (SNMPv3)',
          'NIST SP 800-53 - Security Controls for Federal Information Systems'
        ],
        tags: ['snmp', 'authentication', 'security'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'snmp_version_check',
        name: 'SNMP版本安全检查',
        description: '检查是否使用了安全的SNMP版本',
        category: 'security',
        severity: 'warning',
        configType: 'snmp_exporter',
        rule: {
          type: 'custom_function',
          customFunction: 'checkSNMPVersion'
        },
        remediation: {
          description: '使用SNMPv3以获得加密和认证功能',
          automaticFix: false,
          manualSteps: [
            '配置SNMPv3用户',
            '启用认证和加密',
            '禁用SNMPv1和v2c'
          ]
        },
        references: ['RFC 3411 - An Architecture for Describing Simple Network Management Protocol (SNMP) Management Frameworks'],
        tags: ['snmp', 'version', 'security'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Prometheus安全规则
      {
        id: 'prometheus_external_labels',
        name: 'Prometheus外部标签配置',
        description: '检查是否正确配置了外部标签',
        category: 'best_practice',
        severity: 'warning',
        configType: 'prometheus',
        rule: {
          type: 'path_exists',
          path: 'global.external_labels'
        },
        remediation: {
          description: '配置外部标签以标识Prometheus实例',
          automaticFix: true,
          fixScript: 'addExternalLabels'
        },
        references: ['Prometheus Configuration Documentation'],
        tags: ['prometheus', 'configuration', 'labels'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'prometheus_scrape_interval',
        name: 'Prometheus抓取间隔检查',
        description: '检查抓取间隔是否在合理范围内',
        category: 'performance',
        severity: 'warning',
        configType: 'prometheus',
        rule: {
          type: 'value_in_range',
          path: 'global.scrape_interval',
          minValue: 10,
          maxValue: 300
        },
        remediation: {
          description: '调整抓取间隔到合理范围(10s-300s)',
          automaticFix: true,
          fixScript: 'adjustScrapeInterval'
        },
        references: ['Prometheus Performance Tuning Guide'],
        tags: ['prometheus', 'performance', 'scraping'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 通用安全规则
      {
        id: 'hardcoded_credentials',
        name: '硬编码凭据检查',
        description: '检查配置文件中是否包含硬编码的密码或密钥',
        category: 'security',
        severity: 'critical',
        configType: 'all',
        rule: {
          type: 'custom_function',
          customFunction: 'checkHardcodedCredentials'
        },
        remediation: {
          description: '使用环境变量或密钥管理系统存储敏感信息',
          automaticFix: false,
          manualSteps: [
            '识别硬编码的密码和密钥',
            '使用环境变量替换',
            '配置密钥管理系统',
            '启用配置文件加密'
          ]
        },
        references: [
          'OWASP Top 10 - A07:2021 – Identification and Authentication Failures',
          'CIS Controls v8 - Control 3: Data Protection'
        ],
        tags: ['credentials', 'hardcoded', 'security'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'file_permissions',
        name: '配置文件权限检查',
        description: '检查配置文件是否具有适当的文件权限',
        category: 'security',
        severity: 'warning',
        configType: 'all',
        rule: {
          type: 'file_permission',
          permission: '644'
        },
        remediation: {
          description: '设置适当的文件权限以防止未授权访问',
          automaticFix: true,
          fixScript: 'fixFilePermissions'
        },
        references: ['Linux File Permissions Best Practices'],
        tags: ['permissions', 'filesystem', 'security'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 可靠性规则
      {
        id: 'backup_configuration',
        name: '备份配置检查',
        description: '检查是否启用了配置备份',
        category: 'reliability',
        severity: 'warning',
        configType: 'all',
        rule: {
          type: 'custom_function',
          customFunction: 'checkBackupConfiguration'
        },
        remediation: {
          description: '启用自动配置备份',
          automaticFix: false,
          manualSteps: [
            '配置定期备份任务',
            '设置备份保留策略',
            '测试备份恢复流程'
          ]
        },
        references: ['Configuration Management Best Practices'],
        tags: ['backup', 'reliability', 'disaster-recovery'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 性能规则
      {
        id: 'resource_limits',
        name: '资源限制配置',
        description: '检查是否配置了适当的资源限制',
        category: 'performance',
        severity: 'warning',
        configType: 'all',
        rule: {
          type: 'custom_function',
          customFunction: 'checkResourceLimits'
        },
        remediation: {
          description: '配置内存和CPU限制以防止资源耗尽',
          automaticFix: false,
          manualSteps: [
            '设置内存限制',
            '配置CPU限制',
            '启用资源监控'
          ]
        },
        references: ['Resource Management Best Practices'],
        tags: ['resources', 'performance', 'limits'],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule)
    })
  }

  // 注册自定义函数
  private registerCustomFunctions() {
    this.customFunctions.set('checkWeakSNMPCommunity', (config: any) => {
      const weakCommunities = ['public', 'private', 'community', 'default', 'admin', 'password', '123456']
      
      const findWeakCommunities = (obj: any, path: string = ''): ComplianceResult[] => {
        const results: ComplianceResult[] = []
        
        if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key
            
            if (key.toLowerCase().includes('community') && typeof value === 'string') {
              if (weakCommunities.includes(value.toLowerCase())) {
                results.push({
                  ruleId: 'snmp_weak_community',
                  ruleName: 'SNMP弱社区字符串检查',
                  status: 'fail',
                  severity: 'critical',
                  category: 'security',
                  message: `发现弱SNMP社区字符串: ${value}`,
                  details: `在路径 ${currentPath} 发现弱社区字符串`,
                  actualValue: value,
                  expectedValue: '强密码社区字符串',
                  fixAvailable: false,
                  timestamp: new Date()
                })
              }
            }
            
            if (typeof value === 'object') {
              results.push(...findWeakCommunities(value, currentPath))
            }
          }
        }
        
        return results
      }
      
      return findWeakCommunities(config)
    })

    this.customFunctions.set('checkSNMPVersion', (config: any) => {
      const results: ComplianceResult[] = []
      
      const checkVersions = (obj: any, path: string = '') => {
        if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key
            
            if (key.toLowerCase().includes('version') && (value === '1' || value === '2c')) {
              results.push({
                ruleId: 'snmp_version_check',
                ruleName: 'SNMP版本安全检查',
                status: 'warning',
                severity: 'warning',
                category: 'security',
                message: `使用了不安全的SNMP版本: ${value}`,
                details: `在路径 ${currentPath} 发现SNMP v${value}`,
                actualValue: value,
                expectedValue: '3',
                fixAvailable: false,
                timestamp: new Date()
              })
            }
            
            if (typeof value === 'object') {
              checkVersions(value, currentPath)
            }
          }
        }
      }
      
      checkVersions(config)
      return results
    })

    this.customFunctions.set('checkHardcodedCredentials', (config: any, configContent: string) => {
      const results: ComplianceResult[] = []
      
      // 检查常见的密码模式
      const passwordPatterns = [
        /password\s*[:=]\s*["']([^"'\s]+)["']/gi,
        /passwd\s*[:=]\s*["']([^"'\s]+)["']/gi,
        /secret\s*[:=]\s*["']([^"'\s]+)["']/gi,
        /key\s*[:=]\s*["']([^"'\s]+)["']/gi,
        /token\s*[:=]\s*["']([^"'\s]+)["']/gi
      ]
      
      for (const pattern of passwordPatterns) {
        let match
        while ((match = pattern.exec(configContent)) !== null) {
          const credential = match[1]
          
          // 排除明显的占位符
          if (!credential.includes('{{') && !credential.includes('$') && credential.length > 3) {
            results.push({
              ruleId: 'hardcoded_credentials',
              ruleName: '硬编码凭据检查',
              status: 'fail',
              severity: 'critical',
              category: 'security',
              message: '发现硬编码的凭据',
              details: `发现可能的硬编码凭据: ${credential.substring(0, 3)}***`,
              fixAvailable: false,
              timestamp: new Date()
            })
          }
        }
      }
      
      return results
    })

    this.customFunctions.set('checkBackupConfiguration', (config: any) => {
      const results: ComplianceResult[] = []
      
      // 检查是否有备份相关的配置
      const hasBackupConfig = this.searchInObject(config, ['backup', 'backup_interval', 'backup_enabled', 'backup_path'])
      
      if (!hasBackupConfig) {
        results.push({
          ruleId: 'backup_configuration',
          ruleName: '备份配置检查',
          status: 'warning',
          severity: 'warning',
          category: 'reliability',
          message: '未发现备份配置',
          details: '建议配置自动备份以提高可靠性',
          fixAvailable: false,
          timestamp: new Date()
        })
      }
      
      return results
    })

    this.customFunctions.set('checkResourceLimits', (config: any) => {
      const results: ComplianceResult[] = []
      
      // 检查是否有资源限制配置
      const hasResourceLimits = this.searchInObject(config, [
        'memory_limit', 'max_memory', 'cpu_limit', 'max_cpu',
        'ulimit', 'limits', 'resources'
      ])
      
      if (!hasResourceLimits) {
        results.push({
          ruleId: 'resource_limits',
          ruleName: '资源限制配置',
          status: 'warning',
          severity: 'warning',
          category: 'performance',
          message: '未发现资源限制配置',
          details: '建议配置资源限制以防止资源耗尽',
          fixAvailable: false,
          timestamp: new Date()
        })
      }
      
      return results
    })
  }

  // 在对象中搜索键
  private searchInObject(obj: any, keys: string[]): boolean {
    if (typeof obj !== 'object' || obj === null) return false
    
    for (const [key, value] of Object.entries(obj)) {
      if (keys.some(searchKey => key.toLowerCase().includes(searchKey.toLowerCase()))) {
        return true
      }
      
      if (typeof value === 'object' && this.searchInObject(value, keys)) {
        return true
      }
    }
    
    return false
  }

  // 扫描配置文件
  async scanConfiguration(
    configPath: string,
    profileId?: string,
    options: {
      autoFix?: boolean
      stopOnCritical?: boolean
      parallel?: boolean
    } = {}
  ): Promise<ComplianceReport> {
    const startTime = Date.now()
    
    // 读取配置文件
    const configContent = await fs.readFile(configPath, 'utf8')
    const configType = this.detectConfigType(configPath)
    
    let config: any
    try {
      if (configType === 'snmp_exporter' || configType === 'prometheus' || configType === 'vmalert') {
        config = yaml.load(configContent)
      } else if (configType === 'categraf') {
        // 简单的TOML解析
        config = this.parseToml(configContent)
      } else {
        config = JSON.parse(configContent)
      }
    } catch (error) {
      throw new Error(`Failed to parse configuration file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // 获取要应用的规则
    const rulesToApply = this.getRulesToApply(configType, profileId)
    
    const report: ComplianceReport = {
      id: `scan_${Date.now()}`,
      configPath,
      configType,
      scanDate: new Date(),
      duration: 0,
      summary: {
        totalRules: rulesToApply.length,
        passed: 0,
        failed: 0,
        warnings: 0,
        notApplicable: 0,
        score: 0
      },
      results: [],
      vulnerabilities: [],
      recommendations: [],
      fixable: 0,
      autoFixApplied: 0
    }

    // 执行规则检查
    if (options.parallel) {
      const rulePromises = rulesToApply.map(rule => this.executeRule(rule, config, configContent, configPath))
      const ruleResults = await Promise.all(rulePromises)
      
      for (const results of ruleResults) {
        report.results.push(...results)
      }
    } else {
      for (const rule of rulesToApply) {
        const results = await this.executeRule(rule, config, configContent, configPath)
        report.results.push(...results)
        
        // 如果设置了在关键问题时停止
        if (options.stopOnCritical && results.some(r => r.severity === 'critical' && r.status === 'fail')) {
          break
        }
      }
    }

    // 检测安全漏洞
    report.vulnerabilities = await this.detectSecurityVulnerabilities(config, configContent, configType)

    // 应用自动修复
    if (options.autoFix) {
      report.autoFixApplied = await this.applyAutoFixes(report.results, configPath, config)
    }

    // 计算统计信息
    this.calculateReportSummary(report)

    // 生成建议
    report.recommendations = this.generateRecommendations(report)

    report.duration = Date.now() - startTime

    // 保存报告
    await this.saveReport(report)

    return report
  }

  // 检测配置文件类型
  private detectConfigType(configPath: string): string {
    const extension = path.extname(configPath).toLowerCase()
    const filename = path.basename(configPath).toLowerCase()
    
    if (filename.includes('snmp') && (extension === '.yml' || extension === '.yaml')) {
      return 'snmp_exporter'
    }
    
    if (extension === '.toml' || filename.includes('categraf')) {
      return 'categraf'
    }
    
    if (filename.includes('prometheus') && (extension === '.yml' || extension === '.yaml')) {
      return 'prometheus'
    }
    
    if (filename.includes('vmalert') || filename.includes('alert')) {
      return 'vmalert'
    }
    
    return 'unknown'
  }

  // 简单的TOML解析器
  private parseToml(content: string): any {
    const result: any = {}
    const lines = content.split('\n')
    let currentSection = result
    let currentSectionName = ''
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      if (!trimmed || trimmed.startsWith('#')) continue
      
      // 检查节
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSectionName = trimmed.slice(1, -1)
        currentSection = result[currentSectionName] = {}
        continue
      }
      
      // 解析键值对
      const equalIndex = trimmed.indexOf('=')
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim()
        let value = trimmed.substring(equalIndex + 1).trim()
        
        // 移除引号
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        
        // 尝试解析为数字或布尔值
        if (value === 'true') value = true
        else if (value === 'false') value = false
        else if (/^\d+$/.test(value)) value = parseInt(value)
        else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value)
        
        currentSection[key] = value
      }
    }
    
    return result
  }

  // 获取要应用的规则
  private getRulesToApply(configType: string, profileId?: string): ComplianceRule[] {
    let rules = Array.from(this.rules.values()).filter(rule => 
      rule.enabled && (rule.configType === configType || rule.configType === 'all')
    )
    
    if (profileId) {
      const profile = this.profiles.get(profileId)
      if (profile) {
        // 应用配置文件的规则过滤
        rules = rules.filter(rule => 
          profile.rules.includes(rule.id) && !profile.excludedRules.includes(rule.id)
        )
        
        // 添加自定义规则
        rules.push(...profile.customRules.filter(rule => rule.enabled))
      }
    }
    
    return rules
  }

  // 执行规则
  private async executeRule(
    rule: ComplianceRule,
    config: any,
    configContent: string,
    configPath: string
  ): Promise<ComplianceResult[]> {
    try {
      switch (rule.rule.type) {
        case 'path_exists':
          return this.checkPathExists(rule, config)
        case 'path_not_exists':
          return this.checkPathNotExists(rule, config)
        case 'value_equals':
          return this.checkValueEquals(rule, config)
        case 'value_not_equals':
          return this.checkValueNotEquals(rule, config)
        case 'value_greater_than':
          return this.checkValueGreaterThan(rule, config)
        case 'value_less_than':
          return this.checkValueLessThan(rule, config)
        case 'value_in_range':
          return this.checkValueInRange(rule, config)
        case 'regex_match':
          return this.checkRegexMatch(rule, configContent)
        case 'regex_not_match':
          return this.checkRegexNotMatch(rule, configContent)
        case 'file_permission':
          return await this.checkFilePermission(rule, configPath)
        case 'custom_function':
          return this.executeCustomFunction(rule, config, configContent)
        default:
          return [{
            ruleId: rule.id,
            ruleName: rule.name,
            status: 'not_applicable',
            severity: rule.severity,
            category: rule.category,
            message: '未知的规则类型',
            fixAvailable: false,
            timestamp: new Date()
          }]
      }
    } catch (error) {
      return [{
        ruleId: rule.id,
        ruleName: rule.name,
        status: 'fail',
        severity: 'warning',
        category: rule.category,
        message: `规则执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fixAvailable: false,
        timestamp: new Date()
      }]
    }
  }

  // 检查路径是否存在
  private checkPathExists(rule: ComplianceRule, config: any): ComplianceResult[] {
    const path = rule.rule.path!
    const value = this.getValueByPath(config, path)
    
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      status: value !== undefined ? 'pass' : 'fail',
      severity: rule.severity,
      category: rule.category,
      message: value !== undefined ? '路径存在' : `路径 ${path} 不存在`,
      actualValue: value,
      fixAvailable: rule.remediation.automaticFix || false,
      timestamp: new Date()
    }]
  }

  // 检查路径不存在
  private checkPathNotExists(rule: ComplianceRule, config: any): ComplianceResult[] {
    const path = rule.rule.path!
    const value = this.getValueByPath(config, path)
    
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      status: value === undefined ? 'pass' : 'fail',
      severity: rule.severity,
      category: rule.category,
      message: value === undefined ? '路径不存在(符合要求)' : `路径 ${path} 存在但不应该存在`,
      actualValue: value,
      fixAvailable: rule.remediation.automaticFix || false,
      timestamp: new Date()
    }]
  }

  // 检查值相等
  private checkValueEquals(rule: ComplianceRule, config: any): ComplianceResult[] {
    const path = rule.rule.path!
    const expectedValue = rule.rule.expectedValue
    const actualValue = this.getValueByPath(config, path)
    
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      status: actualValue === expectedValue ? 'pass' : 'fail',
      severity: rule.severity,
      category: rule.category,
      message: actualValue === expectedValue ? '值匹配' : `值不匹配: 期望 ${expectedValue}, 实际 ${actualValue}`,
      actualValue,
      expectedValue,
      fixAvailable: rule.remediation.automaticFix || false,
      timestamp: new Date()
    }]
  }

  // 检查值不相等
  private checkValueNotEquals(rule: ComplianceRule, config: any): ComplianceResult[] {
    const path = rule.rule.path!
    const expectedValue = rule.rule.expectedValue
    const actualValue = this.getValueByPath(config, path)
    
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      status: actualValue !== expectedValue ? 'pass' : 'fail',
      severity: rule.severity,
      category: rule.category,
      message: actualValue !== expectedValue ? '值不相等(符合要求)' : `值相等但不应该相等: ${actualValue}`,
      actualValue,
      expectedValue,
      fixAvailable: rule.remediation.automaticFix || false,
      timestamp: new Date()
    }]
  }

  // 检查值大于
  private checkValueGreaterThan(rule: ComplianceRule, config: any): ComplianceResult[] {
    const path = rule.rule.path!
    const threshold = rule.rule.minValue!
    const actualValue = this.getValueByPath(config, path)
    
    if (typeof actualValue !== 'number') {
      return [{
        ruleId: rule.id,
        ruleName: rule.name,
        status: 'fail',
        severity: rule.severity,
        category: rule.category,
        message: `值不是数字: ${actualValue}`,
        actualValue,
        fixAvailable: false,
        timestamp: new Date()
      }]
    }
    
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      status: actualValue > threshold ? 'pass' : 'fail',
      severity: rule.severity,
      category: rule.category,
      message: actualValue > threshold ? '值在范围内' : `值 ${actualValue} 不大于 ${threshold}`,
      actualValue,
      expectedValue: `> ${threshold}`,
      fixAvailable: rule.remediation.automaticFix || false,
      timestamp: new Date()
    }]
  }

  // 检查值小于
  private checkValueLessThan(rule: ComplianceRule, config: any): ComplianceResult[] {
    const path = rule.rule.path!
    const threshold = rule.rule.maxValue!
    const actualValue = this.getValueByPath(config, path)
    
    if (typeof actualValue !== 'number') {
      return [{
        ruleId: rule.id,
        ruleName: rule.name,
        status: 'fail',
        severity: rule.severity,
        category: rule.category,
        message: `值不是数字: ${actualValue}`,
        actualValue,
        fixAvailable: false,
        timestamp: new Date()
      }]
    }
    
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      status: actualValue < threshold ? 'pass' : 'fail',
      severity: rule.severity,
      category: rule.category,
      message: actualValue < threshold ? '值在范围内' : `值 ${actualValue} 不小于 ${threshold}`,
      actualValue,
      expectedValue: `< ${threshold}`,
      fixAvailable: rule.remediation.automaticFix || false,
      timestamp: new Date()
    }]
  }

  // 检查值在范围内
  private checkValueInRange(rule: ComplianceRule, config: any): ComplianceResult[] {
    const path = rule.rule.path!
    const minValue = rule.rule.minValue!
    const maxValue = rule.rule.maxValue!
    const actualValue = this.getValueByPath(config, path)
    
    if (typeof actualValue !== 'number') {
      return [{
        ruleId: rule.id,
        ruleName: rule.name,
        status: 'fail',
        severity: rule.severity,
        category: rule.category,
        message: `值不是数字: ${actualValue}`,
        actualValue,
        fixAvailable: false,
        timestamp: new Date()
      }]
    }
    
    const inRange = actualValue >= minValue && actualValue <= maxValue
    
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      status: inRange ? 'pass' : 'fail',
      severity: rule.severity,
      category: rule.category,
      message: inRange ? '值在范围内' : `值 ${actualValue} 不在范围 [${minValue}, ${maxValue}] 内`,
      actualValue,
      expectedValue: `[${minValue}, ${maxValue}]`,
      fixAvailable: rule.remediation.automaticFix || false,
      timestamp: new Date()
    }]
  }

  // 检查正则匹配
  private checkRegexMatch(rule: ComplianceRule, configContent: string): ComplianceResult[] {
    const pattern = new RegExp(rule.rule.pattern!, 'gi')
    const matches = configContent.match(pattern)
    
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      status: matches ? 'pass' : 'fail',
      severity: rule.severity,
      category: rule.category,
      message: matches ? `找到匹配项: ${matches.length}` : '未找到匹配项',
      actualValue: matches ? matches.length : 0,
      fixAvailable: rule.remediation.automaticFix || false,
      timestamp: new Date()
    }]
  }

  // 检查正则不匹配
  private checkRegexNotMatch(rule: ComplianceRule, configContent: string): ComplianceResult[] {
    const pattern = new RegExp(rule.rule.pattern!, 'gi')
    const matches = configContent.match(pattern)
    
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      status: !matches ? 'pass' : 'fail',
      severity: rule.severity,
      category: rule.category,
      message: !matches ? '未找到匹配项(符合要求)' : `找到不应该存在的匹配项: ${matches.length}`,
      actualValue: matches ? matches.length : 0,
      fixAvailable: rule.remediation.automaticFix || false,
      timestamp: new Date()
    }]
  }

  // 检查文件权限
  private async checkFilePermission(rule: ComplianceRule, configPath: string): Promise<ComplianceResult[]> {
    try {
      const stats = await fs.stat(configPath)
      const actualPermission = (stats.mode & parseInt('777', 8)).toString(8)
      const expectedPermission = rule.rule.permission!
      
      return [{
        ruleId: rule.id,
        ruleName: rule.name,
        status: actualPermission === expectedPermission ? 'pass' : 'fail',
        severity: rule.severity,
        category: rule.category,
        message: actualPermission === expectedPermission ? '文件权限正确' : `文件权限不正确: 期望 ${expectedPermission}, 实际 ${actualPermission}`,
        actualValue: actualPermission,
        expectedValue: expectedPermission,
        fixAvailable: rule.remediation.automaticFix || false,
        timestamp: new Date()
      }]
    } catch (error) {
      return [{
        ruleId: rule.id,
        ruleName: rule.name,
        status: 'fail',
        severity: rule.severity,
        category: rule.category,
        message: `无法检查文件权限: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fixAvailable: false,
        timestamp: new Date()
      }]
    }
  }

  // 执行自定义函数
  private executeCustomFunction(rule: ComplianceRule, config: any, configContent: string): ComplianceResult[] {
    const functionName = rule.rule.customFunction!
    const customFunction = this.customFunctions.get(functionName)
    
    if (!customFunction) {
      return [{
        ruleId: rule.id,
        ruleName: rule.name,
        status: 'fail',
        severity: 'warning',
        category: rule.category,
        message: `自定义函数 ${functionName} 未找到`,
        fixAvailable: false,
        timestamp: new Date()
      }]
    }
    
    try {
      const results = customFunction(config, configContent, rule.rule.parameters)
      return Array.isArray(results) ? results : [results]
    } catch (error) {
      return [{
        ruleId: rule.id,
        ruleName: rule.name,
        status: 'fail',
        severity: 'warning',
        category: rule.category,
        message: `自定义函数执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fixAvailable: false,
        timestamp: new Date()
      }]
    }
  }

  // 根据路径获取值
  private getValueByPath(obj: any, path: string): any {
    const parts = path.split('.')
    let current = obj
    
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined
      }
      current = current[part]
    }
    
    return current
  }

  // 检测安全漏洞
  private async detectSecurityVulnerabilities(
    config: any,
    configContent: string,
    configType: string
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = []
    
    // 检查明文密码
    const passwordRegex = /password\s*[:=]\s*["']([^"'\s]{3,})["']/gi
    let match
    while ((match = passwordRegex.exec(configContent)) !== null) {
      vulnerabilities.push({
        id: `vuln_${Date.now()}_plaintext_password`,
        title: '明文密码存储',
        description: '配置文件中存储了明文密码',
        severity: 'high',
        category: 'authentication',
        affectedConfig: configType,
        location: `Line containing: ${match[0]}`,
        impact: '密码可能被未授权访问',
        exploitability: 'medium',
        remediation: {
          effort: 'medium',
          description: '使用环境变量或密钥管理系统',
          steps: [
            '识别所有明文密码',
            '创建环境变量',
            '更新配置以使用环境变量',
            '验证功能正常'
          ],
          references: ['OWASP Secrets Management Cheat Sheet']
        },
        detectedAt: new Date()
      })
    }
    
    // 检查弱加密算法
    const weakCryptoRegex = /\b(md5|sha1|des|rc4)\b/gi
    if (weakCryptoRegex.test(configContent)) {
      vulnerabilities.push({
        id: `vuln_${Date.now()}_weak_crypto`,
        title: '弱加密算法',
        description: '使用了已知的弱加密算法',
        severity: 'medium',
        category: 'encryption',
        affectedConfig: configType,
        location: '配置文件中的加密设置',
        impact: '数据可能被破解',
        exploitability: 'low',
        remediation: {
          effort: 'low',
          description: '使用强加密算法',
          steps: [
            '识别弱加密算法使用',
            '替换为SHA-256或更强的算法',
            '更新相关配置',
            '测试兼容性'
          ],
          references: ['NIST Cryptographic Standards']
        },
        detectedAt: new Date()
      })
    }
    
    // 检查不安全的端口
    const portRegex = /port\s*[:=]\s*(\d+)/gi
    while ((match = portRegex.exec(configContent)) !== null) {
      const port = parseInt(match[1])
      if (port < 1024 && port !== 443 && port !== 80) {
        vulnerabilities.push({
          id: `vuln_${Date.now()}_privileged_port`,
          title: '特权端口使用',
          description: `使用了特权端口 ${port}`,
          severity: 'low',
          category: 'configuration',
          affectedConfig: configType,
          location: `Port: ${port}`,
          impact: '需要特权用户运行',
          exploitability: 'low',
          remediation: {
            effort: 'low',
            description: '使用非特权端口(>1024)',
            steps: [
              '选择大于1024的端口',
              '更新配置文件',
              '更新防火墙规则',
              '更新客户端配置'
            ],
            references: ['Port Security Best Practices']
          },
          detectedAt: new Date()
        })
      }
    }
    
    return vulnerabilities
  }

  // 应用自动修复
  private async applyAutoFixes(
    results: ComplianceResult[],
    configPath: string,
    config: any
  ): Promise<number> {
    let fixesApplied = 0
    
    for (const result of results) {
      if (result.fixAvailable && result.status === 'fail') {
        const rule = this.rules.get(result.ruleId)
        if (rule?.remediation.automaticFix && rule.remediation.fixScript) {
          try {
            await this.applyAutoFix(rule.remediation.fixScript, configPath, config, result)
            result.fixApplied = true
            fixesApplied++
          } catch (error) {
            console.error(`Failed to apply auto fix for rule ${rule.id}:`, error)
          }
        }
      }
    }
    
    return fixesApplied
  }

  // 应用单个自动修复
  private async applyAutoFix(
    fixScript: string,
    configPath: string,
    config: any,
    result: ComplianceResult
  ): Promise<void> {
    switch (fixScript) {
      case 'addExternalLabels':
        if (!config.global) config.global = {}
        if (!config.global.external_labels) {
          config.global.external_labels = {
            cluster: 'default',
            instance: 'prometheus'
          }
        }
        break
        
      case 'adjustScrapeInterval':
        if (config.global && config.global.scrape_interval) {
          const currentInterval = this.parseDuration(config.global.scrape_interval)
          if (currentInterval < 10) {
            config.global.scrape_interval = '15s'
          } else if (currentInterval > 300) {
            config.global.scrape_interval = '300s'
          }
        }
        break
        
      case 'fixFilePermissions':
        await execAsync(`chmod 644 "${configPath}"`)
        break
        
      default:
        throw new Error(`Unknown fix script: ${fixScript}`)
    }
    
    // 保存修改后的配置
    const configType = this.detectConfigType(configPath)
    let newContent: string
    
    if (configType === 'snmp_exporter' || configType === 'prometheus' || configType === 'vmalert') {
      newContent = yaml.dump(config, { indent: 2 })
    } else {
      newContent = JSON.stringify(config, null, 2)
    }
    
    await fs.writeFile(configPath, newContent)
  }

  // 解析持续时间
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/)
    if (!match) return 0
    
    const value = parseInt(match[1])
    const unit = match[2]
    
    switch (unit) {
      case 's': return value
      case 'm': return value * 60
      case 'h': return value * 3600
      case 'd': return value * 86400
      default: return 0
    }
  }

  // 计算报告摘要
  private calculateReportSummary(report: ComplianceReport) {
    for (const result of report.results) {
      switch (result.status) {
        case 'pass':
          report.summary.passed++
          break
        case 'fail':
          report.summary.failed++
          break
        case 'warning':
          report.summary.warnings++
          break
        case 'not_applicable':
          report.summary.notApplicable++
          break
      }
      
      if (result.fixAvailable) {
        report.fixable++
      }
    }
    
    // 计算分数 (0-100)
    const totalChecked = report.summary.passed + report.summary.failed
    if (totalChecked > 0) {
      report.summary.score = Math.round((report.summary.passed / totalChecked) * 100)
    }
  }

  // 生成建议
  private generateRecommendations(report: ComplianceReport): string[] {
    const recommendations: string[] = []
    
    if (report.summary.failed > 0) {
      recommendations.push(`修复 ${report.summary.failed} 个失败的检查项`)
    }
    
    if (report.vulnerabilities.length > 0) {
      const criticalVulns = report.vulnerabilities.filter(v => v.severity === 'critical').length
      const highVulns = report.vulnerabilities.filter(v => v.severity === 'high').length
      
      if (criticalVulns > 0) {
        recommendations.push(`立即修复 ${criticalVulns} 个严重安全漏洞`)
      }
      
      if (highVulns > 0) {
        recommendations.push(`尽快修复 ${highVulns} 个高危安全漏洞`)
      }
    }
    
    if (report.summary.score < 80) {
      recommendations.push('配置合规性分数较低，建议全面检查配置')
    }
    
    if (report.fixable > 0) {
      recommendations.push(`启用自动修复可以解决 ${report.fixable} 个问题`)
    }
    
    return recommendations
  }

  // 保存报告
  private async saveReport(report: ComplianceReport) {
    const reportFile = path.join(this.reportsPath, `${report.id}.json`)
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2))
  }

  // 创建配置文件
  async createProfile(profileData: Omit<ComplianceProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceProfile> {
    const profile: ComplianceProfile = {
      ...profileData,
      id: `profile_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.profiles.set(profile.id, profile)
    await this.saveProfile(profile)
    
    return profile
  }

  // 保存配置文件
  private async saveProfile(profile: ComplianceProfile) {
    const profileFile = path.join(this.profilesPath, `${profile.id}.json`)
    await fs.writeFile(profileFile, JSON.stringify(profile, null, 2))
  }

  // 获取规则
  getRules(filter?: { category?: string; severity?: string; configType?: string }): ComplianceRule[] {
    let rules = Array.from(this.rules.values())
    
    if (filter) {
      if (filter.category) {
        rules = rules.filter(r => r.category === filter.category)
      }
      
      if (filter.severity) {
        rules = rules.filter(r => r.severity === filter.severity)
      }
      
      if (filter.configType) {
        rules = rules.filter(r => r.configType === filter.configType || r.configType === 'all')
      }
    }
    
    return rules
  }

  // 获取配置文件
  getProfiles(): ComplianceProfile[] {
    return Array.from(this.profiles.values())
  }

  // 获取报告
  async getReports(limit: number = 10): Promise<ComplianceReport[]> {
    try {
      const files = await fs.readdir(this.reportsPath)
      const reportFiles = files
        .filter(f => f.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a))
        .slice(0, limit)
      
      const reports: ComplianceReport[] = []
      for (const file of reportFiles) {
        const content = await fs.readFile(path.join(this.reportsPath, file), 'utf8')
        const report = JSON.parse(content) as ComplianceReport
        reports.push(report)
      }
      
      return reports
    } catch (error) {
      console.error('Failed to get reports:', error)
      return []
    }
  }
}

// 导出合规性扫描器实例
export const configComplianceScanner = new ConfigComplianceScanner()