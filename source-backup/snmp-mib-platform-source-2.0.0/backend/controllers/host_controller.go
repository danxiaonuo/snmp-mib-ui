package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"mib-platform/models"
	"mib-platform/services"
)

type HostController struct {
	hostService *services.HostService
}

func NewHostController(hostService *services.HostService) *HostController {
	return &HostController{
		hostService: hostService,
	}
}

// GetHosts 获取主机列表
func (c *HostController) GetHosts(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))
	search := ctx.Query("search")
	status := ctx.Query("status")
	group := ctx.Query("group")

	hosts, total, err := c.hostService.GetHosts(page, limit, search, status, group)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  hosts,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetHost 获取单个主机
func (c *HostController) GetHost(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid host ID"})
		return
	}

	host, err := c.hostService.GetHost(uint(id))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Host not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": host})
}

// CreateHost 创建主机
func (c *HostController) CreateHost(ctx *gin.Context) {
	var host models.Host
	if err := ctx.ShouldBindJSON(&host); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.hostService.CreateHost(&host); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": host})
}

// UpdateHost 更新主机
func (c *HostController) UpdateHost(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid host ID"})
		return
	}

	var updates models.Host
	if err := ctx.ShouldBindJSON(&updates); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	host, err := c.hostService.UpdateHost(uint(id), &updates)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": host})
}

// DeleteHost 删除主机
func (c *HostController) DeleteHost(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid host ID"})
		return
	}

	if err := c.hostService.DeleteHost(uint(id)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Host deleted successfully"})
}

// TestHostConnection 测试主机连接
func (c *HostController) TestHostConnection(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid host ID"})
		return
	}

	result, err := c.hostService.TestHostConnection(uint(id))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}

// 主机发现相关接口

// GetDiscoveryTasks 获取发现任务列表
func (c *HostController) GetDiscoveryTasks(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))

	tasks, total, err := c.hostService.GetDiscoveryTasks(page, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  tasks,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetDiscoveryTask 获取单个发现任务
func (c *HostController) GetDiscoveryTask(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	task, err := c.hostService.GetDiscoveryTask(uint(id))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": task})
}

// CreateDiscoveryTask 创建发现任务
func (c *HostController) CreateDiscoveryTask(ctx *gin.Context) {
	var task models.HostDiscoveryTask
	if err := ctx.ShouldBindJSON(&task); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.hostService.CreateDiscoveryTask(&task); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": task})
}

// StartDiscovery 启动主机发现
func (c *HostController) StartDiscovery(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	if err := c.hostService.StartDiscovery(uint(id)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Discovery task started"})
}

// 凭据管理相关接口

// GetCredentials 获取凭据列表
func (c *HostController) GetCredentials(ctx *gin.Context) {
	credentials, err := c.hostService.GetCredentials()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": credentials})
}

// CreateCredential 创建凭据
func (c *HostController) CreateCredential(ctx *gin.Context) {
	var credential models.HostCredential
	if err := ctx.ShouldBindJSON(&credential); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.hostService.CreateCredential(&credential); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": credential})
}