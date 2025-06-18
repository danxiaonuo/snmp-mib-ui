// 服务器品牌检测和配置推荐系统
export interface ServerBrandInfo {
  brand: string
  model?: string
  managementInterface: string
  recommendedTemplate: string
  confidence: number
  detectionMethod: string
}

export interface ServerDetectionRule {
  brand: string
  patterns: {
    sysDescr?: RegExp[]
    sysObjectID?: string[]
    vendorOID?: string[]
    managementIP?: RegExp[]
  }
  managementInterface: string
  templateId: string
  confidence: number
}

// 服务器品牌检测规则
export const SERVER_DETECTION_RULES: ServerDetectionRule[] = [
  // Dell服务器检测
  {
    brand: 'Dell',
    patterns: {
      sysDescr: [
        /Dell.*PowerEdge/i,
        /Dell.*iDRAC/i,
        /PowerEdge.*Dell/i
      ],
      sysObjectID: [
        '1.3.6.1.4.1.674.10892.5',  // Dell iDRAC
        '1.3.6.1.4.1.674.10892.2'   // Dell OpenManage
      ],
      vendorOID: ['1.3.6.1.4.1.674']
    },
    managementInterface: 'iDRAC',
    templateId: 'server-dell-idrac',
    confidence: 95
  },
  
  // HP服务器检测
  {
    brand: 'HP/HPE',
    patterns: {
      sysDescr: [
        /HP.*ProLiant/i,
        /HPE.*ProLiant/i,
        /Hewlett.*Packard.*ProLiant/i,
        /iLO/i
      ],
      sysObjectID: [
        '1.3.6.1.4.1.232.9.4.10',   // HP ProLiant
        '1.3.6.1.4.1.232.9.4.11'    // HP iLO
      ],
      vendorOID: ['1.3.6.1.4.1.232']
    },
    managementInterface: 'iLO',
    templateId: 'server-hp-ilo',
    confidence: 95
  },
  
  // Lenovo服务器检测
  {
    brand: 'Lenovo',
    patterns: {
      sysDescr: [
        /Lenovo.*ThinkSystem/i,
        /Lenovo.*System.*x/i,
        /ThinkServer/i,
        /XCC/i,
        /IMM2/i
      ],
      sysObjectID: [
        '1.3.6.1.4.1.19046.11.1.1', // Lenovo XCC
        '1.3.6.1.4.1.19046.11.1.2'  // Lenovo IMM2
      ],
      vendorOID: ['1.3.6.1.4.1.19046']
    },
    managementInterface: 'XCC/IMM2',
    templateId: 'server-lenovo-xcc',
    confidence: 95
  },
  
  // Supermicro服务器检测
  {
    brand: 'Supermicro',
    patterns: {
      sysDescr: [
        /Supermicro/i,
        /Super.*Micro/i,
        /IPMI.*BMC/i
      ],
      sysObjectID: [
        '1.3.6.1.4.1.10876.2.1',    // Supermicro IPMI
        '1.3.6.1.4.1.10876.2.2'     // Supermicro BMC
      ],
      vendorOID: ['1.3.6.1.4.1.10876']
    },
    managementInterface: 'IPMI/BMC',
    templateId: 'server-supermicro-ipmi',
    confidence: 90
  },
  
  // 浪潮服务器检测
  {
    brand: '浪潮/Inspur',
    patterns: {
      sysDescr: [
        /Inspur/i,
        /浪潮/i,
        /EITC/i,
        /NF\d+/i
      ],
      sysObjectID: [
        '1.3.6.1.4.1.2011.2.235',   // 浪潮BMC
        '1.3.6.1.4.1.2011.2.236'    // 浪潮服务器
      ],
      vendorOID: ['1.3.6.1.4.1.2011']
    },
    managementInterface: 'BMC',
    templateId: 'server-inspur-bmc',
    confidence: 90
  },
  
  // IBM服务器检测
  {
    brand: 'IBM',
    patterns: {
      sysDescr: [
        /IBM.*System.*x/i,
        /IBM.*BladeCenter/i,
        /IBM.*xSeries/i,
        /IMM/i
      ],
      sysObjectID: [
        '1.3.6.1.4.1.2.3.51.3',     // IBM IMM
        '1.3.6.1.4.1.2.3.51.2'      // IBM System x
      ],
      vendorOID: ['1.3.6.1.4.1.2']
    },
    managementInterface: 'IMM/BMC',
    templateId: 'server-universal-snmp', // 使用通用模板，因为没有专用的IBM模板
    confidence: 85
  },
  
  // 通用服务器检测（兜底）
  {
    brand: 'Generic',
    patterns: {
      sysDescr: [
        /Linux/i,
        /Windows/i,
        /Server/i,
        /Computer/i
      ]
    },
    managementInterface: 'SNMP',
    templateId: 'server-universal-snmp',
    confidence: 50
  }
]

/**
 * 根据SNMP信息检测服务器品牌
 */
export function detectServerBrand(snmpInfo: {
  sysDescr?: string
  sysObjectID?: string
  vendorOID?: string
  managementIP?: string
}): ServerBrandInfo[] {
  const results: ServerBrandInfo[] = []
  
  for (const rule of SERVER_DETECTION_RULES) {
    let confidence = 0
    let matchCount = 0
    let totalChecks = 0
    
    // 检查系统描述
    if (snmpInfo.sysDescr && rule.patterns.sysDescr) {
      totalChecks++
      for (const pattern of rule.patterns.sysDescr) {
        if (pattern.test(snmpInfo.sysDescr)) {
          matchCount++
          confidence += 30
          break
        }
      }
    }
    
    // 检查系统对象ID
    if (snmpInfo.sysObjectID && rule.patterns.sysObjectID) {
      totalChecks++
      for (const oid of rule.patterns.sysObjectID) {
        if (snmpInfo.sysObjectID.startsWith(oid)) {
          matchCount++
          confidence += 40
          break
        }
      }
    }
    
    // 检查厂商OID
    if (snmpInfo.vendorOID && rule.patterns.vendorOID) {
      totalChecks++
      for (const oid of rule.patterns.vendorOID) {
        if (snmpInfo.vendorOID.startsWith(oid)) {
          matchCount++
          confidence += 25
          break
        }
      }
    }
    
    // 检查管理IP模式
    if (snmpInfo.managementIP && rule.patterns.managementIP) {
      totalChecks++
      for (const pattern of rule.patterns.managementIP) {
        if (pattern.test(snmpInfo.managementIP)) {
          matchCount++
          confidence += 15
          break
        }
      }
    }
    
    // 如果有匹配，添加到结果中
    if (matchCount > 0) {
      // 计算最终置信度
      const finalConfidence = Math.min(confidence, rule.confidence)
      
      results.push({
        brand: rule.brand,
        managementInterface: rule.managementInterface,
        recommendedTemplate: rule.templateId,
        confidence: finalConfidence,
        detectionMethod: `匹配 ${matchCount}/${totalChecks} 个检测规则`
      })
    }
  }
  
  // 按置信度排序
  return results.sort((a, b) => b.confidence - a.confidence)
}

/**
 * 获取推荐的服务器监控配置
 */
export function getRecommendedServerConfig(brandInfo: ServerBrandInfo): {
  templateId: string
  description: string
  features: string[]
  requirements: string[]
} {
  const configs = {
    'server-dell-idrac': {
      templateId: 'server-dell-idrac',
      description: 'Dell PowerEdge服务器专用配置，通过iDRAC获取详细硬件信息',
      features: [
        '完整的硬件健康监控',
        'CPU、内存、温度、风扇、电源状态',
        '磁盘阵列状态监控',
        'Dell专用MIB支持'
      ],
      requirements: [
        'iDRAC已启用SNMP',
        'SNMP Community配置正确',
        '网络连通性正常'
      ]
    },
    'server-hp-ilo': {
      templateId: 'server-hp-ilo',
      description: 'HP ProLiant服务器专用配置，通过iLO获取详细硬件信息',
      features: [
        'HP Insight Manager兼容',
        'CPU、内存、温度监控',
        '风扇、电源状态监控',
        '磁盘阵列健康状态'
      ],
      requirements: [
        'iLO已启用SNMP',
        'HP MIB文件已安装',
        'SNMP Community配置正确'
      ]
    },
    'server-lenovo-xcc': {
      templateId: 'server-lenovo-xcc',
      description: 'Lenovo ThinkSystem服务器专用配置，通过XCC/IMM2获取硬件信息',
      features: [
        'Lenovo XClarity兼容',
        '温度、风扇、电源监控',
        '系统健康状态监控',
        '电压传感器监控'
      ],
      requirements: [
        'XCC/IMM2已启用SNMP',
        'Lenovo MIB支持',
        '管理网络连通'
      ]
    },
    'server-supermicro-ipmi': {
      templateId: 'server-supermicro-ipmi',
      description: 'Supermicro服务器IPMI监控配置，获取基础硬件状态',
      features: [
        'IPMI传感器数据',
        '温度、风扇监控',
        '电源、电压状态',
        '标准IPMI MIB支持'
      ],
      requirements: [
        'IPMI已启用',
        'SNMP代理配置',
        'BMC网络可达'
      ]
    },
    'server-inspur-bmc': {
      templateId: 'server-inspur-bmc',
      description: '浪潮服务器BMC监控配置，支持国产服务器硬件监控',
      features: [
        '浪潮专用MIB支持',
        'CPU、内存状态监控',
        '温度、风扇、电源监控',
        '系统健康状态'
      ],
      requirements: [
        'BMC已启用SNMP',
        '浪潮MIB文件',
        '管理网络配置'
      ]
    },
    'server-universal-snmp': {
      templateId: 'server-universal-snmp',
      description: '通用服务器SNMP监控配置，兼容多种服务器品牌',
      features: [
        '标准HOST-RESOURCES-MIB',
        '基础系统信息监控',
        '多品牌兼容性',
        '通用硬件状态'
      ],
      requirements: [
        'SNMP服务已启用',
        '标准MIB支持',
        'Community字符串配置'
      ]
    }
  }
  
  return configs[brandInfo.recommendedTemplate] || configs['server-universal-snmp']
}

/**
 * 生成服务器监控配置建议
 */
export function generateServerMonitoringAdvice(detectionResults: ServerBrandInfo[]): {
  primaryRecommendation: ServerBrandInfo
  alternativeOptions: ServerBrandInfo[]
  configurationSteps: string[]
  troubleshootingTips: string[]
} {
  const primary = detectionResults[0]
  const alternatives = detectionResults.slice(1, 3)
  
  const configSteps = [
    '1. 确认服务器管理接口（iDRAC/iLO/XCC/BMC）已启用',
    '2. 配置SNMP Community字符串',
    '3. 确保管理网络连通性',
    '4. 测试SNMP连接',
    '5. 部署推荐的监控配置模板',
    '6. 验证监控数据采集'
  ]
  
  const troubleshootingTips = [
    '如果SNMP连接失败，检查防火墙设置',
    '确认SNMP版本兼容性（建议使用SNMPv2c）',
    '验证Community字符串是否正确',
    '检查管理接口IP地址是否可达',
    '确认MIB文件是否正确加载',
    '如果专用模板不工作，尝试通用模板'
  ]
  
  return {
    primaryRecommendation: primary,
    alternativeOptions: alternatives,
    configurationSteps: configSteps,
    troubleshootingTips: troubleshootingTips
  }
}