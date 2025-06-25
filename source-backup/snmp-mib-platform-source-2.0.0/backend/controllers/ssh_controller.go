package controllers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"mib-platform/services"
)

type SSHController struct {
	hostService *services.HostService
}

func NewSSHController(hostService *services.HostService) *SSHController {
	return &SSHController{
		hostService: hostService,
	}
}

// TestSSHConnection 测试SSH连接
func (c *SSHController) TestSSHConnection(ctx *gin.Context) {
	var request struct {
		Host       string `json:"host" binding:"required"`
		Port       int    `json:"port"`
		Username   string `json:"username" binding:"required"`
		Password   string `json:"password"`
		PrivateKey string `json:"privateKey"`
		Timeout    int    `json:"timeout"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if request.Port == 0 {
		request.Port = 22
	}

	if request.Timeout == 0 {
		request.Timeout = 10
	}

	// 创建临时SSH客户端进行测试
	client, err := c.hostService.CreateSSHClient(request.Host, request.Port, request.Username, request.Password, request.PrivateKey)
	if err != nil {
		ctx.JSON(http.StatusOK, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}
	defer client.Close()

	// 执行简单命令测试连接
	_, err = c.hostService.ExecuteSSHCommand(client, "echo 'connection test'")
	if err != nil {
		ctx.JSON(http.StatusOK, gin.H{
			"success": false,
			"error":   "SSH connection established but command execution failed: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"details": gin.H{
			"host":       request.Host,
			"port":       request.Port,
			"username":   request.Username,
			"authMethod": func() string {
				if request.PrivateKey != "" {
					return "key"
				}
				return "password"
			}(),
			"connectedAt": time.Now().Format(time.RFC3339),
		},
	})
}

// ExecuteSSHCommand 执行SSH命令
func (c *SSHController) ExecuteSSHCommand(ctx *gin.Context) {
	var request struct {
		Host       string `json:"host" binding:"required"`
		Port       int    `json:"port"`
		Username   string `json:"username" binding:"required"`
		Password   string `json:"password"`
		PrivateKey string `json:"privateKey"`
		Command    string `json:"command" binding:"required"`
		Input      string `json:"input"`
		Timeout    int    `json:"timeout"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if request.Port == 0 {
		request.Port = 22
	}

	if request.Timeout == 0 {
		request.Timeout = 30
	}

	startTime := time.Now()

	// 创建SSH客户端
	client, err := c.hostService.CreateSSHClient(request.Host, request.Port, request.Username, request.Password, request.PrivateKey)
	if err != nil {
		ctx.JSON(http.StatusOK, gin.H{
			"success":       false,
			"stdout":        "",
			"stderr":        err.Error(),
			"exitCode":      1,
			"executionTime": time.Since(startTime).Milliseconds(),
		})
		return
	}
	defer client.Close()

	// 执行命令
	output, err := c.hostService.ExecuteSSHCommand(client, request.Command)
	if err != nil {
		ctx.JSON(http.StatusOK, gin.H{
			"success":       false,
			"stdout":        "",
			"stderr":        err.Error(),
			"exitCode":      1,
			"executionTime": time.Since(startTime).Milliseconds(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":       true,
		"stdout":        output,
		"stderr":        "",
		"exitCode":      0,
		"executionTime": time.Since(startTime).Milliseconds(),
	})
}

// UploadFile 上传文件到远程主机
func (c *SSHController) UploadFile(ctx *gin.Context) {
	var request struct {
		Host       string `json:"host" binding:"required"`
		Port       int    `json:"port"`
		Username   string `json:"username" binding:"required"`
		Password   string `json:"password"`
		PrivateKey string `json:"privateKey"`
		RemotePath string `json:"remotePath" binding:"required"`
		Content    string `json:"content" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if request.Port == 0 {
		request.Port = 22
	}

	// 创建SSH客户端
	client, err := c.hostService.CreateSSHClient(request.Host, request.Port, request.Username, request.Password, request.PrivateKey)
	if err != nil {
		ctx.JSON(http.StatusOK, gin.H{
			"success":    false,
			"remotePath": request.RemotePath,
			"size":       0,
			"error":      err.Error(),
		})
		return
	}
	defer client.Close()

	// 创建目录（如果不存在）
	dirPath := ""
	if lastSlash := len(request.RemotePath) - 1; lastSlash >= 0 {
		if idx := lastSlash; idx >= 0 {
			for i := lastSlash; i >= 0; i-- {
				if request.RemotePath[i] == '/' {
					dirPath = request.RemotePath[:i]
					break
				}
			}
		}
	}
	
	if dirPath != "" {
		_, _ = c.hostService.ExecuteSSHCommand(client, "sudo mkdir -p "+dirPath)
	}

	// 使用tee命令写入文件
	command := "sudo tee " + request.RemotePath + " > /dev/null"
	session, err := client.NewSession()
	if err != nil {
		ctx.JSON(http.StatusOK, gin.H{
			"success":    false,
			"remotePath": request.RemotePath,
			"size":       0,
			"error":      "Failed to create SSH session: " + err.Error(),
		})
		return
	}
	defer session.Close()

	// 通过stdin传递内容
	session.Stdin = strings.NewReader(request.Content)
	err = session.Run(command)
	if err != nil {
		ctx.JSON(http.StatusOK, gin.H{
			"success":    false,
			"remotePath": request.RemotePath,
			"size":       0,
			"error":      "Failed to upload file: " + err.Error(),
		})
		return
	}

	// 设置文件权限
	_, _ = c.hostService.ExecuteSSHCommand(client, "sudo chmod 644 "+request.RemotePath)

	ctx.JSON(http.StatusOK, gin.H{
		"success":    true,
		"remotePath": request.RemotePath,
		"size":       len(request.Content),
	})
}