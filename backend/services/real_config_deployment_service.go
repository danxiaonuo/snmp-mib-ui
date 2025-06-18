package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/crypto/ssh"
)

// RealConfigDeploymentService 真实配置部署服务
type RealConfigDeploymentService struct {
	configBasePath string
	backupPath     string
}

// DeploymentTarget 部署目标
type DeploymentTarget struct {
	ID          string `json:"id"`
	Host        string `json:"host"`
	Port        int    `json:"port"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	KeyFile     string `json:"keyFile"`
	Type        string `json:"type"` // snmp-exporter, categraf, prometheus
	ServiceName string `json:"serviceName"`
	ConfigPath  string `json:"configPath"`
	RestartCmd  string `json:"restartCmd"`
}

// DeploymentConfig 部署配置
type DeploymentConfig struct {
	ID          string             `json:"id"`
	Name        string             `json:"name"`
	Type        string             `json:"type"`
	Content     string             `json:"content"`
	Targets     []DeploymentTarget `json:"targets"`
	Validation  bool               `json:"validation"`
	Backup      bool               `json:"backup"`
	AutoRestart bool               `json:"autoRestart"`
}

// DeploymentResult 部署结果
type DeploymentResult struct {
	TargetID    string    `json:"targetId"`
	Success     bool      `json:"success"`
	Message     string    `json:"message"`
	BackupPath  string    `json:"backupPath,omitempty"`
	ConfigPath  string    `json:"configPath"`
	StartTime   time.Time `json:"startTime"`
	EndTime     time.Time `json:"endTime"`
	Duration    string    `json:"duration"`
	ServiceInfo struct {
		Status  string `json:"status"`
		PID     string `json:"pid,omitempty"`
		Version string `json:"version,omitempty"`
	} `json:"serviceInfo"`
}

// NewRealConfigDeploymentService 创建新的配置部署服务
func NewRealConfigDeploymentService() *RealConfigDeploymentService {
	return &RealConfigDeploymentService{
		configBasePath: "/opt/monitoring/configs",
		backupPath:     "/opt/monitoring/backups",
	}
}

// DeployConfig 部署配置到远程主机
func (s *RealConfigDeploymentService) DeployConfig(config DeploymentConfig) ([]DeploymentResult, error) {
	results := make([]DeploymentResult, len(config.Targets))

	// 确保本地目录存在
	if err := s.ensureDirectories(); err != nil {
		return nil, fmt.Errorf("failed to create directories: %v", err)
	}

	// 并发部署到所有目标
	for i, target := range config.Targets {
		result := DeploymentResult{
			TargetID:  target.ID,
			StartTime: time.Now(),
		}

		// 部署到单个目标
		err := s.deployToTarget(config, target, &result)
		if err != nil {
			result.Success = false
			result.Message = err.Error()
		} else {
			result.Success = true
			result.Message = "配置部署成功"
		}

		result.EndTime = time.Now()
		result.Duration = result.EndTime.Sub(result.StartTime).String()
		results[i] = result
	}

	return results, nil
}

// deployToTarget 部署配置到单个目标
func (s *RealConfigDeploymentService) deployToTarget(config DeploymentConfig, target DeploymentTarget, result *DeploymentResult) error {
	// 1. 建立SSH连接
	client, err := s.createSSHClient(target)
	if err != nil {
		return fmt.Errorf("SSH连接失败: %v", err)
	}
	defer client.Close()

	// 2. 备份现有配置
	if config.Backup {
		backupPath, err := s.backupExistingConfig(client, target)
		if err != nil {
			return fmt.Errorf("备份配置失败: %v", err)
		}
		result.BackupPath = backupPath
	}

	// 3. 生成并上传新配置
	configPath, err := s.uploadConfig(client, target, config.Content)
	if err != nil {
		return fmt.Errorf("上传配置失败: %v", err)
	}
	result.ConfigPath = configPath

	// 4. 验证配置
	if config.Validation {
		if err := s.validateConfig(client, target, configPath); err != nil {
			return fmt.Errorf("配置验证失败: %v", err)
		}
	}

	// 5. 重启服务
	if config.AutoRestart {
		if err := s.restartService(client, target, result); err != nil {
			return fmt.Errorf("重启服务失败: %v", err)
		}
	}

	// 6. 检查服务状态
	if err := s.checkServiceStatus(client, target, result); err != nil {
		return fmt.Errorf("检查服务状态失败: %v", err)
	}

	return nil
}

// createSSHClient 创建SSH客户端
func (s *RealConfigDeploymentService) createSSHClient(target DeploymentTarget) (*ssh.Client, error) {
	var auth []ssh.AuthMethod

	// 密码认证
	if target.Password != "" {
		auth = append(auth, ssh.Password(target.Password))
	}

	// 密钥认证
	if target.KeyFile != "" {
		key, err := ioutil.ReadFile(target.KeyFile)
		if err != nil {
			return nil, fmt.Errorf("读取密钥文件失败: %v", err)
		}

		signer, err := ssh.ParsePrivateKey(key)
		if err != nil {
			return nil, fmt.Errorf("解析密钥失败: %v", err)
		}

		auth = append(auth, ssh.PublicKeys(signer))
	}

	config := &ssh.ClientConfig{
		User:            target.Username,
		Auth:            auth,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         30 * time.Second,
	}

	address := fmt.Sprintf("%s:%d", target.Host, target.Port)
	client, err := ssh.Dial("tcp", address, config)
	if err != nil {
		return nil, fmt.Errorf("SSH连接失败: %v", err)
	}

	return client, nil
}

// backupExistingConfig 备份现有配置
func (s *RealConfigDeploymentService) backupExistingConfig(client *ssh.Client, target DeploymentTarget) (string, error) {
	timestamp := time.Now().Format("20060102_150405")
	backupFileName := fmt.Sprintf("%s_%s_%s.bak", target.Type, target.ID, timestamp)
	backupPath := filepath.Join("/tmp", backupFileName)

	// 检查配置文件是否存在
	checkCmd := fmt.Sprintf("test -f %s", target.ConfigPath)
	session, err := client.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	if err := session.Run(checkCmd); err != nil {
		// 配置文件不存在，跳过备份
		return "", nil
	}

	// 备份配置文件
	backupCmd := fmt.Sprintf("cp %s %s", target.ConfigPath, backupPath)
	session, err = client.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	if err := session.Run(backupCmd); err != nil {
		return "", fmt.Errorf("备份命令执行失败: %v", err)
	}

	return backupPath, nil
}

// uploadConfig 上传配置文件
func (s *RealConfigDeploymentService) uploadConfig(client *ssh.Client, target DeploymentTarget, content string) (string, error) {
	// 确保目标目录存在
	dirPath := filepath.Dir(target.ConfigPath)
	mkdirCmd := fmt.Sprintf("mkdir -p %s", dirPath)
	
	session, err := client.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	if err := session.Run(mkdirCmd); err != nil {
		return "", fmt.Errorf("创建目录失败: %v", err)
	}

	// 上传配置内容
	session, err = client.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	// 使用cat命令写入文件
	writeCmd := fmt.Sprintf("cat > %s", target.ConfigPath)
	session.Stdin = strings.NewReader(content)
	
	if err := session.Run(writeCmd); err != nil {
		return "", fmt.Errorf("写入配置文件失败: %v", err)
	}

	// 设置文件权限
	chmodCmd := fmt.Sprintf("chmod 644 %s", target.ConfigPath)
	session, err = client.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	if err := session.Run(chmodCmd); err != nil {
		return "", fmt.Errorf("设置文件权限失败: %v", err)
	}

	return target.ConfigPath, nil
}

// validateConfig 验证配置文件
func (s *RealConfigDeploymentService) validateConfig(client *ssh.Client, target DeploymentTarget, configPath string) error {
	var validateCmd string

	switch target.Type {
	case "snmp-exporter":
		validateCmd = fmt.Sprintf("snmp_exporter --config.file=%s --dry-run", configPath)
	case "categraf":
		validateCmd = fmt.Sprintf("categraf --config=%s --test", configPath)
	case "prometheus":
		validateCmd = fmt.Sprintf("promtool check config %s", configPath)
	default:
		// 基本的YAML语法检查
		validateCmd = fmt.Sprintf("python3 -c \"import yaml; yaml.safe_load(open('%s'))\"", configPath)
	}

	session, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	var stderr bytes.Buffer
	session.Stderr = &stderr

	if err := session.Run(validateCmd); err != nil {
		return fmt.Errorf("配置验证失败: %v, stderr: %s", err, stderr.String())
	}

	return nil
}

// restartService 重启服务
func (s *RealConfigDeploymentService) restartService(client *ssh.Client, target DeploymentTarget, result *DeploymentResult) error {
	var restartCmd string

	if target.RestartCmd != "" {
		restartCmd = target.RestartCmd
	} else {
		// 默认重启命令
		switch target.Type {
		case "snmp-exporter":
			restartCmd = "systemctl restart snmp-exporter"
		case "categraf":
			restartCmd = "systemctl restart categraf"
		case "prometheus":
			restartCmd = "systemctl restart prometheus"
		default:
			restartCmd = fmt.Sprintf("systemctl restart %s", target.ServiceName)
		}
	}

	session, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	var stderr bytes.Buffer
	session.Stderr = &stderr

	if err := session.Run(restartCmd); err != nil {
		return fmt.Errorf("重启服务失败: %v, stderr: %s", err, stderr.String())
	}

	// 等待服务启动
	time.Sleep(5 * time.Second)

	return nil
}

// checkServiceStatus 检查服务状态
func (s *RealConfigDeploymentService) checkServiceStatus(client *ssh.Client, target DeploymentTarget, result *DeploymentResult) error {
	serviceName := target.ServiceName
	if serviceName == "" {
		serviceName = target.Type
	}

	// 检查服务状态
	statusCmd := fmt.Sprintf("systemctl is-active %s", serviceName)
	session, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	var stdout bytes.Buffer
	session.Stdout = &stdout

	if err := session.Run(statusCmd); err == nil {
		result.ServiceInfo.Status = strings.TrimSpace(stdout.String())
	} else {
		result.ServiceInfo.Status = "unknown"
	}

	// 获取PID
	pidCmd := fmt.Sprintf("systemctl show -p MainPID %s", serviceName)
	session, err = client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	stdout.Reset()
	session.Stdout = &stdout

	if err := session.Run(pidCmd); err == nil {
		pidOutput := stdout.String()
		if strings.Contains(pidOutput, "MainPID=") {
			pid := strings.TrimPrefix(pidOutput, "MainPID=")
			pid = strings.TrimSpace(pid)
			if pid != "0" {
				result.ServiceInfo.PID = pid
			}
		}
	}

	// 获取版本信息
	var versionCmd string
	switch target.Type {
	case "snmp-exporter":
		versionCmd = "snmp_exporter --version 2>&1 | head -1"
	case "categraf":
		versionCmd = "categraf --version 2>&1 | head -1"
	case "prometheus":
		versionCmd = "prometheus --version 2>&1 | head -1"
	}

	if versionCmd != "" {
		session, err = client.NewSession()
		if err != nil {
			return err
		}
		defer session.Close()

		stdout.Reset()
		session.Stdout = &stdout

		if err := session.Run(versionCmd); err == nil {
			result.ServiceInfo.Version = strings.TrimSpace(stdout.String())
		}
	}

	return nil
}

// ensureDirectories 确保必要的目录存在
func (s *RealConfigDeploymentService) ensureDirectories() error {
	dirs := []string{s.configBasePath, s.backupPath}
	
	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return err
		}
	}
	
	return nil
}

// ValidateRemoteConnection 验证远程连接
func (s *RealConfigDeploymentService) ValidateRemoteConnection(target DeploymentTarget) error {
	client, err := s.createSSHClient(target)
	if err != nil {
		return err
	}
	defer client.Close()

	// 执行简单的测试命令
	session, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	if err := session.Run("echo 'connection test'"); err != nil {
		return fmt.Errorf("连接测试失败: %v", err)
	}

	return nil
}

// GetServiceStatus 获取远程服务状态
func (s *RealConfigDeploymentService) GetServiceStatus(target DeploymentTarget) (map[string]interface{}, error) {
	client, err := s.createSSHClient(target)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	status := make(map[string]interface{})

	// 检查服务是否存在
	serviceName := target.ServiceName
	if serviceName == "" {
		serviceName = target.Type
	}

	checkCmd := fmt.Sprintf("systemctl list-units --type=service | grep %s", serviceName)
	session, err := client.NewSession()
	if err != nil {
		return nil, err
	}
	defer session.Close()

	var stdout bytes.Buffer
	session.Stdout = &stdout

	if err := session.Run(checkCmd); err != nil {
		status["exists"] = false
		status["message"] = "服务不存在"
		return status, nil
	}

	status["exists"] = true

	// 获取详细状态
	statusCmd := fmt.Sprintf("systemctl status %s --no-pager", serviceName)
	session, err = client.NewSession()
	if err != nil {
		return nil, err
	}
	defer session.Close()

	stdout.Reset()
	session.Stdout = &stdout

	if err := session.Run(statusCmd); err == nil {
		status["details"] = stdout.String()
	}

	return status, nil
}

// RollbackConfig 回滚配置
func (s *RealConfigDeploymentService) RollbackConfig(target DeploymentTarget, backupPath string) error {
	client, err := s.createSSHClient(target)
	if err != nil {
		return err
	}
	defer client.Close()

	// 检查备份文件是否存在
	checkCmd := fmt.Sprintf("test -f %s", backupPath)
	session, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	if err := session.Run(checkCmd); err != nil {
		return fmt.Errorf("备份文件不存在: %s", backupPath)
	}

	// 恢复配置
	restoreCmd := fmt.Sprintf("cp %s %s", backupPath, target.ConfigPath)
	session, err = client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	if err := session.Run(restoreCmd); err != nil {
		return fmt.Errorf("恢复配置失败: %v", err)
	}

	// 重启服务
	result := &DeploymentResult{}
	if err := s.restartService(client, target, result); err != nil {
		return fmt.Errorf("重启服务失败: %v", err)
	}

	return nil
}