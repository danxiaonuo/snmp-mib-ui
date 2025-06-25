package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"mib-platform/services"
)

type DeploymentController struct {
	deploymentService *services.DeploymentService
	hostService       *services.HostService
}

func NewDeploymentController(deploymentService *services.DeploymentService, hostService *services.HostService) *DeploymentController {
	return &DeploymentController{
		deploymentService: deploymentService,
		hostService:       hostService,
	}
}

// CreateDeploymentTask 创建部署任务
func (c *DeploymentController) CreateDeploymentTask(ctx *gin.Context) {
	var request struct {
		HostID     uint                                `json:"host_id" binding:"required"`
		Components []services.ComponentDeployment     `json:"components" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证主机是否存在
	_, err := c.hostService.GetHost(request.HostID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Host not found"})
		return
	}

	// 创建部署任务
	task, err := c.deploymentService.CreateDeploymentTask(request.HostID, request.Components)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Deployment task created successfully",
		"task":    task,
	})
}

// ExecuteDeployment 执行部署任务
func (c *DeploymentController) ExecuteDeployment(ctx *gin.Context) {
	taskID := ctx.Param("taskId")
	if taskID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Task ID is required"})
		return
	}

	err := c.deploymentService.ExecuteDeployment(taskID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Deployment started successfully",
		"task_id": taskID,
	})
}

// GetDeploymentTask 获取部署任务状态
func (c *DeploymentController) GetDeploymentTask(ctx *gin.Context) {
	taskID := ctx.Param("taskId")
	if taskID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Task ID is required"})
		return
	}

	task, err := c.deploymentService.GetDeploymentTask(taskID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"task": task,
	})
}

// GetHostComponents 获取主机上的组件状态
func (c *DeploymentController) GetHostComponents(ctx *gin.Context) {
	hostIDStr := ctx.Param("hostId")
	hostID, err := strconv.ParseUint(hostIDStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid host ID"})
		return
	}

	components, err := c.deploymentService.GetHostComponents(uint(hostID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"components": components,
	})
}

// CheckComponentStatus 检查组件状态
func (c *DeploymentController) CheckComponentStatus(ctx *gin.Context) {
	hostIDStr := ctx.Param("hostId")
	componentName := ctx.Param("componentName")

	hostID, err := strconv.ParseUint(hostIDStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid host ID"})
		return
	}

	status, err := c.deploymentService.CheckComponentStatus(uint(hostID), componentName)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"component": componentName,
		"status":    status,
	})
}

// BatchDeploy 批量部署组件到多个主机
func (c *DeploymentController) BatchDeploy(ctx *gin.Context) {
	var request struct {
		HostIDs    []uint                            `json:"host_ids" binding:"required"`
		Components []services.ComponentDeployment   `json:"components" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var tasks []interface{}
	var errors []string

	// 为每个主机创建部署任务
	for _, hostID := range request.HostIDs {
		// 验证主机是否存在
		_, err := c.hostService.GetHost(hostID)
		if err != nil {
			errors = append(errors, "Host "+strconv.Itoa(int(hostID))+" not found")
			continue
		}

		// 创建部署任务
		task, err := c.deploymentService.CreateDeploymentTask(hostID, request.Components)
		if err != nil {
			errors = append(errors, "Failed to create task for host "+strconv.Itoa(int(hostID))+": "+err.Error())
			continue
		}

		tasks = append(tasks, task)

		// 异步执行部署
		go c.deploymentService.ExecuteDeployment(task.ID)
	}

	response := gin.H{
		"message": "Batch deployment initiated",
		"tasks":   tasks,
	}

	if len(errors) > 0 {
		response["errors"] = errors
	}

	ctx.JSON(http.StatusOK, response)
}

// GetAvailableComponents 获取可用的监控组件列表
func (c *DeploymentController) GetAvailableComponents(ctx *gin.Context) {
	// 这里可以返回支持的组件列表
	components := []map[string]interface{}{
		{
			"name":         "node-exporter",
			"display_name": "Node Exporter",
			"type":         "collector",
			"version":      "1.7.0",
			"description":  "系统指标采集器，收集CPU、内存、磁盘等系统指标",
			"default_port": 9100,
		},
		{
			"name":         "categraf",
			"display_name": "Categraf",
			"type":         "collector",
			"version":      "0.3.60",
			"description":  "多功能指标采集器，支持多种数据源",
			"default_port": 9100,
		},
		{
			"name":         "vmagent",
			"display_name": "VMAgent",
			"type":         "collector",
			"version":      "1.96.0",
			"description":  "轻量级指标代理，负责指标收集和转发",
			"default_port": 8429,
		},
		{
			"name":         "victoriametrics",
			"display_name": "VictoriaMetrics",
			"type":         "storage",
			"version":      "1.96.0",
			"description":  "VictoriaMetrics单机版，高性能时序数据库",
			"default_port": 8428,
		},
		{
			"name":         "vmstorage",
			"display_name": "VMStorage",
			"type":         "storage",
			"version":      "1.96.0",
			"description":  "VictoriaMetrics集群存储节点",
			"default_port": 8482,
		},
		{
			"name":         "vminsert",
			"display_name": "VMInsert",
			"type":         "storage",
			"version":      "1.96.0",
			"description":  "VictoriaMetrics集群插入节点",
			"default_port": 8480,
		},
		{
			"name":         "vmselect",
			"display_name": "VMSelect",
			"type":         "storage",
			"version":      "1.96.0",
			"description":  "VictoriaMetrics集群查询节点",
			"default_port": 8481,
		},
		{
			"name":         "vmalert",
			"display_name": "VMAlert",
			"type":         "alerting",
			"version":      "1.96.0",
			"description":  "VictoriaMetrics告警组件",
			"default_port": 8880,
		},
		{
			"name":         "grafana",
			"display_name": "Grafana",
			"type":         "visualization",
			"version":      "10.2.3",
			"description":  "数据可视化和监控面板",
			"default_port": 3000,
		},
		{
			"name":         "snmp-exporter",
			"display_name": "SNMP Exporter",
			"type":         "collector",
			"version":      "0.24.1",
			"description":  "SNMP设备监控导出器",
			"default_port": 9116,
		},
		{
			"name":         "alertmanager",
			"display_name": "Alertmanager",
			"type":         "alerting",
			"version":      "0.26.0",
			"description":  "告警管理和通知系统",
			"default_port": 9093,
		},
	}

	ctx.JSON(http.StatusOK, gin.H{
		"components": components,
	})
}

// GenerateDeploymentConfig 生成部署配置
func (c *DeploymentController) GenerateDeploymentConfig(ctx *gin.Context) {
	var request struct {
		Components []services.ComponentDeployment `json:"components" binding:"required"`
		HostID     uint                           `json:"host_id" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取主机信息
	host, err := c.hostService.GetHost(request.HostID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Host not found"})
		return
	}

	// 生成配置文件
	configs := make(map[string]string)
	
	// 这里可以根据组件生成相应的配置文件
	// 例如：Docker Compose 文件、配置文件等
	for _, component := range request.Components {
		switch component.Name {
		case "node-exporter":
			configs["docker-compose.node-exporter.yml"] = generateNodeExporterConfig(component)
		case "grafana":
			configs["docker-compose.grafana.yml"] = generateGrafanaConfig(component)
		case "victoriametrics":
			configs["docker-compose.victoriametrics.yml"] = generateVictoriaMetricsConfig(component)
		// 添加其他组件的配置生成
		}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"host":    host,
		"configs": configs,
	})
}

// 辅助函数：生成各组件的配置
func generateNodeExporterConfig(component services.ComponentDeployment) string {
	return `version: '3.8'
services:
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "` + strconv.Itoa(component.Port) + `:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped
    networks:
      - monitoring

networks:
  monitoring:
    external: true`
}

func generateGrafanaConfig(component services.ComponentDeployment) string {
	return `version: '3.8'
services:
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "` + strconv.Itoa(component.Port) + `:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped
    networks:
      - monitoring

volumes:
  grafana_data:

networks:
  monitoring:
    external: true`
}

func generateVictoriaMetricsConfig(component services.ComponentDeployment) string {
	return `version: '3.8'
services:
  victoriametrics:
    image: victoriametrics/victoria-metrics:latest
    container_name: victoriametrics
    ports:
      - "` + strconv.Itoa(component.Port) + `:8428"
    volumes:
      - vm_data:/victoria-metrics-data
    command:
      - "--storageDataPath=/victoria-metrics-data"
      - "--httpListenAddr=:8428"
      - "--retentionPeriod=12"
    restart: unless-stopped
    networks:
      - monitoring

volumes:
  vm_data:

networks:
  monitoring:
    external: true`
}