package controllers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type ConfigValidationController struct{}

func NewConfigValidationController() *ConfigValidationController {
	return &ConfigValidationController{}
}

// ValidationResult 验证结果结构
type ValidationResult struct {
	Valid       bool     `json:"valid"`
	Errors      []string `json:"errors"`
	Warnings    []string `json:"warnings"`
	Suggestions []string `json:"suggestions"`
	Details     any      `json:"details,omitempty"`
}

// ValidatePrometheusConfig 验证Prometheus配置
func (c *ConfigValidationController) ValidatePrometheusConfig(ctx *gin.Context) {
	var request struct {
		Config  string `json:"config" binding:"required"`
		Options struct {
			StrictMode       bool `json:"strictMode"`
			ValidatePromQL   bool `json:"validatePromQL"`
			CheckConnectivity bool `json:"checkConnectivity"`
		} `json:"options"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := c.validatePrometheusConfig(request.Config, request.Options.StrictMode)

	ctx.JSON(http.StatusOK, result)
}

// ValidateAlertmanagerConfig 验证Alertmanager配置
func (c *ConfigValidationController) ValidateAlertmanagerConfig(ctx *gin.Context) {
	var request struct {
		Config  string `json:"config" binding:"required"`
		Options struct {
			StrictMode bool `json:"strictMode"`
		} `json:"options"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := c.validateAlertmanagerConfig(request.Config)

	ctx.JSON(http.StatusOK, result)
}

// ValidateSNMPExporterConfig 验证SNMP Exporter配置
func (c *ConfigValidationController) ValidateSNMPExporterConfig(ctx *gin.Context) {
	var request struct {
		Config  string `json:"config" binding:"required"`
		Options struct {
			StrictMode bool `json:"strictMode"`
		} `json:"options"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := c.validateSNMPExporterConfig(request.Config)

	ctx.JSON(http.StatusOK, result)
}

// ValidateCategrafConfig 验证Categraf配置
func (c *ConfigValidationController) ValidateCategrafConfig(ctx *gin.Context) {
	var request struct {
		Config  string `json:"config" binding:"required"`
		Options struct {
			StrictMode bool `json:"strictMode"`
		} `json:"options"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := c.validateCategrafConfig(request.Config)

	ctx.JSON(http.StatusOK, result)
}

// ValidateVMAlertConfig 验证VMAlert配置
func (c *ConfigValidationController) ValidateVMAlertConfig(ctx *gin.Context) {
	var request struct {
		Config  string `json:"config" binding:"required"`
		Options struct {
			StrictMode     bool `json:"strictMode"`
			ValidatePromQL bool `json:"validatePromQL"`
		} `json:"options"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := c.validateVMAlertConfig(request.Config, request.Options.ValidatePromQL)

	ctx.JSON(http.StatusOK, result)
}

// ValidatePromQL 验证PromQL表达式
func (c *ConfigValidationController) ValidatePromQL(ctx *gin.Context) {
	var request struct {
		Expression string `json:"expression" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := c.validatePromQL(request.Expression)

	ctx.JSON(http.StatusOK, result)
}

// ValidateYAMLSyntax 验证YAML语法
func (c *ConfigValidationController) ValidateYAMLSyntax(ctx *gin.Context) {
	var request struct {
		Content string `json:"content" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := c.validateYAMLSyntax(request.Content)

	ctx.JSON(http.StatusOK, result)
}

// ValidateTOMLSyntax 验证TOML语法
func (c *ConfigValidationController) ValidateTOMLSyntax(ctx *gin.Context) {
	var request struct {
		Content string `json:"content" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := c.validateTOMLSyntax(request.Content)

	ctx.JSON(http.StatusOK, result)
}

// 私有验证方法

func (c *ConfigValidationController) validatePrometheusConfig(config string, strictMode bool) ValidationResult {
	result := ValidationResult{
		Valid:       true,
		Errors:      []string{},
		Warnings:    []string{},
		Suggestions: []string{},
	}

	// YAML语法检查
	yamlResult := c.validateYAMLSyntax(config)
	if !yamlResult.Valid {
		result.Valid = false
		result.Errors = append(result.Errors, yamlResult.Errors...)
		return result
	}

	// 检查必需的部分
	if !strings.Contains(config, "scrape_configs:") {
		result.Valid = false
		result.Errors = append(result.Errors, "缺少 scrape_configs 配置")
	}

	if !strings.Contains(config, "global:") {
		result.Warnings = append(result.Warnings, "建议配置 global 部分")
	}

	// 检查scrape_interval
	if strings.Contains(config, "scrape_interval:") {
		lines := strings.Split(config, "\n")
		for _, line := range lines {
			if strings.Contains(line, "scrape_interval:") && strings.Contains(line, "1s") {
				result.Suggestions = append(result.Suggestions, "建议 scrape_interval 不要小于 15s，以避免性能问题")
			}
		}
	}

	// 安全建议
	if !strings.Contains(config, "external_labels:") {
		result.Suggestions = append(result.Suggestions, "建议配置 external_labels 用于多集群识别")
	}

	return result
}

func (c *ConfigValidationController) validateAlertmanagerConfig(config string) ValidationResult {
	result := ValidationResult{
		Valid:       true,
		Errors:      []string{},
		Warnings:    []string{},
		Suggestions: []string{},
	}

	// YAML语法检查
	yamlResult := c.validateYAMLSyntax(config)
	if !yamlResult.Valid {
		result.Valid = false
		result.Errors = append(result.Errors, yamlResult.Errors...)
		return result
	}

	// 检查必需的部分
	if !strings.Contains(config, "route:") {
		result.Valid = false
		result.Errors = append(result.Errors, "缺少 route 配置")
	}

	if !strings.Contains(config, "receivers:") {
		result.Valid = false
		result.Errors = append(result.Errors, "缺少 receivers 配置")
	}

	// 检查接收器配置
	if strings.Contains(config, "receivers:") && !strings.Contains(config, "email_configs:") && 
	   !strings.Contains(config, "webhook_configs:") && !strings.Contains(config, "slack_configs:") {
		result.Warnings = append(result.Warnings, "没有配置任何通知方式")
	}

	return result
}

func (c *ConfigValidationController) validateSNMPExporterConfig(config string) ValidationResult {
	result := ValidationResult{
		Valid:       true,
		Errors:      []string{},
		Warnings:    []string{},
		Suggestions: []string{},
	}

	// YAML语法检查
	yamlResult := c.validateYAMLSyntax(config)
	if !yamlResult.Valid {
		result.Valid = false
		result.Errors = append(result.Errors, yamlResult.Errors...)
		return result
	}

	// 检查modules配置
	if !strings.Contains(config, "modules:") {
		result.Valid = false
		result.Errors = append(result.Errors, "缺少 modules 配置")
	}

	// 检查walk配置
	if strings.Contains(config, "modules:") && !strings.Contains(config, "walk:") {
		result.Warnings = append(result.Warnings, "建议至少配置一个 walk OID")
	}

	return result
}

func (c *ConfigValidationController) validateCategrafConfig(config string) ValidationResult {
	result := ValidationResult{
		Valid:       true,
		Errors:      []string{},
		Warnings:    []string{},
		Suggestions: []string{},
	}

	// TOML语法检查
	tomlResult := c.validateTOMLSyntax(config)
	if !tomlResult.Valid {
		result.Valid = false
		result.Errors = append(result.Errors, tomlResult.Errors...)
		return result
	}

	// 检查全局配置
	if !strings.Contains(config, "[global]") {
		result.Warnings = append(result.Warnings, "建议配置 [global] 部分")
	}

	// 检查writers配置
	if !strings.Contains(config, "[[writers]]") {
		result.Valid = false
		result.Errors = append(result.Errors, "至少需要配置一个 writer")
	}

	// 检查输入插件
	hasInputs := strings.Contains(config, "[[inputs.")
	if !hasInputs {
		result.Warnings = append(result.Warnings, "建议至少配置一个输入插件")
	}

	return result
}

func (c *ConfigValidationController) validateVMAlertConfig(config string, validatePromQL bool) ValidationResult {
	result := ValidationResult{
		Valid:       true,
		Errors:      []string{},
		Warnings:    []string{},
		Suggestions: []string{},
	}

	// YAML语法检查
	yamlResult := c.validateYAMLSyntax(config)
	if !yamlResult.Valid {
		result.Valid = false
		result.Errors = append(result.Errors, yamlResult.Errors...)
		return result
	}

	// 检查groups结构
	if !strings.Contains(config, "groups:") {
		result.Valid = false
		result.Errors = append(result.Errors, "缺少 groups 配置")
	}

	// 检查规则
	if strings.Contains(config, "rules:") {
		lines := strings.Split(config, "\n")
		for i, line := range lines {
			if strings.Contains(line, "expr:") && validatePromQL {
				expr := strings.TrimSpace(strings.TrimPrefix(line, "expr:"))
				expr = strings.Trim(expr, "\"'")
				promqlResult := c.validatePromQL(expr)
				if !promqlResult.Valid {
					result.Errors = append(result.Errors, "第 "+string(rune(i+1))+" 行 PromQL 表达式错误: "+strings.Join(promqlResult.Errors, ", "))
				}
			}
		}
	}

	return result
}

func (c *ConfigValidationController) validatePromQL(expr string) ValidationResult {
	result := ValidationResult{
		Valid:       true,
		Errors:      []string{},
		Warnings:    []string{},
		Suggestions: []string{},
	}

	if strings.TrimSpace(expr) == "" {
		result.Valid = false
		result.Errors = append(result.Errors, "PromQL 表达式不能为空")
		return result
	}

	// 检查括号匹配
	openBrackets := strings.Count(expr, "(")
	closeBrackets := strings.Count(expr, ")")
	if openBrackets != closeBrackets {
		result.Valid = false
		result.Errors = append(result.Errors, "括号不匹配")
	}

	// 检查方括号匹配
	openSquareBrackets := strings.Count(expr, "[")
	closeSquareBrackets := strings.Count(expr, "]")
	if openSquareBrackets != closeSquareBrackets {
		result.Valid = false
		result.Errors = append(result.Errors, "方括号不匹配")
	}

	// 检查花括号匹配
	openCurlyBrackets := strings.Count(expr, "{")
	closeCurlyBrackets := strings.Count(expr, "}")
	if openCurlyBrackets != closeCurlyBrackets {
		result.Valid = false
		result.Errors = append(result.Errors, "花括号不匹配")
	}

	// 性能建议
	if strings.Contains(expr, "rate(") && strings.Contains(expr, "[1m]") {
		result.Suggestions = append(result.Suggestions, "使用 1m 的时间窗口可能会有噪音，建议使用 5m 或更长")
	}

	if strings.Contains(expr, "increase(") && !strings.Contains(expr, "rate(") {
		result.Suggestions = append(result.Suggestions, "通常建议使用 rate() 而不是 increase() 来计算速率")
	}

	return result
}

func (c *ConfigValidationController) validateYAMLSyntax(yaml string) ValidationResult {
	result := ValidationResult{
		Valid:       true,
		Errors:      []string{},
		Warnings:    []string{},
		Suggestions: []string{},
	}

	lines := strings.Split(yaml, "\n")
	for i, line := range lines {
		if strings.TrimSpace(line) == "" || strings.HasPrefix(strings.TrimSpace(line), "#") {
			continue
		}

		// 检查缩进（应为偶数空格）
		indent := len(line) - len(strings.TrimLeft(line, " "))
		if indent%2 != 0 {
			result.Valid = false
			result.Errors = append(result.Errors, "第 "+string(rune(i+1))+" 行: 缩进应为偶数空格")
		}

		// 检查冒号语法
		if strings.Contains(line, ":") && !strings.Contains(line, "://") {
			colonIndex := strings.Index(line, ":")
			if colonIndex < len(line)-1 {
				afterColon := line[colonIndex+1:]
				if len(strings.TrimLeft(afterColon, " ")) > 0 && !strings.HasPrefix(afterColon, " ") {
					result.Warnings = append(result.Warnings, "第 "+string(rune(i+1))+" 行: 冒号后建议添加空格")
				}
			}
		}
	}

	return result
}

func (c *ConfigValidationController) validateTOMLSyntax(toml string) ValidationResult {
	result := ValidationResult{
		Valid:       true,
		Errors:      []string{},
		Warnings:    []string{},
		Suggestions: []string{},
	}

	lines := strings.Split(toml, "\n")
	for i, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// 检查表头
		if strings.HasPrefix(line, "[") && strings.HasSuffix(line, "]") {
			continue
		}

		// 检查键值对
		if strings.Contains(line, "=") {
			parts := strings.SplitN(line, "=", 2)
			if len(parts) != 2 {
				result.Valid = false
				result.Errors = append(result.Errors, "第 "+string(rune(i+1))+" 行: 键值对格式错误")
				continue
			}

			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])

			if key == "" {
				result.Valid = false
				result.Errors = append(result.Errors, "第 "+string(rune(i+1))+" 行: 缺少键名")
			}

			if value == "" {
				result.Valid = false
				result.Errors = append(result.Errors, "第 "+string(rune(i+1))+" 行: 缺少值")
			}
		}
	}

	return result
}