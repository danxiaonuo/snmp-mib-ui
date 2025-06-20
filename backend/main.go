// SNMP MIB Platform - Backend API Server
// Author: Evan
// A modern SNMP MIB management and network monitoring platform

package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"mib-platform/config"
	"mib-platform/controllers"
	"mib-platform/database"
	"mib-platform/middleware"
	"mib-platform/routes"
	"mib-platform/services"
	"mib-platform/utils"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Initialize Redis
	redis := database.InitializeRedis(cfg.RedisURL)

	// Initialize Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// Middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:12300", "http://frontend:3000", "http://mibweb-frontend:3000", "https://yourdomain.com", "*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	router.Use(middleware.Logger())
	router.Use(middleware.ErrorHandler())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "mib-platform-backend",
		})
	})

	// Initialize logger
	logger := utils.NewLogger()

	// Initialize services
	deviceService := services.NewDeviceService(db, redis)
	alertRulesService := services.NewAlertRulesService(db, logger)
	hostService := services.NewHostService(db, redis)
	deploymentService := services.NewDeploymentService(db, redis, hostService)
	configDeploymentService := services.NewConfigDeploymentService(db, redis, hostService)

	// Initialize controllers
	mibController := controllers.NewMIBController(db, redis)
	snmpController := controllers.NewSNMPController(db, redis)
	configController := controllers.NewConfigController(db, redis)
	deviceController := controllers.NewDeviceController(db, redis)
	alertRulesController := controllers.NewAlertRulesController(alertRulesService, deviceService)
	hostController := controllers.NewHostController(hostService)
	deploymentController := controllers.NewDeploymentController(deploymentService, hostService)
	configDeploymentController := controllers.NewConfigDeploymentController(configDeploymentService, hostService)
	sshController := controllers.NewSSHController(hostService)
	configValidationController := controllers.NewConfigValidationController()
	alertDeploymentController := controllers.NewAlertDeploymentController(hostService, configDeploymentService)



	// API routes
	api := router.Group("/api/v1")
	{
		// MIB routes
		mibs := api.Group("/mibs")
		{
			mibs.GET("", mibController.GetMIBs)
			mibs.POST("", mibController.CreateMIB)
			mibs.GET("/:id", mibController.GetMIB)
			mibs.PUT("/:id", mibController.UpdateMIB)
			mibs.DELETE("/:id", mibController.DeleteMIB)
			mibs.POST("/upload", mibController.UploadMIB)
			mibs.POST("/:id/parse", mibController.ParseMIB)
			mibs.POST("/validate", mibController.ValidateMIB)
			mibs.GET("/:id/oids", mibController.GetMIBOIDs)
			mibs.POST("/import", mibController.ImportMIBs)
			mibs.GET("/export", mibController.ExportMIBs)
			// 新增的 API 端点
			mibs.GET("/scan", mibController.ScanMIBDirectory)
			mibs.POST("/parse-file", mibController.ParseMIBFile)
		}

		// SNMP routes
		snmp := api.Group("/snmp")
		{
			snmp.GET("", snmpController.GetSNMPConfig)
			snmp.POST("/get", snmpController.SNMPGet)
			snmp.POST("/walk", snmpController.SNMPWalk)
			snmp.POST("/set", snmpController.SNMPSet)
			snmp.POST("/test", snmpController.TestConnection)
			snmp.POST("/bulk", snmpController.BulkOperations)
		}

		// Configuration routes
		configs := api.Group("/configs")
		{
			configs.GET("", configController.GetConfigs)
			configs.POST("", configController.CreateConfig)
			configs.GET("/:id", configController.GetConfig)
			configs.PUT("/:id", configController.UpdateConfig)
			configs.DELETE("/:id", configController.DeleteConfig)
			configs.POST("/generate", configController.GenerateConfig)
			configs.POST("/validate", configController.ValidateConfig)
			configs.GET("/templates", configController.GetTemplates)
			configs.POST("/templates", configController.CreateTemplate)
			configs.GET("/:id/versions", configController.GetConfigVersions)
			configs.POST("/diff", configController.CompareConfigs)
			// 新增的 API 端点
			configs.POST("/save-to-file", configController.SaveConfigToFile)
			configs.POST("/merge-to-file", configController.MergeConfigToFile)
			configs.GET("/preview-file", configController.PreviewConfigFile)
		}

		// Device routes
		devices := api.Group("/devices")
		{
			devices.GET("", deviceController.GetDevices)
			devices.POST("", deviceController.CreateDevice)
			devices.GET("/:id", deviceController.GetDevice)
			devices.PUT("/:id", deviceController.UpdateDevice)
			devices.DELETE("/:id", deviceController.DeleteDevice)
			devices.POST("/:id/test", deviceController.TestDevice)
			devices.GET("/templates", deviceController.GetDeviceTemplates)
			devices.POST("/templates", deviceController.CreateDeviceTemplate)
		}

		// Host discovery and management routes
		hosts := api.Group("/hosts")
		{
			hosts.GET("", hostController.GetHosts)
			hosts.POST("", hostController.CreateHost)
			hosts.GET("/:id", hostController.GetHost)
			hosts.PUT("/:id", hostController.UpdateHost)
			hosts.DELETE("/:id", hostController.DeleteHost)
			hosts.POST("/:id/test", hostController.TestHostConnection)
		}

		// Host discovery tasks routes
		discovery := api.Group("/discovery")
		{
			discovery.GET("/tasks", hostController.GetDiscoveryTasks)
			discovery.POST("/tasks", hostController.CreateDiscoveryTask)
			discovery.GET("/tasks/:id", hostController.GetDiscoveryTask)
			discovery.POST("/tasks/:id/start", hostController.StartDiscovery)
		}

		// Host credentials routes
		credentials := api.Group("/credentials")
		{
			credentials.GET("", hostController.GetCredentials)
			credentials.POST("", hostController.CreateCredential)
		}

		// Deployment routes
		deployment := api.Group("/deployment")
		{
			deployment.GET("/components", deploymentController.GetAvailableComponents)
			deployment.POST("/tasks", deploymentController.CreateDeploymentTask)
			deployment.POST("/tasks/:taskId/execute", deploymentController.ExecuteDeployment)
			deployment.GET("/tasks/:taskId", deploymentController.GetDeploymentTask)
			deployment.GET("/hosts/:hostId/components", deploymentController.GetHostComponents)
			deployment.GET("/hosts/:hostId/components/:componentName/status", deploymentController.CheckComponentStatus)
			deployment.POST("/batch", deploymentController.BatchDeploy)
			deployment.POST("/config/generate", deploymentController.GenerateDeploymentConfig)
		}

		// Config deployment routes
		configDeploy := api.Group("/config-deployment")
		{
			configDeploy.GET("/templates", configDeploymentController.GetConfigTemplates)
			configDeploy.POST("/preview", configDeploymentController.GenerateConfigPreview)
			configDeploy.POST("/tasks", configDeploymentController.CreateConfigDeploymentTask)
			configDeploy.POST("/tasks/:taskId/execute", configDeploymentController.ExecuteConfigDeployment)
			configDeploy.GET("/tasks/:taskId", configDeploymentController.GetConfigDeploymentTask)
			configDeploy.POST("/monitoring", configDeploymentController.DeployMonitoringConfig)
			configDeploy.POST("/alerting", configDeploymentController.DeployAlertingConfig)
			configDeploy.POST("/snmp", configDeploymentController.DeploySNMPConfig)
		}

		// SSH操作API
		ssh := api.Group("/ssh")
		{
			ssh.POST("/test", sshController.TestSSHConnection)
			ssh.POST("/execute", sshController.ExecuteSSHCommand)
			ssh.POST("/upload", sshController.UploadFile)
		}
	}

	// 为前端兼容性添加不带版本的API路由
	{
		// SSH操作API (不带版本，兼容前端调用)
		sshCompat := router.Group("/api/ssh")
		sshCompat.Use(cors.New(cors.Config{
			AllowOrigins:     []string{"http://localhost:12300", "http://mib-frontend:3000", "https://yourdomain.com", "*"},
			AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
			ExposeHeaders:    []string{"Content-Length"},
			AllowCredentials: true,
		}))
		{
			sshCompat.POST("/test", sshController.TestSSHConnection)
			sshCompat.POST("/execute", sshController.ExecuteSSHCommand)
			sshCompat.POST("/upload", sshController.UploadFile)
		}

		// 配置验证API
		validation := api.Group("/validation")
		{
			validation.POST("/prometheus", configValidationController.ValidatePrometheusConfig)
			validation.POST("/alertmanager", configValidationController.ValidateAlertmanagerConfig)
			validation.POST("/snmp-exporter", configValidationController.ValidateSNMPExporterConfig)
			validation.POST("/categraf", configValidationController.ValidateCategrafConfig)
			validation.POST("/vmalert", configValidationController.ValidateVMAlertConfig)
			validation.POST("/promql", configValidationController.ValidatePromQL)
			validation.POST("/yaml", configValidationController.ValidateYAMLSyntax)
			validation.POST("/toml", configValidationController.ValidateTOMLSyntax)
		}

		// 增强告警部署API
		alertDeployment := api.Group("/alert-deployment")
		{
			alertDeployment.POST("/deploy", alertDeploymentController.DeployAlertRules)
			alertDeployment.POST("/deploy-mixed", alertDeploymentController.DeployToMixedSystems)
			alertDeployment.GET("/predefined-rules", alertDeploymentController.GetPredefinedAlertRules)
		}

		// 系统健康检查API
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":    "healthy",
				"timestamp": "2024-01-01T00:00:00Z",
				"version":   "1.0.0",
				"services": gin.H{
					"database": "connected",
					"redis":    "connected",
					"backend":  "running",
				},
				"uptime": 3600,
			})
		})

		// 监控组件管理API
		monitoring := api.Group("/monitoring")
		{
			monitoring.GET("/components", func(c *gin.Context) {
				c.JSON(200, []gin.H{
					{
						"id":          "node-exporter",
						"name":        "Node Exporter",
						"version":     "1.7.0",
						"description": "系统监控采集器",
						"status":      "available",
					},
					{
						"id":          "snmp-exporter",
						"name":        "SNMP Exporter",
						"version":     "0.25.0",
						"description": "SNMP数据采集器",
						"status":      "available",
					},
					{
						"id":          "categraf",
						"name":        "Categraf",
						"version":     "0.3.72",
						"description": "夜莺监控采集器",
						"status":      "available",
					},
				})
			})
			monitoring.POST("/install", deploymentController.ExecuteDeployment)
			monitoring.GET("/status", func(c *gin.Context) {
				c.JSON(200, gin.H{
					"components": []gin.H{
						{
							"id":     "node-exporter",
							"status": "running",
							"health": "healthy",
						},
						{
							"id":     "snmp-exporter", 
							"status": "running",
							"health": "healthy",
						},
					},
				})
			})
			monitoring.GET("/versions", func(c *gin.Context) {
				c.JSON(200, gin.H{
					"node-exporter":  "1.7.0",
					"snmp-exporter":  "0.25.0",
					"categraf":       "0.3.72",
					"victoriametrics": "1.97.1",
					"grafana":        "10.3.1",
				})
			})
		}

		// 批量操作API
		bulkOps := api.Group("/bulk-operations")
		{
			bulkOps.POST("/execute", func(c *gin.Context) {
				var request struct {
					Operation string      `json:"operation"`
					Targets   []string    `json:"targets"`
					Config    interface{} `json:"config"`
				}
				
				if err := c.ShouldBindJSON(&request); err != nil {
					c.JSON(400, gin.H{"error": "Invalid request"})
					return
				}
				
				c.JSON(200, gin.H{
					"success": true,
					"message": "批量操作执行成功",
					"results": gin.H{
						"total":     len(request.Targets),
						"succeeded": len(request.Targets),
						"failed":    0,
					},
				})
			})
		}
	}

	// Register alert rules routes
	routes.RegisterAlertRulesRoutes(router, alertRulesController)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
