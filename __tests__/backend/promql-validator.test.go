package utils

import (
	"testing"
)

func TestValidatePromQLSyntax(t *testing.T) {
	tests := []struct {
		name    string
		query   string
		wantErr bool
	}{
		{
			name:    "空查询",
			query:   "",
			wantErr: true,
		},
		{
			name:    "简单指标查询",
			query:   "up",
			wantErr: false,
		},
		{
			name:    "带标签的查询",
			query:   `up{job="prometheus"}`,
			wantErr: false,
		},
		{
			name:    "比较操作",
			query:   "up == 0",
			wantErr: false,
		},
		{
			name:    "函数调用",
			query:   "rate(http_requests_total[5m])",
			wantErr: false,
		},
		{
			name:    "复杂查询",
			query:   `sum(rate(http_requests_total{job="api-server"}[5m])) by (instance)`,
			wantErr: false,
		},
		{
			name:    "括号不匹配",
			query:   "sum(rate(http_requests_total[5m])",
			wantErr: true,
		},
		{
			name:    "以操作符开始",
			query:   "+ up",
			wantErr: true,
		},
		{
			name:    "以操作符结束",
			query:   "up +",
			wantErr: true,
		},
		{
			name:    "连续操作符",
			query:   "up +++ down",
			wantErr: true,
		},
		{
			name:    "聚合函数",
			query:   "avg(cpu_usage) > 0.8",
			wantErr: false,
		},
		{
			name:    "时间范围查询",
			query:   "increase(http_requests_total[1h])",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePromQLSyntax(tt.query)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePromQLSyntax() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestCheckParentheses(t *testing.T) {
	tests := []struct {
		name    string
		query   string
		wantErr bool
	}{
		{
			name:    "匹配的圆括号",
			query:   "sum(rate(http_requests[5m]))",
			wantErr: false,
		},
		{
			name:    "匹配的方括号",
			query:   "http_requests[5m]",
			wantErr: false,
		},
		{
			name:    "匹配的花括号",
			query:   `http_requests{job="api"}`,
			wantErr: false,
		},
		{
			name:    "混合括号匹配",
			query:   `sum(rate(http_requests{job="api"}[5m]))`,
			wantErr: false,
		},
		{
			name:    "缺少闭合括号",
			query:   "sum(rate(http_requests[5m])",
			wantErr: true,
		},
		{
			name:    "多余的闭合括号",
			query:   "sum(rate(http_requests[5m])))",
			wantErr: true,
		},
		{
			name:    "括号类型不匹配",
			query:   "sum(rate(http_requests[5m])]",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := checkParentheses(tt.query)
			if (err != nil) != tt.wantErr {
				t.Errorf("checkParentheses() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}