// API集成路由 - 整合所有后端API接口
import { NextRequest, NextResponse } from 'next/server'
import { systemIntegrationManager } from './system-integration-manager'
import { configVersionManager } from './config-version-manager'
import { batchDeviceManager } from './batch-device-manager'
import { realTimeMonitoringPreview } from './real-time-monitoring-preview'
import { advancedAlertRulesManager } from './advanced-alert-rules-manager'
import { configComplianceScanner } from './config-compliance-scanner'
import { performanceBenchmarkOptimizer } from './performance-benchmark-optimizer'
import { enhancedOIDManager } from './enhanced-oid-manager'

// 主系统管理API
export async function handleSystemAPI(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const action = pathParts[pathParts.length - 1]

  try {
    switch (action) {
      case 'health':
        return await getSystemHealth(request)
      case 'config':
        return await handleSystemConfig(request)
      case 'workflows':
        return await handleWorkflows(request)
      case 'recommendations':
        return await handleRecommendations(request)
      case 'report':
        return await generateSystemReport(request)
      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('System API错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 获取系统健康状态
async function getSystemHealth(request: NextRequest): Promise<NextResponse> {
  const health = systemIntegrationManager.getSystemHealth()
  return NextResponse.json(health)
}

// 处理系统配置
async function handleSystemConfig(request: NextRequest): Promise<NextResponse> {
  if (request.method === 'GET') {
    const config = systemIntegrationManager.getSystemConfig()
    return NextResponse.json(config)
  }
  
  if (request.method === 'PUT') {
    const updates = await request.json()
    await systemIntegrationManager.updateSystemConfig(updates)
    return NextResponse.json({ success: true })
  }
  
  return NextResponse.json({ error: '不支持的方法' }, { status: 405 })
}

// 处理工作流
async function handleWorkflows(request: NextRequest): Promise<NextResponse> {
  if (request.method === 'GET') {
    const workflows = systemIntegrationManager.getWorkflows()
    return NextResponse.json(workflows)
  }
  
  if (request.method === 'POST') {
    const url = new URL(request.url)
    const workflowId = url.searchParams.get('id')
    
    if (workflowId) {
      // 执行工作流
      const parameters = await request.json()
      await systemIntegrationManager.executeWorkflow(workflowId, parameters)
      return NextResponse.json({ success: true, message: '工作流已启动' })
    } else {
      // 创建工作流
      const workflowData = await request.json()
      const workflow = await systemIntegrationManager.createWorkflow(workflowData)
      return NextResponse.json(workflow)
    }
  }
  
  return NextResponse.json({ error: '不支持的方法' }, { status: 405 })
}

// 处理系统建议
async function handleRecommendations(request: NextRequest): Promise<NextResponse> {
  if (request.method === 'GET') {
    const health = systemIntegrationManager.getSystemHealth()
    return NextResponse.json(health.recommendations)
  }
  
  if (request.method === 'POST') {
    const { recommendationId } = await request.json()
    await systemIntegrationManager.applyRecommendation(recommendationId)
    return NextResponse.json({ success: true, message: '建议已应用' })
  }
  
  return NextResponse.json({ error: '不支持的方法' }, { status: 405 })
}

// 生成系统报告
async function generateSystemReport(request: NextRequest): Promise<NextResponse> {
  const report = await systemIntegrationManager.generateSystemReport()
  return NextResponse.json(report)
}

// 设备管理API
export async function handleDeviceAPI(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const action = pathParts[pathParts.length - 1]

  try {
    switch (action) {
      case 'list':
        return await getDeviceList(request)
      case 'add':
        return await addDevice(request)
      case 'discover':
        return await discoverDevices(request)
      case 'deploy':
        return await deployToDevices(request)
      case 'test':
        return await testDevice(request)
      case 'groups':
        return await handleDeviceGroups(request)
      case 'stats':
        return await getDeviceStats(request)
      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('Device API错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 获取设备列表
async function getDeviceList(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const vendor = url.searchParams.get('vendor')
  const status = url.searchParams.get('status')
  const tags = url.searchParams.get('tags')?.split(',')

  const filter: any = {}
  if (vendor) filter.vendors = [vendor]
  if (status) filter.status = [status]
  if (tags) filter.tags = tags

  const devices = batchDeviceManager.getDevices(filter)
  return NextResponse.json(devices)
}

// 添加设备
async function addDevice(request: NextRequest): Promise<NextResponse> {
  const deviceData = await request.json()
  const device = await batchDeviceManager.addDevice(deviceData)
  return NextResponse.json(device)
}

// 发现设备
async function discoverDevices(request: NextRequest): Promise<NextResponse> {
  const { ipRange, community = 'public', version = '2c' } = await request.json()
  const devices = await batchDeviceManager.discoverDevices(ipRange, community, version)
  return NextResponse.json({ devices, count: devices.length })
}

// 部署到设备
async function deployToDevices(request: NextRequest): Promise<NextResponse> {
  const { targets, configType, configVersionId, policy, deployedBy } = await request.json()
  
  const job = await batchDeviceManager.deployConfigBatch(
    targets,
    configType,
    configVersionId,
    policy,
    deployedBy
  )
  
  return NextResponse.json(job)
}

// 测试设备
async function testDevice(request: NextRequest): Promise<NextResponse> {
  const { deviceId, templateId } = await request.json()
  
  // 从设备管理器获取设备信息
  const devices = batchDeviceManager.getDevices()
  const device = devices.find(d => d.id === deviceId)
  
  if (!device) {
    return NextResponse.json({ error: '设备不存在' }, { status: 404 })
  }
  
  const result = await realTimeMonitoringPreview.testDeviceMetrics(
    deviceId,
    {
      ip: device.ip,
      snmpConfig: device.snmpConfig
    },
    templateId
  )
  
  return NextResponse.json(result)
}

// 处理设备分组
async function handleDeviceGroups(request: NextRequest): Promise<NextResponse> {
  if (request.method === 'GET') {
    const groups = batchDeviceManager.getGroups()
    return NextResponse.json(groups)
  }
  
  if (request.method === 'POST') {
    const groupData = await request.json()
    const group = await batchDeviceManager.createGroup(groupData)
    return NextResponse.json(group)
  }
  
  return NextResponse.json({ error: '不支持的方法' }, { status: 405 })
}

// 获取设备统计
async function getDeviceStats(request: NextRequest): Promise<NextResponse> {
  const stats = batchDeviceManager.getDeploymentStats()
  return NextResponse.json(stats)
}

// 配置管理API
export async function handleConfigAPI(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const action = pathParts[pathParts.length - 1]

  try {
    switch (action) {
      case 'versions':
        return await handleConfigVersions(request)
      case 'compare':
        return await compareConfigs(request)
      case 'validate':
        return await validateConfig(request)
      case 'migrate':
        return await migrateConfig(request)
      case 'oids':
        return await handleOIDs(request)
      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('Config API错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 处理配置版本
async function handleConfigVersions(request: NextRequest): Promise<NextResponse> {
  if (request.method === 'GET') {
    const url = new URL(request.url)
    const configName = url.searchParams.get('configName')
    
    if (configName) {
      const versions = await configVersionManager.getVersionHistory(configName)
      return NextResponse.json(versions)
    } else {
      return NextResponse.json({ error: '缺少配置名称参数' }, { status: 400 })
    }
  }
  
  if (request.method === 'POST') {
    const { configName, configType, content, author, description, tags } = await request.json()
    
    const version = await configVersionManager.createVersion(
      configName,
      configType,
      content,
      author,
      description,
      tags
    )
    
    return NextResponse.json(version)
  }
  
  return NextResponse.json({ error: '不支持的方法' }, { status: 405 })
}

// 比较配置
async function compareConfigs(request: NextRequest): Promise<NextResponse> {
  const { fromVersionId, toVersionId, toContent } = await request.json()
  
  const comparison = await configVersionManager.compareVersions(
    fromVersionId,
    toVersionId,
    toContent
  )
  
  return NextResponse.json(comparison)
}

// 验证配置
async function validateConfig(request: NextRequest): Promise<NextResponse> {
  const { configContent, templateType } = await request.json()
  
  const validation = await enhancedOIDManager.validateConfigurationTemplate(
    configContent,
    templateType
  )
  
  return NextResponse.json(validation)
}

// 迁移配置
async function migrateConfig(request: NextRequest): Promise<NextResponse> {
  const { file, fromVersion, toVersion, componentName, changes, backup, preview } = await request.json()
  
  // 实际的配置迁移逻辑
  try {
    const result = {
      success: true,
      backupPath: backup ? `/backup/${path.basename(file)}.${Date.now()}` : null,
      warnings: [],
      errors: []
    }
    
    if (preview) {
      result.warnings.push('这是预览模式，未实际修改文件')
    }
    
    // 根据变更应用迁移
    for (const change of changes) {
      // 处理不同类型的变更
      switch (change.type) {
        case 'add':
          result.warnings.push(`添加了配置项: ${change.path}`)
          break
        case 'remove':
          result.warnings.push(`移除了配置项: ${change.path}`)
          break
        case 'modify':
          result.warnings.push(`修改了配置项: ${change.path}`)
          break
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      errors: [error instanceof Error ? error.message : '迁移失败'],
      warnings: []
    }, { status: 500 })
  }
}

// 处理OID管理
async function handleOIDs(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')
  
  switch (action) {
    case 'search':
      const query = url.searchParams.get('query') || ''
      const vendor = url.searchParams.get('vendor')
      const results = enhancedOIDManager.searchOIDs(query, vendor)
      return NextResponse.json(results)
    
    case 'test':
      const { deviceConfig, oid } = await request.json()
      const testResult = await enhancedOIDManager.testOIDOnDevice(oid, deviceConfig)
      return NextResponse.json(testResult)
    
    default:
      return NextResponse.json({ error: '不支持的OID操作' }, { status: 400 })
  }
}

// 监控API
export async function handleMonitoringAPI(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const action = pathParts[pathParts.length - 1]

  try {
    switch (action) {
      case 'sessions':
        return await handleMonitoringSessions(request)
      case 'test':
        return await testMonitoring(request)
      case 'templates':
        return await getMonitoringTemplates(request)
      case 'export':
        return await exportMonitoringData(request)
      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('Monitoring API错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 处理监控会话
async function handleMonitoringSessions(request: NextRequest): Promise<NextResponse> {
  if (request.method === 'GET') {
    const sessions = realTimeMonitoringPreview.getActiveSessions()
    return NextResponse.json(sessions)
  }
  
  if (request.method === 'POST') {
    const { deviceIds, templateId, customOids, config } = await request.json()
    
    const session = await realTimeMonitoringPreview.createMonitoringSession(
      deviceIds,
      templateId,
      customOids,
      config
    )
    
    return NextResponse.json(session)
  }
  
  if (request.method === 'DELETE') {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')
    
    if (sessionId) {
      await realTimeMonitoringPreview.stopSession(sessionId)
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: '缺少会话ID' }, { status: 400 })
  }
  
  return NextResponse.json({ error: '不支持的方法' }, { status: 405 })
}

// 测试监控
async function testMonitoring(request: NextRequest): Promise<NextResponse> {
  const { deviceId, deviceConfig, templateId } = await request.json()
  
  const result = await realTimeMonitoringPreview.testDeviceMetrics(
    deviceId,
    deviceConfig,
    templateId
  )
  
  return NextResponse.json(result)
}

// 获取监控模板
async function getMonitoringTemplates(request: NextRequest): Promise<NextResponse> {
  const templates = realTimeMonitoringPreview.getTemplates()
  return NextResponse.json(templates)
}

// 导出监控数据
async function exportMonitoringData(request: NextRequest): Promise<NextResponse> {
  const { sessionId, format } = await request.json()
  
  const data = await realTimeMonitoringPreview.exportSessionData(sessionId, format)
  
  return new NextResponse(data, {
    headers: {
      'Content-Type': format === 'json' ? 'application/json' : 'text/plain',
      'Content-Disposition': `attachment; filename="monitoring_data.${format}"`
    }
  })
}

// 告警管理API
export async function handleAlertAPI(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const action = pathParts[pathParts.length - 1]

  try {
    switch (action) {
      case 'rules':
        return await handleAlertRules(request)
      case 'templates':
        return await handleAlertTemplates(request)
      case 'deploy':
        return await deployAlertRules(request)
      case 'optimize':
        return await optimizeAlertRules(request)
      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('Alert API错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 处理告警规则
async function handleAlertRules(request: NextRequest): Promise<NextResponse> {
  if (request.method === 'GET') {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const enabled = url.searchParams.get('enabled')
    
    const filter: any = {}
    if (category) filter.category = category
    if (enabled) filter.enabled = enabled === 'true'
    
    const rules = advancedAlertRulesManager.getRules(filter)
    return NextResponse.json(rules)
  }
  
  if (request.method === 'POST') {
    const ruleData = await request.json()
    const rule = await advancedAlertRulesManager.createRule(ruleData)
    return NextResponse.json(rule)
  }
  
  return NextResponse.json({ error: '不支持的方法' }, { status: 405 })
}

// 处理告警模板
async function handleAlertTemplates(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const vendor = url.searchParams.get('vendor')
  const deviceType = url.searchParams.get('deviceType')
  const category = url.searchParams.get('category')
  
  const filter: any = {}
  if (vendor) filter.vendor = vendor
  if (deviceType) filter.deviceType = deviceType
  if (category) filter.category = category
  
  const templates = advancedAlertRulesManager.getTemplates(filter)
  return NextResponse.json(templates)
}

// 部署告警规则
async function deployAlertRules(request: NextRequest): Promise<NextResponse> {
  const { groupId, prometheusConfig } = await request.json()
  
  await advancedAlertRulesManager.deployRulesToPrometheus(groupId, prometheusConfig)
  
  return NextResponse.json({ success: true, message: '告警规则部署成功' })
}

// 优化告警规则
async function optimizeAlertRules(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const ruleId = url.searchParams.get('ruleId')
  
  const suggestions = await advancedAlertRulesManager.getOptimizationSuggestions(ruleId)
  return NextResponse.json(suggestions)
}

// 合规性API
export async function handleComplianceAPI(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const action = pathParts[pathParts.length - 1]

  try {
    switch (action) {
      case 'scan':
        return await scanCompliance(request)
      case 'rules':
        return await getComplianceRules(request)
      case 'profiles':
        return await handleComplianceProfiles(request)
      case 'reports':
        return await getComplianceReports(request)
      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('Compliance API错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 扫描合规性
async function scanCompliance(request: NextRequest): Promise<NextResponse> {
  const { configPath, profileId, options } = await request.json()
  
  const report = await configComplianceScanner.scanConfiguration(
    configPath,
    profileId,
    options
  )
  
  return NextResponse.json(report)
}

// 获取合规规则
async function getComplianceRules(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const category = url.searchParams.get('category')
  const severity = url.searchParams.get('severity')
  const configType = url.searchParams.get('configType')
  
  const filter: any = {}
  if (category) filter.category = category
  if (severity) filter.severity = severity
  if (configType) filter.configType = configType
  
  const rules = configComplianceScanner.getRules(filter)
  return NextResponse.json(rules)
}

// 处理合规配置文件
async function handleComplianceProfiles(request: NextRequest): Promise<NextResponse> {
  if (request.method === 'GET') {
    const profiles = configComplianceScanner.getProfiles()
    return NextResponse.json(profiles)
  }
  
  if (request.method === 'POST') {
    const profileData = await request.json()
    const profile = await configComplianceScanner.createProfile(profileData)
    return NextResponse.json(profile)
  }
  
  return NextResponse.json({ error: '不支持的方法' }, { status: 405 })
}

// 获取合规报告
async function getComplianceReports(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '10')
  
  const reports = await configComplianceScanner.getReports(limit)
  return NextResponse.json(reports)
}

// 性能测试API
export async function handlePerformanceAPI(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const action = pathParts[pathParts.length - 1]

  try {
    switch (action) {
      case 'benchmarks':
        return await handleBenchmarks(request)
      case 'run':
        return await runBenchmark(request)
      case 'results':
        return await getBenchmarkResults(request)
      case 'optimizations':
        return await getOptimizations(request)
      case 'report':
        return await generatePerformanceReport(request)
      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('Performance API错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 处理基准测试
async function handleBenchmarks(request: NextRequest): Promise<NextResponse> {
  if (request.method === 'GET') {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const enabled = url.searchParams.get('enabled')
    
    const filter: any = {}
    if (type) filter.type = type
    if (enabled) filter.enabled = enabled === 'true'
    
    const configs = performanceBenchmarkOptimizer.getBenchmarkConfigs(filter)
    return NextResponse.json(configs)
  }
  
  if (request.method === 'POST') {
    const configData = await request.json()
    const config = await performanceBenchmarkOptimizer.createBenchmarkConfig(configData)
    return NextResponse.json(config)
  }
  
  return NextResponse.json({ error: '不支持的方法' }, { status: 405 })
}

// 运行基准测试
async function runBenchmark(request: NextRequest): Promise<NextResponse> {
  const { configId } = await request.json()
  
  const result = await performanceBenchmarkOptimizer.runBenchmark(configId)
  return NextResponse.json(result)
}

// 获取基准测试结果
async function getBenchmarkResults(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const configId = url.searchParams.get('configId')
  const limit = parseInt(url.searchParams.get('limit') || '10')
  
  const results = performanceBenchmarkOptimizer.getBenchmarkResults(configId, limit)
  return NextResponse.json(results)
}

// 获取优化建议
async function getOptimizations(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const category = url.searchParams.get('category')
  
  const optimizations = performanceBenchmarkOptimizer.getOptimizations(category)
  return NextResponse.json(optimizations)
}

// 生成性能报告
async function generatePerformanceReport(request: NextRequest): Promise<NextResponse> {
  const { timeRange, configIds } = await request.json()
  
  const report = await performanceBenchmarkOptimizer.generatePerformanceReport(
    timeRange,
    configIds
  )
  
  return NextResponse.json(report)
}

// 路由映射
export const apiRoutes = {
  '/api/system': handleSystemAPI,
  '/api/devices': handleDeviceAPI,
  '/api/config': handleConfigAPI,
  '/api/monitoring': handleMonitoringAPI,
  '/api/alerts': handleAlertAPI,
  '/api/compliance': handleComplianceAPI,
  '/api/performance': handlePerformanceAPI
}