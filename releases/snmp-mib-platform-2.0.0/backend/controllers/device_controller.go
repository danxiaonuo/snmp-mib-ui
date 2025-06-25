package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"gorm.io/gorm"

	"mib-platform/models"
	"mib-platform/services"
)

type DeviceController struct {
	db      *gorm.DB
	service *services.DeviceService
}

func NewDeviceController(db *gorm.DB) *DeviceController {
	return &DeviceController{
		db:      db,
		service: services.NewDeviceService(db),
	}
}

func (c *DeviceController) GetDevices(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	search := ctx.Query("search")
	status := ctx.Query("status")

	devices, total, err := c.service.GetDevices(page, limit, search, status)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  devices,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (c *DeviceController) GetDevice(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	device, err := c.service.GetDevice(uint(id))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": device})
}

func (c *DeviceController) CreateDevice(ctx *gin.Context) {
	var device models.Device
	if err := ctx.ShouldBindJSON(&device); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateDevice(&device); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": device})
}

func (c *DeviceController) UpdateDevice(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	var updates models.Device
	if err := ctx.ShouldBindJSON(&updates); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	device, err := c.service.UpdateDevice(uint(id), &updates)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": device})
}

func (c *DeviceController) DeleteDevice(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	if err := c.service.DeleteDevice(uint(id)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Device deleted successfully"})
}

func (c *DeviceController) TestDevice(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	result, err := c.service.TestDevice(uint(id))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}

func (c *DeviceController) GetDeviceTemplates(ctx *gin.Context) {
	deviceType := ctx.Query("type")
	templates, err := c.service.GetDeviceTemplates(deviceType)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": templates})
}

func (c *DeviceController) CreateDeviceTemplate(ctx *gin.Context) {
	var template models.DeviceTemplate
	if err := ctx.ShouldBindJSON(&template); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateDeviceTemplate(&template); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": template})
}
