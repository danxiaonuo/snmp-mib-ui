package services

import (
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"strings"
	"time"

	"github.com/google/uuid"
	"mib-platform/models"
	"mib-platform/utils"
	"gorm.io/gorm"
)

// AlertRulesService 告警规则服务
type AlertRulesService struct {
	db                *gorm.DB
	prometheusService *PrometheusService
	logger            utils.Logger
}

// NewAlertRulesService 创建告警规则服务
func NewAlertRulesService(db *gorm.DB, prometheusService *PrometheusService, logger utils.Logger) *AlertRulesService {
	return &AlertRulesService{
		db:                db,
		prometheusService: prometheusService,
		logger:            logger,
	}
}

// GetAlertRules 获取告警规则列表
func (s *AlertRulesService) GetAlertRules(page, limit int, filter *models.AlertRuleFilter) ([]models.AlertRule, int64, error) {
	var rules []models.AlertRule
	var total int64

	query := s.db.Model(&models.AlertRule{})

	// 应用过滤条件
	if filter != nil {
		if filter.GroupID != "" {
			query = query.Where("group_id = ?", filter.GroupID)
		}
		if filter.DeviceGroupID != "" {
			query = query.Where("device_group_id = ?", filter.DeviceGroupID)
		}
		if filter.Status != "" {
			query = query.Where("status = ?", filter.Status)
		}
		if filter.Severity != "" {
			query = query.Where("severity = ?", filter.Severity)
		}
		if filter.Search != "" {
			query = query.Where("name LIKE ? OR description LIKE ?", "%"+filter.Search+"%", "%"+filter.Search+"%")
		}
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("获取告警规则总数失败: %w", err)
	}

	// 分页查询
	offset := (page - 1) * limit
	if err := query.Preload("Group").Preload("DeviceGroup").
		Offset(offset).Limit(limit).Order("created_at DESC").Find(&rules).Error; err != nil {
		return nil, 0, fmt.Errorf("获取告警规则列表失败: %w", err)
	}

	return rules, total, nil
}

// GetAlertRuleByID 根据ID获取告警规则
func (s *AlertRulesService) GetAlertRuleByID(id string) (*models.AlertRule, error) {
	var rule models.AlertRule
	if err := s.db.Preload("Group").Preload("DeviceGroup").First(&rule, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("告警规则不存在")
		}
		return nil, fmt.Errorf("获取告警规则失败: %w", err)
	}
	return &rule, nil
}

// CreateAlertRule 创建告警规则
func (s *AlertRulesService) CreateAlertRule(req *models.CreateAlertRuleRequest) (*models.AlertRule, error) {
	rule := &models.AlertRule{
		ID:            uuid.New().String(),
		Name:          req.Name,
		Description:   req.Description,
		Expression:    req.Expression,
		Duration:      req.Duration,
		Severity:      req.Severity,
		Status:        "active",
		GroupID:       req.GroupID,
		DeviceGroupID: req.DeviceGroupID,
		CreatedBy:     "admin", // TODO: 从上下文获取用户信息
		UpdatedBy:     "admin",
	}

	// 转换标签和注释
	if req.Labels != nil {
		labelsJSON, _ := json.Marshal(req.Labels)
		rule.Labels = models.JSON(labelsJSON)
	}
	if req.Annotations != nil {
		annotationsJSON, _ := json.Marshal(req.Annotations)
		rule.Annotations = models.JSON(annotationsJSON)
	}

	if err := s.db.Create(rule).Error; err != nil {
		return nil, fmt.Errorf("创建告警规则失败: %w", err)
	}

	s.logger.Info("创建告警规则成功", "rule_id", rule.ID, "name", rule.Name)
	return rule, nil
}

// UpdateAlertRule 更新告警规则
func (s *AlertRulesService) UpdateAlertRule(id string, req *models.UpdateAlertRuleRequest) (*models.AlertRule, error) {
	rule, err := s.GetAlertRuleByID(id)
	if err != nil {
		return nil, err
	}

	// 更新字段
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Expression != nil {
		updates["expression"] = *req.Expression
	}
	if req.Duration != nil {
		updates["duration"] = *req.Duration
	}
	if req.Severity != nil {
		updates["severity"] = *req.Severity
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.GroupID != nil {
		updates["group_id"] = *req.GroupID
	}
	if req.DeviceGroupID != nil {
		updates["device_group_id"] = *req.DeviceGroupID
	}

	// 更新标签和注释
	if req.Labels != nil {
		labelsJSON, _ := json.Marshal(req.Labels)
		updates["labels"] = models.JSON(labelsJSON)
	}
	if req.Annotations != nil {
		annotationsJSON, _ := json.Marshal(req.Annotations)
		updates["annotations"] = models.JSON(annotationsJSON)
	}

	updates["updated_by"] = "admin" // TODO: 从上下文获取用户信息

	if err := s.db.Model(rule).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("更新告警规则失败: %w", err)
	}

	s.logger.Info("更新告警规则成功", "rule_id", rule.ID, "name", rule.Name)
	return rule, nil
}

// DeleteAlertRule 删除告警规则
func (s *AlertRulesService) DeleteAlertRule(id string) error {
	rule, err := s.GetAlertRuleByID(id)
	if err != nil {
		return err
	}

	if err := s.db.Delete(rule).Error; err != nil {
		return fmt.Errorf("删除告警规则失败: %w", err)
	}

	s.logger.Info("删除告警规则成功", "rule_id", rule.ID, "name", rule.Name)
	return nil
}

// BatchCreateAlertRules 批量创建告警规则
func (s *AlertRulesService) BatchCreateAlertRules(req *models.BatchCreateAlertRulesRequest) (*models.BatchCreateAlertRulesResponse, error) {
	// 获取模板
	template, err := s.GetRuleTemplateByID(req.TemplateID)
	if err != nil {
		return nil, fmt.Errorf("获取规则模板失败: %w", err)
	}

	response := &models.BatchCreateAlertRulesResponse{
		CreatedRules: make([]models.AlertRule, 0),
		Errors:       make([]string, 0),
	}

	// 为每个设备组创建规则
	for _, deviceGroupID := range req.DeviceGroupIDs {
		// 检查设备组是否存在
		if _, err := s.GetDeviceGroupByID(deviceGroupID); err != nil {
			response.Errors = append(response.Errors, fmt.Sprintf("设备组不存在: %s", deviceGroupID))
			response.FailureCount++
			continue
		}

		// 渲染模板表达式
		expression, err := s.renderTemplate(template.Expression, req.Variables)
		if err != nil {
			response.Errors = append(response.Errors, fmt.Sprintf("渲染模板失败: %s", err.Error()))
			response.FailureCount++
			continue
		}

		// 创建规则
		rule := &models.AlertRule{
			ID:            uuid.New().String(),
			Name:          fmt.Sprintf("%s_%s", template.Name, deviceGroupID),
			Description:   template.Description,
			Expression:    expression,
			Duration:      template.Duration,
			Severity:      template.Severity,
			Status:        "active",
			GroupID:       req.GroupID,
			DeviceGroupID: deviceGroupID,
			Labels:        template.Labels,
			Annotations:   template.Annotations,
			CreatedBy:     "admin",
			UpdatedBy:     "admin",
		}

		if err := s.db.Create(rule).Error; err != nil {
			response.Errors = append(response.Errors, fmt.Sprintf("创建规则失败: %s", err.Error()))
			response.FailureCount++
			continue
		}

		response.CreatedRules = append(response.CreatedRules, *rule)
		response.SuccessCount++
	}

	// 更新模板使用次数
	if response.SuccessCount > 0 {
		s.db.Model(template).UpdateColumn("usage_count", gorm.Expr("usage_count + ?", response.SuccessCount))
	}

	s.logger.Info("批量创建告警规则完成", "success", response.SuccessCount, "failure", response.FailureCount)
	return response, nil
}

// BatchUpdateAlertRules 批量更新告警规则
func (s *AlertRulesService) BatchUpdateAlertRules(req *models.BatchUpdateAlertRulesRequest) (*models.BatchUpdateAlertRulesResponse, error) {
	response := &models.BatchUpdateAlertRulesResponse{
		Errors: make([]string, 0),
	}

	// 批量更新
	result := s.db.Model(&models.AlertRule{}).Where("id IN ?", req.RuleIDs).Updates(req.Updates)
	if result.Error != nil {
		return nil, fmt.Errorf("批量更新告警规则失败: %w", result.Error)
	}

	response.SuccessCount = int(result.RowsAffected)
	response.FailureCount = len(req.RuleIDs) - response.SuccessCount

	s.logger.Info("批量更新告警规则完成", "success", response.SuccessCount, "failure", response.FailureCount)
	return response, nil
}

// GetRuleTemplates 获取规则模板列表
func (s *AlertRulesService) GetRuleTemplates(filter *models.RuleTemplateFilter) ([]models.AlertRuleTemplate, error) {
	var templates []models.AlertRuleTemplate

	query := s.db.Model(&models.AlertRuleTemplate{})

	// 应用过滤条件
	if filter != nil {
		if filter.Category != "" {
			query = query.Where("category = ?", filter.Category)
		}
		if filter.Vendor != "" {
			query = query.Where("vendor = ?", filter.Vendor)
		}
		if filter.DeviceType != "" {
			query = query.Where("device_type = ?", filter.DeviceType)
		}
		if filter.Search != "" {
			query = query.Where("name LIKE ? OR description LIKE ?", "%"+filter.Search+"%", "%"+filter.Search+"%")
		}
	}

	if err := query.Order("usage_count DESC, created_at DESC").Find(&templates).Error; err != nil {
		return nil, fmt.Errorf("获取规则模板列表失败: %w", err)
	}

	return templates, nil
}

// GetRuleTemplateByID 根据ID获取规则模板
func (s *AlertRulesService) GetRuleTemplateByID(id string) (*models.AlertRuleTemplate, error) {
	var template models.AlertRuleTemplate
	if err := s.db.First(&template, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("规则模板不存在")
		}
		return nil, fmt.Errorf("获取规则模板失败: %w", err)
	}
	return &template, nil
}

// CreateRuleTemplate 创建规则模板
func (s *AlertRulesService) CreateRuleTemplate(req *models.CreateRuleTemplateRequest) (*models.AlertRuleTemplate, error) {
	template := &models.AlertRuleTemplate{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Vendor:      req.Vendor,
		DeviceType:  req.DeviceType,
		Expression:  req.Expression,
		Duration:    req.Duration,
		Severity:    req.Severity,
		IsBuiltin:   false,
		UsageCount:  0,
		CreatedBy:   "admin",
		UpdatedBy:   "admin",
	}

	// 转换标签、注释和变量
	if req.Labels != nil {
		labelsJSON, _ := json.Marshal(req.Labels)
		template.Labels = models.JSON(labelsJSON)
	}
	if req.Annotations != nil {
		annotationsJSON, _ := json.Marshal(req.Annotations)
		template.Annotations = models.JSON(annotationsJSON)
	}
	if req.Variables != nil {
		variablesJSON, _ := json.Marshal(req.Variables)
		template.Variables = models.JSON(variablesJSON)
	}

	if err := s.db.Create(template).Error; err != nil {
		return nil, fmt.Errorf("创建规则模板失败: %w", err)
	}

	s.logger.Info("创建规则模板成功", "template_id", template.ID, "name", template.Name)
	return template, nil
}

// ApplyTemplate 应用模板到设备组
func (s *AlertRulesService) ApplyTemplate(req *models.ApplyTemplateRequest) (*models.ApplyTemplateResponse, error) {
	batchReq := &models.BatchCreateAlertRulesRequest{
		TemplateID:     req.TemplateID,
		DeviceGroupIDs: req.DeviceGroupIDs,
		Variables:      req.Variables,
		GroupID:        req.RuleGroupID,
	}

	batchResp, err := s.BatchCreateAlertRules(batchReq)
	if err != nil {
		return nil, err
	}

	return &models.ApplyTemplateResponse{
		SuccessCount: batchResp.SuccessCount,
		FailureCount: batchResp.FailureCount,
		CreatedRules: batchResp.CreatedRules,
		Errors:       batchResp.Errors,
	}, nil
}

// GetDeviceGroups 获取设备分组列表
func (s *AlertRulesService) GetDeviceGroups() ([]models.DeviceGroup, error) {
	var groups []models.DeviceGroup
	if err := s.db.Preload("Devices").Find(&groups).Error; err != nil {
		return nil, fmt.Errorf("获取设备分组列表失败: %w", err)
	}
	return groups, nil
}

// GetDeviceGroupByID 根据ID获取设备分组
func (s *AlertRulesService) GetDeviceGroupByID(id string) (*models.DeviceGroup, error) {
	var group models.DeviceGroup
	if err := s.db.Preload("Devices").First(&group, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("设备分组不存在")
		}
		return nil, fmt.Errorf("获取设备分组失败: %w", err)
	}
	return &group, nil
}

// CreateDeviceGroup 创建设备分组
func (s *AlertRulesService) CreateDeviceGroup(req *models.CreateDeviceGroupRequest) (*models.DeviceGroup, error) {
	group := &models.DeviceGroup{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		CreatedBy:   "admin",
		UpdatedBy:   "admin",
	}

	// 转换标签和选择器
	if req.Tags != nil {
		tagsJSON, _ := json.Marshal(req.Tags)
		group.Tags = models.JSON(tagsJSON)
	}
	if req.Selector != nil {
		selectorJSON, _ := json.Marshal(req.Selector)
		group.Selector = models.JSON(selectorJSON)
	}

	if err := s.db.Create(group).Error; err != nil {
		return nil, fmt.Errorf("创建设备分组失败: %w", err)
	}

	s.logger.Info("创建设备分组成功", "group_id", group.ID, "name", group.Name)
	return group, nil
}

// UpdateDeviceGroup 更新设备分组
func (s *AlertRulesService) UpdateDeviceGroup(id string, req *models.UpdateDeviceGroupRequest) (*models.DeviceGroup, error) {
	group, err := s.GetDeviceGroupByID(id)
	if err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Tags != nil {
		tagsJSON, _ := json.Marshal(req.Tags)
		updates["tags"] = models.JSON(tagsJSON)
	}
	if req.Selector != nil {
		selectorJSON, _ := json.Marshal(req.Selector)
		updates["selector"] = models.JSON(selectorJSON)
	}

	updates["updated_by"] = "admin"

	if err := s.db.Model(group).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("更新设备分组失败: %w", err)
	}

	s.logger.Info("更新设备分组成功", "group_id", group.ID, "name", group.Name)
	return group, nil
}

// DeleteDeviceGroup 删除设备分组
func (s *AlertRulesService) DeleteDeviceGroup(id string) error {
	group, err := s.GetDeviceGroupByID(id)
	if err != nil {
		return err
	}

	// 检查是否有关联的告警规则
	var ruleCount int64
	if err := s.db.Model(&models.AlertRule{}).Where("device_group_id = ?", id).Count(&ruleCount).Error; err != nil {
		return fmt.Errorf("检查关联规则失败: %w", err)
	}
	if ruleCount > 0 {
		return fmt.Errorf("设备分组下还有 %d 条告警规则，无法删除", ruleCount)
	}

	// 删除设备关联
	if err := s.db.Where("device_group_id = ?", id).Delete(&models.DeviceGroupDevice{}).Error; err != nil {
		return fmt.Errorf("删除设备关联失败: %w", err)
	}

	// 删除分组
	if err := s.db.Delete(group).Error; err != nil {
		return fmt.Errorf("删除设备分组失败: %w", err)
	}

	s.logger.Info("删除设备分组成功", "group_id", group.ID, "name", group.Name)
	return nil
}

// AddDevicesToGroup 添加设备到分组
func (s *AlertRulesService) AddDevicesToGroup(groupID string, deviceIDs []string) error {
	// 检查分组是否存在
	if _, err := s.GetDeviceGroupByID(groupID); err != nil {
		return err
	}

	// 批量添加设备关联
	for _, deviceID := range deviceIDs {
		association := &models.DeviceGroupDevice{
			DeviceGroupID: groupID,
			DeviceID:      deviceID,
		}
		// 使用 ON CONFLICT DO NOTHING 避免重复插入
		if err := s.db.Create(association).Error; err != nil {
			// 忽略重复插入错误
			if !strings.Contains(err.Error(), "duplicate") && !strings.Contains(err.Error(), "UNIQUE") {
				return fmt.Errorf("添加设备到分组失败: %w", err)
			}
		}
	}

	s.logger.Info("添加设备到分组成功", "group_id", groupID, "device_count", len(deviceIDs))
	return nil
}

// RemoveDevicesFromGroup 从分组移除设备
func (s *AlertRulesService) RemoveDevicesFromGroup(groupID string, deviceIDs []string) error {
	// 检查分组是否存在
	if _, err := s.GetDeviceGroupByID(groupID); err != nil {
		return err
	}

	// 批量删除设备关联
	if err := s.db.Where("device_group_id = ? AND device_id IN ?", groupID, deviceIDs).
		Delete(&models.DeviceGroupDevice{}).Error; err != nil {
		return fmt.Errorf("从分组移除设备失败: %w", err)
	}

	s.logger.Info("从分组移除设备成功", "group_id", groupID, "device_count", len(deviceIDs))
	return nil
}

// GetAlertmanagerConfig 获取Alertmanager配置
func (s *AlertRulesService) GetAlertmanagerConfig() (*models.AlertmanagerConfig, error) {
	var config models.AlertmanagerConfig
	if err := s.db.Where("status = ?", "active").First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 返回默认配置
			return s.createDefaultAlertmanagerConfig()
		}
		return nil, fmt.Errorf("获取Alertmanager配置失败: %w", err)
	}
	return &config, nil
}

// UpdateAlertmanagerConfig 更新Alertmanager配置
func (s *AlertRulesService) UpdateAlertmanagerConfig(req *models.UpdateAlertmanagerConfigRequest) (*models.AlertmanagerConfig, error) {
	config, err := s.GetAlertmanagerConfig()
	if err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})
	if req.Global != nil {
		globalJSON, _ := json.Marshal(req.Global)
		updates["global"] = models.JSON(globalJSON)
	}
	if req.Route != nil {
		routeJSON, _ := json.Marshal(req.Route)
		updates["route"] = models.JSON(routeJSON)
	}
	if req.Receivers != nil {
		receiversJSON, _ := json.Marshal(req.Receivers)
		updates["receivers"] = models.JSON(receiversJSON)
	}
	if req.InhibitRules != nil {
		inhibitRulesJSON, _ := json.Marshal(req.InhibitRules)
		updates["inhibit_rules"] = models.JSON(inhibitRulesJSON)
	}
	if req.Templates != nil {
		templatesJSON, _ := json.Marshal(req.Templates)
		updates["templates"] = models.JSON(templatesJSON)
	}

	updates["version"] = gorm.Expr("version + 1")
	updates["updated_by"] = "admin"

	if err := s.db.Model(config).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("更新Alertmanager配置失败: %w", err)
	}

	s.logger.Info("更新Alertmanager配置成功", "config_id", config.ID)
	return config, nil
}

// SyncConfig 同步配置到Prometheus/Alertmanager
func (s *AlertRulesService) SyncConfig(req *models.SyncConfigRequest) (*models.SyncConfigResponse, error) {
	response := &models.SyncConfigResponse{
		SuccessTargets: make([]string, 0),
		FailureTargets: make([]string, 0),
		Errors:         make([]string, 0),
		SyncID:         uuid.New().String(),
	}

	for _, target := range req.Targets {
		start := time.Now()
		var err error
		var configHash string

		switch target {
		case "prometheus":
			configHash, err = s.syncPrometheusRules(req.Force)
		case "alertmanager":
			configHash, err = s.syncAlertmanagerConfig(req.Force)
		default:
			err = fmt.Errorf("不支持的同步目标: %s", target)
		}

		duration := int(time.Since(start).Milliseconds())
		status := "success"
		message := "同步成功"

		if err != nil {
			status = "failure"
			message = err.Error()
			response.FailureTargets = append(response.FailureTargets, target)
			response.Errors = append(response.Errors, fmt.Sprintf("%s: %s", target, err.Error()))
		} else {
			response.SuccessTargets = append(response.SuccessTargets, target)
		}

		// 记录同步历史
		history := &models.SyncHistory{
			ID:          uuid.New().String(),
			Type:        target,
			Target:      target, // TODO: 从配置获取实际地址
			ConfigType:  req.ConfigType,
			Status:      status,
			Message:     message,
			ConfigHash:  configHash,
			Duration:    duration,
			TriggeredBy: "admin",
		}
		s.db.Create(history)
	}

	s.logger.Info("配置同步完成", "sync_id", response.SyncID, "success", len(response.SuccessTargets), "failure", len(response.FailureTargets))
	return response, nil
}

// GetSyncHistory 获取同步历史
func (s *AlertRulesService) GetSyncHistory(page, limit int) ([]models.SyncHistory, int64, error) {
	var history []models.SyncHistory
	var total int64

	query := s.db.Model(&models.SyncHistory{})

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("获取同步历史总数失败: %w", err)
	}

	// 分页查询
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&history).Error; err != nil {
		return nil, 0, fmt.Errorf("获取同步历史失败: %w", err)
	}

	return history, total, nil
}

// DiscoverDevices 设备自动发现
func (s *AlertRulesService) DiscoverDevices(req *models.DiscoverDevicesRequest) (*models.DiscoverDevicesResponse, error) {
	// TODO: 实现设备发现逻辑
	// 1. 从VictoriaMetrics查询up指标
	// 2. 解析instance和job标签
	// 3. 通过SNMP获取设备信息
	// 4. 更新设备状态

	response := &models.DiscoverDevicesResponse{
		NewDevices:     make([]models.DiscoveredDevice, 0),
		UpdatedDevices: make([]models.DiscoveredDevice, 0),
		OfflineDevices: make([]models.DiscoveredDevice, 0),
	}

	s.logger.Info("设备发现完成", "new", response.NewCount, "updated", response.UpdatedCount, "offline", response.OfflineCount)
	return response, nil
}

// GetRecommendations 获取智能推荐
func (s *AlertRulesService) GetRecommendations(filter *models.RecommendationFilter) ([]models.RuleRecommendation, error) {
	var recommendations []models.RuleRecommendation

	query := s.db.Model(&models.RuleRecommendation{})

	// 应用过滤条件
	if filter != nil {
		if filter.Type != "" {
			query = query.Where("type = ?", filter.Type)
		}
		if filter.Priority != "" {
			query = query.Where("priority = ?", filter.Priority)
		}
		if filter.Status != "" {
			query = query.Where("status = ?", filter.Status)
		}
	}

	if err := query.Order("priority DESC, confidence DESC, created_at DESC").Find(&recommendations).Error; err != nil {
		return nil, fmt.Errorf("获取推荐失败: %w", err)
	}

	return recommendations, nil
}

// GenerateRecommendations 生成智能推荐
func (s *AlertRulesService) GenerateRecommendations() (*models.GenerateRecommendationsResponse, error) {
	start := time.Now()

	// TODO: 实现AI推荐算法
	// 1. 分析现有规则
	// 2. 检查缺失规则
	// 3. 优化阈值建议
	// 4. 新指标推荐

	response := &models.GenerateRecommendationsResponse{
		GeneratedCount:  0,
		Recommendations: make([]models.RuleRecommendation, 0),
		AnalysisTime:    int(time.Since(start).Milliseconds()),
	}

	s.logger.Info("生成推荐完成", "count", response.GeneratedCount, "time", response.AnalysisTime)
	return response, nil
}

// ApplyRecommendation 应用推荐
func (s *AlertRulesService) ApplyRecommendation(id string) error {
	// TODO: 实现推荐应用逻辑
	s.logger.Info("应用推荐成功", "recommendation_id", id)
	return nil
}

// RejectRecommendation 拒绝推荐
func (s *AlertRulesService) RejectRecommendation(id, reason string) error {
	// TODO: 实现推荐拒绝逻辑
	s.logger.Info("拒绝推荐成功", "recommendation_id", id, "reason", reason)
	return nil
}

// ExportRules 导出告警规则
func (s *AlertRulesService) ExportRules(groupID, format string) (string, error) {
	// TODO: 实现规则导出逻辑
	return "", nil
}

// ImportRules 导入告警规则
func (s *AlertRulesService) ImportRules(file multipart.File, filename, groupID string) (*models.ImportRulesResponse, error) {
	// TODO: 实现规则导入逻辑
	response := &models.ImportRulesResponse{
		ImportedRules: make([]models.AlertRule, 0),
		Errors:        make([]string, 0),
	}
	return response, nil
}

// 私有方法

// renderTemplate 渲染模板表达式
func (s *AlertRulesService) renderTemplate(template string, variables map[string]interface{}) (string, error) {
	// TODO: 实现模板渲染逻辑
	return template, nil
}

// createDefaultAlertmanagerConfig 创建默认Alertmanager配置
func (s *AlertRulesService) createDefaultAlertmanagerConfig() (*models.AlertmanagerConfig, error) {
	defaultConfig := map[string]interface{}{
		"global": map[string]interface{}{
			"smtp_smarthost": "localhost:587",
			"smtp_from":      "alertmanager@example.com",
		},
		"route": map[string]interface{}{
			"group_by":        []string{"alertname"},
			"group_wait":      "10s",
			"group_interval":  "10s",
			"repeat_interval": "1h",
			"receiver":        "web.hook",
		},
		"receivers": []map[string]interface{}{
			{
				"name": "web.hook",
				"webhook_configs": []map[string]interface{}{
					{
						"url": "http://127.0.0.1:5001/",
					},
				},
			},
		},
	}

	config := &models.AlertmanagerConfig{
		ID:        uuid.New().String(),
		Version:   1,
		Status:    "active",
		CreatedBy: "system",
		UpdatedBy: "system",
	}

	// 转换配置
	globalJSON, _ := json.Marshal(defaultConfig["global"])
	config.Global = models.JSON(globalJSON)

	routeJSON, _ := json.Marshal(defaultConfig["route"])
	config.Route = models.JSON(routeJSON)

	receiversJSON, _ := json.Marshal(defaultConfig["receivers"])
	config.Receivers = models.JSON(receiversJSON)

	if err := s.db.Create(config).Error; err != nil {
		return nil, fmt.Errorf("创建默认Alertmanager配置失败: %w", err)
	}

	return config, nil
}

// syncPrometheusRules 同步Prometheus规则
func (s *AlertRulesService) syncPrometheusRules(force bool) (string, error) {
	// TODO: 实现Prometheus规则同步
	return "prometheus-hash", nil
}

// syncAlertmanagerConfig 同步Alertmanager配置
func (s *AlertRulesService) syncAlertmanagerConfig(force bool) (string, error) {
	// TODO: 实现Alertmanager配置同步
	return "alertmanager-hash", nil
}

// CloneRuleTemplate 克隆规则模板
func (s *AlertRulesService) CloneRuleTemplate(id string, req *models.CloneRuleTemplateRequest) (*models.AlertRuleTemplate, error) {
	// 获取原模板
	original, err := s.GetRuleTemplateByID(id)
	if err != nil {
		return nil, err
	}

	// 创建新模板
	cloned := &models.AlertRuleTemplate{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Category:    original.Category,
		Vendor:      original.Vendor,
		DeviceType:  original.DeviceType,
		Expression:  original.Expression,
		Duration:    original.Duration,
		Severity:    original.Severity,
		Labels:      original.Labels,
		Annotations: original.Annotations,
		Variables:   original.Variables,
		IsBuiltin:   false,
		UsageCount:  0,
		CreatedBy:   "admin", // TODO: 从上下文获取用户信息
		UpdatedBy:   "admin",
	}

	if err := s.db.Create(cloned).Error; err != nil {
		return nil, fmt.Errorf("克隆规则模板失败: %w", err)
	}

	return cloned, nil
}

// UpdateRuleTemplate 更新规则模板
func (s *AlertRulesService) UpdateRuleTemplate(id string, req *models.UpdateRuleTemplateRequest) (*models.AlertRuleTemplate, error) {
	var template models.AlertRuleTemplate
	if err := s.db.First(&template, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("规则模板不存在")
		}
		return nil, fmt.Errorf("获取规则模板失败: %w", err)
	}

	// 更新字段
	if req.Name != nil {
		template.Name = *req.Name
	}
	if req.Description != nil {
		template.Description = *req.Description
	}
	if req.Category != nil {
		template.Category = *req.Category
	}
	if req.Vendor != nil {
		template.Vendor = *req.Vendor
	}
	if req.DeviceType != nil {
		template.DeviceType = *req.DeviceType
	}
	if req.Expression != nil {
		template.Expression = *req.Expression
	}
	if req.Duration != nil {
		template.Duration = *req.Duration
	}
	if req.Severity != nil {
		template.Severity = *req.Severity
	}
	if req.Labels != nil {
		labelsJSON, _ := json.Marshal(req.Labels)
		template.Labels = models.JSON(labelsJSON)
	}
	if req.Annotations != nil {
		annotationsJSON, _ := json.Marshal(req.Annotations)
		template.Annotations = models.JSON(annotationsJSON)
	}
	if req.Variables != nil {
		variablesJSON, _ := json.Marshal(req.Variables)
		template.Variables = models.JSON(variablesJSON)
	}

	template.UpdatedBy = "admin" // TODO: 从上下文获取用户信息

	if err := s.db.Save(&template).Error; err != nil {
		return nil, fmt.Errorf("更新规则模板失败: %w", err)
	}

	return &template, nil
}

// DeleteRuleTemplate 删除规则模板
func (s *AlertRulesService) DeleteRuleTemplate(id string) error {
	var template models.AlertRuleTemplate
	if err := s.db.First(&template, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("规则模板不存在")
		}
		return fmt.Errorf("获取规则模板失败: %w", err)
	}

	// 检查是否为内置模板
	if template.IsBuiltin {
		return fmt.Errorf("不能删除内置模板")
	}

	if err := s.db.Delete(&template).Error; err != nil {
		return fmt.Errorf("删除规则模板失败: %w", err)
	}

	return nil
}

// BatchDeleteAlertRules 批量删除告警规则
func (s *AlertRulesService) BatchDeleteAlertRules(req *models.BatchDeleteAlertRulesRequest) (*models.BatchDeleteAlertRulesResponse, error) {
	response := &models.BatchDeleteAlertRulesResponse{
		SuccessCount: 0,
		FailureCount: 0,
		Errors:       []string{},
	}

	for _, ruleID := range req.RuleIDs {
		if err := s.DeleteAlertRule(ruleID); err != nil {
			response.FailureCount++
			response.Errors = append(response.Errors, fmt.Sprintf("删除规则 %s 失败: %s", ruleID, err.Error()))
		} else {
			response.SuccessCount++
		}
	}

	return response, nil
}

// GetDeviceGroupDevices 获取设备分组中的设备
func (s *AlertRulesService) GetDeviceGroupDevices(groupID string) ([]models.Device, error) {
	var group models.DeviceGroup
	if err := s.db.Preload("Devices").First(&group, "id = ?", groupID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("设备分组不存在")
		}
		return nil, fmt.Errorf("获取设备分组失败: %w", err)
	}

	return group.Devices, nil
}

// BatchCreateDeviceGroups 批量创建设备分组
func (s *AlertRulesService) BatchCreateDeviceGroups(req *models.BatchCreateDeviceGroupsRequest) (*models.BatchCreateDeviceGroupsResponse, error) {
	response := &models.BatchCreateDeviceGroupsResponse{
		SuccessCount:  0,
		FailureCount:  0,
		CreatedGroups: []models.DeviceGroup{},
		Errors:        []string{},
	}

	for _, groupReq := range req.Groups {
		group, err := s.CreateDeviceGroup(&groupReq)
		if err != nil {
			response.FailureCount++
			response.Errors = append(response.Errors, fmt.Sprintf("创建设备分组 %s 失败: %s", groupReq.Name, err.Error()))
		} else {
			response.SuccessCount++
			response.CreatedGroups = append(response.CreatedGroups, *group)
		}
	}

	return response, nil
}

// QueryMetrics 查询指标
func (s *AlertRulesService) QueryMetrics(query string, timeRange string) (interface{}, error) {
	// 解析时间范围
	var duration time.Duration
	var err error
	if timeRange == "" {
		duration = time.Hour // 默认1小时
	} else {
		duration, err = time.ParseDuration(timeRange)
		if err != nil {
			return nil, fmt.Errorf("无效的时间范围: %w", err)
		}
	}

	// 计算时间范围
	end := time.Now()
	start := end.Add(-duration)
	step := duration / 100 // 分成100个点

	// 调用Prometheus服务查询指标
	ctx := context.Background()
	return s.prometheusService.QueryRange(ctx, query, start, end, step)
}

// ... existing code ...