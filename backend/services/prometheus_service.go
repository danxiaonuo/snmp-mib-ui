package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"mib-platform/utils"
	"mib-platform/models"
)

// PrometheusService Prometheus/VictoriaMetrics服务
type PrometheusService struct {
	baseURL    string
	httpClient *http.Client
	logger     utils.Logger
}

// NewPrometheusService 创建Prometheus服务
func NewPrometheusService(baseURL string, logger utils.Logger) *PrometheusService {
	return &PrometheusService{
		baseURL: strings.TrimSuffix(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: logger,
	}
}

// QueryResult 查询结果结构
type QueryResult struct {
	Status string `json:"status"`
	Data   struct {
		ResultType string `json:"resultType"`
		Result     []struct {
			Metric map[string]string `json:"metric"`
			Value  []interface{}     `json:"value,omitempty"`
			Values [][]interface{}   `json:"values,omitempty"`
		} `json:"result"`
	} `json:"data"`
	Error     string `json:"error,omitempty"`
	ErrorType string `json:"errorType,omitempty"`
}

// MetricMetadata 指标元数据
type MetricMetadata struct {
	Type string `json:"type"`
	Help string `json:"help"`
	Unit string `json:"unit"`
}

// LabelValues 标签值结构
type LabelValues struct {
	Status string   `json:"status"`
	Data   []string `json:"data"`
}

// SeriesResult 序列查询结果
type SeriesResult struct {
	Status string              `json:"status"`
	Data   []map[string]string `json:"data"`
}

// Query 执行即时查询
func (s *PrometheusService) Query(ctx context.Context, query string, timestamp *time.Time) (*QueryResult, error) {
	params := url.Values{}
	params.Set("query", query)
	if timestamp != nil {
		params.Set("time", strconv.FormatInt(timestamp.Unix(), 10))
	}

	url := fmt.Sprintf("%s/api/v1/query?%s", s.baseURL, params.Encode())
	resp, err := s.doRequest(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("查询失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	var result QueryResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	if result.Status != "success" {
		return nil, fmt.Errorf("查询错误: %s - %s", result.ErrorType, result.Error)
	}

	s.logger.Debug("Prometheus查询成功", "query", query, "results", len(result.Data.Result))
	return &result, nil
}

// QueryRange 执行范围查询
func (s *PrometheusService) QueryRange(ctx context.Context, query string, start, end time.Time, step time.Duration) (*QueryResult, error) {
	params := url.Values{}
	params.Set("query", query)
	params.Set("start", strconv.FormatInt(start.Unix(), 10))
	params.Set("end", strconv.FormatInt(end.Unix(), 10))
	params.Set("step", fmt.Sprintf("%.0fs", step.Seconds()))

	url := fmt.Sprintf("%s/api/v1/query_range?%s", s.baseURL, params.Encode())
	resp, err := s.doRequest(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("范围查询失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	var result QueryResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	if result.Status != "success" {
		return nil, fmt.Errorf("范围查询错误: %s - %s", result.ErrorType, result.Error)
	}

	s.logger.Debug("Prometheus范围查询成功", "query", query, "results", len(result.Data.Result))
	return &result, nil
}



// GetMetricMetadata 获取指标元数据
func (s *PrometheusService) GetMetricMetadata(ctx context.Context, metric string) (*MetricMetadata, error) {
	params := url.Values{}
	if metric != "" {
		params.Set("metric", metric)
	}

	url := fmt.Sprintf("%s/api/v1/metadata?%s", s.baseURL, params.Encode())
	resp, err := s.doRequest(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("获取指标元数据失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	// 解析元数据响应
	var result struct {
		Status string                           `json:"status"`
		Data   map[string][]MetricMetadata      `json:"data"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	if result.Status != "success" {
		return nil, fmt.Errorf("获取指标元数据错误")
	}

	// 返回第一个匹配的元数据
	for _, metadataList := range result.Data {
		if len(metadataList) > 0 {
			return &metadataList[0], nil
		}
	}

	return nil, fmt.Errorf("未找到指标元数据")
}

// GetLabelValues 获取标签值
func (s *PrometheusService) GetLabelValues(ctx context.Context, label string, match []string) ([]string, error) {
	params := url.Values{}
	for _, m := range match {
		params.Add("match[]", m)
	}

	url := fmt.Sprintf("%s/api/v1/label/%s/values?%s", s.baseURL, label, params.Encode())
	resp, err := s.doRequest(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("获取标签值失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	var result LabelValues
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	if result.Status != "success" {
		return nil, fmt.Errorf("获取标签值错误")
	}

	s.logger.Debug("获取标签值成功", "label", label, "count", len(result.Data))
	return result.Data, nil
}

// GetSeries 获取时间序列
func (s *PrometheusService) GetSeries(ctx context.Context, match []string, start, end *time.Time) ([]map[string]string, error) {
	params := url.Values{}
	for _, m := range match {
		params.Add("match[]", m)
	}
	if start != nil {
		params.Set("start", strconv.FormatInt(start.Unix(), 10))
	}
	if end != nil {
		params.Set("end", strconv.FormatInt(end.Unix(), 10))
	}

	url := fmt.Sprintf("%s/api/v1/series?%s", s.baseURL, params.Encode())
	resp, err := s.doRequest(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("获取时间序列失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	var result SeriesResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	if result.Status != "success" {
		return nil, fmt.Errorf("获取时间序列错误")
	}

	s.logger.Debug("获取时间序列成功", "count", len(result.Data))
	return result.Data, nil
}

// ValidateQuery 验证PromQL查询语法
func (s *PrometheusService) ValidateQuery(ctx context.Context, query string) error {
	// 尝试执行查询来验证语法
	_, err := s.Query(ctx, query, nil)
	if err != nil {
		return fmt.Errorf("PromQL语法错误: %w", err)
	}
	return nil
}

// GetDevicesFromMetrics 从指标中提取设备信息
func (s *PrometheusService) GetDevicesFromMetrics(ctx context.Context) ([]map[string]string, error) {
	// 查询up指标获取所有设备
	result, err := s.Query(ctx, "up", nil)
	if err != nil {
		return nil, fmt.Errorf("获取设备信息失败: %w", err)
	}

	devices := make([]map[string]string, 0)
	for _, item := range result.Data.Result {
		device := make(map[string]string)
		for k, v := range item.Metric {
			device[k] = v
		}
		// 添加状态信息
		if len(item.Value) >= 2 {
			if value, ok := item.Value[1].(string); ok {
				if value == "1" {
					device["status"] = "online"
				} else {
					device["status"] = "offline"
				}
			}
		}
		devices = append(devices, device)
	}

	s.logger.Debug("从指标提取设备信息成功", "count", len(devices))
	return devices, nil
}

// GetCommonMetrics 获取常用的交换机指标
func (s *PrometheusService) GetCommonMetrics(ctx context.Context) (map[string][]string, error) {
	commonMetrics := map[string][]string{
		"基础监控": {
			"up",
			"cpu_usage",
			"memory_usage",
			"device_temperature",
		},
		"网络接口": {
			"interface_status",
			"interface_speed",
			"interface_utilization",
			"interface_errors",
			"interface_discards",
		},
		"性能指标": {
			"cpu_load_1m",
			"cpu_load_5m",
			"cpu_load_15m",
			"memory_free",
			"memory_total",
		},
		"环境监控": {
			"fan_status",
			"power_supply_status",
			"temperature_sensor",
			"humidity",
		},
	}

	// 验证指标是否存在
	availableMetrics, err := s.GetMetrics(ctx, "")
	if err != nil {
		return commonMetrics, nil // 返回默认列表
	}

	metricsSet := make(map[string]bool)
	for _, metric := range availableMetrics {
		metricsSet[metric] = true
	}

	// 过滤存在的指标
	filteredMetrics := make(map[string][]string)
	for category, metrics := range commonMetrics {
		existingMetrics := make([]string, 0)
		for _, metric := range metrics {
			if metricsSet[metric] {
				existingMetrics = append(existingMetrics, metric)
			}
		}
		if len(existingMetrics) > 0 {
			filteredMetrics[category] = existingMetrics
		}
	}

	return filteredMetrics, nil
}

// GetPromQLFunctions 获取PromQL函数列表
func (s *PrometheusService) GetPromQLFunctions() map[string][]string {
	return map[string][]string{
		"聚合函数": {
			"sum", "min", "max", "avg", "group",
			"stddev", "stdvar", "count", "count_values",
			"bottomk", "topk", "quantile",
		},
		"数学函数": {
			"abs", "ceil", "floor", "round", "sqrt",
			"exp", "ln", "log2", "log10",
			"sin", "cos", "tan", "asin", "acos", "atan",
		},
		"时间函数": {
			"time", "timestamp", "minute", "hour",
			"day_of_month", "day_of_week", "days_in_month",
			"month", "year",
		},
		"范围函数": {
			"rate", "irate", "increase", "delta", "idelta",
			"deriv", "predict_linear", "holt_winters",
			"avg_over_time", "min_over_time", "max_over_time",
			"sum_over_time", "count_over_time", "quantile_over_time",
			"stddev_over_time", "stdvar_over_time",
		},
		"标签函数": {
			"label_replace", "label_join",
		},
		"排序函数": {
			"sort", "sort_desc",
		},
		"VictoriaMetrics扩展": {
			"rollup", "rollup_rate", "rollup_deriv",
			"rollup_delta", "rollup_increase",
			"rollup_candlestick", "rollup_scrape_interval",
			"histogram_quantile", "histogram_share",
		},
	}
}

// GetPromQLTemplates 获取PromQL模板
func (s *PrometheusService) GetPromQLTemplates() map[string]string {
	return map[string]string{
		"CPU使用率过高":     "cpu_usage{instance=\"{{instance}}\"} > {{threshold}}",
		"内存使用率过高":     "memory_usage{instance=\"{{instance}}\"} > {{threshold}}",
		"设备温度过高":      "device_temperature{instance=\"{{instance}}\"} > {{threshold}}",
		"端口状态异常":      "interface_status{instance=\"{{instance}}\", interface=\"{{interface}}\"} == 0",
		"设备离线":        "up{instance=\"{{instance}}\"} == 0",
		"接口利用率过高":     "interface_utilization{instance=\"{{instance}}\", interface=\"{{interface}}\"} > {{threshold}}",
		"接口错误率过高":     "rate(interface_errors{instance=\"{{instance}}\", interface=\"{{interface}}\"}[5m]) > {{threshold}}",
		"CPU负载过高":      "cpu_load_5m{instance=\"{{instance}}\"} > {{threshold}}",
		"内存不足":        "memory_free{instance=\"{{instance}}\"} < {{threshold}}",
		"风扇故障":        "fan_status{instance=\"{{instance}}\", fan=\"{{fan}}\"} == 0",
		"电源故障":        "power_supply_status{instance=\"{{instance}}\", psu=\"{{psu}}\"} == 0",
		"接口丢包率过高":     "rate(interface_discards{instance=\"{{instance}}\", interface=\"{{interface}}\"}[5m]) > {{threshold}}",
		"设备重启":        "increase(device_uptime{instance=\"{{instance}}\"}[1h]) < 0",
		"SNMP采集失败":    "up{job=\"snmp\", instance=\"{{instance}}\"} == 0",
		"光功率异常":       "optical_power{instance=\"{{instance}}\", interface=\"{{interface}}\"} < {{min_threshold}} or optical_power{instance=\"{{instance}}\", interface=\"{{interface}}\"} > {{max_threshold}}",
	}
}

// CheckConnectivity 检查与Prometheus/VictoriaMetrics的连通性
func (s *PrometheusService) CheckConnectivity(ctx context.Context) error {
	url := fmt.Sprintf("%s/api/v1/query?query=up&limit=1", s.baseURL)
	resp, err := s.doRequest(ctx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("连接失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP状态码错误: %d", resp.StatusCode)
	}

	s.logger.Info("Prometheus连通性检查成功")
	return nil
}

// ValidatePromQL 验证PromQL表达式
func (s *PrometheusService) ValidatePromQL(ctx context.Context, query string) error {
	params := url.Values{}
	params.Set("query", query)

	url := fmt.Sprintf("%s/api/v1/query?%s", s.baseURL, params.Encode())
	resp, err := s.doRequest(ctx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("验证PromQL失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("读取响应失败: %w", err)
	}

	var result QueryResult
	if err := json.Unmarshal(body, &result); err != nil {
		return fmt.Errorf("解析响应失败: %w", err)
	}

	if result.Status != "success" {
		return fmt.Errorf("PromQL语法错误: %s", result.Error)
	}

	s.logger.Debug("PromQL验证成功", "query", query)
	return nil
}

// ValidateAndTestPromQL 验证并测试PromQL表达式
func (s *PrometheusService) ValidateAndTestPromQL(expression string) (interface{}, error) {
	ctx := context.Background()
	err := s.ValidatePromQL(ctx, expression)
	if err != nil {
		return nil, err
	}
	
	// 返回验证结果
	return map[string]interface{}{
		"valid": true,
		"expression": expression,
		"message": "PromQL表达式验证成功",
	}, nil
}

// GetMetrics 获取可用指标列表
func (s *PrometheusService) GetMetrics(ctx context.Context, search string) ([]string, error) {
	url := fmt.Sprintf("%s/api/v1/label/__name__/values", s.baseURL)
	
	resp, err := s.doRequest(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("获取指标列表失败: %w", err)
	}
	defer resp.Body.Close()
	
	var result struct {
		Status string   `json:"status"`
		Data   []string `json:"data"`
		Error  string   `json:"error"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}
	
	if result.Status != "success" {
		return nil, fmt.Errorf("获取指标失败: %s", result.Error)
	}
	
	// 如果有搜索条件，过滤指标
	if search != "" {
		var filtered []string
		for _, metric := range result.Data {
			if strings.Contains(strings.ToLower(metric), strings.ToLower(search)) {
				filtered = append(filtered, metric)
			}
		}
		return filtered, nil
	}
	
	return result.Data, nil
}

// QueryMetrics 查询指标数据
func (s *PrometheusService) QueryMetrics(ctx context.Context, req models.QueryMetricsRequest) (*QueryResult, error) {
	params := url.Values{}
	params.Set("query", req.Query)
	
	if req.Start != "" {
		params.Set("start", req.Start)
	}
	if req.End != "" {
		params.Set("end", req.End)
	}
	if req.Step != "" {
		params.Set("step", req.Step)
	}
	
	// 添加其他参数
	for key, value := range req.Params {
		if str, ok := value.(string); ok {
			params.Set(key, str)
		}
	}
	
	var endpoint string
	if req.Start != "" && req.End != "" {
		endpoint = "/api/v1/query_range"
	} else {
		endpoint = "/api/v1/query"
	}
	
	url := fmt.Sprintf("%s%s?%s", s.baseURL, endpoint, params.Encode())
	resp, err := s.doRequest(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("查询指标失败: %w", err)
	}
	defer resp.Body.Close()
	
	var result QueryResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}
	
	if result.Status != "success" {
		return nil, fmt.Errorf("查询失败: %s", result.Error)
	}
	
	return &result, nil
}

// doRequest 执行HTTP请求
func (s *PrometheusService) doRequest(ctx context.Context, method, url string, body io.Reader) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "MIB-Web/1.0")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("执行请求失败: %w", err)
	}

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, fmt.Errorf("HTTP错误 %d: %s", resp.StatusCode, string(body))
	}

	return resp, nil
}