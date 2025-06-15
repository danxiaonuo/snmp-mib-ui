package controllers

import (
	"io/ioutil"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"gorm.io/gorm"

	"mib-platform/models"
	"mib-platform/services"
)

type ConfigController struct {
	db      *gorm.DB
	redis   *redis.Client
	service *services.ConfigService
}

func NewConfigController(db *gorm.DB, redis *redis.Client) *ConfigController {
	return &ConfigController{
		db:      db,
		redis:   redis,
		service: services.NewConfigService(db, redis),
	}
}

func (c *ConfigController) GetConfigs(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	configType := ctx.Query("type")

	configs, total, err := c.service.GetConfigs(page, limit, configType)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  configs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// 生成配置
func (c *ConfigController) GenerateConfig(ctx *gin.Context) {
	var req services.ConfigGenerationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证必需字段
	if req.ConfigType == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "config_type is required"})
		return
	}
	if req.ConfigName == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "config_name is required"})
		return
	}
	if len(req.SelectedOIDs) == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "selected_oids is required"})
		return
	}

	config, err := c.service.GenerateConfig(req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Configuration generated successfully",
		"data":    config,
	})
}

// 保存配置到文件
func (c *ConfigController) SaveConfigToFile(ctx *gin.Context) {
	var request struct {
		ConfigID   uint   `json:"config_id" binding:"required"`
		TargetPath string `json:"target_path" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取配置
	config, err := c.service.GetConfig(request.ConfigID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Configuration not found"})
		return
	}

	// 保存到文件
	if err := c.service.SaveConfigToFile(config, request.TargetPath); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":     "Configuration saved to file successfully",
		"target_path": request.TargetPath,
	})
}

// 合并配置到现有文件
func (c *ConfigController) MergeConfigToFile(ctx *gin.Context) {
	var request struct {
		ConfigID   uint   `json:"config_id" binding:"required"`
		TargetPath string `json:"target_path" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取配置
	config, err := c.service.GetConfig(request.ConfigID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Configuration not found"})
		return
	}

	// 合并到文件
	if err := c.service.MergeConfigToFile(config, request.TargetPath); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":     "Configuration merged to file successfully",
		"target_path": request.TargetPath,
	})
}

// 预览配置文件内容
func (c *ConfigController) PreviewConfigFile(ctx *gin.Context) {
	filePath := ctx.Query("file_path")
	if filePath == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "file_path parameter is required"})
		return
	}

	// 读取文件内容
	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		}
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"file_path": filePath,
		"content":   string(content),
	})
}

func (c *ConfigController) GetConfig(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid config ID"})
		return
	}

	config, err := c.service.GetConfig(uint(id))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Config not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": config})
}

func (c *ConfigController) CreateConfig(ctx *gin.Context) {
	var config models.Config
	if err := ctx.ShouldBindJSON(&config); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateConfig(&config); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": config})
}

func (c *ConfigController) UpdateConfig(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid config ID"})
		return
	}

	var updates models.Config
	if err := ctx.ShouldBindJSON(&updates); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config, err := c.service.UpdateConfig(uint(id), &updates)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": config})
}

func (c *ConfigController) DeleteConfig(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid config ID"})
		return
	}

	if err := c.service.DeleteConfig(uint(id)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Config deleted successfully"})
}



func (c *ConfigController) ValidateConfig(ctx *gin.Context) {
	var req struct {
		ID uint `json:"id" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := c.service.ValidateConfig(req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}

func (c *ConfigController) GetTemplates(ctx *gin.Context) {
	configType := ctx.Query("type")
	templates, err := c.service.GetTemplates(configType)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": templates})
}

func (c *ConfigController) CreateTemplate(ctx *gin.Context) {
	var template models.ConfigTemplate
	if err := ctx.ShouldBindJSON(&template); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateTemplate(&template); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": template})
}

func (c *ConfigController) GetConfigVersions(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid config ID"})
		return
	}

	versions, err := c.service.GetConfigVersions(uint(id))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": versions})
}

func (c *ConfigController) CompareConfigs(ctx *gin.Context) {
	var req struct {
		Config1 string `json:"config1" binding:"required"`
		Config2 string `json:"config2" binding:"required"`
		Type    string `json:"type"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	diff, err := c.service.CompareConfigs(req.Config1, req.Config2, req.Type)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": diff})
}
