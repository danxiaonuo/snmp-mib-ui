import { NextRequest, NextResponse } from 'next/server'

interface ConfigMigrationRequest {
  action: 'analyze' | 'preview' | 'execute' | 'rollback'
  hostId: string
  componentName: string
  fromVersion: string
  toVersion: string
  configFiles?: string[]
  options?: {
    autoBackup: boolean
    previewMode: boolean
    dryRun: boolean
  }
  migrationId?: string
}

interface ConfigFile {
  path: string
  name: string
  type: 'yaml' | 'json' | 'toml' | 'ini' | 'properties'
  size: number
  lastModified: string
  backup?: string
  migrationRequired: boolean
  migrationComplexity: 'simple' | 'moderate' | 'complex'
  changes: ConfigChange[]
}

interface ConfigChange {
  type: 'add' | 'remove' | 'modify' | 'rename'
  path: string
  oldValue?: any
  newValue?: any
  reason: string
  risk: 'low' | 'medium' | 'high'
  automatic: boolean
}

interface MigrationResult {
  file: string
  success: boolean
  changes: number
  warnings: string[]
  errors: string[]
  backupPath?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfigMigrationRequest = await request.json()
    const { action, hostId, componentName, fromVersion, toVersion, configFiles, options, migrationId } = body
    
    switch (action) {
      case 'analyze': {
        // 分析配置文件需要的迁移
        const analysisResult = await analyzeConfigMigration(hostId, componentName, fromVersion, toVersion)
        
        return NextResponse.json({
          success: true,
          data: analysisResult
        })
      }
      
      case 'preview': {
        // 预览配置变更
        const previewResult = await previewConfigChanges(hostId, componentName, fromVersion, toVersion, configFiles || [])
        
        return NextResponse.json({
          success: true,
          data: previewResult
        })
      }
      
      case 'execute': {
        // 执行配置迁移
        const migrationResult = await executeConfigMigration(hostId, componentName, fromVersion, toVersion, options || {})
        
        return NextResponse.json({
          success: true,
          data: migrationResult
        })
      }
      
      case 'rollback': {
        // 回滚配置迁移
        if (!migrationId) {
          return NextResponse.json(
            { success: false, error: 'Migration ID is required for rollback' },
            { status: 400 }
          )
        }
        
        const rollbackResult = await rollbackConfigMigration(migrationId)
        
        return NextResponse.json({
          success: true,
          data: rollbackResult
        })
      }
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Error in config migration API:', error)
    return NextResponse.json(
      { success: false, error: '配置迁移操作失败' },
      { status: 500 }
    )
  }
}

// 分析配置迁移
async function analyzeConfigMigration(hostId: string, componentName: string, fromVersion: string, toVersion: string) {
  // 获取迁移规则
  const migrationRules = await getMigrationRules(componentName, fromVersion, toVersion)
  
  // 检测现有配置文件
  const configFiles = await detectConfigFiles(hostId, componentName)
  
  // 分析每个配置文件需要的变更
  const analyzedFiles = configFiles.map(file => analyzeFileChanges(file, migrationRules))
  
  return {
    migrationRules,
    configFiles: analyzedFiles,
    summary: {
      totalFiles: analyzedFiles.length,
      requireMigration: analyzedFiles.filter(f => f.migrationRequired).length,
      totalChanges: analyzedFiles.reduce((sum, f) => sum + f.changes.length, 0),
      complexity: calculateMigrationComplexity(analyzedFiles),
      estimatedTime: calculateEstimatedTime(analyzedFiles)
    }
  }
}

// 获取迁移规则
async function getMigrationRules(componentName: string, fromVersion: string, toVersion: string) {
  const ruleDatabase: Record<string, any[]> = {
    'prometheus': [
      {
        fromVersion: '2.0.*',
        toVersion: '2.1.*',
        rules: [
          {
            action: 'modify',
            path: 'global.scrape_interval',
            transformation: 'rename to global.evaluation_interval',
            description: '全局抓取间隔配置项重命名'
          },
          {
            action: 'add',
            path: 'global.external_labels.cluster',
            newValue: 'production',
            description: '添加集群标识标签'
          },
          {
            action: 'remove',
            path: 'rule_files',
            condition: 'if empty',
            description: '移除空的规则文件配置'
          }
        ]
      }
    ],
    'grafana': [
      {
        fromVersion: '8.*',
        toVersion: '9.*',
        rules: [
          {
            action: 'modify',
            path: 'auth.anonymous.enabled',
            transformation: 'move to security.anonymous.enabled',
            description: '匿名访问配置迁移到安全配置段'
          },
          {
            action: 'add',
            path: 'feature_toggles.enable',
            newValue: 'ngalert',
            description: '添加新功能开关配置'
          }
        ]
      }
    ],
    'victoriametrics': [
      {
        fromVersion: '1.8.*',
        toVersion: '1.9.*',
        rules: [
          {
            action: 'modify',
            path: 'retentionPeriod',
            transformation: 'change format from days to duration',
            description: '保留期格式从天数改为持续时间'
          }
        ]
      }
    ]
  }
  
  return ruleDatabase[componentName] || []
}

// 检测配置文件
async function detectConfigFiles(hostId: string, componentName: string): Promise<ConfigFile[]> {
  // 模拟检测配置文件
  const commonConfigPaths: Record<string, string[]> = {
    'prometheus': ['/etc/prometheus/prometheus.yml', '/etc/prometheus/rules/*.yml'],
    'grafana': ['/etc/grafana/grafana.ini', '/var/lib/grafana/grafana.db'],
    'victoriametrics': ['/etc/victoriametrics/config.yml'],
    'alertmanager': ['/etc/alertmanager/alertmanager.yml'],
    'node-exporter': ['/etc/node-exporter/config.yml'],
    'categraf': ['/etc/categraf/conf/*.toml']
  }
  
  const paths = commonConfigPaths[componentName] || [`/etc/${componentName}/config.yml`]
  
  return paths.map((path, index) => ({
    path,
    name: path.split('/').pop() || `config-${index}`,
    type: getFileType(path),
    size: Math.floor(Math.random() * 10240) + 1024, // 1-10KB
    lastModified: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(), // 最近30天
    migrationRequired: false, // 将在分析时设置
    migrationComplexity: 'simple' as const,
    changes: []
  }))
}

// 获取文件类型
function getFileType(path: string): 'yaml' | 'json' | 'toml' | 'ini' | 'properties' {
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'yml':
    case 'yaml': return 'yaml'
    case 'json': return 'json'
    case 'toml': return 'toml'
    case 'ini': return 'ini'
    case 'properties': return 'properties'
    default: return 'yaml'
  }
}

// 分析文件变更
function analyzeFileChanges(file: ConfigFile, migrationRules: any[]): ConfigFile {
  const changes: ConfigChange[] = []
  
  migrationRules.forEach(ruleSet => {
    ruleSet.rules.forEach((rule: any) => {
      changes.push({
        type: rule.action,
        path: rule.path,
        oldValue: rule.oldValue,
        newValue: rule.newValue,
        reason: rule.description,
        risk: 'low', // 根据实际情况评估
        automatic: true
      })
    })
  })
  
  file.changes = changes
  file.migrationRequired = changes.length > 0
  file.migrationComplexity = changes.length > 5 ? 'complex' : changes.length > 2 ? 'moderate' : 'simple'
  
  return file
}

// 计算迁移复杂度
function calculateMigrationComplexity(files: ConfigFile[]): 'simple' | 'moderate' | 'complex' {
  const totalChanges = files.reduce((sum, f) => sum + f.changes.length, 0)
  const complexFiles = files.filter(f => f.migrationComplexity === 'complex').length
  
  if (complexFiles > 0 || totalChanges > 20) return 'complex'
  if (totalChanges > 10) return 'moderate'
  return 'simple'
}

// 计算预计时间
function calculateEstimatedTime(files: ConfigFile[]): number {
  return files.reduce((time, file) => {
    if (!file.migrationRequired) return time
    
    switch (file.migrationComplexity) {
      case 'simple': return time + 2
      case 'moderate': return time + 5
      case 'complex': return time + 10
      default: return time + 2
    }
  }, 0)
}

// 预览配置变更
async function previewConfigChanges(hostId: string, componentName: string, fromVersion: string, toVersion: string, configFiles: string[]) {
  // 模拟预览配置变更
  const previews = configFiles.map(filePath => ({
    file: filePath,
    currentConfig: generateMockConfig(componentName, fromVersion),
    migratedConfig: generateMockConfig(componentName, toVersion),
    diff: generateConfigDiff(componentName, fromVersion, toVersion)
  }))
  
  return { previews }
}

// 生成模拟配置
function generateMockConfig(componentName: string, version: string): string {
  const configs: Record<string, Record<string, string>> = {
    'prometheus': {
      '2.0.*': `global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'prometheus'

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']`,
      '2.1.*': `global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'prometheus'
    cluster: 'production'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']`
    }
  }
  
  return configs[componentName]?.[version] || `# ${componentName} ${version} configuration`
}

// 生成配置差异
function generateConfigDiff(componentName: string, fromVersion: string, toVersion: string) {
  return [
    { type: 'add', line: 6, content: '    cluster: \'production\'' },
    { type: 'remove', line: 8, content: 'rule_files:' },
    { type: 'remove', line: 9, content: '  - "rules/*.yml"' }
  ]
}

// 执行配置迁移
async function executeConfigMigration(hostId: string, componentName: string, fromVersion: string, toVersion: string, options: any) {
  const migrationId = `migration_${componentName}_${hostId}_${Date.now()}`
  
  // 模拟执行迁移
  const results: MigrationResult[] = [
    {
      file: `${componentName}.yml`,
      success: true,
      changes: 3,
      warnings: ['配置格式已更新，请验证功能正常'],
      errors: [],
      backupPath: options.autoBackup ? `/backup/${componentName}_${Date.now()}.yml` : undefined
    }
  ]
  
  // 模拟一些失败情况
  if (Math.random() < 0.1) {
    results.push({
      file: 'rules.yml',
      success: false,
      changes: 0,
      warnings: [],
      errors: ['文件格式不兼容，需要手动迁移'],
      backupPath: options.autoBackup ? `/backup/rules_${Date.now()}.yml` : undefined
    })
  }
  
  return {
    migrationId,
    results,
    summary: {
      totalFiles: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalChanges: results.reduce((sum, r) => sum + r.changes, 0)
    }
  }
}

// 回滚配置迁移
async function rollbackConfigMigration(migrationId: string) {
  // 模拟回滚操作
  return {
    migrationId,
    success: true,
    message: '配置已成功回滚到迁移前状态',
    restoredFiles: [
      '/etc/prometheus/prometheus.yml',
      '/etc/prometheus/rules/alerts.yml'
    ]
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const componentName = searchParams.get('component')
    const fromVersion = searchParams.get('from')
    const toVersion = searchParams.get('to')
    
    if (action === 'rules' && componentName && fromVersion && toVersion) {
      const rules = await getMigrationRules(componentName, fromVersion, toVersion)
      
      return NextResponse.json({
        success: true,
        data: rules
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid parameters' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Error in config migration API GET:', error)
    return NextResponse.json(
      { success: false, error: '获取迁移规则失败' },
      { status: 500 }
    )
  }
}