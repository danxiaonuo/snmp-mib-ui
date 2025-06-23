package main

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// CORS配置
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:12300", "*"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"*"},
		AllowCredentials: true,
	}))

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"service":   "snmp-mib-platform",
			"version":   "2.0.0-sqlite",
			"database":  "SQLite",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	// API路由组
	api := r.Group("/api/v1")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":    "healthy",
				"service":   "snmp-mib-platform-api",
				"version":   "2.0.0",
				"database":  "SQLite (优化版)",
				"timestamp": time.Now().Format(time.RFC3339),
				"features": []string{
					"SNMP监控",
					"MIB管理", 
					"设备发现",
					"配置管理",
				},
			})
		})

		// 模拟一些基本API
		api.GET("/mibs", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"data": []gin.H{
					{"id": 1, "name": "SNMPv2-MIB", "status": "active"},
					{"id": 2, "name": "IF-MIB", "status": "active"},
					{"id": 3, "name": "HOST-RESOURCES-MIB", "status": "active"},
				},
				"total": 3,
			})
		})

		api.GET("/devices", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"data": []gin.H{
					{"id": 1, "name": "Router-01", "ip": "192.168.1.1", "status": "online"},
					{"id": 2, "name": "Switch-01", "ip": "192.168.1.2", "status": "online"},
					{"id": 3, "name": "Server-01", "ip": "192.168.1.10", "status": "online"},
				},
				"total": 3,
			})
		})

		api.GET("/snmp/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "SNMP连接测试成功",
				"data": gin.H{
					"target":     "demo-device",
					"community":  "public",
					"version":    "2c",
					"response_time": "15ms",
				},
			})
		})
	}

	println("🚀 SNMP MIB 监控平台演示版启动成功!")
	println("📊 后端API: http://localhost:17880")
	println("🏥 健康检查: http://localhost:17880/health")
	println("📖 API文档: http://localhost:17880/api/v1/health")
	
	r.Run(":17880")
}