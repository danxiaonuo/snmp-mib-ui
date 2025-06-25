package models

import (
	"time"
	"encoding/json"
	"database/sql/driver"
	"fmt"
)

// JSON 自定义JSON类型
type JSON json.RawMessage

// Value 实现driver.Valuer接口
func (j JSON) Value() (driver.Value, error) {
	if len(j) == 0 {
		return nil, nil
	}
	return string(j), nil
}

// Scan 实现sql.Scanner接口
func (j *JSON) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	switch s := value.(type) {
	case string:
		*j = JSON(s)
	case []byte:
		*j = JSON(s)
	default:
		return fmt.Errorf("cannot scan %T into JSON", value)
	}
	return nil
}

// AlertRule 告警规则模型
type AlertRule struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)" example:"rule-001"`
	Name        string    `json:"name" gorm:"not null;type:varchar(255)" example:"CPU使用率告警"`
	Description string    `json:"description" gorm:"type:text" example:"当CPU使用率超过80%时触发告警"`
	Expression  string    `json:"expression" gorm:"not null;type:text" example:"cpu_usage > 80"`
	Duration    string    `json:"duration" gorm:"type:varchar(50)" example:"5m"`
	Severity    string    `json:"severity" gorm:"type:varchar(20)" example:"warning"`
	Status      string    `json:"status" gorm:"type:varchar(20);default:active" example:"active"`
	GroupID     string    `json:"group_id" gorm:"type:varchar(36)" example:"group-001"`
	DeviceGroupID string  `json:"device_group_id" gorm:"type:varchar(36)" example:"device-group-001"`
	Labels      JSON      `json:"labels" gorm:"type:json"`
	Annotations JSON      `json:"annotations" gorm:"type:json"`
	CreatedBy   string    `json:"created_by" gorm:"type:varchar(100)" example:"admin"`
	UpdatedBy   string    `json:"updated_by" gorm:"type:varchar(100)" example:"admin"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// 关联
	Group       *AlertRuleGroup `json:"group,omitempty" gorm:"foreignKey:GroupID"`
	DeviceGroup *DeviceGroup    `json:"device_group,omitempty" gorm:"foreignKey:DeviceGroupID"`
}

// AlertRuleGroup 告警规则组模型
type AlertRuleGroup struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)" example:"group-001"`
	Name        string    `json:"name" gorm:"not null;type:varchar(255)" example:"交换机监控规则组"`
	Description string    `json:"description" gorm:"type:text" example:"交换机相关的告警规则"`
	Interval    string    `json:"interval" gorm:"type:varchar(50);default:30s" example:"30s"`
	Status      string    `json:"status" gorm:"type:varchar(20);default:active" example:"active"`
	CreatedBy   string    `json:"created_by" gorm:"type:varchar(100)" example:"admin"`
	UpdatedBy   string    `json:"updated_by" gorm:"type:varchar(100)" example:"admin"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// 关联
	Rules []AlertRule `json:"rules,omitempty" gorm:"foreignKey:GroupID"`
}

// DeviceGroup 设备分组模型
type DeviceGroup struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)" example:"device-group-001"`
	Name        string    `json:"name" gorm:"not null;type:varchar(255)" example:"核心交换机组"`
	Description string    `json:"description" gorm:"type:text" example:"核心层交换机设备组"`
	Tags        JSON      `json:"tags" gorm:"type:json" example:"{\"location\":\"datacenter1\",\"type\":\"switch\"}"`
	Selector    JSON      `json:"selector" gorm:"type:json" example:"{\"job\":\"switch\",\"instance\":\"~192.168.1.*\"}"`
	CreatedBy   string    `json:"created_by" gorm:"type:varchar(100)" example:"admin"`
	UpdatedBy   string    `json:"updated_by" gorm:"type:varchar(100)" example:"admin"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// 关联
	Devices []Device    `json:"devices,omitempty" gorm:"many2many:device_group_devices;"`
	Rules   []AlertRule `json:"rules,omitempty" gorm:"foreignKey:DeviceGroupID"`
}

// DeviceGroupDevice 设备分组关联表
type DeviceGroupDevice struct {
	DeviceGroupID string    `json:"device_group_id" gorm:"primaryKey;type:varchar(36)"`
	DeviceID      string    `json:"device_id" gorm:"primaryKey;type:varchar(36)"`
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime"`
}

// AlertRuleTemplate 告警规则模板模型
type AlertRuleTemplate struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)" example:"template-001"`
	Name        string    `json:"name" gorm:"not null;type:varchar(255)" example:"交换机CPU监控模板"`
	Description string    `json:"description" gorm:"type:text" example:"适用于交换机CPU使用率监控的通用模板"`
	Category    string    `json:"category" gorm:"type:varchar(100)" example:"system"`
	Vendor      string    `json:"vendor" gorm:"type:varchar(100)" example:"cisco"`
	DeviceType  string    `json:"device_type" gorm:"type:varchar(100)" example:"switch"`
	Expression  string    `json:"expression" gorm:"not null;type:text" example:"cpu_usage{job=\"switch\"} > {{.threshold}}"`
	Duration    string    `json:"duration" gorm:"type:varchar(50)" example:"5m"`
	Severity    string    `json:"severity" gorm:"type:varchar(20)" example:"warning"`
	Labels      JSON      `json:"labels" gorm:"type:json"`
	Annotations JSON      `json:"annotations" gorm:"type:json"`
	Variables   JSON      `json:"variables" gorm:"type:json" example:"{\"threshold\":{\"type\":\"number\",\"default\":80,\"description\":\"CPU使用率阈值\"}}"`
	IsBuiltin   bool      `json:"is_builtin" gorm:"default:false" example:"false"`
	UsageCount  int       `json:"usage_count" gorm:"default:0" example:"10"`
	CreatedBy   string    `json:"created_by" gorm:"type:varchar(100)" example:"admin"`
	UpdatedBy   string    `json:"updated_by" gorm:"type:varchar(100)" example:"admin"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// AlertmanagerConfig Alertmanager配置模型
type AlertmanagerConfig struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(36)" example:"config-001"`
	Global    JSON      `json:"global" gorm:"type:json"`
	Route     JSON      `json:"route" gorm:"type:json"`
	Receivers JSON      `json:"receivers" gorm:"type:json"`
	InhibitRules JSON   `json:"inhibit_rules" gorm:"type:json"`
	Templates JSON      `json:"templates" gorm:"type:json"`
	Version   int       `json:"version" gorm:"default:1" example:"1"`
	Status    string    `json:"status" gorm:"type:varchar(20);default:active" example:"active"`
	CreatedBy string    `json:"created_by" gorm:"type:varchar(100)" example:"admin"`
	UpdatedBy string    `json:"updated_by" gorm:"type:varchar(100)" example:"admin"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// SyncHistory 同步历史记录模型
type SyncHistory struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)" example:"sync-001"`
	Type        string    `json:"type" gorm:"type:varchar(50)" example:"prometheus"`
	Target      string    `json:"target" gorm:"type:varchar(255)" example:"http://prometheus:9090"`
	ConfigType  string    `json:"config_type" gorm:"type:varchar(50)" example:"rules"`
	Status      string    `json:"status" gorm:"type:varchar(20)" example:"success"`
	Message     string    `json:"message" gorm:"type:text" example:"同步成功"`
	ConfigHash  string    `json:"config_hash" gorm:"type:varchar(64)" example:"abc123def456"`
	Duration    int       `json:"duration" gorm:"comment:同步耗时(毫秒)" example:"1500"`
	TriggeredBy string    `json:"triggered_by" gorm:"type:varchar(100)" example:"admin"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
}

// RuleRecommendation 规则推荐模型
type RuleRecommendation struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)" example:"rec-001"`
	Type        string    `json:"type" gorm:"type:varchar(50)" example:"missing_rules"`
	Priority    string    `json:"priority" gorm:"type:varchar(20)" example:"high"`
	Title       string    `json:"title" gorm:"type:varchar(255)" example:"核心交换机缺少关键监控"`
	Description string    `json:"description" gorm:"type:text" example:"发现3台核心交换机缺少CPU和内存监控规则"`
	Content     JSON      `json:"content" gorm:"type:json" example:"{\"devices\":[],\"suggested_rules\":[]}"`
	Confidence  int       `json:"confidence" gorm:"comment:置信度(0-100)" example:"95"`
	Impact      string    `json:"impact" gorm:"type:varchar(20)" example:"high"`
	Effort      string    `json:"effort" gorm:"type:varchar(20)" example:"low"`
	Status      string    `json:"status" gorm:"type:varchar(20);default:pending" example:"pending"`
	AppliedAt   *time.Time `json:"applied_at,omitempty"`
	AppliedBy   string    `json:"applied_by" gorm:"type:varchar(100)" example:"admin"`
	RejectedAt  *time.Time `json:"rejected_at,omitempty"`
	RejectedBy  string    `json:"rejected_by" gorm:"type:varchar(100)" example:"admin"`
	RejectReason string   `json:"reject_reason" gorm:"type:text" example:"当前阈值符合要求"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// DiscoveredDevice 发现的设备模型
type DiscoveredDevice struct {
	ID           string    `json:"id" gorm:"primaryKey;type:varchar(36)" example:"discovered-001"`
	Instance     string    `json:"instance" gorm:"type:varchar(255)" example:"192.168.1.100:161"`
	Job          string    `json:"job" gorm:"type:varchar(100)" example:"switch"`
	DeviceType   string    `json:"device_type" gorm:"type:varchar(100)" example:"switch"`
	Vendor       string    `json:"vendor" gorm:"type:varchar(100)" example:"cisco"`
	Model        string    `json:"model" gorm:"type:varchar(100)" example:"C9300-24T"`
	SysName      string    `json:"sys_name" gorm:"type:varchar(255)" example:"core-sw-01"`
	SysDescr     string    `json:"sys_descr" gorm:"type:text" example:"Cisco IOS Software"`
	Location     string    `json:"location" gorm:"type:varchar(255)" example:"DataCenter-A"`
	Tags         JSON      `json:"tags" gorm:"type:json"`
	Metrics      JSON      `json:"metrics" gorm:"type:json" example:"{\"cpu_usage\":true,\"memory_usage\":true}"`
	Status       string    `json:"status" gorm:"type:varchar(20);default:discovered" example:"discovered"`
	LastSeen     time.Time `json:"last_seen" gorm:"autoUpdateTime"`
	FirstSeen    time.Time `json:"first_seen" gorm:"autoCreateTime"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// 请求和响应结构体

// CreateAlertRuleRequest 创建告警规则请求
type CreateAlertRuleRequest struct {
	Name          string            `json:"name" binding:"required" example:"CPU使用率告警"`
	Description   string            `json:"description" example:"当CPU使用率超过80%时触发告警"`
	Expression    string            `json:"expression" binding:"required" example:"cpu_usage > 80"`
	Duration      string            `json:"duration" example:"5m"`
	Severity      string            `json:"severity" binding:"required" example:"warning"`
	GroupID       string            `json:"group_id" example:"group-001"`
	DeviceGroupID string            `json:"device_group_id" example:"device-group-001"`
	Labels        map[string]string `json:"labels" example:"{\"team\":\"ops\"}"`
	Annotations   map[string]string `json:"annotations" example:"{\"summary\":\"CPU使用率过高\"}"`
}

// UpdateAlertRuleRequest 更新告警规则请求
type UpdateAlertRuleRequest struct {
	Name          *string            `json:"name,omitempty" example:"CPU使用率告警"`
	Description   *string            `json:"description,omitempty" example:"当CPU使用率超过80%时触发告警"`
	Expression    *string            `json:"expression,omitempty" example:"cpu_usage > 80"`
	Duration      *string            `json:"duration,omitempty" example:"5m"`
	Severity      *string            `json:"severity,omitempty" example:"warning"`
	Status        *string            `json:"status,omitempty" example:"active"`
	GroupID       *string            `json:"group_id,omitempty" example:"group-001"`
	DeviceGroupID *string            `json:"device_group_id,omitempty" example:"device-group-001"`
	Labels        map[string]string  `json:"labels,omitempty" example:"{\"team\":\"ops\"}"`
	Annotations   map[string]string  `json:"annotations,omitempty" example:"{\"summary\":\"CPU使用率过高\"}"`
}

// BatchCreateAlertRulesRequest 批量创建告警规则请求
type BatchCreateAlertRulesRequest struct {
	TemplateID    string   `json:"template_id" binding:"required" example:"template-001"`
	DeviceGroupIDs []string `json:"device_group_ids" binding:"required" example:"[\"group-001\",\"group-002\"]"`
	Variables     map[string]interface{} `json:"variables" example:"{\"threshold\":80}"`
	GroupID       string   `json:"group_id" example:"group-001"`
}

// BatchCreateAlertRulesResponse 批量创建告警规则响应
type BatchCreateAlertRulesResponse struct {
	SuccessCount int         `json:"success_count" example:"5"`
	FailureCount int         `json:"failure_count" example:"1"`
	CreatedRules []AlertRule `json:"created_rules"`
	Errors       []string    `json:"errors" example:"[\"设备组不存在: group-003\"]"`
}

// BatchUpdateAlertRulesRequest 批量更新告警规则请求
type BatchUpdateAlertRulesRequest struct {
	RuleIDs   []string           `json:"rule_ids" binding:"required" example:"[\"rule-001\",\"rule-002\"]"`
	Updates   map[string]interface{} `json:"updates" example:"{\"status\":\"inactive\"}"`
}

// BatchUpdateAlertRulesResponse 批量更新告警规则响应
type BatchUpdateAlertRulesResponse struct {
	SuccessCount int      `json:"success_count" example:"5"`
	FailureCount int      `json:"failure_count" example:"1"`
	Errors       []string `json:"errors" example:"[\"规则不存在: rule-999\"]"`
}

// CreateRuleTemplateRequest 创建规则模板请求
type CreateRuleTemplateRequest struct {
	Name        string                 `json:"name" binding:"required" example:"交换机CPU监控模板"`
	Description string                 `json:"description" example:"适用于交换机CPU使用率监控的通用模板"`
	Category    string                 `json:"category" example:"system"`
	Vendor      string                 `json:"vendor" example:"cisco"`
	DeviceType  string                 `json:"device_type" example:"switch"`
	Expression  string                 `json:"expression" binding:"required" example:"cpu_usage{job=\"switch\"} > {{.threshold}}"`
	Duration    string                 `json:"duration" example:"5m"`
	Severity    string                 `json:"severity" binding:"required" example:"warning"`
	Labels      map[string]string      `json:"labels" example:"{\"team\":\"ops\"}"`
	Annotations map[string]string      `json:"annotations" example:"{\"summary\":\"CPU使用率过高\"}"`
	Variables   map[string]interface{} `json:"variables" example:"{\"threshold\":{\"type\":\"number\",\"default\":80}}"`
}

// CloneRuleTemplateRequest 克隆规则模板请求
type CloneRuleTemplateRequest struct {
	Name        string `json:"name" binding:"required" example:"交换机CPU监控模板-副本"`
	Description string `json:"description" example:"从现有模板克隆的副本"`
}

// UpdateRuleTemplateRequest 更新规则模板请求
type UpdateRuleTemplateRequest struct {
	Name        *string                `json:"name,omitempty" example:"交换机CPU监控模板"`
	Description *string                `json:"description,omitempty" example:"适用于交换机CPU使用率监控的通用模板"`
	Category    *string                `json:"category,omitempty" example:"system"`
	Vendor      *string                `json:"vendor,omitempty" example:"cisco"`
	DeviceType  *string                `json:"device_type,omitempty" example:"switch"`
	Expression  *string                `json:"expression,omitempty" example:"cpu_usage{job=\"switch\"} > {{.threshold}}"`
	Duration    *string                `json:"duration,omitempty" example:"5m"`
	Severity    *string                `json:"severity,omitempty" example:"warning"`
	Labels      map[string]string      `json:"labels,omitempty" example:"{\"team\":\"ops\"}"`
	Annotations map[string]string      `json:"annotations,omitempty" example:"{\"summary\":\"CPU使用率过高\"}"`
	Variables   map[string]interface{} `json:"variables,omitempty" example:"{\"threshold\":{\"type\":\"number\",\"default\":80}}"`
}

// BatchCreateDeviceGroupsRequest 批量创建设备分组请求
type BatchCreateDeviceGroupsRequest struct {
	Groups []CreateDeviceGroupRequest `json:"groups" binding:"required"`
}

// BatchCreateDeviceGroupsResponse 批量创建设备分组响应
type BatchCreateDeviceGroupsResponse struct {
	SuccessCount   int           `json:"success_count" example:"5"`
	FailureCount   int           `json:"failure_count" example:"1"`
	CreatedGroups  []DeviceGroup `json:"created_groups"`
	Errors         []string      `json:"errors" example:"[\"设备分组名称重复: core-switches\"]"`
}

// BatchDeleteAlertRulesRequest 批量删除告警规则请求
type BatchDeleteAlertRulesRequest struct {
	RuleIDs []string `json:"rule_ids" binding:"required" example:"[\"rule-001\",\"rule-002\"]"`
}

// BatchDeleteAlertRulesResponse 批量删除告警规则响应
type BatchDeleteAlertRulesResponse struct {
	SuccessCount int      `json:"success_count" example:"5"`
	FailureCount int      `json:"failure_count" example:"1"`
	Errors       []string `json:"errors" example:"[\"规则不存在: rule-999\"]"`
}

// ApplyTemplateRequest 应用模板请求
type ApplyTemplateRequest struct {
	TemplateID     string                 `json:"template_id" binding:"required" example:"template-001"`
	DeviceGroupIDs []string               `json:"device_group_ids" binding:"required" example:"[\"group-001\",\"group-002\"]"`
	Variables      map[string]interface{} `json:"variables" example:"{\"threshold\":80}"`
	RuleGroupID    string                 `json:"rule_group_id" example:"group-001"`
}

// ApplyTemplateResponse 应用模板响应
type ApplyTemplateResponse struct {
	SuccessCount int         `json:"success_count" example:"5"`
	FailureCount int         `json:"failure_count" example:"1"`
	CreatedRules []AlertRule `json:"created_rules"`
	Errors       []string    `json:"errors" example:"[\"设备组不存在: group-003\"]"`
}

// CreateDeviceGroupRequest 创建设备分组请求
type CreateDeviceGroupRequest struct {
	Name        string                 `json:"name" binding:"required" example:"核心交换机组"`
	Description string                 `json:"description" example:"核心层交换机设备组"`
	Tags        map[string]string      `json:"tags" example:"{\"location\":\"datacenter1\",\"type\":\"switch\"}"`
	Selector    map[string]interface{} `json:"selector" example:"{\"job\":\"switch\",\"instance\":\"~192.168.1.*\"}"`
}

// UpdateDeviceGroupRequest 更新设备分组请求
type UpdateDeviceGroupRequest struct {
	Name        *string                `json:"name,omitempty" example:"核心交换机组"`
	Description *string                `json:"description,omitempty" example:"核心层交换机设备组"`
	Tags        map[string]string      `json:"tags,omitempty" example:"{\"location\":\"datacenter1\",\"type\":\"switch\"}"`
	Selector    map[string]interface{} `json:"selector,omitempty" example:"{\"job\":\"switch\",\"instance\":\"~192.168.1.*\"}"`
}

// AddDevicesToGroupRequest 添加设备到分组请求
type AddDevicesToGroupRequest struct {
	DeviceIDs []string `json:"device_ids" binding:"required" example:"[\"device-001\",\"device-002\"]"`
}

// RemoveDevicesFromGroupRequest 从分组移除设备请求
type RemoveDevicesFromGroupRequest struct {
	DeviceIDs []string `json:"device_ids" binding:"required" example:"[\"device-001\",\"device-002\"]"`
}

// UpdateAlertmanagerConfigRequest 更新Alertmanager配置请求
type UpdateAlertmanagerConfigRequest struct {
	Global       map[string]interface{} `json:"global,omitempty"`
	Route        map[string]interface{} `json:"route,omitempty"`
	Receivers    []interface{}          `json:"receivers,omitempty"`
	InhibitRules []interface{}          `json:"inhibit_rules,omitempty"`
	Templates    []interface{}          `json:"templates,omitempty"`
}

// SyncConfigRequest 同步配置请求
type SyncConfigRequest struct {
	Targets    []string `json:"targets" binding:"required" example:"[\"prometheus\",\"alertmanager\"]"`
	ConfigType string   `json:"config_type" example:"rules"`
	Force      bool     `json:"force" example:"false"`
}

// SyncConfigResponse 同步配置响应
type SyncConfigResponse struct {
	SuccessTargets []string `json:"success_targets" example:"[\"prometheus\"]"`
	FailureTargets []string `json:"failure_targets" example:"[\"alertmanager\"]"`
	Errors         []string `json:"errors" example:"[\"连接alertmanager失败\"]"`
	SyncID         string   `json:"sync_id" example:"sync-001"`
}

// DiscoverDevicesRequest 设备发现请求
type DiscoverDevicesRequest struct {
	TimeRange   string `json:"time_range" example:"1h"`
	JobFilter   string `json:"job_filter" example:"switch"`
	Force       bool   `json:"force" example:"false"`
	IPRange     string `json:"ip_range" example:"192.168.1.0/24"`
	Community   string `json:"community" example:"public"`
	SNMPVersion string `json:"snmp_version" example:"2c"`
}

// DiscoverDevicesResponse 设备发现响应
type DiscoverDevicesResponse struct {
	NewDevices     []DiscoveredDevice `json:"new_devices"`
	UpdatedDevices []DiscoveredDevice `json:"updated_devices"`
	OfflineDevices []DiscoveredDevice `json:"offline_devices"`
	TotalScanned   int                `json:"total_scanned" example:"50"`
	NewCount       int                `json:"new_count" example:"3"`
	UpdatedCount   int                `json:"updated_count" example:"2"`
	OfflineCount   int                `json:"offline_count" example:"1"`
}

// GenerateRecommendationsResponse 生成推荐响应
type GenerateRecommendationsResponse struct {
	GeneratedCount int                   `json:"generated_count" example:"5"`
	Recommendations []RuleRecommendation `json:"recommendations"`
	AnalysisTime   int                   `json:"analysis_time" example:"3000"`
}

// RejectRecommendationRequest 拒绝推荐请求
type RejectRecommendationRequest struct {
	Reason string `json:"reason" binding:"required" example:"当前阈值符合要求"`
}

// ValidatePromQLRequest 验证PromQL请求
type ValidatePromQLRequest struct {
	Expression string `json:"expression" binding:"required" example:"cpu_usage > 80"`
}

// ValidatePromQLResponse 验证PromQL响应
type ValidatePromQLResponse struct {
	Valid       bool     `json:"valid" example:"true"`
	Error       string   `json:"error,omitempty" example:"语法错误"`
	Suggestions []string `json:"suggestions,omitempty" example:"[\"使用rate()函数计算速率\"]"`
	Metrics     []string `json:"metrics,omitempty" example:"[\"cpu_usage\",\"memory_usage\"]"`
}

// ImportRulesResponse 导入规则响应
type ImportRulesResponse struct {
	SuccessCount   int         `json:"success_count" example:"10"`
	FailureCount   int         `json:"failure_count" example:"2"`
	ImportedRules  []AlertRule `json:"imported_rules"`
	Errors         []string    `json:"errors" example:"[\"规则名称重复: cpu_alert\"]"`
	SkippedCount   int         `json:"skipped_count" example:"1"`
}

// 过滤器结构体

// AlertRuleFilter 告警规则过滤器
type AlertRuleFilter struct {
	GroupID       string `json:"group_id,omitempty"`
	DeviceGroupID string `json:"device_group_id,omitempty"`
	Status        string `json:"status,omitempty"`
	Severity      string `json:"severity,omitempty"`
	Search        string `json:"search,omitempty"`
}

// RuleTemplateFilter 规则模板过滤器
type RuleTemplateFilter struct {
	Category   string `json:"category,omitempty"`
	Vendor     string `json:"vendor,omitempty"`
	DeviceType string `json:"device_type,omitempty"`
	Search     string `json:"search,omitempty"`
}

// RecommendationFilter 推荐过滤器
type RecommendationFilter struct {
	Type     string `json:"type,omitempty"`
	Priority string `json:"priority,omitempty"`
	Status   string `json:"status,omitempty"`
}

// 表名定义
func (AlertRule) TableName() string {
	return "alert_rules"
}

func (AlertRuleGroup) TableName() string {
	return "alert_rule_groups"
}

func (DeviceGroup) TableName() string {
	return "device_groups"
}

func (DeviceGroupDevice) TableName() string {
	return "device_group_devices"
}

func (AlertRuleTemplate) TableName() string {
	return "alert_rule_templates"
}

func (AlertmanagerConfig) TableName() string {
	return "alertmanager_configs"
}

func (SyncHistory) TableName() string {
	return "sync_history"
}

func (RuleRecommendation) TableName() string {
	return "rule_recommendations"
}

func (DiscoveredDevice) TableName() string {
	return "discovered_devices"
}

// QueryMetricsRequest Prometheus查询指标请求
type QueryMetricsRequest struct {
	Query      string                 `json:"query" binding:"required" example:"cpu_usage"`
	Start      string                 `json:"start,omitempty" example:"2024-01-01T00:00:00Z"`
	End        string                 `json:"end,omitempty" example:"2024-01-01T01:00:00Z"`
	Step       string                 `json:"step,omitempty" example:"5m"`
	Timeout    string                 `json:"timeout,omitempty" example:"30s"`
	Params     map[string]interface{} `json:"params,omitempty"`
}

// BatchDeleteDeviceGroupsRequest 批量删除设备分组请求
type BatchDeleteDeviceGroupsRequest struct {
	GroupIDs []string `json:"group_ids" binding:"required" example:"[\"group-001\",\"group-002\"]"`
	Force    bool     `json:"force,omitempty" example:"false"`
}