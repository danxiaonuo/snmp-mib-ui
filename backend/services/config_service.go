package services

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"text/template"
	"time"

	"github.com/go-redis/redis/v8"
	"gopkg.in/yaml.v3"
	"gorm.io/gorm"

	"mib-platform/models"
)

type ConfigService struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewConfigService(db *gorm.DB, redis *redis.Client) *ConfigService {
	return &ConfigService{
		db:    db,
		redis: redis,
	}
}

func (s *ConfigService) GetConfigs(page, limit int, configType string) ([]models.Config, int64, error) {
	var configs []models.Config
	var total int64

	query := s.db.Model(&models.Config{})

	if configType != "" {
		query = query.Where("type = ?", configType)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Preload("Device").Preload("Template").Offset(offset).Limit(limit).Find(&configs).Error; err != nil {
		return nil, 0, err
	}

	return configs, total, nil
}

func (s *ConfigService) GetConfig(id uint) (*models.Config, error) {
	var config models.Config
	if err := s.db.Preload("Device").Preload("Template").Preload("Versions").First(&config, id).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

func (s *ConfigService) CreateConfig(config *models.Config) error {
	return s.db.Create(config).Error
}

func (s *ConfigService) UpdateConfig(id uint, updates *models.Config) (*models.Config, error) {
	var config models.Config
	if err := s.db.First(&config, id).Error; err != nil {
		return nil, err
	}

	if err := s.db.Model(&config).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &config, nil
}

func (s *ConfigService) DeleteConfig(id uint) error {
	return s.db.Delete(&models.Config{}, id).Error
}

// 配置生成请求结构
type ConfigGenerationRequest struct {
	ConfigType   string                 `json:"config_type"`
	ConfigName   string                 `json:"config_name"`
	DeviceInfo   DeviceInfo            `json:"device_info"`
	SelectedOIDs []string              `json:"selected_oids"`
	Template     string                 `json:"template"`
	Options      map[string]interface{} `json:"options"`
}

type DeviceInfo struct {
	IP        string `json:"ip"`
	Community string `json:"community"`
	Version   string `json:"version"`
	Name      string `json:"name,omitempty"`
	Port      int    `json:"port,omitempty"`
}

// SNMP Exporter 配置结构
type SNMPExporterConfig struct {
	Modules map[string]SNMPModule `yaml:"modules"`
}

type SNMPModule struct {
	Walk    []string          `yaml:"walk"`
	Metrics []SNMPMetric      `yaml:"metrics"`
	Auth    SNMPAuth          `yaml:"auth"`
	Version int               `yaml:"version"`
	Timeout string            `yaml:"timeout,omitempty"`
	Retries int               `yaml:"retries,omitempty"`
}

type SNMPMetric struct {
	Name    string            `yaml:"name"`
	OID     string            `yaml:"oid"`
	Type    string            `yaml:"type"`
	Help    string            `yaml:"help"`
	Indexes []SNMPIndex       `yaml:"indexes,omitempty"`
	Lookups []SNMPLookup      `yaml:"lookups,omitempty"`
}

type SNMPIndex struct {
	LabelName string `yaml:"labelname"`
	Type      string `yaml:"type"`
}

type SNMPLookup struct {
	Labels    []string `yaml:"labels"`
	LabelName string   `yaml:"labelname"`
	OID       string   `yaml:"oid"`
	Type      string   `yaml:"type"`
}

type SNMPAuth struct {
	Community string `yaml:"community"`
}

// Categraf SNMP 配置结构
type CategrafSNMPConfig struct {
	Instances []CategrafSNMPInstance `toml:"instances"`
}

type CategrafSNMPInstance struct {
	Agents    []string              `toml:"agents"`
	Version   int                   `toml:"version"`
	Community string                `toml:"community"`
	Fields    []CategrafSNMPField   `toml:"field"`
	Tables    []CategrafSNMPTable   `toml:"table"`
	Timeout   string                `toml:"timeout"`
	Retries   int                   `toml:"retries"`
}

type CategrafSNMPField struct {
	Name string `toml:"name"`
	OID  string `toml:"oid"`
}

type CategrafSNMPTable struct {
	Name   string                `toml:"name"`
	OID    string                `toml:"oid"`
	Fields []CategrafSNMPField   `toml:"field"`
}

func (s *ConfigService) GenerateConfig(req ConfigGenerationRequest) (*models.Config, error) {
	var configContent string
	var err error

	// 根据配置类型生成不同格式的配置
	switch req.ConfigType {
	case "snmp_exporter":
		configContent, err = s.generateSNMPExporterConfig(req)
	case "categraf":
		configContent, err = s.generateCategrafConfig(req)
	default:
		return nil, fmt.Errorf("unsupported config type: %s", req.ConfigType)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to generate config: %v", err)
	}

	// 创建配置记录
	config := &models.Config{
		Name:        req.ConfigName,
		Type:        req.ConfigType,
		Content:     configContent,
		Status:      "generated",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// 保存到数据库
	if err := s.db.Create(config).Error; err != nil {
		return nil, fmt.Errorf("failed to save config: %v", err)
	}

	return config, nil
}

// 生成 SNMP Exporter 配置
func (s *ConfigService) generateSNMPExporterConfig(req ConfigGenerationRequest) (string, error) {
	// 获取 OID 信息
	oidMetrics, err := s.getOIDMetrics(req.SelectedOIDs)
	if err != nil {
		return "", fmt.Errorf("failed to get OID metrics: %v", err)
	}

	// 构建 SNMP Exporter 配置
	config := SNMPExporterConfig{
		Modules: map[string]SNMPModule{
			req.ConfigName: {
				Walk:    req.SelectedOIDs,
				Metrics: oidMetrics,
				Auth: SNMPAuth{
					Community: req.DeviceInfo.Community,
				},
				Version: s.getSNMPVersion(req.DeviceInfo.Version),
				Timeout: "5s",
				Retries: 3,
			},
		},
	}

	// 转换为 YAML
	yamlData, err := yaml.Marshal(config)
	if err != nil {
		return "", fmt.Errorf("failed to marshal YAML: %v", err)
	}

	return string(yamlData), nil
}

// 生成 Categraf 配置
func (s *ConfigService) generateCategrafConfig(req ConfigGenerationRequest) (string, error) {
	// 构建 Categraf 配置
	var fields []CategrafSNMPField
	for _, oid := range req.SelectedOIDs {
		// 获取 OID 名称
		name, err := s.getOIDName(oid)
		if err != nil {
			name = strings.ReplaceAll(oid, ".", "_")
		}
		
		fields = append(fields, CategrafSNMPField{
			Name: name,
			OID:  oid,
		})
	}

	// 创建 Categraf SNMP 配置结构（用于参考）
	_ = CategrafSNMPConfig{
		Instances: []CategrafSNMPInstance{
			{
				Agents:    []string{req.DeviceInfo.IP},
				Version:   s.getSNMPVersion(req.DeviceInfo.Version),
				Community: req.DeviceInfo.Community,
				Fields:    fields,
				Timeout:   "5s",
				Retries:   3,
			},
		},
	}

	// 转换为 TOML 格式（简化实现）
	var buf bytes.Buffer
	buf.WriteString("[[instances]]\n")
	buf.WriteString(fmt.Sprintf("agents = [\"%s\"]\n", req.DeviceInfo.IP))
	buf.WriteString(fmt.Sprintf("version = %d\n", s.getSNMPVersion(req.DeviceInfo.Version)))
	buf.WriteString(fmt.Sprintf("community = \"%s\"\n", req.DeviceInfo.Community))
	buf.WriteString("timeout = \"5s\"\n")
	buf.WriteString("retries = 3\n\n")

	for _, field := range fields {
		buf.WriteString("[[instances.field]]\n")
		buf.WriteString(fmt.Sprintf("name = \"%s\"\n", field.Name))
		buf.WriteString(fmt.Sprintf("oid = \"%s\"\n", field.OID))
		buf.WriteString("\n")
	}

	return buf.String(), nil
}

// 获取 OID 指标信息
func (s *ConfigService) getOIDMetrics(oids []string) ([]SNMPMetric, error) {
	var metrics []SNMPMetric

	for _, oid := range oids {
		var oidModel models.OID
		if err := s.db.Where("oid = ?", oid).First(&oidModel).Error; err != nil {
			// 如果数据库中没有找到，使用默认值
			metrics = append(metrics, SNMPMetric{
				Name: strings.ReplaceAll(oid, ".", "_"),
				OID:  oid,
				Type: "gauge",
				Help: fmt.Sprintf("SNMP metric for OID %s", oid),
			})
			continue
		}

		// 根据 SNMP 类型确定 Prometheus 类型
		promType := s.getPrometheusType(oidModel.Type)
		
		metrics = append(metrics, SNMPMetric{
			Name: oidModel.Name,
			OID:  oid,
			Type: promType,
			Help: oidModel.Description,
		})
	}

	return metrics, nil
}

// 获取 OID 名称
func (s *ConfigService) getOIDName(oid string) (string, error) {
	var oidModel models.OID
	if err := s.db.Where("oid = ?", oid).First(&oidModel).Error; err != nil {
		return "", err
	}
	return oidModel.Name, nil
}

// 转换 SNMP 版本
func (s *ConfigService) getSNMPVersion(version string) int {
	switch strings.ToLower(version) {
	case "v1", "1":
		return 1
	case "v2c", "2c", "2":
		return 2
	case "v3", "3":
		return 3
	default:
		return 2 // 默认使用 v2c
	}
}

// 转换为 Prometheus 指标类型
func (s *ConfigService) getPrometheusType(snmpType string) string {
	switch strings.ToLower(snmpType) {
	case "counter", "counter32", "counter64":
		return "counter"
	case "gauge", "gauge32", "integer32", "unsigned32":
		return "gauge"
	case "timeticks":
		return "counter"
	default:
		return "gauge"
	}
}

// 保存配置到文件系统
func (s *ConfigService) SaveConfigToFile(config *models.Config, targetPath string) error {
	// 确保目标目录存在
	dir := filepath.Dir(targetPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %v", err)
	}

	// 写入文件
	if err := ioutil.WriteFile(targetPath, []byte(config.Content), 0644); err != nil {
		return fmt.Errorf("failed to write config file: %v", err)
	}

	// 更新配置记录中的文件路径
	config.FilePath = targetPath
	if err := s.db.Save(config).Error; err != nil {
		return fmt.Errorf("failed to update config record: %v", err)
	}

	return nil
}

// 合并配置到现有文件
func (s *ConfigService) MergeConfigToFile(config *models.Config, targetPath string) error {
	var existingContent []byte
	var err error

	// 读取现有文件（如果存在）
	if _, err := os.Stat(targetPath); err == nil {
		existingContent, err = ioutil.ReadFile(targetPath)
		if err != nil {
			return fmt.Errorf("failed to read existing config: %v", err)
		}
	}

	// 根据配置类型进行合并
	var mergedContent string
	switch config.Type {
	case "snmp_exporter":
		mergedContent, err = s.mergeSNMPExporterConfig(string(existingContent), config.Content)
	case "categraf":
		mergedContent, err = s.mergeCategrafConfig(string(existingContent), config.Content)
	default:
		return fmt.Errorf("unsupported config type for merging: %s", config.Type)
	}

	if err != nil {
		return fmt.Errorf("failed to merge config: %v", err)
	}

	// 写入合并后的配置
	if err := ioutil.WriteFile(targetPath, []byte(mergedContent), 0644); err != nil {
		return fmt.Errorf("failed to write merged config: %v", err)
	}

	return nil
}

// 合并 SNMP Exporter 配置
func (s *ConfigService) mergeSNMPExporterConfig(existing, new string) (string, error) {
	var existingConfig, newConfig SNMPExporterConfig

	// 解析现有配置
	if existing != "" {
		if err := yaml.Unmarshal([]byte(existing), &existingConfig); err != nil {
			return "", fmt.Errorf("failed to parse existing config: %v", err)
		}
	} else {
		existingConfig.Modules = make(map[string]SNMPModule)
	}

	// 解析新配置
	if err := yaml.Unmarshal([]byte(new), &newConfig); err != nil {
		return "", fmt.Errorf("failed to parse new config: %v", err)
	}

	// 合并模块
	for name, module := range newConfig.Modules {
		existingConfig.Modules[name] = module
	}

	// 转换回 YAML
	mergedData, err := yaml.Marshal(existingConfig)
	if err != nil {
		return "", fmt.Errorf("failed to marshal merged config: %v", err)
	}

	return string(mergedData), nil
}

// 合并 Categraf 配置
func (s *ConfigService) mergeCategrafConfig(existing, new string) (string, error) {
	// 简单的文本合并（实际应用中可能需要更复杂的逻辑）
	if existing == "" {
		return new, nil
	}
	
	return existing + "\n\n" + new, nil
}

func (s *ConfigService) ValidateConfig(id uint) (map[string]interface{}, error) {
	config, err := s.GetConfig(id)
	if err != nil {
		return nil, err
	}

	errors := []string{}
	warnings := []string{}

	// Basic validation
	if config.Content == "" {
		errors = append(errors, "Configuration content is empty")
	}

	// Validate based on config type
	switch config.Type {
	case "snmp":
		errors, warnings = s.validateSNMPConfig(config.Content, errors, warnings)
	case "device":
		errors, warnings = s.validateDeviceConfig(config.Content, errors, warnings)
	case "template":
		errors, warnings = s.validateTemplateConfig(config.Content, errors, warnings)
	default:
		warnings = append(warnings, fmt.Sprintf("Unknown configuration type: %s", config.Type))
	}

	// Check if device exists (if device_id is set)
	if config.DeviceID != nil {
		var device models.Device
		if err := s.db.First(&device, *config.DeviceID).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Referenced device (ID: %d) not found", *config.DeviceID))
		}
	}

	// Check if template exists (if template_id is set)
	if config.TemplateID != nil {
		var template models.ConfigTemplate
		if err := s.db.First(&template, *config.TemplateID).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Referenced template (ID: %d) not found", *config.TemplateID))
		}
	}

	result := map[string]interface{}{
		"valid":    len(errors) == 0,
		"errors":   errors,
		"warnings": warnings,
	}

	return result, nil
}

func (s *ConfigService) GetTemplates(configType string) ([]models.ConfigTemplate, error) {
	var templates []models.ConfigTemplate
	query := s.db.Model(&models.ConfigTemplate{})

	if configType != "" {
		query = query.Where("type = ?", configType)
	}

	if err := query.Find(&templates).Error; err != nil {
		return nil, err
	}

	return templates, nil
}

func (s *ConfigService) CreateTemplate(template *models.ConfigTemplate) error {
	return s.db.Create(template).Error
}

func (s *ConfigService) GetConfigVersions(configID uint) ([]models.ConfigVersion, error) {
	var versions []models.ConfigVersion
	if err := s.db.Where("config_id = ?", configID).Order("created_at DESC").Find(&versions).Error; err != nil {
		return nil, err
	}
	return versions, nil
}

func (s *ConfigService) CompareConfigs(config1, config2, configType string) (map[string]interface{}, error) {
	// Simple line-by-line comparison
	lines1 := strings.Split(config1, "\n")
	lines2 := strings.Split(config2, "\n")

	var additions []string
	var deletions []string
	var modifications []string

	// Basic diff algorithm (simplified)
	maxLen := len(lines1)
	if len(lines2) > maxLen {
		maxLen = len(lines2)
	}

	for i := 0; i < maxLen; i++ {
		var line1, line2 string
		if i < len(lines1) {
			line1 = lines1[i]
		}
		if i < len(lines2) {
			line2 = lines2[i]
		}

		if line1 != line2 {
			if line1 == "" {
				additions = append(additions, fmt.Sprintf("+ %s", line2))
			} else if line2 == "" {
				deletions = append(deletions, fmt.Sprintf("- %s", line1))
			} else {
				modifications = append(modifications, fmt.Sprintf("~ %s -> %s", line1, line2))
			}
		}
	}

	return map[string]interface{}{
		"additions":     additions,
		"deletions":     deletions,
		"modifications": modifications,
		"stats": map[string]int{
			"total_changes": len(additions) + len(deletions) + len(modifications),
			"additions":     len(additions),
			"deletions":     len(deletions),
			"modifications": len(modifications),
		},
	}, nil
}

func (s *ConfigService) generateConfigContent(tmpl *models.ConfigTemplate, device *models.Device, oids []string, options map[string]interface{}) (string, error) {
	// Prepare template data
	data := map[string]interface{}{
		"Device":  device,
		"OIDs":    oids,
		"Options": options,
	}

	// Parse and execute template
	t, err := template.New("config").Parse(tmpl.Template)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %v", err)
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %v", err)
	}

	return buf.String(), nil
}

// validateSNMPConfig validates SNMP configuration content
func (s *ConfigService) validateSNMPConfig(content string, errors, warnings []string) ([]string, []string) {
	// Check for required SNMP fields
	if !strings.Contains(content, "community") && !strings.Contains(content, "username") {
		errors = append(errors, "SNMP configuration must contain either community string or username")
	}

	if strings.Contains(content, "version") {
		if !strings.Contains(content, "v1") && !strings.Contains(content, "v2c") && !strings.Contains(content, "v3") {
			warnings = append(warnings, "SNMP version should be v1, v2c, or v3")
		}
	} else {
		warnings = append(warnings, "SNMP version not specified, defaulting to v2c")
	}

	return errors, warnings
}

// validateDeviceConfig validates device configuration content
func (s *ConfigService) validateDeviceConfig(content string, errors, warnings []string) ([]string, []string) {
	// Check for required device fields
	if !strings.Contains(content, "ip_address") && !strings.Contains(content, "hostname") {
		errors = append(errors, "Device configuration must contain either ip_address or hostname")
	}

	if !strings.Contains(content, "port") {
		warnings = append(warnings, "Port not specified, will use default SNMP port 161")
	}

	return errors, warnings
}

// validateTemplateConfig validates template configuration content
func (s *ConfigService) validateTemplateConfig(content string, errors, warnings []string) ([]string, []string) {
	// Check for template syntax
	if !strings.Contains(content, "{{") || !strings.Contains(content, "}}") {
		warnings = append(warnings, "Template does not contain any placeholders")
	}

	// Check for common template variables
	commonVars := []string{"{{device_id}}", "{{timestamp}}", "{{oid_list}}"}
	foundVars := 0
	for _, v := range commonVars {
		if strings.Contains(content, v) {
			foundVars++
		}
	}

	if foundVars == 0 {
		warnings = append(warnings, "Template does not use any common variables")
	}

	return errors, warnings
}
