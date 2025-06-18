// 真实SNMP配置验证器 - 确保配置能真正抓取到数据
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface SNMPTestResult {
  success: boolean
  data?: any
  error?: string
  responseTime?: number
  oids: {
    oid: string
    value?: any
    error?: string
    success: boolean
  }[]
}

export interface SNMPConfig {
  host: string
  port: number
  community: string
  version: '1' | '2c' | '3'
  timeout: number
  retries: number
  oids: string[]
}

export class RealSNMPValidator {
  /**
   * 测试SNMP连接并验证OID数据抓取
   */
  async testSNMPConnection(config: SNMPConfig): Promise<SNMPTestResult> {
    const startTime = Date.now()
    const result: SNMPTestResult = {
      success: false,
      oids: []
    }

    try {
      // 构建snmpwalk命令
      const cmd = this.buildSNMPCommand(config)
      
      // 执行SNMP查询
      const { stdout, stderr } = await execAsync(cmd, { timeout: config.timeout * 1000 })
      
      if (stderr && !stdout) {
        result.error = stderr
        return result
      }

      // 解析SNMP响应
      const parsedData = this.parseSNMPResponse(stdout, config.oids)
      result.oids = parsedData
      result.success = parsedData.some(oid => oid.success)
      result.responseTime = Date.now() - startTime
      result.data = this.formatSNMPData(parsedData)

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error)
      result.responseTime = Date.now() - startTime
    }

    return result
  }

  /**
   * 构建SNMP命令
   */
  private buildSNMPCommand(config: SNMPConfig): string {
    const { host, port, community, version, timeout, retries, oids } = config
    
    let cmd = `snmpwalk -v${version} -c ${community} -t ${timeout} -r ${retries}`
    
    if (port !== 161) {
      cmd += ` -p ${port}`
    }
    
    cmd += ` ${host}`
    
    // 如果指定了特定OID，使用snmpget而不是snmpwalk
    if (oids.length > 0) {
      cmd = cmd.replace('snmpwalk', 'snmpget')
      cmd += ` ${oids.join(' ')}`
    } else {
      // 默认查询系统信息
      cmd += ` 1.3.6.1.2.1.1`
    }
    
    return cmd
  }

  /**
   * 解析SNMP响应
   */
  private parseSNMPResponse(output: string, requestedOids: string[]): Array<{
    oid: string
    value?: any
    error?: string
    success: boolean
  }> {
    const lines = output.split('\n').filter(line => line.trim())
    const results: Array<{ oid: string; value?: any; error?: string; success: boolean }> = []
    
    for (const line of lines) {
      const match = line.match(/^(\S+)\s*=\s*(.+)$/)
      if (match) {
        const [, oid, valueStr] = match
        const value = this.parseOIDValue(valueStr)
        results.push({
          oid: oid.trim(),
          value,
          success: true
        })
      }
    }

    // 如果请求了特定OID但没有响应，标记为失败
    if (requestedOids.length > 0) {
      for (const requestedOid of requestedOids) {
        const found = results.find(r => r.oid.startsWith(requestedOid))
        if (!found) {
          results.push({
            oid: requestedOid,
            error: 'No response',
            success: false
          })
        }
      }
    }

    return results
  }

  /**
   * 解析OID值
   */
  private parseOIDValue(valueStr: string): any {
    // 移除类型前缀 (如 "STRING: ", "INTEGER: ", 等)
    const typeMatch = valueStr.match(/^(\w+):\s*(.*)$/)
    if (typeMatch) {
      const [, type, value] = typeMatch
      
      switch (type.toUpperCase()) {
        case 'STRING':
          return value.replace(/^"(.*)"$/, '$1') // 移除引号
        case 'INTEGER':
        case 'GAUGE32':
        case 'COUNTER32':
        case 'COUNTER64':
          return parseInt(value, 10)
        case 'TIMETICKS':
          const ticksMatch = value.match(/\((\d+)\)/)
          return ticksMatch ? parseInt(ticksMatch[1], 10) : value
        case 'HEX-STRING':
          return value
        case 'OID':
          return value
        default:
          return value
      }
    }
    
    return valueStr
  }

  /**
   * 格式化SNMP数据为结构化格式
   */
  private formatSNMPData(oids: Array<{ oid: string; value?: any; success: boolean }>): Record<string, any> {
    const data: Record<string, any> = {}
    
    for (const oidData of oids) {
      if (oidData.success && oidData.value !== undefined) {
        // 将OID转换为可读名称
        const name = this.oidToName(oidData.oid)
        data[name] = oidData.value
      }
    }
    
    return data
  }

  /**
   * 将OID转换为可读名称
   */
  private oidToName(oid: string): string {
    const oidMap: Record<string, string> = {
      '1.3.6.1.2.1.1.1.0': 'sysDescr',
      '1.3.6.1.2.1.1.3.0': 'sysUpTime',
      '1.3.6.1.2.1.1.4.0': 'sysContact',
      '1.3.6.1.2.1.1.5.0': 'sysName',
      '1.3.6.1.2.1.1.6.0': 'sysLocation',
      '1.3.6.1.2.1.2.1.0': 'ifNumber',
      // 接口相关
      '1.3.6.1.2.1.2.2.1.1': 'ifIndex',
      '1.3.6.1.2.1.2.2.1.2': 'ifDescr',
      '1.3.6.1.2.1.2.2.1.8': 'ifOperStatus',
      '1.3.6.1.2.1.2.2.1.10': 'ifInOctets',
      '1.3.6.1.2.1.2.2.1.16': 'ifOutOctets',
    }
    
    // 检查精确匹配
    if (oidMap[oid]) {
      return oidMap[oid]
    }
    
    // 检查前缀匹配（用于表格数据）
    for (const [prefix, name] of Object.entries(oidMap)) {
      if (oid.startsWith(prefix)) {
        const suffix = oid.substring(prefix.length)
        return `${name}${suffix}`
      }
    }
    
    return oid
  }

  /**
   * 验证交换机配置的完整性
   */
  async validateSwitchConfig(host: string, community: string = 'public'): Promise<{
    isSwitch: boolean
    vendor?: string
    model?: string
    interfaces: number
    supportedOids: string[]
    recommendations: string[]
  }> {
    const basicOids = [
      '1.3.6.1.2.1.1.1.0',  // sysDescr
      '1.3.6.1.2.1.1.2.0',  // sysObjectID
      '1.3.6.1.2.1.2.1.0',  // ifNumber
    ]

    const config: SNMPConfig = {
      host,
      port: 161,
      community,
      version: '2c',
      timeout: 5,
      retries: 3,
      oids: basicOids
    }

    const result = await this.testSNMPConnection(config)
    
    if (!result.success) {
      return {
        isSwitch: false,
        interfaces: 0,
        supportedOids: [],
        recommendations: ['SNMP连接失败，请检查网络连接和Community字符串']
      }
    }

    // 分析设备信息
    const sysDescr = result.data?.sysDescr || ''
    const vendor = this.detectVendor(sysDescr)
    const model = this.detectModel(sysDescr)
    const interfaces = result.data?.ifNumber || 0
    
    // 测试厂商特定OID
    const vendorOids = this.getVendorSpecificOids(vendor)
    const vendorTestConfig = { ...config, oids: vendorOids }
    const vendorResult = await this.testSNMPConnection(vendorTestConfig)
    
    const supportedOids = [
      ...basicOids,
      ...vendorResult.oids.filter(oid => oid.success).map(oid => oid.oid)
    ]

    const recommendations = this.generateRecommendations(vendor, interfaces, supportedOids)

    return {
      isSwitch: interfaces > 0,
      vendor,
      model,
      interfaces,
      supportedOids,
      recommendations
    }
  }

  /**
   * 检测设备厂商
   */
  private detectVendor(sysDescr: string): string {
    const vendors = [
      { name: 'Cisco', patterns: ['cisco', 'catalyst', 'nexus'] },
      { name: 'Huawei', patterns: ['huawei', 'quidway', 'cloudengine'] },
      { name: 'H3C', patterns: ['h3c', 'comware'] },
      { name: 'Juniper', patterns: ['juniper', 'junos'] },
      { name: 'Arista', patterns: ['arista', 'eos'] },
      { name: 'Dell', patterns: ['dell', 'force10'] },
      { name: 'HP', patterns: ['hp', 'hewlett', 'procurve'] },
      { name: 'Extreme', patterns: ['extreme', 'exos'] }
    ]

    const lowerDescr = sysDescr.toLowerCase()
    
    for (const vendor of vendors) {
      if (vendor.patterns.some(pattern => lowerDescr.includes(pattern))) {
        return vendor.name
      }
    }
    
    return 'Unknown'
  }

  /**
   * 检测设备型号
   */
  private detectModel(sysDescr: string): string {
    // 简单的型号提取逻辑
    const modelPatterns = [
      /catalyst\s+(\w+)/i,
      /nexus\s+(\w+)/i,
      /s(\d+)/i,
      /(\w+\d+\w*)/
    ]

    for (const pattern of modelPatterns) {
      const match = sysDescr.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return 'Unknown'
  }

  /**
   * 获取厂商特定OID
   */
  private getVendorSpecificOids(vendor: string): string[] {
    const vendorOids: Record<string, string[]> = {
      'Cisco': [
        '1.3.6.1.4.1.9.9.109.1.1.1.1.2',  // CPU 1min
        '1.3.6.1.4.1.9.9.48.1.1.1.5',     // Memory used
        '1.3.6.1.4.1.9.9.13.1.3.1.3',     // Temperature
      ],
      'Huawei': [
        '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.5',  // CPU usage
        '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.7',  // Memory usage
        '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.11', // Temperature
      ],
      'H3C': [
        '1.3.6.1.4.1.25506.2.6.1.1.1.1.6',   // CPU usage
        '1.3.6.1.4.1.25506.2.6.1.1.1.1.8',   // Memory usage
        '1.3.6.1.4.1.25506.2.6.1.1.1.1.12',  // Temperature
      ]
    }

    return vendorOids[vendor] || []
  }

  /**
   * 生成配置建议
   */
  private generateRecommendations(vendor: string, interfaces: number, supportedOids: string[]): string[] {
    const recommendations: string[] = []

    if (interfaces > 24) {
      recommendations.push('建议使用高频采集间隔(30-60秒)以监控高端口密度设备')
    }

    if (vendor === 'Cisco' && supportedOids.some(oid => oid.includes('1.3.6.1.4.1.9'))) {
      recommendations.push('检测到Cisco设备，建议启用Cisco专用MIB监控')
    }

    if (vendor === 'Huawei' && supportedOids.some(oid => oid.includes('1.3.6.1.4.1.2011'))) {
      recommendations.push('检测到华为设备，建议启用华为专用MIB监控')
    }

    if (supportedOids.length < 5) {
      recommendations.push('支持的OID较少，建议检查SNMP配置和MIB支持')
    }

    return recommendations
  }
}

export const snmpValidator = new RealSNMPValidator()