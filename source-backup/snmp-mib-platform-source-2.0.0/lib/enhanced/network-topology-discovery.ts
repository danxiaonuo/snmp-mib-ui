/**
 * 网络拓扑自动发现
 * LLDP/CDP协议拓扑发现、自动绘制网络拓扑图、设备连接关系分析
 * 
 * @author SNMP Platform Team
 * @version 1.0.0
 * @date 2024-12-18
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// 基础类型定义
export interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  mac: string;
  vendor: string;
  model: string;
  version: string;
  capabilities: DeviceCapability[];
  interfaces: NetworkInterface[];
  coordinates?: { x: number; y: number };
  discovered: Date;
  lastSeen: Date;
}

export interface NetworkInterface {
  id: string;
  name: string;
  description: string;
  type: string;
  speed: number;
  status: 'up' | 'down' | 'unknown';
  macAddress?: string;
  vlan?: number;
  ipAddress?: string;
  neighbors: NeighborInfo[];
}

export interface NeighborInfo {
  protocol: 'LLDP' | 'CDP' | 'EDP' | 'FDP';
  remoteDeviceId: string;
  remoteDeviceName: string;
  remotePortId: string;
  remotePortDescription: string;
  systemCapabilities: string[];
  lastUpdated: Date;
}

export interface DeviceCapability {
  type: 'bridge' | 'router' | 'switch' | 'wlan' | 'telephone' | 'repeater' | 'station' | 'other';
  enabled: boolean;
}

export interface TopologyLink {
  id: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  sourceInterface: string;
  targetInterface: string;
  protocol: string;
  linkType: 'ethernet' | 'fiber' | 'wireless' | 'serial' | 'virtual';
  bandwidth: number;
  status: 'active' | 'inactive' | 'unknown';
  discovered: Date;
  metrics?: LinkMetrics;
}

export interface LinkMetrics {
  utilization: number;
  latency: number;
  packetLoss: number;
  errors: number;
  lastUpdated: Date;
}

export interface TopologyGraph {
  devices: Map<string, NetworkDevice>;
  links: Map<string, TopologyLink>;
  subnets: NetworkSubnet[];
  metadata: TopologyMetadata;
}

export interface NetworkSubnet {
  id: string;
  cidr: string;
  gateway: string;
  devices: string[];
  vlan?: number;
}

export interface TopologyMetadata {
  discoveredAt: Date;
  totalDevices: number;
  totalLinks: number;
  protocolsUsed: string[];
  discoveryDuration: number;
  coverage: number;
}

export interface DiscoveryConfig {
  protocols: ('LLDP' | 'CDP' | 'EDP' | 'FDP')[];
  scanInterval: number;
  timeout: number;
  maxHops: number;
  includeEndHosts: boolean;
  autoLayout: boolean;
  persistResults: boolean;
  excludeInterfaces: string[];
  seedDevices: string[];
}

// 验证模式
const discoveryConfigSchema = z.object({
  protocols: z.array(z.enum(['LLDP', 'CDP', 'EDP', 'FDP'])),
  scanInterval: z.number().positive(),
  timeout: z.number().positive(),
  maxHops: z.number().min(1).max(20),
  includeEndHosts: z.boolean(),
  autoLayout: z.boolean(),
  persistResults: z.boolean(),
  excludeInterfaces: z.array(z.string()),
  seedDevices: z.array(z.string())
});

/**
 * LLDP协议处理器
 */
export class LLDPDiscovery {
  // LLDP MIB OIDs
  static readonly LLDP_LOCAL_SYSTEM_DATA = '1.0.8802.1.1.2.1.3';
  static readonly LLDP_REMOTE_SYSTEMS_DATA = '1.0.8802.1.1.2.1.4';
  static readonly LLDP_LOCAL_PORT_TABLE = '1.0.8802.1.1.2.1.3.7.1';
  static readonly LLDP_REMOTE_TABLE = '1.0.8802.1.1.2.1.4.1.1';

  /**
   * 发现LLDP邻居
   */
  static async discoverNeighbors(deviceIp: string, snmpConfig: any): Promise<NeighborInfo[]> {
    const neighbors: NeighborInfo[] = [];
    
    try {
      // 获取LLDP远程系统表
      const remoteTable = await this.walkLLDPRemoteTable(deviceIp, snmpConfig);
      
      for (const entry of remoteTable) {
        const neighbor: NeighborInfo = {
          protocol: 'LLDP',
          remoteDeviceId: entry.remoteChassisId,
          remoteDeviceName: entry.remoteSysName || entry.remoteChassisId,
          remotePortId: entry.remotePortId,
          remotePortDescription: entry.remotePortDesc || '',
          systemCapabilities: this.parseCapabilities(entry.remoteCapabilities),
          lastUpdated: new Date()
        };
        
        neighbors.push(neighbor);
      }
      
      return neighbors;
      
    } catch (error) {
      console.error(`LLDP发现失败 ${deviceIp}:`, error);
      return [];
    }
  }

  /**
   * 遍历LLDP远程表
   */
  private static async walkLLDPRemoteTable(deviceIp: string, snmpConfig: any): Promise<any[]> {
    // 模拟SNMP表遍历
    const mockData = [
      {
        localPortNum: 1,
        remoteChassisIdSubtype: 4,
        remoteChassisId: '00:1a:2b:3c:4d:5e',
        remotePortIdSubtype: 5,
        remotePortId: 'GigabitEthernet0/1',
        remoteSysName: 'Switch-Core-01',
        remotePortDesc: 'Core Switch Port 1',
        remoteCapabilities: '0x14' // Bridge + Router
      }
    ];
    
    return mockData;
  }

  /**
   * 解析设备能力
   */
  private static parseCapabilities(capabilitiesHex: string): string[] {
    const capabilities: string[] = [];
    const capValue = parseInt(capabilitiesHex, 16);
    
    if (capValue & 0x01) capabilities.push('repeater');
    if (capValue & 0x02) capabilities.push('bridge');
    if (capValue & 0x04) capabilities.push('wlan');
    if (capValue & 0x08) capabilities.push('router');
    if (capValue & 0x10) capabilities.push('telephone');
    if (capValue & 0x20) capabilities.push('docsis');
    if (capValue & 0x40) capabilities.push('station');
    
    return capabilities;
  }
}

/**
 * CDP协议处理器
 */
export class CDPDiscovery {
  // CDP MIB OIDs
  static readonly CDP_INTERFACE_TABLE = '1.3.6.1.4.1.9.9.23.1.1.1';
  static readonly CDP_NEIGHBOR_TABLE = '1.3.6.1.4.1.9.9.23.1.2.1';

  /**
   * 发现CDP邻居
   */
  static async discoverNeighbors(deviceIp: string, snmpConfig: any): Promise<NeighborInfo[]> {
    const neighbors: NeighborInfo[] = [];
    
    try {
      const neighborTable = await this.walkCDPNeighborTable(deviceIp, snmpConfig);
      
      for (const entry of neighborTable) {
        const neighbor: NeighborInfo = {
          protocol: 'CDP',
          remoteDeviceId: entry.deviceId,
          remoteDeviceName: entry.deviceName || entry.deviceId,
          remotePortId: entry.portId,
          remotePortDescription: entry.portName || '',
          systemCapabilities: this.parseCapabilities(entry.capabilities),
          lastUpdated: new Date()
        };
        
        neighbors.push(neighbor);
      }
      
      return neighbors;
      
    } catch (error) {
      console.error(`CDP发现失败 ${deviceIp}:`, error);
      return [];
    }
  }

  /**
   * 遍历CDP邻居表
   */
  private static async walkCDPNeighborTable(deviceIp: string, snmpConfig: any): Promise<any[]> {
    // 模拟SNMP表遍历
    const mockData = [
      {
        ifIndex: 2,
        deviceId: 'Router-Edge-01.domain.com',
        deviceName: 'Router-Edge-01',
        portId: 'FastEthernet0/1',
        portName: 'Fa0/1',
        capabilities: 0x11, // Router + Switch
        platform: 'cisco ISR4331',
        ipAddress: '192.168.1.1'
      }
    ];
    
    return mockData;
  }

  /**
   * 解析CDP能力
   */
  private static parseCapabilities(capValue: number): string[] {
    const capabilities: string[] = [];
    
    if (capValue & 0x01) capabilities.push('router');
    if (capValue & 0x02) capabilities.push('bridge');
    if (capValue & 0x04) capabilities.push('sourceRouteBridge');
    if (capValue & 0x08) capabilities.push('switch');
    if (capValue & 0x10) capabilities.push('host');
    if (capValue & 0x20) capabilities.push('igmpEnabled');
    if (capValue & 0x40) capabilities.push('repeater');
    
    return capabilities;
  }
}

/**
 * 网络拓扑自动发现引擎
 */
export class NetworkTopologyDiscovery extends EventEmitter {
  private config: DiscoveryConfig;
  private topology: TopologyGraph;
  private discoveryTimer?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private snmpClient: any; // SNMP客户端实例

  constructor(config: DiscoveryConfig) {
    super();
    
    // 验证配置
    this.config = discoveryConfigSchema.parse(config);
    
    // 初始化拓扑图
    this.topology = {
      devices: new Map(),
      links: new Map(),
      subnets: [],
      metadata: {
        discoveredAt: new Date(),
        totalDevices: 0,
        totalLinks: 0,
        protocolsUsed: [],
        discoveryDuration: 0,
        coverage: 0
      }
    };
  }

  /**
   * 开始拓扑发现
   */
  async startDiscovery(): Promise<void> {
    if (this.isRunning) {
      throw new Error('拓扑发现已在运行中');
    }

    this.isRunning = true;
    this.emit('discovery:started');

    try {
      // 执行初始发现
      await this.performDiscovery();
      
      // 设置定期发现
      if (this.config.scanInterval > 0) {
        this.discoveryTimer = setInterval(async () => {
          await this.performDiscovery();
        }, this.config.scanInterval);
      }
      
    } catch (error) {
      this.isRunning = false;
      this.emit('discovery:error', error);
      throw error;
    }
  }

  /**
   * 停止拓扑发现
   */
  stopDiscovery(): void {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = undefined;
    }
    
    this.isRunning = false;
    this.emit('discovery:stopped');
  }

  /**
   * 执行拓扑发现
   */
  private async performDiscovery(): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.emit('discovery:progress', { stage: 'starting', progress: 0 });
      
      // 清理过期数据
      this.cleanupStaleData();
      
      // 从种子设备开始发现
      const discoveredDevices = new Set<string>();
      const deviceQueue = [...this.config.seedDevices];
      let hop = 0;
      
      while (deviceQueue.length > 0 && hop < this.config.maxHops) {
        const batchSize = Math.min(10, deviceQueue.length);
        const currentBatch = deviceQueue.splice(0, batchSize);
        
        this.emit('discovery:progress', { 
          stage: 'scanning', 
          progress: (hop / this.config.maxHops) * 100,
          hop,
          devices: currentBatch.length
        });
        
        const batchPromises = currentBatch.map(async (deviceIp) => {
          if (discoveredDevices.has(deviceIp)) return;
          
          try {
            const device = await this.discoverDevice(deviceIp);
            if (device) {
              this.topology.devices.set(device.id, device);
              discoveredDevices.add(deviceIp);
              
              // 发现邻居设备
              const neighbors = await this.discoverNeighbors(deviceIp);
              
              // 添加新发现的设备到队列
              for (const neighbor of neighbors) {
                const neighborIp = this.resolveNeighborIP(neighbor);
                if (neighborIp && !discoveredDevices.has(neighborIp)) {
                  deviceQueue.push(neighborIp);
                }
              }
              
              // 创建链路
              await this.createTopologyLinks(device, neighbors);
            }
          } catch (error) {
            console.error(`发现设备失败 ${deviceIp}:`, error);
          }
        });
        
        await Promise.allSettled(batchPromises);
        hop++;
      }
      
      // 分析网络子网
      this.analyzeNetworkSubnets();
      
      // 自动布局
      if (this.config.autoLayout) {
        this.calculateLayout();
      }
      
      // 更新元数据
      this.updateMetadata(Date.now() - startTime);
      
      // 持久化结果
      if (this.config.persistResults) {
        await this.persistTopology();
      }
      
      this.emit('discovery:completed', {
        devices: this.topology.devices.size,
        links: this.topology.links.size,
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      this.emit('discovery:error', error);
      throw error;
    }
  }

  /**
   * 发现单个设备
   */
  private async discoverDevice(deviceIp: string): Promise<NetworkDevice | null> {
    try {
      // 获取设备基本信息
      const systemInfo = await this.getSystemInfo(deviceIp);
      if (!systemInfo) return null;
      
      // 获取接口信息
      const interfaces = await this.getInterfaces(deviceIp);
      
      const device: NetworkDevice = {
        id: this.generateDeviceId(deviceIp, systemInfo.mac),
        name: systemInfo.name || deviceIp,
        ip: deviceIp,
        mac: systemInfo.mac,
        vendor: systemInfo.vendor || 'Unknown',
        model: systemInfo.model || 'Unknown',
        version: systemInfo.version || 'Unknown',
        capabilities: systemInfo.capabilities || [],
        interfaces,
        discovered: new Date(),
        lastSeen: new Date()
      };
      
      this.emit('device:discovered', device);
      return device;
      
    } catch (error) {
      console.error(`获取设备信息失败 ${deviceIp}:`, error);
      return null;
    }
  }

  /**
   * 发现设备邻居
   */
  private async discoverNeighbors(deviceIp: string): Promise<NeighborInfo[]> {
    const allNeighbors: NeighborInfo[] = [];
    
    for (const protocol of this.config.protocols) {
      try {
        let neighbors: NeighborInfo[] = [];
        
        switch (protocol) {
          case 'LLDP':
            neighbors = await LLDPDiscovery.discoverNeighbors(deviceIp, this.snmpClient);
            break;
          case 'CDP':
            neighbors = await CDPDiscovery.discoverNeighbors(deviceIp, this.snmpClient);
            break;
          // 其他协议的实现
        }
        
        allNeighbors.push(...neighbors);
        
      } catch (error) {
        console.error(`${protocol}邻居发现失败 ${deviceIp}:`, error);
      }
    }
    
    return allNeighbors;
  }

  /**
   * 获取系统信息
   */
  private async getSystemInfo(deviceIp: string): Promise<any> {
    // 模拟SNMP获取系统信息
    return {
      name: `Device-${deviceIp.split('.').pop()}`,
      mac: this.generateMockMAC(),
      vendor: 'Cisco',
      model: 'Catalyst 3850',
      version: '16.12.03',
      capabilities: [
        { type: 'bridge', enabled: true },
        { type: 'router', enabled: true }
      ]
    };
  }

  /**
   * 获取接口信息
   */
  private async getInterfaces(deviceIp: string): Promise<NetworkInterface[]> {
    // 模拟接口数据
    const interfaces: NetworkInterface[] = [];
    
    for (let i = 1; i <= 24; i++) {
      interfaces.push({
        id: `${deviceIp}-${i}`,
        name: `GigabitEthernet1/0/${i}`,
        description: `Port ${i}`,
        type: 'ethernetCsmacd',
        speed: 1000000000,
        status: Math.random() > 0.3 ? 'up' : 'down',
        macAddress: this.generateMockMAC(),
        neighbors: []
      });
    }
    
    return interfaces;
  }

  /**
   * 创建拓扑链路
   */
  private async createTopologyLinks(device: NetworkDevice, neighbors: NeighborInfo[]): Promise<void> {
    for (const neighbor of neighbors) {
      const linkId = this.generateLinkId(device.id, neighbor.remoteDeviceId);
      
      if (this.topology.links.has(linkId)) {
        continue; // 链路已存在
      }
      
      const link: TopologyLink = {
        id: linkId,
        sourceDeviceId: device.id,
        targetDeviceId: neighbor.remoteDeviceId,
        sourceInterface: this.findSourceInterface(device, neighbor),
        targetInterface: neighbor.remotePortId,
        protocol: neighbor.protocol,
        linkType: this.determineLinkType(neighbor),
        bandwidth: this.estimateBandwidth(neighbor),
        status: 'active',
        discovered: new Date()
      };
      
      this.topology.links.set(linkId, link);
      this.emit('link:discovered', link);
    }
  }

  /**
   * 分析网络子网
   */
  private analyzeNetworkSubnets(): void {
    const subnets = new Map<string, Set<string>>();
    
    for (const device of this.topology.devices.values()) {
      const subnet = this.getSubnetFromIP(device.ip);
      if (!subnets.has(subnet)) {
        subnets.set(subnet, new Set());
      }
      subnets.get(subnet)!.add(device.id);
    }
    
    this.topology.subnets = Array.from(subnets.entries()).map(([cidr, deviceIds]) => ({
      id: cidr,
      cidr,
      gateway: this.calculateGateway(cidr),
      devices: Array.from(deviceIds)
    }));
  }

  /**
   * 计算自动布局
   */
  private calculateLayout(): void {
    const devices = Array.from(this.topology.devices.values());
    const links = Array.from(this.topology.links.values());
    
    // 使用力导向布局算法
    const layout = new ForceDirectedLayout(devices, links);
    const positions = layout.calculate();
    
    // 更新设备坐标
    for (const [deviceId, position] of positions) {
      const device = this.topology.devices.get(deviceId);
      if (device) {
        device.coordinates = position;
      }
    }
  }

  /**
   * 更新元数据
   */
  private updateMetadata(duration: number): void {
    this.topology.metadata = {
      discoveredAt: new Date(),
      totalDevices: this.topology.devices.size,
      totalLinks: this.topology.links.size,
      protocolsUsed: Array.from(new Set(
        Array.from(this.topology.links.values()).map(link => link.protocol)
      )),
      discoveryDuration: duration,
      coverage: this.calculateCoverage()
    };
  }

  /**
   * 持久化拓扑
   */
  private async persistTopology(): Promise<void> {
    try {
      const data = {
        devices: Array.from(this.topology.devices.entries()),
        links: Array.from(this.topology.links.entries()),
        subnets: this.topology.subnets,
        metadata: this.topology.metadata
      };
      
      // 这里可以保存到数据库或文件
      this.emit('topology:persisted', data);
      
    } catch (error) {
      console.error('持久化拓扑失败:', error);
    }
  }

  /**
   * 清理过期数据
   */
  private cleanupStaleData(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    // 清理过期设备
    for (const [id, device] of this.topology.devices) {
      if (now - device.lastSeen.getTime() > maxAge) {
        this.topology.devices.delete(id);
        this.emit('device:removed', device);
      }
    }
    
    // 清理相关链路
    for (const [id, link] of this.topology.links) {
      if (!this.topology.devices.has(link.sourceDeviceId) || 
          !this.topology.devices.has(link.targetDeviceId)) {
        this.topology.links.delete(id);
        this.emit('link:removed', link);
      }
    }
  }

  // 获取拓扑图
  getTopology(): TopologyGraph {
    return this.topology;
  }

  // 搜索设备
  searchDevices(query: string): NetworkDevice[] {
    const results: NetworkDevice[] = [];
    const searchTerm = query.toLowerCase();
    
    for (const device of this.topology.devices.values()) {
      if (device.name.toLowerCase().includes(searchTerm) ||
          device.ip.includes(searchTerm) ||
          device.vendor.toLowerCase().includes(searchTerm) ||
          device.model.toLowerCase().includes(searchTerm)) {
        results.push(device);
      }
    }
    
    return results;
  }

  // 获取设备邻居
  getDeviceNeighbors(deviceId: string): NetworkDevice[] {
    const neighbors: NetworkDevice[] = [];
    
    for (const link of this.topology.links.values()) {
      let neighborId: string | null = null;
      
      if (link.sourceDeviceId === deviceId) {
        neighborId = link.targetDeviceId;
      } else if (link.targetDeviceId === deviceId) {
        neighborId = link.sourceDeviceId;
      }
      
      if (neighborId) {
        const neighbor = this.topology.devices.get(neighborId);
        if (neighbor) {
          neighbors.push(neighbor);
        }
      }
    }
    
    return neighbors;
  }

  // 计算最短路径
  calculateShortestPath(sourceId: string, targetId: string): string[] | null {
    // 使用Dijkstra算法
    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const unvisited = new Set<string>();
    
    // 初始化
    for (const deviceId of this.topology.devices.keys()) {
      distances.set(deviceId, Infinity);
      unvisited.add(deviceId);
    }
    distances.set(sourceId, 0);
    
    while (unvisited.size > 0) {
      // 找到未访问节点中距离最小的
      let current: string | null = null;
      let minDistance = Infinity;
      
      for (const deviceId of unvisited) {
        const distance = distances.get(deviceId)!;
        if (distance < minDistance) {
          minDistance = distance;
          current = deviceId;
        }
      }
      
      if (!current || minDistance === Infinity) break;
      
      unvisited.delete(current);
      
      if (current === targetId) break;
      
      // 更新邻居距离
      const neighbors = this.getDeviceNeighbors(current);
      for (const neighbor of neighbors) {
        if (unvisited.has(neighbor.id)) {
          const newDistance = distances.get(current)! + 1; // 假设所有链路权重为1
          if (newDistance < distances.get(neighbor.id)!) {
            distances.set(neighbor.id, newDistance);
            previous.set(neighbor.id, current);
          }
        }
      }
    }
    
    // 构建路径
    if (!previous.has(targetId)) return null;
    
    const path: string[] = [];
    let current = targetId;
    
    while (current) {
      path.unshift(current);
      current = previous.get(current)!;
    }
    
    return path;
  }

  // 辅助方法
  private generateDeviceId(ip: string, mac: string): string {
    return `device-${mac.replace(/:/g, '')}`;
  }

  private generateLinkId(source: string, target: string): string {
    return [source, target].sort().join('-');
  }

  private generateMockMAC(): string {
    return Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':');
  }

  private findSourceInterface(device: NetworkDevice, neighbor: NeighborInfo): string {
    // 简化实现，实际应该根据邻居信息匹配接口
    return device.interfaces[0]?.name || 'unknown';
  }

  private determineLinkType(neighbor: NeighborInfo): 'ethernet' | 'fiber' | 'wireless' | 'serial' | 'virtual' {
    // 根据接口描述或能力判断链路类型
    const desc = neighbor.remotePortDescription.toLowerCase();
    if (desc.includes('fiber') || desc.includes('sfp')) return 'fiber';
    if (desc.includes('wireless') || desc.includes('wifi')) return 'wireless';
    if (desc.includes('serial')) return 'serial';
    if (desc.includes('virtual') || desc.includes('vlan')) return 'virtual';
    return 'ethernet';
  }

  private estimateBandwidth(neighbor: NeighborInfo): number {
    // 根据接口描述估算带宽
    const desc = neighbor.remotePortDescription.toLowerCase();
    if (desc.includes('gigabit') || desc.includes('1g')) return 1000000000;
    if (desc.includes('10g')) return 10000000000;
    if (desc.includes('100m')) return 100000000;
    return 1000000000; // 默认1G
  }

  private resolveNeighborIP(neighbor: NeighborInfo): string | null {
    // 简化实现，实际应该通过DNS或ARP解析
    return null;
  }

  private getSubnetFromIP(ip: string): string {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  }

  private calculateGateway(cidr: string): string {
    const [network] = cidr.split('/');
    const parts = network.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.1`;
  }

  private calculateCoverage(): number {
    // 计算发现覆盖率
    const totalPossibleDevices = this.config.seedDevices.length * 10; // 估算
    return Math.min(100, (this.topology.devices.size / totalPossibleDevices) * 100);
  }
}

/**
 * 力导向布局算法
 */
class ForceDirectedLayout {
  private devices: NetworkDevice[];
  private links: TopologyLink[];
  private positions: Map<string, { x: number; y: number }>;

  constructor(devices: NetworkDevice[], links: TopologyLink[]) {
    this.devices = devices;
    this.links = links;
    this.positions = new Map();
    
    // 初始化随机位置
    devices.forEach(device => {
      this.positions.set(device.id, {
        x: Math.random() * 1000,
        y: Math.random() * 1000
      });
    });
  }

  calculate(): Map<string, { x: number; y: number }> {
    const iterations = 100;
    const k = 50; // 理想距离
    const area = 1000 * 1000;
    const c = Math.sqrt(area / this.devices.length);

    for (let i = 0; i < iterations; i++) {
      // 计算斥力
      for (const device1 of this.devices) {
        const pos1 = this.positions.get(device1.id)!;
        let fx = 0, fy = 0;

        for (const device2 of this.devices) {
          if (device1.id === device2.id) continue;
          
          const pos2 = this.positions.get(device2.id)!;
          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = (c * c) / distance;
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        }

        // 计算引力
        for (const link of this.links) {
          if (link.sourceDeviceId === device1.id || link.targetDeviceId === device1.id) {
            const otherId = link.sourceDeviceId === device1.id ? 
              link.targetDeviceId : link.sourceDeviceId;
            const pos2 = this.positions.get(otherId);
            
            if (pos2) {
              const dx = pos2.x - pos1.x;
              const dy = pos2.y - pos1.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              
              const force = (distance * distance) / k;
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }
          }
        }

        // 更新位置
        const magnitude = Math.sqrt(fx * fx + fy * fy) || 1;
        const temperature = Math.max(1, 10 - i * 0.1);
        
        pos1.x += (fx / magnitude) * Math.min(magnitude, temperature);
        pos1.y += (fy / magnitude) * Math.min(magnitude, temperature);
        
        // 边界检查
        pos1.x = Math.max(50, Math.min(950, pos1.x));
        pos1.y = Math.max(50, Math.min(950, pos1.y));
      }
    }

    return this.positions;
  }
}

// 默认实例
export const networkTopologyDiscovery = new NetworkTopologyDiscovery({
  protocols: ['LLDP', 'CDP'],
  scanInterval: 300000, // 5分钟
  timeout: 10000,
  maxHops: 5,
  includeEndHosts: false,
  autoLayout: true,
  persistResults: true,
  excludeInterfaces: ['lo', 'null'],
  seedDevices: []
});

export default NetworkTopologyDiscovery;