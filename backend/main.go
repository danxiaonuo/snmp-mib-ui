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
		AllowOrigins:     []string{"http://localhost:3000", "http://mib-frontend:3000", "https://yourdomain.com", "*"},
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
	prometheusService := services.NewPrometheusService(cfg.PrometheusURL, logger)
	alertRulesService := services.NewAlertRulesService(db, prometheusService, logger)
	hostService := services.NewHostService(db, redis)
	deploymentService := services.NewDeploymentService(db, redis, hostService)
	configDeploymentService := services.NewConfigDeploymentService(db, redis, hostService)

	// Initialize controllers
	mibController := controllers.NewMIBController(db, redis)
	snmpController := controllers.NewSNMPController(db, redis)
	configController := controllers.NewConfigController(db, redis)
	deviceController := controllers.NewDeviceController(db, redis)
	alertRulesController := controllers.NewAlertRulesController(alertRulesService, deviceService, prometheusService)
	hostController := controllers.NewHostController(hostService)
	deploymentController := controllers.NewDeploymentController(deploymentService, hostService)
	configDeploymentController := controllers.NewConfigDeploymentController(configDeploymentService, hostService)



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
