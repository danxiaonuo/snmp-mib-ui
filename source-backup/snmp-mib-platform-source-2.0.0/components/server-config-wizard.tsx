"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Server, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Download,
  Copy,
  Settings,
  Zap,
  Shield,
  Monitor
} from "lucide-react"
import { detectServerBrand, getRecommendedServerConfig, generateServerMonitoringAdvice, type ServerBrandInfo } from "@/lib/server-brand-detection"
import { ALL_CONFIG_TEMPLATES, renderConfigTemplate, type ConfigTemplate } from "@/lib/config-templates"
import { RealTimeMonitoringTest } from "./real-time-monitoring-test"

interface ServerConfigWizardProps {
  onConfigGenerated?: (config: string, template: ConfigTemplate) => void
}

export function ServerConfigWizard({ onConfigGenerated }: ServerConfigWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [serverInfo, setServerInfo] = useState({
    ip: '',
    community: 'public',
    sysDescr: '',
    sysObjectID: '',
    vendorOID: ''
  })
  const [detectionResults, setDetectionResults] = useState<ServerBrandInfo[]>([])
  const [selectedBrand, setSelectedBrand] = useState<ServerBrandInfo | null>(null)
  const [generatedConfig, setGeneratedConfig] = useState('')
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionProgress, setDetectionProgress] = useState(0)
  const [realTimeTest, setRealTimeTest] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null)

  // 真实SNMP连接测试
  const testConnection = async () => {
    if (!serverInfo.ip) {
      alert('请输入服务器IP地址')
      return
    }

    setIsDetecting(true)
    setDetectionProgress(0)

    try {
      setDetectionProgress(20)
      
      // 调用真实的SNMP测试API
      const response = await fetch('/api/snmp/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: serverInfo.ip,
          community: serverInfo.community,
          version: '2c',
          timeout: 5
        })
      })

      setDetectionProgress(60)
      const result = await response.json()
      setConnectionTestResult(result)
      
      setDetectionProgress(80)

      if (result.success) {
        // 使用真实的SNMP数据进行品牌检测
        const detectionResults = detectServerBrand({
          sysDescr: result.sysDescr || '',
          sysObjectID: result.sysObjectID || '',
          vendorOID: result.sysObjectID?.split('.').slice(0, 7).join('.') || '',
          managementIP: serverInfo.ip
        })

        // 如果API已经检测到品牌，优先使用API结果
        if (result.detectedBrand && result.recommendedTemplate) {
          const apiResult = {
            brand: result.detectedBrand,
            managementInterface: 'SNMP',
            recommendedTemplate: result.recommendedTemplate,
            confidence: 95,
            detectionMethod: 'SNMP查询结果'
          }
          setDetectionResults([apiResult, ...detectionResults])
          setSelectedBrand(apiResult)
        } else {
          setDetectionResults(detectionResults)
          if (detectionResults.length > 0) {
            setSelectedBrand(detectionResults[0])
          }
        }

        setDetectionProgress(100)
        setCurrentStep(2)
      } else {
        alert(`连接失败: ${result.error}`)
      }
    } catch (error) {
      console.error('连接测试失败:', error)
      alert('连接测试失败，请检查网络连接和SNMP配置')
    } finally {
      setIsDetecting(false)
      setDetectionProgress(0)
    }
  }

  // 自动检测服务器品牌（保留原有功能作为备用）
  const detectServer = async () => {
    // 优先使用真实连接测试
    await testConnection()
  }

  // 生成配置
  const generateConfig = () => {
    if (!selectedBrand) return

    const template = ALL_CONFIG_TEMPLATES.find(t => t.id === selectedBrand.recommendedTemplate)
    if (!template) return

    const parameters = {
      community: serverInfo.community,
      version: '2',
      timeout: 10,
      retries: 3
    }

    const config = renderConfigTemplate(template, parameters)
    setGeneratedConfig(config)
    setCurrentStep(3)

    if (onConfigGenerated) {
      onConfigGenerated(config, template)
    }
  }

  // 手动选择品牌
  const selectBrand = (brand: ServerBrandInfo) => {
    setSelectedBrand(brand)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            服务器监控配置向导
          </CardTitle>
          <CardDescription>
            智能检测服务器品牌并推荐最适合的监控配置模板
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              步骤 {currentStep} / 3
            </div>
          </div>

          <Tabs value={currentStep.toString()} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1">服务器信息</TabsTrigger>
              <TabsTrigger value="2">品牌检测</TabsTrigger>
              <TabsTrigger value="3">配置生成</TabsTrigger>
            </TabsList>

            <TabsContent value="1" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="server-ip">服务器IP地址 *</Label>
                  <Input
                    id="server-ip"
                    placeholder="192.168.1.100"
                    value={serverInfo.ip}
                    onChange={(e) => setServerInfo(prev => ({ ...prev, ip: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="snmp-community">SNMP Community</Label>
                  <Input
                    id="snmp-community"
                    placeholder="public"
                    value={serverInfo.community}
                    onChange={(e) => setServerInfo(prev => ({ ...prev, community: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">可选：手动输入SNMP信息（如果已知）</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sys-descr">系统描述 (sysDescr)</Label>
                    <Input
                      id="sys-descr"
                      placeholder="Dell Inc. PowerEdge R740"
                      value={serverInfo.sysDescr}
                      onChange={(e) => setServerInfo(prev => ({ ...prev, sysDescr: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sys-object-id">系统对象ID</Label>
                      <Input
                        id="sys-object-id"
                        placeholder="1.3.6.1.4.1.674.10892.5"
                        value={serverInfo.sysObjectID}
                        onChange={(e) => setServerInfo(prev => ({ ...prev, sysObjectID: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor-oid">厂商OID</Label>
                      <Input
                        id="vendor-oid"
                        placeholder="1.3.6.1.4.1.674"
                        value={serverInfo.vendorOID}
                        onChange={(e) => setServerInfo(prev => ({ ...prev, vendorOID: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button onClick={detectServer} disabled={isDetecting || !serverInfo.ip}>
                  {isDetecting ? (
                    <>
                      <Search className="h-4 w-4 mr-2 animate-spin" />
                      检测中...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      开始检测
                    </>
                  )}
                </Button>
              </div>

              {isDetecting && (
                <div className="space-y-2">
                  <Progress value={detectionProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    正在检测服务器信息...
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="2" className="space-y-4">
              {detectionResults.length > 0 ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      检测到 {detectionResults.length} 个可能的服务器品牌，请选择最匹配的选项
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-4">
                    {detectionResults.map((result, index) => {
                      const config = getRecommendedServerConfig(result)
                      return (
                        <Card 
                          key={index} 
                          className={`cursor-pointer transition-all ${
                            selectedBrand?.brand === result.brand 
                              ? 'ring-2 ring-blue-500 bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => selectBrand(result)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{result.brand}</h3>
                                <Badge variant={index === 0 ? "default" : "secondary"}>
                                  置信度: {result.confidence}%
                                </Badge>
                                {index === 0 && (
                                  <Badge variant="outline" className="text-green-600">
                                    推荐
                                  </Badge>
                                )}
                              </div>
                              {selectedBrand?.brand === result.brand && (
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              管理接口: {result.managementInterface}
                            </p>
                            <p className="text-sm text-muted-foreground mb-3">
                              {config.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {config.features.slice(0, 3).map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {selectedBrand && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setCurrentStep(1)}>
                        返回
                      </Button>
                      <Button onClick={generateConfig}>
                        <Settings className="h-4 w-4 mr-2" />
                        生成配置
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    未检测到服务器信息，请返回上一步检查输入或手动选择服务器类型
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="3" className="space-y-4">
              {generatedConfig && selectedBrand && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      已为 {selectedBrand.brand} 服务器生成专用监控配置
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        配置预览
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setRealTimeTest(!realTimeTest)}
                          >
                            <Monitor className="h-4 w-4 mr-2" />
                            {realTimeTest ? '隐藏' : '显示'}实时测试
                          </Button>
                        </div>
                      </CardTitle>
                      <CardDescription>
                        {getRecommendedServerConfig(selectedBrand).description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* 连接测试结果展示 */}
                        {connectionTestResult && (
                          <Card className="bg-blue-50 border-blue-200">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">SNMP连接测试结果</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>系统描述:</strong> {connectionTestResult.sysDescr || 'N/A'}
                                </div>
                                <div>
                                  <strong>系统名称:</strong> {connectionTestResult.sysName || 'N/A'}
                                </div>
                                <div>
                                  <strong>运行时间:</strong> {connectionTestResult.sysUpTime || 'N/A'}
                                </div>
                                <div>
                                  <strong>响应时间:</strong> {connectionTestResult.responseTime || 'N/A'}ms
                                </div>
                                {connectionTestResult.sysLocation && (
                                  <div>
                                    <strong>位置:</strong> {connectionTestResult.sysLocation}
                                  </div>
                                )}
                                {connectionTestResult.sysContact && (
                                  <div>
                                    <strong>联系人:</strong> {connectionTestResult.sysContact}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                            {generatedConfig}
                          </pre>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedConfig)
                                alert('配置已复制到剪贴板')
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              复制配置
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const blob = new Blob([generatedConfig], { type: 'text/yaml' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `${selectedBrand.recommendedTemplate}-${serverInfo.ip}.yml`
                                a.click()
                                URL.revokeObjectURL(url)
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              下载文件
                            </Button>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" onClick={() => setCurrentStep(2)}>
                              返回选择
                            </Button>
                            <Button>
                              <Monitor className="h-4 w-4 mr-2" />
                              部署配置
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 实时监控测试 */}
                  {realTimeTest && (
                    <RealTimeMonitoringTest
                      config={generatedConfig}
                      targets={[{
                        host: serverInfo.ip,
                        community: serverInfo.community,
                        version: '2c',
                        name: connectionTestResult?.sysName || serverInfo.ip
                      }]}
                      onMetricsUpdate={(metrics) => {
                        console.log('收到监控指标:', metrics)
                      }}
                    />
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        配置说明
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">功能特性:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {getRecommendedServerConfig(selectedBrand).features.map((feature, idx) => (
                              <li key={idx}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">部署要求:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {getRecommendedServerConfig(selectedBrand).requirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}