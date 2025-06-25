package routes

import (
	"github.com/gin-gonic/gin"
	"mib-platform/controllers"
	"mib-platform/middleware"
)

// RegisterAlertRulesRoutes 注册告警规则相关路由
func RegisterAlertRulesRoutes(r *gin.Engine, controller *controllers.AlertRulesController) {
	// 告警规则API组
	alertRules := r.Group("/api/v1/alert-rules")
	alertRules.Use(middleware.CORS()) // 跨域中间件
	// alertRules.Use(middleware.Auth()) // 认证中间件（如果需要）

	{
		// 告警规则管理
		alertRules.GET("", controller.GetAlertRules)                    // 获取告警规则列表
		alertRules.POST("", controller.CreateAlertRule)                 // 创建告警规则
		alertRules.GET("/:id", controller.GetAlertRuleByID)             // 获取单个告警规则
		alertRules.PUT("/:id", controller.UpdateAlertRule)              // 更新告警规则
		alertRules.DELETE("/:id", controller.DeleteAlertRule)           // 删除告警规则

		// 批量操作
		alertRules.POST("/batch", controller.BatchCreateAlertRules)     // 批量创建告警规则
		alertRules.PUT("/batch", controller.BatchUpdateAlertRules)      // 批量更新告警规则
		alertRules.DELETE("/batch", controller.BatchDeleteAlertRules)   // 批量删除告警规则

		// 导入导出
		alertRules.POST("/import", controller.ImportRules)              // 导入告警规则
		alertRules.GET("/export", controller.ExportRules)              // 导出告警规则

		// PromQL相关
		alertRules.POST("/validate-promql", controller.ValidatePromQL) // 验证PromQL表达式
		alertRules.GET("/metrics", controller.GetMetrics)              // 获取可用指标
		alertRules.POST("/query", controller.QueryMetrics)             // 查询指标数据
	}

	// 告警规则模板API组
	templates := r.Group("/api/v1/alert-rule-templates")
	templates.Use(middleware.CORS())

	{
		templates.GET("", controller.GetRuleTemplates)                 // 获取规则模板列表
		templates.POST("", controller.CreateRuleTemplate)              // 创建规则模板
		templates.GET("/:id", controller.GetRuleTemplateByID)          // 获取单个规则模板
		templates.PUT("/:id", controller.UpdateRuleTemplate)           // 更新规则模板
		templates.DELETE("/:id", controller.DeleteRuleTemplate)        // 删除规则模板
		templates.POST("/:id/clone", controller.CloneRuleTemplate)     // 克隆规则模板
		templates.POST("/:id/apply", controller.ApplyTemplate)         // 应用模板到设备组
	}

	// 设备分组API组
	deviceGroups := r.Group("/api/v1/device-groups")
	deviceGroups.Use(middleware.CORS())

	{
		deviceGroups.GET("", controller.GetDeviceGroups)               // 获取设备分组列表
		deviceGroups.POST("", controller.CreateDeviceGroup)            // 创建设备分组
		deviceGroups.GET("/:id", controller.GetDeviceGroupByID)        // 获取单个设备分组
		deviceGroups.PUT("/:id", controller.UpdateDeviceGroup)         // 更新设备分组
		deviceGroups.DELETE("/:id", controller.DeleteDeviceGroup)      // 删除设备分组

		// 设备管理
		deviceGroups.POST("/:id/devices", controller.AddDevicesToGroup)    // 添加设备到分组
		deviceGroups.DELETE("/:id/devices", controller.RemoveDevicesFromGroup) // 从分组移除设备
		deviceGroups.GET("/:id/devices", controller.GetDeviceGroupDevices)    // 获取分组下的设备

		// 批量操作
		deviceGroups.POST("/batch", controller.BatchCreateDeviceGroups) // 批量创建设备分组
		deviceGroups.DELETE("/batch", controller.BatchDeleteDeviceGroups) // 批量删除设备分组
	}

	// Alertmanager配置API组 (简化版本)
	alertmanager := r.Group("/api/v1/alertmanager")
	alertmanager.Use(middleware.CORS())

	{
		alertmanager.GET("/config", controller.GetAlertmanagerConfig)     // 获取Alertmanager配置
		alertmanager.PUT("/config", controller.UpdateAlertmanagerConfig)  // 更新Alertmanager配置
	}

	// 配置同步API组 (简化版本)
	sync := r.Group("/api/v1/sync")
	sync.Use(middleware.CORS())

	{
		sync.POST("/config", controller.SyncConfig)                   // 同步配置
		sync.GET("/history", controller.GetSyncHistory)               // 获取同步历史
	}

	// 设备发现API组 (简化版本)
	discovery := r.Group("/api/v1/discovery")
	discovery.Use(middleware.CORS())

	{
		discovery.POST("/scan", controller.DiscoverDevices)           // 扫描发现设备
	}

	// 智能推荐API组 (简化版本)
	recommendations := r.Group("/api/v1/recommendations")
	recommendations.Use(middleware.CORS())

	{
		recommendations.GET("", controller.GetRecommendations)         // 获取推荐列表
		recommendations.POST("/generate", controller.GenerateRecommendations) // 生成推荐
		recommendations.POST("/:id/apply", controller.ApplyRecommendation)     // 应用推荐
		recommendations.POST("/:id/reject", controller.RejectRecommendation)   // 拒绝推荐
	}
}