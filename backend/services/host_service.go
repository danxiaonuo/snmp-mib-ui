package services

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	"golang.org/x/crypto/ssh"
	"gorm.io/gorm"

	"mib-platform/models"
)

type HostService struct {
	db    *gorm.DB
	redis *redis.Client
	encryptionKey []byte
}

func NewHostService(db *gorm.DB, redis *redis.Client) *HostService {
	// 在实际应用中，这个密钥应该从环境变量或配置文件中读取
	encryptionKey := []byte("your-32-byte-encryption-key-here") // 32 bytes for AES-256
	return &HostService{
		db:            db,
		redis:         redis,
		encryptionKey: encryptionKey,
	}
}

// 主机管理相关方法

func (s *HostService) GetHosts(page, limit int, search, status, group string) ([]models.Host, int64, error) {
	var hosts []models.Host
	var total int64

	query := s.db.Model(&models.Host{})

	if search != "" {
		query = query.Where("name ILIKE ? OR ip ILIKE ? OR hostname ILIKE ?", 
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if group != "" {
		query = query.Where("group = ?", group)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Preload("Components").Offset(offset).Limit(limit).Find(&hosts).Error; err != nil {
		return nil, 0, err
	}

	// 解密敏感信息（仅在需要时）
	for i := range hosts {
		hosts[i].Password = "" // 不返回密码
		hosts[i].PrivateKey = "" // 不返回私钥
	}

	return hosts, total, nil
}

func (s *HostService) GetHost(id uint) (*models.Host, error) {
	var host models.Host
	if err := s.db.Preload("Components").First(&host, id).Error; err != nil {
		return nil, err
	}

	// 解密敏感信息
	if host.Password != "" {
		decrypted, err := s.decrypt(host.Password)
		if err == nil {
			host.Password = decrypted
		}
	}

	if host.PrivateKey != "" {
		decrypted, err := s.decrypt(host.PrivateKey)
		if err == nil {
			host.PrivateKey = decrypted
		}
	}

	return &host, nil
}

func (s *HostService) CreateHost(host *models.Host) error {
	// 加密敏感信息
	if host.Password != "" {
		encrypted, err := s.encrypt(host.Password)
		if err != nil {
			return fmt.Errorf("failed to encrypt password: %v", err)
		}
		host.Password = encrypted
	}

	if host.PrivateKey != "" {
		encrypted, err := s.encrypt(host.PrivateKey)
		if err != nil {
			return fmt.Errorf("failed to encrypt private key: %v", err)
		}
		host.PrivateKey = encrypted
	}

	return s.db.Create(host).Error
}

func (s *HostService) UpdateHost(id uint, updates *models.Host) (*models.Host, error) {
	var host models.Host
	if err := s.db.First(&host, id).Error; err != nil {
		return nil, err
	}

	// 加密敏感信息
	if updates.Password != "" {
		encrypted, err := s.encrypt(updates.Password)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt password: %v", err)
		}
		updates.Password = encrypted
	}

	if updates.PrivateKey != "" {
		encrypted, err := s.encrypt(updates.PrivateKey)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt private key: %v", err)
		}
		updates.PrivateKey = encrypted
	}

	if err := s.db.Model(&host).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &host, nil
}

func (s *HostService) DeleteHost(id uint) error {
	return s.db.Delete(&models.Host{}, id).Error
}

// 主机发现相关方法

func (s *HostService) CreateDiscoveryTask(task *models.HostDiscoveryTask) error {
	// 加密认证信息
	if task.Password != "" {
		encrypted, err := s.encrypt(task.Password)
		if err != nil {
			return fmt.Errorf("failed to encrypt password: %v", err)
		}
		task.Password = encrypted
	}

	if task.PrivateKey != "" {
		encrypted, err := s.encrypt(task.PrivateKey)
		if err != nil {
			return fmt.Errorf("failed to encrypt private key: %v", err)
		}
		task.PrivateKey = encrypted
	}

	return s.db.Create(task).Error
}

func (s *HostService) StartDiscovery(taskID uint) error {
	var task models.HostDiscoveryTask
	if err := s.db.First(&task, taskID).Error; err != nil {
		return err
	}

	// 更新任务状态
	task.Status = "running"
	task.Progress = 0
	now := time.Now()
	task.StartedAt = &now
	s.db.Save(&task)

	// 异步执行发现任务
	go s.executeDiscovery(&task)

	return nil
}

func (s *HostService) executeDiscovery(task *models.HostDiscoveryTask) {
	defer func() {
		// 任务完成时更新状态
		task.Status = "completed"
		task.Progress = 100
		now := time.Now()
		task.CompletedAt = &now
		s.db.Save(task)
	}()

	// 解析 IP 范围
	ips, err := s.parseIPRange(task.IPRange)
	if err != nil {
		task.Status = "failed"
		s.db.Save(task)
		return
	}

	task.TotalHosts = len(ips)
	s.db.Save(task)

	// 解析端口
	ports := s.parsePorts(task.Ports)
	if len(ports) == 0 {
		ports = []int{22} // 默认 SSH 端口
	}

	// 并发扫描
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, 50) // 限制并发数
	var mu sync.Mutex
	processed := 0

	for _, ip := range ips {
		wg.Add(1)
		go func(ip string) {
			defer wg.Done()
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// 扫描主机
			host := s.scanHost(ip, ports, task)
			if host != nil {
				mu.Lock()
				task.FoundHosts++
				if host.Status == "online" {
					task.OnlineHosts++
				}
				s.saveDiscoveredHost(host)
				mu.Unlock()
			}

			// 更新进度
			mu.Lock()
			processed++
			task.Progress = int(float64(processed) / float64(task.TotalHosts) * 100)
			s.db.Save(task)
			mu.Unlock()
		}(ip)
	}

	wg.Wait()
}

func (s *HostService) scanHost(ip string, ports []int, task *models.HostDiscoveryTask) *models.Host {
	// 首先进行 ping 测试
	if !s.pingHost(ip, time.Duration(task.Timeout)*time.Second) {
		return nil
	}

	host := &models.Host{
		IP:              ip,
		Status:          "offline",
		DiscoveryMethod: "scan",
		DiscoveredAt:    &time.Time{},
	}
	*host.DiscoveredAt = time.Now()

	// 扫描端口
	var openPorts []int
	for _, port := range ports {
		if s.scanPort(ip, port, time.Duration(task.Timeout)*time.Second) {
			openPorts = append(openPorts, port)
		}
	}

	if len(openPorts) == 0 {
		return host
	}

	host.Status = "online"
	now := time.Now()
	host.LastSeen = &now

	// 如果 SSH 端口开放，尝试获取系统信息
	for _, port := range openPorts {
		if port == 22 {
			host.Port = port
			s.gatherSystemInfo(host, task)
			break
		}
	}

	return host
}

func (s *HostService) pingHost(ip string, timeout time.Duration) bool {
	cmd := exec.Command("ping", "-c", "1", "-W", fmt.Sprintf("%.0f", timeout.Seconds()), ip)
	err := cmd.Run()
	return err == nil
}

func (s *HostService) scanPort(ip string, port int, timeout time.Duration) bool {
	conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:%d", ip, port), timeout)
	if err != nil {
		return false
	}
	conn.Close()
	return true
}

func (s *HostService) gatherSystemInfo(host *models.Host, task *models.HostDiscoveryTask) {
	// 解密认证信息
	var password, privateKey string
	if task.Password != "" {
		if decrypted, err := s.decrypt(task.Password); err == nil {
			password = decrypted
		}
	}
	if task.PrivateKey != "" {
		if decrypted, err := s.decrypt(task.PrivateKey); err == nil {
			privateKey = decrypted
		}
	}

	// 尝试 SSH 连接
	client, err := s.createSSHClient(host.IP, host.Port, task.Username, password, privateKey)
	if err != nil {
		return
	}
	defer client.Close()

	// 获取系统信息
	if hostname, err := s.executeSSHCommand(client, "hostname"); err == nil {
		host.Hostname = strings.TrimSpace(hostname)
		if host.Name == "" {
			host.Name = host.Hostname
		}
	}

	if osInfo, err := s.executeSSHCommand(client, "uname -a"); err == nil {
		parts := strings.Fields(osInfo)
		if len(parts) >= 3 {
			host.OS = parts[0]
			host.OSVersion = parts[2]
		}
		if len(parts) >= 12 {
			host.Arch = parts[11]
		}
	}

	// 获取 CPU 信息
	if cpuInfo, err := s.executeSSHCommand(client, "nproc"); err == nil {
		if cores, err := strconv.Atoi(strings.TrimSpace(cpuInfo)); err == nil {
			host.CPUCores = cores
		}
	}

	// 获取内存信息 (MB)
	if memInfo, err := s.executeSSHCommand(client, "free -m | grep '^Mem:' | awk '{print $2}'"); err == nil {
		if memory, err := strconv.ParseInt(strings.TrimSpace(memInfo), 10, 64); err == nil {
			host.Memory = memory
		}
	}

	// 获取磁盘信息 (GB)
	if diskInfo, err := s.executeSSHCommand(client, "df -BG / | tail -1 | awk '{print $2}' | sed 's/G//'"); err == nil {
		if disk, err := strconv.ParseInt(strings.TrimSpace(diskInfo), 10, 64); err == nil {
			host.Disk = disk
		}
	}

	// 设置认证信息
	host.Username = task.Username
	if password != "" {
		host.AuthType = "password"
		host.Password = task.Password // 已加密
	} else if privateKey != "" {
		host.AuthType = "key"
		host.PrivateKey = task.PrivateKey // 已加密
	}
}

func (s *HostService) createSSHClient(host string, port int, username, password, privateKey string) (*ssh.Client, error) {
	config := &ssh.ClientConfig{
		User:            username,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

	if privateKey != "" {
		signer, err := ssh.ParsePrivateKey([]byte(privateKey))
		if err != nil {
			return nil, err
		}
		config.Auth = []ssh.AuthMethod{ssh.PublicKeys(signer)}
	} else if password != "" {
		config.Auth = []ssh.AuthMethod{ssh.Password(password)}
	} else {
		return nil, fmt.Errorf("no authentication method provided")
	}

	return ssh.Dial("tcp", fmt.Sprintf("%s:%d", host, port), config)
}

func (s *HostService) executeSSHCommand(client *ssh.Client, command string) (string, error) {
	session, err := client.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	output, err := session.Output(command)
	return string(output), err
}

func (s *HostService) saveDiscoveredHost(host *models.Host) error {
	// 检查主机是否已存在
	var existingHost models.Host
	if err := s.db.Where("ip = ?", host.IP).First(&existingHost).Error; err == nil {
		// 主机已存在，更新信息
		existingHost.Status = host.Status
		existingHost.LastSeen = host.LastSeen
		existingHost.Hostname = host.Hostname
		existingHost.OS = host.OS
		existingHost.OSVersion = host.OSVersion
		existingHost.Arch = host.Arch
		existingHost.CPUCores = host.CPUCores
		existingHost.Memory = host.Memory
		existingHost.Disk = host.Disk
		return s.db.Save(&existingHost).Error
	}

	// 新主机，创建记录
	return s.db.Create(host).Error
}

// 主机连接测试

func (s *HostService) TestHostConnection(id uint) (map[string]interface{}, error) {
	host, err := s.GetHost(id)
	if err != nil {
		return nil, err
	}

	result := map[string]interface{}{
		"host_id": id,
		"ip":      host.IP,
		"tests":   []map[string]interface{}{},
	}

	tests := []map[string]interface{}{}

	// Ping 测试
	pingResult := map[string]interface{}{
		"name":   "Ping Test",
		"type":   "ping",
		"status": "failed",
	}
	if s.pingHost(host.IP, 5*time.Second) {
		pingResult["status"] = "success"
		pingResult["message"] = "Host is reachable"
	} else {
		pingResult["message"] = "Host is not reachable"
	}
	tests = append(tests, pingResult)

	// SSH 连接测试
	sshResult := map[string]interface{}{
		"name":   "SSH Connection Test",
		"type":   "ssh",
		"status": "failed",
	}

	if host.Username != "" {
		client, err := s.createSSHClient(host.IP, host.Port, host.Username, host.Password, host.PrivateKey)
		if err != nil {
			sshResult["message"] = fmt.Sprintf("SSH connection failed: %v", err)
		} else {
			client.Close()
			sshResult["status"] = "success"
			sshResult["message"] = "SSH connection successful"

			// 更新主机状态
			host.Status = "online"
			now := time.Now()
			host.LastSeen = &now
			s.db.Save(host)
		}
	} else {
		sshResult["message"] = "No SSH credentials configured"
	}
	tests = append(tests, sshResult)

	result["tests"] = tests
	return result, nil
}

// 工具方法

func (s *HostService) parseIPRange(ipRange string) ([]string, error) {
	var ips []string

	if strings.Contains(ipRange, "/") {
		// CIDR 格式
		_, ipNet, err := net.ParseCIDR(ipRange)
		if err != nil {
			return nil, err
		}

		for ip := ipNet.IP.Mask(ipNet.Mask); ipNet.Contains(ip); s.incrementIP(ip) {
			ips = append(ips, ip.String())
		}
	} else if strings.Contains(ipRange, "-") {
		// 范围格式 192.168.1.1-192.168.1.100
		parts := strings.Split(ipRange, "-")
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid IP range format")
		}

		startIP := net.ParseIP(strings.TrimSpace(parts[0]))
		endIP := net.ParseIP(strings.TrimSpace(parts[1]))
		if startIP == nil || endIP == nil {
			return nil, fmt.Errorf("invalid IP addresses in range")
		}

		for ip := startIP; !ip.Equal(endIP); s.incrementIP(ip) {
			ips = append(ips, ip.String())
		}
		ips = append(ips, endIP.String())
	} else {
		// 单个 IP
		if net.ParseIP(ipRange) == nil {
			return nil, fmt.Errorf("invalid IP address")
		}
		ips = append(ips, ipRange)
	}

	return ips, nil
}

func (s *HostService) incrementIP(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}

func (s *HostService) parsePorts(portStr string) []int {
	var ports []int
	if portStr == "" {
		return ports
	}

	parts := strings.Split(portStr, ",")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if port, err := strconv.Atoi(part); err == nil {
			ports = append(ports, port)
		}
	}

	return ports
}

// 加密解密方法

func (s *HostService) encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (s *HostService) decrypt(ciphertext string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// 凭据管理

func (s *HostService) GetCredentials() ([]models.HostCredential, error) {
	var credentials []models.HostCredential
	if err := s.db.Find(&credentials).Error; err != nil {
		return nil, err
	}

	// 不返回敏感信息
	for i := range credentials {
		credentials[i].Password = ""
		credentials[i].PrivateKey = ""
		credentials[i].Passphrase = ""
	}

	return credentials, nil
}

func (s *HostService) CreateCredential(credential *models.HostCredential) error {
	// 加密敏感信息
	if credential.Password != "" {
		encrypted, err := s.encrypt(credential.Password)
		if err != nil {
			return fmt.Errorf("failed to encrypt password: %v", err)
		}
		credential.Password = encrypted
	}

	if credential.PrivateKey != "" {
		encrypted, err := s.encrypt(credential.PrivateKey)
		if err != nil {
			return fmt.Errorf("failed to encrypt private key: %v", err)
		}
		credential.PrivateKey = encrypted
	}

	if credential.Passphrase != "" {
		encrypted, err := s.encrypt(credential.Passphrase)
		if err != nil {
			return fmt.Errorf("failed to encrypt passphrase: %v", err)
		}
		credential.Passphrase = encrypted
	}

	return s.db.Create(credential).Error
}

// 获取发现任务列表
func (s *HostService) GetDiscoveryTasks(page, limit int) ([]models.HostDiscoveryTask, int64, error) {
	var tasks []models.HostDiscoveryTask
	var total int64

	query := s.db.Model(&models.HostDiscoveryTask{})

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&tasks).Error; err != nil {
		return nil, 0, err
	}

	// 不返回敏感信息
	for i := range tasks {
		tasks[i].Password = ""
		tasks[i].PrivateKey = ""
	}

	return tasks, total, nil
}

func (s *HostService) GetDiscoveryTask(id uint) (*models.HostDiscoveryTask, error) {
	var task models.HostDiscoveryTask
	if err := s.db.First(&task, id).Error; err != nil {
		return nil, err
	}

	// 不返回敏感信息
	task.Password = ""
	task.PrivateKey = ""

	return &task, nil
}