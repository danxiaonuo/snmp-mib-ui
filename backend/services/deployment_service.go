package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"text/template"
	"time"

	"github.com/go-redis/redis/v8"
	"golang.org/x/crypto/ssh"
	"gorm.io/gorm"

	"mib-platform/models"
)

type DeploymentService struct {
	db          *gorm.DB
	redis       *redis.Client
	hostService *HostService
}

func NewDeploymentService(db *gorm.DB, redis *redis.Client, hostService *HostService) *DeploymentService {
	return &DeploymentService{
		db:          db,
		redis:       redis,
		hostService: hostService,
	}
}

// 部署任务结构
type DeploymentTask struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	HostID      uint                   `json:"host_id"`
	Components  []ComponentDeployment  `json:"components"`
	Status      string                 `json:"status"` // pending, running, completed, failed
	Progress    int                    `json:"progress"`
	StartedAt   *time.Time             `json:"started_at"`
	CompletedAt *time.Time             `json:"completed_at"`
	Logs        []string               `json:"logs"`
	Error       string                 `json:"error,omitempty"`
}

type ComponentDeployment struct {
	Name         string            `json:"name"`
	Type         string            `json:"type"`
	Version      string            `json:"version"`
	Port         int               `json:"port"`
	Config       map[string]interface{} `json:"config"`
	Status       string            `json:"status"`
	DeployMethod string            `json:"deploy_method"` // docker, binary, systemd
}

// 组件模板定义
var componentTemplates = map[string]ComponentTemplate{
	"node-exporter": {
		Name:        "Node Exporter",
		Type:        "collector",
		DefaultPort: 9100,
		DockerImage: "prom/node-exporter:latest",
		BinaryURL:   "https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz",
		SystemdService: `[Unit]
Description=Node Exporter
After=network.target

[Service]
Type=simple
User=node_exporter
ExecStart=/usr/local/bin/node_exporter
Restart=always

[Install]
WantedBy=multi-user.target`,
		DockerCompose: `version: '3.8'
services:
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "{{.Port}}:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped`,
	},
	"snmp-exporter": {
		Name:        "SNMP Exporter",
		Type:        "collector",
		DefaultPort: 9116,
		DockerImage: "prom/snmp-exporter:latest",
		BinaryURL:   "https://github.com/prometheus/snmp_exporter/releases/download/v0.24.1/snmp_exporter-0.24.1.linux-amd64.tar.gz",
		SystemdService: `[Unit]
Description=SNMP Exporter
After=network.target

[Service]
Type=simple
User=snmp_exporter
ExecStart=/usr/local/bin/snmp_exporter --config.file=/etc/snmp_exporter/snmp.yml
Restart=always

[Install]
WantedBy=multi-user.target`,
		DockerCompose: `version: '3.8'
services:
  snmp-exporter:
    image: prom/snmp-exporter:latest
    container_name: snmp-exporter
    ports:
      - "{{.Port}}:9116"
    volumes:
      - ./snmp.yml:/etc/snmp_exporter/snmp.yml
    restart: unless-stopped`,
	},
	"categraf": {
		Name:        "Categraf",
		Type:        "collector",
		DefaultPort: 9100,
		DockerImage: "flashcatcloud/categraf:latest",
		BinaryURL:   "https://github.com/flashcatcloud/categraf/releases/download/v0.3.60/categraf-v0.3.60-linux-amd64.tar.gz",
		SystemdService: `[Unit]
Description=Categraf
After=network.target

[Service]
Type=simple
User=categraf
ExecStart=/usr/local/bin/categraf
WorkingDirectory=/etc/categraf
Restart=always

[Install]
WantedBy=multi-user.target`,
		DockerCompose: `version: '3.8'
services:
  categraf:
    image: flashcatcloud/categraf:latest
    container_name: categraf
    volumes:
      - ./categraf:/etc/categraf
    environment:
      - CAT_PROMETHEUS_REMOTE_WRITE_URL={{.RemoteWriteURL}}
    restart: unless-stopped`,
	},
	"grafana": {
		Name:        "Grafana",
		Type:        "visualization",
		DefaultPort: 3000,
		DockerImage: "grafana/grafana:latest",
		BinaryURL:   "https://dl.grafana.com/oss/release/grafana-10.2.3.linux-amd64.tar.gz",
		SystemdService: `[Unit]
Description=Grafana
After=network.target

[Service]
Type=simple
User=grafana
ExecStart=/usr/local/bin/grafana-server --config=/etc/grafana/grafana.ini
Restart=always

[Install]
WantedBy=multi-user.target`,
		DockerCompose: `version: '3.8'
services:
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "{{.Port}}:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD={{.AdminPassword}}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  grafana_data:`,
	},
	"victoriametrics": {
		Name:        "VictoriaMetrics",
		Type:        "storage",
		DefaultPort: 8428,
		DockerImage: "victoriametrics/victoria-metrics:latest",
		BinaryURL:   "https://github.com/VictoriaMetrics/VictoriaMetrics/releases/download/v1.96.0/victoria-metrics-linux-amd64-v1.96.0.tar.gz",
		SystemdService: `[Unit]
Description=VictoriaMetrics
After=network.target

[Service]
Type=simple
User=victoriametrics
ExecStart=/usr/local/bin/victoria-metrics-prod --storageDataPath=/var/lib/victoriametrics --httpListenAddr=:{{.Port}}
Restart=always

[Install]
WantedBy=multi-user.target`,
		DockerCompose: `version: '3.8'
services:
  victoriametrics:
    image: victoriametrics/victoria-metrics:latest
    container_name: victoriametrics
    ports:
      - "{{.Port}}:8428"
    volumes:
      - vm_data:/victoria-metrics-data
    command:
      - "--storageDataPath=/victoria-metrics-data"
      - "--httpListenAddr=:8428"
      - "--retentionPeriod=12"
    restart: unless-stopped

volumes:
  vm_data:`,
	},
}

type ComponentTemplate struct {
	Name           string
	Type           string
	DefaultPort    int
	DockerImage    string
	BinaryURL      string
	SystemdService string
	DockerCompose  string
}

// 创建部署任务
func (s *DeploymentService) CreateDeploymentTask(hostID uint, components []ComponentDeployment) (*DeploymentTask, error) {
	task := &DeploymentTask{
		ID:         fmt.Sprintf("deploy_%d_%d", hostID, time.Now().Unix()),
		Name:       fmt.Sprintf("Deploy to Host %d", hostID),
		HostID:     hostID,
		Components: components,
		Status:     "pending",
		Progress:   0,
		Logs:       []string{},
	}

	// 保存任务到 Redis
	taskKey := fmt.Sprintf("deployment_task:%s", task.ID)
	if err := s.redis.Set(context.Background(), taskKey, task, 24*time.Hour).Err(); err != nil {
		return nil, fmt.Errorf("failed to save deployment task: %v", err)
	}

	return task, nil
}

// 执行部署任务
func (s *DeploymentService) ExecuteDeployment(taskID string) error {
	// 获取任务
	task, err := s.getDeploymentTask(taskID)
	if err != nil {
		return err
	}

	// 更新任务状态
	task.Status = "running"
	now := time.Now()
	task.StartedAt = &now
	s.saveDeploymentTask(task)

	// 异步执行部署
	go s.executeDeploymentAsync(task)

	return nil
}

func (s *DeploymentService) executeDeploymentAsync(task *DeploymentTask) {
	defer func() {
		// 任务完成时更新状态
		if task.Status == "running" {
			task.Status = "completed"
		}
		task.Progress = 100
		now := time.Now()
		task.CompletedAt = &now
		s.saveDeploymentTask(task)
	}()

	// 获取主机信息
	host, err := s.hostService.GetHost(task.HostID)
	if err != nil {
		task.Status = "failed"
		task.Error = fmt.Sprintf("Failed to get host info: %v", err)
		s.addLog(task, fmt.Sprintf("ERROR: %s", task.Error))
		return
	}

	s.addLog(task, fmt.Sprintf("Starting deployment to host %s (%s)", host.Name, host.IP))

	// 创建 SSH 连接
	client, err := s.hostService.createSSHClient(host.IP, host.Port, host.Username, host.Password, host.PrivateKey)
	if err != nil {
		task.Status = "failed"
		task.Error = fmt.Sprintf("Failed to connect to host: %v", err)
		s.addLog(task, fmt.Sprintf("ERROR: %s", task.Error))
		return
	}
	defer client.Close()

	s.addLog(task, "SSH connection established")

	// 部署每个组件
	totalComponents := len(task.Components)
	for i, component := range task.Components {
		s.addLog(task, fmt.Sprintf("Deploying component %s (%d/%d)", component.Name, i+1, totalComponents))
		
		err := s.deployComponent(client, host, &component)
		if err != nil {
			task.Status = "failed"
			task.Error = fmt.Sprintf("Failed to deploy component %s: %v", component.Name, err)
			s.addLog(task, fmt.Sprintf("ERROR: %s", task.Error))
			return
		}

		component.Status = "deployed"
		task.Progress = int(float64(i+1) / float64(totalComponents) * 100)
		s.saveDeploymentTask(task)
		
		s.addLog(task, fmt.Sprintf("Component %s deployed successfully", component.Name))
	}

	s.addLog(task, "All components deployed successfully")
}

func (s *DeploymentService) deployComponent(client *ssh.Client, host *models.Host, component *ComponentDeployment) error {
	compTemplate, exists := componentTemplates[component.Name]
	if !exists {
		return fmt.Errorf("unknown component: %s", component.Name)
	}

	switch component.DeployMethod {
	case "docker":
		return s.deployWithDocker(client, host, component, compTemplate)
	case "binary":
		return s.deployWithBinary(client, host, component, compTemplate)
	case "systemd":
		return s.deployWithSystemd(client, host, component, compTemplate)
	default:
		return s.deployWithDocker(client, host, component, compTemplate) // 默认使用 Docker
	}
}

func (s *DeploymentService) deployWithDocker(client *ssh.Client, host *models.Host, component *ComponentDeployment, compTemplate ComponentTemplate) error {
	// 检查 Docker 是否安装
	_, err := s.hostService.executeSSHCommand(client, "docker --version")
	if err != nil {
		// 安装 Docker
		installScript := `
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker
`
		_, err = s.hostService.executeSSHCommand(client, installScript)
		if err != nil {
			return fmt.Errorf("failed to install Docker: %v", err)
		}
	}

	// 生成 Docker Compose 文件
	tmpl, err := template.New("docker-compose").Parse(compTemplate.DockerCompose)
	if err != nil {
		return fmt.Errorf("failed to parse docker-compose template: %v", err)
	}

	var buf bytes.Buffer
	data := map[string]interface{}{
		"Port":            component.Port,
		"AdminPassword":   "admin123",
		"RemoteWriteURL":  "http://victoriametrics:8428/api/v1/write",
	}
	
	// 合并组件配置
	for k, v := range component.Config {
		data[k] = v
	}

	if err := tmpl.Execute(&buf, data); err != nil {
		return fmt.Errorf("failed to execute docker-compose template: %v", err)
	}

	// 创建部署目录
	deployDir := fmt.Sprintf("/opt/monitoring/%s", component.Name)
	_, err = s.hostService.executeSSHCommand(client, fmt.Sprintf("sudo mkdir -p %s", deployDir))
	if err != nil {
		return fmt.Errorf("failed to create deploy directory: %v", err)
	}

	// 上传 Docker Compose 文件
	composeFile := fmt.Sprintf("%s/docker-compose.yml", deployDir)
	err = s.uploadFile(client, composeFile, buf.String())
	if err != nil {
		return fmt.Errorf("failed to upload docker-compose file: %v", err)
	}

	// 启动服务
	startCmd := fmt.Sprintf("cd %s && sudo docker-compose up -d", deployDir)
	_, err = s.hostService.executeSSHCommand(client, startCmd)
	if err != nil {
		return fmt.Errorf("failed to start service: %v", err)
	}

	return nil
}

func (s *DeploymentService) deployWithBinary(client *ssh.Client, host *models.Host, component *ComponentDeployment, compTemplate ComponentTemplate) error {
	// 下载二进制文件
	downloadCmd := fmt.Sprintf(`
cd /tmp
wget %s -O %s.tar.gz
tar -xzf %s.tar.gz
`, compTemplate.BinaryURL, component.Name, component.Name)

	_, err := s.hostService.executeSSHCommand(client, downloadCmd)
	if err != nil {
		return fmt.Errorf("failed to download binary: %v", err)
	}

	// 安装二进制文件
	installCmd := fmt.Sprintf(`
sudo cp /tmp/%s*/bin/%s /usr/local/bin/
sudo chmod +x /usr/local/bin/%s
sudo useradd --no-create-home --shell /bin/false %s || true
`, component.Name, component.Name, component.Name, component.Name)

	_, err = s.hostService.executeSSHCommand(client, installCmd)
	if err != nil {
		return fmt.Errorf("failed to install binary: %v", err)
	}

	// 创建 systemd 服务
	return s.createSystemdService(client, component, compTemplate)
}

func (s *DeploymentService) deployWithSystemd(client *ssh.Client, host *models.Host, component *ComponentDeployment, compTemplate ComponentTemplate) error {
	return s.createSystemdService(client, component, compTemplate)
}

func (s *DeploymentService) createSystemdService(client *ssh.Client, component *ComponentDeployment, compTemplate ComponentTemplate) error {
	// 生成 systemd 服务文件
	tmpl, err := template.New("systemd").Parse(compTemplate.SystemdService)
	if err != nil {
		return fmt.Errorf("failed to parse systemd template: %v", err)
	}

	var buf bytes.Buffer
	data := map[string]interface{}{
		"Port": component.Port,
	}
	
	// 合并组件配置
	for k, v := range component.Config {
		data[k] = v
	}

	if err := tmpl.Execute(&buf, data); err != nil {
		return fmt.Errorf("failed to execute systemd template: %v", err)
	}

	// 上传 systemd 服务文件
	serviceFile := fmt.Sprintf("/etc/systemd/system/%s.service", component.Name)
	err = s.uploadFile(client, serviceFile, buf.String())
	if err != nil {
		return fmt.Errorf("failed to upload systemd service file: %v", err)
	}

	// 启动服务
	startCmd := fmt.Sprintf(`
sudo systemctl daemon-reload
sudo systemctl enable %s
sudo systemctl start %s
`, component.Name, component.Name)

	_, err = s.hostService.executeSSHCommand(client, startCmd)
	if err != nil {
		return fmt.Errorf("failed to start systemd service: %v", err)
	}

	return nil
}

func (s *DeploymentService) uploadFile(client *ssh.Client, remotePath, content string) error {
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

// 工具方法

func (s *DeploymentService) getDeploymentTask(taskID string) (*DeploymentTask, error) {
	taskKey := fmt.Sprintf("deployment_task:%s", taskID)
	result, err := s.redis.Get(context.Background(), taskKey).Result()
	if err != nil {
		return nil, fmt.Errorf("task not found: %v", err)
	}

	var task DeploymentTask
	// 简单的 JSON 反序列化，不使用 JSONGet
	if err := json.Unmarshal([]byte(result), &task); err != nil {
		return nil, fmt.Errorf("failed to deserialize task: %v", err)
	}

	return &task, nil
}

func (s *DeploymentService) saveDeploymentTask(task *DeploymentTask) error {
	taskKey := fmt.Sprintf("deployment_task:%s", task.ID)
	return s.redis.Set(context.Background(), taskKey, task, 24*time.Hour).Err()
}

func (s *DeploymentService) addLog(task *DeploymentTask, message string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logEntry := fmt.Sprintf("[%s] %s", timestamp, message)
	task.Logs = append(task.Logs, logEntry)
	s.saveDeploymentTask(task)
}

// 获取部署任务状态
func (s *DeploymentService) GetDeploymentTask(taskID string) (*DeploymentTask, error) {
	return s.getDeploymentTask(taskID)
}

// 获取主机上的组件状态
func (s *DeploymentService) GetHostComponents(hostID uint) ([]models.HostComponent, error) {
	var components []models.HostComponent
	if err := s.db.Where("host_id = ?", hostID).Find(&components).Error; err != nil {
		return nil, err
	}
	return components, nil
}

// 检查组件状态
func (s *DeploymentService) CheckComponentStatus(hostID uint, componentName string) (string, error) {
	host, err := s.hostService.GetHost(hostID)
	if err != nil {
		return "unknown", err
	}

	client, err := s.hostService.createSSHClient(host.IP, host.Port, host.Username, host.Password, host.PrivateKey)
	if err != nil {
		return "offline", err
	}
	defer client.Close()

	// 检查 Docker 容器状态
	dockerCmd := fmt.Sprintf("docker ps --filter name=%s --format '{{.Status}}'", componentName)
	output, err := s.hostService.executeSSHCommand(client, dockerCmd)
	if err == nil && strings.Contains(output, "Up") {
		return "running", nil
	}

	// 检查 systemd 服务状态
	systemdCmd := fmt.Sprintf("systemctl is-active %s", componentName)
	output, err = s.hostService.executeSSHCommand(client, systemdCmd)
	if err == nil && strings.TrimSpace(output) == "active" {
		return "running", nil
	}

	return "stopped", nil
}

// 停止组件
func (s *DeploymentService) StopComponent(hostID uint, componentName string) error {
	host, err := s.hostService.GetHost(hostID)
	if err != nil {
		return err
	}

	client, err := s.hostService.createSSHClient(host.IP, host.Port, host.Username, host.Password, host.PrivateKey)
	if err != nil {
		return err
	}
	defer client.Close()

	// 尝试停止 Docker 容器
	dockerCmd := fmt.Sprintf("docker stop %s", componentName)
	s.hostService.executeSSHCommand(client, dockerCmd)

	// 尝试停止 systemd 服务
	systemdCmd := fmt.Sprintf("sudo systemctl stop %s", componentName)
	s.hostService.executeSSHCommand(client, systemdCmd)

	return nil
}

// 启动组件
func (s *DeploymentService) StartComponent(hostID uint, componentName string) error {
	host, err := s.hostService.GetHost(hostID)
	if err != nil {
		return err
	}

	client, err := s.hostService.createSSHClient(host.IP, host.Port, host.Username, host.Password, host.PrivateKey)
	if err != nil {
		return err
	}
	defer client.Close()

	// 尝试启动 Docker 容器
	dockerCmd := fmt.Sprintf("docker start %s", componentName)
	_, err1 := s.hostService.executeSSHCommand(client, dockerCmd)

	// 尝试启动 systemd 服务
	systemdCmd := fmt.Sprintf("sudo systemctl start %s", componentName)
	_, err2 := s.hostService.executeSSHCommand(client, systemdCmd)

	if err1 != nil && err2 != nil {
		return fmt.Errorf("failed to start component: docker error: %v, systemd error: %v", err1, err2)
	}

	return nil
}

// 卸载组件
func (s *DeploymentService) UninstallComponent(hostID uint, componentName string) error {
	host, err := s.hostService.GetHost(hostID)
	if err != nil {
		return err
	}

	client, err := s.hostService.createSSHClient(host.IP, host.Port, host.Username, host.Password, host.PrivateKey)
	if err != nil {
		return err
	}
	defer client.Close()

	// 停止并删除 Docker 容器
	dockerCmds := []string{
		fmt.Sprintf("docker stop %s", componentName),
		fmt.Sprintf("docker rm %s", componentName),
		fmt.Sprintf("docker rmi $(docker images --filter reference='*%s*' -q)", componentName),
	}

	for _, cmd := range dockerCmds {
		s.hostService.executeSSHCommand(client, cmd)
	}

	// 停止并禁用 systemd 服务
	systemdCmds := []string{
		fmt.Sprintf("sudo systemctl stop %s", componentName),
		fmt.Sprintf("sudo systemctl disable %s", componentName),
		fmt.Sprintf("sudo rm -f /etc/systemd/system/%s.service", componentName),
		"sudo systemctl daemon-reload",
	}

	for _, cmd := range systemdCmds {
		s.hostService.executeSSHCommand(client, cmd)
	}

	// 删除二进制文件和配置
	cleanupCmds := []string{
		fmt.Sprintf("sudo rm -f /usr/local/bin/%s", componentName),
		fmt.Sprintf("sudo rm -rf /opt/monitoring/%s", componentName),
		fmt.Sprintf("sudo userdel %s", componentName),
	}

	for _, cmd := range cleanupCmds {
		s.hostService.executeSSHCommand(client, cmd)
	}

	// 从数据库中删除组件记录
	return s.db.Where("host_id = ? AND component_name = ?", hostID, componentName).Delete(&models.HostComponent{}).Error
}