package models

import (
	"time"
	"gorm.io/gorm"
)

// Host 主机模型
type Host struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"size:255;not null"`
	IP          string         `json:"ip" gorm:"size:45;not null;uniqueIndex"`
	Port        int            `json:"port" gorm:"default:22"`
	OS          string         `json:"os" gorm:"size:100"`
	OSVersion   string         `json:"os_version" gorm:"size:100"`
	Arch        string         `json:"arch" gorm:"size:50"`
	Status      string         `json:"status" gorm:"size:20;default:'unknown'"` // online, offline, unknown
	LastSeen    *time.Time     `json:"last_seen"`
	
	// 连接信息
	Username    string         `json:"username" gorm:"size:100"`
	AuthType    string         `json:"auth_type" gorm:"size:20;default:'password'"` // password, key
	Password    string         `json:"password,omitempty" gorm:"size:255"` // 加密存储
	PrivateKey  string         `json:"private_key,omitempty" gorm:"type:text"` // 加密存储
	
	// 系统信息
	CPUCores    int            `json:"cpu_cores"`
	Memory      int64          `json:"memory"` // MB
	Disk        int64          `json:"disk"`   // GB
	
	// 网络信息
	Hostname    string         `json:"hostname" gorm:"size:255"`
	MACAddress  string         `json:"mac_address" gorm:"size:17"`
	
	// 标签和分组
	Tags        string         `json:"tags" gorm:"type:text"` // JSON 格式存储标签
	Group       string         `json:"group" gorm:"size:100"`
	Location    string         `json:"location" gorm:"size:255"`
	
	// 发现信息
	DiscoveryMethod string     `json:"discovery_method" gorm:"size:50"` // scan, manual, import
	DiscoveredAt    *time.Time `json:"discovered_at"`
	
	// 部署状态
	Components  []HostComponent `json:"components" gorm:"foreignKey:HostID"`
	
	// 时间戳
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// HostComponent 主机上部署的组件
type HostComponent struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	HostID      uint           `json:"host_id" gorm:"not null"`
	Host        Host           `json:"host" gorm:"foreignKey:HostID"`
	
	ComponentName string       `json:"component_name" gorm:"size:100;not null"` // node-exporter, grafana, etc.
	ComponentType string       `json:"component_type" gorm:"size:50"`           // collector, storage, visualization
	Version     string         `json:"version" gorm:"size:50"`
	Status      string         `json:"status" gorm:"size:20;default:'unknown'"` // running, stopped, failed, unknown
	Port        int            `json:"port"`
	ConfigPath  string         `json:"config_path" gorm:"size:500"`
	
	// 部署信息
	DeployMethod string        `json:"deploy_method" gorm:"size:50"` // docker, binary, systemd
	DeployedAt   *time.Time    `json:"deployed_at"`
	
	// 时间戳
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// HostDiscoveryTask 主机发现任务
type HostDiscoveryTask struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"size:255;not null"`
	
	// 扫描配置
	IPRange     string         `json:"ip_range" gorm:"size:100;not null"` // 192.168.1.0/24
	Ports       string         `json:"ports" gorm:"size:255"`             // 22,80,443,9100
	Timeout     int            `json:"timeout" gorm:"default:5"`          // 秒
	
	// 认证配置
	Username    string         `json:"username" gorm:"size:100"`
	Password    string         `json:"password" gorm:"size:255"` // 加密存储
	PrivateKey  string         `json:"private_key" gorm:"type:text"` // 加密存储
	
	// 任务状态
	Status      string         `json:"status" gorm:"size:20;default:'pending'"` // pending, running, completed, failed
	Progress    int            `json:"progress" gorm:"default:0"` // 0-100
	
	// 结果统计
	TotalHosts  int            `json:"total_hosts" gorm:"default:0"`
	FoundHosts  int            `json:"found_hosts" gorm:"default:0"`
	OnlineHosts int            `json:"online_hosts" gorm:"default:0"`
	
	// 时间信息
	StartedAt   *time.Time     `json:"started_at"`
	CompletedAt *time.Time     `json:"completed_at"`
	
	// 时间戳
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// HostCredential 主机认证凭据
type HostCredential struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"size:255;not null"`
	Description string         `json:"description" gorm:"type:text"`
	
	// 认证信息
	Username    string         `json:"username" gorm:"size:100;not null"`
	AuthType    string         `json:"auth_type" gorm:"size:20;not null"` // password, key
	Password    string         `json:"password,omitempty" gorm:"size:255"` // 加密存储
	PrivateKey  string         `json:"private_key,omitempty" gorm:"type:text"` // 加密存储
	Passphrase  string         `json:"passphrase,omitempty" gorm:"size:255"` // 私钥密码，加密存储
	
	// 使用范围
	IPRanges    string         `json:"ip_ranges" gorm:"type:text"` // JSON 格式存储 IP 范围
	Tags        string         `json:"tags" gorm:"type:text"`      // JSON 格式存储标签
	
	// 时间戳
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TableName 设置表名
func (Host) TableName() string {
	return "hosts"
}

func (HostComponent) TableName() string {
	return "host_components"
}

func (HostDiscoveryTask) TableName() string {
	return "host_discovery_tasks"
}

func (HostCredential) TableName() string {
	return "host_credentials"
}