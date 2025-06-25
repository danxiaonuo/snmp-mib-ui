"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertTriangle, FileText, RefreshCw, Download } from "lucide-react"

export default function ConfigValidatorPage() {
  const { toast } = useToast()
  const [configContent, setConfigContent] = useState("")
  const [configType, setConfigType] = useState("prometheus")
  const [isValidating, setIsValidating] = useState(false)
  const [validationResults, setValidationResults] = useState<any>(null)

  const configTypes = [
    { value: "prometheus", label: "Prometheus SNMP Exporter" },
    { value: "categraf", label: "Categraf" },
    { value: "zabbix", label: "Zabbix" },
    { value: "telegraf", label: "Telegraf" },
  ]

  const loadSampleConfig = () => {
    const prometheusConfig = `# Sample Prometheus SNMP Exporter config
modules:
  router:
    walk:
      - 1.3.6.1.2.1.1
      - 1.3.6.1.2.1.2.2
    metrics:
      - name: sysUpTime
        oid: 1.3.6.1.2.1.1.3.0
        type: gauge
        help: The time since the network management portion of the system was last re-initialized
      - name: ifNumber
        oid: 1.3.6.1.2.1.2.1.0
        type: gauge
        help: The number of network interfaces present on this system
      - name: ifDescr
        oid: 1.3.6.1.2.1.2.2.1.2
        type: DisplayString
        indexes:
          - labelname: ifIndex
            type: gauge
        help: A textual string containing information about the interface`

    setConfigContent(prometheusConfig)
    toast({
      title: "Sample Loaded",
      description: "Sample configuration loaded for validation",
    })
  }

  const handleValidate = async () => {
    if (!configContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide configuration content to validate",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)

    try {
      // Simulate validation process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock validation results
      const mockResults = {
        isValid: true,
        errors: [],
        warnings: [
          {
            line: 12,
            message: "OID 1.3.6.1.2.1.1.3.0 should use counter type instead of gauge for uptime metrics",
            severity: "warning",
          },
        ],
        info: {
          metrics: 3,
          oids: 4,
          moduleCount: 1,
          estimatedMemoryUsage: "Low",
        },
      }

      setValidationResults(mockResults)

      toast({
        title: "Validation Complete",
        description: `Configuration is ${mockResults.isValid ? "valid" : "invalid"} with ${
          mockResults.warnings.length
        } warnings`,
      })
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "An error occurred during validation",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleDownload = () => {
    if (!configContent.trim()) return

    const blob = new Blob([configContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `config-${configType}-${Date.now()}.yaml`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Download Complete",
      description: "Configuration file downloaded successfully",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuration Validator</h1>
        <p className="text-muted-foreground">Validate monitoring system configuration files</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Configuration Content
            </CardTitle>
            <CardDescription>Paste your configuration or load a sample</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <Label htmlFor="config-type">Configuration Type</Label>
                <Select value={configType} onValueChange={setConfigType}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {configTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={loadSampleConfig}>
                Load Sample
              </Button>
            </div>

            <Textarea
              placeholder="Paste configuration content here..."
              value={configContent}
              onChange={(e) => setConfigContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleDownload} disabled={!configContent.trim()}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleValidate} disabled={!configContent.trim() || isValidating}>
                {isValidating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Validation Results
            </CardTitle>
            <CardDescription>Syntax errors, warnings, and information</CardDescription>
          </CardHeader>
          <CardContent>
            {!validationResults ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Paste configuration content and validate to see results</p>
              </div>
            ) : (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="issues">Issues</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <div className="grid gap-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Configuration validation completed with {validationResults.warnings.length} warnings and{" "}
                        {validationResults.errors.length} errors
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-3">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge
                          className={
                            validationResults.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }
                        >
                          {validationResults.isValid ? "Valid" : "Invalid"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Metrics:</span>
                        <span className="font-medium">{validationResults.info.metrics}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OIDs:</span>
                        <span className="font-medium">{validationResults.info.oids}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Modules:</span>
                        <span className="font-medium">{validationResults.info.moduleCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory Usage:</span>
                        <span className="font-medium">{validationResults.info.estimatedMemoryUsage}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="issues" className="space-y-4">
                  {validationResults.errors.length === 0 && validationResults.warnings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No issues found!</p>
                    </div>
                  ) : (
                    <>
                      {validationResults.errors.map((error: any, index: number) => (
                        <Alert key={`error-${index}`} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">Line {error.line}</p>
                                <p className="text-sm">{error.message}</p>
                              </div>
                              <Badge variant="destructive">Error</Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}

                      {validationResults.warnings.map((warning: any, index: number) => (
                        <Alert key={`warning-${index}`}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">Line {warning.line}</p>
                                <p className="text-sm">{warning.message}</p>
                              </div>
                              <Badge variant="outline" className="text-yellow-600">
                                Warning
                              </Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Configuration Structure</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-auto">{JSON.stringify(validationResults.info, null, 2)}</pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
