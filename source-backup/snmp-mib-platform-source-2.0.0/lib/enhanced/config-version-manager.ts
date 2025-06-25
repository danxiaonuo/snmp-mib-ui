// 配置版本管理和差异对比系统
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import yaml from 'js-yaml'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface ConfigVersion {
  id: string
  configName: string
  configType: 'snmp_exporter' | 'categraf' | 'prometheus' | 'vmalert'
  version: string
  content: string
  contentHash: string
  author: string
  description: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  deployedHosts: string[]
  parentVersionId?: string
  changesSummary: {
    additions: number
    deletions: number
    modifications: number
  }
}

export interface ConfigDiff {
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  path: string
  oldValue?: any
  newValue?: any
  lineNumber?: number
  description: string
}

export interface ConfigComparison {
  fromVersion: ConfigVersion
  toVersion: ConfigVersion
  differences: ConfigDiff[]
  summary: {
    totalChanges: number
    additions: number
    deletions: number
    modifications: number
    riskLevel: 'low' | 'medium' | 'high'
    compatibilityIssues: string[]
  }
}

export interface VersionBranch {
  name: string
  baseVersionId: string
  currentVersionId: string
  description: string
  createdAt: Date
  author: string
  status: 'active' | 'merged' | 'archived'
}

export interface MergeRequest {
  id: string
  title: string
  description: string
  sourceBranch: string
  targetBranch: string
  sourceVersionId: string
  targetVersionId: string
  author: string
  status: 'open' | 'merged' | 'closed' | 'conflict'
  createdAt: Date
  conflicts?: ConfigDiff[]
  reviewers: string[]
}

export class ConfigVersionManager {
  private versionsPath: string
  private branchesPath: string
  private mergeRequestsPath: string

  constructor(basePath: string = '/etc/snmp-configs/versions') {
    this.versionsPath = path.join(basePath, 'versions')
    this.branchesPath = path.join(basePath, 'branches')
    this.mergeRequestsPath = path.join(basePath, 'merge-requests')
    this.initializeStorage()
  }

  // 初始化存储目录
  private async initializeStorage() {
    try {
      await fs.mkdir(this.versionsPath, { recursive: true })
      await fs.mkdir(this.branchesPath, { recursive: true })
      await fs.mkdir(this.mergeRequestsPath, { recursive: true })
    } catch (error) {
      console.error('Failed to initialize version storage:', error)
    }
  }

  // 创建新的配置版本
  async createVersion(
    configName: string,
    configType: ConfigVersion['configType'],
    content: string,
    author: string,
    description: string,
    tags: string[] = [],
    parentVersionId?: string
  ): Promise<ConfigVersion> {
    const contentHash = this.calculateHash(content)
    const versionId = `${configName}_${Date.now()}_${contentHash.substring(0, 8)}`
    
    // 计算与父版本的差异
    let changesSummary = { additions: 0, deletions: 0, modifications: 0 }
    if (parentVersionId) {
      const parentVersion = await this.getVersion(parentVersionId)
      if (parentVersion) {
        const comparison = await this.compareVersions(parentVersion.id, versionId, content)
        changesSummary = {
          additions: comparison.summary.additions,
          deletions: comparison.summary.deletions,
          modifications: comparison.summary.modifications
        }
      }
    }

    const version: ConfigVersion = {
      id: versionId,
      configName,
      configType,
      version: this.generateVersionNumber(configName),
      content,
      contentHash,
      author,
      description,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      deployedHosts: [],
      parentVersionId,
      changesSummary
    }

    // 保存版本到文件
    const versionFile = path.join(this.versionsPath, `${versionId}.json`)
    await fs.writeFile(versionFile, JSON.stringify(version, null, 2))

    // 保存配置内容
    const contentFile = path.join(this.versionsPath, `${versionId}_content.${this.getFileExtension(configType)}`)
    await fs.writeFile(contentFile, content)

    return version
  }

  // 获取配置版本
  async getVersion(versionId: string): Promise<ConfigVersion | null> {
    try {
      const versionFile = path.join(this.versionsPath, `${versionId}.json`)
      const content = await fs.readFile(versionFile, 'utf8')
      const version = JSON.parse(content) as ConfigVersion
      
      // 加载配置内容
      const contentFile = path.join(this.versionsPath, `${versionId}_content.${this.getFileExtension(version.configType)}`)
      version.content = await fs.readFile(contentFile, 'utf8')
      
      return version
    } catch (error) {
      console.error(`Failed to get version ${versionId}:`, error)
      return null
    }
  }

  // 获取配置的所有版本
  async getVersionHistory(configName: string): Promise<ConfigVersion[]> {
    try {
      const files = await fs.readdir(this.versionsPath)
      const versionFiles = files.filter(f => f.startsWith(configName) && f.endsWith('.json'))
      
      const versions: ConfigVersion[] = []
      for (const file of versionFiles) {
        const content = await fs.readFile(path.join(this.versionsPath, file), 'utf8')
        const version = JSON.parse(content) as ConfigVersion
        versions.push(version)
      }
      
      // 按创建时间排序
      return versions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error(`Failed to get version history for ${configName}:`, error)
      return []
    }
  }

  // 比较两个版本
  async compareVersions(fromVersionId: string, toVersionId: string, toContent?: string): Promise<ConfigComparison> {
    const fromVersion = await this.getVersion(fromVersionId)
    if (!fromVersion) {
      throw new Error(`Version ${fromVersionId} not found`)
    }

    let toVersion: ConfigVersion
    if (toContent) {
      // 创建临时版本用于比较
      toVersion = {
        ...fromVersion,
        id: toVersionId,
        content: toContent,
        contentHash: this.calculateHash(toContent)
      }
    } else {
      const existingToVersion = await this.getVersion(toVersionId)
      if (!existingToVersion) {
        throw new Error(`Version ${toVersionId} not found`)
      }
      toVersion = existingToVersion
    }

    const differences = await this.calculateDifferences(fromVersion, toVersion)
    const summary = this.calculateDiffSummary(differences)

    return {
      fromVersion,
      toVersion,
      differences,
      summary
    }
  }

  // 计算配置差异
  private async calculateDifferences(fromVersion: ConfigVersion, toVersion: ConfigVersion): Promise<ConfigDiff[]> {
    const differences: ConfigDiff[] = []

    try {
      // 根据配置类型选择不同的比较策略
      if (fromVersion.configType === 'snmp_exporter' || fromVersion.configType === 'prometheus' || fromVersion.configType === 'vmalert') {
        // YAML格式配置比较
        const fromConfig = yaml.load(fromVersion.content) as any
        const toConfig = yaml.load(toVersion.content) as any
        
        this.compareYamlObjects(fromConfig, toConfig, '', differences)
      } else if (fromVersion.configType === 'categraf') {
        // TOML格式配置比较
        differences.push(...await this.compareTextFiles(fromVersion.content, toVersion.content))
      }

      return differences
    } catch (error) {
      console.error('Failed to calculate differences:', error)
      // 如果结构化比较失败，使用文本比较
      return await this.compareTextFiles(fromVersion.content, toVersion.content)
    }
  }

  // 比较YAML对象
  private compareYamlObjects(fromObj: any, toObj: any, path: string, differences: ConfigDiff[]) {
    const fromKeys = new Set(Object.keys(fromObj || {}))
    const toKeys = new Set(Object.keys(toObj || {}))
    
    // 检查新增的键
    for (const key of toKeys) {
      const currentPath = path ? `${path}.${key}` : key
      
      if (!fromKeys.has(key)) {
        differences.push({
          type: 'added',
          path: currentPath,
          newValue: toObj[key],
          description: `添加了新配置项: ${currentPath}`
        })
      } else {
        // 比较相同键的值
        const fromValue = fromObj[key]
        const toValue = toObj[key]
        
        if (typeof fromValue === 'object' && typeof toValue === 'object' && 
            fromValue !== null && toValue !== null && 
            !Array.isArray(fromValue) && !Array.isArray(toValue)) {
          // 递归比较对象
          this.compareYamlObjects(fromValue, toValue, currentPath, differences)
        } else if (JSON.stringify(fromValue) !== JSON.stringify(toValue)) {
          differences.push({
            type: 'modified',
            path: currentPath,
            oldValue: fromValue,
            newValue: toValue,
            description: `修改了配置项: ${currentPath}`
          })
        }
      }
    }
    
    // 检查删除的键
    for (const key of fromKeys) {
      if (!toKeys.has(key)) {
        const currentPath = path ? `${path}.${key}` : key
        differences.push({
          type: 'removed',
          path: currentPath,
          oldValue: fromObj[key],
          description: `删除了配置项: ${currentPath}`
        })
      }
    }
  }

  // 比较文本文件
  private async compareTextFiles(fromContent: string, toContent: string): Promise<ConfigDiff[]> {
    const differences: ConfigDiff[] = []
    
    try {
      // 使用系统diff命令进行比较
      const fromFile = `/tmp/from_${Date.now()}.txt`
      const toFile = `/tmp/to_${Date.now()}.txt`
      
      await fs.writeFile(fromFile, fromContent)
      await fs.writeFile(toFile, toContent)
      
      try {
        const { stdout } = await execAsync(`diff -u "${fromFile}" "${toFile}"`)
        // diff命令成功表示文件相同
        differences.push({
          type: 'unchanged',
          path: 'file',
          description: '文件内容没有变化'
        })
      } catch (error: any) {
        // diff命令返回非0表示有差异
        if (error.stdout) {
          const lines = error.stdout.split('\n')
          let lineNumber = 1
          
          for (const line of lines) {
            if (line.startsWith('@@')) {
              const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/)
              if (match) {
                lineNumber = parseInt(match[2])
              }
            } else if (line.startsWith('+') && !line.startsWith('+++')) {
              differences.push({
                type: 'added',
                path: `line ${lineNumber}`,
                newValue: line.substring(1),
                lineNumber: lineNumber,
                description: `添加了行: ${line.substring(1)}`
              })
              lineNumber++
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              differences.push({
                type: 'removed',
                path: `line ${lineNumber}`,
                oldValue: line.substring(1),
                lineNumber: lineNumber,
                description: `删除了行: ${line.substring(1)}`
              })
            } else if (!line.startsWith('@') && !line.startsWith('\\') && line.trim()) {
              lineNumber++
            }
          }
        }
      }
      
      // 清理临时文件
      await fs.unlink(fromFile).catch(() => {})
      await fs.unlink(toFile).catch(() => {})
      
    } catch (error) {
      console.error('Text comparison failed:', error)
      differences.push({
        type: 'modified',
        path: 'file',
        description: '无法详细比较文件差异'
      })
    }
    
    return differences
  }

  // 计算差异摘要
  private calculateDiffSummary(differences: ConfigDiff[]): ConfigComparison['summary'] {
    const additions = differences.filter(d => d.type === 'added').length
    const deletions = differences.filter(d => d.type === 'removed').length
    const modifications = differences.filter(d => d.type === 'modified').length
    const totalChanges = additions + deletions + modifications

    // 评估风险级别
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (totalChanges > 20 || modifications > 10) {
      riskLevel = 'high'
    } else if (totalChanges > 10 || modifications > 5) {
      riskLevel = 'medium'
    }

    // 检查兼容性问题
    const compatibilityIssues: string[] = []
    for (const diff of differences) {
      if (diff.type === 'removed' && this.isCriticalConfig(diff.path)) {
        compatibilityIssues.push(`删除了关键配置项: ${diff.path}`)
      }
      if (diff.type === 'modified' && this.isCriticalConfig(diff.path)) {
        compatibilityIssues.push(`修改了关键配置项: ${diff.path}`)
      }
    }

    return {
      totalChanges,
      additions,
      deletions,
      modifications,
      riskLevel,
      compatibilityIssues
    }
  }

  // 检查是否为关键配置
  private isCriticalConfig(path: string): boolean {
    const criticalPaths = [
      'global',
      'scrape_configs',
      'rule_files',
      'alerting',
      'modules',
      'auth',
      'walk',
      'get'
    ]
    
    return criticalPaths.some(critical => path.includes(critical))
  }

  // 创建分支
  async createBranch(
    name: string,
    baseVersionId: string,
    description: string,
    author: string
  ): Promise<VersionBranch> {
    const branch: VersionBranch = {
      name,
      baseVersionId,
      currentVersionId: baseVersionId,
      description,
      createdAt: new Date(),
      author,
      status: 'active'
    }

    const branchFile = path.join(this.branchesPath, `${name}.json`)
    await fs.writeFile(branchFile, JSON.stringify(branch, null, 2))

    return branch
  }

  // 获取所有分支
  async getBranches(): Promise<VersionBranch[]> {
    try {
      const files = await fs.readdir(this.branchesPath)
      const branchFiles = files.filter(f => f.endsWith('.json'))
      
      const branches: VersionBranch[] = []
      for (const file of branchFiles) {
        const content = await fs.readFile(path.join(this.branchesPath, file), 'utf8')
        const branch = JSON.parse(content) as VersionBranch
        branches.push(branch)
      }
      
      return branches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error('Failed to get branches:', error)
      return []
    }
  }

  // 创建合并请求
  async createMergeRequest(
    title: string,
    description: string,
    sourceBranch: string,
    targetBranch: string,
    sourceVersionId: string,
    targetVersionId: string,
    author: string,
    reviewers: string[] = []
  ): Promise<MergeRequest> {
    const id = `mr_${Date.now()}`
    
    // 检查冲突
    const comparison = await this.compareVersions(targetVersionId, sourceVersionId)
    const conflicts = comparison.differences.filter(d => d.type === 'modified' && this.isCriticalConfig(d.path))

    const mergeRequest: MergeRequest = {
      id,
      title,
      description,
      sourceBranch,
      targetBranch,
      sourceVersionId,
      targetVersionId,
      author,
      status: conflicts.length > 0 ? 'conflict' : 'open',
      createdAt: new Date(),
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      reviewers
    }

    const mrFile = path.join(this.mergeRequestsPath, `${id}.json`)
    await fs.writeFile(mrFile, JSON.stringify(mergeRequest, null, 2))

    return mergeRequest
  }

  // 获取合并请求
  async getMergeRequests(): Promise<MergeRequest[]> {
    try {
      const files = await fs.readdir(this.mergeRequestsPath)
      const mrFiles = files.filter(f => f.endsWith('.json'))
      
      const mergeRequests: MergeRequest[] = []
      for (const file of mrFiles) {
        const content = await fs.readFile(path.join(this.mergeRequestsPath, file), 'utf8')
        const mr = JSON.parse(content) as MergeRequest
        mergeRequests.push(mr)
      }
      
      return mergeRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error('Failed to get merge requests:', error)
      return []
    }
  }

  // 标记版本为已部署
  async markVersionAsDeployed(versionId: string, hostId: string): Promise<void> {
    const version = await this.getVersion(versionId)
    if (version) {
      if (!version.deployedHosts.includes(hostId)) {
        version.deployedHosts.push(hostId)
        version.updatedAt = new Date()
        
        const versionFile = path.join(this.versionsPath, `${versionId}.json`)
        await fs.writeFile(versionFile, JSON.stringify(version, null, 2))
      }
    }
  }

  // 工具方法
  private calculateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  private generateVersionNumber(configName: string): string {
    const timestamp = Date.now()
    return `v${Math.floor(timestamp / 1000)}`
  }

  private getFileExtension(configType: ConfigVersion['configType']): string {
    switch (configType) {
      case 'snmp_exporter':
      case 'prometheus':
      case 'vmalert':
        return 'yml'
      case 'categraf':
        return 'toml'
      default:
        return 'txt'
    }
  }

  // 导出版本历史
  async exportVersionHistory(configName: string): Promise<string> {
    const versions = await this.getVersionHistory(configName)
    return JSON.stringify({
      configName,
      exportDate: new Date().toISOString(),
      versions
    }, null, 2)
  }

  // 导入版本历史
  async importVersionHistory(exportData: string): Promise<void> {
    const data = JSON.parse(exportData)
    
    for (const version of data.versions) {
      const versionFile = path.join(this.versionsPath, `${version.id}.json`)
      await fs.writeFile(versionFile, JSON.stringify(version, null, 2))
      
      const contentFile = path.join(this.versionsPath, `${version.id}_content.${this.getFileExtension(version.configType)}`)
      await fs.writeFile(contentFile, version.content)
    }
  }
}

// 导出管理器实例
export const configVersionManager = new ConfigVersionManager()