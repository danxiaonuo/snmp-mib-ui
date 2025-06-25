// SSH 连接和远程操作服务
// 在浏览器环境中模拟 SSH 连接功能

export interface SSHConnection {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
  timeout?: number
}

export interface SSHCommandResult {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  executionTime: number
}

export interface FileUploadResult {
  success: boolean
  remotePath: string
  size: number
  error?: string
}

export class SSHService {
  private connections: Map<string, SSHConnection> = new Map()
  
  // 测试SSH连接
  async testConnection(connection: SSHConnection): Promise<{success: boolean, error?: string, details?: any}> {
    try {
      // 验证连接参数
      if (!connection.host || !connection.username) {
        return { success: false, error: '缺少必要的连接参数' }
      }

      if (!connection.password && !connection.privateKey) {
        return { success: false, error: '缺少认证信息（密码或私钥）' }
      }

      // 模拟连接测试
      const connectionKey = `${connection.host}:${connection.port}`
      
      // 模拟网络连接延迟
      await this.delay(1000 + Math.random() * 2000)
      
      // 模拟连接成功率（95%）
      if (Math.random() < 0.95) {
        this.connections.set(connectionKey, connection)
        
        return {
          success: true,
          details: {
            host: connection.host,
            port: connection.port,
            username: connection.username,
            authMethod: connection.privateKey ? 'key' : 'password',
            connectedAt: new Date().toISOString()
          }
        }
      } else {
        const errorMessages = [
          'Connection timed out',
          'Authentication failed',
          'Host unreachable',
          'Permission denied',
          'Network error'
        ]
        return { 
          success: false, 
          error: errorMessages[Math.floor(Math.random() * errorMessages.length)] 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error' 
      }
    }
  }

  // 执行远程命令
  async executeCommand(connection: SSHConnection, command: string, input?: string): Promise<SSHCommandResult> {
    const startTime = Date.now()
    
    try {
      // 验证连接
      const testResult = await this.testConnection(connection)
      if (!testResult.success) {
        return {
          success: false,
          stdout: '',
          stderr: testResult.error || 'Connection failed',
          exitCode: 1,
          executionTime: Date.now() - startTime
        }
      }

      // 模拟命令执行延迟
      await this.delay(500 + Math.random() * 1500)

      // 模拟不同命令的输出
      const result = this.simulateCommandExecution(command, input)
      result.executionTime = Date.now() - startTime

      return result
    } catch (error) {
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Command execution failed',
        exitCode: 1,
        executionTime: Date.now() - startTime
      }
    }
  }

  // 上传文件
  async uploadFile(connection: SSHConnection, remotePath: string, content: string): Promise<FileUploadResult> {
    try {
      // 验证连接
      const testResult = await this.testConnection(connection)
      if (!testResult.success) {
        return {
          success: false,
          remotePath,
          size: 0,
          error: testResult.error || 'Connection failed'
        }
      }

      // 模拟文件上传延迟
      const uploadTime = Math.max(1000, content.length / 1000) // 基于文件大小的上传时间
      await this.delay(uploadTime)

      // 模拟上传成功率（98%）
      if (Math.random() < 0.98) {
        return {
          success: true,
          remotePath,
          size: content.length
        }
      } else {
        return {
          success: false,
          remotePath,
          size: 0,
          error: 'Upload failed due to network error'
        }
      }
    } catch (error) {
      return {
        success: false,
        remotePath,
        size: 0,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  // 下载文件
  async downloadFile(connection: SSHConnection, remotePath: string): Promise<{success: boolean, content?: string, error?: string}> {
    try {
      // 验证连接
      const testResult = await this.testConnection(connection)
      if (!testResult.success) {
        return {
          success: false,
          error: testResult.error || 'Connection failed'
        }
      }

      // 模拟文件下载延迟
      await this.delay(1000 + Math.random() * 2000)

      // 模拟文件内容
      const mockContent = this.generateMockFileContent(remotePath)
      
      return {
        success: true,
        content: mockContent
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      }
    }
  }

  // 检查文件是否存在
  async fileExists(connection: SSHConnection, remotePath: string): Promise<{exists: boolean, error?: string}> {
    try {
      const result = await this.executeCommand(connection, `test -f ${remotePath} && echo "exists" || echo "not found"`)
      
      return {
        exists: result.success && result.stdout.trim() === 'exists'
      }
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Check failed'
      }
    }
  }

  // 创建目录
  async createDirectory(connection: SSHConnection, remotePath: string): Promise<{success: boolean, error?: string}> {
    try {
      const result = await this.executeCommand(connection, `sudo mkdir -p ${remotePath} && sudo chmod 755 ${remotePath}`)
      
      return {
        success: result.success && result.exitCode === 0
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Directory creation failed'
      }
    }
  }

  // 获取系统信息
  async getSystemInfo(connection: SSHConnection): Promise<{
    success: boolean
    info?: {
      hostname: string
      os: string
      architecture: string
      kernel: string
      cpuCores: number
      memoryGB: number
      diskGB: number
      uptime: string
    }
    error?: string
  }> {
    try {
      // 并行执行多个系统信息命令
      const commands = [
        'hostname',
        'uname -s',
        'uname -m', 
        'uname -r',
        'nproc',
        'free -m | grep "^Mem:" | awk \'{print $2}\'',
        'df -BG / | tail -1 | awk \'{print $2}\' | sed \'s/G//\'',
        'uptime -p'
      ]

      const results = await Promise.all(
        commands.map(cmd => this.executeCommand(connection, cmd))
      )

      if (results.every(r => r.success)) {
        return {
          success: true,
          info: {
            hostname: results[0].stdout.trim() || 'unknown',
            os: results[1].stdout.trim() || 'Linux',
            architecture: results[2].stdout.trim() || 'x86_64',
            kernel: results[3].stdout.trim() || '5.4.0',
            cpuCores: parseInt(results[4].stdout.trim()) || 4,
            memoryGB: Math.round(parseInt(results[5].stdout.trim()) / 1024) || 8,
            diskGB: parseInt(results[6].stdout.trim()) || 100,
            uptime: results[7].stdout.trim() || 'up 1 day'
          }
        }
      } else {
        return {
          success: false,
          error: '获取系统信息失败'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'System info collection failed'
      }
    }
  }

  // 检查服务状态
  async checkServiceStatus(connection: SSHConnection, serviceName: string): Promise<{
    running: boolean
    status: string
    error?: string
  }> {
    try {
      // 尝试 systemctl
      let result = await this.executeCommand(connection, `sudo systemctl is-active ${serviceName}`)
      
      if (result.success) {
        const status = result.stdout.trim()
        return {
          running: status === 'active',
          status: status
        }
      }

      // 尝试 Docker
      result = await this.executeCommand(connection, `sudo docker ps --filter name=${serviceName} --format "{{.Status}}"`)
      
      if (result.success && result.stdout.trim()) {
        const dockerStatus = result.stdout.trim()
        return {
          running: dockerStatus.includes('Up'),
          status: dockerStatus.includes('Up') ? 'running' : 'stopped'
        }
      }

      return {
        running: false,
        status: 'unknown'
      }
    } catch (error) {
      return {
        running: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Status check failed'
      }
    }
  }

  // 重启服务
  async restartService(connection: SSHConnection, serviceName: string): Promise<{success: boolean, error?: string}> {
    try {
      // 尝试 systemctl
      let result = await this.executeCommand(connection, `sudo systemctl restart ${serviceName}`)
      
      if (result.success) {
        return { success: true }
      }

      // 尝试 Docker
      result = await this.executeCommand(connection, `sudo docker restart ${serviceName}`)
      
      if (result.success) {
        return { success: true }
      }

      // 尝试 Docker Compose
      result = await this.executeCommand(connection, `cd /opt/monitoring && sudo docker-compose restart ${serviceName}`)
      
      return {
        success: result.success,
        error: result.success ? undefined : 'Service restart failed'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Service restart failed'
      }
    }
  }

  // 私有方法

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private simulateCommandExecution(command: string, input?: string): SSHCommandResult {
    // 模拟不同命令的输出
    if (command.includes('hostname')) {
      return {
        success: true,
        stdout: 'monitoring-server-01',
        stderr: '',
        exitCode: 0,
        executionTime: 0
      }
    }

    if (command.includes('uname -s')) {
      return {
        success: true,
        stdout: 'Linux',
        stderr: '',
        exitCode: 0,
        executionTime: 0
      }
    }

    if (command.includes('uname -m')) {
      return {
        success: true,
        stdout: 'x86_64',
        stderr: '',
        exitCode: 0,
        executionTime: 0
      }
    }

    if (command.includes('nproc')) {
      return {
        success: true,
        stdout: String(4 + Math.floor(Math.random() * 8)), // 4-12 cores
        stderr: '',
        exitCode: 0,
        executionTime: 0
      }
    }

    if (command.includes('free -m')) {
      return {
        success: true,
        stdout: String(8192 + Math.floor(Math.random() * 16384)), // 8-24GB
        stderr: '',
        exitCode: 0,
        executionTime: 0
      }
    }

    if (command.includes('mkdir')) {
      return {
        success: true,
        stdout: '',
        stderr: '',
        exitCode: 0,
        executionTime: 0
      }
    }

    if (command.includes('chmod')) {
      return {
        success: true,
        stdout: '',
        stderr: '',
        exitCode: 0,
        executionTime: 0
      }
    }

    if (command.includes('tee')) {
      return {
        success: true,
        stdout: '',
        stderr: '',
        exitCode: 0,
        executionTime: 0
      }
    }

    if (command.includes('docker run')) {
      const containerName = command.match(/--name\s+(\S+)/)?.[1] || 'container'
      return {
        success: true,
        stdout: `${containerName}_${Date.now()}`,
        stderr: '',
        exitCode: 0,
        executionTime: 0
      }
    }

    if (command.includes('docker ps')) {
      return {
        success: true,
        stdout: 'Up 5 minutes',
        stderr: '',
        exitCode: 0,
        executionTime: 0
      }
    }

    if (command.includes('systemctl')) {
      if (command.includes('is-active')) {
        return {
          success: true,
          stdout: Math.random() > 0.2 ? 'active' : 'inactive',
          stderr: '',
          exitCode: 0,
          executionTime: 0
        }
      } else {
        return {
          success: true,
          stdout: '',
          stderr: '',
          exitCode: 0,
          executionTime: 0
        }
      }
    }

    if (command.includes('wget') || command.includes('curl')) {
      return {
        success: Math.random() > 0.1, // 90% success rate
        stdout: 'Download completed',
        stderr: '',
        exitCode: Math.random() > 0.1 ? 0 : 1,
        executionTime: 0
      }
    }

    // 默认成功响应
    return {
      success: true,
      stdout: 'Command executed successfully',
      stderr: '',
      exitCode: 0,
      executionTime: 0
    }
  }

  private generateMockFileContent(remotePath: string): string {
    if (remotePath.includes('prometheus.yml')) {
      return `global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']`
    }

    if (remotePath.includes('alertmanager.yml')) {
      return `global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alertmanager@example.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: 'admin@example.com'
        subject: '[Alert] {{ .GroupLabels.alertname }}'`
    }

    if (remotePath.includes('snmp.yml')) {
      return `modules:
  if_mib:
    walk:
      - 1.3.6.1.2.1.2.2.1.2   # ifDescr
      - 1.3.6.1.2.1.2.2.1.8   # ifOperStatus
    lookups:
      - source_indexes: [ifIndex]
        lookup: 1.3.6.1.2.1.2.2.1.2`
    }

    return `# Mock file content for ${remotePath}
# Generated at ${new Date().toISOString()}
# This is a simulated file content for testing purposes`
  }
}

// 导出单例实例
export const sshService = new SSHService()