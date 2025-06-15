package services

import (
	"bytes"
	"context"
	"fmt"
	"strings"
	"text/template"
	"time"

	"github.com/go-redis/redis/v8"
	"golang.org/x/crypto/ssh"
	"gorm.io/gorm"
	"mib-platform/models"
)

// ConfigDeploymentService 配置部署服务
type ConfigDeploymentService struct {
	db          *gorm.DB
	redis       *redis.Client
	hostService *HostService
}

func NewConfigDeploymentService(db *gorm.DB, redis *redis.Client, hostService *HostService) *ConfigDeploymentService {
	return &ConfigDeploymentService{
		db:          db,
		redis:       redis,
		hostService: hostService,
	}
}

// ConfigDeploymentTask 配置部署任务
type ConfigDeploymentTask struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	HostIDs     []uint                 `json:"host_ids"`
	ConfigType  string                 `json:"config_type"` // monitoring, alerting, snmp
	ConfigFiles map[string]string      `json:"config_files"`
	Status      string                 `json:"status"` // pending, running, completed, failed
	Progress    int                    `json:"progress"`
	StartedAt   *time.Time             `json:"started_at"`
	CompletedAt *time.Time             `json:"completed_at"`
	Results     []ConfigDeployResult   `json:"results"`
	Error       string                 `json:"error,omitempty"`
}

type ConfigDeployResult struct {
	HostID   uint   `json:"host_id"`
	HostIP   string `json:"host_ip"`
	Status   string `json:"status"` // success, failed
	Message  string `json:"message"`
	FilePath string `json:"file_path"`
}

// 监控配置模板
var monitoringConfigTemplates = map[string]string{
	"prometheus.yml": `global:
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
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: {{.NodeExporterTargets}}

  - job_name: 'snmp-exporter'
    static_configs:
      - targets: {{.SNMPTargets}}
    metrics_path: /snmp
    params:
      module: [if_mib]
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: snmp-exporter:9116`,

	"alertmanager.yml": `global:
  smtp_smarthost: '{{.SMTPHost}}:{{.SMTPPort}}'
  smtp_from: '{{.SMTPFrom}}'
  smtp_auth_username: '{{.SMTPUsername}}'
  smtp_auth_password: '{{.SMTPPassword}}'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: '{{.AlertEmail}}'
        subject: '[ALERT] {{.GroupLabels.alertname}}'
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
    equal: ['alertname', 'dev', 'instance']`,

	"vmagent.yml": `global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: {{.NodeExporterTargets}}

  - job_name: 'snmp-devices'
    static_configs:
      - targets: {{.SNMPTargets}}
    metrics_path: /snmp
    params:
      module: [if_mib]
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: snmp-exporter:9116

remote_write:
  - url: {{.RemoteWriteURL}}`,

	"grafana-datasource.yml": `apiVersion: 1

datasources:
  - name: VictoriaMetrics
    type: prometheus
    access: proxy
    url: {{.VictoriaMetricsURL}}
    isDefault: true
    editable: true`,
}

// 告警规则模板
var alertRuleTemplates = map[string]string{
	"node-alerts.yml": `groups:
  - name: node-alerts
    rules:
      - alert: HostDown
        expr: up{job="node-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Host {{ $labels.instance }} is down"
          description: "Host {{ $labels.instance }} has been down for more than 1 minute."

      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > {{.CPUThreshold}}
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is above {{.CPUThreshold}}% for more than 5 minutes."

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > {{.MemoryThreshold}}
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is above {{.MemoryThreshold}}% for more than 5 minutes."

      - alert: HighDiskUsage
        expr: (1 - (node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes{fstype!="tmpfs"})) * 100 > {{.DiskThreshold}}
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High disk usage on {{ $labels.instance }}"
          description: "Disk usage is above {{.DiskThreshold}}% for more than 5 minutes."`,

	"snmp-alerts.yml": `groups:
  - name: snmp-alerts
    rules:
      - alert: SNMPDeviceDown
        expr: up{job="snmp-exporter"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "SNMP device {{ $labels.instance }} is unreachable"
          description: "SNMP device {{ $labels.instance }} has been unreachable for more than 2 minutes."

      - alert: HighInterfaceUtilization
        expr: (irate(ifHCInOctets[5m]) + irate(ifHCOutOctets[5m])) * 8 / ifHighSpeed > {{.InterfaceThreshold}}
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High interface utilization on {{ $labels.instance }}"
          description: "Interface {{ $labels.ifDescr }} utilization is above {{.InterfaceThreshold}}% for more than 5 minutes."

      - alert: InterfaceDown
        expr: ifOperStatus != 1
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Interface down on {{ $labels.instance }}"
          description: "Interface {{ $labels.ifDescr }} is down."`,
}

// CreateConfigDeploymentTask 创建配置部署任务
func (s *ConfigDeploymentService) CreateConfigDeploymentTask(hostIDs []uint, configType string, configData map[string]interface{}) (*ConfigDeploymentTask, error) {
	task := &ConfigDeploymentTask{
		ID:          fmt.Sprintf("config_deploy_%d", time.Now().Unix()),
		Name:        fmt.Sprintf("Deploy %s config to %d hosts", configType, len(hostIDs)),
		HostIDs:     hostIDs,
		ConfigType:  configType,
		ConfigFiles: make(map[string]string),
		Status:      "pending",
		Progress:    0,
		Results:     []ConfigDeployResult{},
	}

	// 生成配置文件
	var err error
	switch configType {
	case "monitoring":
		task.ConfigFiles, err = s.generateMonitoringConfigs(configData)
	case "alerting":
		task.ConfigFiles, err = s.generateAlertingConfigs(configData)
	case "snmp":
		task.ConfigFiles, err = s.generateSNMPConfigs(configData)
	default:
		return nil, fmt.Errorf("unsupported config type: %s", configType)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to generate configs: %v", err)
	}

	// 保存任务到 Redis
	taskKey := fmt.Sprintf("config_deployment_task:%s", task.ID)
	if err := s.redis.Set(context.Background(), taskKey, task, 24*time.Hour).Err(); err != nil {
		return nil, fmt.Errorf("failed to save deployment task: %v", err)
	}

	return task, nil
}

// ExecuteConfigDeployment 执行配置部署
func (s *ConfigDeploymentService) ExecuteConfigDeployment(taskID string) error {
	task, err := s.getConfigDeploymentTask(taskID)
	if err != nil {
		return err
	}

	// 更新任务状态
	task.Status = "running"
	now := time.Now()
	task.StartedAt = &now
	s.saveConfigDeploymentTask(task)

	// 异步执行部署
	go s.executeConfigDeploymentAsync(task)

	return nil
}

func (s *ConfigDeploymentService) executeConfigDeploymentAsync(task *ConfigDeploymentTask) {
	defer func() {
		// 任务完成时更新状态
		if task.Status == "running" {
			task.Status = "completed"
		}
		task.Progress = 100
		now := time.Now()
		task.CompletedAt = &now
		s.saveConfigDeploymentTask(task)
	}()

	totalHosts := len(task.HostIDs)
	processed := 0

	// 为每个主机部署配置
	for _, hostID := range task.HostIDs {
		result := s.deployConfigToHost(hostID, task.ConfigFiles)
		task.Results = append(task.Results, result)

		processed++
		task.Progress = int(float64(processed) / float64(totalHosts) * 100)
		s.saveConfigDeploymentTask(task)
	}

	// 检查是否有失败的部署
	failedCount := 0
	for _, result := range task.Results {
		if result.Status == "failed" {
			failedCount++
		}
	}

	if failedCount > 0 {
		task.Status = "completed_with_errors"
		task.Error = fmt.Sprintf("%d out of %d deployments failed", failedCount, totalHosts)
	}
}

func (s *ConfigDeploymentService) deployConfigToHost(hostID uint, configFiles map[string]string) ConfigDeployResult {
	result := ConfigDeployResult{
		HostID: hostID,
		Status: "failed",
	}

	// 获取主机信息
	host, err := s.hostService.GetHost(hostID)
	if err != nil {
		result.Message = fmt.Sprintf("Failed to get host info: %v", err)
		return result
	}

	result.HostIP = host.IP

	// 创建 SSH 连接
	client, err := s.hostService.createSSHClient(host.IP, host.Port, host.Username, host.Password, host.PrivateKey)
	if err != nil {
		result.Message = fmt.Sprintf("Failed to connect to host: %v", err)
		return result
	}
	defer client.Close()

	// 部署每个配置文件
	var deployedFiles []string
	for filename, content := range configFiles {
		remotePath := fmt.Sprintf("/opt/monitoring/config/%s", filename)
		
		// 创建目录
		dirCmd := fmt.Sprintf("sudo mkdir -p %s", "/opt/monitoring/config")
		if _, err := s.hostService.executeSSHCommand(client, dirCmd); err != nil {
			result.Message = fmt.Sprintf("Failed to create config directory: %v", err)
			return result
		}

		// 上传配置文件
		if err := s.uploadConfigFile(client, remotePath, content); err != nil {
			result.Message = fmt.Sprintf("Failed to upload %s: %v", filename, err)
			return result
		}

		deployedFiles = append(deployedFiles, remotePath)
	}

	result.Status = "success"
	result.Message = fmt.Sprintf("Successfully deployed %d config files", len(deployedFiles))
	result.FilePath = strings.Join(deployedFiles, ", ")

	return result
}

func (s *ConfigDeploymentService) uploadConfigFile(client *ssh.Client, remotePath, content string) error {
	session, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	// 使用 cat 命令写入文件
	cmd := fmt.Sprintf("sudo tee %s > /dev/null", remotePath)
	session.Stdin = strings.NewReader(content)
	
	return session.Run(cmd)
}

// 生成监控配置
func (s *ConfigDeploymentService) generateMonitoringConfigs(data map[string]interface{}) (map[string]string, error) {
	configs := make(map[string]string)

	for templateName, templateContent := range monitoringConfigTemplates {
		tmpl, err := template.New(templateName).Parse(templateContent)
		if err != nil {
			return nil, fmt.Errorf("failed to parse template %s: %v", templateName, err)
		}

		var buf bytes.Buffer
		if err := tmpl.Execute(&buf, data); err != nil {
			return nil, fmt.Errorf("failed to execute template %s: %v", templateName, err)
		}

		configs[templateName] = buf.String()
	}

	return configs, nil
}

// 生成告警配置
func (s *ConfigDeploymentService) generateAlertingConfigs(data map[string]interface{}) (map[string]string, error) {
	configs := make(map[string]string)

	// 生成告警管理器配置
	if tmpl, exists := monitoringConfigTemplates["alertmanager.yml"]; exists {
		t, err := template.New("alertmanager.yml").Parse(tmpl)
		if err != nil {
			return nil, fmt.Errorf("failed to parse alertmanager template: %v", err)
		}

		var buf bytes.Buffer
		if err := t.Execute(&buf, data); err != nil {
			return nil, fmt.Errorf("failed to execute alertmanager template: %v", err)
		}

		configs["alertmanager.yml"] = buf.String()
	}

	// 生成告警规则
	for ruleName, ruleContent := range alertRuleTemplates {
		tmpl, err := template.New(ruleName).Parse(ruleContent)
		if err != nil {
			return nil, fmt.Errorf("failed to parse rule template %s: %v", ruleName, err)
		}

		var buf bytes.Buffer
		if err := tmpl.Execute(&buf, data); err != nil {
			return nil, fmt.Errorf("failed to execute rule template %s: %v", ruleName, err)
		}

		configs[ruleName] = buf.String()
	}

	return configs, nil
}

// 生成SNMP配置
func (s *ConfigDeploymentService) generateSNMPConfigs(data map[string]interface{}) (map[string]string, error) {
	configs := make(map[string]string)

	// 生成SNMP exporter配置
	snmpConfig := `modules:
  if_mib:
    walk:
      - 1.3.6.1.2.1.2.2.1.2  # ifDescr
      - 1.3.6.1.2.1.2.2.1.8  # ifOperStatus
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
        type: gauge`

	configs["snmp.yml"] = snmpConfig

	return configs, nil
}

// 工具方法
func (s *ConfigDeploymentService) getConfigDeploymentTask(taskID string) (*ConfigDeploymentTask, error) {
	taskKey := fmt.Sprintf("config_deployment_task:%s", taskID)
	result, err := s.redis.Get(context.Background(), taskKey).Result()
	if err != nil {
		return nil, fmt.Errorf("task not found: %v", err)
	}

	var task ConfigDeploymentTask
	if err := s.redis.JSONGet(context.Background(), taskKey, ".", &task).Err(); err != nil {
		// 如果 JSON 操作失败，尝试简单的反序列化
		return nil, fmt.Errorf("failed to deserialize task: %v", err)
	}

	return &task, nil
}

func (s *ConfigDeploymentService) saveConfigDeploymentTask(task *ConfigDeploymentTask) error {
	taskKey := fmt.Sprintf("config_deployment_task:%s", task.ID)
	return s.redis.Set(context.Background(), taskKey, task, 24*time.Hour).Err()
}

// GetConfigDeploymentTask 获取配置部署任务
func (s *ConfigDeploymentService) GetConfigDeploymentTask(taskID string) (*ConfigDeploymentTask, error) {
	return s.getConfigDeploymentTask(taskID)
}

// GenerateConfigPreview 生成配置预览
func (s *ConfigDeploymentService) GenerateConfigPreview(configType string, data map[string]interface{}) (map[string]string, error) {
	switch configType {
	case "monitoring":
		return s.generateMonitoringConfigs(data)
	case "alerting":
		return s.generateAlertingConfigs(data)
	case "snmp":
		return s.generateSNMPConfigs(data)
	default:
		return nil, fmt.Errorf("unsupported config type: %s", configType)
	}
}