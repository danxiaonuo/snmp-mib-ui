package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-redis/redis/v8"
	"golang.org/x/crypto/ssh"
	"gorm.io/gorm"

	"mib-platform/models"
)

type ComponentVersionService struct {
	db          *gorm.DB
	redis       *redis.Client
	hostService *HostService
}

func NewComponentVersionService(db *gorm.DB, redis *redis.Client, hostService *HostService) *ComponentVersionService {
	return &ComponentVersionService{
		db:          db,
		redis:       redis,
		hostService: hostService,
	}
}

// ComponentVersionInfo 组件版本信息
type ComponentVersionInfo struct {
	Name           string    `json:"name"`
	CurrentVersion string    `json:"current_version"`
	TargetVersion  string    `json:"target_version"`
	Status         string    `json:"status"` // NOT_INSTALLED, SAME_VERSION, NEED_UPDATE, NEWER_VERSION, CORRUPTED
	Installed      bool      `json:"installed"`
	ServiceRunning bool      `json:"service_running"`
	ConfigBackup   bool      `json:"config_backup"`
	LastCheck      time.Time `json:"last_check"`
	UpgradeAction  string    `json:"upgrade_action"` // install, update, skip, downgrade, reinstall
}

// UpgradeStrategy 升级策略
type UpgradeStrategy struct {
	BackupConfig     bool   `json:"backup_config"`      // 是否备份配置
	BackupData       bool   `json:"backup_data"`        // 是否备份数据
	StopService      bool   `json:"stop_service"`       // 是否停止服务
	MigrateConfig    bool   `json:"migrate_config"`     // 是否迁移配置
	RollbackEnabled  bool   `json:"rollback_enabled"`   // 是否启用回滚
	UpgradeTimeout   int    `json:"upgrade_timeout"`    // 升级超时时间（秒）
	HealthCheckDelay int    `json:"health_check_delay"` // 健康检查延迟（秒）
}

// ComponentUpgradeTask 组件升级任务
type ComponentUpgradeTask struct {
	ID              string                  `json:"id"`
	HostID          uint                    `json:"host_id"`
	ComponentName   string                  `json:"component_name"`
	FromVersion     string                  `json:"from_version"`
	ToVersion       string                  `json:"to_version"`
	Strategy        UpgradeStrategy         `json:"strategy"`
	Status          string                  `json:"status"` // pending, running, completed, failed, rolled_back
	Progress        int                     `json:"progress"`
	Steps           []UpgradeStep           `json:"steps"`
	BackupPaths     map[string]string       `json:"backup_paths"`
	StartedAt       *time.Time              `json:"started_at"`
	CompletedAt     *time.Time              `json:"completed_at"`
	Logs            []string                `json:"logs"`
	Error           string                  `json:"error,omitempty"`
}

type UpgradeStep struct {
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Status      string    `json:"status"` // pending, running, completed, failed, skipped
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Output      string    `json:"output"`
	Error       string    `json:"error,omitempty"`
}

// CheckComponentVersion 检查组件版本
func (s *ComponentVersionService) CheckComponentVersion(hostID uint, componentName string, targetVersion string) (*ComponentVersionInfo, error) {
	host, err := s.hostService.GetHost(hostID)
	if err != nil {
		return nil, err
	}

	client, err := s.hostService.createSSHClient(host.IP, host.Port, host.Username, host.Password, host.PrivateKey)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	info := &ComponentVersionInfo{
		Name:          componentName,
		TargetVersion: targetVersion,
		LastCheck:     time.Now(),
	}

	// 检查组件是否已安装
	currentVersion, installed, err := s.detectInstalledVersion(client, componentName)
	if err != nil {
		info.Status = "CORRUPTED"
		info.Installed = false
		return info, nil
	}

	info.CurrentVersion = currentVersion
	info.Installed = installed

	if !installed {
		info.Status = "NOT_INSTALLED"
		info.UpgradeAction = "install"
		return info, nil
	}

	// 检查服务运行状态
	info.ServiceRunning = s.checkServiceRunning(client, componentName)

	// 检查配置备份状态
	info.ConfigBackup = s.checkConfigBackup(client, componentName)

	// 比较版本
	versionComparison := s.compareVersions(currentVersion, targetVersion)
	switch versionComparison {
	case 0: // 相同版本
		info.Status = "SAME_VERSION"
		info.UpgradeAction = "skip"
	case -1: // 当前版本较低，需要更新
		info.Status = "NEED_UPDATE"
		info.UpgradeAction = "update"
	case 1: // 当前版本较高
		info.Status = "NEWER_VERSION"
		info.UpgradeAction = "downgrade"
	}

	return info, nil
}

// detectInstalledVersion 检测已安装的组件版本
func (s *ComponentVersionService) detectInstalledVersion(client *ssh.Client, componentName string) (string, bool, error) {
	// 检查 Docker 容器版本
	if version, found := s.checkDockerVersion(client, componentName); found {
		return version, true, nil
	}

	// 检查二进制文件版本
	if version, found := s.checkBinaryVersion(client, componentName); found {
		return version, true, nil
	}

	// 检查 systemd 服务版本
	if version, found := s.checkSystemdVersion(client, componentName); found {
		return version, true, nil
	}

	return "", false, nil
}

// checkDockerVersion 检查 Docker 容器版本
func (s *ComponentVersionService) checkDockerVersion(client *ssh.Client, componentName string) (string, bool) {
	// 检查容器是否存在
	cmd := fmt.Sprintf("docker inspect %s --format='{{.Config.Image}}' 2>/dev/null", componentName)
	output, err := s.hostService.executeSSHCommand(client, cmd)
	if err != nil {
		return "", false
	}

	// 从镜像名称中提取版本
	imageParts := strings.Split(strings.TrimSpace(output), ":")
	if len(imageParts) >= 2 {
		version := imageParts[len(imageParts)-1]
		if version != "latest" {
			return version, true
		}
	}

	// 如果是 latest 标签，尝试获取实际版本
	cmd = fmt.Sprintf("docker exec %s %s --version 2>/dev/null || docker exec %s %s -version 2>/dev/null", 
		componentName, componentName, componentName, componentName)
	output, err = s.hostService.executeSSHCommand(client, cmd)
	if err == nil {
		if version := s.extractVersionFromOutput(output); version != "" {
			return version, true
		}
	}

	return "latest", true
}

// checkBinaryVersion 检查二进制文件版本
func (s *ComponentVersionService) checkBinaryVersion(client *ssh.Client, componentName string) (string, bool) {
	// 检查二进制文件是否存在
	cmd := fmt.Sprintf("which %s", componentName)
	_, err := s.hostService.executeSSHCommand(client, cmd)
	if err != nil {
		return "", false
	}

	// 尝试获取版本信息
	versionCmds := []string{
		fmt.Sprintf("%s --version", componentName),
		fmt.Sprintf("%s -version", componentName),
		fmt.Sprintf("%s version", componentName),
	}

	for _, cmd := range versionCmds {
		output, err := s.hostService.executeSSHCommand(client, cmd)
		if err == nil {
			if version := s.extractVersionFromOutput(output); version != "" {
				return version, true
			}
		}
	}

	return "unknown", true
}

// checkSystemdVersion 检查 systemd 服务版本
func (s *ComponentVersionService) checkSystemdVersion(client *ssh.Client, componentName string) (string, bool) {
	// 检查服务文件是否存在
	cmd := fmt.Sprintf("systemctl list-unit-files %s.service", componentName)
	output, err := s.hostService.executeSSHCommand(client, cmd)
	if err != nil || !strings.Contains(output, componentName) {
		return "", false
	}

	// 从服务描述或执行文件中获取版本
	cmd = fmt.Sprintf("systemctl show %s --property=ExecStart", componentName)
	output, err = s.hostService.executeSSHCommand(client, cmd)
	if err == nil {
		// 提取可执行文件路径
		if strings.Contains(output, "ExecStart=") {
			execPath := strings.TrimPrefix(output, "ExecStart=")
			execPath = strings.Fields(execPath)[0]
			
			// 尝试获取版本
			cmd = fmt.Sprintf("%s --version 2>/dev/null || %s -version 2>/dev/null", execPath, execPath)
			versionOutput, err := s.hostService.executeSSHCommand(client, cmd)
			if err == nil {
				if version := s.extractVersionFromOutput(versionOutput); version != "" {
					return version, true
				}
			}
		}
	}

	return "unknown", true
}

// extractVersionFromOutput 从输出中提取版本号
func (s *ComponentVersionService) extractVersionFromOutput(output string) string {
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		
		// 常见的版本格式匹配
		patterns := []string{
			`version\s+(\d+\.\d+\.\d+)`,
			`v(\d+\.\d+\.\d+)`,
			`(\d+\.\d+\.\d+)`,
		}
		
		for _, pattern := range patterns {
			if matches := regexp.MustCompile(pattern).FindStringSubmatch(strings.ToLower(line)); len(matches) > 1 {
				return matches[1]
			}
		}
	}
	
	return ""
}

// checkServiceRunning 检查服务是否运行
func (s *ComponentVersionService) checkServiceRunning(client *ssh.Client, componentName string) bool {
	// 检查 Docker 容器
	cmd := fmt.Sprintf("docker ps --filter name=%s --format '{{.Status}}'", componentName)
	output, err := s.hostService.executeSSHCommand(client, cmd)
	if err == nil && strings.Contains(output, "Up") {
		return true
	}

	// 检查 systemd 服务
	cmd = fmt.Sprintf("systemctl is-active %s", componentName)
	output, err = s.hostService.executeSSHCommand(client, cmd)
	if err == nil && strings.TrimSpace(output) == "active" {
		return true
	}

	return false
}

// checkConfigBackup 检查配置备份状态
func (s *ComponentVersionService) checkConfigBackup(client *ssh.Client, componentName string) bool {
	backupDir := fmt.Sprintf("/opt/monitoring/backups/%s", componentName)
	cmd := fmt.Sprintf("test -d %s && ls %s | wc -l", backupDir, backupDir)
	output, err := s.hostService.executeSSHCommand(client, cmd)
	if err == nil {
		count := strings.TrimSpace(output)
		return count != "0"
	}
	return false
}

// compareVersions 比较版本号
func (s *ComponentVersionService) compareVersions(version1, version2 string) int {
	// 简化的版本比较，实际应该使用更复杂的语义版本比较
	v1Parts := strings.Split(version1, ".")
	v2Parts := strings.Split(version2, ".")
	
	maxLen := len(v1Parts)
	if len(v2Parts) > maxLen {
		maxLen = len(v2Parts)
	}
	
	for i := 0; i < maxLen; i++ {
		var v1Part, v2Part int
		if i < len(v1Parts) {
			fmt.Sscanf(v1Parts[i], "%d", &v1Part)
		}
		if i < len(v2Parts) {
			fmt.Sscanf(v2Parts[i], "%d", &v2Part)
		}
		
		if v1Part < v2Part {
			return -1
		} else if v1Part > v2Part {
			return 1
		}
	}
	
	return 0
}

// CreateUpgradeTask 创建升级任务
func (s *ComponentVersionService) CreateUpgradeTask(hostID uint, componentName, fromVersion, toVersion string, strategy UpgradeStrategy) (*ComponentUpgradeTask, error) {
	task := &ComponentUpgradeTask{
		ID:            fmt.Sprintf("upgrade_%s_%d_%d", componentName, hostID, time.Now().Unix()),
		HostID:        hostID,
		ComponentName: componentName,
		FromVersion:   fromVersion,
		ToVersion:     toVersion,
		Strategy:      strategy,
		Status:        "pending",
		Progress:      0,
		BackupPaths:   make(map[string]string),
		Logs:          []string{},
	}

	// 定义升级步骤
	task.Steps = s.generateUpgradeSteps(componentName, fromVersion, toVersion, strategy)

	// 保存任务到 Redis
	taskKey := fmt.Sprintf("upgrade_task:%s", task.ID)
	if err := s.redis.Set(context.Background(), taskKey, task, 24*time.Hour).Err(); err != nil {
		return nil, fmt.Errorf("failed to save upgrade task: %v", err)
	}

	return task, nil
}

// generateUpgradeSteps 生成升级步骤
func (s *ComponentVersionService) generateUpgradeSteps(componentName, fromVersion, toVersion string, strategy UpgradeStrategy) []UpgradeStep {
	var steps []UpgradeStep

	// 预检查步骤
	steps = append(steps, UpgradeStep{
		Name:        "pre_check",
		Description: "执行升级前检查",
		Status:      "pending",
	})

	// 备份步骤
	if strategy.BackupConfig {
		steps = append(steps, UpgradeStep{
			Name:        "backup_config",
			Description: "备份配置文件",
			Status:      "pending",
		})
	}

	if strategy.BackupData {
		steps = append(steps, UpgradeStep{
			Name:        "backup_data",
			Description: "备份数据文件",
			Status:      "pending",
		})
	}

	// 停止服务步骤
	if strategy.StopService {
		steps = append(steps, UpgradeStep{
			Name:        "stop_service",
			Description: "停止当前服务",
			Status:      "pending",
		})
	}

	// 升级步骤
	steps = append(steps, UpgradeStep{
		Name:        "upgrade_component",
		Description: fmt.Sprintf("升级组件从 %s 到 %s", fromVersion, toVersion),
		Status:      "pending",
	})

	// 配置迁移步骤
	if strategy.MigrateConfig {
		steps = append(steps, UpgradeStep{
			Name:        "migrate_config",
			Description: "迁移配置文件",
			Status:      "pending",
		})
	}

	// 启动服务步骤
	steps = append(steps, UpgradeStep{
		Name:        "start_service",
		Description: "启动升级后的服务",
		Status:      "pending",
	})

	// 健康检查步骤
	steps = append(steps, UpgradeStep{
		Name:        "health_check",
		Description: "执行健康检查",
		Status:      "pending",
	})

	// 后检查步骤
	steps = append(steps, UpgradeStep{
		Name:        "post_check",
		Description: "执行升级后检查",
		Status:      "pending",
	})

	return steps
}

// ExecuteUpgrade 执行升级
func (s *ComponentVersionService) ExecuteUpgrade(taskID string) error {
	task, err := s.getUpgradeTask(taskID)
	if err != nil {
		return err
	}

	// 更新任务状态
	task.Status = "running"
	now := time.Now()
	task.StartedAt = &now
	s.saveUpgradeTask(task)

	// 异步执行升级
	go s.executeUpgradeAsync(task)

	return nil
}

// executeUpgradeAsync 异步执行升级
func (s *ComponentVersionService) executeUpgradeAsync(task *ComponentUpgradeTask) {
	defer func() {
		if task.Status == "running" {
			task.Status = "completed"
		}
		task.Progress = 100
		now := time.Now()
		task.CompletedAt = &now
		s.saveUpgradeTask(task)
	}()

	// 获取主机信息
	host, err := s.hostService.GetHost(task.HostID)
	if err != nil {
		task.Status = "failed"
		task.Error = fmt.Sprintf("Failed to get host info: %v", err)
		s.addUpgradeLog(task, fmt.Sprintf("ERROR: %s", task.Error))
		return
	}

	// 创建 SSH 连接
	client, err := s.hostService.createSSHClient(host.IP, host.Port, host.Username, host.Password, host.PrivateKey)
	if err != nil {
		task.Status = "failed"
		task.Error = fmt.Sprintf("Failed to connect to host: %v", err)
		s.addUpgradeLog(task, fmt.Sprintf("ERROR: %s", task.Error))
		return
	}
	defer client.Close()

	s.addUpgradeLog(task, fmt.Sprintf("Starting upgrade of %s from %s to %s", task.ComponentName, task.FromVersion, task.ToVersion))

	// 执行每个步骤
	totalSteps := len(task.Steps)
	for i := range task.Steps {
		step := &task.Steps[i]
		s.addUpgradeLog(task, fmt.Sprintf("Executing step: %s", step.Description))
		
		step.Status = "running"
		step.StartTime = time.Now()
		s.saveUpgradeTask(task)

		err := s.executeUpgradeStep(client, task, step)
		step.EndTime = time.Now()
		
		if err != nil {
			step.Status = "failed"
			step.Error = err.Error()
			task.Status = "failed"
			task.Error = fmt.Sprintf("Step %s failed: %v", step.Name, err)
			s.addUpgradeLog(task, fmt.Sprintf("ERROR: %s", task.Error))
			
			// 如果启用了回滚，尝试回滚
			if task.Strategy.RollbackEnabled {
				s.addUpgradeLog(task, "Starting rollback...")
				s.rollbackUpgrade(client, task)
			}
			return
		}

		step.Status = "completed"
		task.Progress = int(float64(i+1) / float64(totalSteps) * 100)
		s.saveUpgradeTask(task)
		
		s.addUpgradeLog(task, fmt.Sprintf("Step %s completed successfully", step.Name))
	}

	s.addUpgradeLog(task, "Upgrade completed successfully")
}

// executeUpgradeStep 执行升级步骤
func (s *ComponentVersionService) executeUpgradeStep(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	switch step.Name {
	case "pre_check":
		return s.executePreCheck(client, task, step)
	case "backup_config":
		return s.executeBackupConfig(client, task, step)
	case "backup_data":
		return s.executeBackupData(client, task, step)
	case "stop_service":
		return s.executeStopService(client, task, step)
	case "upgrade_component":
		return s.executeUpgradeComponent(client, task, step)
	case "migrate_config":
		return s.executeMigrateConfig(client, task, step)
	case "start_service":
		return s.executeStartService(client, task, step)
	case "health_check":
		return s.executeHealthCheck(client, task, step)
	case "post_check":
		return s.executePostCheck(client, task, step)
	default:
		return fmt.Errorf("unknown step: %s", step.Name)
	}
}

// executePreCheck 执行升级前检查
func (s *ComponentVersionService) executePreCheck(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	// 检查磁盘空间
	output, err := s.hostService.executeSSHCommand(client, "df -h / | tail -1 | awk '{print $5}' | sed 's/%//'")
	if err != nil {
		return fmt.Errorf("failed to check disk space: %v", err)
	}
	
	diskUsage := strings.TrimSpace(output)
	if usage, err := strconv.Atoi(diskUsage); err == nil && usage > 90 {
		return fmt.Errorf("insufficient disk space: %d%% used", usage)
	}
	
	// 检查内存
	output, err = s.hostService.executeSSHCommand(client, "free | grep Mem | awk '{print ($3/$2) * 100.0}'")
	if err != nil {
		return fmt.Errorf("failed to check memory: %v", err)
	}
	
	step.Output = fmt.Sprintf("Disk usage: %s%%, Memory check passed", diskUsage)
	return nil
}

// executeBackupConfig 备份配置文件
func (s *ComponentVersionService) executeBackupConfig(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	timestamp := time.Now().Format("20060102_150405")
	backupDir := fmt.Sprintf("/opt/monitoring/backups/%s/%s", task.ComponentName, timestamp)
	
	// 创建备份目录
	cmd := fmt.Sprintf("mkdir -p %s", backupDir)
	if _, err := s.hostService.executeSSHCommand(client, cmd); err != nil {
		return fmt.Errorf("failed to create backup directory: %v", err)
	}
	
	// 根据组件类型备份不同的配置文件
	configPaths := s.getComponentConfigPaths(task.ComponentName)
	for _, configPath := range configPaths {
		cmd = fmt.Sprintf("test -f %s && cp %s %s/ || echo 'Config file %s not found'", 
			configPath, configPath, backupDir, configPath)
		output, err := s.hostService.executeSSHCommand(client, cmd)
		if err != nil {
			return fmt.Errorf("failed to backup config %s: %v", configPath, err)
		}
		step.Output += fmt.Sprintf("Backup: %s\n", output)
	}
	
	task.BackupPaths["config"] = backupDir
	return nil
}

// executeBackupData 备份数据文件
func (s *ComponentVersionService) executeBackupData(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	timestamp := time.Now().Format("20060102_150405")
	backupDir := fmt.Sprintf("/opt/monitoring/backups/%s/%s", task.ComponentName, timestamp)
	
	// 根据组件类型备份数据
	dataPaths := s.getComponentDataPaths(task.ComponentName)
	for _, dataPath := range dataPaths {
		cmd := fmt.Sprintf("test -d %s && tar -czf %s/%s_data.tar.gz -C %s . || echo 'Data path %s not found'", 
			dataPath, backupDir, task.ComponentName, dataPath, dataPath)
		output, err := s.hostService.executeSSHCommand(client, cmd)
		if err != nil {
			return fmt.Errorf("failed to backup data %s: %v", dataPath, err)
		}
		step.Output += fmt.Sprintf("Data backup: %s\n", output)
	}
	
	task.BackupPaths["data"] = backupDir
	return nil
}

// executeStopService 停止服务
func (s *ComponentVersionService) executeStopService(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	// 尝试停止 Docker 容器
	cmd := fmt.Sprintf("docker stop %s 2>/dev/null || true", task.ComponentName)
	output, err := s.hostService.executeSSHCommand(client, cmd)
	if err == nil {
		step.Output += fmt.Sprintf("Docker container stopped: %s\n", output)
	}
	
	// 尝试停止 systemd 服务
	cmd = fmt.Sprintf("systemctl stop %s 2>/dev/null || true", task.ComponentName)
	output, err = s.hostService.executeSSHCommand(client, cmd)
	if err == nil {
		step.Output += fmt.Sprintf("Systemd service stopped: %s\n", output)
	}
	
	// 等待服务完全停止
	time.Sleep(5 * time.Second)
	
	// 验证服务已停止
	if s.checkServiceRunning(client, task.ComponentName) {
		return fmt.Errorf("service %s is still running after stop command", task.ComponentName)
	}
	
	return nil
}

// executeUpgradeComponent 执行组件升级
func (s *ComponentVersionService) executeUpgradeComponent(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	switch {
	case s.isDockerComponent(task.ComponentName):
		return s.upgradeDockerComponent(client, task, step)
	case s.isBinaryComponent(task.ComponentName):
		return s.upgradeBinaryComponent(client, task, step)
	case s.isSystemdComponent(task.ComponentName):
		return s.upgradeSystemdComponent(client, task, step)
	default:
		return fmt.Errorf("unknown component type for %s", task.ComponentName)
	}
}

// upgradeDockerComponent 升级 Docker 组件
func (s *ComponentVersionService) upgradeDockerComponent(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	// 拉取新版本镜像
	imageName := s.getComponentImageName(task.ComponentName, task.ToVersion)
	cmd := fmt.Sprintf("docker pull %s", imageName)
	output, err := s.hostService.executeSSHCommand(client, cmd)
	if err != nil {
		return fmt.Errorf("failed to pull image %s: %v", imageName, err)
	}
	step.Output += fmt.Sprintf("Image pulled: %s\n", output)
	
	// 删除旧容器
	cmd = fmt.Sprintf("docker rm %s 2>/dev/null || true", task.ComponentName)
	output, err = s.hostService.executeSSHCommand(client, cmd)
	step.Output += fmt.Sprintf("Old container removed: %s\n", output)
	
	// 使用新镜像创建容器
	createCmd := s.generateDockerCreateCommand(task.ComponentName, imageName)
	output, err = s.hostService.executeSSHCommand(client, createCmd)
	if err != nil {
		return fmt.Errorf("failed to create new container: %v", err)
	}
	step.Output += fmt.Sprintf("New container created: %s\n", output)
	
	return nil
}

// upgradeBinaryComponent 升级二进制组件
func (s *ComponentVersionService) upgradeBinaryComponent(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	// 下载新版本二进制文件
	downloadURL := s.getComponentDownloadURL(task.ComponentName, task.ToVersion)
	tempPath := fmt.Sprintf("/tmp/%s_%s", task.ComponentName, task.ToVersion)
	
	cmd := fmt.Sprintf("wget -O %s %s", tempPath, downloadURL)
	output, err := s.hostService.executeSSHCommand(client, cmd)
	if err != nil {
		return fmt.Errorf("failed to download binary: %v", err)
	}
	step.Output += fmt.Sprintf("Binary downloaded: %s\n", output)
	
	// 备份当前二进制文件
	currentPath := s.getComponentBinaryPath(task.ComponentName)
	backupPath := fmt.Sprintf("%s.backup_%s", currentPath, time.Now().Format("20060102_150405"))
	cmd = fmt.Sprintf("cp %s %s", currentPath, backupPath)
	s.hostService.executeSSHCommand(client, cmd)
	
	// 替换二进制文件
	cmd = fmt.Sprintf("chmod +x %s && mv %s %s", tempPath, tempPath, currentPath)
	output, err = s.hostService.executeSSHCommand(client, cmd)
	if err != nil {
		return fmt.Errorf("failed to replace binary: %v", err)
	}
	step.Output += fmt.Sprintf("Binary replaced: %s\n", output)
	
	return nil
}

// upgradeSystemdComponent 升级 systemd 组件
func (s *ComponentVersionService) upgradeSystemdComponent(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	// 先升级二进制文件
	if err := s.upgradeBinaryComponent(client, task, step); err != nil {
		return err
	}
	
	// 重新加载 systemd
	cmd := "systemctl daemon-reload"
	output, err := s.hostService.executeSSHCommand(client, cmd)
	if err != nil {
		return fmt.Errorf("failed to reload systemd: %v", err)
	}
	step.Output += fmt.Sprintf("Systemd reloaded: %s\n", output)
	
	return nil
}

// executeMigrateConfig 迁移配置文件
func (s *ComponentVersionService) executeMigrateConfig(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	// 根据组件和版本执行配置迁移
	migrationScript := s.getConfigMigrationScript(task.ComponentName, task.FromVersion, task.ToVersion)
	if migrationScript == "" {
		step.Output = "No config migration needed"
		return nil
	}
	
	output, err := s.hostService.executeSSHCommand(client, migrationScript)
	if err != nil {
		return fmt.Errorf("config migration failed: %v", err)
	}
	
	step.Output = fmt.Sprintf("Config migrated: %s", output)
	return nil
}

// executeStartService 启动服务
func (s *ComponentVersionService) executeStartService(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	// 尝试启动 Docker 容器
	cmd := fmt.Sprintf("docker start %s 2>/dev/null || true", task.ComponentName)
	output, err := s.hostService.executeSSHCommand(client, cmd)
	if err == nil && strings.Contains(output, task.ComponentName) {
		step.Output += fmt.Sprintf("Docker container started: %s\n", output)
		return nil
	}
	
	// 尝试启动 systemd 服务
	cmd = fmt.Sprintf("systemctl start %s", task.ComponentName)
	output, err = s.hostService.executeSSHCommand(client, cmd)
	if err != nil {
		return fmt.Errorf("failed to start service: %v", err)
	}
	
	step.Output += fmt.Sprintf("Systemd service started: %s\n", output)
	return nil
}

// executeHealthCheck 执行健康检查
func (s *ComponentVersionService) executeHealthCheck(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	// 等待服务启动
	time.Sleep(time.Duration(task.Strategy.HealthCheckDelay) * time.Second)
	
	// 检查服务是否运行
	if !s.checkServiceRunning(client, task.ComponentName) {
		return fmt.Errorf("service %s is not running after start", task.ComponentName)
	}
	
	// 执行组件特定的健康检查
	healthCmd := s.getComponentHealthCheckCommand(task.ComponentName)
	if healthCmd != "" {
		output, err := s.hostService.executeSSHCommand(client, healthCmd)
		if err != nil {
			return fmt.Errorf("health check failed: %v", err)
		}
		step.Output += fmt.Sprintf("Health check passed: %s\n", output)
	}
	
	// 验证版本
	newVersion, _, err := s.detectInstalledVersion(client, task.ComponentName)
	if err != nil {
		return fmt.Errorf("failed to verify new version: %v", err)
	}
	
	if newVersion != task.ToVersion {
		return fmt.Errorf("version mismatch: expected %s, got %s", task.ToVersion, newVersion)
	}
	
	step.Output += fmt.Sprintf("Version verified: %s", newVersion)
	return nil
}

// executePostCheck 执行升级后检查
func (s *ComponentVersionService) executePostCheck(client *ssh.Client, task *ComponentUpgradeTask, step *UpgradeStep) error {
	// 检查服务状态
	if !s.checkServiceRunning(client, task.ComponentName) {
		return fmt.Errorf("service is not running after upgrade")
	}
	
	// 检查日志中是否有错误
	logCmd := s.getComponentLogCommand(task.ComponentName)
	if logCmd != "" {
		output, err := s.hostService.executeSSHCommand(client, logCmd)
		if err == nil {
			if strings.Contains(strings.ToLower(output), "error") || strings.Contains(strings.ToLower(output), "fatal") {
				step.Output += fmt.Sprintf("Warning: Found errors in logs: %s\n", output)
			} else {
				step.Output += "No errors found in logs\n"
			}
		}
	}
	
	// 清理临时文件
	cleanupCmd := fmt.Sprintf("rm -f /tmp/%s_* 2>/dev/null || true", task.ComponentName)
	s.hostService.executeSSHCommand(client, cleanupCmd)
	
	step.Output += "Post-upgrade check completed successfully"
	return nil
}

// rollbackUpgrade 回滚升级
func (s *ComponentVersionService) rollbackUpgrade(client *ssh.Client, task *ComponentUpgradeTask) {
	s.addUpgradeLog(task, "Starting rollback process...")
	
	// 停止当前服务
	s.executeStopService(client, task, &UpgradeStep{})
	
	// 恢复配置文件
	if configBackupPath, exists := task.BackupPaths["config"]; exists {
		cmd := fmt.Sprintf("cp -r %s/* /etc/%s/ 2>/dev/null || true", configBackupPath, task.ComponentName)
		s.hostService.executeSSHCommand(client, cmd)
		s.addUpgradeLog(task, "Config files restored from backup")
	}
	
	// 恢复二进制文件
	binaryPath := s.getComponentBinaryPath(task.ComponentName)
	backupPattern := fmt.Sprintf("%s.backup_*", binaryPath)
	cmd := fmt.Sprintf("ls -t %s 2>/dev/null | head -1", backupPattern)
	if output, err := s.hostService.executeSSHCommand(client, cmd); err == nil && strings.TrimSpace(output) != "" {
		latestBackup := strings.TrimSpace(output)
		cmd = fmt.Sprintf("cp %s %s", latestBackup, binaryPath)
		s.hostService.executeSSHCommand(client, cmd)
		s.addUpgradeLog(task, "Binary file restored from backup")
	}
	
	// 重启服务
	s.executeStartService(client, task, &UpgradeStep{})
	
	task.Status = "rolled_back"
	s.addUpgradeLog(task, "Rollback completed")
}

// 工具方法
func (s *ComponentVersionService) getUpgradeTask(taskID string) (*ComponentUpgradeTask, error) {
	taskKey := fmt.Sprintf("upgrade_task:%s", taskID)
	result, err := s.redis.Get(context.Background(), taskKey).Result()
	if err != nil {
		return nil, fmt.Errorf("task not found: %v", err)
	}

	var task ComponentUpgradeTask
	if err := json.Unmarshal([]byte(result), &task); err != nil {
		return nil, fmt.Errorf("failed to deserialize task: %v", err)
	}

	return &task, nil
}

func (s *ComponentVersionService) saveUpgradeTask(task *ComponentUpgradeTask) error {
	taskKey := fmt.Sprintf("upgrade_task:%s", task.ID)
	return s.redis.Set(context.Background(), taskKey, task, 24*time.Hour).Err()
}

func (s *ComponentVersionService) addUpgradeLog(task *ComponentUpgradeTask, message string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logEntry := fmt.Sprintf("[%s] %s", timestamp, message)
	task.Logs = append(task.Logs, logEntry)
	s.saveUpgradeTask(task)
}

// 组件配置和辅助方法

// getComponentConfigPaths 获取组件配置文件路径
func (s *ComponentVersionService) getComponentConfigPaths(componentName string) []string {
	configMap := map[string][]string{
		"prometheus":     {"/etc/prometheus/prometheus.yml", "/etc/prometheus/rules/*.yml"},
		"grafana":        {"/etc/grafana/grafana.ini", "/var/lib/grafana/grafana.db"},
		"victoriametrics": {"/etc/victoriametrics/config.yml"},
		"alertmanager":   {"/etc/alertmanager/alertmanager.yml"},
		"node-exporter":  {"/etc/node-exporter/config.yml"},
		"categraf":       {"/etc/categraf/conf/*.toml"},
		"snmp-exporter":  {"/etc/snmp-exporter/snmp.yml"},
		"vmagent":        {"/etc/vmagent/config.yml"},
		"vmalert":        {"/etc/vmalert/config.yml"},
	}
	
	if paths, exists := configMap[componentName]; exists {
		return paths
	}
	return []string{fmt.Sprintf("/etc/%s/config.yml", componentName)}
}

// getComponentDataPaths 获取组件数据文件路径
func (s *ComponentVersionService) getComponentDataPaths(componentName string) []string {
	dataMap := map[string][]string{
		"prometheus":     {"/var/lib/prometheus"},
		"grafana":        {"/var/lib/grafana"},
		"victoriametrics": {"/var/lib/victoriametrics"},
		"alertmanager":   {"/var/lib/alertmanager"},
	}
	
	if paths, exists := dataMap[componentName]; exists {
		return paths
	}
	return []string{fmt.Sprintf("/var/lib/%s", componentName)}
}

// isDockerComponent 判断是否为 Docker 组件
func (s *ComponentVersionService) isDockerComponent(componentName string) bool {
	dockerComponents := []string{
		"prometheus", "grafana", "victoriametrics", "alertmanager",
		"vmagent", "vmalert", "snmp-exporter",
	}
	
	for _, comp := range dockerComponents {
		if comp == componentName {
			return true
		}
	}
	return false
}

// isBinaryComponent 判断是否为二进制组件
func (s *ComponentVersionService) isBinaryComponent(componentName string) bool {
	binaryComponents := []string{
		"node-exporter", "categraf",
	}
	
	for _, comp := range binaryComponents {
		if comp == componentName {
			return true
		}
	}
	return false
}

// isSystemdComponent 判断是否为 systemd 服务组件
func (s *ComponentVersionService) isSystemdComponent(componentName string) bool {
	systemdComponents := []string{
		"node-exporter", "categraf",
	}
	
	for _, comp := range systemdComponents {
		if comp == componentName {
			return true
		}
	}
	return false
}

// getComponentImageName 获取组件 Docker 镜像名称
func (s *ComponentVersionService) getComponentImageName(componentName, version string) string {
	imageMap := map[string]string{
		"prometheus":     "prom/prometheus:%s",
		"grafana":        "grafana/grafana:%s",
		"victoriametrics": "victoriametrics/victoria-metrics:%s",
		"alertmanager":   "prom/alertmanager:%s",
		"vmagent":        "victoriametrics/vmagent:%s",
		"vmalert":        "victoriametrics/vmalert:%s",
		"snmp-exporter":  "prom/snmp-exporter:%s",
	}
	
	if template, exists := imageMap[componentName]; exists {
		return fmt.Sprintf(template, version)
	}
	return fmt.Sprintf("%s:%s", componentName, version)
}

// generateDockerCreateCommand 生成 Docker 创建命令
func (s *ComponentVersionService) generateDockerCreateCommand(componentName, imageName string) string {
	commandMap := map[string]string{
		"prometheus": `docker run -d --name prometheus --restart=unless-stopped \
			-p 9090:9090 \
			-v /etc/prometheus:/etc/prometheus \
			-v /var/lib/prometheus:/prometheus \
			%s \
			--config.file=/etc/prometheus/prometheus.yml \
			--storage.tsdb.path=/prometheus \
			--web.console.libraries=/etc/prometheus/console_libraries \
			--web.console.templates=/etc/prometheus/consoles`,
		"grafana": `docker run -d --name grafana --restart=unless-stopped \
			-p 3000:3000 \
			-v /var/lib/grafana:/var/lib/grafana \
			-v /etc/grafana:/etc/grafana \
			%s`,
		"victoriametrics": `docker run -d --name victoriametrics --restart=unless-stopped \
			-p 8428:8428 \
			-v /var/lib/victoriametrics:/victoria-metrics-data \
			%s \
			-storageDataPath=/victoria-metrics-data \
			-retentionPeriod=12`,
		"alertmanager": `docker run -d --name alertmanager --restart=unless-stopped \
			-p 9093:9093 \
			-v /etc/alertmanager:/etc/alertmanager \
			-v /var/lib/alertmanager:/alertmanager \
			%s \
			--config.file=/etc/alertmanager/alertmanager.yml \
			--storage.path=/alertmanager`,
	}
	
	if template, exists := commandMap[componentName]; exists {
		return fmt.Sprintf(template, imageName)
	}
	return fmt.Sprintf("docker run -d --name %s --restart=unless-stopped %s", componentName, imageName)
}

// getComponentDownloadURL 获取组件下载 URL
func (s *ComponentVersionService) getComponentDownloadURL(componentName, version string) string {
	urlMap := map[string]string{
		"node-exporter": "https://github.com/prometheus/node_exporter/releases/download/v%s/node_exporter-%s.linux-amd64.tar.gz",
		"categraf":      "https://github.com/flashcatcloud/categraf/releases/download/v%s/categraf-%s.linux-amd64.tar.gz",
	}
	
	if template, exists := urlMap[componentName]; exists {
		return fmt.Sprintf(template, version, version)
	}
	return ""
}

// getComponentBinaryPath 获取组件二进制文件路径
func (s *ComponentVersionService) getComponentBinaryPath(componentName string) string {
	pathMap := map[string]string{
		"node-exporter": "/usr/local/bin/node_exporter",
		"categraf":      "/usr/local/bin/categraf",
	}
	
	if path, exists := pathMap[componentName]; exists {
		return path
	}
	return fmt.Sprintf("/usr/local/bin/%s", componentName)
}

// getConfigMigrationScript 获取配置迁移脚本
func (s *ComponentVersionService) getConfigMigrationScript(componentName, fromVersion, toVersion string) string {
	// 这里可以根据具体的版本变化返回相应的迁移脚本
	// 例如：从 Prometheus 2.x 升级到 3.x 时的配置迁移
	migrationMap := map[string]map[string]string{
		"prometheus": {
			"2.*->3.*": `
				# Prometheus 2.x to 3.x migration
				sed -i 's/scrape_interval: 15s/global_scrape_interval: 15s/g' /etc/prometheus/prometheus.yml
				echo "Prometheus config migrated from 2.x to 3.x"
			`,
		},
		"grafana": {
			"8.*->9.*": `
				# Grafana 8.x to 9.x migration
				echo "Grafana config migration from 8.x to 9.x"
				# 这里添加具体的迁移逻辑
			`,
		},
	}
	
	if componentMigrations, exists := migrationMap[componentName]; exists {
		// 简化的版本匹配，实际应该使用更复杂的版本比较
		for pattern, script := range componentMigrations {
			if s.versionMatches(fromVersion, toVersion, pattern) {
				return script
			}
		}
	}
	
	return ""
}

// versionMatches 检查版本是否匹配迁移模式
func (s *ComponentVersionService) versionMatches(fromVersion, toVersion, pattern string) bool {
	// 简化的版本匹配逻辑
	parts := strings.Split(pattern, "->")
	if len(parts) != 2 {
		return false
	}
	
	fromPattern := parts[0]
	toPattern := parts[1]
	
	// 这里应该实现更复杂的版本匹配逻辑
	fromMajor := strings.Split(fromVersion, ".")[0]
	toMajor := strings.Split(toVersion, ".")[0]
	
	return strings.Contains(fromPattern, fromMajor) && strings.Contains(toPattern, toMajor)
}

// getComponentHealthCheckCommand 获取组件健康检查命令
func (s *ComponentVersionService) getComponentHealthCheckCommand(componentName string) string {
	healthMap := map[string]string{
		"prometheus":     "curl -f http://localhost:9090/-/healthy",
		"grafana":        "curl -f http://localhost:3000/api/health",
		"victoriametrics": "curl -f http://localhost:8428/health",
		"alertmanager":   "curl -f http://localhost:9093/-/healthy",
		"node-exporter":  "curl -f http://localhost:9100/metrics",
		"categraf":       "systemctl is-active categraf",
		"snmp-exporter":  "curl -f http://localhost:9116/metrics",
		"vmagent":        "curl -f http://localhost:8429/-/healthy",
		"vmalert":        "curl -f http://localhost:8880/-/healthy",
	}
	
	if cmd, exists := healthMap[componentName]; exists {
		return cmd
	}
	return ""
}

// getComponentLogCommand 获取组件日志命令
func (s *ComponentVersionService) getComponentLogCommand(componentName string) string {
	logMap := map[string]string{
		"prometheus":     "docker logs prometheus --tail 50",
		"grafana":        "docker logs grafana --tail 50",
		"victoriametrics": "docker logs victoriametrics --tail 50",
		"alertmanager":   "docker logs alertmanager --tail 50",
		"node-exporter":  "journalctl -u node-exporter --lines 50",
		"categraf":       "journalctl -u categraf --lines 50",
		"snmp-exporter":  "docker logs snmp-exporter --tail 50",
		"vmagent":        "docker logs vmagent --tail 50",
		"vmalert":        "docker logs vmalert --tail 50",
	}
	
	if cmd, exists := logMap[componentName]; exists {
		return cmd
	}
	return fmt.Sprintf("journalctl -u %s --lines 50", componentName)
}