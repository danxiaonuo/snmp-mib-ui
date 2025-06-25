import { NextRequest, NextResponse } from 'next/server'

interface ConfigRequest {
  components: string[]
  versions: Record<string, string>
  settings: Record<string, any>
}

interface ConfigFile {
  filename: string
  content: string
  description: string
  type: 'yaml' | 'json' | 'toml' | 'env' | 'sh'
}

// 生成 Node Exporter 配置
function generateNodeExporterConfig(version: string, settings: any): ConfigFile[] {
  const dockerCompose = `version: '3.8'
services:
  node-exporter:
    image: prom/node-exporter:v${version}
    container_name: node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    networks:
      - monitoring

networks:
  monitoring:
    external: true`

  const systemdService = `[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter \\
    --path.procfs=/proc \\
    --path.sysfs=/sys \\
    --collector.filesystem.mount-points-exclude="^/(sys|proc|dev|host|etc|rootfs/var/lib/docker/containers|rootfs/var/lib/docker/overlay2|rootfs/run/docker/netns|rootfs/var/lib/docker/aufs)($$|/)"

[Install]
WantedBy=multi-user.target`

  return [
    {
      filename: 'docker-compose.node-exporter.yml',
      content: dockerCompose,
      description: 'Node Exporter Docker Compose 配置',
      type: 'yaml'
    },
    {
      filename: 'node-exporter.service',
      content: systemdService,
      description: 'Node Exporter Systemd 服务配置',
      type: 'yaml'
    }
  ]
}

// 生成 Categraf 配置
function generateCategrafConfig(version: string, settings: any): ConfigFile[] {
  const config = `[global]
hostname = "${settings.hostname || 'localhost'}"
interval = ${settings.interval || 15}
providers = ["local"]

[writer_opt]
batch = 2000
chan_size = 10000

[[writers]]
url = "${settings.vmUrl || 'http://localhost:8428'}/api/v1/write"
timeout = 5000
basic_auth_user = ""
basic_auth_pass = ""

[log]
file_name = "stdout"
level = "INFO"

[[inputs.cpu]]
interval = 15
collect = ["cpu"]

[[inputs.mem]]
interval = 15
collect = ["mem"]

[[inputs.disk]]
interval = 15
collect = ["disk"]

[[inputs.diskio]]
interval = 15
collect = ["diskio"]

[[inputs.net]]
interval = 15
collect = ["net"]
interfaces = ["eth*", "en*"]

[[inputs.netstat]]
interval = 15
collect = ["netstat"]

[[inputs.processes]]
interval = 15
collect = ["processes"]`

  const dockerCompose = `version: '3.8'
services:
  categraf:
    image: flashcatcloud/categraf:v${version}
    container_name: categraf
    restart: unless-stopped
    hostname: ${settings.hostname || 'categraf-host'}
    volumes:
      - ./categraf.toml:/etc/categraf/conf/config.toml
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - HOST_PROC=/host/proc
      - HOST_SYS=/host/sys
    networks:
      - monitoring

networks:
  monitoring:
    external: true`

  return [
    {
      filename: 'categraf.toml',
      content: config,
      description: 'Categraf 主配置文件',
      type: 'toml'
    },
    {
      filename: 'docker-compose.categraf.yml',
      content: dockerCompose,
      description: 'Categraf Docker Compose 配置',
      type: 'yaml'
    }
  ]
}

// 生成 VictoriaMetrics 配置
function generateVictoriaMetricsConfig(version: string, settings: any): ConfigFile[] {
  const retentionPeriod = settings.retentionPeriod || '1y'
  const storageDataPath = settings.storageDataPath || '/victoria-metrics-data'
  
  const dockerCompose = `version: '3.8'
services:
  victoriametrics:
    image: victoriametrics/victoria-metrics:v${version}
    container_name: victoriametrics
    restart: unless-stopped
    ports:
      - "8428:8428"
    volumes:
      - vm-data:${storageDataPath}
    command:
      - '--storageDataPath=${storageDataPath}'
      - '--retentionPeriod=${retentionPeriod}'
      - '--httpListenAddr=:8428'
      - '--maxConcurrentInserts=8'
      - '--maxInsertRequestSize=32MB'
    networks:
      - monitoring

volumes:
  vm-data:

networks:
  monitoring:
    external: true`

  const prometheusConfig = `global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'victoriametrics'
    static_configs:
      - targets: ['localhost:8428']
  
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
  
  - job_name: 'categraf'
    static_configs:
      - targets: ['categraf:9100']`

  return [
    {
      filename: 'docker-compose.victoriametrics.yml',
      content: dockerCompose,
      description: 'VictoriaMetrics Docker Compose 配置',
      type: 'yaml'
    },
    {
      filename: 'prometheus.yml',
      content: prometheusConfig,
      description: 'Prometheus 兼容配置文件',
      type: 'yaml'
    }
  ]
}

// 生成 VMAgent 配置
function generateVMAgentConfig(version: string, settings: any): ConfigFile[] {
  const remoteWriteUrl = settings.remoteWriteUrl || 'http://victoriametrics:8428/api/v1/write'
  
  const config = `global:
  scrape_interval: 15s
  external_labels:
    cluster: '${settings.cluster || 'default'}'
    replica: '${settings.replica || '1'}'

scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
  
  - job_name: 'categraf'
    static_configs:
      - targets: ['categraf:9100']

remote_write:
  - url: ${remoteWriteUrl}
    queue_config:
      max_samples_per_send: 10000
      batch_send_deadline: 5s
      max_shards: 30`

  const dockerCompose = `version: '3.8'
services:
  vmagent:
    image: victoriametrics/vmagent:v${version}
    container_name: vmagent
    restart: unless-stopped
    ports:
      - "8429:8429"
    volumes:
      - ./vmagent.yml:/etc/vmagent/config.yml
    command:
      - '--promscrape.config=/etc/vmagent/config.yml'
      - '--remoteWrite.url=${remoteWriteUrl}'
      - '--httpListenAddr=:8429'
    networks:
      - monitoring

networks:
  monitoring:
    external: true`

  return [
    {
      filename: 'vmagent.yml',
      content: config,
      description: 'VMAgent 配置文件',
      type: 'yaml'
    },
    {
      filename: 'docker-compose.vmagent.yml',
      content: dockerCompose,
      description: 'VMAgent Docker Compose 配置',
      type: 'yaml'
    }
  ]
}

// 生成 Grafana 配置
function generateGrafanaConfig(version: string, settings: any): ConfigFile[] {
  const adminPassword = settings.adminPassword || 'admin123'
  
  const dockerCompose = `version: '3.8'
services:
  grafana:
    image: grafana/grafana:${version}
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${adminPassword}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    networks:
      - monitoring

volumes:
  grafana-data:

networks:
  monitoring:
    external: true`

  const datasourceConfig = `apiVersion: 1

datasources:
  - name: VictoriaMetrics
    type: prometheus
    access: proxy
    url: http://victoriametrics:8428
    isDefault: true
    editable: true`

  const dashboardConfig = `apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards`

  return [
    {
      filename: 'docker-compose.grafana.yml',
      content: dockerCompose,
      description: 'Grafana Docker Compose 配置',
      type: 'yaml'
    },
    {
      filename: 'grafana/provisioning/datasources/datasource.yml',
      content: datasourceConfig,
      description: 'Grafana 数据源配置',
      type: 'yaml'
    },
    {
      filename: 'grafana/provisioning/dashboards/dashboard.yml',
      content: dashboardConfig,
      description: 'Grafana 仪表板配置',
      type: 'yaml'
    }
  ]
}

// 生成 Alertmanager 配置
function generateAlertmanagerConfig(version: string, settings: any): ConfigFile[] {
  const webhookUrl = settings.webhookUrl || 'http://localhost:9093/webhook'
  const smtpHost = settings.smtpHost || 'smtp.example.com'
  const smtpFrom = settings.smtpFrom || 'alerts@example.com'
  
  const config = `global:
  smtp_smarthost: '${smtpHost}:587'
  smtp_from: '${smtpFrom}'
  smtp_auth_username: '${smtpFrom}'
  smtp_auth_password: 'your-password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: '${webhookUrl}'
        send_resolved: true
    email_configs:
      - to: 'admin@example.com'
        subject: 'Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']`

  const dockerCompose = `version: '3.8'
services:
  alertmanager:
    image: prom/alertmanager:v${version}
    container_name: alertmanager
    restart: unless-stopped
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    networks:
      - monitoring

volumes:
  alertmanager-data:

networks:
  monitoring:
    external: true`

  return [
    {
      filename: 'alertmanager.yml',
      content: config,
      description: 'Alertmanager 配置文件',
      type: 'yaml'
    },
    {
      filename: 'docker-compose.alertmanager.yml',
      content: dockerCompose,
      description: 'Alertmanager Docker Compose 配置',
      type: 'yaml'
    }
  ]
}

// 生成 SNMP Exporter 配置
function generateSNMPExporterConfig(version: string, settings: any): ConfigFile[] {
  const config = `auths:
  public_v2:
    community: public
    security_level: noAuthNoPriv
    auth_protocol: MD5
    priv_protocol: DES
    version: 2

modules:
  if_mib:
    walk:
      - 1.3.6.1.2.1.2.2.1.2  # ifDescr
      - 1.3.6.1.2.1.2.2.1.3  # ifType
      - 1.3.6.1.2.1.2.2.1.5  # ifSpeed
      - 1.3.6.1.2.1.2.2.1.8  # ifOperStatus
      - 1.3.6.1.2.1.2.2.1.10 # ifInOctets
      - 1.3.6.1.2.1.2.2.1.16 # ifOutOctets
    metrics:
      - name: ifOperStatus
        oid: 1.3.6.1.2.1.2.2.1.8
        type: gauge
        help: The current operational state of the interface.
        indexes:
          - labelname: ifIndex
            type: gauge
        lookups:
          - labels:
              - ifIndex
            labelname: ifDescr
            oid: 1.3.6.1.2.1.2.2.1.2
            type: DisplayString`

  const dockerCompose = `version: '3.8'
services:
  snmp-exporter:
    image: prom/snmp-exporter:v${version}
    container_name: snmp-exporter
    restart: unless-stopped
    ports:
      - "9116:9116"
    volumes:
      - ./snmp.yml:/etc/snmp_exporter/snmp.yml
    command:
      - '--config.file=/etc/snmp_exporter/snmp.yml'
    networks:
      - monitoring

networks:
  monitoring:
    external: true`

  return [
    {
      filename: 'snmp.yml',
      content: config,
      description: 'SNMP Exporter 配置文件',
      type: 'yaml'
    },
    {
      filename: 'docker-compose.snmp-exporter.yml',
      content: dockerCompose,
      description: 'SNMP Exporter Docker Compose 配置',
      type: 'yaml'
    }
  ]
}

// 生成安装脚本
function generateInstallScript(components: string[], versions: Record<string, string>): ConfigFile {
  const script = `#!/bin/bash

# 监控组件自动安装脚本
# 生成时间: $(date)

set -e

echo "开始安装监控组件..."

# 创建监控网络
docker network create monitoring 2>/dev/null || true

# 创建必要的目录
mkdir -p ./configs
mkdir -p ./data
mkdir -p ./logs

${components.map(component => {
  switch (component) {
    case 'node-exporter':
      return `# 启动 Node Exporter
echo "启动 Node Exporter v${versions[component]}..."
docker-compose -f docker-compose.node-exporter.yml up -d`
    case 'categraf':
      return `# 启动 Categraf
echo "启动 Categraf v${versions[component]}..."
docker-compose -f docker-compose.categraf.yml up -d`
    case 'victoriametrics':
      return `# 启动 VictoriaMetrics
echo "启动 VictoriaMetrics v${versions[component]}..."
docker-compose -f docker-compose.victoriametrics.yml up -d`
    case 'vmagent':
      return `# 启动 VMAgent
echo "启动 VMAgent v${versions[component]}..."
docker-compose -f docker-compose.vmagent.yml up -d`
    case 'grafana':
      return `# 启动 Grafana
echo "启动 Grafana v${versions[component]}..."
mkdir -p ./grafana/provisioning/datasources
mkdir -p ./grafana/provisioning/dashboards
docker-compose -f docker-compose.grafana.yml up -d`
    case 'alertmanager':
      return `# 启动 Alertmanager
echo "启动 Alertmanager v${versions[component]}..."
docker-compose -f docker-compose.alertmanager.yml up -d`
    case 'snmp-exporter':
      return `# 启动 SNMP Exporter
echo "启动 SNMP Exporter v${versions[component]}..."
docker-compose -f docker-compose.snmp-exporter.yml up -d`
    default:
      return ''
  }
}).join('\n\n')}

echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态:"
docker ps --filter "network=monitoring" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "安装完成！"
echo "访问地址:"
${components.includes('grafana') ? 'echo "  Grafana: http://localhost:3000 (admin/admin123)"' : ''}
${components.includes('victoriametrics') ? 'echo "  VictoriaMetrics: http://localhost:8428"' : ''}
${components.includes('alertmanager') ? 'echo "  Alertmanager: http://localhost:9093"' : ''}
${components.includes('node-exporter') ? 'echo "  Node Exporter: http://localhost:9100"' : ''}
${components.includes('snmp-exporter') ? 'echo "  SNMP Exporter: http://localhost:9116"' : ''}`

  return {
    filename: 'install.sh',
    content: script,
    description: '一键安装脚本',
    type: 'sh'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { components, versions, settings }: ConfigRequest = await request.json()
    
    if (!components || !Array.isArray(components) || components.length === 0) {
      return NextResponse.json(
        { error: '请选择至少一个组件' },
        { status: 400 }
      )
    }
    
    const configFiles: ConfigFile[] = []
    
    // 为每个组件生成配置文件
    for (const component of components) {
      const version = versions[component]
      if (!version) {
        continue
      }
      
      const componentSettings = settings[component] || {}
      
      switch (component) {
        case 'node-exporter':
          configFiles.push(...generateNodeExporterConfig(version, componentSettings))
          break
        case 'categraf':
          configFiles.push(...generateCategrafConfig(version, componentSettings))
          break
        case 'victoriametrics':
          configFiles.push(...generateVictoriaMetricsConfig(version, componentSettings))
          break
        case 'vmagent':
          configFiles.push(...generateVMAgentConfig(version, componentSettings))
          break
        case 'grafana':
          configFiles.push(...generateGrafanaConfig(version, componentSettings))
          break
        case 'alertmanager':
          configFiles.push(...generateAlertmanagerConfig(version, componentSettings))
          break
        case 'snmp-exporter':
          configFiles.push(...generateSNMPExporterConfig(version, componentSettings))
          break
      }
    }
    
    // 生成安装脚本
    configFiles.push(generateInstallScript(components, versions))
    
    return NextResponse.json({
      success: true,
      configs: configFiles,
      summary: {
        totalFiles: configFiles.length,
        components: components.length,
        estimatedInstallTime: `${components.length * 2} 分钟`
      }
    })
    
  } catch (error) {
    console.error('Error generating configs:', error)
    return NextResponse.json(
      { error: '生成配置文件失败' },
      { status: 500 }
    )
  }
}