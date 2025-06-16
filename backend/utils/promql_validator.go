package utils

import (
	"fmt"
	"regexp"
	"strings"
)

// validatePromQLSyntax 验证PromQL语法
func ValidatePromQLSyntax(query string) error {
	if strings.TrimSpace(query) == "" {
		return fmt.Errorf("查询表达式不能为空")
	}

	// 基本语法检查
	if err := checkBasicSyntax(query); err != nil {
		return err
	}

	// 检查括号匹配
	if err := checkParentheses(query); err != nil {
		return err
	}

	// 检查函数语法
	if err := checkFunctions(query); err != nil {
		return err
	}

	// 检查操作符
	if err := checkOperators(query); err != nil {
		return err
	}

	return nil
}

// checkBasicSyntax 检查基本语法
func checkBasicSyntax(query string) error {
	// 检查是否包含非法字符
	invalidChars := regexp.MustCompile(`[^\w\s\(\)\[\]\{\}\+\-\*\/\%\=\!\<\>\&\|\.\,\:\;\"\'\_\@\#\$\^\~\`]`)
	if invalidChars.MatchString(query) {
		return fmt.Errorf("包含非法字符")
	}

	// 检查是否以操作符开始或结束
	trimmed := strings.TrimSpace(query)
	if strings.HasPrefix(trimmed, "+") || strings.HasPrefix(trimmed, "*") || 
	   strings.HasPrefix(trimmed, "/") || strings.HasPrefix(trimmed, "%") {
		return fmt.Errorf("查询不能以二元操作符开始")
	}

	if strings.HasSuffix(trimmed, "+") || strings.HasSuffix(trimmed, "-") ||
	   strings.HasSuffix(trimmed, "*") || strings.HasSuffix(trimmed, "/") ||
	   strings.HasSuffix(trimmed, "%") || strings.HasSuffix(trimmed, "=") ||
	   strings.HasSuffix(trimmed, "!=") || strings.HasSuffix(trimmed, "<") ||
	   strings.HasSuffix(trimmed, ">") || strings.HasSuffix(trimmed, "<=") ||
	   strings.HasSuffix(trimmed, ">=") {
		return fmt.Errorf("查询不能以操作符结束")
	}

	return nil
}

// checkParentheses 检查括号匹配
func checkParentheses(query string) error {
	stack := []rune{}
	pairs := map[rune]rune{
		')': '(',
		']': '[',
		'}': '{',
	}

	for _, char := range query {
		switch char {
		case '(', '[', '{':
			stack = append(stack, char)
		case ')', ']', '}':
			if len(stack) == 0 {
				return fmt.Errorf("括号不匹配: 多余的 %c", char)
			}
			if stack[len(stack)-1] != pairs[char] {
				return fmt.Errorf("括号不匹配: %c 与 %c 不匹配", pairs[char], char)
			}
			stack = stack[:len(stack)-1]
		}
	}

	if len(stack) > 0 {
		return fmt.Errorf("括号不匹配: 缺少闭合括号")
	}

	return nil
}

// checkFunctions 检查函数语法
func checkFunctions(query string) error {
	// 常见的PromQL函数
	functions := []string{
		"abs", "absent", "ceil", "changes", "clamp_max", "clamp_min",
		"day_of_month", "day_of_week", "days_in_month", "delta", "deriv",
		"exp", "floor", "histogram_quantile", "holt_winters", "hour",
		"idelta", "increase", "irate", "label_join", "label_replace",
		"ln", "log2", "log10", "minute", "month", "predict_linear",
		"rate", "resets", "round", "scalar", "sort", "sort_desc",
		"sqrt", "time", "timestamp", "vector", "year", "avg_over_time",
		"min_over_time", "max_over_time", "sum_over_time", "count_over_time",
		"quantile_over_time", "stddev_over_time", "stdvar_over_time",
		"avg", "min", "max", "sum", "count", "quantile", "stddev", "stdvar",
		"topk", "bottomk", "count_values", "group_left", "group_right",
	}

	// 检查函数调用格式
	funcPattern := regexp.MustCompile(`(\w+)\s*\(`)
	matches := funcPattern.FindAllStringSubmatch(query, -1)

	for _, match := range matches {
		funcName := match[1]
		isValidFunc := false
		
		for _, validFunc := range functions {
			if funcName == validFunc {
				isValidFunc = true
				break
			}
		}

		// 如果不是已知函数，检查是否是指标名称
		if !isValidFunc {
			// 指标名称应该符合命名规范
			metricPattern := regexp.MustCompile(`^[a-zA-Z_:][a-zA-Z0-9_:]*$`)
			if !metricPattern.MatchString(funcName) {
				return fmt.Errorf("未知函数或无效指标名称: %s", funcName)
			}
		}
	}

	return nil
}

// checkOperators 检查操作符
func checkOperators(query string) error {
	// 检查连续操作符
	consecutiveOps := regexp.MustCompile(`[\+\-\*\/\%\=\!\<\>]{3,}`)
	if consecutiveOps.MatchString(query) {
		return fmt.Errorf("存在连续的操作符")
	}

	// 检查比较操作符格式
	comparisonOps := regexp.MustCompile(`(==|!=|<=|>=|<|>)`)
	matches := comparisonOps.FindAllString(query, -1)
	
	for _, op := range matches {
		// 检查操作符前后是否有空格或有效字符
		opIndex := strings.Index(query, op)
		if opIndex > 0 && opIndex < len(query)-len(op) {
			before := query[opIndex-1]
			after := query[opIndex+len(op)]
			
			// 简单检查：操作符前后应该有字母数字或括号
			if !isValidOperatorContext(before) || !isValidOperatorContext(after) {
				return fmt.Errorf("操作符 %s 使用不当", op)
			}
		}
	}

	return nil
}

// isValidOperatorContext 检查操作符上下文是否有效
func isValidOperatorContext(char byte) bool {
	return (char >= 'a' && char <= 'z') ||
		   (char >= 'A' && char <= 'Z') ||
		   (char >= '0' && char <= '9') ||
		   char == '_' || char == ')' || char == ']' || char == '}' ||
		   char == '(' || char == '[' || char == '{' || char == ' '
}