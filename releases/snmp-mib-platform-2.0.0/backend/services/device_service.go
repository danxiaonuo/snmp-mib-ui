package services

import (
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"

	"mib-platform/models"
)

type DeviceService struct {
	db *gorm.DB
}

func NewDeviceService(db *gorm.DB) *DeviceService {
	return &DeviceService{
		db: db,
	}
}

func (s *DeviceService) GetDevices(page, limit int, search, status string) ([]models.Device, int64, error) {
	var devices []models.Device
	var total int64

	query := s.db.Model(&models.Device{})

	if search != "" {
		query = query.Where("name ILIKE ? OR ip_address ILIKE ? OR hostname ILIKE ?", 
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Preload("Template").Preload("Credentials").Offset(offset).Limit(limit).Find(&devices).Error; err != nil {
		return nil, 0, err
	}

	return devices, total, nil
}

func (s *DeviceService) GetDevice(id uint) (*models.Device, error) {
	var device models.Device
	if err := s.db.Preload("Template").Preload("Credentials").First(&device, id).Error; err != nil {
		return nil, err
	}
	return &device, nil
}

func (s *DeviceService) CreateDevice(device *models.Device) error {
	return s.db.Create(device).Error
}

func (s *DeviceService) UpdateDevice(id uint, updates *models.Device) (*models.Device, error) {
	var device models.Device
	if err := s.db.First(&device, id).Error; err != nil {
		return nil, err
	}

	if err := s.db.Model(&device).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &device, nil
}

func (s *DeviceService) DeleteDevice(id uint) error {
	return s.db.Delete(&models.Device{}, id).Error
}

func (s *DeviceService) TestDevice(id uint) (map[string]interface{}, error) {
	device, err := s.GetDevice(id)
	if err != nil {
		return nil, err
	}

	// Get device credentials
	if len(device.Credentials) == 0 {
		return map[string]interface{}{
			"success": false,
			"error":   "No SNMP credentials configured for device",
		}, nil
	}

	// Use the first available credential for testing
	cred := device.Credentials[0]

	// Create SNMP test request
	snmpReq := &models.SNMPRequest{
		Target:    device.IPAddress,
		Port:      device.Port,
		Version:   cred.Version,
		Community: cred.Community,
		Username:  cred.Username,
		AuthProto: cred.AuthProto,
		AuthKey:   cred.AuthKey,
		PrivProto: cred.PrivProto,
		PrivKey:   cred.PrivKey,
		OID:       "1.3.6.1.2.1.1.3.0", // sysUpTime
		Timeout:   5,
		Retries:   3,
	}

	// Create SNMP service for testing
	snmpService := NewSNMPService(s.db)
	result, err := snmpService.TestConnection(snmpReq)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}, nil
	}

	// Update device status based on test result
	status := "offline"
	if result["success"].(bool) {
		status = "online"
		now := time.Now()
		s.db.Model(device).Updates(map[string]interface{}{
			"status":    status,
			"last_seen": &now,
		})
	} else {
		s.db.Model(device).Update("status", status)
	}

	return result, nil
}

func (s *DeviceService) GetDeviceTemplates(deviceType string) ([]models.DeviceTemplate, error) {
	var templates []models.DeviceTemplate
	query := s.db.Model(&models.DeviceTemplate{})

	if deviceType != "" {
		query = query.Where("type = ?", deviceType)
	}

	if err := query.Preload("MIBs").Find(&templates).Error; err != nil {
		return nil, err
	}

	return templates, nil
}

func (s *DeviceService) CreateDeviceTemplate(template *models.DeviceTemplate) error {
	return s.db.Create(template).Error
}

// GetDeviceGroupDevices 获取设备分组中的设备
func (s *DeviceService) GetDeviceGroupDevices(groupID string) ([]models.Device, error) {
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
func (s *DeviceService) BatchCreateDeviceGroups(groups []models.CreateDeviceGroupRequest) (*models.BatchCreateDeviceGroupsResponse, error) {
	response := &models.BatchCreateDeviceGroupsResponse{
		CreatedGroups: []models.DeviceGroup{},
		Errors:        []string{},
	}

	for _, groupReq := range groups {
		// 转换标签和选择器为JSON
		tagsJson, _ := json.Marshal(groupReq.Tags)
		selectorJson, _ := json.Marshal(groupReq.Selector)

		group := models.DeviceGroup{
			ID:          fmt.Sprintf("group-%d", time.Now().UnixNano()),
			Name:        groupReq.Name,
			Description: groupReq.Description,
			Tags:        models.JSON(tagsJson),
			Selector:    models.JSON(selectorJson),
			CreatedBy:   "system",
			UpdatedBy:   "system",
		}

		if err := s.db.Create(&group).Error; err != nil {
			response.FailureCount++
			response.Errors = append(response.Errors, fmt.Sprintf("创建设备分组失败 %s: %v", groupReq.Name, err))
		} else {
			response.SuccessCount++
			response.CreatedGroups = append(response.CreatedGroups, group)
		}
	}

	return response, nil
}

// BatchDeleteDeviceGroups 批量删除设备分组
func (s *DeviceService) BatchDeleteDeviceGroups(req models.BatchDeleteDeviceGroupsRequest) error {
	for _, groupID := range req.GroupIDs {
		// 检查分组是否存在
		var group models.DeviceGroup
		if err := s.db.First(&group, "id = ?", groupID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				continue // 忽略不存在的分组
			}
			return fmt.Errorf("检查设备分组失败: %w", err)
		}

		// 如果不是强制删除，检查是否有关联的告警规则
		if !req.Force {
			var ruleCount int64
			if err := s.db.Model(&models.AlertRule{}).Where("device_group_id = ?", groupID).Count(&ruleCount).Error; err != nil {
				return fmt.Errorf("检查关联规则失败: %w", err)
			}
			if ruleCount > 0 {
				return fmt.Errorf("设备分组 %s 有关联的告警规则，无法删除", groupID)
			}
		}

		// 删除分组
		if err := s.db.Delete(&group).Error; err != nil {
			return fmt.Errorf("删除设备分组失败: %w", err)
		}
	}

	return nil
}
