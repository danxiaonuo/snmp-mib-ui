// 增强的OID库管理和配置模板验证系统
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface OIDInfo {
  oid: string
  name: string
  description: string
  syntax: 'Integer' | 'OctetString' | 'ObjectIdentifier' | 'Counter32' | 'Counter64' | 'Gauge32' | 'TimeTicks'
  access: 'read-only' | 'read-write' | 'write-only' | 'not-accessible'
  status: 'current' | 'deprecated' | 'obsolete'
  mibModule: string
  parentOid?: string
  childOids?: string[]
  defaultValue?: string
  enumValues?: Array<{value: number, name: string}>
  vendors: string[]
  tested: boolean
  lastTested?: Date
  testResults?: OIDTestResult[]
}

export interface OIDTestResult {
  deviceType: string
  vendor: string
  model: string
  ip: string
  success: boolean
  value?: string
  responseTime: number
  timestamp: Date
  error?: string
}

export interface MIBValidationResult {
  valid: boolean
  oidCount: number
  errors: string[]
  warnings: string[]
  suggestions: string[]
  coverage: {
    system: number
    interfaces: number
    performance: number
    environment: number
  }
  vendorSpecific: Array<{
    vendor: string
    oidCount: number
    coverage: number
  }>
}

export class EnhancedOIDManager {
  private oidDatabase: Map<string, OIDInfo> = new Map()
  private mibFiles: Map<string, string> = new Map()
  private vendorMappings: Map<string, string[]> = new Map()

  constructor() {
    this.initializeStandardOIDs()
    this.initializeVendorMappings()
  }

  // 初始化标准OID库
  private initializeStandardOIDs() {
    const standardOIDs: OIDInfo[] = [
      // 系统基础信息 (RFC1213-MIB)
      {
        oid: '1.3.6.1.2.1.1.1.0',
        name: 'sysDescr',
        description: '系统描述信息',
        syntax: 'OctetString',
        access: 'read-only',
        status: 'current',
        mibModule: 'SNMPv2-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.1.2.0',
        name: 'sysObjectID',
        description: '系统对象标识符',
        syntax: 'ObjectIdentifier',
        access: 'read-only',
        status: 'current',
        mibModule: 'SNMPv2-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.1.3.0',
        name: 'sysUpTime',
        description: '系统运行时间',
        syntax: 'TimeTicks',
        access: 'read-only',
        status: 'current',
        mibModule: 'SNMPv2-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.1.4.0',
        name: 'sysContact',
        description: '系统联系人',
        syntax: 'OctetString',
        access: 'read-write',
        status: 'current',
        mibModule: 'SNMPv2-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.1.5.0',
        name: 'sysName',
        description: '系统名称',
        syntax: 'OctetString',
        access: 'read-write',
        status: 'current',
        mibModule: 'SNMPv2-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.1.6.0',
        name: 'sysLocation',
        description: '系统位置',
        syntax: 'OctetString',
        access: 'read-write',
        status: 'current',
        mibModule: 'SNMPv2-MIB',
        vendors: ['*'],
        tested: true
      },

      // 接口信息 (IF-MIB)
      {
        oid: '1.3.6.1.2.1.2.1.0',
        name: 'ifNumber',
        description: '接口数量',
        syntax: 'Integer',
        access: 'read-only',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.2.2.1.1',
        name: 'ifIndex',
        description: '接口索引',
        syntax: 'Integer',
        access: 'read-only',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.2.2.1.2',
        name: 'ifDescr',
        description: '接口描述',
        syntax: 'OctetString',
        access: 'read-only',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.2.2.1.3',
        name: 'ifType',
        description: '接口类型',
        syntax: 'Integer',
        access: 'read-only',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true,
        enumValues: [
          {value: 1, name: 'other'},
          {value: 6, name: 'ethernetCsmacd'},
          {value: 24, name: 'softwareLoopback'},
          {value: 53, name: 'propVirtual'}
        ]
      },
      {
        oid: '1.3.6.1.2.1.2.2.1.5',
        name: 'ifSpeed',
        description: '接口速度',
        syntax: 'Gauge32',
        access: 'read-only',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.2.2.1.7',
        name: 'ifAdminStatus',
        description: '接口管理状态',
        syntax: 'Integer',
        access: 'read-write',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true,
        enumValues: [
          {value: 1, name: 'up'},
          {value: 2, name: 'down'},
          {value: 3, name: 'testing'}
        ]
      },
      {
        oid: '1.3.6.1.2.1.2.2.1.8',
        name: 'ifOperStatus',
        description: '接口运行状态',
        syntax: 'Integer',
        access: 'read-only',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true,
        enumValues: [
          {value: 1, name: 'up'},
          {value: 2, name: 'down'},
          {value: 3, name: 'testing'},
          {value: 4, name: 'unknown'},
          {value: 5, name: 'dormant'},
          {value: 6, name: 'notPresent'},
          {value: 7, name: 'lowerLayerDown'}
        ]
      },
      {
        oid: '1.3.6.1.2.1.2.2.1.10',
        name: 'ifInOctets',
        description: '接口入字节数',
        syntax: 'Counter32',
        access: 'read-only',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.2.2.1.16',
        name: 'ifOutOctets',
        description: '接口出字节数',
        syntax: 'Counter32',
        access: 'read-only',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true
      },

      // 高速接口计数器 (IF-MIB)
      {
        oid: '1.3.6.1.2.1.31.1.1.1.1',
        name: 'ifName',
        description: '接口名称',
        syntax: 'OctetString',
        access: 'read-only',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.31.1.1.1.6',
        name: 'ifHCInOctets',
        description: '高速接口入字节数(64位)',
        syntax: 'Counter64',
        access: 'read-only',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.31.1.1.1.10',
        name: 'ifHCOutOctets',
        description: '高速接口出字节数(64位)',
        syntax: 'Counter64',
        access: 'read-only',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true
      },
      {
        oid: '1.3.6.1.2.1.31.1.1.1.15',
        name: 'ifHighSpeed',
        description: '高速接口速度(Mbps)',
        syntax: 'Gauge32',
        access: 'read-only',
        status: 'current',
        mibModule: 'IF-MIB',
        vendors: ['*'],
        tested: true
      },

      // Cisco专用OID
      {
        oid: '1.3.6.1.4.1.9.9.109.1.1.1.1.2',
        name: 'cpmCPUTotal1min',
        description: 'CPU使用率(1分钟)',
        syntax: 'Gauge32',
        access: 'read-only',
        status: 'current',
        mibModule: 'CISCO-PROCESS-MIB',
        vendors: ['cisco'],
        tested: true
      },
      {
        oid: '1.3.6.1.4.1.9.9.109.1.1.1.1.3',
        name: 'cpmCPUTotal5min',
        description: 'CPU使用率(5分钟)',
        syntax: 'Gauge32',
        access: 'read-only',
        status: 'current',
        mibModule: 'CISCO-PROCESS-MIB',
        vendors: ['cisco'],
        tested: true
      },
      {
        oid: '1.3.6.1.4.1.9.9.48.1.1.1.5',
        name: 'ciscoMemoryPoolUsed',
        description: 'Cisco内存池已使用',
        syntax: 'Gauge32',
        access: 'read-only',
        status: 'current',
        mibModule: 'CISCO-MEMORY-POOL-MIB',
        vendors: ['cisco'],
        tested: true
      },
      {
        oid: '1.3.6.1.4.1.9.9.48.1.1.1.6',
        name: 'ciscoMemoryPoolFree',
        description: 'Cisco内存池空闲',
        syntax: 'Gauge32',
        access: 'read-only',
        status: 'current',
        mibModule: 'CISCO-MEMORY-POOL-MIB',
        vendors: ['cisco'],
        tested: true
      },
      {
        oid: '1.3.6.1.4.1.9.9.13.1.3.1.3',
        name: 'ciscoEnvMonTemperatureValue',
        description: 'Cisco环境温度值',
        syntax: 'Gauge32',
        access: 'read-only',
        status: 'current',
        mibModule: 'CISCO-ENVMON-MIB',
        vendors: ['cisco'],
        tested: true
      },

      // H3C专用OID
      {
        oid: '1.3.6.1.4.1.25506.2.6.1.1.1.1.6',
        name: 'hh3cEntityExtCpuUsage',
        description: 'H3C CPU使用率',
        syntax: 'Integer',
        access: 'read-only',
        status: 'current',
        mibModule: 'HH3C-ENTITY-EXT-MIB',
        vendors: ['h3c'],
        tested: true
      },
      {
        oid: '1.3.6.1.4.1.25506.2.6.1.1.1.1.8',
        name: 'hh3cEntityExtMemUsage',
        description: 'H3C内存使用率',
        syntax: 'Integer',
        access: 'read-only',
        status: 'current',
        mibModule: 'HH3C-ENTITY-EXT-MIB',
        vendors: ['h3c'],
        tested: true
      },
      {
        oid: '1.3.6.1.4.1.25506.2.6.1.1.1.1.12',
        name: 'hh3cEntityExtTemperature',
        description: 'H3C设备温度',
        syntax: 'Integer',
        access: 'read-only',
        status: 'current',
        mibModule: 'HH3C-ENTITY-EXT-MIB',
        vendors: ['h3c'],
        tested: true
      },

      // 华为专用OID
      {
        oid: '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.5',
        name: 'hwEntityCpuUsage',
        description: '华为CPU使用率',
        syntax: 'Integer',
        access: 'read-only',
        status: 'current',
        mibModule: 'HUAWEI-ENTITY-EXTENT-MIB',
        vendors: ['huawei'],
        tested: true
      },
      {
        oid: '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.7',
        name: 'hwEntityMemUsage',
        description: '华为内存使用率',
        syntax: 'Integer',
        access: 'read-only',
        status: 'current',
        mibModule: 'HUAWEI-ENTITY-EXTENT-MIB',
        vendors: ['huawei'],
        tested: true
      },
      {
        oid: '1.3.6.1.4.1.2011.5.25.31.1.1.1.1.11',
        name: 'hwEntityTemperature',
        description: '华为设备温度',
        syntax: 'Integer',
        access: 'read-only',
        status: 'current',
        mibModule: 'HUAWEI-ENTITY-EXTENT-MIB',
        vendors: ['huawei'],
        tested: true
      }
    ]

    standardOIDs.forEach(oid => {
      this.oidDatabase.set(oid.oid, oid)
    })
  }

  // 初始化厂商映射
  private initializeVendorMappings() {
    this.vendorMappings.set('cisco', [
      '1.3.6.1.4.1.9.9.109', // CISCO-PROCESS-MIB
      '1.3.6.1.4.1.9.9.48',  // CISCO-MEMORY-POOL-MIB
      '1.3.6.1.4.1.9.9.13',  // CISCO-ENVMON-MIB
      '1.3.6.1.4.1.9.9.46'   // CISCO-VTP-MIB
    ])

    this.vendorMappings.set('h3c', [
      '1.3.6.1.4.1.25506.2.6',  // HH3C-ENTITY-EXT-MIB
      '1.3.6.1.4.1.25506.8.35'  // HH3C-ENTITY-STATE-MIB
    ])

    this.vendorMappings.set('huawei', [
      '1.3.6.1.4.1.2011.5.25.31', // HUAWEI-ENTITY-EXTENT-MIB
      '1.3.6.1.4.1.2011.2.235'    // HUAWEI-BMC-MIB
    ])
  }

  // 验证配置模板
  async validateConfigurationTemplate(configContent: string, templateType: 'snmp_exporter' | 'categraf'): Promise<MIBValidationResult> {
    const result: MIBValidationResult = {
      valid: true,
      oidCount: 0,
      errors: [],
      warnings: [],
      suggestions: [],
      coverage: {
        system: 0,
        interfaces: 0,
        performance: 0,
        environment: 0
      },
      vendorSpecific: []
    }

    try {
      let extractedOIDs: string[] = []

      if (templateType === 'snmp_exporter') {
        extractedOIDs = this.extractOIDsFromSNMPExporter(configContent)
      } else if (templateType === 'categraf') {
        extractedOIDs = this.extractOIDsFromCategraf(configContent)
      }

      result.oidCount = extractedOIDs.length

      // 验证每个OID
      for (const oid of extractedOIDs) {
        const oidInfo = this.oidDatabase.get(oid)
        
        if (!oidInfo) {
          // 尝试查找父OID
          const parentOid = this.findParentOID(oid)
          if (!parentOid) {
            result.warnings.push(`未知OID: ${oid}`)
          }
        } else {
          // 检查OID状态
          if (oidInfo.status === 'deprecated') {
            result.warnings.push(`已弃用的OID: ${oid} (${oidInfo.name})`)
          } else if (oidInfo.status === 'obsolete') {
            result.errors.push(`已废弃的OID: ${oid} (${oidInfo.name})`)
          }
        }
      }

      // 计算覆盖度
      result.coverage = this.calculateCoverage(extractedOIDs)

      // 检查厂商特定覆盖度
      result.vendorSpecific = this.calculateVendorCoverage(extractedOIDs)

      // 添加建议
      this.addOptimizationSuggestions(result, extractedOIDs)

      if (result.errors.length > 0) {
        result.valid = false
      }

    } catch (error) {
      result.valid = false
      result.errors.push(`配置解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    return result
  }

  // 从SNMP Exporter配置中提取OID
  private extractOIDsFromSNMPExporter(configContent: string): string[] {
    const oids: string[] = []
    const lines = configContent.split('\n')
    
    let inWalkSection = false
    let inGetSection = false
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      if (trimmedLine === 'walk:') {
        inWalkSection = true
        inGetSection = false
        continue
      } else if (trimmedLine === 'get:') {
        inGetSection = true
        inWalkSection = false
        continue
      } else if (trimmedLine.startsWith('lookups:') || trimmedLine.startsWith('overrides:')) {
        inWalkSection = false
        inGetSection = false
        continue
      }
      
      if ((inWalkSection || inGetSection) && trimmedLine.startsWith('-')) {
        const oidMatch = trimmedLine.match(/- ([\d\.]+)/)
        if (oidMatch) {
          oids.push(oidMatch[1])
        }
      }
    }
    
    return oids
  }

  // 从Categraf配置中提取OID
  private extractOIDsFromCategraf(configContent: string): string[] {
    const oids: string[] = []
    const lines = configContent.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // 匹配 oid = "1.3.6.1...." 格式
      const oidMatch = trimmedLine.match(/oid\s*=\s*["']([^"']+)["']/)
      if (oidMatch) {
        oids.push(oidMatch[1])
      }
    }
    
    return oids
  }

  // 查找父OID
  private findParentOID(oid: string): OIDInfo | null {
    const parts = oid.split('.')
    
    // 从最长到最短查找父OID
    for (let i = parts.length - 1; i > 0; i--) {
      const parentOid = parts.slice(0, i).join('.')
      const found = this.oidDatabase.get(parentOid)
      if (found) {
        return found
      }
    }
    
    return null
  }

  // 计算覆盖度
  private calculateCoverage(oids: string[]): any {
    const coverage = {
      system: 0,
      interfaces: 0,
      performance: 0,
      environment: 0
    }

    const systemOIDs = oids.filter(oid => oid.startsWith('1.3.6.1.2.1.1'))
    const interfaceOIDs = oids.filter(oid => oid.startsWith('1.3.6.1.2.1.2') || oid.startsWith('1.3.6.1.2.1.31'))
    const performanceOIDs = oids.filter(oid => 
      oid.includes('.109.') || // Cisco CPU
      oid.includes('.48.') ||  // Cisco Memory
      oid.includes('.25506.2.6') // H3C Performance
    )
    const environmentOIDs = oids.filter(oid => 
      oid.includes('.13.') || // Cisco Environment
      oid.includes('temperature') ||
      oid.includes('fan')
    )

    coverage.system = Math.min((systemOIDs.length / 6) * 100, 100) // 6个基础系统OID
    coverage.interfaces = Math.min((interfaceOIDs.length / 10) * 100, 100) // 10个基础接口OID
    coverage.performance = Math.min((performanceOIDs.length / 5) * 100, 100) // 5个基础性能OID
    coverage.environment = Math.min((environmentOIDs.length / 3) * 100, 100) // 3个基础环境OID

    return coverage
  }

  // 计算厂商特定覆盖度
  private calculateVendorCoverage(oids: string[]): any[] {
    const vendorCoverage: any[] = []

    for (const [vendor, vendorOIDPrefixes] of this.vendorMappings) {
      const vendorOIDs = oids.filter(oid => 
        vendorOIDPrefixes.some(prefix => oid.startsWith(prefix))
      )
      
      if (vendorOIDs.length > 0) {
        vendorCoverage.push({
          vendor,
          oidCount: vendorOIDs.length,
          coverage: Math.min((vendorOIDs.length / 10) * 100, 100) // 假设10个为满分
        })
      }
    }

    return vendorCoverage
  }

  // 添加优化建议
  private addOptimizationSuggestions(result: MIBValidationResult, oids: string[]) {
    // 检查是否缺少基础系统信息
    const hasSystemInfo = oids.some(oid => oid.startsWith('1.3.6.1.2.1.1'))
    if (!hasSystemInfo) {
      result.suggestions.push('建议添加基础系统信息OID (1.3.6.1.2.1.1.*)')
    }

    // 检查是否有接口监控
    const hasInterfaceInfo = oids.some(oid => oid.startsWith('1.3.6.1.2.1.2'))
    if (!hasInterfaceInfo) {
      result.suggestions.push('建议添加接口监控OID (1.3.6.1.2.1.2.*)')
    }

    // 检查是否使用了高速计数器
    const hasHighSpeedCounters = oids.some(oid => oid.startsWith('1.3.6.1.2.1.31'))
    if (hasInterfaceInfo && !hasHighSpeedCounters) {
      result.suggestions.push('建议使用64位高速计数器 (1.3.6.1.2.1.31.*) 以支持高速接口')
    }

    // 检查性能监控覆盖度
    if (result.coverage.performance < 50) {
      result.suggestions.push('建议添加更多性能监控OID (CPU、内存、温度等)')
    }

    // 检查厂商特定OID
    const hasVendorSpecific = result.vendorSpecific.length > 0
    if (!hasVendorSpecific) {
      result.suggestions.push('建议根据设备厂商添加专用监控OID以获得更详细的监控数据')
    }
  }

  // 测试OID在真实设备上的可用性
  async testOIDOnDevice(oid: string, deviceConfig: {ip: string, community: string, version: string}): Promise<OIDTestResult> {
    const startTime = Date.now()
    const result: OIDTestResult = {
      deviceType: 'unknown',
      vendor: 'unknown',
      model: 'unknown',
      ip: deviceConfig.ip,
      success: false,
      responseTime: 0,
      timestamp: new Date()
    }

    try {
      const version = deviceConfig.version === '1' ? '1' : deviceConfig.version === '3' ? '3' : '2c'
      const command = `snmpget -v${version} -c ${deviceConfig.community} -r1 -t3 ${deviceConfig.ip} ${oid}`
      
      const { stdout, stderr } = await execAsync(command, { timeout: 5000 })
      
      if (stdout && !stderr) {
        result.success = true
        result.value = this.parseSnmpValue(stdout)
        
        // 尝试识别设备类型和厂商
        if (oid === '1.3.6.1.2.1.1.1.0' && result.value) {
          const deviceInfo = this.parseDeviceInfo(result.value)
          result.deviceType = deviceInfo.type
          result.vendor = deviceInfo.vendor
          result.model = deviceInfo.model
        }
      } else {
        result.error = stderr || 'No response'
      }
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error'
    }

    result.responseTime = Date.now() - startTime
    return result
  }

  // 解析SNMP返回值
  private parseSnmpValue(snmpOutput: string): string {
    const lines = snmpOutput.trim().split('\n')
    for (const line of lines) {
      if (line.includes('=')) {
        const parts = line.split('=', 2)
        if (parts.length === 2) {
          let value = parts[1].trim()
          // 移除类型前缀和引号
          value = value.replace(/^[A-Z-]+:\s*/, '')
          value = value.replace(/^"(.*)"$/, '$1')
          return value
        }
      }
    }
    return snmpOutput.trim()
  }

  // 解析设备信息
  private parseDeviceInfo(sysDescr: string): {type: string, vendor: string, model: string} {
    const lowerDescr = sysDescr.toLowerCase()
    
    let vendor = 'unknown'
    let type = 'switch'
    let model = 'unknown'

    if (lowerDescr.includes('cisco')) {
      vendor = 'cisco'
      if (lowerDescr.includes('catalyst')) {
        type = 'switch'
        const modelMatch = sysDescr.match(/catalyst\s+(\d+)/i)
        if (modelMatch) {
          model = `Catalyst ${modelMatch[1]}`
        }
      } else if (lowerDescr.includes('router')) {
        type = 'router'
      }
    } else if (lowerDescr.includes('h3c') || lowerDescr.includes('3com')) {
      vendor = 'h3c'
      if (lowerDescr.includes('switch')) {
        type = 'switch'
      }
    } else if (lowerDescr.includes('huawei')) {
      vendor = 'huawei'
      if (lowerDescr.includes('switch')) {
        type = 'switch'
      }
    } else if (lowerDescr.includes('juniper')) {
      vendor = 'juniper'
      type = 'router'
    }

    return { type, vendor, model }
  }

  // 批量测试配置中的所有OID
  async batchTestOIDs(oids: string[], deviceConfig: {ip: string, community: string, version: string}): Promise<OIDTestResult[]> {
    const results: OIDTestResult[] = []
    
    // 限制并发数量以避免设备过载
    const maxConcurrent = 5
    
    for (let i = 0; i < oids.length; i += maxConcurrent) {
      const batch = oids.slice(i, i + maxConcurrent)
      
      const batchPromises = batch.map(oid => this.testOIDOnDevice(oid, deviceConfig))
      const batchResults = await Promise.allSettled(batchPromises)
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        }
      }
      
      // 在批次间添加小延迟
      if (i + maxConcurrent < oids.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    return results
  }

  // 根据测试结果优化配置
  optimizeConfigurationBasedOnTests(testResults: OIDTestResult[]): string[] {
    const successfulOIDs = testResults
      .filter(result => result.success)
      .map(result => this.oidDatabase.get(result.deviceType))
      .filter(Boolean)
      .map(oid => oid!.oid)

    const recommendations: string[] = []

    // 根据设备厂商推荐OID
    const vendorResults = testResults.filter(r => r.vendor !== 'unknown')
    if (vendorResults.length > 0) {
      const primaryVendor = vendorResults[0].vendor
      const vendorOIDs = this.vendorMappings.get(primaryVendor)
      
      if (vendorOIDs) {
        recommendations.push(`检测到${primaryVendor}设备，建议添加以下厂商特定OID:`)
        vendorOIDs.forEach(prefix => {
          const relevantOIDs = Array.from(this.oidDatabase.values())
            .filter(oid => oid.oid.startsWith(prefix) && oid.vendors.includes(primaryVendor))
            .slice(0, 5) // 限制推荐数量
          
          relevantOIDs.forEach(oid => {
            recommendations.push(`  ${oid.oid} - ${oid.name} (${oid.description})`)
          })
        })
      }
    }

    return recommendations
  }

  // 获取OID信息
  getOIDInfo(oid: string): OIDInfo | undefined {
    return this.oidDatabase.get(oid)
  }

  // 搜索OID
  searchOIDs(query: string, vendor?: string): OIDInfo[] {
    const results: OIDInfo[] = []
    const lowerQuery = query.toLowerCase()

    for (const oidInfo of this.oidDatabase.values()) {
      const matchesQuery = 
        oidInfo.oid.includes(query) ||
        oidInfo.name.toLowerCase().includes(lowerQuery) ||
        oidInfo.description.toLowerCase().includes(lowerQuery)

      const matchesVendor = !vendor || 
        oidInfo.vendors.includes(vendor) || 
        oidInfo.vendors.includes('*')

      if (matchesQuery && matchesVendor) {
        results.push(oidInfo)
      }
    }

    return results.slice(0, 50) // 限制结果数量
  }

  // 添加自定义OID
  addCustomOID(oidInfo: OIDInfo): void {
    this.oidDatabase.set(oidInfo.oid, oidInfo)
  }

  // 导出OID数据库
  exportOIDDatabase(): any {
    return {
      oids: Array.from(this.oidDatabase.values()),
      vendorMappings: Array.from(this.vendorMappings.entries()),
      exportDate: new Date().toISOString()
    }
  }

  // 导入OID数据库
  importOIDDatabase(data: any): void {
    if (data.oids && Array.isArray(data.oids)) {
      data.oids.forEach((oid: OIDInfo) => {
        this.oidDatabase.set(oid.oid, oid)
      })
    }

    if (data.vendorMappings && Array.isArray(data.vendorMappings)) {
      data.vendorMappings.forEach(([vendor, mappings]: [string, string[]]) => {
        this.vendorMappings.set(vendor, mappings)
      })
    }
  }
}

// 导出管理器实例
export const enhancedOIDManager = new EnhancedOIDManager()