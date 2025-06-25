"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Code, Play, BookOpen, Lightbulb, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

// PromQL函数和指标建议
const PROMQL_FUNCTIONS = [
  {
    name: "rate()",
    description: "计算时间序列的每秒平均增长率",
    example: "rate(cpu_usage_total[5m])",
    category: "基础函数"
  },
  {
    name: "increase()",
    description: "计算时间序列在指定时间范围内的增长量",
    example: "increase(http_requests_total[1h])",
    category: "基础函数"
  },
  {
    name: "avg_over_time()",
    description: "计算时间序列在指定时间范围内的平均值",
    example: "avg_over_time(cpu_usage[10m])",
    category: "聚合函数"
  },
  {
    name: "histogram_quantile()",
    description: "从直方图计算分位数",
    example: "histogram_quantile(0.95, rate(http_duration_bucket[5m]))",
    category: "直方图函数"
  },
  {
    name: "deriv()",
    description: "计算时间序列的导数（VictoriaMetrics特有）",
    example: "deriv(memory_usage[5m])",
    category: "VM特有函数"
  },
  {
    name: "rollup_rate()",
    description: "滚动计算速率（VictoriaMetrics特有）",
    example: "rollup_rate(cpu_usage[5m:1m])",
    category: "VM特有函数"
  }
]

const NETWORK_METRICS = [
  {
    name: "ifInOctets",
    description: "接口入流量字节数",
    example: "rate(ifInOctets[5m]) * 8",
    unit: "bytes/sec"
  },
  {
    name: "ifOutOctets",
    description: "接口出流量字节数",
    example: "rate(ifOutOctets[5m]) * 8",
    unit: "bytes/sec"
  },
  {
    name: "ifOperStatus",
    description: "接口操作状态",
    example: "ifOperStatus{job=\"snmp\"}",
    unit: "status"
  },
  {
    name: "sysUpTime",
    description: "系统运行时间",
    example: "sysUpTime / 100",
    unit: "seconds"
  },
  {
    name: "hwCpuDevCpuUsage",
    description: "华为设备CPU使用率",
    example: "hwCpuDevCpuUsage > 80",
    unit: "percent"
  },
  {
    name: "ciscoMemoryPoolUsed",
    description: "思科设备内存使用量",
    example: "ciscoMemoryPoolUsed / ciscoMemoryPoolFree * 100",
    unit: "percent"
  }
]

const COMMON_TEMPLATES = [
  {
    name: "CPU使用率告警",
    description: "监控设备CPU使用率超过阈值",
    promql: "(100 - (avg by (instance) (irate(cpu_idle_total[5m])) * 100)) > {{threshold}}",
    variables: ["threshold"]
  },
  {
    name: "内存使用率告警",
    description: "监控设备内存使用率超过阈值",
    promql: "(memory_used / memory_total * 100) > {{threshold}}",
    variables: ["threshold"]
  },
  {
    name: "接口流量告警",
    description: "监控接口流量超过阈值",
    promql: "rate(ifInOctets[5m]) * 8 / 1024 / 1024 > {{threshold}}",
    variables: ["threshold"]
  },
  {
    name: "设备离线告警",
    description: "监控设备是否在线",
    promql: "up{job=\"snmp\"} == 0",
    variables: []
  },
  {
    name: "端口状态异常",
    description: "监控端口状态变化",
    promql: "ifOperStatus{job=\"snmp\"} != ifAdminStatus{job=\"snmp\"}",
    variables: []
  }
]

interface PromQLEditorProps {
  value: string
  onChange: (value: string) => void
  onValidate?: (isValid: boolean, error?: string) => void
  placeholder?: string
  className?: string
}

export function PromQLEditor({ value, onChange, onValidate, placeholder, className }: PromQLEditorProps) {
  const [syntaxValid, setSyntaxValid] = useState(true)
  const [syntaxError, setSyntaxError] = useState<string>("")
  const [showHelp, setShowHelp] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // PromQL语法校验
  const validatePromQL = (query: string) => {
    if (!query.trim()) {
      setSyntaxValid(true)
      setSyntaxError("")
      onValidate?.(true)
      return
    }

    try {
      // 基础语法检查
      const errors = []
      
      // 检查括号匹配
      const openBrackets = (query.match(/\(/g) || []).length
      const closeBrackets = (query.match(/\)/g) || []).length
      if (openBrackets !== closeBrackets) {
        errors.push("括号不匹配")
      }
      
      // 检查花括号匹配
      const openBraces = (query.match(/\{/g) || []).length
      const closeBraces = (query.match(/\}/g) || []).length
      if (openBraces !== closeBraces) {
        errors.push("花括号不匹配")
      }
      
      // 检查方括号匹配
      const openSquare = (query.match(/\[/g) || []).length
      const closeSquare = (query.match(/\]/g) || []).length
      if (openSquare !== closeSquare) {
        errors.push("方括号不匹配")
      }
      
      // 检查是否包含指标名称
      const hasMetric = /\w+\{/.test(query) || /\w+\[/.test(query) || /\w+\s*[><=]/.test(query) || /\w+\s*$/.test(query)
      if (!hasMetric) {
        errors.push("缺少有效的指标名称")
      }
      
      if (errors.length > 0) {
        setSyntaxValid(false)
        setSyntaxError(errors.join(", "))
        onValidate?.(false, errors.join(", "))
      } else {
        setSyntaxValid(true)
        setSyntaxError("")
        onValidate?.(true)
      }
    } catch (error) {
      setSyntaxValid(false)
      setSyntaxError("语法错误")
      onValidate?.(false, "语法错误")
    }
  }

  // 获取建议
  const getSuggestions = (query: string, cursorPosition: number) => {
    const beforeCursor = query.substring(0, cursorPosition)
    const suggestions = []
    
    // 函数建议
    if (beforeCursor.endsWith("(") || beforeCursor.match(/\w+$/)) {
      suggestions.push(...PROMQL_FUNCTIONS.map(func => ({
        type: "function",
        text: func.name,
        description: func.description,
        example: func.example
      })))
    }
    
    // 指标建议
    if (!beforeCursor.includes("(") || beforeCursor.match(/\w+$/)) {
      suggestions.push(...NETWORK_METRICS.map(metric => ({
        type: "metric",
        text: metric.name,
        description: metric.description,
        example: metric.example
      })))
    }
    
    return suggestions.slice(0, 10)
  }

  // 处理输入变化
  const handleChange = (newValue: string) => {
    onChange(newValue)
    validatePromQL(newValue)
    
    // 获取光标位置
    const cursorPosition = textareaRef.current?.selectionStart || 0
    const newSuggestions = getSuggestions(newValue, cursorPosition)
    setSuggestions(newSuggestions)
    setShowSuggestions(newSuggestions.length > 0 && newValue.length > 0)
  }

  // 插入建议
  const insertSuggestion = (suggestion: any) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const cursorPosition = textarea.selectionStart
    const beforeCursor = value.substring(0, cursorPosition)
    const afterCursor = value.substring(cursorPosition)
    
    // 找到要替换的单词
    const wordMatch = beforeCursor.match(/\w+$/)
    const wordStart = wordMatch ? cursorPosition - wordMatch[0].length : cursorPosition
    
    const newValue = value.substring(0, wordStart) + suggestion.text + afterCursor
    onChange(newValue)
    setShowSuggestions(false)
    
    // 设置光标位置
    setTimeout(() => {
      const newPosition = wordStart + suggestion.text.length
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.focus()
    }, 0)
  }

  // 插入模板
  const insertTemplate = (template: any) => {
    onChange(template.promql)
    setShowHelp(false)
    toast.success(`已插入模板: ${template.name}`)
  }

  // 格式化PromQL
  const formatPromQL = () => {
    if (!value.trim()) return
    
    // 简单的格式化逻辑
    let formatted = value
      .replace(/\s*([><=!]+)\s*/g, " $1 ")
      .replace(/\s*([{}\[\]()])/g, "$1")
      .replace(/([{}\[\]()])\s*/g, "$1 ")
      .replace(/\s+/g, " ")
      .trim()
    
    onChange(formatted)
    toast.success("PromQL已格式化")
  }

  // 测试查询
  const testQuery = async () => {
    if (!value.trim()) {
      toast.error("请输入PromQL查询")
      return
    }
    
    if (!syntaxValid) {
      toast.error("请修复语法错误后再测试")
      return
    }
    
    // 模拟查询测试
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: "正在测试查询...",
        success: "查询测试成功，返回了 42 个时间序列",
        error: "查询测试失败"
      }
    )
  }

  useEffect(() => {
    validatePromQL(value)
  }, [value])

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant={syntaxValid ? "secondary" : "destructive"}>
            {syntaxValid ? (
              <><CheckCircle className="mr-1 h-3 w-3" />语法正确</>
            ) : (
              <><XCircle className="mr-1 h-3 w-3" />语法错误</>
            )}
          </Badge>
          {!syntaxValid && syntaxError && (
            <Badge variant="outline" className="text-red-600">
              <AlertTriangle className="mr-1 h-3 w-3" />
              {syntaxError}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={formatPromQL}>
            <Code className="mr-1 h-3 w-3" />
            格式化
          </Button>
          <Button size="sm" variant="outline" onClick={testQuery}>
            <Play className="mr-1 h-3 w-3" />
            测试查询
          </Button>
          <Dialog open={showHelp} onOpenChange={setShowHelp}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <BookOpen className="mr-1 h-3 w-3" />
                帮助
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>PromQL编辑器帮助</DialogTitle>
                <DialogDescription>
                  PromQL函数参考和常用模板
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* 常用模板 */}
                <div>
                  <h3 className="text-lg font-medium mb-3">常用模板</h3>
                  <div className="grid gap-3">
                    {COMMON_TEMPLATES.map((template, index) => (
                      <Card key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => insertTemplate(template)}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-muted-foreground">{template.description}</div>
                              <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">
                                {template.promql}
                              </code>
                            </div>
                            <Button size="sm" variant="ghost">
                              插入
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* PromQL函数 */}
                <div>
                  <h3 className="text-lg font-medium mb-3">PromQL函数</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {PROMQL_FUNCTIONS.map((func, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <code className="font-medium">{func.name}</code>
                              <Badge variant="outline">{func.category}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">{func.description}</div>
                            <code className="text-xs bg-muted px-2 py-1 rounded block">
                              {func.example}
                            </code>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* 网络指标 */}
                <div>
                  <h3 className="text-lg font-medium mb-3">常用网络指标</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {NETWORK_METRICS.map((metric, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <code className="font-medium">{metric.name}</code>
                              <Badge variant="secondary">{metric.unit}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">{metric.description}</div>
                            <code className="text-xs bg-muted px-2 py-1 rounded block">
                              {metric.example}
                            </code>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || "输入PromQL查询表达式..."}
          className={`font-mono text-sm min-h-24 ${!syntaxValid ? "border-red-500" : ""}`}
          onFocus={() => {
            if (value.length > 0) {
              const cursorPosition = textareaRef.current?.selectionStart || 0
              const newSuggestions = getSuggestions(value, cursorPosition)
              setSuggestions(newSuggestions)
              setShowSuggestions(newSuggestions.length > 0)
            }
          }}
          onBlur={() => {
            // 延迟隐藏建议，允许点击建议项
            setTimeout(() => setShowSuggestions(false), 200)
          }}
        />
        
        {/* 自动补全建议 */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto">
            <CardContent className="p-0">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => insertSuggestion(suggestion)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <code className="font-medium">{suggestion.text}</code>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type === "function" ? "函数" : "指标"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{suggestion.description}</div>
                    {suggestion.example && (
                      <code className="text-xs bg-muted px-1 rounded">{suggestion.example}</code>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        支持VictoriaMetrics特有函数，如 deriv(), rollup_rate() 等。按 Ctrl+Space 查看建议。
      </div>
    </div>
  )
}