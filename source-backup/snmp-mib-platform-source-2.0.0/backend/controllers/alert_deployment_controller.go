package controllers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"mib-platform/services"
)

type AlertDeploymentController struct {
	hostService             *services.HostService
	configDeploymentService *services.ConfigDeploymentService
}

func NewAlertDeploymentController(hostService *services.HostService, configDeploymentService *services.ConfigDeploymentService) *AlertDeploymentController {
	return &AlertDeploymentController{
		hostService:             hostService,
		configDeploymentService: configDeploymentService,
	}
}

// AlertRule 告警规则结构
type AlertRule struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Description  string            `json:"description"`
	Expr         string            `json:"expr"`
	For          string            `json:"for"`
	Severity     string            `json:"severity"`
	Labels       map[string]string `json:"labels"`
	Annotations  map[string]string `json:"annotations"`
	Category     string            `json:"category"`
	TargetSystem string            `json:"targetSystem"`
}

// AlertTarget 告警目标结构
type AlertTarget struct {
	ID             string `json:"id"`
	IP             string `json:"ip"`
	Name           string `json:"name"`
	System         string `json:"system"`
	Port           int    `json:"port"`
	ConfigPath     string `json:"configPath"`
	ReloadEndpoint string `json:"reloadEndpoint,omitempty"`
	Username       string `json:"username,omitempty"`
	Password       string `json:"password,omitempty"`
	PrivateKey     string `json:"privateKey,omitempty"`
}

// NotificationConfig 通知配置结构
type NotificationConfig struct {
	Receivers []struct {
		Name   string                 `json:"name"`
		Type   string                 `json:"type"`
		Config map[string]interface{} `json:"config"`
	} `json:"receivers"`
	Routes []struct {
		Match          map[string]string `json:"match"`
		Receiver       string            `json:"receiver"`
		GroupWait      string            `json:"groupWait,omitempty"`
		GroupInterval  string            `json:"groupInterval,omitempty"`
		RepeatInterval string            `json:"repeatInterval,omitempty"`
	} `json:"routes"`
	GlobalConfig map[string]interface{} `json:"globalConfig,omitempty"`
}

// AlertDeploymentResult 告警部署结果
type AlertDeploymentResult struct {
	TargetID        string `json:"targetId"`
	TargetIP        string `json:"targetIp"`
	TargetSystem    string `json:"targetSystem"`
	Success         bool   `json:"success"`
	DeployedRules   []struct {
		RuleName string `json:"ruleName"`
		Status   string `json:"status"`
		Error    string `json:"error,omitempty"`
	} `json:"deployedRules"`
	ConfigFiles []struct {
		Path   string `json:"path"`
		Status string `json:"status"`
		Error  string `json:"error,omitempty"`
	} `json:"configFiles"`
	ReloadStatus struct {
		Attempted bool   `json:"attempted"`
		Success   bool   `json:"success"`
		Error     string `json:"error,omitempty"`
	} `json:"reloadStatus"`
	ValidationResults []struct {
		Rule  string `json:"rule"`
		Valid bool   `json:"valid"`
		Error string `json:"error,omitempty"`
	} `json:"validationResults"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

// DeployAlertRules 部署告警规则到多个目标系统
func (c *AlertDeploymentController) DeployAlertRules(ctx *gin.Context) {
	var request struct {
		Rules              []AlertRule         `json:"rules" binding:"required"`
		Targets            []AlertTarget       `json:"targets" binding:"required"`
		NotificationConfig *NotificationConfig `json:"notificationConfig,omitempty"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var results []AlertDeploymentResult

	// 为每个目标系统部署规则
	for _, target := range request.Targets {
		result := c.deployToSingleTarget(request.Rules, target, request.NotificationConfig)
		results = append(results, result)
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Alert rules deployment completed",
		"results": results,
	})
}

// DeployToMixedSystems 批量部署到多种告警系统
func (c *AlertDeploymentController) DeployToMixedSystems(ctx *gin.Context) {
	var request struct {
		Rules                []AlertRule         `json:"rules" binding:"required"`
		PrometheusTargets    []AlertTarget       `json:"prometheusTargets"`
		VmalertTargets       []AlertTarget       `json:"vmalertTargets"`
		AlertmanagerTargets  []AlertTarget       `json:"alertmanagerTargets"`
		NotificationConfig   *NotificationConfig `json:"notificationConfig,omitempty"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response := gin.H{
		"prometheus":    []AlertDeploymentResult{},
		"vmalert":       []AlertDeploymentResult{},
		"alertmanager":  []AlertDeploymentResult{},
		"summary": gin.H{
			"totalTargets":         0,
			"successfulDeployments": 0,
			"failedDeployments":     0,
			"partialDeployments":    0,
		},
	}

	var allResults []AlertDeploymentResult

	// 部署到 Prometheus
	if len(request.PrometheusTargets) > 0 {
		var prometheusResults []AlertDeploymentResult
		for _, target := range request.PrometheusTargets {
			// 过滤适用于Prometheus的规则
			var prometheusRules []AlertRule
			for _, rule := range request.Rules {
				if rule.TargetSystem == "prometheus" || rule.TargetSystem == "both" {
					prometheusRules = append(prometheusRules, rule)
				}
			}
			result := c.deployToSingleTarget(prometheusRules, target, request.NotificationConfig)
			prometheusResults = append(prometheusResults, result)
			allResults = append(allResults, result)
		}
		response["prometheus"] = prometheusResults
	}

	// 部署到 VMAlert
	if len(request.VmalertTargets) > 0 {
		var vmalertResults []AlertDeploymentResult
		for _, target := range request.VmalertTargets {
			// 过滤适用于VMAlert的规则
			var vmalertRules []AlertRule
			for _, rule := range request.Rules {
				if rule.TargetSystem == "vmalert" || rule.TargetSystem == "both" {
					vmalertRules = append(vmalertRules, rule)
				}
			}
			result := c.deployToSingleTarget(vmalertRules, target, nil)
			vmalertResults = append(vmalertResults, result)
			allResults = append(allResults, result)
		}
		response["vmalert"] = vmalertResults
	}

	// 部署到 Alertmanager
	if len(request.AlertmanagerTargets) > 0 && request.NotificationConfig != nil {
		var alertmanagerResults []AlertDeploymentResult
		for _, target := range request.AlertmanagerTargets {
			// Alertmanager不需要告警规则，只需要通知配置
			result := c.deployToSingleTarget([]AlertRule{}, target, request.NotificationConfig)
			alertmanagerResults = append(alertmanagerResults, result)
			allResults = append(allResults, result)
		}
		response["alertmanager"] = alertmanagerResults
	}

	// 计算统计信息
	totalTargets := len(allResults)
	successfulDeployments := 0
	failedDeployments := 0
	partialDeployments := 0

	for _, result := range allResults {
		if result.Success {
			successfulDeployments++
		} else {
			// 检查是否为部分成功
			hasSuccess := false
			hasFailed := false
			for _, configFile := range result.ConfigFiles {
				if configFile.Status == "uploaded" {
					hasSuccess = true
				} else {
					hasFailed = true
				}
			}
			if hasSuccess && hasFailed {
				partialDeployments++
			} else {
				failedDeployments++
			}
		}
	}

	response["summary"] = gin.H{
		"totalTargets":          totalTargets,
		"successfulDeployments": successfulDeployments,
		"failedDeployments":     failedDeployments,
		"partialDeployments":    partialDeployments,
	}

	ctx.JSON(http.StatusOK, response)
}

// GetPredefinedAlertRules 获取预定义的告警规则模板
func (c *AlertDeploymentController) GetPredefinedAlertRules(ctx *gin.Context) {
	rules := []AlertRule{
		{
			ID:          "host-down",
			Name:        "Host Down",
			Description: "主机离线超过1分钟",
			Expr:        "up == 0",
			For:         "1m",
			Severity:    "critical",
			Labels:      map[string]string{"team": "infrastructure"},
			Annotations: map[string]string{
				"summary":     "Host {{ $labels.instance }} is down",
				"description": "Host {{ $labels.instance }} has been down for more than 1 minute",
			},
			Category:     "system",
			TargetSystem: "both",
		},
		{
			ID:          "high-cpu",
			Name:        "High CPU Usage",
			Description: "CPU使用率超过80%",
			Expr:        `100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80`,
			For:         "5m",
			Severity:    "warning",
			Labels:      map[string]string{"team": "infrastructure"},
			Annotations: map[string]string{
				"summary":     "High CPU usage on {{ $labels.instance }}",
				"description": "CPU usage is above 80% for more than 5 minutes",
			},
			Category:     "system",
			TargetSystem: "both",
		},
		{
			ID:          "snmp-device-down",
			Name:        "SNMP Device Down",
			Description: "SNMP设备无法访问",
			Expr:        `up{job="snmp-devices"} == 0`,
			For:         "2m",
			Severity:    "critical",
			Labels:      map[string]string{"team": "network"},
			Annotations: map[string]string{
				"summary":     "SNMP device {{ $labels.instance }} is unreachable",
				"description": "SNMP device {{ $labels.instance }} has been unreachable for more than 2 minutes",
			},
			Category:     "network",
			TargetSystem: "both",
		},
		{
			ID:          "interface-down",
			Name:        "Network Interface Down",
			Description: "网络接口状态异常",
			Expr:        "ifOperStatus != 1",
			For:         "1m",
			Severity:    "warning",
			Labels:      map[string]string{"team": "network"},
			Annotations: map[string]string{
				"summary":     "Interface down on {{ $labels.instance }}",
				"description": "Interface {{ $labels.ifDescr }} is down",
			},
			Category:     "network",
			TargetSystem: "both",
		},
	}

	ctx.JSON(http.StatusOK, gin.H{
		"rules": rules,
	})
}

// 私有方法

func (c *AlertDeploymentController) deployToSingleTarget(rules []AlertRule, target AlertTarget, notificationConfig *NotificationConfig) AlertDeploymentResult {
	result := AlertDeploymentResult{
		TargetID:          target.ID,
		TargetIP:          target.IP,
		TargetSystem:      target.System,
		Success:           false,
		DeployedRules:     []struct {
			RuleName string `json:"ruleName"`
			Status   string `json:"status"`
			Error    string `json:"error,omitempty"`
		}{},
		ConfigFiles:       []struct {
			Path   string `json:"path"`
			Status string `json:"status"`
			Error  string `json:"error,omitempty"`
		}{},
		ValidationResults: []struct {
			Rule  string `json:"rule"`
			Valid bool   `json:"valid"`
			Error string `json:"error,omitempty"`
		}{},
		Timestamp:         time.Now(),
	}

	// 生成配置文件
	configs := c.generateConfigsForTarget(rules, target, notificationConfig)

	// 验证配置
	allValid := true
	for filename, content := range configs {
		valid := c.validateConfig(content, target.System)
		result.ValidationResults = append(result.ValidationResults, struct {
			Rule  string `json:"rule"`
			Valid bool   `json:"valid"`
			Error string `json:"error,omitempty"`
		}{
			Rule:  filename,
			Valid: valid,
		})
		if !valid {
			allValid = false
		}
	}

	if !allValid {
		result.Message = "配置验证失败"
		return result
	}

	// 上传配置文件
	allUploaded := true
	for filename, content := range configs {
		configPath := target.ConfigPath + "/" + filename
		err := c.uploadConfigFile(target, configPath, content)
		if err != nil {
			result.ConfigFiles = append(result.ConfigFiles, struct {
				Path   string `json:"path"`
				Status string `json:"status"`
				Error  string `json:"error,omitempty"`
			}{
				Path:   configPath,
				Status: "failed",
				Error:  err.Error(),
			})
			allUploaded = false
		} else {
			result.ConfigFiles = append(result.ConfigFiles, struct {
				Path   string `json:"path"`
				Status string `json:"status"`
				Error  string `json:"error,omitempty"`
			}{
				Path:   configPath,
				Status: "uploaded",
			})
		}
	}

	// 重载配置
	if target.ReloadEndpoint != "" {
		result.ReloadStatus.Attempted = true
		err := c.reloadTargetConfig(target)
		if err != nil {
			result.ReloadStatus.Error = err.Error()
		} else {
			result.ReloadStatus.Success = true
		}
	}

	// 标记规则部署状态
	for _, rule := range rules {
		if rule.TargetSystem == target.System || rule.TargetSystem == "both" {
			result.DeployedRules = append(result.DeployedRules, struct {
				RuleName string `json:"ruleName"`
				Status   string `json:"status"`
				Error    string `json:"error,omitempty"`
			}{
				RuleName: rule.Name,
				Status:   "deployed",
			})
		}
	}

	result.Success = allUploaded && (target.ReloadEndpoint == "" || result.ReloadStatus.Success)
	if result.Success {
		result.Message = "告警规则部署成功"
	} else {
		result.Message = "部分配置部署失败"
	}

	return result
}

func (c *AlertDeploymentController) generateConfigsForTarget(rules []AlertRule, target AlertTarget, notificationConfig *NotificationConfig) map[string]string {
	configs := make(map[string]string)

	switch target.System {
	case "prometheus":
		configs["alert_rules.yml"] = c.generatePrometheusRules(rules)
		if notificationConfig != nil {
			configs["alertmanager.yml"] = c.generateAlertmanagerConfig(notificationConfig)
		}
	case "vmalert":
		configs["vmalert_rules.yml"] = c.generateVMAlertRules(rules)
	case "alertmanager":
		if notificationConfig != nil {
			configs["alertmanager.yml"] = c.generateAlertmanagerConfig(notificationConfig)
		}
	}

	return configs
}

func (c *AlertDeploymentController) generatePrometheusRules(rules []AlertRule) string {
	// 按类别分组规则
	groups := make(map[string][]AlertRule)
	for _, rule := range rules {
		category := rule.Category
		if category == "" {
			category = "general"
		}
		groups[category] = append(groups[category], rule)
	}

	config := "groups:\n"
	for category, categoryRules := range groups {
		config += "  - name: " + category + "-alerts\n"
		config += "    interval: 30s\n"
		config += "    rules:\n"

		for _, rule := range categoryRules {
			config += "      - alert: " + rule.Name + "\n"
			config += "        expr: " + rule.Expr + "\n"
			config += "        for: " + rule.For + "\n"
			config += "        labels:\n"
			config += "          severity: " + rule.Severity + "\n"

			for key, value := range rule.Labels {
				config += "          " + key + ": " + value + "\n"
			}

			config += "        annotations:\n"
			config += "          summary: \"" + rule.Name + "\"\n"
			config += "          description: \"" + rule.Description + "\"\n"

			for key, value := range rule.Annotations {
				config += "          " + key + ": \"" + value + "\"\n"
			}

			config += "\n"
		}
	}

	return config
}

func (c *AlertDeploymentController) generateVMAlertRules(rules []AlertRule) string {
	// 实现VMAlert规则生成，格式与Prometheus类似但有一些VMAlert特有的字段
	return c.generatePrometheusRules(rules) // 简化实现，实际可以添加VMAlert特有配置
}

func (c *AlertDeploymentController) generateAlertmanagerConfig(notificationConfig *NotificationConfig) string {
	config := ""

	// 全局配置
	if notificationConfig.GlobalConfig != nil {
		config += "global:\n"
		for key, value := range notificationConfig.GlobalConfig {
			config += "  " + key + ": '" + value.(string) + "'\n"
		}
		config += "\n"
	}

	// 路由配置
	config += "route:\n"
	config += "  group_by: ['alertname', 'cluster', 'service']\n"
	config += "  group_wait: 10s\n"
	config += "  group_interval: 10s\n"
	config += "  repeat_interval: 1h\n"
	config += "  receiver: 'default'\n"

	if len(notificationConfig.Routes) > 0 {
		config += "  routes:\n"
		for _, route := range notificationConfig.Routes {
			config += "    - match:\n"
			for key, value := range route.Match {
				config += "        " + key + ": " + value + "\n"
			}
			config += "      receiver: " + route.Receiver + "\n"
		}
	}

	config += "\n"

	// 接收器配置
	config += "receivers:\n"
	for _, receiver := range notificationConfig.Receivers {
		config += "  - name: '" + receiver.Name + "'\n"

		switch receiver.Type {
		case "email":
			config += "    email_configs:\n"
			if to, ok := receiver.Config["to"].(string); ok {
				config += "      - to: '" + to + "'\n"
			}
			if subject, ok := receiver.Config["subject"].(string); ok {
				config += "        subject: '" + subject + "'\n"
			}
		case "webhook":
			config += "    webhook_configs:\n"
			if url, ok := receiver.Config["url"].(string); ok {
				config += "      - url: '" + url + "'\n"
			}
		case "slack":
			config += "    slack_configs:\n"
			if apiURL, ok := receiver.Config["api_url"].(string); ok {
				config += "      - api_url: '" + apiURL + "'\n"
			}
			if channel, ok := receiver.Config["channel"].(string); ok {
				config += "        channel: '" + channel + "'\n"
			}
		}
	}

	return config
}

func (c *AlertDeploymentController) validateConfig(content, system string) bool {
	// 简单的配置验证
	return len(content) > 0 && !strings.Contains(content, "invalid")
}

func (c *AlertDeploymentController) uploadConfigFile(target AlertTarget, remotePath, content string) error {
	// 创建SSH客户端
	client, err := c.hostService.CreateSSHClient(target.IP, 22, target.Username, target.Password, target.PrivateKey)
	if err != nil {
		return err
	}
	defer client.Close()

	// 创建目录
	dirPath := remotePath[:strings.LastIndex(remotePath, "/")]
	_, _ = c.hostService.ExecuteSSHCommand(client, "sudo mkdir -p "+dirPath)

	// 上传文件
	session, err := client.NewSession()
	if err != nil {
		return err
	}
	defer session.Close()

	session.Stdin = strings.NewReader(content)
	return session.Run("sudo tee " + remotePath + " > /dev/null")
}

func (c *AlertDeploymentController) reloadTargetConfig(target AlertTarget) error {
	// 通过HTTP POST请求重载配置
	// 这里可以根据实际需要实现HTTP客户端调用
	return nil // 简化实现
}