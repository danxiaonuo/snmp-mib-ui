"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play,
  Download,
  Upload,
  RefreshCw,
  Activity,
  Server,
  Network,
  Settings
} from "lucide-react"

interface TestTarget {
  id: string
  name: string
  host: string
  community: string
  version: string
  enabled: boolean
}

interface ValidationResult {
  success: boolean
  syntaxValid: boolean
  testResults: Array<{
    host: string
    success: boolean
    metrics: Array<{
      name: string
      value: string
      type: string
      help?: string
    }>
    error?: string
  }>
  errors: string[]
  warnings: string[]
}

export default function ConfigTestPage() {
  const [config, setConfig] = useState('')
  const [testTargets, setTestTargets] = useState<TestTarget[]>([
    {
      id: '1',
      name: 'Test Server 1',
      host: '192.168.1.100',
      community: 'public',
      version: '2c',
      enabled: true
    }
  ])
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationProgress, setValidationProgress] = useState(0)

  // 添加测试目标
  const addTestTarget = () => {
    const newTarget: TestTarget = {
      id: Date.now().toString(),
      name: `Test Server ${testTargets.length + 1}`,
      host: '',
      community: 'public',
      version: '2c',
      enabled: true
    }
    setTestTargets([...testTargets, newTarget])
  }

  // 更新测试目标
  const updateTestTarget = (id: string, field: keyof TestTarget, value: string | boolean) => {
    setTestTargets(targets => 
      targets.map(target => 
        target.id === id ? { ...target, [field]: value } : target
      )
    )
  }

  // 删除测试目标
  const removeTestTarget = (id: string) => {
    setTestTargets(targets => targets.filter(target => target.id !== id))
  }

  // 验证配置并测试
  const validateAndTest = async () => {
    if (!config.trim()) {
      alert('请输入配置内容')
      return
    }

    const enabledTargets = testTargets.filter(t => t.enabled && t.host.trim())
    if (enabledTargets.length === 0) {
      alert('请至少添加一个有效的测试目标')
      return
    }

    setIsValidating(true)
    setValidationProgress(0)

    try {
      // 步骤1: 语法验证
      setValidationProgress(25)
      await new Promise(resolve => setTimeout(resolve, 500))

      // 步骤2: 配置验证
      setValidationProgress(50)
      
      const response = await fetch('/api/snmp/validate-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          configType: 'snmp_exporter',
          testTargets: enabledTargets.map(t => ({
            host: t.host,
            community: t.community,
            version: t.version
          }))
        })
      })

      setValidationProgress(75)
      const result = await response.json()
      
      setValidationProgress(100)
      setValidationResult(result)

      if (result.success) {
        console.log('验证成功:', result)
      } else {
        console.error('验证失败:', result.errors)
      }

    } catch (error) {
      console.error('验证过程出错:', error)
      setValidationResult({
        success: false,
        syntaxValid: false,
        testResults: [],
        errors: [`验证过程出错: ${error instanceof Error ? error.message : '未知错误'}`],
        warnings: []
      })
    } finally {
      setIsValidating(false)
      setValidationProgress(0)
    }
  }

  // 导入配置文件
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setConfig(content)
      }
      reader.readAsText(file)
    }
  }

  // 导出配置文件
  const exportConfig = () => {
    if (!config.trim()) {
      alert('没有配置内容可导出')
      return
    }

    const blob = new Blob([config], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snmp-exporter-config-${Date.now()}.yml`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 获取验证状态图标
  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">配置测试验证</h1>
          <p className="text-muted-foreground">验证监控配置并测试真实数据抓取</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => document.getElementById('config-import')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            导入配置
          </Button>
          <Button variant="outline" onClick={exportConfig}>
            <Download className="h-4 w-4 mr-2" />
            导出配置
          </Button>
        </div>
      </div>

      <input
        id="config-import"
        type="file"
        accept=".yml,.yaml,.txt"
        onChange={importConfig}
        className="hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 配置编辑器 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              配置编辑器
            </CardTitle>
            <CardDescription>
              输入或粘贴SNMP Exporter配置文件内容
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="modules:
  default:
    walk:
      - 1.3.6.1.2.1.1.1.0  # sysDescr
      - 1.3.6.1.2.1.1.3.0  # sysUpTime
    auth:
      community: public
    version: 2c"
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
              <span>{config.split('\n').length} 行</span>
              <span>{config.length} 字符</span>
            </div>
          </CardContent>
        </Card>

        {/* 测试目标管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              测试目标
            </CardTitle>
            <CardDescription>
              配置要测试的SNMP设备
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testTargets.map((target) => (
                <Card key={target.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        placeholder="目标名称"
                        value={target.name}
                        onChange={(e) => updateTestTarget(target.id, 'name', e.target.value)}
                        className="flex-1 mr-2"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTestTarget(target.id)}
                      >
                        删除
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">主机地址</Label>
                        <Input
                          placeholder="192.168.1.100"
                          value={target.host}
                          onChange={(e) => updateTestTarget(target.id, 'host', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Community</Label>
                        <Input
                          placeholder="public"
                          value={target.community}
                          onChange={(e) => updateTestTarget(target.id, 'community', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={target.enabled}
                          onChange={(e) => updateTestTarget(target.id, 'enabled', e.target.checked)}
                        />
                        <Label className="text-xs">启用测试</Label>
                      </div>
                      <Badge variant="outline">{target.version}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
              
              <Button variant="outline" onClick={addTestTarget} className="w-full">
                + 添加测试目标
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 验证控制 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            配置验证与测试
          </CardTitle>
          <CardDescription>
            验证配置语法并测试真实数据抓取
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button 
              onClick={validateAndTest} 
              disabled={isValidating || !config.trim()}
              size="lg"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  验证中...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  开始验证测试
                </>
              )}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {testTargets.filter(t => t.enabled).length} 个启用的测试目标
            </div>
          </div>

          {isValidating && (
            <div className="space-y-2">
              <Progress value={validationProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                正在验证配置和测试数据抓取...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 验证结果 */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(validationResult.success)}
              验证结果
            </CardTitle>
            <CardDescription>
              配置验证和数据抓取测试结果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList>
                <TabsTrigger value="summary">概览</TabsTrigger>
                <TabsTrigger value="metrics">监控指标</TabsTrigger>
                <TabsTrigger value="errors">错误详情</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(validationResult.syntaxValid)}
                      <div>
                        <div className="font-medium">语法验证</div>
                        <div className="text-sm text-muted-foreground">
                          {validationResult.syntaxValid ? '配置语法正确' : '配置语法错误'}
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">数据抓取</div>
                        <div className="text-sm text-muted-foreground">
                          {validationResult.testResults.filter(r => r.success).length}/
                          {validationResult.testResults.length} 目标成功
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">监控指标</div>
                        <div className="text-sm text-muted-foreground">
                          {validationResult.testResults.reduce((sum, r) => sum + r.metrics.length, 0)} 个指标
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {validationResult.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>警告:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {validationResult.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                {validationResult.testResults.map((result) => (
                  <Card key={result.host}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(result.success)}
                        {result.host}
                      </CardTitle>
                      <CardDescription>
                        {result.success ? `${result.metrics.length} 个监控指标` : result.error}
                      </CardDescription>
                    </CardHeader>
                    {result.success && (
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>指标名称</TableHead>
                              <TableHead>值</TableHead>
                              <TableHead>类型</TableHead>
                              <TableHead>说明</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.metrics.map((metric, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono text-sm">{metric.name}</TableCell>
                                <TableCell className="font-mono">{metric.value}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{metric.type}</Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {metric.help || 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="errors" className="space-y-4">
                {validationResult.errors.length > 0 ? (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>错误详情:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {validationResult.errors.map((error, idx) => (
                          <li key={idx} className="font-mono text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>没有发现错误</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}