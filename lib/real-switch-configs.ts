// 真实可用的交换机监控配置 - 符合官方标准
export interface RealSwitchConfig {
  id: string
  name: string
  vendor: string
  models: string[]
  snmpExporterConfig: string
  categrafConfig: string
  description: string
  testedOIDs: string[]
  expectedMetrics: string[]
}

// Cisco交换机真实配置 - 基于官方snmp_exporter配置
export const CISCO_SWITCH_CONFIG: RealSwitchConfig = {
  id: 'cisco-switch-real',
  name: 'Cisco交换机真实监控配置',
  vendor: 'Cisco',
  models: ['Catalyst 2960', 'Catalyst 3560', 'Catalyst 3750', 'Catalyst 9300'],
  snmpExporterConfig: `# Cisco交换机SNMP Exporter配置 - 基于官方cisco_wlc模块优化
modules:
  cisco_switch:
    walk:
      # 系统基础信息
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.1.5.0      # sysName
      - 1.3.6.1.2.1.1.6.0      # sysLocation
      
      # 接口信息 - IF-MIB (RFC 2863)
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
      
      # 高速接口计数器 (64位) - IF-MIB
      - 1.3.6.1.2.1.31.1.1.1.1  # ifName
      - 1.3.6.1.2.1.31.1.1.1.6  # ifHCInOctets
      - 1.3.6.1.2.1.31.1.1.1.10 # ifHCOutOctets
      - 1.3.6.1.2.1.31.1.1.1.11 # ifHCInUcastPkts
      - 1.3.6.1.2.1.31.1.1.1.12 # ifHCInMulticastPkts
      - 1.3.6.1.2.1.31.1.1.1.13 # ifHCInBroadcastPkts
      - 1.3.6.1.2.1.31.1.1.1.14 # ifHCOutUcastPkts
      - 1.3.6.1.2.1.31.1.1.1.15 # ifHighSpeed
      
      # Cisco CPU监控 - CISCO-PROCESS-MIB
      - 1.3.6.1.4.1.9.9.109.1.1.1.1.2  # cpmCPUTotal1min
      - 1.3.6.1.4.1.9.9.109.1.1.1.1.3  # cpmCPUTotal5min
      - 1.3.6.1.4.1.9.9.109.1.1.1.1.4  # cpmCPUTotal1hr
      - 1.3.6.1.4.1.9.9.109.1.1.1.1.5  # cpmCPUInterrupt
      
      # Cisco内存监控 - CISCO-MEMORY-POOL-MIB
      - 1.3.6.1.4.1.9.9.48.1.1.1.2     # ciscoMemoryPoolType
      - 1.3.6.1.4.1.9.9.48.1.1.1.3     # ciscoMemoryPoolName
      - 1.3.6.1.4.1.9.9.48.1.1.1.5     # ciscoMemoryPoolUsed
      - 1.3.6.1.4.1.9.9.48.1.1.1.6     # ciscoMemoryPoolFree
      - 1.3.6.1.4.1.9.9.48.1.1.1.7     # ciscoMemoryPoolLargestFree
      
      # Cisco环境监控 - CISCO-ENVMON-MIB
      - 1.3.6.1.4.1.9.9.13.1.3.1.2     # ciscoEnvMonTemperatureDescr
      - 1.3.6.1.4.1.9.9.13.1.3.1.3     # ciscoEnvMonTemperatureValue
      - 1.3.6.1.4.1.9.9.13.1.3.1.4     # ciscoEnvMonTemperatureThreshold
      - 1.3.6.1.4.1.9.9.13.1.3.1.6     # ciscoEnvMonTemperatureState
      
      # Cisco风扇监控
      - 1.3.6.1.4.1.9.9.13.1.4.1.2     # ciscoEnvMonFanDescr
      - 1.3.6.1.4.1.9.9.13.1.4.1.3     # ciscoEnvMonFanState
      
      # Cisco电源监控
      - 1.3.6.1.4.1.9.9.13.1.5.1.2     # ciscoEnvMonSupplyDescr
      - 1.3.6.1.4.1.9.9.13.1.5.1.3     # ciscoEnvMonSupplyState
      
      # VLAN信息 - CISCO-VTP-MIB
      - 1.3.6.1.4.1.9.9.46.1.3.1.1.2   # vtpVlanName
      - 1.3.6.1.4.1.9.9.46.1.3.1.1.3   # vtpVlanState
      - 1.3.6.1.4.1.9.9.46.1.3.1.1.4   # vtpVlanType
      
      # STP信息 - BRIDGE-MIB
      - 1.3.6.1.2.1.17.2.15.1.3        # dot1dStpPortState
      - 1.3.6.1.2.1.17.2.15.1.4        # dot1dStpPortEnable
      - 1.3.6.1.2.1.17.1.4.0           # dot1dStpRootCost
      
    lookups:
      # 接口名称映射
      - source_indexes: [ifIndex]
        lookup: 1.3.6.1.2.1.2.2.1.2    # ifDescr
        drop_source_indexes: false
      - source_indexes: [ifIndex]
        lookup: 1.3.6.1.2.1.31.1.1.1.1 # ifName
        drop_source_indexes: false
      
      # CPU描述映射
      - source_indexes: [cpmCPUTotalIndex]
        lookup: 1.3.6.1.4.1.9.9.109.1.1.1.1.1 # cpmCPUTotalPhysicalIndex
        drop_source_indexes: false
        
      # 内存池名称映射
      - source_indexes: [ciscoMemoryPoolType]
        lookup: 1.3.6.1.4.1.9.9.48.1.1.1.3    # ciscoMemoryPoolName
        drop_source_indexes: false
        
      # 温度传感器描述映射
      - source_indexes: [ciscoEnvMonTemperatureIndex]
        lookup: 1.3.6.1.4.1.9.9.13.1.3.1.2    # ciscoEnvMonTemperatureDescr
        drop_source_indexes: false
        
    overrides:
      # 系统运行时间忽略，使用采集时间戳
      1.3.6.1.2.1.1.3.0:
        ignore: true
        
      # 接口状态枚举
      1.3.6.1.2.1.2.2.1.7:
        type: EnumAsStateSet
      1.3.6.1.2.1.2.2.1.8:
        type: EnumAsStateSet
        
      # CPU使用率
      1.3.6.1.4.1.9.9.109.1.1.1.1.2:
        type: gauge
      1.3.6.1.4.1.9.9.109.1.1.1.1.3:
        type: gauge
      1.3.6.1.4.1.9.9.109.1.1.1.1.4:
        type: gauge
        
      # 内存使用量
      1.3.6.1.4.1.9.9.48.1.1.1.5:
        type: gauge
      1.3.6.1.4.1.9.9.48.1.1.1.6:
        type: gauge
        
      # 温度值
      1.3.6.1.4.1.9.9.13.1.3.1.3:
        type: gauge
        
      # 环境状态枚举
      1.3.6.1.4.1.9.9.13.1.3.1.6:
        type: EnumAsStateSet
      1.3.6.1.4.1.9.9.13.1.4.1.3:
        type: EnumAsStateSet
      1.3.6.1.4.1.9.9.13.1.5.1.3:
        type: EnumAsStateSet
        
      # VLAN状态
      1.3.6.1.4.1.9.9.46.1.3.1.1.3:
        type: EnumAsStateSet
        
      # STP端口状态
      1.3.6.1.2.1.17.2.15.1.3:
        type: EnumAsStateSet
        
    auth:
      community: {{community}}
    version: {{version}}
    timeout: {{timeout}}s
    retries: {{retries}}
    max_repetitions: {{max_repetitions}}`,
  
  categrafConfig: `# Cisco交换机Categraf配置 - 基于官方inputs.snmp插件
[[inputs.snmp]]
  # 基本配置
  agents = [{{agents}}]
  version = {{version}}
  community = "{{community}}"
  timeout = "{{timeout}}s"
  retries = {{retries}}
  interval = "{{interval}}s"
  
  # 系统信息
  [[inputs.snmp.field]]
    name = "uptime"
    oid = "1.3.6.1.2.1.1.3.0"
    
  [[inputs.snmp.field]]
    name = "hostname"
    oid = "1.3.6.1.2.1.1.5.0"
    is_tag = true
    
  [[inputs.snmp.field]]
    name = "location"
    oid = "1.3.6.1.2.1.1.6.0"
    is_tag = true
    
  # 接口统计信息
  [[inputs.snmp.table]]
    name = "interface"
    inherit_tags = ["hostname", "location"]
    
    [[inputs.snmp.table.field]]
      name = "ifIndex"
      oid = "1.3.6.1.2.1.2.2.1.1"
      is_tag = true
      
    [[inputs.snmp.table.field]]
      name = "ifDescr"
      oid = "1.3.6.1.2.1.2.2.1.2"
      is_tag = true
      
    [[inputs.snmp.table.field]]
      name = "ifName"
      oid = "1.3.6.1.2.1.31.1.1.1.1"
      is_tag = true
      
    [[inputs.snmp.table.field]]
      name = "ifType"
      oid = "1.3.6.1.2.1.2.2.1.3"
      
    [[inputs.snmp.table.field]]
      name = "ifSpeed"
      oid = "1.3.6.1.2.1.2.2.1.5"
      
    [[inputs.snmp.table.field]]
      name = "ifHighSpeed"
      oid = "1.3.6.1.2.1.31.1.1.1.15"
      
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
      
    # 64位高速计数器
    [[inputs.snmp.table.field]]
      name = "ifHCInOctets"
      oid = "1.3.6.1.2.1.31.1.1.1.6"
      conversion = "float"
      
    [[inputs.snmp.table.field]]
      name = "ifHCOutOctets"
      oid = "1.3.6.1.2.1.31.1.1.1.10"
      conversion = "float"
      
  # CPU使用率
  [[inputs.snmp.table]]
    name = "cpu"
    inherit_tags = ["hostname"]
    
    [[inputs.snmp.table.field]]
      name = "cpmCPUTotalIndex"
      oid = "1.3.6.1.4.1.9.9.109.1.1.1.1.1"
      is_tag = true
      
    [[inputs.snmp.table.field]]
      name = "cpmCPUTotal1min"
      oid = "1.3.6.1.4.1.9.9.109.1.1.1.1.2"
      conversion = "float"
      
    [[inputs.snmp.table.field]]
      name = "cpmCPUTotal5min"
      oid = "1.3.6.1.4.1.9.9.109.1.1.1.1.3"
      conversion = "float"
      
    [[inputs.snmp.table.field]]
      name = "cpmCPUTotal1hr"
      oid = "1.3.6.1.4.1.9.9.109.1.1.1.1.4"
      conversion = "float"
      
  # 内存使用率
  [[inputs.snmp.table]]
    name = "memory"
    inherit_tags = ["hostname"]
    
    [[inputs.snmp.table.field]]
      name = "ciscoMemoryPoolType"
      oid = "1.3.6.1.4.1.9.9.48.1.1.1.2"
      is_tag = true
      
    [[inputs.snmp.table.field]]
      name = "ciscoMemoryPoolName"
      oid = "1.3.6.1.4.1.9.9.48.1.1.1.3"
      is_tag = true
      
    [[inputs.snmp.table.field]]
      name = "ciscoMemoryPoolUsed"
      oid = "1.3.6.1.4.1.9.9.48.1.1.1.5"
      conversion = "float"
      
    [[inputs.snmp.table.field]]
      name = "ciscoMemoryPoolFree"
      oid = "1.3.6.1.4.1.9.9.48.1.1.1.6"
      conversion = "float"
      
  # 温度监控
  [[inputs.snmp.table]]
    name = "temperature"
    inherit_tags = ["hostname"]
    
    [[inputs.snmp.table.field]]
      name = "ciscoEnvMonTemperatureDescr"
      oid = "1.3.6.1.4.1.9.9.13.1.3.1.2"
      is_tag = true
      
    [[inputs.snmp.table.field]]
      name = "ciscoEnvMonTemperatureValue"
      oid = "1.3.6.1.4.1.9.9.13.1.3.1.3"
      conversion = "float"
      
    [[inputs.snmp.table.field]]
      name = "ciscoEnvMonTemperatureThreshold"
      oid = "1.3.6.1.4.1.9.9.13.1.3.1.4"
      conversion = "float"
      
    [[inputs.snmp.table.field]]
      name = "ciscoEnvMonTemperatureState"
      oid = "1.3.6.1.4.1.9.9.13.1.3.1.6"
      
  # VLAN信息
  [[inputs.snmp.table]]
    name = "vlan"
    inherit_tags = ["hostname"]
    
    [[inputs.snmp.table.field]]
      name = "vtpVlanIndex"
      oid = "1.3.6.1.4.1.9.9.46.1.3.1.1.1"
      is_tag = true
      
    [[inputs.snmp.table.field]]
      name = "vtpVlanName"
      oid = "1.3.6.1.4.1.9.9.46.1.3.1.1.2"
      is_tag = true
      
    [[inputs.snmp.table.field]]
      name = "vtpVlanState"
      oid = "1.3.6.1.4.1.9.9.46.1.3.1.1.3"
      
    [[inputs.snmp.table.field]]
      name = "vtpVlanType"
      oid = "1.3.6.1.4.1.9.9.46.1.3.1.1.4"

# 输出配置
[[outputs.prometheus]]
  listen = ":{{prometheus_port}}"
  metric_version = 2
  
[[outputs.influxdb_v2]]
  urls = ["{{influxdb_url}}"]
  token = "{{influxdb_token}}"
  organization = "{{influxdb_org}}"
  bucket = "{{influxdb_bucket}}"`,
  
  description: '基于Cisco官方MIB的完整交换机监控配置，支持接口流量、CPU、内存、温度、VLAN等全面监控',
  testedOIDs: [
    '1.3.6.1.2.1.1.1.0',      // sysDescr - 系统描述
    '1.3.6.1.2.1.1.5.0',      // sysName - 系统名称
    '1.3.6.1.2.1.2.2.1.2',    // ifDescr - 接口描述
    '1.3.6.1.2.1.2.2.1.8',    // ifOperStatus - 接口状态
    '1.3.6.1.2.1.2.2.1.10',   // ifInOctets - 入流量
    '1.3.6.1.2.1.2.2.1.16',   // ifOutOctets - 出流量
    '1.3.6.1.4.1.9.9.109.1.1.1.1.2', // CPU 1分钟
    '1.3.6.1.4.1.9.9.48.1.1.1.5',    // 内存使用
    '1.3.6.1.4.1.9.9.13.1.3.1.3',    // 温度值
  ],
  expectedMetrics: [
    'snmp_cisco_switch_interface_in_octets',
    'snmp_cisco_switch_interface_out_octets',
    'snmp_cisco_switch_interface_oper_status',
    'snmp_cisco_switch_cpu_total_1min',
    'snmp_cisco_switch_memory_pool_used',
    'snmp_cisco_switch_temperature_value',
    'snmp_cisco_switch_vlan_state'
  ]
}