/**
 * 扩展厂商MIB支持
 * Arista、Extreme Networks、Juniper、F5等厂商设备MIB支持
 * 
 * @author SNMP Platform Team
 * @version 1.0.0
 * @date 2024-12-18
 */

import { z } from 'zod';

// 基础类型定义
export interface VendorMIB {
  vendor: string;
  productLine: string;
  version: string;
  oids: Record<string, MIBObject>;
  tables: Record<string, MIBTable>;
  capabilities: string[];
  supportedVersions: string[];
}

export interface MIBObject {
  oid: string;
  name: string;
  type: 'INTEGER' | 'STRING' | 'GAUGE' | 'COUNTER' | 'TIMETICKS' | 'IPADDRESS' | 'OBJECTID';
  access: 'read-only' | 'read-write' | 'write-only' | 'not-accessible';
  description: string;
  unit?: string;
  range?: [number, number];
  enumValues?: Record<number, string>;
}

export interface MIBTable {
  oid: string;
  name: string;
  description: string;
  columns: Record<string, MIBObject>;
  indices: string[];
}

export interface DeviceCapability {
  feature: string;
  supported: boolean;
  version?: string;
  limitations?: string[];
}

export interface VendorProfile {
  vendor: string;
  models: string[];
  defaultCommunity: string;
  defaultPort: number;
  authMethods: ('v1' | 'v2c' | 'v3')[];
  bulkOperations: boolean;
  maxOidsPerRequest: number;
  timeoutMs: number;
  retries: number;
}

// 验证模式
const mibObjectSchema = z.object({
  oid: z.string().regex(/^1\.\d+(\.\d+)*$/),
  name: z.string().min(1),
  type: z.enum(['INTEGER', 'STRING', 'GAUGE', 'COUNTER', 'TIMETICKS', 'IPADDRESS', 'OBJECTID']),
  access: z.enum(['read-only', 'read-write', 'write-only', 'not-accessible']),
  description: z.string(),
  unit: z.string().optional(),
  range: z.tuple([z.number(), z.number()]).optional(),
  enumValues: z.record(z.number(), z.string()).optional()
});

/**
 * Arista网络设备MIB支持
 */
export class AristaMIBSupport {
  static readonly VENDOR = 'Arista';
  static readonly ENTERPRISE_OID = '1.3.6.1.4.1.30065';

  /**
   * Arista EOS系统MIB定义
   */
  static getEOSMIB(): VendorMIB {
    return {
      vendor: 'Arista',
      productLine: 'EOS',
      version: '4.0',
      capabilities: [
        'SNMP v1/v2c/v3',
        'BGP监控',
        'VLAN管理',
        '端口统计',
        '环境监控',
        'LLDP发现',
        'MAC地址表',
        '路由表监控'
      ],
      supportedVersions: ['4.20+', '4.21+', '4.22+', '4.23+'],
      oids: {
        // 系统信息
        'aristaSwFwdIpStatsTable': {
          oid: '1.3.6.1.4.1.30065.3.1.1',
          name: 'aristaSwFwdIpStatsTable',
          type: 'STRING',
          access: 'read-only',
          description: 'IP转发统计表'
        },
        'aristaEntSensorTable': {
          oid: '1.3.6.1.4.1.30065.3.2.1',
          name: 'aristaEntSensorTable',
          type: 'STRING',
          access: 'read-only',
          description: '环境传感器表'
        },
        // BGP状态
        'aristaBgp4V2PeerTable': {
          oid: '1.3.6.1.4.1.30065.4.1.1',
          name: 'aristaBgp4V2PeerTable',
          type: 'STRING',
          access: 'read-only',
          description: 'BGP邻居状态表'
        },
        // VLAN信息
        'aristaVlanTable': {
          oid: '1.3.6.1.4.1.30065.3.3.1',
          name: 'aristaVlanTable',
          type: 'STRING',
          access: 'read-only',
          description: 'VLAN配置表'
        },
        // LLDP信息
        'aristaLldpRemTable': {
          oid: '1.3.6.1.4.1.30065.3.4.1',
          name: 'aristaLldpRemTable',
          type: 'STRING',
          access: 'read-only',
          description: 'LLDP邻居发现表'
        }
      },
      tables: {
        'aristaInterfaceStatsTable': {
          oid: '1.3.6.1.4.1.30065.3.5.1',
          name: 'aristaInterfaceStatsTable',
          description: 'Arista接口统计表',
          indices: ['ifIndex'],
          columns: {
            'aristaIfInOctets': {
              oid: '1.3.6.1.4.1.30065.3.5.1.1.1',
              name: 'aristaIfInOctets',
              type: 'COUNTER',
              access: 'read-only',
              description: '接口入字节数',
              unit: 'bytes'
            },
            'aristaIfOutOctets': {
              oid: '1.3.6.1.4.1.30065.3.5.1.1.2',
              name: 'aristaIfOutOctets',
              type: 'COUNTER',
              access: 'read-only',
              description: '接口出字节数',
              unit: 'bytes'
            },
            'aristaIfUtilization': {
              oid: '1.3.6.1.4.1.30065.3.5.1.1.3',
              name: 'aristaIfUtilization',
              type: 'GAUGE',
              access: 'read-only',
              description: '接口利用率',
              unit: 'percent',
              range: [0, 100]
            }
          }
        }
      }
    };
  }

  /**
   * 获取Arista设备配置文件
   */
  static getVendorProfile(): VendorProfile {
    return {
      vendor: 'Arista',
      models: ['7050', '7060', '7160', '7280', '7320', '7500', '7800'],
      defaultCommunity: 'public',
      defaultPort: 161,
      authMethods: ['v2c', 'v3'],
      bulkOperations: true,
      maxOidsPerRequest: 50,
      timeoutMs: 5000,
      retries: 3
    };
  }
}

/**
 * Extreme Networks MIB支持
 */
export class ExtremeNetworksMIBSupport {
  static readonly VENDOR = 'Extreme';
  static readonly ENTERPRISE_OID = '1.3.6.1.4.1.1916';

  /**
   * Extreme EXOS系统MIB定义
   */
  static getEXOSMIB(): VendorMIB {
    return {
      vendor: 'Extreme',
      productLine: 'EXOS',
      version: '22.0',
      capabilities: [
        'SNMP v1/v2c/v3',
        '端口监控',
        'VLAN管理',
        '温度监控',
        '风扇状态',
        '电源监控',
        'STP状态',
        'LAG配置'
      ],
      supportedVersions: ['22.1+', '22.2+', '22.3+', '22.4+'],
      oids: {
        // 系统状态
        'extremeSystemStatsTable': {
          oid: '1.3.6.1.4.1.1916.1.1.1',
          name: 'extremeSystemStatsTable',
          type: 'STRING',
          access: 'read-only',
          description: '系统统计表'
        },
        // 温度传感器
        'extremeCurrentTemperature': {
          oid: '1.3.6.1.4.1.1916.1.1.1.8',
          name: 'extremeCurrentTemperature',
          type: 'INTEGER',
          access: 'read-only',
          description: '当前温度',
          unit: 'celsius'
        },
        // 风扇状态
        'extremeFanStatusTable': {
          oid: '1.3.6.1.4.1.1916.1.1.1.9',
          name: 'extremeFanStatusTable',
          type: 'STRING',
          access: 'read-only',
          description: '风扇状态表'
        },
        // 电源状态
        'extremePowerSupplyTable': {
          oid: '1.3.6.1.4.1.1916.1.1.1.10',
          name: 'extremePowerSupplyTable',
          type: 'STRING',
          access: 'read-only',
          description: '电源状态表'
        }
      },
      tables: {
        'extremePortStatsTable': {
          oid: '1.3.6.1.4.1.1916.1.4.1.1',
          name: 'extremePortStatsTable',
          description: 'Extreme端口统计表',
          indices: ['extremePortIndex'],
          columns: {
            'extremePortRxPkts': {
              oid: '1.3.6.1.4.1.1916.1.4.1.1.1',
              name: 'extremePortRxPkts',
              type: 'COUNTER',
              access: 'read-only',
              description: '端口接收包数',
              unit: 'packets'
            },
            'extremePortTxPkts': {
              oid: '1.3.6.1.4.1.1916.1.4.1.1.2',
              name: 'extremePortTxPkts',
              type: 'COUNTER',
              access: 'read-only',
              description: '端口发送包数',
              unit: 'packets'
            },
            'extremePortCollisions': {
              oid: '1.3.6.1.4.1.1916.1.4.1.1.3',
              name: 'extremePortCollisions',
              type: 'COUNTER',
              access: 'read-only',
              description: '端口冲突数',
              unit: 'count'
            }
          }
        }
      }
    };
  }

  /**
   * 获取Extreme设备配置文件
   */
  static getVendorProfile(): VendorProfile {
    return {
      vendor: 'Extreme',
      models: ['X440', 'X450', 'X460', 'X465', 'X590', 'X620', 'X690', 'X870'],
      defaultCommunity: 'public',
      defaultPort: 161,
      authMethods: ['v1', 'v2c', 'v3'],
      bulkOperations: true,
      maxOidsPerRequest: 40,
      timeoutMs: 6000,
      retries: 3
    };
  }
}

/**
 * Juniper设备MIB支持
 */
export class JuniperMIBSupport {
  static readonly VENDOR = 'Juniper';
  static readonly ENTERPRISE_OID = '1.3.6.1.4.1.2636';

  /**
   * Juniper JUNOS系统MIB定义
   */
  static getJUNOSMIB(): VendorMIB {
    return {
      vendor: 'Juniper',
      productLine: 'JUNOS',
      version: '20.0',
      capabilities: [
        'SNMP v1/v2c/v3',
        'BGP/OSPF/ISIS监控',
        'MPLS统计',
        '接口流量监控',
        '系统资源监控',
        '路由引擎状态',
        'FPC状态监控',
        '光模块监控'
      ],
      supportedVersions: ['19.4+', '20.1+', '20.2+', '20.3+', '20.4+'],
      oids: {
        // 系统信息
        'jnxBoxDescr': {
          oid: '1.3.6.1.4.1.2636.3.1.2.0',
          name: 'jnxBoxDescr',
          type: 'STRING',
          access: 'read-only',
          description: '设备描述'
        },
        'jnxBoxSerialNo': {
          oid: '1.3.6.1.4.1.2636.3.1.3.0',
          name: 'jnxBoxSerialNo',
          type: 'STRING',
          access: 'read-only',
          description: '设备序列号'
        },
        // 操作状态
        'jnxOperatingState': {
          oid: '1.3.6.1.4.1.2636.3.1.13.1.6',
          name: 'jnxOperatingState',
          type: 'INTEGER',
          access: 'read-only',
          description: '操作状态',
          enumValues: {
            1: 'unknown',
            2: 'running',
            3: 'ready',
            4: 'reset',
            5: 'runningAtFullSpeed',
            6: 'down',
            7: 'standby'
          }
        },
        // BGP状态
        'jnxBgpM2PeerTable': {
          oid: '1.3.6.1.4.1.2636.5.1.1.2.1.1',
          name: 'jnxBgpM2PeerTable',
          type: 'STRING',
          access: 'read-only',
          description: 'BGP邻居表'
        }
      },
      tables: {
        'jnxOperatingTable': {
          oid: '1.3.6.1.4.1.2636.3.1.13.1',
          name: 'jnxOperatingTable',
          description: 'Juniper操作状态表',
          indices: ['jnxContentsContainerIndex', 'jnxContentsL1Index', 'jnxContentsL2Index', 'jnxContentsL3Index'],
          columns: {
            'jnxOperatingDescr': {
              oid: '1.3.6.1.4.1.2636.3.1.13.1.5',
              name: 'jnxOperatingDescr',
              type: 'STRING',
              access: 'read-only',
              description: '组件描述'
            },
            'jnxOperatingState': {
              oid: '1.3.6.1.4.1.2636.3.1.13.1.6',
              name: 'jnxOperatingState',
              type: 'INTEGER',
              access: 'read-only',
              description: '操作状态'
            },
            'jnxOperatingTemp': {
              oid: '1.3.6.1.4.1.2636.3.1.13.1.7',
              name: 'jnxOperatingTemp',
              type: 'GAUGE',
              access: 'read-only',
              description: '操作温度',
              unit: 'celsius'
            },
            'jnxOperatingCPU': {
              oid: '1.3.6.1.4.1.2636.3.1.13.1.8',
              name: 'jnxOperatingCPU',
              type: 'GAUGE',
              access: 'read-only',
              description: 'CPU利用率',
              unit: 'percent',
              range: [0, 100]
            }
          }
        }
      }
    };
  }

  /**
   * 获取Juniper设备配置文件
   */
  static getVendorProfile(): VendorProfile {
    return {
      vendor: 'Juniper',
      models: ['MX', 'EX', 'QFX', 'SRX', 'PTX', 'ACX', 'NFX'],
      defaultCommunity: 'public',
      defaultPort: 161,
      authMethods: ['v2c', 'v3'],
      bulkOperations: true,
      maxOidsPerRequest: 30,
      timeoutMs: 8000,
      retries: 2
    };
  }
}

/**
 * F5负载均衡器MIB支持
 */
export class F5MIBSupport {
  static readonly VENDOR = 'F5';
  static readonly ENTERPRISE_OID = '1.3.6.1.4.1.3375';

  /**
   * F5 BIG-IP系统MIB定义
   */
  static getBIGIPMIB(): VendorMIB {
    return {
      vendor: 'F5',
      productLine: 'BIG-IP',
      version: '15.0',
      capabilities: [
        'SNMP v1/v2c/v3',
        '虚拟服务器监控',
        '连接池状态',
        'SSL统计',
        '系统资源监控',
        '网络接口统计',
        '高可用状态',
        '许可证监控'
      ],
      supportedVersions: ['14.1+', '15.0+', '15.1+', '16.0+', '16.1+'],
      oids: {
        // 系统信息
        'ltmVirtualServStatTable': {
          oid: '1.3.6.1.4.1.3375.2.2.10.2.3.1',
          name: 'ltmVirtualServStatTable',
          type: 'STRING',
          access: 'read-only',
          description: '虚拟服务器统计表'
        },
        'ltmPoolStatTable': {
          oid: '1.3.6.1.4.1.3375.2.2.5.5.3.1',
          name: 'ltmPoolStatTable',
          type: 'STRING',
          access: 'read-only',
          description: '连接池统计表'
        },
        // SSL统计
        'ltmSslStatTable': {
          oid: '1.3.6.1.4.1.3375.2.1.1.2.9.2.1',
          name: 'ltmSslStatTable',
          type: 'STRING',
          access: 'read-only',
          description: 'SSL统计表'
        },
        // 系统状态
        'sysGlobalHostCpuUsageRatio5s': {
          oid: '1.3.6.1.4.1.3375.2.1.1.2.20.44.0',
          name: 'sysGlobalHostCpuUsageRatio5s',
          type: 'GAUGE',
          access: 'read-only',
          description: '5秒CPU使用率',
          unit: 'percent'
        },
        'sysGlobalHostMemoryUsed': {
          oid: '1.3.6.1.4.1.3375.2.1.1.2.1.44.0',
          name: 'sysGlobalHostMemoryUsed',
          type: 'GAUGE',
          access: 'read-only',
          description: '内存使用量',
          unit: 'bytes'
        }
      },
      tables: {
        'ltmVirtualServTable': {
          oid: '1.3.6.1.4.1.3375.2.2.10.1.2.1',
          name: 'ltmVirtualServTable',
          description: 'F5虚拟服务器表',
          indices: ['ltmVirtualServName'],
          columns: {
            'ltmVsStatusAvailState': {
              oid: '1.3.6.1.4.1.3375.2.2.10.1.2.1.2',
              name: 'ltmVsStatusAvailState',
              type: 'INTEGER',
              access: 'read-only',
              description: '虚拟服务器可用状态',
              enumValues: {
                0: 'none',
                1: 'green',
                2: 'yellow',
                3: 'red',
                4: 'blue'
              }
            },
            'ltmVsStatusEnabledState': {
              oid: '1.3.6.1.4.1.3375.2.2.10.1.2.1.3',
              name: 'ltmVsStatusEnabledState',
              type: 'INTEGER',
              access: 'read-only',
              description: '虚拟服务器启用状态',
              enumValues: {
                0: 'none',
                1: 'enabled',
                2: 'disabled',
                3: 'disabledByParent'
              }
            },
            'ltmVsConnLimit': {
              oid: '1.3.6.1.4.1.3375.2.2.10.1.2.1.7',
              name: 'ltmVsConnLimit',
              type: 'GAUGE',
              access: 'read-only',
              description: '连接限制',
              unit: 'connections'
            }
          }
        }
      }
    };
  }

  /**
   * 获取F5设备配置文件
   */
  static getVendorProfile(): VendorProfile {
    return {
      vendor: 'F5',
      models: ['BIG-IP i2000', 'BIG-IP i4000', 'BIG-IP i5000', 'BIG-IP i7000', 'BIG-IP i10000', 'BIG-IP VE'],
      defaultCommunity: 'public',
      defaultPort: 161,
      authMethods: ['v2c', 'v3'],
      bulkOperations: true,
      maxOidsPerRequest: 25,
      timeoutMs: 10000,
      retries: 2
    };
  }
}

/**
 * 扩展厂商MIB管理器
 */
export class ExtendedVendorMIBManager {
  private vendors: Map<string, VendorMIB[]> = new Map();
  private profiles: Map<string, VendorProfile> = new Map();

  constructor() {
    this.initializeVendors();
  }

  /**
   * 初始化厂商支持
   */
  private initializeVendors(): void {
    // 注册Arista支持
    this.registerVendor('Arista', [AristaMIBSupport.getEOSMIB()]);
    this.registerProfile('Arista', AristaMIBSupport.getVendorProfile());

    // 注册Extreme支持
    this.registerVendor('Extreme', [ExtremeNetworksMIBSupport.getEXOSMIB()]);
    this.registerProfile('Extreme', ExtremeNetworksMIBSupport.getVendorProfile());

    // 注册Juniper支持
    this.registerVendor('Juniper', [JuniperMIBSupport.getJUNOSMIB()]);
    this.registerProfile('Juniper', JuniperMIBSupport.getVendorProfile());

    // 注册F5支持
    this.registerVendor('F5', [F5MIBSupport.getBIGIPMIB()]);
    this.registerProfile('F5', F5MIBSupport.getVendorProfile());
  }

  /**
   * 注册厂商MIB
   */
  registerVendor(vendor: string, mibs: VendorMIB[]): void {
    this.vendors.set(vendor, mibs);
  }

  /**
   * 注册厂商配置文件
   */
  registerProfile(vendor: string, profile: VendorProfile): void {
    this.profiles.set(vendor, profile);
  }

  /**
   * 获取厂商MIB
   */
  getVendorMIBs(vendor: string): VendorMIB[] {
    return this.vendors.get(vendor) || [];
  }

  /**
   * 获取厂商配置文件
   */
  getVendorProfile(vendor: string): VendorProfile | null {
    return this.profiles.get(vendor) || null;
  }

  /**
   * 根据OID查找厂商
   */
  findVendorByOID(oid: string): string | null {
    for (const [vendor, mibs] of this.vendors) {
      for (const mib of mibs) {
        if (oid.startsWith(this.getEnterpriseOID(vendor))) {
          return vendor;
        }
      }
    }
    return null;
  }

  /**
   * 获取企业OID
   */
  private getEnterpriseOID(vendor: string): string {
    const enterpriseOIDs: Record<string, string> = {
      'Arista': AristaMIBSupport.ENTERPRISE_OID,
      'Extreme': ExtremeNetworksMIBSupport.ENTERPRISE_OID,
      'Juniper': JuniperMIBSupport.ENTERPRISE_OID,
      'F5': F5MIBSupport.ENTERPRISE_OID
    };
    return enterpriseOIDs[vendor] || '';
  }

  /**
   * 获取所有支持的厂商
   */
  getSupportedVendors(): string[] {
    return Array.from(this.vendors.keys());
  }

  /**
   * 获取厂商模型列表
   */
  getVendorModels(vendor: string): string[] {
    const profile = this.getVendorProfile(vendor);
    return profile?.models || [];
  }

  /**
   * 检查厂商能力
   */
  checkVendorCapability(vendor: string, capability: string): boolean {
    const mibs = this.getVendorMIBs(vendor);
    return mibs.some(mib => mib.capabilities.includes(capability));
  }

  /**
   * 获取推荐的SNMP配置
   */
  getRecommendedSNMPConfig(vendor: string, model?: string): any {
    const profile = this.getVendorProfile(vendor);
    if (!profile) {
      return null;
    }

    return {
      vendor: profile.vendor,
      model: model || 'generic',
      snmp: {
        community: profile.defaultCommunity,
        port: profile.defaultPort,
        version: profile.authMethods[profile.authMethods.length - 1],
        timeout: profile.timeoutMs,
        retries: profile.retries,
        bulkOperations: profile.bulkOperations,
        maxOidsPerRequest: profile.maxOidsPerRequest
      }
    };
  }

  /**
   * 验证OID格式
   */
  validateOID(oid: string): boolean {
    const oidRegex = /^1\.\d+(\.\d+)*$/;
    return oidRegex.test(oid);
  }

  /**
   * 获取MIB对象信息
   */
  getMIBObject(vendor: string, objectName: string): MIBObject | null {
    const mibs = this.getVendorMIBs(vendor);
    for (const mib of mibs) {
      if (mib.oids[objectName]) {
        return mib.oids[objectName];
      }
    }
    return null;
  }

  /**
   * 获取MIB表信息
   */
  getMIBTable(vendor: string, tableName: string): MIBTable | null {
    const mibs = this.getVendorMIBs(vendor);
    for (const mib of mibs) {
      if (mib.tables[tableName]) {
        return mib.tables[tableName];
      }
    }
    return null;
  }

  /**
   * 搜索MIB对象
   */
  searchMIBObjects(vendor: string, searchTerm: string): MIBObject[] {
    const results: MIBObject[] = [];
    const mibs = this.getVendorMIBs(vendor);
    
    for (const mib of mibs) {
      for (const [name, obj] of Object.entries(mib.oids)) {
        if (name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            obj.description.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push(obj);
        }
      }
    }
    
    return results;
  }

  /**
   * 生成厂商MIB报告
   */
  generateVendorReport(vendor: string): any {
    const mibs = this.getVendorMIBs(vendor);
    const profile = this.getVendorProfile(vendor);
    
    if (!mibs.length || !profile) {
      return null;
    }

    const report = {
      vendor,
      profile,
      mibs: mibs.map(mib => ({
        productLine: mib.productLine,
        version: mib.version,
        capabilities: mib.capabilities,
        supportedVersions: mib.supportedVersions,
        objectCount: Object.keys(mib.oids).length,
        tableCount: Object.keys(mib.tables).length
      })),
      summary: {
        totalObjects: mibs.reduce((sum, mib) => sum + Object.keys(mib.oids).length, 0),
        totalTables: mibs.reduce((sum, mib) => sum + Object.keys(mib.tables).length, 0),
        allCapabilities: Array.from(new Set(mibs.flatMap(mib => mib.capabilities))).sort()
      }
    };

    return report;
  }

  /**
   * 导出厂商MIB配置
   */
  exportVendorConfig(vendor: string): string {
    const mibs = this.getVendorMIBs(vendor);
    const profile = this.getVendorProfile(vendor);
    
    const config = {
      vendor,
      profile,
      mibs,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * 导入厂商MIB配置
   */
  importVendorConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      
      if (config.vendor && config.mibs && config.profile) {
        this.registerVendor(config.vendor, config.mibs);
        this.registerProfile(config.vendor, config.profile);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('导入厂商配置失败:', error);
      return false;
    }
  }

  /**
   * 获取统计信息
   */
  getStatistics(): any {
    const stats = {
      totalVendors: this.vendors.size,
      vendorDetails: {} as Record<string, any>
    };

    for (const [vendor, mibs] of this.vendors) {
      const profile = this.getVendorProfile(vendor);
      stats.vendorDetails[vendor] = {
        mibCount: mibs.length,
        modelCount: profile?.models.length || 0,
        totalObjects: mibs.reduce((sum, mib) => sum + Object.keys(mib.oids).length, 0),
        totalTables: mibs.reduce((sum, mib) => sum + Object.keys(mib.tables).length, 0),
        capabilities: Array.from(new Set(mibs.flatMap(mib => mib.capabilities))).length
      };
    }

    return stats;
  }
}

// 默认实例
export const extendedVendorMIBManager = new ExtendedVendorMIBManager();

export default ExtendedVendorMIBManager;