package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"mib-platform/services"
)

type ConfigDeploymentController struct {
	configDeploymentService *services.ConfigDeploymentService
	hostService             *services.HostService
}

func NewConfigDeploymentController(configDeploymentService *services.ConfigDeploymentService, hostService *services.HostService) *ConfigDeploymentController {
	return &ConfigDeploymentController{
		configDeploymentService: configDeploymentService,
		hostService:             hostService,
	}
}

// CreateConfigDeploymentTask 创建配置部署任务
func (c *ConfigDeploymentController) CreateConfigDeploymentTask(ctx *gin.Context) {
	var request struct {
		HostIDs    []uint                 `json:"host_ids" binding:"required"`
		ConfigType string                 `json:"config_type" binding:"required"`
		ConfigData map[string]interface{} `json:"config_data" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证配置类型
	validTypes := map[string]bool{
		"monitoring": true,
		"alerting":   true,
		"snmp":       true,
	}

	if !validTypes[request.ConfigType] {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid config type. Must be one of: monitoring, alerting, snmp"})
		return
	}

	// 验证主机是否存在
	for _, hostID := range request.HostIDs {
		_, err := c.hostService.GetHost(hostID)
		if err != nil {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Host " + strconv.Itoa(int(hostID)) + " not found"})
			return
		}
	}

	// 创建配置部署任务
	task, err := c.configDeploymentService.CreateConfigDeploymentTask(request.HostIDs, request.ConfigType, request.ConfigData)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Config deployment task created successfully",
		"task":    task,
	})
}

// ExecuteConfigDeployment 执行配置部署任务
func (c *ConfigDeploymentController) ExecuteConfigDeployment(ctx *gin.Context) {
	taskID := ctx.Param("taskId")
	if taskID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Task ID is required"})
		return
	}

	err := c.configDeploymentService.ExecuteConfigDeployment(taskID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Config deployment started successfully",
		"task_id": taskID,
	})
}

// GetConfigDeploymentTask 获取配置部署任务状态
func (c *ConfigDeploymentController) GetConfigDeploymentTask(ctx *gin.Context) {
	taskID := ctx.Param("taskId")
	if taskID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Task ID is required"})
		return
	}

	task, err := c.configDeploymentService.GetConfigDeploymentTask(taskID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"task": task,
	})
}

// GenerateConfigPreview 生成配置预览
func (c *ConfigDeploymentController) GenerateConfigPreview(ctx *gin.Context) {
	var request struct {
		ConfigType string                 `json:"config_type" binding:"required"`
		ConfigData map[string]interface{} `json:"config_data" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证配置类型
	validTypes := map[string]bool{
		"monitoring": true,
		"alerting":   true,
		"snmp":       true,
	}

	if !validTypes[request.ConfigType] {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid config type. Must be one of: monitoring, alerting, snmp"})
		return
	}

	// 生成配置预览
	configs, err := c.configDeploymentService.GenerateConfigPreview(request.ConfigType, request.ConfigData)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"config_type": request.ConfigType,
		"configs":     configs,
	})
}

// DeployMonitoringConfig 部署监控配置
func (c *ConfigDeploymentController) DeployMonitoringConfig(ctx *gin.Context) {
	var request struct {
		HostIDs              []uint    `json:"host_ids" binding:"required"`
		NodeExporterTargets  []string  `json:"node_exporter_targets"`
		SNMPTargets          []string  `json:"snmp_targets"`
		RemoteWriteURL       string    `json:"remote_write_url"`
		VictoriaMetricsURL   string    `json:"victoriametrics_url"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 构建配置数据
	configData := map[string]interface{}{
		"NodeExporterTargets": request.NodeExporterTargets,
		"SNMPTargets":         request.SNMPTargets,
		"RemoteWriteURL":      request.RemoteWriteURL,
		"VictoriaMetricsURL":  request.VictoriaMetricsURL,
	}

	// 创建并执行部署任务
	task, err := c.configDeploymentService.CreateConfigDeploymentTask(request.HostIDs, "monitoring", configData)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 立即执行部署
	err = c.configDeploymentService.ExecuteConfigDeployment(task.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Monitoring config deployment started",
		"task":    task,
	})
}

// DeployAlertingConfig 部署告警配置
func (c *ConfigDeploymentController) DeployAlertingConfig(ctx *gin.Context) {
	var request struct {
		HostIDs           []uint  `json:"host_ids" binding:"required"`
		SMTPHost          string  `json:"smtp_host"`
		SMTPPort          int     `json:"smtp_port"`
		SMTPFrom          string  `json:"smtp_from"`
		SMTPUsername      string  `json:"smtp_username"`
		SMTPPassword      string  `json:"smtp_password"`
		AlertEmail        string  `json:"alert_email"`
		CPUThreshold      float64 `json:"cpu_threshold"`
		MemoryThreshold   float64 `json:"memory_threshold"`
		DiskThreshold     float64 `json:"disk_threshold"`
		InterfaceThreshold float64 `json:"interface_threshold"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置默认阈值
	if request.CPUThreshold == 0 {
		request.CPUThreshold = 80
	}
	if request.MemoryThreshold == 0 {
		request.MemoryThreshold = 85
	}
	if request.DiskThreshold == 0 {
		request.DiskThreshold = 90
	}
	if request.InterfaceThreshold == 0 {
		request.InterfaceThreshold = 80
	}

	// 构建配置数据
	configData := map[string]interface{}{
		"SMTPHost":            request.SMTPHost,
		"SMTPPort":            request.SMTPPort,
		"SMTPFrom":            request.SMTPFrom,
		"SMTPUsername":        request.SMTPUsername,
		"SMTPPassword":        request.SMTPPassword,
		"AlertEmail":          request.AlertEmail,
		"CPUThreshold":        request.CPUThreshold,
		"MemoryThreshold":     request.MemoryThreshold,
		"DiskThreshold":       request.DiskThreshold,
		"InterfaceThreshold":  request.InterfaceThreshold,
	}

	// 创建并执行部署任务
	task, err := c.configDeploymentService.CreateConfigDeploymentTask(request.HostIDs, "alerting", configData)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 立即执行部署
	err = c.configDeploymentService.ExecuteConfigDeployment(task.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Alerting config deployment started",
		"task":    task,
	})
}

// DeploySNMPConfig 部署SNMP配置
func (c *ConfigDeploymentController) DeploySNMPConfig(ctx *gin.Context) {
	var request struct {
		HostIDs []uint `json:"host_ids" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 构建配置数据
	configData := map[string]interface{}{}

	// 创建并执行部署任务
	task, err := c.configDeploymentService.CreateConfigDeploymentTask(request.HostIDs, "snmp", configData)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 立即执行部署
	err = c.configDeploymentService.ExecuteConfigDeployment(task.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "SNMP config deployment started",
		"task":    task,
	})
}

// GetConfigTemplates 获取配置模板列表
func (c *ConfigDeploymentController) GetConfigTemplates(ctx *gin.Context) {
	configType := ctx.Query("type")

	templates := map[string]interface{}{
		"monitoring": map[string]interface{}{
			"description": "Monitoring configuration templates",
			"templates": []string{
				"prometheus.yml",
				"vmagent.yml",
				"grafana-datasource.yml",
			},
			"required_fields": []string{
				"NodeExporterTargets",
				"SNMPTargets",
				"RemoteWriteURL",
				"VictoriaMetricsURL",
			},
		},
		"alerting": map[string]interface{}{
			"description": "Alerting configuration templates",
			"templates": []string{
				"alertmanager.yml",
				"node-alerts.yml",
				"snmp-alerts.yml",
			},
			"required_fields": []string{
				"SMTPHost",
				"SMTPPort",
				"SMTPFrom",
				"AlertEmail",
				"CPUThreshold",
				"MemoryThreshold",
				"DiskThreshold",
				"InterfaceThreshold",
			},
		},
		"snmp": map[string]interface{}{
			"description": "SNMP configuration templates",
			"templates": []string{
				"snmp.yml",
			},
			"required_fields": []string{},
		},
	}

	if configType != "" {
		if template, exists := templates[configType]; exists {
			ctx.JSON(http.StatusOK, gin.H{
				"config_type": configType,
				"template":    template,
			})
		} else {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Config type not found"})
		}
	} else {
		ctx.JSON(http.StatusOK, gin.H{
			"templates": templates,
		})
	}
}