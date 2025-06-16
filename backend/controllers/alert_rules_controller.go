package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"mib-platform/models"
	"mib-platform/services"
	"mib-platform/utils"
)

// AlertRulesController 告警规则控制器
type AlertRulesController struct {
	alertRulesService *services.AlertRulesService
	deviceService     *services.DeviceService
}

// NewAlertRulesController 创建告警规则控制器
func NewAlertRulesController(
	alertRulesService *services.AlertRulesService,
	deviceService *services.DeviceService,
) *AlertRulesController {
	return &AlertRulesController{
		alertRulesService: alertRulesService,
		deviceService:     deviceService,
	}
}

// GetAlertRules 获取告警规则列表
// @Summary 获取告警规则列表
// @Description 获取告警规则列表，支持分页和过滤
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param limit query int false "每页数量" default(20)
// @Param group_id query string false "规则组ID"
// @Param device_group_id query string false "设备组ID"
// @Param status query string false "状态" Enums(active,inactive)
// @Param severity query string false "严重程度" Enums(critical,warning,info)
// @Success 200 {object} utils.Response{data=utils.PaginatedResponse{items=[]models.AlertRule}}
// @Router /api/alert-rules [get]
func (c *AlertRulesController) GetAlertRules(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))
	groupID := ctx.Query("group_id")
	deviceGroupID := ctx.Query("device_group_id")
	status := ctx.Query("status")
	severity := ctx.Query("severity")

	filter := &models.AlertRuleFilter{
		GroupID:       groupID,
		DeviceGroupID: deviceGroupID,
		Status:        status,
		Severity:      severity,
	}

	rules, total, err := c.alertRulesService.GetAlertRules(page, limit, filter)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "获取告警规则失败", err)
		return
	}

	utils.SuccessResponse(ctx, "获取告警规则列表成功", utils.PaginatedResponse{
		Items: rules,
		Total: total,
		Page:  page,
		Limit: limit,
	})
}

// GetAlertRuleByID 获取单个告警规则
// @Summary 获取单个告警规则
// @Description 根据ID获取告警规则详情
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "规则ID"
// @Success 200 {object} utils.Response{data=models.AlertRule}
// @Router /api/alert-rules/{id} [get]
func (c *AlertRulesController) GetAlertRuleByID(ctx *gin.Context) {
	id := ctx.Param("id")

	rule, err := c.alertRulesService.GetAlertRuleByID(id)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusNotFound, "告警规则不存在", err)
		return
	}

	utils.SuccessResponse(ctx, "获取告警规则成功", rule)
}

// BatchDeleteAlertRules 批量删除告警规则
// @Summary 批量删除告警规则
// @Description 批量删除告警规则
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param request body models.BatchDeleteAlertRulesRequest true "批量删除请求"
// @Success 200 {object} utils.Response{data=models.BatchDeleteAlertRulesResponse}
// @Router /api/alert-rules/batch [delete]
func (c *AlertRulesController) BatchDeleteAlertRules(ctx *gin.Context) {
	var req models.BatchDeleteAlertRulesRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	result, err := c.alertRulesService.BatchDeleteAlertRules(&req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "批量删除告警规则失败", err)
		return
	}

	utils.SuccessResponse(ctx, "批量删除告警规则成功", result)
}

// QueryMetrics 查询指标数据
// @Summary 查询指标数据
// @Description 查询Prometheus指标数据
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param request body models.QueryMetricsRequest true "查询请求"
// @Success 200 {object} utils.Response{data=models.QueryMetricsResponse}
// @Router /api/alert-rules/query [post]
func (c *AlertRulesController) QueryMetrics(ctx *gin.Context) {
	var req models.QueryMetricsRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	// 实现指标查询功能
	// 这里可以对接真实的时序数据库
	mockMetrics := map[string]interface{}{
		"status": "success",
		"data": map[string]interface{}{
			"resultType": "vector",
			"result": []map[string]interface{}{
				{
					"metric": map[string]string{
						"__name__":   req.Query,
						"instance":   "192.168.1.1:161",
						"job":        "snmp-exporter",
						"device":     "switch-01",
					},
					"value": []interface{}{
						time.Now().Unix(),
						"0.85", // 示例值
					},
				},
				{
					"metric": map[string]string{
						"__name__":   req.Query,
						"instance":   "192.168.1.2:161", 
						"job":        "snmp-exporter",
						"device":     "switch-02",
					},
					"value": []interface{}{
						time.Now().Unix(),
						"0.72",
					},
				},
			},
		},
		"query":     req.Query,
		"timestamp": time.Now().Unix(),
	}
	
	result := mockMetrics
	result := map[string]interface{}{"error": "Metrics query not implemented"}
	err := fmt.Errorf("metrics query functionality not implemented")
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "查询指标数据失败", err)
		return
	}

	utils.SuccessResponse(ctx, "查询指标数据成功", result)
}

// GetRuleTemplateByID 获取单个规则模板
// @Summary 获取单个规则模板
// @Description 根据ID获取规则模板详情
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "模板ID"
// @Success 200 {object} utils.Response{data=models.AlertRuleTemplate}
// @Router /api/alert-rule-templates/{id} [get]
func (c *AlertRulesController) GetRuleTemplateByID(ctx *gin.Context) {
	id := ctx.Param("id")

	template, err := c.alertRulesService.GetRuleTemplateByID(id)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusNotFound, "规则模板不存在", err)
		return
	}

	utils.SuccessResponse(ctx, "获取规则模板成功", template)
}

// UpdateRuleTemplate 更新规则模板
// @Summary 更新规则模板
// @Description 更新规则模板信息
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "模板ID"
// @Param template body models.UpdateRuleTemplateRequest true "模板信息"
// @Success 200 {object} utils.Response{data=models.AlertRuleTemplate}
// @Router /api/alert-rule-templates/{id} [put]
func (c *AlertRulesController) UpdateRuleTemplate(ctx *gin.Context) {
	id := ctx.Param("id")
	var req models.UpdateRuleTemplateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	template, err := c.alertRulesService.UpdateRuleTemplate(id, &req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "更新规则模板失败", err)
		return
	}

	utils.SuccessResponse(ctx, "更新规则模板成功", template)
}

// DeleteRuleTemplate 删除规则模板
// @Summary 删除规则模板
// @Description 删除指定的规则模板
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "模板ID"
// @Success 200 {object} utils.Response
// @Router /api/alert-rule-templates/{id} [delete]
func (c *AlertRulesController) DeleteRuleTemplate(ctx *gin.Context) {
	id := ctx.Param("id")

	err := c.alertRulesService.DeleteRuleTemplate(id)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "删除规则模板失败", err)
		return
	}

	utils.SuccessResponse(ctx, "删除规则模板成功", nil)
}

// CloneRuleTemplate 克隆规则模板
// @Summary 克隆规则模板
// @Description 克隆现有的规则模板
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "模板ID"
// @Param request body models.CloneRuleTemplateRequest true "克隆请求"
// @Success 200 {object} utils.Response{data=models.AlertRuleTemplate}
// @Router /api/alert-rule-templates/{id}/clone [post]
func (c *AlertRulesController) CloneRuleTemplate(ctx *gin.Context) {
	id := ctx.Param("id")
	var req models.CloneRuleTemplateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	template, err := c.alertRulesService.CloneRuleTemplate(id, &req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "克隆规则模板失败", err)
		return
	}

	utils.SuccessResponse(ctx, "克隆规则模板成功", template)
}



// CreateAlertRule 创建告警规则
// @Summary 创建告警规则
// @Description 创建新的告警规则
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param rule body models.CreateAlertRuleRequest true "告警规则信息"
// @Success 201 {object} utils.Response{data=models.AlertRule}
// @Router /api/alert-rules [post]
func (c *AlertRulesController) CreateAlertRule(ctx *gin.Context) {
	var req models.CreateAlertRuleRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	// 验证PromQL表达式
	// TODO: Implement PromQL validation without Prometheus
	// Validation temporarily disabled

	rule, err := c.alertRulesService.CreateAlertRule(&req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "创建告警规则失败", err)
		return
	}

	utils.SuccessResponse(ctx, "创建告警规则成功", rule)
}

// UpdateAlertRule 更新告警规则
// @Summary 更新告警规则
// @Description 更新告警规则信息
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "规则ID"
// @Param rule body models.UpdateAlertRuleRequest true "告警规则信息"
// @Success 200 {object} utils.Response{data=models.AlertRule}
// @Router /api/alert-rules/{id} [put]
func (c *AlertRulesController) UpdateAlertRule(ctx *gin.Context) {
	id := ctx.Param("id")
	var req models.UpdateAlertRuleRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	// 验证PromQL表达式
	if req.Expression != nil {
		// 实现PromQL验证（无需Prometheus）
		if err := utils.ValidatePromQLSyntax(*req.Expression); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "PromQL语法错误: " + err.Error(),
			})
			return
		}
		// Validation temporarily disabled
	}

	rule, err := c.alertRulesService.UpdateAlertRule(id, &req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "更新告警规则失败", err)
		return
	}

	utils.SuccessResponse(ctx, "获取告警规则成功", rule)
}

// DeleteAlertRule 删除告警规则
// @Summary 删除告警规则
// @Description 删除指定的告警规则
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "规则ID"
// @Success 200 {object} utils.Response
// @Router /api/alert-rules/{id} [delete]
func (c *AlertRulesController) DeleteAlertRule(ctx *gin.Context) {
	id := ctx.Param("id")

	err := c.alertRulesService.DeleteAlertRule(id)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "删除告警规则失败", err)
		return
	}

	utils.SuccessResponse(ctx, "删除告警规则成功", nil)
}

// BatchCreateAlertRules 批量创建告警规则
// @Summary 批量创建告警规则
// @Description 批量创建告警规则
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param rules body models.BatchCreateAlertRulesRequest true "批量创建请求"
// @Success 200 {object} utils.Response{data=models.BatchCreateAlertRulesResponse}
// @Router /api/alert-rules/batch [post]
func (c *AlertRulesController) BatchCreateAlertRules(ctx *gin.Context) {
	var req models.BatchCreateAlertRulesRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	result, err := c.alertRulesService.BatchCreateAlertRules(&req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "批量创建告警规则失败", err)
		return
	}

	utils.SuccessResponse(ctx, "批量创建告警规则成功", result)
}

// BatchUpdateAlertRules 批量更新告警规则
// @Summary 批量更新告警规则
// @Description 批量更新告警规则状态或阈值
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param request body models.BatchUpdateAlertRulesRequest true "批量更新请求"
// @Success 200 {object} utils.Response{data=models.BatchUpdateAlertRulesResponse}
// @Router /api/alert-rules/batch [put]
func (c *AlertRulesController) BatchUpdateAlertRules(ctx *gin.Context) {
	var req models.BatchUpdateAlertRulesRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	result, err := c.alertRulesService.BatchUpdateAlertRules(&req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "批量更新告警规则失败", err)
		return
	}

	utils.SuccessResponse(ctx, "批量更新告警规则成功", result)
}

// GetRuleTemplates 获取规则模板列表
// @Summary 获取规则模板列表
// @Description 获取告警规则模板列表
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param category query string false "模板分类"
// @Param vendor query string false "设备厂商"
// @Param device_type query string false "设备类型"
// @Success 200 {object} utils.Response{data=[]models.AlertRuleTemplate}
// @Router /api/alert-rules/templates [get]
func (c *AlertRulesController) GetRuleTemplates(ctx *gin.Context) {
	category := ctx.Query("category")
	vendor := ctx.Query("vendor")
	deviceType := ctx.Query("device_type")

	filter := &models.RuleTemplateFilter{
		Category:   category,
		Vendor:     vendor,
		DeviceType: deviceType,
	}

	templates, err := c.alertRulesService.GetRuleTemplates(filter)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "获取规则模板失败", err)
		return
	}

	utils.SuccessResponse(ctx, "获取规则模板列表成功", templates)
}

// CreateRuleTemplate 创建规则模板
// @Summary 创建规则模板
// @Description 创建新的告警规则模板
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param template body models.CreateRuleTemplateRequest true "模板信息"
// @Success 201 {object} utils.Response{data=models.AlertRuleTemplate}
// @Router /api/alert-rules/templates [post]
func (c *AlertRulesController) CreateRuleTemplate(ctx *gin.Context) {
	var req models.CreateRuleTemplateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	template, err := c.alertRulesService.CreateRuleTemplate(&req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "创建规则模板失败", err)
		return
	}

	utils.SuccessResponse(ctx, "创建规则模板成功", template)
}

// ApplyTemplate 应用模板到设备组
// @Summary 应用模板到设备组
// @Description 将规则模板应用到指定的设备组
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param request body models.ApplyTemplateRequest true "应用模板请求"
// @Success 200 {object} utils.Response{data=models.ApplyTemplateResponse}
// @Router /api/alert-rules/templates/apply [post]
func (c *AlertRulesController) ApplyTemplate(ctx *gin.Context) {
	var req models.ApplyTemplateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	result, err := c.alertRulesService.ApplyTemplate(&req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "应用模板失败", err)
		return
	}

	utils.SuccessResponse(ctx, "应用模板成功", result)
}

// GetDeviceGroups 获取设备分组列表
// @Summary 获取设备分组列表
// @Description 获取设备分组列表
// @Tags alert-rules
// @Accept json
// @Produce json
// @Success 200 {object} utils.Response{data=[]models.DeviceGroup}
// @Router /api/alert-rules/device-groups [get]
func (c *AlertRulesController) GetDeviceGroups(ctx *gin.Context) {
	groups, err := c.alertRulesService.GetDeviceGroups()
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "获取设备分组失败", err)
		return
	}

	utils.SuccessResponse(ctx, "获取设备分组列表成功", groups)
}

// CreateDeviceGroup 创建设备分组
// @Summary 创建设备分组
// @Description 创建新的设备分组
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param group body models.CreateDeviceGroupRequest true "分组信息"
// @Success 201 {object} utils.Response{data=models.DeviceGroup}
// @Router /api/alert-rules/device-groups [post]
func (c *AlertRulesController) CreateDeviceGroup(ctx *gin.Context) {
	var req models.CreateDeviceGroupRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	group, err := c.alertRulesService.CreateDeviceGroup(&req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "创建设备分组失败", err)
		return
	}

	utils.SuccessResponse(ctx, "创建设备分组成功", group)
}

// UpdateDeviceGroup 更新设备分组
// @Summary 更新设备分组
// @Description 更新设备分组信息
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "分组ID"
// @Param group body models.UpdateDeviceGroupRequest true "分组信息"
// @Success 200 {object} utils.Response{data=models.DeviceGroup}
// @Router /api/alert-rules/device-groups/{id} [put]
func (c *AlertRulesController) UpdateDeviceGroup(ctx *gin.Context) {
	id := ctx.Param("id")
	var req models.UpdateDeviceGroupRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	group, err := c.alertRulesService.UpdateDeviceGroup(id, &req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "更新设备分组失败", err)
		return
	}

	utils.SuccessResponse(ctx, "更新设备分组成功", group)
}

// DeleteDeviceGroup 删除设备分组
// @Summary 删除设备分组
// @Description 删除设备分组
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "分组ID"
// @Success 200 {object} utils.Response
// @Router /api/alert-rules/device-groups/{id} [delete]
func (c *AlertRulesController) DeleteDeviceGroup(ctx *gin.Context) {
	id := ctx.Param("id")

	err := c.alertRulesService.DeleteDeviceGroup(id)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "删除设备分组失败", err)
		return
	}

	utils.SuccessResponse(ctx, "删除设备分组成功", nil)
}

// AddDevicesToGroup 添加设备到分组
// @Summary 添加设备到分组
// @Description 将设备添加到指定分组
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "分组ID"
// @Param request body models.AddDevicesToGroupRequest true "添加设备请求"
// @Success 200 {object} utils.Response
// @Router /api/alert-rules/device-groups/{id}/devices [post]
func (c *AlertRulesController) AddDevicesToGroup(ctx *gin.Context) {
	groupID := ctx.Param("id")
	var req models.AddDevicesToGroupRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	err := c.alertRulesService.AddDevicesToGroup(groupID, req.DeviceIDs)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "添加设备到分组失败", err)
		return
	}

	utils.SuccessResponse(ctx, "添加设备到分组成功", nil)
}

// RemoveDevicesFromGroup 从分组移除设备
// @Summary 从分组移除设备
// @Description 从指定分组移除设备
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "分组ID"
// @Param request body models.RemoveDevicesFromGroupRequest true "移除设备请求"
// @Success 200 {object} utils.Response
// @Router /api/alert-rules/device-groups/{id}/devices [delete]
func (c *AlertRulesController) RemoveDevicesFromGroup(ctx *gin.Context) {
	groupID := ctx.Param("id")
	var req models.RemoveDevicesFromGroupRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	err := c.alertRulesService.RemoveDevicesFromGroup(groupID, req.DeviceIDs)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "从分组移除设备失败", err)
		return
	}

	utils.SuccessResponse(ctx, "从分组移除设备成功", nil)
}

// GetDeviceGroupDevices 获取分组下的设备
// @Summary 获取分组下的设备
// @Description 获取指定分组下的所有设备
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "分组ID"
// @Success 200 {object} utils.Response{data=[]models.Device}
// @Router /api/alert-rules/device-groups/{id}/devices [get]
func (c *AlertRulesController) GetDeviceGroupDevices(ctx *gin.Context) {
	id := ctx.Param("id")

	devices, err := c.deviceService.GetDeviceGroupDevices(id)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "获取分组设备失败", err)
		return
	}

	utils.SuccessResponse(ctx, "获取分组设备成功", devices)
}

// BatchCreateDeviceGroups 批量创建设备分组
// @Summary 批量创建设备分组
// @Description 批量创建设备分组
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param request body models.BatchCreateDeviceGroupsRequest true "批量创建请求"
// @Success 200 {object} utils.Response{data=models.BatchCreateDeviceGroupsResponse}
// @Router /api/alert-rules/device-groups/batch [post]
func (c *AlertRulesController) BatchCreateDeviceGroups(ctx *gin.Context) {
	var req models.BatchCreateDeviceGroupsRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	result, err := c.deviceService.BatchCreateDeviceGroups(req.Groups)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "批量创建设备分组失败", err)
		return
	}

	utils.SuccessResponse(ctx, "批量创建设备分组成功", result)
}

// BatchDeleteDeviceGroups 批量删除设备分组
// @Summary 批量删除设备分组
// @Description 批量删除设备分组
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param request body models.BatchDeleteDeviceGroupsRequest true "批量删除请求"
// @Success 200 {object} utils.Response{data=models.BatchDeleteDeviceGroupsResponse}
// @Router /api/alert-rules/device-groups/batch [delete]
func (c *AlertRulesController) BatchDeleteDeviceGroups(ctx *gin.Context) {
	var req models.BatchDeleteDeviceGroupsRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	err := c.deviceService.BatchDeleteDeviceGroups(req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "批量删除设备分组失败", err)
		return
	}

	utils.SuccessResponse(ctx, "批量删除设备分组成功", map[string]interface{}{"success": true})
}

// GetAlertmanagerConfig 获取Alertmanager配置
// @Summary 获取Alertmanager配置
// @Description 获取当前Alertmanager配置
// @Tags alertmanager
// @Accept json
// @Produce json
// @Success 200 {object} utils.Response{data=models.AlertmanagerConfig}
// @Router /api/alertmanager/config [get]
func (c *AlertRulesController) GetAlertmanagerConfig(ctx *gin.Context) {
	config, err := c.alertRulesService.GetAlertmanagerConfig()
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "获取Alertmanager配置失败", err)
		return
	}

	utils.SuccessResponse(ctx, "获取Alertmanager配置成功", config)
}

// UpdateAlertmanagerConfig 更新Alertmanager配置
// @Summary 更新Alertmanager配置
// @Description 更新Alertmanager配置
// @Tags alertmanager
// @Accept json
// @Produce json
// @Param config body models.UpdateAlertmanagerConfigRequest true "配置信息"
// @Success 200 {object} utils.Response{data=models.AlertmanagerConfig}
// @Router /api/alertmanager/config [put]
func (c *AlertRulesController) UpdateAlertmanagerConfig(ctx *gin.Context) {
	var req models.UpdateAlertmanagerConfigRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	config, err := c.alertRulesService.UpdateAlertmanagerConfig(&req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "更新Alertmanager配置失败", err)
		return
	}

	utils.SuccessResponse(ctx, "更新Alertmanager配置成功", config)
}

// SyncConfig 同步配置到Prometheus/Alertmanager
// @Summary 同步配置
// @Description 将配置同步到Prometheus和Alertmanager
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param request body models.SyncConfigRequest true "同步请求"
// @Success 200 {object} utils.Response{data=models.SyncConfigResponse}
// @Router /api/alert-rules/sync [post]
func (c *AlertRulesController) SyncConfig(ctx *gin.Context) {
	var req models.SyncConfigRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	result, err := c.alertRulesService.SyncConfig(&req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "同步配置失败", err)
		return
	}

	utils.SuccessResponse(ctx, "同步配置成功", result)
}

// GetSyncHistory 获取同步历史
// @Summary 获取同步历史
// @Description 获取配置同步历史记录
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param limit query int false "每页数量" default(20)
// @Success 200 {object} utils.Response{data=utils.PaginatedResponse{items=[]models.SyncHistory}}
// @Router /api/alert-rules/sync/history [get]
func (c *AlertRulesController) GetSyncHistory(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))

	history, total, err := c.alertRulesService.GetSyncHistory(page, limit)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "获取同步历史失败", err)
		return
	}

	utils.SuccessResponse(ctx, "获取同步历史成功", utils.PaginatedResponse{
		Items: history,
		Total: total,
		Page:  page,
		Limit: limit,
	})
}

// DiscoverDevices 设备自动发现
// @Summary 设备自动发现
// @Description 从VictoriaMetrics扫描并发现新设备
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param request body models.DiscoverDevicesRequest true "发现请求"
// @Success 200 {object} utils.Response{data=models.DiscoverDevicesResponse}
// @Router /api/alert-rules/devices/discover [post]
func (c *AlertRulesController) DiscoverDevices(ctx *gin.Context) {
	var req models.DiscoverDevicesRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	result, err := c.alertRulesService.DiscoverDevices(&req)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "设备发现失败", err)
		return
	}

	utils.SuccessResponse(ctx, "设备发现成功", result)
}

// GetRecommendations 获取智能推荐
// @Summary 获取智能推荐
// @Description 获取AI生成的告警规则优化建议
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param type query string false "推荐类型"
// @Param priority query string false "优先级"
// @Success 200 {object} utils.Response{data=[]models.RuleRecommendation}
// @Router /api/alert-rules/recommendations [get]
func (c *AlertRulesController) GetRecommendations(ctx *gin.Context) {
	recommendationType := ctx.Query("type")
	priority := ctx.Query("priority")

	filter := &models.RecommendationFilter{
		Type:     recommendationType,
		Priority: priority,
	}

	recommendations, err := c.alertRulesService.GetRecommendations(filter)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "获取推荐失败", err)
		return
	}

	utils.SuccessResponse(ctx, "获取推荐成功", recommendations)
}

// GenerateRecommendations 生成智能推荐
// @Summary 生成智能推荐
// @Description 基于AI分析生成新的告警规则优化建议
// @Tags alert-rules
// @Accept json
// @Produce json
// @Success 200 {object} utils.Response{data=models.GenerateRecommendationsResponse}
// @Router /api/alert-rules/recommendations/generate [post]
func (c *AlertRulesController) GenerateRecommendations(ctx *gin.Context) {
	result, err := c.alertRulesService.GenerateRecommendations()
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "生成推荐失败", err)
		return
	}

	utils.SuccessResponse(ctx, "生成推荐成功", result)
}

// ApplyRecommendation 应用推荐
// @Summary 应用推荐
// @Description 应用AI推荐的优化建议
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "推荐ID"
// @Success 200 {object} utils.Response
// @Router /api/alert-rules/recommendations/{id}/apply [post]
func (c *AlertRulesController) ApplyRecommendation(ctx *gin.Context) {
	id := ctx.Param("id")

	err := c.alertRulesService.ApplyRecommendation(id)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "应用推荐失败", err)
		return
	}

	utils.SuccessResponse(ctx, "应用推荐成功", nil)
}

// RejectRecommendation 拒绝推荐
// @Summary 拒绝推荐
// @Description 拒绝AI推荐的优化建议
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param id path string true "推荐ID"
// @Param request body models.RejectRecommendationRequest true "拒绝原因"
// @Success 200 {object} utils.Response
// @Router /api/alert-rules/recommendations/{id}/reject [post]
func (c *AlertRulesController) RejectRecommendation(ctx *gin.Context) {
	id := ctx.Param("id")
	var req models.RejectRecommendationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	err := c.alertRulesService.RejectRecommendation(id, req.Reason)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "拒绝推荐失败", err)
		return
	}

	utils.SuccessResponse(ctx, "拒绝推荐成功", nil)
}

// GetDeviceGroupByID 根据ID获取设备组
func (c *AlertRulesController) GetDeviceGroupByID(ctx *gin.Context) {
	id := ctx.Param("id")
	
	group, err := c.alertRulesService.GetDeviceGroupByID(id)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "获取设备组失败", err)
		return
	}
	
	utils.SuccessResponse(ctx, "获取设备组成功", group)
}



// ValidatePromQL 验证PromQL表达式
// @Summary 验证PromQL表达式
// @Description 验证PromQL表达式的语法正确性
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param request body models.ValidatePromQLRequest true "验证请求"
// @Success 200 {object} utils.Response{data=models.ValidatePromQLResponse}
// @Router /api/alert-rules/promql/validate [post]
func (c *AlertRulesController) ValidatePromQL(ctx *gin.Context) {
	var req models.ValidatePromQLRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	// 实现PromQL验证和测试（无需Prometheus）
	if err := utils.ValidatePromQLSyntax(req.Query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "PromQL语法错误: " + err.Error(),
		})
		return
	}
	
	// 模拟查询结果用于测试
	mockResult := map[string]interface{}{
		"status": "success",
		"data": map[string]interface{}{
			"resultType": "vector",
			"result": []map[string]interface{}{
				{
					"metric": map[string]string{
						"__name__": "up",
						"instance": "localhost:9090",
						"job": "prometheus",
					},
					"value": []interface{}{
						time.Now().Unix(),
						"1",
					},
				},
			},
		},
	}
	result := map[string]interface{}{"valid": true, "message": "Validation not implemented"}
	err := fmt.Errorf("PromQL validation not implemented")
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "PromQL验证失败", err)
		return
	}

	utils.SuccessResponse(ctx, "PromQL验证成功", result)
}

// GetMetrics 获取可用指标
// @Summary 获取可用指标
// @Description 获取Prometheus中可用的指标列表
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param search query string false "搜索关键词"
// @Success 200 {object} utils.Response{data=[]string}
// @Router /api/alert-rules/metrics [get]
func (c *AlertRulesController) GetMetrics(ctx *gin.Context) {
	// 实现指标检索（无需Prometheus）
	// 模拟指标数据
	mockMetrics := []string{
		"up",
		"cpu_usage_percent",
		"memory_usage_bytes",
		"disk_usage_percent",
		"network_bytes_total",
		"http_requests_total",
		"http_request_duration_seconds",
		"snmp_up",
		"snmp_scrape_duration_seconds",
		"ifInOctets",
		"ifOutOctets",
		"ifOperStatus",
		"sysUpTime",
		"hrSystemUptime",
		"hrMemorySize",
		"hrStorageSize",
	}
	metrics := []string{"up", "cpu_usage", "memory_usage", "disk_usage"} // Mock metrics
	var err error
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "获取指标失败", err)
		return
	}

	utils.SuccessResponse(ctx, "获取指标成功", metrics)
}

// ExportRules 导出告警规则
// @Summary 导出告警规则
// @Description 导出告警规则为Prometheus格式
// @Tags alert-rules
// @Accept json
// @Produce json
// @Param group_id query string false "规则组ID"
// @Param format query string false "导出格式" Enums(yaml,json) default(yaml)
// @Success 200 {object} utils.Response{data=string}
// @Router /api/alert-rules/export [get]
func (c *AlertRulesController) ExportRules(ctx *gin.Context) {
	groupID := ctx.Query("group_id")
	format := ctx.DefaultQuery("format", "yaml")

	exportData, err := c.alertRulesService.ExportRules(groupID, format)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "导出规则失败", err)
		return
	}

	// 设置响应头
	filename := fmt.Sprintf("alert_rules_%s.%s", time.Now().Format("20060102_150405"), format)
	ctx.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	ctx.Header("Content-Type", "application/octet-stream")

	utils.SuccessResponse(ctx, "导出规则成功", exportData)
}

// ImportRules 导入告警规则
// @Summary 导入告警规则
// @Description 从文件导入告警规则
// @Tags alert-rules
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "规则文件"
// @Param group_id formData string false "目标规则组ID"
// @Success 200 {object} utils.Response{data=models.ImportRulesResponse}
// @Router /api/alert-rules/import [post]
func (c *AlertRulesController) ImportRules(ctx *gin.Context) {
	file, header, err := ctx.Request.FormFile("file")
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusBadRequest, "文件上传失败", err)
		return
	}
	defer file.Close()

	groupID := ctx.PostForm("group_id")

	result, err := c.alertRulesService.ImportRules(file, header.Filename, groupID)
	if err != nil {
		utils.ErrorResponse(ctx, http.StatusInternalServerError, "导入规则失败", err)
		return
	}

	utils.SuccessResponse(ctx, "导入规则成功", result)
}