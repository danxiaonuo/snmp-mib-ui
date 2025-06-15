package controllers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"gorm.io/gorm"

	"mib-platform/models"
	"mib-platform/services"
)

type MIBController struct {
	db      *gorm.DB
	redis   *redis.Client
	service *services.MIBService
}

func NewMIBController(db *gorm.DB, redis *redis.Client) *MIBController {
	return &MIBController{
		db:      db,
		redis:   redis,
		service: services.NewMIBService(db, redis),
	}
}

func (c *MIBController) GetMIBs(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	search := ctx.Query("search")
	status := ctx.Query("status")

	mibs, total, err := c.service.GetMIBs(page, limit, search, status)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  mibs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (c *MIBController) GetMIB(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid MIB ID"})
		return
	}

	mib, err := c.service.GetMIB(uint(id))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "MIB not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": mib})
}

func (c *MIBController) CreateMIB(ctx *gin.Context) {
	var mib models.MIB
	if err := ctx.ShouldBindJSON(&mib); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateMIB(&mib); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": mib})
}

// 上传 MIB 文件
func (c *MIBController) UploadMIB(ctx *gin.Context) {
	file, header, err := ctx.Request.FormFile("file")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// 验证文件类型
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".mib" && ext != ".txt" && ext != ".my" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only .mib, .txt, .my files are allowed"})
		return
	}

	// 上传并解析 MIB 文件
	mib, err := c.service.UploadAndParseMIB(file, header)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "MIB file uploaded and parsed successfully",
		"data":    mib,
	})
}

// 扫描 MIB 目录
func (c *MIBController) ScanMIBDirectory(ctx *gin.Context) {
	dirPath := ctx.Query("path")
	if dirPath == "" {
		dirPath = "/opt/monitoring/mibs"
	}

	files, err := c.service.ScanMIBDirectory(dirPath)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"directory": dirPath,
		"files":     files,
		"count":     len(files),
	})
}

// 解析指定的 MIB 文件
func (c *MIBController) ParseMIBFile(ctx *gin.Context) {
	var request struct {
		FilePath string `json:"file_path" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查文件是否存在
	if _, err := os.Stat(request.FilePath); os.IsNotExist(err) {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// 解析 MIB 文件
	oids, err := c.service.ParseMIB(request.FilePath)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"file_path": request.FilePath,
		"oids":      oids,
		"count":     len(oids),
	})
}

func (c *MIBController) UpdateMIB(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid MIB ID"})
		return
	}

	var updates models.MIB
	if err := ctx.ShouldBindJSON(&updates); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mib, err := c.service.UpdateMIB(uint(id), &updates)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": mib})
}

func (c *MIBController) DeleteMIB(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid MIB ID"})
		return
	}

	if err := c.service.DeleteMIB(uint(id)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "MIB deleted successfully"})
}



func (c *MIBController) ParseMIB(ctx *gin.Context) {
	result, err := c.service.ParseMIB(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}

func (c *MIBController) ValidateMIB(ctx *gin.Context) {
	file, header, err := ctx.Request.FormFile("file")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// 保存临时文件
	tempPath := "/tmp/" + header.Filename
	out, err := os.Create(tempPath)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create temp file"})
		return
	}
	defer out.Close()
	defer os.Remove(tempPath)

	_, err = io.Copy(out, file)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	result, err := c.service.ValidateMIBFile(tempPath)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}

func (c *MIBController) GetMIBOIDs(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid MIB ID"})
		return
	}

	oids, err := c.service.GetMIBOIDs(uint(id))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": oids})
}

func (c *MIBController) ImportMIBs(ctx *gin.Context) {
	file, _, err := ctx.Request.FormFile("file")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	result, err := c.service.ImportMIBs(file)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}

func (c *MIBController) ExportMIBs(ctx *gin.Context) {
	format := ctx.DefaultQuery("format", "json")
	ids := ctx.QueryArray("ids")

	data, filename, err := c.service.ExportMIBs(ids, format)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	ctx.Data(http.StatusOK, "application/octet-stream", data)
}
