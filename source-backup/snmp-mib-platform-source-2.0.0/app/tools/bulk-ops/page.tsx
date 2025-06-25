"use client"

import { useState } from "react"
import { BulkOperationFlow } from './components/BulkOperationFlow'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Play, RefreshCw, Download, CheckCircle, AlertTriangle, FileText, Settings, Trash2 } from "lucide-react"

interface BulkOperation {
  id: string
  type: "generate" | "validate" | "convert" | "deploy"
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  target: string
  result?: string
  error?: string
}

interface MibFile {
  id: string
  name: string
  selected: boolean
  status: "ready" | "processing" | "completed" | "error"
  size: string
}

export default function BulkOperationsPage() {
  const { toast } = useToast()
  const [selectedOperation, setSelectedOperation] = useState("generate")
  const [isRunning, setIsRunning] = useState(false)
  const [operations, setOperations] = useState<BulkOperation[]>([])
  const [showOperationFlow, setShowOperationFlow] = useState(false)
  
  // 批量操作数据
  const bulkOperations = [
    {
      id: 'restart-service',
      name: '重启服务',
      description: '重启指定的系统服务',
      category: 'system' as const,
      type: 'command' as const,
      command: 'systemctl restart {{service_name}}',
      parameters: [
        {
          name: 'service_name',
          type: 'select' as const,
          description: '要重启的服务名称',
          defaultValue: 'nginx',
          required: true,
          options: ['nginx', 'apache2', 'mysql', 'postgresql', 'redis', 'docker']
        },
        {
          name: 'wait_time',
          type: 'number' as const,
          description: '重启后等待时间(秒)',
          defaultValue: 10,
          required: false
        }
      ],
      requiresConfirmation: true,
      dangerLevel: 'medium' as const,
      estimatedDuration: '2-5分钟'
    },
    {
      id: 'deploy-monitoring',
      name: '部署监控组件',
      description: '在选定主机上部署监控组件',
      category: 'monitoring' as const,
      type: 'script' as const,
      parameters: [
        {
          name: 'component_type',
          type: 'select' as const,
          description: '监控组件类型',
          defaultValue: 'node-exporter',
          required: true,
          options: ['node-exporter', 'prometheus', 'grafana', 'alertmanager']
        }
      ],
      requiresConfirmation: true,
      dangerLevel: 'medium' as const,
      estimatedDuration: '5-15分钟'
    }
  ]
  
  const [mibFiles, setMibFiles] = useState<MibFile[]>([
    { id: "1", name: "CISCO-MEMORY-POOL-MIB.mib", selected: true, status: "ready", size: "24.5 KB" },
    { id: "2", name: "IF-MIB.mib", selected: true, status: "ready", size: "78.2 KB" },
    { id: "3", name: "HOST-RESOURCES-MIB.mib", selected: false, status: "ready", size: "102.7 KB" },
    { id: "4", name: "SNMPv2-MIB.mib", selected: true, status: "ready", size: "45.1 KB" },
    { id: "5", name: "ENTITY-MIB.mib", selected: false, status: "ready", size: "67.8 KB" },
  ])

  const [outputFormat, setOutputFormat] = useState("prometheus")
  const [deviceTemplate, setDeviceTemplate] = useState("generic")
  const [includeComments, setIncludeComments] = useState(true)
  const [validateOutput, setValidateOutput] = useState(true)

  const operationTypes = [
    { value: "generate", label: "Generate Configurations", description: "Generate monitoring configs from MIBs" },
    { value: "validate", label: "Validate MIBs", description: "Validate syntax and structure of MIB files" },
    { value: "convert", label: "Convert Format", description: "Convert between different MIB formats" },
    { value: "deploy", label: "Deploy Configs", description: "Deploy configurations to monitoring systems" },
  ]

  const outputFormats = [
    { value: "prometheus", label: "Prometheus SNMP Exporter" },
    { value: "categraf", label: "Categraf SNMP" },
    { value: "zabbix", label: "Zabbix Template" },
    { value: "json", label: "JSON Format" },
  ]

  const deviceTemplates = [
    { value: "generic", label: "Generic Device" },
    { value: "cisco-router", label: "Cisco Router" },
    { value: "cisco-switch", label: "Cisco Switch" },
    { value: "linux-server", label: "Linux Server" },
    { value: "windows-server", label: "Windows Server" },
  ]

  const toggleMibSelection = (id: string) => {
    setMibFiles(mibFiles.map((file) => (file.id === id ? { ...file, selected: !file.selected } : file)))
  }

  const selectAllMibs = () => {
    const allSelected = mibFiles.every((file) => file.selected)
    setMibFiles(mibFiles.map((file) => ({ ...file, selected: !allSelected })))
  }

  const getSelectedMibs = () => mibFiles.filter((file) => file.selected)

  const startBulkOperation = async () => {
    const selectedMibs = getSelectedMibs()
    if (selectedMibs.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one MIB file to process",
        variant: "destructive",
      })
      return
    }

    setIsRunning(true)

    // Create operations for each selected MIB
    const newOperations: BulkOperation[] = selectedMibs.map((mib) => ({
      id: `${Date.now()}-${mib.id}`,
      type: selectedOperation as any,
      status: "pending",
      progress: 0,
      target: mib.name,
    }))

    setOperations(newOperations)

    // Simulate processing each operation
    for (let i = 0; i < newOperations.length; i++) {
      const operation = newOperations[i]

      // Update status to running
      setOperations((prev) => prev.map((op) => (op.id === operation.id ? { ...op, status: "running" } : op)))

      // Update MIB file status
      setMibFiles((prev) =>
        prev.map((file) => (file.name === operation.target ? { ...file, status: "processing" } : file)),
      )

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        setOperations((prev) => prev.map((op) => (op.id === operation.id ? { ...op, progress } : op)))
      }

      // Complete operation
      const success = Math.random() > 0.2 // 80% success rate
      setOperations((prev) =>
        prev.map((op) =>
          op.id === operation.id
            ? {
                ...op,
                status: success ? "completed" : "failed",
                progress: 100,
                result: success ? `${selectedOperation} completed successfully` : undefined,
                error: success ? undefined : "Processing failed due to syntax error",
              }
            : op,
        ),
      )

      setMibFiles((prev) =>
        prev.map((file) =>
          file.name === operation.target ? { ...file, status: success ? "completed" : "error" } : file,
        ),
      )
    }

    setIsRunning(false)

    const completed = newOperations.length
    const failed = newOperations.filter((op) => Math.random() > 0.8).length

    toast({
      title: "Bulk Operation Complete",
      description: `Processed ${completed} files. ${failed} failed.`,
      variant: failed > 0 ? "destructive" : "default",
    })
  }

  const clearOperations = () => {
    setOperations([])
    setMibFiles(mibFiles.map((file) => ({ ...file, status: "ready" })))
  }

  const exportResults = () => {
    const results = operations
      .filter((op) => op.status === "completed")
      .map((op) => `${op.target}: ${op.result}`)
      .join("\n")

    const blob = new Blob([results], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bulk-operation-results-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Results exported successfully",
    })
  }

  const getOverallProgress = () => {
    if (operations.length === 0) return 0
    const totalProgress = operations.reduce((sum, op) => sum + op.progress, 0)
    return Math.round(totalProgress / operations.length)
  }

  const getStatusCounts = () => {
    return {
      pending: operations.filter((op) => op.status === "pending").length,
      running: operations.filter((op) => op.status === "running").length,
      completed: operations.filter((op) => op.status === "completed").length,
      failed: operations.filter((op) => op.status === "failed").length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Operations</h1>
        <p className="text-muted-foreground">Process multiple MIB files and configurations in batch</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Operation Settings
              </CardTitle>
              <CardDescription>Configure bulk operation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Operation Type</Label>
                <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {operationTypes.find((t) => t.value === selectedOperation)?.description}
                </p>
              </div>

              {selectedOperation === "generate" && (
                <>
                  <div className="space-y-2">
                    <Label>Output Format</Label>
                    <Select value={outputFormat} onValueChange={setOutputFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {outputFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Device Template</Label>
                    <Select value={deviceTemplate} onValueChange={setDeviceTemplate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTemplates.map((template) => (
                          <SelectItem key={template.value} value={template.value}>
                            {template.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeComments"
                        checked={includeComments}
                        onCheckedChange={(checked) => setIncludeComments(checked as boolean)}
                      />
                      <Label htmlFor="includeComments" className="text-sm">
                        Include comments
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="validateOutput"
                        checked={validateOutput}
                        onCheckedChange={(checked) => setValidateOutput(checked as boolean)}
                      />
                      <Label htmlFor="validateOutput" className="text-sm">
                        Validate output
                      </Label>
                    </div>
                  </div>
                </>
              )}

              <Button onClick={startBulkOperation} disabled={isRunning} className="w-full">
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Operation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* File Selection */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    MIB Files
                  </CardTitle>
                  <CardDescription>Select files to process</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={selectAllMibs}>
                  {mibFiles.every((file) => file.selected) ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {mibFiles.map((file) => (
                  <div key={file.id} className="flex items-center space-x-2 p-2 border rounded">
                    <Checkbox
                      checked={file.selected}
                      onCheckedChange={() => toggleMibSelection(file.id)}
                      disabled={isRunning}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{file.name}</span>
                        <Badge
                          variant={
                            file.status === "completed"
                              ? "default"
                              : file.status === "error"
                                ? "destructive"
                                : file.status === "processing"
                                  ? "secondary"
                                  : "outline"
                          }
                          className="ml-2"
                        >
                          {file.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{file.size}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {getSelectedMibs().length} of {mibFiles.length} files selected
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Overview */}
          {operations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Operation Progress</CardTitle>
                    <CardDescription>Overall progress and status</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {operations.length > 0 && (
                      <Button variant="outline" size="sm" onClick={exportResults}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={clearOperations}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{getOverallProgress()}%</span>
                  </div>
                  <Progress value={getOverallProgress()} className="h-2" />
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant="outline">{statusCounts.pending} Pending</Badge>
                  <Badge className="bg-blue-100 text-blue-800">{statusCounts.running} Running</Badge>
                  <Badge className="bg-green-100 text-green-800">{statusCounts.completed} Completed</Badge>
                  <Badge className="bg-red-100 text-red-800">{statusCounts.failed} Failed</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Operation Results</CardTitle>
              <CardDescription>Detailed results for each processed file</CardDescription>
            </CardHeader>
            <CardContent>
              {operations.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operations.map((operation) => (
                        <TableRow key={operation.id}>
                          <TableCell className="font-medium">{operation.target}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                operation.status === "completed"
                                  ? "default"
                                  : operation.status === "failed"
                                    ? "destructive"
                                    : operation.status === "running"
                                      ? "secondary"
                                      : "outline"
                              }
                            >
                              {operation.status === "running" && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                              {operation.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {operation.status === "failed" && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {operation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={operation.progress} className="h-2 w-20" />
                              <span className="text-xs text-muted-foreground">{operation.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {operation.result && <span className="text-sm text-green-600">{operation.result}</span>}
                            {operation.error && <span className="text-sm text-red-600">{operation.error}</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure operation settings and start processing to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
