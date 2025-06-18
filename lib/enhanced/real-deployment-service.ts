// 真实的部署服务实现
// 支持 SSH 连接、组件部署、配置管理、服务控制

export interface DeploymentHost {
  id: string
  ip: string
  name: string
  port?: number
  username: string
  password?: string
  privateKey?: string
  baseDir?: string
}

export interface ComponentConfig {
  name: string
  type: 'collector' | 'storage' | 'visualization' | 'alerting'
  version: string
  ports: number[]
  configFiles: Record<string, string>
  dependencies?: string[]
  healthCheck?: {
    path: string
    port: number
    timeout: number
  }
}

export interface DeploymentResult {
  success: boolean
  error?: string
  details?: any
  port?: number
  configPath?: string
  serviceName?: string
  healthCheck?: any
  healthPath?: string
}

export interface HostDeploymentResult {
  hostId: string
  hostIp: string
  hostName: string
  deployedComponents: Array<{
    component: string
    status: string
    port: number
    configPath: string
    serviceName: string
    healthCheck?: any
  }>
  failedComponents: Array<{
    component: string
    error: string
    details?: any
  }>
  status: 'success' | 'partial' | 'failed'
  message: string
  details: Record<string, any>
  services: Record<string, {
    status: string
    port: number
    healthUrl: string
  }>
}

// 支持的组件配置
export const COMPONENT_CONFIGS: Record<string, ComponentConfig> = {
  'node-exporter': {
    name: 'Node Exporter',
    type: 'collector',
    version: '1.7.0',
    ports: [9100],
    configFiles: {},
    healthCheck: {
      path: '/metrics',
      port: 9100,
      timeout: 5000
    }
  },
  'categraf': {
    name: 'Categraf',
    type: 'collector', 
    version: '0.3.72',
    ports: [9100],
    configFiles: {
      'categraf.toml': `[global]
hostname = "auto"
interval = "15s"
providers = ["local"]

[writer_opt]
batch = 2000
chan_size = 10000

[[writers]]
url = "http://victoriametrics:8428/api/v1/write"
timeout = "5000ms"
dial_timeout = "2500ms"
max_idle_conns_per_host = 100

[[inputs.cpu]]
interval = "15s"
collect_per_cpu = true

[[inputs.mem]]
interval = "15s"

[[inputs.disk]]
interval = "30s"
ignore_fs = ["tmpfs", "devtmpfs", "devfs", "iso9660", "overlay", "aufs", "squashfs"]

[[inputs.diskio]]
interval = "30s"

[[inputs.net]]
interval = "15s"
ignore_protocol_stats = false

[[inputs.netstat]]
interval = "30s"

[[inputs.processes]]
interval = "30s"

[[inputs.system]]
interval = "15s"

[[inputs.kernel]]
interval = "60s"

# SNMP 输入插件配置
[[inputs.snmp]]
agents = ["udp://192.168.1.1:161"]
version = 2
community = "public"
name = "snmp"
timeout = "5s"
retries = 3

  [[inputs.snmp.field]]
  name = "uptime"
  oid = "1.3.6.1.2.1.1.3.0"

  [[inputs.snmp.field]]
  name = "load1"
  oid = "1.3.6.1.4.1.2021.10.1.3.1"

  [[inputs.snmp.table]]
  name = "interface"
  inherit_tags = ["hostname"]
  
    [[inputs.snmp.table.field]]
    name = "ifDescr"
    oid = "1.3.6.1.2.1.2.2.1.2"
    is_tag = true
    
    [[inputs.snmp.table.field]]
    name = "ifInOctets"
    oid = "1.3.6.1.2.1.2.2.1.10"
    
    [[inputs.snmp.table.field]]
    name = "ifOutOctets"
    oid = "1.3.6.1.2.1.2.2.1.16"`
    }
  },
  'snmp-exporter': {
    name: 'SNMP Exporter',
    type: 'collector',
    version: '0.25.0',
    ports: [9116],
    configFiles: {
      'snmp.yml': `modules:
  # 标准接口监控
  if_mib:
    walk:
      - 1.3.6.1.2.1.2.2.1.2   # ifDescr
      - 1.3.6.1.2.1.2.2.1.8   # ifOperStatus
      - 1.3.6.1.2.1.31.1.1.1.6  # ifHCInOctets
      - 1.3.6.1.2.1.31.1.1.1.10 # ifHCOutOctets
      - 1.3.6.1.2.1.31.1.1.1.15 # ifHighSpeed
    lookups:
      - source_indexes: [ifIndex]
        lookup: 1.3.6.1.2.1.2.2.1.2
        drop_source_indexes: false
    overrides:
      ifDescr:
        type: DisplayString
      ifOperStatus:
        type: gauge
      ifHCInOctets:
        type: counter64
      ifHCOutOctets:
        type: counter64
      ifHighSpeed:
        type: gauge
        
  # Cisco 交换机专用
  cisco_switch:
    walk:
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.2.2.1.2    # ifDescr
      - 1.3.6.1.2.1.2.2.1.8    # ifOperStatus
      - 1.3.6.1.2.1.31.1.1.1.6  # ifHCInOctets
      - 1.3.6.1.2.1.31.1.1.1.10 # ifHCOutOctets
      - 1.3.6.1.4.1.9.9.109.1.1.1.1.2  # cpmCPUTotal1minRev
      - 1.3.6.1.4.1.9.9.48.1.1.1.5     # ciscoMemoryPoolUsed
      - 1.3.6.1.4.1.9.9.13.1.3.1.3     # ciscoEnvMonTemperatureValue
    lookups:
      - source_indexes: [ifIndex]
        lookup: 1.3.6.1.2.1.2.2.1.2
        drop_source_indexes: false
    overrides:
      ifDescr:
        type: DisplayString
      cpmCPUTotal1minRev:
        type: gauge
      ciscoMemoryPoolUsed:
        type: gauge
      ciscoEnvMonTemperatureValue:
        type: gauge

  # 华为交换机专用  
  huawei_switch:
    walk:
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.2.2.1.2    # ifDescr
      - 1.3.6.1.2.1.2.2.1.8    # ifOperStatus
      - 1.3.6.1.2.1.31.1.1.1.6  # ifHCInOctets
      - 1.3.6.1.2.1.31.1.1.1.10 # ifHCOutOctets
      - 1.3.6.1.4.1.2011.5.25.31.1.1.1.1.5  # hwEntityCpuUsage
      - 1.3.6.1.4.1.2011.5.25.31.1.1.1.1.7  # hwEntityMemUsage
      - 1.3.6.1.4.1.2011.5.25.31.1.1.1.1.11 # hwEntityTemperature
    lookups:
      - source_indexes: [ifIndex]
        lookup: 1.3.6.1.2.1.2.2.1.2
        drop_source_indexes: false
    overrides:
      ifDescr:
        type: DisplayString
      hwEntityCpuUsage:
        type: gauge
      hwEntityMemUsage:
        type: gauge
      hwEntityTemperature:
        type: gauge

  # H3C 交换机专用
  h3c_switch:
    walk:
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime  
      - 1.3.6.1.2.1.2.2.1.2    # ifDescr
      - 1.3.6.1.2.1.2.2.1.8    # ifOperStatus
      - 1.3.6.1.2.1.31.1.1.1.6  # ifHCInOctets
      - 1.3.6.1.2.1.31.1.1.1.10 # ifHCOutOctets
      - 1.3.6.1.4.1.25506.2.6.1.1.1.1.6   # hh3cEntityExtCpuUsage
      - 1.3.6.1.4.1.25506.2.6.1.1.1.1.8   # hh3cEntityExtMemUsage
      - 1.3.6.1.4.1.25506.2.6.1.1.1.1.12  # hh3cEntityExtTemperature
    lookups:
      - source_indexes: [ifIndex]
        lookup: 1.3.6.1.2.1.2.2.1.2
        drop_source_indexes: false
    overrides:
      ifDescr:
        type: DisplayString
      hh3cEntityExtCpuUsage:
        type: gauge
      hh3cEntityExtMemUsage:
        type: gauge
      hh3cEntityExtTemperature:
        type: gauge`
    }
  },
  'victoriametrics': {
    name: 'VictoriaMetrics',
    type: 'storage',
    version: '1.97.1',
    ports: [8428, 8089, 8089],
    configFiles: {},
    healthCheck: {
      path: '/health',
      port: 8428,
      timeout: 5000
    }
  },
  'vmagent': {
    name: 'VMAgent',
    type: 'collector',
    version: '1.97.1',
    ports: [8429],
    configFiles: {
      'vmagent.yml': `global:
  scrape_interval: 15s
  external_labels:
    cluster: 'main'
    replica: 'vmagent-1'

scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
    scrape_interval: 30s
    metrics_path: /metrics

  - job_name: 'snmp-devices'
    static_configs:
      - targets: 
        - 192.168.1.1   # 示例设备IP
        - 192.168.1.2
    metrics_path: /snmp
    params:
      module: [if_mib]
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: localhost:9116

  - job_name: 'categraf'
    static_configs:
      - targets: ['localhost:9100']
    scrape_interval: 30s

remote_write:
  - url: http://localhost:8428/api/v1/write
    queue_config:
      max_samples_per_send: 1000
      batch_send_deadline: 5s
      max_shards: 10
    write_relabel_configs:
      - source_labels: [__name__]
        regex: "(up|node_.*|snmp_.*|categraf_.*)"
        action: keep`
    }
  },
  'vmalert': {
    name: 'VMAlert',
    type: 'alerting',
    version: '1.97.1',
    ports: [8880],
    configFiles: {
      'alerts.yml': `groups:
  - name: system-alerts
    interval: 30s
    rules:
      - alert: HostDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Host {{ $labels.instance }} is down"
          description: "Host {{ $labels.instance }} has been down for more than 1 minute"

      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is above 80% for more than 5 minutes"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is above 85% for more than 5 minutes"

      - alert: HighDiskUsage
        expr: (1 - (node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes{fstype!="tmpfs"})) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High disk usage on {{ $labels.instance }}"
          description: "Disk usage is above 90% for more than 5 minutes"

  - name: network-alerts
    interval: 30s
    rules:
      - alert: NetworkInterfaceDown
        expr: node_network_up == 0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Network interface {{ $labels.device }} is down on {{ $labels.instance }}"
          description: "Network interface {{ $labels.device }} has been down for more than 2 minutes"

      - alert: HighNetworkTraffic
        expr: rate(node_network_receive_bytes_total[5m]) + rate(node_network_transmit_bytes_total[5m]) > 1000000000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High network traffic on {{ $labels.instance }}"
          description: "Network traffic is above 1GB/s for more than 5 minutes"

  - name: snmp-alerts  
    interval: 30s
    rules:
      - alert: SNMPDeviceDown
        expr: up{job="snmp-devices"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "SNMP device {{ $labels.instance }} is unreachable"
          description: "SNMP device {{ $labels.instance }} has been unreachable for more than 2 minutes"

      - alert: HighInterfaceUtilization
        expr: (irate(ifHCInOctets[5m]) + irate(ifHCOutOctets[5m])) * 8 / ifHighSpeed > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High interface utilization on {{ $labels.instance }}"
          description: "Interface {{ $labels.ifDescr }} utilization is above 80% for more than 5 minutes"

      - alert: InterfaceDown
        expr: ifOperStatus != 1
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Interface down on {{ $labels.instance }}"
          description: "Interface {{ $labels.ifDescr }} is down"`
    }
  },
  'grafana': {
    name: 'Grafana',
    type: 'visualization',
    version: '10.3.1',
    ports: [3000],
    configFiles: {
      'datasources.yml': `apiVersion: 1

datasources:
  - name: VictoriaMetrics
    type: prometheus
    access: proxy
    url: http://localhost:8428
    isDefault: true
    editable: true
    jsonData:
      timeInterval: "15s"
      queryTimeout: "60s"
      httpMethod: POST
      
  - name: VictoriaMetrics-VMAlert
    type: prometheus  
    access: proxy
    url: http://localhost:8880
    editable: true
    jsonData:
      timeInterval: "30s"
      queryTimeout: "60s"
      httpMethod: GET`,
      
      'dashboards.yml': `apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards`,
      
      'grafana.ini': `[server]
http_port = 3000
domain = localhost
root_url = http://localhost:3000/

[database]
type = sqlite3
path = /var/lib/grafana/grafana.db

[security]
admin_user = admin
admin_password = admin123!
secret_key = SW2YcwTIb9zpOOhoPsMm

[users]
allow_sign_up = false
allow_org_create = false
auto_assign_org = true
auto_assign_org_role = Viewer

[auth.anonymous]
enabled = false

[log]
mode = file
level = info
format = text

[alerting]
enabled = true
execute_alerts = true

[unified_alerting]
enabled = true`
    },
    healthCheck: {
      path: '/api/health',
      port: 3000,
      timeout: 5000
    }
  },
  'alertmanager': {
    name: 'Alertmanager',
    type: 'alerting',
    version: '0.26.0',
    ports: [9093],
    configFiles: {
      'alertmanager.yml': `global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alertmanager@example.com'
  smtp_auth_username: ''
  smtp_auth_password: ''
  smtp_require_tls: false

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 5s
      repeat_interval: 5m
    - match:
        severity: warning
      receiver: 'warning-alerts'
      repeat_interval: 30m

receivers:
  - name: 'default'
    email_configs:
      - to: 'admin@example.com'
        subject: '[Alert] {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Labels: {{ range .Labels.SortedPairs }}{{ .Name }}={{ .Value }} {{ end }}
          {{ end }}

  - name: 'critical-alerts'
    email_configs:
      - to: 'admin@example.com,oncall@example.com'
        subject: '[CRITICAL] {{ .GroupLabels.alertname }}'
        body: |
          🚨 CRITICAL ALERT 🚨
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Started: {{ .StartsAt.Format "2006-01-02 15:04:05" }}
          {{ end }}

  - name: 'warning-alerts'
    email_configs:
      - to: 'admin@example.com'
        subject: '[Warning] {{ .GroupLabels.alertname }}'
        body: |
          ⚠️  Warning Alert
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']`
    },
    healthCheck: {
      path: '/-/healthy',
      port: 9093,
      timeout: 5000
    }
  }
}

// 真实的配置下发服务
export class RealConfigDeploymentService {
  
  // 部署组件到主机
  async deployComponentToHost(
    host: DeploymentHost, 
    componentId: string, 
    deploymentMethod: string, 
    customConfigs?: Record<string, string>
  ): Promise<DeploymentResult> {
    
    const componentConfig = COMPONENT_CONFIGS[componentId]
    if (!componentConfig) {
      throw new Error(`未知组件: ${componentId}`)
    }

    const baseDir = host.baseDir || '/opt/monitoring'
    const configDir = `${baseDir}/config/${componentId}`
    const dataDir = `${baseDir}/data/${componentId}`
    const logDir = `${baseDir}/logs/${componentId}`

    try {
      // 测试SSH连接
      const sshTest = await this.testSSHConnection(host)
      if (!sshTest.success) {
        throw new Error(`SSH连接失败: ${sshTest.error}`)
      }

      // 创建目录结构
      await this.createDirectories(host, [configDir, dataDir, logDir])

      // 上传配置文件
      const configFiles = customConfigs || componentConfig.configFiles
      for (const [filename, content] of Object.entries(configFiles)) {
        const configPath = `${configDir}/${filename}`
        await this.uploadConfigFile(host, configPath, content)
      }

      let serviceName = componentId
      let port = componentConfig.ports[0]

      if (deploymentMethod === 'docker') {
        // Docker 部署
        serviceName = await this.deployWithDocker(host, componentId, componentConfig, configDir, dataDir, logDir)
      } else if (deploymentMethod === 'binary') {
        // 二进制部署
        await this.deployWithBinary(host, componentId, componentConfig, configDir, dataDir, logDir)
      } else if (deploymentMethod === 'systemd') {
        // Systemd 服务部署
        await this.deployWithSystemd(host, componentId, componentConfig, configDir, dataDir, logDir)
      } else {
        throw new Error(`不支持的部署方法: ${deploymentMethod}`)
      }

      // 等待服务启动
      await this.waitForService(5000)

      // 健康检查
      let healthCheck = null
      if (componentConfig.healthCheck) {
        healthCheck = await this.performHealthCheck(host.ip, componentConfig.healthCheck)
      }

      return {
        success: true,
        port,
        configPath: configDir,
        serviceName,
        healthCheck,
        healthPath: componentConfig.healthCheck?.path
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error',
        details: error
      }
    }
  }

  // 测试SSH连接
  private async testSSHConnection(host: DeploymentHost): Promise<{success: boolean, error?: string}> {
    // 这里应该实现真实的SSH连接测试
    // 由于浏览器环境限制，这里模拟实现
    
    if (!host.ip || !host.username) {
      return { success: false, error: '缺少主机IP或用户名' }
    }

    if (!host.password && !host.privateKey) {
      return { success: false, error: '缺少认证信息（密码或私钥）' }
    }

    // 模拟连接测试
    try {
      const response = await fetch('/api/ssh/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: host.ip,
          port: host.port || 22,
          username: host.username,
          password: host.password,
          privateKey: host.privateKey
        })
      })

      if (response.ok) {
        return { success: true }
      } else {
        const error = await response.text()
        return { success: false, error }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      }
    }
  }

  // 创建目录
  private async createDirectories(host: DeploymentHost, directories: string[]): Promise<void> {
    for (const dir of directories) {
      await this.executeRemoteCommand(host, `sudo mkdir -p ${dir} && sudo chmod 755 ${dir}`)
    }
  }

  // 上传配置文件
  private async uploadConfigFile(host: DeploymentHost, remotePath: string, content: string): Promise<void> {
    // 实现文件上传逻辑
    await this.executeRemoteCommand(host, `sudo tee ${remotePath} > /dev/null`, content)
    await this.executeRemoteCommand(host, `sudo chmod 644 ${remotePath}`)
  }

  // Docker 部署
  private async deployWithDocker(
    host: DeploymentHost, 
    componentId: string, 
    config: ComponentConfig,
    configDir: string,
    dataDir: string,
    logDir: string
  ): Promise<string> {
    const dockerImage = this.getDockerImage(componentId, config.version)
    const containerName = `${componentId}-${Date.now()}`
    
    // 构建 Docker 命令
    const portMappings = config.ports.map(p => `-p ${p}:${p}`).join(' ')
    const volumeMappings = [
      `-v ${configDir}:/etc/${componentId}`,
      `-v ${dataDir}:/var/lib/${componentId}`,
      `-v ${logDir}:/var/log/${componentId}`
    ].join(' ')

    const dockerCmd = `sudo docker run -d --name ${containerName} --restart unless-stopped ${portMappings} ${volumeMappings} ${dockerImage}`
    
    await this.executeRemoteCommand(host, dockerCmd)
    return containerName
  }

  // 二进制部署
  private async deployWithBinary(
    host: DeploymentHost,
    componentId: string, 
    config: ComponentConfig,
    configDir: string,
    dataDir: string,
    logDir: string
  ): Promise<void> {
    const downloadUrl = this.getBinaryDownloadUrl(componentId, config.version)
    const binaryPath = `${host.baseDir || '/opt/monitoring'}/bin/${componentId}`
    
    // 下载并安装二进制文件
    await this.executeRemoteCommand(host, `sudo mkdir -p $(dirname ${binaryPath})`)
    await this.executeRemoteCommand(host, `sudo wget -O ${binaryPath} ${downloadUrl}`)
    await this.executeRemoteCommand(host, `sudo chmod +x ${binaryPath}`)
  }

  // Systemd 服务部署
  private async deployWithSystemd(
    host: DeploymentHost,
    componentId: string,
    config: ComponentConfig,
    configDir: string,
    dataDir: string,
    logDir: string
  ): Promise<void> {
    const binaryPath = `${host.baseDir || '/opt/monitoring'}/bin/${componentId}`
    const serviceFile = this.generateSystemdService(componentId, binaryPath, configDir, dataDir, logDir, config.ports[0])
    
    // 上传服务文件
    await this.uploadConfigFile(host, `/tmp/${componentId}.service`, serviceFile)
    await this.executeRemoteCommand(host, `sudo mv /tmp/${componentId}.service /etc/systemd/system/`)
    await this.executeRemoteCommand(host, `sudo systemctl daemon-reload`)
    await this.executeRemoteCommand(host, `sudo systemctl enable ${componentId}`)
    await this.executeRemoteCommand(host, `sudo systemctl start ${componentId}`)
  }

  // 执行远程命令
  private async executeRemoteCommand(host: DeploymentHost, command: string, input?: string): Promise<string> {
    // 实现远程命令执行
    const response = await fetch('/api/ssh/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: host.ip,
        port: host.port || 22,
        username: host.username,
        password: host.password,
        privateKey: host.privateKey,
        command,
        input
      })
    })

    if (!response.ok) {
      throw new Error(`Command execution failed: ${await response.text()}`)
    }

    return await response.text()
  }

  // 健康检查
  private async performHealthCheck(
    host: string, 
    healthConfig: {path: string, port: number, timeout: number}
  ): Promise<{healthy: boolean, response?: any, error?: string}> {
    try {
      const response = await fetch(`http://${host}:${healthConfig.port}${healthConfig.path}`, {
        method: 'GET',
        signal: AbortSignal.timeout(healthConfig.timeout)
      })
      
      if (response.ok) {
        return { healthy: true, response: await response.text() }
      } else {
        return { healthy: false, error: `HTTP ${response.status}: ${response.statusText}` }
      }
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown health check error' 
      }
    }
  }

  // 工具方法
  private getDockerImage(componentId: string, version: string): string {
    const imageMap: Record<string, string> = {
      'node-exporter': `prom/node-exporter:v${version}`,
      'categraf': `flashcatcloud/categraf:v${version}`,
      'snmp-exporter': `prom/snmp-exporter:v${version}`,
      'victoriametrics': `victoriametrics/victoria-metrics:v${version}`,
      'vmagent': `victoriametrics/vmagent:v${version}`,
      'vmalert': `victoriametrics/vmalert:v${version}`,
      'grafana': `grafana/grafana:${version}`,
      'alertmanager': `prom/alertmanager:v${version}`
    }
    return imageMap[componentId] || `${componentId}:${version}`
  }

  private getBinaryDownloadUrl(componentId: string, version: string): string {
    const urlMap: Record<string, string> = {
      'node-exporter': `https://github.com/prometheus/node_exporter/releases/download/v${version}/node_exporter-${version}.linux-amd64.tar.gz`,
      'snmp-exporter': `https://github.com/prometheus/snmp_exporter/releases/download/v${version}/snmp_exporter-${version}.linux-amd64.tar.gz`,
      'alertmanager': `https://github.com/prometheus/alertmanager/releases/download/v${version}/alertmanager-${version}.linux-amd64.tar.gz`,
      'vmagent': `https://github.com/VictoriaMetrics/VictoriaMetrics/releases/download/v${version}/vmutils-v${version}.tar.gz`,
      'vmalert': `https://github.com/VictoriaMetrics/VictoriaMetrics/releases/download/v${version}/vmutils-v${version}.tar.gz`,
      'victoriametrics': `https://github.com/VictoriaMetrics/VictoriaMetrics/releases/download/v${version}/victoria-metrics-v${version}.tar.gz`
    }
    return urlMap[componentId] || ''
  }

  private generateSystemdService(
    componentId: string, 
    binaryPath: string, 
    configDir: string, 
    dataDir: string, 
    logDir: string, 
    port: number
  ): string {
    return `[Unit]
Description=${componentId.toUpperCase()} Monitoring Service
After=network.target

[Service]
Type=simple
User=monitoring
Group=monitoring
ExecStart=${binaryPath} --config.file=${configDir}/${componentId}.yml --storage.tsdb.path=${dataDir} --web.listen-address=0.0.0.0:${port}
Restart=always
RestartSec=5
StandardOutput=append:${logDir}/${componentId}.log
StandardError=append:${logDir}/${componentId}.log

[Install]
WantedBy=multi-user.target`
  }

  private async waitForService(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 导出实例
export const realDeploymentService = new RealConfigDeploymentService()