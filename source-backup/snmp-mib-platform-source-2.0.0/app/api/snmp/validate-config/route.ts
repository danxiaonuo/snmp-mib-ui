import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

interface ConfigValidationRequest {
  config: string
  configType: 'snmp_exporter' | 'categraf' | 'prometheus'
  testTargets: Array<{
    host: string
    community: string
    version: string
  }>
}

interface ValidationResult {
  success: boolean
  syntaxValid: boolean
  testResults: Array<{
    host: string
    success: boolean
    metrics: Array<{
      name: string
      value: string
      type: string
      help?: string
    }>
    error?: string
  }>
  errors: string[]
  warnings: string[]
}

// 验证SNMP Exporter配置语法
async function validateSNMPExporterConfig(config: string): Promise<{ valid: boolean, errors: string[] }> {
  const tempFile = join(tmpdir(), `snmp-config-${Date.now()}.yml`)
  
  try {
    await writeFile(tempFile, config)
    
    // 使用snmp_exporter的dry-run模式验证配置
    const { stdout, stderr } = await execAsync(`snmp_exporter --config.file="${tempFile}" --dry-run 2>&1 || true`)
    
    await unlink(tempFile)
    
    const output = stdout + stderr
    const errors: string[] = []
    
    if (output.includes('error') || output.includes('Error') || output.includes('ERROR')) {
      const errorLines = output.split('\n').filter(line => 
        line.toLowerCase().includes('error') || 
        line.toLowerCase().includes('invalid') ||
        line.toLowerCase().includes('failed')
      )
      errors.push(...errorLines)
    }
    
    return { valid: errors.length === 0, errors }
  } catch (error) {
    await unlink(tempFile).catch(() => {}) // 清理临时文件
    return { 
      valid: false, 
      errors: [error instanceof Error ? error.message : 'Configuration validation failed'] 
    }
  }
}

// 测试SNMP配置的实际数据抓取
async function testSNMPDataCollection(targets: Array<{ host: string, community: string, version: string }>, config: string) {
  const results = []
  
  for (const target of targets) {
    const result = {
      host: target.host,
      success: false,
      metrics: [] as Array<{ name: string, value: string, type: string, help?: string }>,
      error: undefined as string | undefined
    }
    
    try {
      // 从配置中提取OID列表
      const oidMatches = config.match(/- (1\.3\.6\.1\.[0-9\.]+)/g)
      if (!oidMatches) {
        result.error = 'No valid OIDs found in configuration'
        results.push(result)
        continue
      }
      
      const oids = oidMatches.map(match => match.replace('- ', ''))
      const snmpVersion = target.version === '1' ? '1' : '2c'
      
      // 测试每个OID
      for (const oid of oids.slice(0, 10)) { // 限制测试前10个OID
        try {
          const cmd = `snmpget -v${snmpVersion} -c "${target.community}" -t 3 -r 1 "${target.host}" "${oid}"`
          const { stdout } = await execAsync(cmd)
          
          if (stdout.trim()) {
            const lines = stdout.split('\n').filter(line => line.trim())
            lines.forEach(line => {
              if (line.includes('=')) {
                const parts = line.split('=')
                if (parts.length >= 2) {
                  const oidPart = parts[0].trim()
                  const valuePart = parts[1].trim()
                  
                  // 解析值类型和内容
                  let type = 'unknown'
                  let value = valuePart
                  
                  if (valuePart.includes('INTEGER:')) {
                    type = 'gauge'
                    value = valuePart.replace('INTEGER:', '').trim()
                  } else if (valuePart.includes('STRING:')) {
                    type = 'info'
                    value = valuePart.replace('STRING:', '').trim().replace(/"/g, '')
                  } else if (valuePart.includes('Counter32:') || valuePart.includes('Counter64:')) {
                    type = 'counter'
                    value = valuePart.replace(/Counter\d+:/, '').trim()
                  } else if (valuePart.includes('Gauge32:')) {
                    type = 'gauge'
                    value = valuePart.replace('Gauge32:', '').trim()
                  } else if (valuePart.includes('Timeticks:')) {
                    type = 'gauge'
                    const match = valuePart.match(/\((\d+)\)/)
                    value = match ? match[1] : valuePart.replace('Timeticks:', '').trim()
                  }
                  
                  result.metrics.push({
                    name: getMetricName(oid),
                    value: value,
                    type: type,
                    help: getMetricHelp(oid)
                  })
                }
              }
            })
          }
        } catch (oidError) {
          // 单个OID失败不影响整体测试
          console.warn(`OID ${oid} failed for ${target.host}:`, oidError)
        }
      }
      
      result.success = result.metrics.length > 0
      if (!result.success && result.metrics.length === 0) {
        result.error = 'No metrics could be collected from any OID'
      }
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error occurred'
    }
    
    results.push(result)
  }
  
  return results
}

// 根据OID获取指标名称
function getMetricName(oid: string): string {
  const oidMap: Record<string, string> = {
    '1.3.6.1.2.1.1.1.0': 'system_description',
    '1.3.6.1.2.1.1.3.0': 'system_uptime',
    '1.3.6.1.2.1.1.5.0': 'system_name',
    '1.3.6.1.2.1.2.2.1.10': 'interface_in_octets',
    '1.3.6.1.2.1.2.2.1.16': 'interface_out_octets',
    '1.3.6.1.2.1.2.2.1.8': 'interface_oper_status',
    '1.3.6.1.2.1.25.3.3.1.2': 'cpu_usage_percent',
    '1.3.6.1.2.1.25.2.2.0': 'memory_total_bytes',
    '1.3.6.1.4.1.9.9.109.1.1.1.1.2': 'cisco_cpu_1min',
    '1.3.6.1.4.1.674.10892.5.4.700.20.1.6': 'dell_temperature_celsius'
  }
  
  return oidMap[oid] || `oid_${oid.replace(/\./g, '_')}`
}

// 根据OID获取指标帮助信息
function getMetricHelp(oid: string): string {
  const helpMap: Record<string, string> = {
    '1.3.6.1.2.1.1.1.0': 'System description',
    '1.3.6.1.2.1.1.3.0': 'System uptime in timeticks',
    '1.3.6.1.2.1.1.5.0': 'System name',
    '1.3.6.1.2.1.2.2.1.10': 'Interface input octets',
    '1.3.6.1.2.1.2.2.1.16': 'Interface output octets',
    '1.3.6.1.2.1.2.2.1.8': 'Interface operational status',
    '1.3.6.1.2.1.25.3.3.1.2': 'CPU usage percentage',
    '1.3.6.1.2.1.25.2.2.0': 'Total memory in bytes',
    '1.3.6.1.4.1.9.9.109.1.1.1.1.2': 'Cisco CPU usage 1 minute average',
    '1.3.6.1.4.1.674.10892.5.4.700.20.1.6': 'Dell temperature sensor reading'
  }
  
  return helpMap[oid] || 'Custom OID metric'
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfigValidationRequest = await request.json()
    const { config, configType, testTargets } = body

    if (!config || !configType) {
      return NextResponse.json(
        { success: false, error: 'Config and configType are required' },
        { status: 400 }
      )
    }

    const result: ValidationResult = {
      success: false,
      syntaxValid: false,
      testResults: [],
      errors: [],
      warnings: []
    }

    // 验证配置语法
    if (configType === 'snmp_exporter') {
      const validation = await validateSNMPExporterConfig(config)
      result.syntaxValid = validation.valid
      result.errors.push(...validation.errors)
    } else {
      // 对于其他类型，进行基本的YAML语法检查
      try {
        // 简单的YAML语法检查
        if (!config.trim()) {
          result.errors.push('Configuration is empty')
        } else if (config.includes('\t')) {
          result.warnings.push('Configuration contains tabs, YAML prefers spaces')
        }
        result.syntaxValid = result.errors.length === 0
      } catch (error) {
        result.errors.push('Invalid YAML syntax')
      }
    }

    // 如果有测试目标，进行实际数据抓取测试
    if (testTargets && testTargets.length > 0 && result.syntaxValid) {
      try {
        result.testResults = await testSNMPDataCollection(testTargets, config)
        
        // 检查是否至少有一个目标成功
        const hasSuccessfulTarget = result.testResults.some(r => r.success)
        if (!hasSuccessfulTarget) {
          result.warnings.push('No test targets returned valid data')
        }
      } catch (error) {
        result.errors.push(`Data collection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    result.success = result.syntaxValid && result.errors.length === 0

    return NextResponse.json(result)

  } catch (error) {
    console.error('Config validation error:', error)
    return NextResponse.json(
      { success: false, error: 'Invalid request format' },
      { status: 400 }
    )
  }
}