package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// PaginatedResponse 分页响应结构体
type PaginatedResponse struct {
	Items interface{} `json:"items"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

// Logger 日志接口
type Logger interface {
	Debug(msg string, fields ...interface{})
	Info(msg string, fields ...interface{})
	Warn(msg string, fields ...interface{})
	Error(msg string, fields ...interface{})
	Fatal(msg string, fields ...interface{})
}

// SimpleLogger 简单日志实现
type SimpleLogger struct {
	debugLogger *log.Logger
	infoLogger  *log.Logger
	warnLogger  *log.Logger
	errorLogger *log.Logger
	fatalLogger *log.Logger
}

// NewLogger 创建新的日志器
func NewLogger() Logger {
	return &SimpleLogger{
		debugLogger: log.New(os.Stdout, "[DEBUG] ", log.LstdFlags|log.Lshortfile),
		infoLogger:  log.New(os.Stdout, "[INFO] ", log.LstdFlags|log.Lshortfile),
		warnLogger:  log.New(os.Stdout, "[WARN] ", log.LstdFlags|log.Lshortfile),
		errorLogger: log.New(os.Stderr, "[ERROR] ", log.LstdFlags|log.Lshortfile),
		fatalLogger: log.New(os.Stderr, "[FATAL] ", log.LstdFlags|log.Lshortfile),
	}
}

// Debug 输出调试日志
func (l *SimpleLogger) Debug(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		msg = fmt.Sprintf("%s %s", msg, formatFields(fields...))
	}
	l.debugLogger.Println(msg)
}

// Info 输出信息日志
func (l *SimpleLogger) Info(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		msg = fmt.Sprintf("%s %s", msg, formatFields(fields...))
	}
	l.infoLogger.Println(msg)
}

// Warn 输出警告日志
func (l *SimpleLogger) Warn(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		msg = fmt.Sprintf("%s %s", msg, formatFields(fields...))
	}
	l.warnLogger.Println(msg)
}

// Error 输出错误日志
func (l *SimpleLogger) Error(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		msg = fmt.Sprintf("%s %s", msg, formatFields(fields...))
	}
	l.errorLogger.Println(msg)
}

// Fatal 输出致命错误日志并退出程序
func (l *SimpleLogger) Fatal(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		msg = fmt.Sprintf("%s %s", msg, formatFields(fields...))
	}
	l.fatalLogger.Fatal(msg)
}

// formatFields 格式化字段
func formatFields(fields ...interface{}) string {
	if len(fields)%2 != 0 {
		return fmt.Sprintf("fields=%v", fields)
	}

	var result string
	for i := 0; i < len(fields); i += 2 {
		key := fields[i]
		value := fields[i+1]
		if i > 0 {
			result += " "
		}
		result += fmt.Sprintf("%v=%v", key, value)
	}
	return result
}

// LogLevel 日志级别
type LogLevel int

const (
	DebugLevel LogLevel = iota
	InfoLevel
	WarnLevel
	ErrorLevel
	FatalLevel
)

// String 返回日志级别的字符串表示
func (l LogLevel) String() string {
	switch l {
	case DebugLevel:
		return "DEBUG"
	case InfoLevel:
		return "INFO"
	case WarnLevel:
		return "WARN"
	case ErrorLevel:
		return "ERROR"
	case FatalLevel:
		return "FATAL"
	default:
		return "UNKNOWN"
	}
}

// StructuredLogger 结构化日志器
type StructuredLogger struct {
	level  LogLevel
	logger *log.Logger
}

// NewStructuredLogger 创建结构化日志器
func NewStructuredLogger(level LogLevel) Logger {
	return &StructuredLogger{
		level:  level,
		logger: log.New(os.Stdout, "", 0),
	}
}

// Debug 输出调试日志
func (l *StructuredLogger) Debug(msg string, fields ...interface{}) {
	if l.level <= DebugLevel {
		l.log(DebugLevel, msg, fields...)
	}
}

// Info 输出信息日志
func (l *StructuredLogger) Info(msg string, fields ...interface{}) {
	if l.level <= InfoLevel {
		l.log(InfoLevel, msg, fields...)
	}
}

// Warn 输出警告日志
func (l *StructuredLogger) Warn(msg string, fields ...interface{}) {
	if l.level <= WarnLevel {
		l.log(WarnLevel, msg, fields...)
	}
}

// Error 输出错误日志
func (l *StructuredLogger) Error(msg string, fields ...interface{}) {
	if l.level <= ErrorLevel {
		l.log(ErrorLevel, msg, fields...)
	}
}

// Fatal 输出致命错误日志并退出程序
func (l *StructuredLogger) Fatal(msg string, fields ...interface{}) {
	l.log(FatalLevel, msg, fields...)
	os.Exit(1)
}

// log 内部日志方法
func (l *StructuredLogger) log(level LogLevel, msg string, fields ...interface{}) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	levelStr := level.String()
	
	logMsg := fmt.Sprintf("%s [%s] %s", timestamp, levelStr, msg)
	if len(fields) > 0 {
		logMsg += " " + formatFields(fields...)
	}
	
	l.logger.Println(logMsg)
}

// Response 通用响应结构
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// SuccessResponse 返回成功响应
func SuccessResponse(c interface{}, message string, data interface{}) {
	response := Response{
		Success: true,
		Message: message,
		Data:    data,
	}
	
	// 检查是否为gin.Context类型
	if ginCtx, ok := c.(interface{ JSON(int, interface{}) }); ok {
		ginCtx.JSON(http.StatusOK, response)
	} else if w, ok := c.(http.ResponseWriter); ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
	}
}

// ErrorResponse 返回错误响应
func ErrorResponse(c interface{}, statusCode int, message string, err error) {
	response := Response{
		Success: false,
		Message: message,
	}
	if err != nil {
		response.Error = err.Error()
	}
	
	// 检查是否为gin.Context类型
	if ginCtx, ok := c.(interface{ JSON(int, interface{}) }); ok {
		ginCtx.JSON(statusCode, response)
	} else if w, ok := c.(http.ResponseWriter); ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		json.NewEncoder(w).Encode(response)
	}
}