// 批量设备管理和分组部署系统
import { EventEmitter } from 'events'
import fs from 'fs/promises'
import path from 'path'
import { configVersionManager, ConfigVersion } from './config-version-manager'

export interface Device {
  id: string
  ip: string
  hostname?: string
  vendor: 'cisco' | 'h3c' | 'huawei' | 'juniper' | 'unknown'
  model?: string
  platform?: string
  snmpConfig: {
    community: string
    version: '1' | '2c' | '3'
    port: number
    username?: string
    authPassword?: string
    privPassword?: string
    authProtocol?: 'MD5' | 'SHA'
    privProtocol?: 'DES' | 'AES'
  }
  sshConfig?: {
    username: string
    password?: string
    privateKey?: string
    port: number
  }
  tags: string[]
  groups: string[]
  status: 'online' | 'offline' | 'error' | 'unknown'
  lastSeen?: Date
  capabilities: {
    hasSnmp: boolean
    hasSsh: boolean
    supportedOids: string[]
    maxInterfaces: number
    systemInfo?: {
      sysDescr?: string
      sysName?: string
      sysLocation?: string
      sysContact?: string
    }
  }
  monitoring: {
    snmpExporter?: {
      enabled: boolean
      configVersion?: string
      lastDeployed?: Date
      status: 'running' | 'stopped' | 'error'
    }
    categraf?: {
      enabled: boolean
      configVersion?: string
      lastDeployed?: Date
      status: 'running' | 'stopped' | 'error'
    }
  }
  deploymentHistory: DeploymentRecord[]
}

export interface DeviceGroup {
  id: string
  name: string
  description: string
  devices: string[] // device IDs
  defaultConfigs: {
    snmpExporter?: string // config version ID
    categraf?: string // config version ID
  }
  deploymentPolicy: {
    mode: 'parallel' | 'sequential' | 'rolling'
    batchSize?: number
    delayBetweenBatches?: number
    rollbackOnFailure: boolean
    maxFailureRate: number
  }
  tags: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface DeploymentRecord {
  id: string
  deviceId: string
  configType: 'snmp_exporter' | 'categraf'
  configVersionId: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'rolled_back'
  startedAt: Date
  completedAt?: Date
  error?: string
  deployedBy: string
  rollbackVersionId?: string
}

export interface BatchDeploymentJob {
  id: string
  name: string
  description: string
  groupIds: string[]
  deviceIds: string[]
  configType: 'snmp_exporter' | 'categraf'
  configVersionId: string
  policy: DeploymentPolicy
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: {
    total: number
    completed: number
    failed: number
    pending: number
  }
  startedAt: Date
  completedAt?: Date
  createdBy: string
  deployments: DeploymentRecord[]
  errors: string[]
}

export interface DeploymentPolicy {
  mode: 'parallel' | 'sequential' | 'rolling'
  batchSize: number
  delayBetweenBatches: number
  rollbackOnFailure: boolean
  maxFailureRate: number
  preDeploymentChecks: boolean
  postDeploymentValidation: boolean
  backupBeforeDeployment: boolean
}

export interface DeviceFilter {
  vendors?: string[]
  tags?: string[]
  groups?: string[]
  status?: string[]
  capabilities?: {
    hasSnmp?: boolean
    hasSsh?: boolean
  }
  monitoring?: {
    snmpExporter?: boolean
    categraf?: boolean
  }
}

export class BatchDeviceManager extends EventEmitter {
  private devicesPath: string
  private groupsPath: string
  private deploymentsPath: string
  private devices: Map<string, Device> = new Map()
  private groups: Map<string, DeviceGroup> = new Map()
  private activeJobs: Map<string, BatchDeploymentJob> = new Map()

  constructor(basePath: string = '/etc/snmp-configs/devices') {
    super()
    this.devicesPath = path.join(basePath, 'devices')
    this.groupsPath = path.join(basePath, 'groups')
    this.deploymentsPath = path.join(basePath, 'deployments')
    this.initializeStorage()
  }

  // 初始化存储
  private async initializeStorage() {
    try {
      await fs.mkdir(this.devicesPath, { recursive: true })
      await fs.mkdir(this.groupsPath, { recursive: true })
      await fs.mkdir(this.deploymentsPath, { recursive: true })
      
      // 加载现有数据
      await this.loadDevices()
      await this.loadGroups()
    } catch (error) {
      console.error('Failed to initialize device storage:', error)
    }
  }

  // 加载设备
  private async loadDevices() {
    try {
      const files = await fs.readdir(this.devicesPath)
      const deviceFiles = files.filter(f => f.endsWith('_device.json'))
      
      for (const file of deviceFiles) {
        const content = await fs.readFile(path.join(this.devicesPath, file), 'utf8')
        const device = JSON.parse(content) as Device
        this.devices.set(device.id, device)
      }
    } catch (error) {
      console.error('Failed to load devices:', error)
    }
  }

  // 加载分组
  private async loadGroups() {
    try {
      const files = await fs.readdir(this.groupsPath)
      const groupFiles = files.filter(f => f.endsWith('_group.json'))
      
      for (const file of groupFiles) {
        const content = await fs.readFile(path.join(this.groupsPath, file), 'utf8')
        const group = JSON.parse(content) as DeviceGroup
        this.groups.set(group.id, group)
      }
    } catch (error) {
      console.error('Failed to load groups:', error)
    }
  }

  // 添加设备
  async addDevice(deviceData: Partial<Device>): Promise<Device> {
    const device: Device = {
      id: deviceData.id || `device_${Date.now()}`,
      ip: deviceData.ip!,
      hostname: deviceData.hostname,
      vendor: deviceData.vendor || 'unknown',
      model: deviceData.model,
      platform: deviceData.platform,
      snmpConfig: deviceData.snmpConfig!,
      sshConfig: deviceData.sshConfig,
      tags: deviceData.tags || [],
      groups: deviceData.groups || [],
      status: 'unknown',
      capabilities: deviceData.capabilities || {
        hasSnmp: false,
        hasSsh: false,
        supportedOids: [],
        maxInterfaces: 0
      },
      monitoring: {
        snmpExporter: {
          enabled: false,
          status: 'stopped'
        },
        categraf: {
          enabled: false,
          status: 'stopped'
        }
      },
      deploymentHistory: []
    }

    this.devices.set(device.id, device)
    await this.saveDevice(device)
    
    this.emit('deviceAdded', device)
    return device
  }

  // 保存设备
  private async saveDevice(device: Device) {
    const deviceFile = path.join(this.devicesPath, `${device.id}_device.json`)
    await fs.writeFile(deviceFile, JSON.stringify(device, null, 2))
  }

  // 批量添加设备
  async addDevicesBatch(deviceDataList: Partial<Device>[]): Promise<Device[]> {
    const devices: Device[] = []
    
    for (const deviceData of deviceDataList) {
      try {
        const device = await this.addDevice(deviceData)
        devices.push(device)
      } catch (error) {
        console.error(`Failed to add device ${deviceData.ip}:`, error)
      }
    }
    
    this.emit('devicesBatchAdded', devices)
    return devices
  }

  // 自动发现设备
  async discoverDevices(
    ipRange: string,
    snmpCommunity: string = 'public',
    snmpVersion: '1' | '2c' | '3' = '2c'
  ): Promise<Device[]> {
    this.emit('discoveryStarted', { ipRange })
    
    try {
      // 调用SNMP测试API进行设备发现
      const response = await fetch('/api/snmp/real-test/discover-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipRange,
          community: snmpCommunity,
          version: snmpVersion
        })
      })
      
      const result = await response.json()
      const discoveredDevices: Device[] = []
      
      if (result.success && result.devices) {
        for (const discoveredDevice of result.devices) {
          const device = await this.addDevice({
            ip: discoveredDevice.ip,
            hostname: discoveredDevice.systemInfo?.sysName || discoveredDevice.ip,
            vendor: this.detectVendor(discoveredDevice.systemInfo?.sysDescr || ''),
            snmpConfig: {
              community: snmpCommunity,
              version: snmpVersion,
              port: 161
            },
            tags: ['auto-discovered'],
            capabilities: {
              hasSnmp: true,
              hasSsh: false,
              supportedOids: [],
              maxInterfaces: 0,
              systemInfo: discoveredDevice.systemInfo
            }
          })
          
          discoveredDevices.push(device)
        }
      }
      
      this.emit('discoveryCompleted', { 
        ipRange, 
        devicesFound: discoveredDevices.length,
        devices: discoveredDevices
      })
      
      return discoveredDevices
    } catch (error) {
      this.emit('discoveryFailed', { ipRange, error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }

  // 检测设备厂商
  private detectVendor(sysDescr: string): Device['vendor'] {
    const desc = sysDescr.toLowerCase()
    
    if (desc.includes('cisco')) return 'cisco'
    if (desc.includes('h3c') || desc.includes('3com')) return 'h3c'
    if (desc.includes('huawei')) return 'huawei'
    if (desc.includes('juniper')) return 'juniper'
    
    return 'unknown'
  }

  // 创建设备分组
  async createGroup(groupData: Partial<DeviceGroup>): Promise<DeviceGroup> {
    const group: DeviceGroup = {
      id: groupData.id || `group_${Date.now()}`,
      name: groupData.name!,
      description: groupData.description || '',
      devices: groupData.devices || [],
      defaultConfigs: groupData.defaultConfigs || {},
      deploymentPolicy: groupData.deploymentPolicy || {
        mode: 'parallel',
        batchSize: 10,
        delayBetweenBatches: 5000,
        rollbackOnFailure: true,
        maxFailureRate: 0.1
      },
      tags: groupData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: groupData.createdBy || 'system'
    }

    this.groups.set(group.id, group)
    await this.saveGroup(group)
    
    this.emit('groupCreated', group)
    return group
  }

  // 保存分组
  private async saveGroup(group: DeviceGroup) {
    const groupFile = path.join(this.groupsPath, `${group.id}_group.json`)
    await fs.writeFile(groupFile, JSON.stringify(group, null, 2))
  }

  // 添加设备到分组
  async addDeviceToGroup(deviceId: string, groupId: string): Promise<void> {
    const device = this.devices.get(deviceId)
    const group = this.groups.get(groupId)
    
    if (!device || !group) {
      throw new Error('Device or group not found')
    }
    
    if (!group.devices.includes(deviceId)) {
      group.devices.push(deviceId)
      group.updatedAt = new Date()
      await this.saveGroup(group)
    }
    
    if (!device.groups.includes(groupId)) {
      device.groups.push(groupId)
      await this.saveDevice(device)
    }
    
    this.emit('deviceAddedToGroup', { deviceId, groupId })
  }

  // 批量部署配置
  async deployConfigBatch(
    targets: { groupIds?: string[], deviceIds?: string[] },
    configType: 'snmp_exporter' | 'categraf',
    configVersionId: string,
    policy: Partial<DeploymentPolicy> = {},
    deployedBy: string = 'system'
  ): Promise<BatchDeploymentJob> {
    // 收集目标设备
    const targetDevices = new Set<string>()
    
    if (targets.groupIds) {
      for (const groupId of targets.groupIds) {
        const group = this.groups.get(groupId)
        if (group) {
          group.devices.forEach(deviceId => targetDevices.add(deviceId))
        }
      }
    }
    
    if (targets.deviceIds) {
      targets.deviceIds.forEach(deviceId => targetDevices.add(deviceId))
    }

    const devices = Array.from(targetDevices)
      .map(id => this.devices.get(id))
      .filter(Boolean) as Device[]

    // 创建部署任务
    const job: BatchDeploymentJob = {
      id: `job_${Date.now()}`,
      name: `Batch deployment to ${devices.length} devices`,
      description: `Deploy ${configType} config version ${configVersionId}`,
      groupIds: targets.groupIds || [],
      deviceIds: targets.deviceIds || [],
      configType,
      configVersionId,
      policy: {
        mode: policy.mode || 'parallel',
        batchSize: policy.batchSize || 10,
        delayBetweenBatches: policy.delayBetweenBatches || 5000,
        rollbackOnFailure: policy.rollbackOnFailure ?? true,
        maxFailureRate: policy.maxFailureRate || 0.1,
        preDeploymentChecks: policy.preDeploymentChecks ?? true,
        postDeploymentValidation: policy.postDeploymentValidation ?? true,
        backupBeforeDeployment: policy.backupBeforeDeployment ?? true
      },
      status: 'pending',
      progress: {
        total: devices.length,
        completed: 0,
        failed: 0,
        pending: devices.length
      },
      startedAt: new Date(),
      createdBy: deployedBy,
      deployments: [],
      errors: []
    }

    this.activeJobs.set(job.id, job)
    
    // 异步执行部署
    this.executeDeploymentJob(job, devices).catch(error => {
      console.error(`Deployment job ${job.id} failed:`, error)
      job.status = 'failed'
      job.errors.push(error instanceof Error ? error.message : 'Unknown error')
      job.completedAt = new Date()
    })

    this.emit('deploymentJobStarted', job)
    return job
  }

  // 执行部署任务
  private async executeDeploymentJob(job: BatchDeploymentJob, devices: Device[]) {
    job.status = 'running'
    this.emit('deploymentJobProgress', job)
    
    try {
      const configVersion = await configVersionManager.getVersion(job.configVersionId)
      if (!configVersion) {
        throw new Error(`Configuration version ${job.configVersionId} not found`)
      }

      if (job.policy.mode === 'parallel') {
        await this.deployParallel(job, devices, configVersion)
      } else if (job.policy.mode === 'sequential') {
        await this.deploySequential(job, devices, configVersion)
      } else if (job.policy.mode === 'rolling') {
        await this.deployRolling(job, devices, configVersion)
      }

      job.status = 'completed'
      job.completedAt = new Date()
      
      this.emit('deploymentJobCompleted', job)
      
    } catch (error) {
      job.status = 'failed'
      job.errors.push(error instanceof Error ? error.message : 'Unknown error')
      job.completedAt = new Date()
      
      this.emit('deploymentJobFailed', job)
    }
  }

  // 并行部署
  private async deployParallel(job: BatchDeploymentJob, devices: Device[], configVersion: ConfigVersion) {
    const batches = this.createBatches(devices, job.policy.batchSize)
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      
      const batchPromises = batch.map(device => this.deployToDevice(job, device, configVersion))
      const results = await Promise.allSettled(batchPromises)
      
      this.processBatchResults(job, results)
      
      // 检查失败率
      if (this.shouldStopDeployment(job)) {
        throw new Error(`Deployment stopped due to high failure rate: ${job.progress.failed}/${job.progress.total}`)
      }
      
      // 批次间延迟
      if (i < batches.length - 1 && job.policy.delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, job.policy.delayBetweenBatches))
      }
    }
  }

  // 顺序部署
  private async deploySequential(job: BatchDeploymentJob, devices: Device[], configVersion: ConfigVersion) {
    for (const device of devices) {
      try {
        await this.deployToDevice(job, device, configVersion)
        job.progress.completed++
        job.progress.pending--
      } catch (error) {
        job.progress.failed++
        job.progress.pending--
        job.errors.push(`Device ${device.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        
        if (this.shouldStopDeployment(job)) {
          throw new Error('Sequential deployment stopped due to failure rate')
        }
      }
      
      this.emit('deploymentJobProgress', job)
      
      if (job.policy.delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, job.policy.delayBetweenBatches))
      }
    }
  }

  // 滚动部署
  private async deployRolling(job: BatchDeploymentJob, devices: Device[], configVersion: ConfigVersion) {
    const batchSize = Math.max(1, Math.floor(devices.length * 0.2)) // 20% at a time
    const batches = this.createBatches(devices, batchSize)
    
    for (const batch of batches) {
      // 并行部署当前批次
      const batchPromises = batch.map(device => this.deployToDevice(job, device, configVersion))
      const results = await Promise.allSettled(batchPromises)
      
      this.processBatchResults(job, results)
      
      // 验证当前批次是否成功
      const currentBatchFailures = results.filter(r => r.status === 'rejected').length
      const currentBatchFailureRate = currentBatchFailures / batch.length
      
      if (currentBatchFailureRate > job.policy.maxFailureRate) {
        throw new Error(`Rolling deployment stopped: batch failure rate ${currentBatchFailureRate} exceeds threshold ${job.policy.maxFailureRate}`)
      }
      
      // 批次间延迟
      if (job.policy.delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, job.policy.delayBetweenBatches))
      }
    }
  }

  // 部署到单个设备
  private async deployToDevice(job: BatchDeploymentJob, device: Device, configVersion: ConfigVersion): Promise<void> {
    const deployment: DeploymentRecord = {
      id: `deploy_${Date.now()}_${device.id}`,
      deviceId: device.id,
      configType: job.configType,
      configVersionId: job.configVersionId,
      status: 'running',
      startedAt: new Date(),
      deployedBy: job.createdBy
    }

    job.deployments.push(deployment)
    
    try {
      // 预部署检查
      if (job.policy.preDeploymentChecks) {
        await this.performPreDeploymentChecks(device)
      }
      
      // 备份当前配置
      if (job.policy.backupBeforeDeployment) {
        await this.backupDeviceConfig(device, job.configType)
      }
      
      // 部署配置
      await this.deployConfigToDevice(device, job.configType, configVersion)
      
      // 部署后验证
      if (job.policy.postDeploymentValidation) {
        await this.validateDeployment(device, job.configType)
      }
      
      deployment.status = 'success'
      deployment.completedAt = new Date()
      
      // 更新设备监控状态
      if (job.configType === 'snmp_exporter') {
        device.monitoring.snmpExporter = {
          enabled: true,
          configVersion: job.configVersionId,
          lastDeployed: new Date(),
          status: 'running'
        }
      } else if (job.configType === 'categraf') {
        device.monitoring.categraf = {
          enabled: true,
          configVersion: job.configVersionId,
          lastDeployed: new Date(),
          status: 'running'
        }
      }
      
      device.deploymentHistory.push(deployment)
      await this.saveDevice(device)
      
      // 标记版本为已部署
      await configVersionManager.markVersionAsDeployed(job.configVersionId, device.id)
      
    } catch (error) {
      deployment.status = 'failed'
      deployment.error = error instanceof Error ? error.message : 'Unknown error'
      deployment.completedAt = new Date()
      
      throw error
    }
  }

  // 创建批次
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  // 处理批次结果
  private processBatchResults(job: BatchDeploymentJob, results: PromiseSettledResult<void>[]) {
    for (const result of results) {
      if (result.status === 'fulfilled') {
        job.progress.completed++
      } else {
        job.progress.failed++
        job.errors.push(result.reason instanceof Error ? result.reason.message : 'Unknown error')
      }
      job.progress.pending--
    }
    
    this.emit('deploymentJobProgress', job)
  }

  // 检查是否应该停止部署
  private shouldStopDeployment(job: BatchDeploymentJob): boolean {
    if (!job.policy.rollbackOnFailure) return false
    
    const failureRate = job.progress.failed / (job.progress.completed + job.progress.failed)
    return failureRate > job.policy.maxFailureRate
  }

  // 预部署检查
  private async performPreDeploymentChecks(device: Device): Promise<void> {
    // 检查设备连通性
    const response = await fetch('/api/snmp/real-test/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip: device.ip,
        community: device.snmpConfig.community,
        version: device.snmpConfig.version
      })
    })
    
    const result = await response.json()
    if (!result.success || !result.snmpWorking) {
      throw new Error(`Device ${device.id} is not reachable or SNMP is not working`)
    }
  }

  // 备份设备配置
  private async backupDeviceConfig(device: Device, configType: string): Promise<void> {
    if (!device.sshConfig) {
      console.warn(`Cannot backup config for device ${device.id}: no SSH config`)
      return
    }
    
    // 调用备份API
    const response = await fetch('/api/monitoring/real-deployment/backup-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostId: device.id,
        componentType: configType,
        connection: device.sshConfig
      })
    })
    
    const result = await response.json()
    if (!result.success) {
      console.warn(`Config backup failed for device ${device.id}: ${result.error}`)
    }
  }

  // 部署配置到设备
  private async deployConfigToDevice(device: Device, configType: string, configVersion: ConfigVersion): Promise<void> {
    if (!device.sshConfig) {
      throw new Error(`Cannot deploy to device ${device.id}: no SSH configuration`)
    }
    
    const response = await fetch('/api/monitoring/real-deployment/deploy-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostId: device.id,
        componentType: configType,
        configContent: configVersion.content,
        configName: configVersion.configName,
        connection: device.sshConfig
      })
    })
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(`Deployment failed: ${result.error}`)
    }
  }

  // 验证部署
  private async validateDeployment(device: Device, configType: string): Promise<void> {
    if (!device.sshConfig) {
      console.warn(`Cannot validate deployment for device ${device.id}: no SSH config`)
      return
    }
    
    const response = await fetch('/api/monitoring/real-deployment/verify-deployment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostId: device.id,
        componentType: configType,
        connection: device.sshConfig
      })
    })
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(`Deployment validation failed: ${result.error}`)
    }
  }

  // 获取设备列表（带筛选）
  getDevices(filter?: DeviceFilter): Device[] {
    let devices = Array.from(this.devices.values())
    
    if (filter) {
      if (filter.vendors) {
        devices = devices.filter(d => filter.vendors!.includes(d.vendor))
      }
      
      if (filter.tags) {
        devices = devices.filter(d => filter.tags!.some(tag => d.tags.includes(tag)))
      }
      
      if (filter.groups) {
        devices = devices.filter(d => filter.groups!.some(group => d.groups.includes(group)))
      }
      
      if (filter.status) {
        devices = devices.filter(d => filter.status!.includes(d.status))
      }
      
      if (filter.capabilities) {
        if (filter.capabilities.hasSnmp !== undefined) {
          devices = devices.filter(d => d.capabilities.hasSnmp === filter.capabilities!.hasSnmp)
        }
        if (filter.capabilities.hasSsh !== undefined) {
          devices = devices.filter(d => d.capabilities.hasSsh === filter.capabilities!.hasSsh)
        }
      }
    }
    
    return devices
  }

  // 获取分组列表
  getGroups(): DeviceGroup[] {
    return Array.from(this.groups.values())
  }

  // 获取活动的部署任务
  getActiveJobs(): BatchDeploymentJob[] {
    return Array.from(this.activeJobs.values())
  }

  // 取消部署任务
  async cancelJob(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId)
    if (job && job.status === 'running') {
      job.status = 'cancelled'
      job.completedAt = new Date()
      this.emit('deploymentJobCancelled', job)
    }
  }

  // 获取部署统计
  getDeploymentStats(): {
    totalDevices: number
    onlineDevices: number
    monitoredDevices: number
    deploymentHistory: { date: string, deployments: number }[]
  } {
    const devices = Array.from(this.devices.values())
    
    return {
      totalDevices: devices.length,
      onlineDevices: devices.filter(d => d.status === 'online').length,
      monitoredDevices: devices.filter(d => 
        d.monitoring.snmpExporter?.enabled || d.monitoring.categraf?.enabled
      ).length,
      deploymentHistory: [] // TODO: 实现部署历史统计
    }
  }
}

// 导出管理器实例
export const batchDeviceManager = new BatchDeviceManager()