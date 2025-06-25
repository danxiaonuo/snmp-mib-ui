// 完整的监控配置模板库
export interface ConfigTemplate {
  id: string
  name: string
  type: 'snmp_exporter' | 'categraf' | 'prometheus' | 'telegraf'
  description: string
  category: string
  deviceTypes: string[]
  config: string
  parameters: ConfigParameter[]
}

export interface ConfigParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'array'
  description: string
  defaultValue: any
  required: boolean
  options?: string[]
}

// SNMP Exporter 完整配置模板
export const SNMP_EXPORTER_TEMPLATES: ConfigTemplate[] = [
  {
    id: 'cisco-switch-complete',
    name: 'Cisco 交换机完整监控',
    type: 'snmp_exporter',
    description: '适用于Cisco Catalyst系列交换机的完整SNMP监控配置',
    category: '网络设备',
    deviceTypes: ['cisco-switch', 'catalyst'],
    config: `modules:
  cisco_sw:
    walk:
      # 系统信息
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.1.4.0      # sysContact
      - 1.3.6.1.2.1.1.5.0      # sysName
      - 1.3.6.1.2.1.1.6.0      # sysLocation
      
      # 接口信息
      - 1.3.6.1.2.1.2.2.1.1    # ifIndex
      - 1.3.6.1.2.1.2.2.1.2    # ifDescr
      - 1.3.6.1.2.1.2.2.1.3    # ifType
      - 1.3.6.1.2.1.2.2.1.5    # ifSpeed
      - 1.3.6.1.2.1.2.2.1.7    # ifAdminStatus
      - 1.3.6.1.2.1.2.2.1.8    # ifOperStatus
      - 1.3.6.1.2.1.2.2.1.9    # ifLastChange
      - 1.3.6.1.2.1.2.2.1.10   # ifInOctets
      - 1.3.6.1.2.1.2.2.1.11   # ifInUcastPkts
      - 1.3.6.1.2.1.2.2.1.12   # ifInNUcastPkts
      - 1.3.6.1.2.1.2.2.1.13   # ifInDiscards
      - 1.3.6.1.2.1.2.2.1.14   # ifInErrors
      - 1.3.6.1.2.1.2.2.1.16   # ifOutOctets
      - 1.3.6.1.2.1.2.2.1.17   # ifOutUcastPkts
      - 1.3.6.1.2.1.2.2.1.18   # ifOutNUcastPkts
      - 1.3.6.1.2.1.2.2.1.19   # ifOutDiscards
      - 1.3.6.1.2.1.2.2.1.20   # ifOutErrors
      
      # 高速接口计数器 (64位)
      - 1.3.6.1.2.1.31.1.1.1.1  # ifName
      - 1.3.6.1.2.1.31.1.1.1.6  # ifHCInOctets
      - 1.3.6.1.2.1.31.1.1.1.10 # ifHCOutOctets
      - 1.3.6.1.2.1.31.1.1.1.15 # ifHighSpeed
      
      # CPU和内存
      - 1.3.6.1.4.1.9.9.109.1.1.1.1.2  # cpmCPUTotal1min
      - 1.3.6.1.4.1.9.9.109.1.1.1.1.3  # cpmCPUTotal5min
      - 1.3.6.1.4.1.9.9.109.1.1.1.1.4  # cpmCPUTotal1hr
      - 1.3.6.1.4.1.9.9.48.1.1.1.5     # ciscoMemoryPoolUsed
      - 1.3.6.1.4.1.9.9.48.1.1.1.6     # ciscoMemoryPoolFree
      
      # 温度传感器
      - 1.3.6.1.4.1.9.9.13.1.3.1.3     # ciscoEnvMonTemperatureValue
      - 1.3.6.1.4.1.9.9.13.1.3.1.6     # ciscoEnvMonTemperatureState
      
      # 电源状态
      - 1.3.6.1.4.1.9.9.13.1.5.1.3     # ciscoEnvMonSupplyState
      
      # 风扇状态
      - 1.3.6.1.4.1.9.9.13.1.4.1.3     # ciscoEnvMonFanState
      
      # VLAN信息
      - 1.3.6.1.4.1.9.9.46.1.3.1.1.2   # vtpVlanName
      - 1.3.6.1.4.1.9.9.46.1.3.1.1.3   # vtpVlanState
      
      # STP信息
      - 1.3.6.1.2.1.17.2.15.1.3        # dot1dStpPortState
      - 1.3.6.1.2.1.17.1.4.0           # dot1dStpRootCost
      
    lookups:
      - source_indexes: [ifIndex]
        lookup: 1.3.6.1.2.1.2.2.1.2  # ifDescr
        drop_source_indexes: false
      - source_indexes: [ifIndex]
        lookup: 1.3.6.1.2.1.31.1.1.1.1  # ifName
        drop_source_indexes: false
        
    overrides:
      1.3.6.1.2.1.1.3.0:
        ignore: true  # Ignore sysUpTime, use metric timestamp
      1.3.6.1.2.1.2.2.1.8:
        type: EnumAsStateSet
      1.3.6.1.2.1.2.2.1.7:
        type: EnumAsStateSet
        
    auth:
      community: {{community}}
    version: {{version}}
    timeout: {{timeout}}s
    retries: {{retries}}
    max_repetitions: {{max_repetitions}}`,
    parameters: [
      {
        name: 'community',
        type: 'string',
        description: 'SNMP Community字符串',
        defaultValue: 'public',
        required: true
      },
      {
        name: 'version',
        type: 'select',
        description: 'SNMP版本',
        defaultValue: '2',
        required: true,
        options: ['1', '2', '3']
      },
      {
        name: 'timeout',
        type: 'number',
        description: '超时时间(秒)',
        defaultValue: 5,
        required: true
      },
      {
        name: 'retries',
        type: 'number',
        description: '重试次数',
        defaultValue: 3,
        required: true
      },
      {
        name: 'max_repetitions',
        type: 'number',
        description: '最大重复次数',
        defaultValue: 25,
        required: true
      }
    ]
  },
  
  {
    id: 'huawei-switch-complete',
    name: '华为交换机完整监控',
    type: 'snmp_exporter',
    description: '适用于华为S系列交换机的完整SNMP监控配置',
    category: '网络设备',
    deviceTypes: ['huawei-switch', 's-series'],
    config: `modules:
  huawei_sw:
    walk:
      # 系统信息
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.1.4.0      # sysContact
      - 1.3.6.1.2.1.1.5.0      # sysName
      - 1.3.6.1.2.1.1.6.0      # sysLocation
      
      # 接口信息 (标准MIB)
      - 1.3.6.1.2.1.2.2.1.1    # ifIndex
      - 1.3.6.1.2.1.2.2.1.2    # ifDescr
      - 1.3.6.1.2.1.2.2.1.3    # ifType
      - 1.3.6.1.2.1.2.2.1.5    # ifSpeed
      - 1.3.6.1.2.1.2.2.1.7    # ifAdminStatus
      - 1.3.6.1.2.1.2.2.1.8    # ifOperStatus
      - 1.3.6.1.2.1.2.2.1.10   # ifInOctets
      - 1.3.6.1.2.1.2.2.1.11   # ifInUcastPkts
      - 1.3.6.1.2.1.2.2.1.13   # ifInDiscards
      - 1.3.6.1.2.1.2.2.1.14   # ifInErrors
      - 1.3.6.1.2.1.2.2.1.16   # ifOutOctets
      - 1.3.6.1.2.1.2.2.1.17   # ifOutUcastPkts
      - 1.3.6.1.2.1.2.2.1.19   # ifOutDiscards
      - 1.3.6.1.2.1.2.2.1.20   # ifOutErrors
      
      # 华为私有MIB - CPU和内存
      - 1.3.6.1.4.1.2011.5.25.31.1.1.1.1.5   # hwEntityCpuUsage
      - 1.3.6.1.4.1.2011.5.25.31.1.1.1.1.7   # hwEntityMemUsage
      - 1.3.6.1.4.1.2011.5.25.31.1.1.1.1.11  # hwEntityTemperature
      
      # 华为设备状态
      - 1.3.6.1.4.1.2011.5.25.31.1.1.1.1.1   # hwEntityBomId
      - 1.3.6.1.4.1.2011.5.25.31.1.1.1.1.2   # hwEntityBomEnDesc
      
      # 电源和风扇状态
      - 1.3.6.1.4.1.2011.5.25.31.1.1.1.1.12  # hwEntityFanSpeed
      - 1.3.6.1.4.1.2011.5.25.31.1.1.1.1.19  # hwEntityPowerStatus
      
      # VLAN信息
      - 1.3.6.1.2.1.17.7.1.4.2.1.3          # dot1qVlanStaticName
      
    lookups:
      - source_indexes: [ifIndex]
        lookup: 1.3.6.1.2.1.2.2.1.2
        drop_source_indexes: false
        
    overrides:
      1.3.6.1.2.1.2.2.1.8:
        type: EnumAsStateSet
      1.3.6.1.2.1.2.2.1.7:
        type: EnumAsStateSet
        
    auth:
      community: {{community}}
    version: {{version}}
    timeout: {{timeout}}s
    retries: {{retries}}`,
    parameters: [
      {
        name: 'community',
        type: 'string',
        description: 'SNMP Community字符串',
        defaultValue: 'public',
        required: true
      },
      {
        name: 'version',
        type: 'select',
        description: 'SNMP版本',
        defaultValue: '2',
        required: true,
        options: ['1', '2', '3']
      },
      {
        name: 'timeout',
        type: 'number',
        description: '超时时间(秒)',
        defaultValue: 5,
        required: true
      },
      {
        name: 'retries',
        type: 'number',
        description: '重试次数',
        defaultValue: 3,
        required: true
      }
    ]
  }
]

// H3C交换机配置模板
export const H3C_TEMPLATES: ConfigTemplate[] = [
  {
    id: 'h3c-switch-complete',
    name: 'H3C交换机完整监控',
    type: 'snmp_exporter',
    description: '适用于H3C S系列交换机的完整SNMP监控配置',
    category: '网络设备',
    deviceTypes: ['h3c-switch', 'h3c-s-series'],
    config: `modules:
  h3c_sw:
    walk:
      # 系统信息
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.1.4.0      # sysContact
      - 1.3.6.1.2.1.1.5.0      # sysName
      - 1.3.6.1.2.1.1.6.0      # sysLocation
      
      # 接口信息 (标准MIB)
      - 1.3.6.1.2.1.2.2.1.1    # ifIndex
      - 1.3.6.1.2.1.2.2.1.2    # ifDescr
      - 1.3.6.1.2.1.2.2.1.3    # ifType
      - 1.3.6.1.2.1.2.2.1.5    # ifSpeed
      - 1.3.6.1.2.1.2.2.1.7    # ifAdminStatus
      - 1.3.6.1.2.1.2.2.1.8    # ifOperStatus
      - 1.3.6.1.2.1.2.2.1.10   # ifInOctets
      - 1.3.6.1.2.1.2.2.1.11   # ifInUcastPkts
      - 1.3.6.1.2.1.2.2.1.13   # ifInDiscards
      - 1.3.6.1.2.1.2.2.1.14   # ifInErrors
      - 1.3.6.1.2.1.2.2.1.16   # ifOutOctets
      - 1.3.6.1.2.1.2.2.1.17   # ifOutUcastPkts
      - 1.3.6.1.2.1.2.2.1.19   # ifOutDiscards
      - 1.3.6.1.2.1.2.2.1.20   # ifOutErrors
      
      # H3C私有MIB - CPU和内存
      - 1.3.6.1.4.1.25506.2.6.1.1.1.1.6   # hh3cEntityExtCpuUsage
      - 1.3.6.1.4.1.25506.2.6.1.1.1.1.8   # hh3cEntityExtMemUsage
      - 1.3.6.1.4.1.25506.2.6.1.1.1.1.12  # hh3cEntityExtTemperature
      
      # H3C设备状态
      - 1.3.6.1.4.1.25506.8.35.9.1.1      # hh3cEntityExtStateTable
      - 1.3.6.1.4.1.25506.8.35.9.1.2      # hh3cEntityExtErrorStatus
      
      # 电源和风扇状态
      - 1.3.6.1.4.1.25506.2.6.1.1.1.1.19  # hh3cEntityExtFanSpeed
      - 1.3.6.1.4.1.25506.2.6.1.1.1.1.11  # hh3cEntityExtVoltage
      
    lookups:
      - source_indexes: [ifIndex]
        lookup: 1.3.6.1.2.1.2.2.1.2
        drop_source_indexes: false
        
    overrides:
      1.3.6.1.2.1.2.2.1.8:
        type: EnumAsStateSet
      1.3.6.1.2.1.2.2.1.7:
        type: EnumAsStateSet
        
    auth:
      community: {{community}}
    version: {{version}}
    timeout: {{timeout}}s
    retries: {{retries}}`,
    parameters: [
      {
        name: 'community',
        type: 'string',
        description: 'SNMP Community字符串',
        defaultValue: 'public',
        required: true
      },
      {
        name: 'version',
        type: 'select',
        description: 'SNMP版本',
        defaultValue: '2',
        required: true,
        options: ['1', '2', '3']
      },
      {
        name: 'timeout',
        type: 'number',
        description: '超时时间(秒)',
        defaultValue: 5,
        required: true
      },
      {
        name: 'retries',
        type: 'number',
        description: '重试次数',
        defaultValue: 3,
        required: true
      }
    ]
  }
]

// 服务器监控配置模板 (多品牌兼容)
export const SERVER_TEMPLATES: ConfigTemplate[] = [
  {
    id: 'server-universal-snmp',
    name: '通用服务器SNMP监控 (多品牌兼容)',
    type: 'snmp_exporter',
    description: '兼容Dell、HP、IBM、浪潮、联想等主流服务器品牌的SNMP监控配置',
    category: '服务器设备',
    deviceTypes: ['server', 'dell-server', 'hp-server', 'ibm-server', 'inspur-server', 'lenovo-server'],
    config: `modules:
  server_universal:
    walk:
      # 标准系统信息 (所有品牌通用)
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.1.4.0      # sysContact
      - 1.3.6.1.2.1.1.5.0      # sysName
      - 1.3.6.1.2.1.1.6.0      # sysLocation
      
      # 标准接口信息
      - 1.3.6.1.2.1.2.2.1.1    # ifIndex
      - 1.3.6.1.2.1.2.2.1.2    # ifDescr
      - 1.3.6.1.2.1.2.2.1.8    # ifOperStatus
      - 1.3.6.1.2.1.2.2.1.10   # ifInOctets
      - 1.3.6.1.2.1.2.2.1.16   # ifOutOctets
      
      # 标准主机资源MIB (RFC 2790)
      - 1.3.6.1.2.1.25.1.1.0   # hrSystemUptime
      - 1.3.6.1.2.1.25.1.2.0   # hrSystemDate
      - 1.3.6.1.2.1.25.1.3.0   # hrSystemInitialLoadDevice
      - 1.3.6.1.2.1.25.1.4.0   # hrSystemInitialLoadParameters
      - 1.3.6.1.2.1.25.1.5.0   # hrSystemNumUsers
      - 1.3.6.1.2.1.25.1.6.0   # hrSystemProcesses
      - 1.3.6.1.2.1.25.1.7.0   # hrSystemMaxProcesses
      
      # CPU信息 (标准MIB)
      - 1.3.6.1.2.1.25.3.3.1.1 # hrProcessorFrwID
      - 1.3.6.1.2.1.25.3.3.1.2 # hrProcessorLoad
      
      # 内存信息 (标准MIB)
      - 1.3.6.1.2.1.25.2.2.0   # hrMemorySize
      - 1.3.6.1.2.1.25.2.3.1.1 # hrStorageIndex
      - 1.3.6.1.2.1.25.2.3.1.2 # hrStorageType
      - 1.3.6.1.2.1.25.2.3.1.3 # hrStorageDescr
      - 1.3.6.1.2.1.25.2.3.1.4 # hrStorageAllocationUnits
      - 1.3.6.1.2.1.25.2.3.1.5 # hrStorageSize
      - 1.3.6.1.2.1.25.2.3.1.6 # hrStorageUsed
      
      # 磁盘信息
      - 1.3.6.1.2.1.25.4.2.1.1 # hrDiskStorageAccess
      - 1.3.6.1.2.1.25.4.2.1.2 # hrDiskStorageMedia
      - 1.3.6.1.2.1.25.4.2.1.3 # hrDiskStorageRemoveble
      - 1.3.6.1.2.1.25.4.2.1.4 # hrDiskStorageCapacity
      
      # 进程信息
      - 1.3.6.1.2.1.25.4.2.1.1 # hrSWRunIndex
      - 1.3.6.1.2.1.25.4.2.1.2 # hrSWRunName
      - 1.3.6.1.2.1.25.4.2.1.4 # hrSWRunPath
      - 1.3.6.1.2.1.25.4.2.1.5 # hrSWRunParameters
      - 1.3.6.1.2.1.25.4.2.1.6 # hrSWRunType
      - 1.3.6.1.2.1.25.4.2.1.7 # hrSWRunStatus
      
      # Dell服务器专用MIB (如果是Dell服务器)
      - 1.3.6.1.4.1.674.10892.5.4.200.10.1.4   # Dell温度传感器
      - 1.3.6.1.4.1.674.10892.5.4.200.10.1.6   # Dell温度状态
      - 1.3.6.1.4.1.674.10892.5.4.700.10.1.4   # Dell电源状态
      - 1.3.6.1.4.1.674.10892.5.4.700.20.1.6   # Dell风扇状态
      
      # HP服务器专用MIB (如果是HP服务器)
      - 1.3.6.1.4.1.232.6.2.6.8.1.4           # HP CPU状态
      - 1.3.6.1.4.1.232.6.2.14.13.1.19        # HP温度传感器
      - 1.3.6.1.4.1.232.6.2.9.3.1.4           # HP风扇状态
      - 1.3.6.1.4.1.232.6.2.9.2.1.4           # HP电源状态
      
      # IBM服务器专用MIB (如果是IBM服务器)
      - 1.3.6.1.4.1.2.3.51.3.1.4.1.1.0        # IBM系统健康状态
      - 1.3.6.1.4.1.2.3.51.3.1.1.2.1.3        # IBM温度传感器
      - 1.3.6.1.4.1.2.3.51.3.1.3.2.1.3        # IBM电压传感器
      
    lookups:
      - source_indexes: [hrStorageIndex]
        lookup: 1.3.6.1.2.1.25.2.3.1.3  # hrStorageDescr
        drop_source_indexes: false
      - source_indexes: [ifIndex]
        lookup: 1.3.6.1.2.1.2.2.1.2     # ifDescr
        drop_source_indexes: false
        
    overrides:
      1.3.6.1.2.1.25.3.3.1.2:
        type: gauge
      1.3.6.1.2.1.25.2.3.1.6:
        type: gauge
        
    auth:
      community: {{community}}
    version: {{version}}
    timeout: {{timeout}}s
    retries: {{retries}}`,
    parameters: [
      {
        name: 'community',
        type: 'string',
        description: 'SNMP Community字符串',
        defaultValue: 'public',
        required: true
      },
      {
        name: 'version',
        type: 'select',
        description: 'SNMP版本',
        defaultValue: '2',
        required: true,
        options: ['1', '2', '3']
      },
      {
        name: 'timeout',
        type: 'number',
        description: '超时时间(秒)',
        defaultValue: 10,
        required: true
      },
      {
        name: 'retries',
        type: 'number',
        description: '重试次数',
        defaultValue: 3,
        required: true
      }
    ]
  },
  
  {
    id: 'server-dell-idrac',
    name: 'Dell服务器iDRAC专用监控',
    type: 'snmp_exporter',
    description: '专门针对Dell PowerEdge服务器iDRAC的完整SNMP监控配置',
    category: '服务器设备',
    deviceTypes: ['dell-server', 'dell-poweredge', 'idrac'],
    config: `modules:
  dell_idrac:
    walk:
      # 标准系统信息
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.1.5.0      # sysName
      
      # Dell全局状态
      - 1.3.6.1.4.1.674.10892.5.2.1.0         # globalSystemStatus
      
      # Dell CPU信息
      - 1.3.6.1.4.1.674.10892.5.4.1100.30.1.1 # processorDeviceIndex
      - 1.3.6.1.4.1.674.10892.5.4.1100.30.1.8 # processorDeviceStatus
      - 1.3.6.1.4.1.674.10892.5.4.1100.30.1.9 # processorDeviceLocationName
      - 1.3.6.1.4.1.674.10892.5.4.1100.30.1.23 # processorDeviceCurrentSpeed
      
      # Dell内存信息
      - 1.3.6.1.4.1.674.10892.5.4.1100.50.1.1 # memoryDeviceIndex
      - 1.3.6.1.4.1.674.10892.5.4.1100.50.1.5 # memoryDeviceStatus
      - 1.3.6.1.4.1.674.10892.5.4.1100.50.1.8 # memoryDeviceLocationName
      - 1.3.6.1.4.1.674.10892.5.4.1100.50.1.14 # memoryDeviceSize
      
      # Dell温度传感器
      - 1.3.6.1.4.1.674.10892.5.4.700.20.1.1  # temperatureProbeIndex
      - 1.3.6.1.4.1.674.10892.5.4.700.20.1.5  # temperatureProbeStatus
      - 1.3.6.1.4.1.674.10892.5.4.700.20.1.6  # temperatureProbeReading
      - 1.3.6.1.4.1.674.10892.5.4.700.20.1.8  # temperatureProbeLocationName
      
      # Dell风扇信息
      - 1.3.6.1.4.1.674.10892.5.4.700.12.1.1  # coolingDeviceIndex
      - 1.3.6.1.4.1.674.10892.5.4.700.12.1.5  # coolingDeviceStatus
      - 1.3.6.1.4.1.674.10892.5.4.700.12.1.6  # coolingDeviceReading
      - 1.3.6.1.4.1.674.10892.5.4.700.12.1.8  # coolingDeviceLocationName
      
      # Dell电源信息
      - 1.3.6.1.4.1.674.10892.5.4.600.12.1.1  # powerSupplyIndex
      - 1.3.6.1.4.1.674.10892.5.4.600.12.1.5  # powerSupplyStatus
      - 1.3.6.1.4.1.674.10892.5.4.600.12.1.6  # powerSupplyOutputWatts
      - 1.3.6.1.4.1.674.10892.5.4.600.12.1.8  # powerSupplyLocationName
      
      # Dell磁盘信息
      - 1.3.6.1.4.1.674.10892.5.5.1.20.130.4.1.1  # physicalDiskNumber
      - 1.3.6.1.4.1.674.10892.5.5.1.20.130.4.1.4  # physicalDiskState
      - 1.3.6.1.4.1.674.10892.5.5.1.20.130.4.1.11 # physicalDiskCapacityInMB
      - 1.3.6.1.4.1.674.10892.5.5.1.20.130.4.1.21 # physicalDiskUsedSpaceInMB
      
    lookups:
      - source_indexes: [temperatureProbeIndex]
        lookup: 1.3.6.1.4.1.674.10892.5.4.700.20.1.8
        drop_source_indexes: false
      - source_indexes: [coolingDeviceIndex]
        lookup: 1.3.6.1.4.1.674.10892.5.4.700.12.1.8
        drop_source_indexes: false
        
    overrides:
      1.3.6.1.4.1.674.10892.5.4.700.20.1.6:
        type: gauge
        scale: 0.1  # 温度值需要除以10
      1.3.6.1.4.1.674.10892.5.4.700.12.1.6:
        type: gauge
        
    auth:
      community: {{community}}
    version: {{version}}
    timeout: {{timeout}}s
    retries: {{retries}}`,
    parameters: [
      {
        name: 'community',
        type: 'string',
        description: 'SNMP Community字符串',
        defaultValue: 'public',
        required: true
      },
      {
        name: 'version',
        type: 'select',
        description: 'SNMP版本',
        defaultValue: '2',
        required: true,
        options: ['1', '2', '3']
      },
      {
        name: 'timeout',
        type: 'number',
        description: '超时时间(秒)',
        defaultValue: 10,
        required: true
      },
      {
        name: 'retries',
        type: 'number',
        description: '重试次数',
        defaultValue: 3,
        required: true
      }
    ]
  },
  
  {
    id: 'server-hp-ilo',
    name: 'HP服务器iLO专用监控',
    type: 'snmp_exporter',
    description: '专门针对HP ProLiant服务器iLO的完整SNMP监控配置',
    category: '服务器设备',
    deviceTypes: ['hp-server', 'hp-proliant', 'ilo'],
    config: `modules:
  hp_ilo:
    walk:
      # 标准系统信息
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.1.5.0      # sysName
      
      # HP全局状态
      - 1.3.6.1.4.1.232.2.2.4.2.0         # cpqHoMibStatusArray
      
      # HP CPU信息
      - 1.3.6.1.4.1.232.1.2.2.1.1.1       # cpqSeCpuUnitIndex
      - 1.3.6.1.4.1.232.1.2.2.1.1.6       # cpqSeCpuStatus
      - 1.3.6.1.4.1.232.1.2.2.1.1.7       # cpqSeCpuExtendedStatus
      - 1.3.6.1.4.1.232.1.2.2.1.1.12      # cpqSeCpuCore
      
      # HP内存信息
      - 1.3.6.1.4.1.232.6.2.14.11.1.1     # cpqHeResMem2ModuleNum
      - 1.3.6.1.4.1.232.6.2.14.11.1.19    # cpqHeResMem2ModuleStatus
      - 1.3.6.1.4.1.232.6.2.14.11.1.6     # cpqHeResMem2ModuleSize
      
      # HP温度传感器
      - 1.3.6.1.4.1.232.6.2.6.8.1.1       # cpqHeTemperatureIndex
      - 1.3.6.1.4.1.232.6.2.6.8.1.4       # cpqHeTemperatureCondition
      - 1.3.6.1.4.1.232.6.2.6.8.1.6       # cpqHeTemperatureCelsius
      - 1.3.6.1.4.1.232.6.2.6.8.1.7       # cpqHeTemperatureThreshold
      
      # HP风扇信息
      - 1.3.6.1.4.1.232.6.2.6.7.1.1       # cpqHeFltTolFanIndex
      - 1.3.6.1.4.1.232.6.2.6.7.1.9       # cpqHeFltTolFanCondition
      - 1.3.6.1.4.1.232.6.2.6.7.1.11      # cpqHeFltTolFanCurrentSpeed
      
      # HP电源信息
      - 1.3.6.1.4.1.232.6.2.9.3.1.1       # cpqHeFltTolPowerSupplyBay
      - 1.3.6.1.4.1.232.6.2.9.3.1.4       # cpqHeFltTolPowerSupplyCondition
      - 1.3.6.1.4.1.232.6.2.9.3.1.10      # cpqHeFltTolPowerSupplyCapacityUsed
      
      # HP磁盘阵列信息
      - 1.3.6.1.4.1.232.3.2.3.1.1.1       # cpqDaAccelIndex
      - 1.3.6.1.4.1.232.3.2.3.1.1.9       # cpqDaAccelCondition
      - 1.3.6.1.4.1.232.3.2.5.1.1.1       # cpqDaLogDrvIndex
      - 1.3.6.1.4.1.232.3.2.5.1.1.4       # cpqDaLogDrvStatus
      
    lookups:
      - source_indexes: [cpqHeTemperatureIndex]
        lookup: 1.3.6.1.4.1.232.6.2.6.8.1.7
        drop_source_indexes: false
      - source_indexes: [cpqHeFltTolFanIndex]
        lookup: 1.3.6.1.4.1.232.6.2.6.7.1.11
        drop_source_indexes: false
        
    overrides:
      1.3.6.1.4.1.232.6.2.6.8.1.6:
        type: gauge
      1.3.6.1.4.1.232.6.2.6.7.1.11:
        type: gauge
        
    auth:
      community: {{community}}
    version: {{version}}
    timeout: {{timeout}}s
    retries: {{retries}}`,
    parameters: [
      {
        name: 'community',
        type: 'string',
        description: 'SNMP Community字符串',
        defaultValue: 'public',
        required: true
      },
      {
        name: 'version',
        type: 'select',
        description: 'SNMP版本',
        defaultValue: '2',
        required: true,
        options: ['1', '2', '3']
      },
      {
        name: 'timeout',
        type: 'number',
        description: '超时时间(秒)',
        defaultValue: 10,
        required: true
      },
      {
        name: 'retries',
        type: 'number',
        description: '重试次数',
        defaultValue: 3,
        required: true
      }
    ]
  },
  
  {
    id: 'server-lenovo-xcc',
    name: 'Lenovo服务器XCC专用监控',
    type: 'snmp_exporter',
    description: '专门针对Lenovo ThinkSystem服务器XCC的完整SNMP监控配置',
    category: '服务器设备',
    deviceTypes: ['lenovo-server', 'lenovo-thinksystem', 'xcc'],
    config: `modules:
  lenovo_xcc:
    walk:
      # 标准系统信息
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.1.5.0      # sysName
      
      # Lenovo系统状态
      - 1.3.6.1.4.1.19046.11.1.1.1.2.1.1.1  # lenovoImm2SystemHealthStat
      
      # CPU信息 (使用标准HOST-RESOURCES-MIB)
      - 1.3.6.1.2.1.25.3.3.1.1 # hrProcessorFrwID
      - 1.3.6.1.2.1.25.3.3.1.2 # hrProcessorLoad
      
      # 内存信息
      - 1.3.6.1.2.1.25.2.2.0   # hrMemorySize
      - 1.3.6.1.2.1.25.2.3.1.5 # hrStorageSize
      - 1.3.6.1.2.1.25.2.3.1.6 # hrStorageUsed
      
      # Lenovo温度传感器
      - 1.3.6.1.4.1.19046.11.1.1.2.1.1.1    # lenovoImm2TempIndex
      - 1.3.6.1.4.1.19046.11.1.1.2.1.1.2    # lenovoImm2TempDescr
      - 1.3.6.1.4.1.19046.11.1.1.2.1.1.3    # lenovoImm2TempReading
      - 1.3.6.1.4.1.19046.11.1.1.2.1.1.6    # lenovoImm2TempHealthStatus
      
      # Lenovo风扇信息
      - 1.3.6.1.4.1.19046.11.1.1.3.1.1.1    # lenovoImm2FanIndex
      - 1.3.6.1.4.1.19046.11.1.1.3.1.1.2    # lenovoImm2FanDescr
      - 1.3.6.1.4.1.19046.11.1.1.3.1.1.3    # lenovoImm2FanSpeed
      - 1.3.6.1.4.1.19046.11.1.1.3.1.1.10   # lenovoImm2FanHealthStatus
      
      # Lenovo电源信息
      - 1.3.6.1.4.1.19046.11.1.1.4.1.1.1    # lenovoImm2PowerIndex
      - 1.3.6.1.4.1.19046.11.1.1.4.1.1.2    # lenovoImm2PowerDescr
      - 1.3.6.1.4.1.19046.11.1.1.4.1.1.6    # lenovoImm2PowerHealthStatus
      
      # 电压传感器
      - 1.3.6.1.4.1.19046.11.1.1.5.1.1.1    # lenovoImm2VoltIndex
      - 1.3.6.1.4.1.19046.11.1.1.5.1.1.2    # lenovoImm2VoltDescr
      - 1.3.6.1.4.1.19046.11.1.1.5.1.1.3    # lenovoImm2VoltReading
      - 1.3.6.1.4.1.19046.11.1.1.5.1.1.6    # lenovoImm2VoltHealthStatus
      
    lookups:
      - source_indexes: [lenovoImm2TempIndex]
        lookup: 1.3.6.1.4.1.19046.11.1.1.2.1.1.2
        drop_source_indexes: false
      - source_indexes: [lenovoImm2FanIndex]
        lookup: 1.3.6.1.4.1.19046.11.1.1.3.1.1.2
        drop_source_indexes: false
        
    overrides:
      1.3.6.1.4.1.19046.11.1.1.2.1.1.3:
        type: gauge
      1.3.6.1.4.1.19046.11.1.1.3.1.1.3:
        type: gauge
        
    auth:
      community: {{community}}
    version: {{version}}
    timeout: {{timeout}}s
    retries: {{retries}}`,
    parameters: [
      {
        name: 'community',
        type: 'string',
        description: 'SNMP Community字符串',
        defaultValue: 'public',
        required: true
      },
      {
        name: 'version',
        type: 'select',
        description: 'SNMP版本',
        defaultValue: '2',
        required: true,
        options: ['1', '2', '3']
      },
      {
        name: 'timeout',
        type: 'number',
        description: '超时时间(秒)',
        defaultValue: 10,
        required: true
      },
      {
        name: 'retries',
        type: 'number',
        description: '重试次数',
        defaultValue: 3,
        required: true
      }
    ]
  },
  
  {
    id: 'server-supermicro-ipmi',
    name: 'Supermicro服务器IPMI监控',
    type: 'snmp_exporter',
    description: '专门针对Supermicro服务器IPMI的完整SNMP监控配置',
    category: '服务器设备',
    deviceTypes: ['supermicro-server', 'supermicro', 'ipmi'],
    config: `modules:
  supermicro_ipmi:
    walk:
      # 标准系统信息
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.1.5.0      # sysName
      
      # 标准主机资源MIB
      - 1.3.6.1.2.1.25.3.3.1.2 # hrProcessorLoad
      - 1.3.6.1.2.1.25.2.2.0   # hrMemorySize
      - 1.3.6.1.2.1.25.2.3.1.5 # hrStorageSize
      - 1.3.6.1.2.1.25.2.3.1.6 # hrStorageUsed
      
      # IPMI传感器数据 (通过SNMP代理)
      # 温度传感器
      - 1.3.6.1.4.1.10876.2.1.1.1.1.1      # 传感器索引
      - 1.3.6.1.4.1.10876.2.1.1.1.1.2      # 传感器名称
      - 1.3.6.1.4.1.10876.2.1.1.1.1.3      # 传感器类型
      - 1.3.6.1.4.1.10876.2.1.1.1.1.4      # 传感器读数
      - 1.3.6.1.4.1.10876.2.1.1.1.1.5      # 传感器状态
      
      # 风扇传感器
      - 1.3.6.1.4.1.10876.2.1.1.1.2.1      # 风扇索引
      - 1.3.6.1.4.1.10876.2.1.1.1.2.2      # 风扇名称
      - 1.3.6.1.4.1.10876.2.1.1.1.2.4      # 风扇转速
      - 1.3.6.1.4.1.10876.2.1.1.1.2.5      # 风扇状态
      
      # 电源传感器
      - 1.3.6.1.4.1.10876.2.1.1.1.3.1      # 电源索引
      - 1.3.6.1.4.1.10876.2.1.1.1.3.2      # 电源名称
      - 1.3.6.1.4.1.10876.2.1.1.1.3.4      # 电源读数
      - 1.3.6.1.4.1.10876.2.1.1.1.3.5      # 电源状态
      
      # 电压传感器
      - 1.3.6.1.4.1.10876.2.1.1.1.4.1      # 电压索引
      - 1.3.6.1.4.1.10876.2.1.1.1.4.2      # 电压名称
      - 1.3.6.1.4.1.10876.2.1.1.1.4.4      # 电压读数
      - 1.3.6.1.4.1.10876.2.1.1.1.4.5      # 电压状态
      
    lookups:
      - source_indexes: [1]
        lookup: 1.3.6.1.4.1.10876.2.1.1.1.1.2
        drop_source_indexes: false
      - source_indexes: [1]
        lookup: 1.3.6.1.4.1.10876.2.1.1.1.2.2
        drop_source_indexes: false
        
    overrides:
      1.3.6.1.4.1.10876.2.1.1.1.1.4:
        type: gauge
      1.3.6.1.4.1.10876.2.1.1.1.2.4:
        type: gauge
        
    auth:
      community: {{community}}
    version: {{version}}
    timeout: {{timeout}}s
    retries: {{retries}}`,
    parameters: [
      {
        name: 'community',
        type: 'string',
        description: 'SNMP Community字符串',
        defaultValue: 'public',
        required: true
      },
      {
        name: 'version',
        type: 'select',
        description: 'SNMP版本',
        defaultValue: '2',
        required: true,
        options: ['1', '2', '3']
      },
      {
        name: 'timeout',
        type: 'number',
        description: '超时时间(秒)',
        defaultValue: 10,
        required: true
      },
      {
        name: 'retries',
        type: 'number',
        description: '重试次数',
        defaultValue: 3,
        required: true
      }
    ]
  },
  
  {
    id: 'server-inspur-bmc',
    name: '浪潮服务器BMC监控',
    type: 'snmp_exporter',
    description: '专门针对浪潮服务器BMC的完整SNMP监控配置',
    category: '服务器设备',
    deviceTypes: ['inspur-server', '浪潮服务器', 'bmc'],
    config: `modules:
  inspur_bmc:
    walk:
      # 标准系统信息
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.1.5.0      # sysName
      
      # 标准主机资源MIB
      - 1.3.6.1.2.1.25.3.3.1.2 # hrProcessorLoad
      - 1.3.6.1.2.1.25.2.2.0   # hrMemorySize
      - 1.3.6.1.2.1.25.2.3.1.5 # hrStorageSize
      - 1.3.6.1.2.1.25.2.3.1.6 # hrStorageUsed
      
      # 浪潮私有MIB (基于IPMI标准)
      # 系统健康状态
      - 1.3.6.1.4.1.2011.2.235.1.1.2.1.1   # 系统整体状态
      
      # CPU信息
      - 1.3.6.1.4.1.2011.2.235.1.1.3.1.1   # CPU索引
      - 1.3.6.1.4.1.2011.2.235.1.1.3.1.2   # CPU状态
      - 1.3.6.1.4.1.2011.2.235.1.1.3.1.3   # CPU温度
      
      # 内存信息
      - 1.3.6.1.4.1.2011.2.235.1.1.4.1.1   # 内存索引
      - 1.3.6.1.4.1.2011.2.235.1.1.4.1.2   # 内存状态
      - 1.3.6.1.4.1.2011.2.235.1.1.4.1.3   # 内存大小
      
      # 温度传感器
      - 1.3.6.1.4.1.2011.2.235.1.1.5.1.1   # 温度传感器索引
      - 1.3.6.1.4.1.2011.2.235.1.1.5.1.2   # 温度传感器名称
      - 1.3.6.1.4.1.2011.2.235.1.1.5.1.3   # 温度读数
      - 1.3.6.1.4.1.2011.2.235.1.1.5.1.4   # 温度状态
      
      # 风扇信息
      - 1.3.6.1.4.1.2011.2.235.1.1.6.1.1   # 风扇索引
      - 1.3.6.1.4.1.2011.2.235.1.1.6.1.2   # 风扇名称
      - 1.3.6.1.4.1.2011.2.235.1.1.6.1.3   # 风扇转速
      - 1.3.6.1.4.1.2011.2.235.1.1.6.1.4   # 风扇状态
      
      # 电源信息
      - 1.3.6.1.4.1.2011.2.235.1.1.7.1.1   # 电源索引
      - 1.3.6.1.4.1.2011.2.235.1.1.7.1.2   # 电源名称
      - 1.3.6.1.4.1.2011.2.235.1.1.7.1.3   # 电源状态
      - 1.3.6.1.4.1.2011.2.235.1.1.7.1.4   # 电源功率
      
    lookups:
      - source_indexes: [1]
        lookup: 1.3.6.1.4.1.2011.2.235.1.1.5.1.2
        drop_source_indexes: false
      - source_indexes: [1]
        lookup: 1.3.6.1.4.1.2011.2.235.1.1.6.1.2
        drop_source_indexes: false
        
    overrides:
      1.3.6.1.4.1.2011.2.235.1.1.5.1.3:
        type: gauge
      1.3.6.1.4.1.2011.2.235.1.1.6.1.3:
        type: gauge
        
    auth:
      community: {{community}}
    version: {{version}}
    timeout: {{timeout}}s
    retries: {{retries}}`,
    parameters: [
      {
        name: 'community',
        type: 'string',
        description: 'SNMP Community字符串',
        defaultValue: 'public',
        required: true
      },
      {
        name: 'version',
        type: 'select',
        description: 'SNMP版本',
        defaultValue: '2',
        required: true,
        options: ['1', '2', '3']
      },
      {
        name: 'timeout',
        type: 'number',
        description: '超时时间(秒)',
        defaultValue: 10,
        required: true
      },
      {
        name: 'retries',
        type: 'number',
        description: '重试次数',
        defaultValue: 3,
        required: true
      }
    ]
  }
]

// Categraf 完整配置模板
export const CATEGRAF_TEMPLATES: ConfigTemplate[] = [
  {
    id: 'categraf-snmp-switch',
    name: 'Categraf SNMP 交换机监控',
    type: 'categraf',
    description: 'Categraf采集器的完整SNMP交换机监控配置',
    category: '数据采集',
    deviceTypes: ['switch', 'router'],
    config: `# Categraf SNMP 交换机监控配置
[[inputs.snmp]]
  # 采集间隔
  interval = "{{interval}}s"
  
  # SNMP连接配置
  agents = [{{agents}}]
  version = {{version}}
  community = "{{community}}"
  timeout = "{{timeout}}s"
  retries = {{retries}}
  
  # 系统信息
  [[inputs.snmp.field]]
    name = "uptime"
    oid = "1.3.6.1.2.1.1.3.0"
  
  [[inputs.snmp.field]]
    name = "hostname"
    oid = "1.3.6.1.2.1.1.5.0"
    is_tag = true
  
  # 接口表格
  [[inputs.snmp.table]]
    name = "interface"
    inherit_tags = ["hostname"]
    
    [[inputs.snmp.table.field]]
      name = "ifIndex"
      oid = "1.3.6.1.2.1.2.2.1.1"
      is_tag = true
    
    [[inputs.snmp.table.field]]
      name = "ifDescr"
      oid = "1.3.6.1.2.1.2.2.1.2"
      is_tag = true
    
    [[inputs.snmp.table.field]]
      name = "ifType"
      oid = "1.3.6.1.2.1.2.2.1.3"
    
    [[inputs.snmp.table.field]]
      name = "ifSpeed"
      oid = "1.3.6.1.2.1.2.2.1.5"
    
    [[inputs.snmp.table.field]]
      name = "ifAdminStatus"
      oid = "1.3.6.1.2.1.2.2.1.7"
    
    [[inputs.snmp.table.field]]
      name = "ifOperStatus"
      oid = "1.3.6.1.2.1.2.2.1.8"
    
    [[inputs.snmp.table.field]]
      name = "ifInOctets"
      oid = "1.3.6.1.2.1.2.2.1.10"
      conversion = "float"
    
    [[inputs.snmp.table.field]]
      name = "ifInUcastPkts"
      oid = "1.3.6.1.2.1.2.2.1.11"
      conversion = "float"
    
    [[inputs.snmp.table.field]]
      name = "ifInDiscards"
      oid = "1.3.6.1.2.1.2.2.1.13"
      conversion = "float"
    
    [[inputs.snmp.table.field]]
      name = "ifInErrors"
      oid = "1.3.6.1.2.1.2.2.1.14"
      conversion = "float"
    
    [[inputs.snmp.table.field]]
      name = "ifOutOctets"
      oid = "1.3.6.1.2.1.2.2.1.16"
      conversion = "float"
    
    [[inputs.snmp.table.field]]
      name = "ifOutUcastPkts"
      oid = "1.3.6.1.2.1.2.2.1.17"
      conversion = "float"
    
    [[inputs.snmp.table.field]]
      name = "ifOutDiscards"
      oid = "1.3.6.1.2.1.2.2.1.19"
      conversion = "float"
    
    [[inputs.snmp.table.field]]
      name = "ifOutErrors"
      oid = "1.3.6.1.2.1.2.2.1.20"
      conversion = "float"

  # CPU使用率 (Cisco)
  [[inputs.snmp.table]]
    name = "cpu"
    inherit_tags = ["hostname"]
    
    [[inputs.snmp.table.field]]
      name = "cpu1min"
      oid = "1.3.6.1.4.1.9.9.109.1.1.1.1.2"
      conversion = "float"
    
    [[inputs.snmp.table.field]]
      name = "cpu5min"
      oid = "1.3.6.1.4.1.9.9.109.1.1.1.1.3"
      conversion = "float"

  # 内存使用率 (Cisco)
  [[inputs.snmp.table]]
    name = "memory"
    inherit_tags = ["hostname"]
    
    [[inputs.snmp.table.field]]
      name = "memoryUsed"
      oid = "1.3.6.1.4.1.9.9.48.1.1.1.5"
      conversion = "float"
    
    [[inputs.snmp.table.field]]
      name = "memoryFree"
      oid = "1.3.6.1.4.1.9.9.48.1.1.1.6"
      conversion = "float"

  # 温度传感器
  [[inputs.snmp.table]]
    name = "temperature"
    inherit_tags = ["hostname"]
    
    [[inputs.snmp.table.field]]
      name = "temperature"
      oid = "1.3.6.1.4.1.9.9.13.1.3.1.3"
      conversion = "float"
    
    [[inputs.snmp.table.field]]
      name = "tempState"
      oid = "1.3.6.1.4.1.9.9.13.1.3.1.6"

# 输出配置
[[outputs.prometheus]]
  listen = ":{{prometheus_port}}"
  metric_version = 2
  
[[outputs.victoriametrics]]
  url = "{{vm_url}}/api/v1/write"
  timeout = "30s"`,
    parameters: [
      {
        name: 'agents',
        type: 'array',
        description: '监控设备IP列表',
        defaultValue: ['"192.168.1.1:161"'],
        required: true
      },
      {
        name: 'community',
        type: 'string',
        description: 'SNMP Community',
        defaultValue: 'public',
        required: true
      },
      {
        name: 'version',
        type: 'select',
        description: 'SNMP版本',
        defaultValue: '2',
        required: true,
        options: ['1', '2', '3']
      },
      {
        name: 'interval',
        type: 'number',
        description: '采集间隔(秒)',
        defaultValue: 60,
        required: true
      },
      {
        name: 'timeout',
        type: 'number',
        description: '超时时间(秒)',
        defaultValue: 5,
        required: true
      },
      {
        name: 'retries',
        type: 'number',
        description: '重试次数',
        defaultValue: 3,
        required: true
      },
      {
        name: 'prometheus_port',
        type: 'number',
        description: 'Prometheus指标端口',
        defaultValue: 9100,
        required: true
      },
      {
        name: 'vm_url',
        type: 'string',
        description: 'VictoriaMetrics URL',
        defaultValue: 'http://localhost:8428',
        required: true
      }
    ]
  }
]

// 所有配置模板
export const ALL_CONFIG_TEMPLATES = [
  ...SNMP_EXPORTER_TEMPLATES,
  ...H3C_TEMPLATES,
  ...SERVER_TEMPLATES,
  ...CATEGRAF_TEMPLATES
]

// 根据类型获取模板
export function getTemplatesByType(type: string): ConfigTemplate[] {
  return ALL_CONFIG_TEMPLATES.filter(template => template.type === type)
}

// 根据设备类型获取模板
export function getTemplatesByDeviceType(deviceType: string): ConfigTemplate[] {
  return ALL_CONFIG_TEMPLATES.filter(template => 
    template.deviceTypes.includes(deviceType)
  )
}

// 渲染配置模板
export function renderConfigTemplate(template: ConfigTemplate, parameters: Record<string, any>): string {
  let config = template.config
  
  // 替换参数
  for (const [key, value] of Object.entries(parameters)) {
    const placeholder = `{{${key}}}`
    let replacement = value
    
    // 处理数组类型
    if (Array.isArray(value)) {
      replacement = value.join(', ')
    }
    
    config = config.replace(new RegExp(placeholder, 'g'), replacement)
  }
  
  return config
}