"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Play,
  Square,
  Edit,
  Trash2,
  Clock,
  Zap,
  GitBranch,
  Activity,
  CheckCircle,
  Settings,
  Bell,
} from "lucide-react"

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState([
    {
      id: 1,
      name: "Device Discovery Automation",
      description: "Automatically discover and register new network devices",
      trigger: "schedule",
      triggerConfig: { schedule: "daily", time: "02:00" },
      actions: [
        { type: "network_scan", config: { subnet: "192.168.1.0/24" } },
        { type: "device_register", config: { autoApprove: false } },
        { type: "notification", config: { channel: "email", recipients: ["admin@company.com"] } },
      ],
      status: "active",
      lastRun: "2024-01-20 02:00:00",
      nextRun: "2024-01-21 02:00:00",
      successRate: 95.2,
      totalRuns: 42,
      category: "discovery",
    },
    {
      id: 2,
      name: "Critical Alert Response",
      description: "Automated response to critical system alerts",
      trigger: "alert",
      triggerConfig: { severity: "critical", alertTypes: ["device_down", "high_cpu"] },
      actions: [
        { type: "create_ticket", config: { system: "jira", priority: "high" } },
        { type: "notification", config: { channel: "slack", webhook: "https://hooks.slack.com/..." } },
        { type: "escalation", config: { delay: "15m", escalateTo: "manager@company.com" } },
      ],
      status: "active",
      lastRun: "2024-01-20 14:30:00",
      nextRun: "On trigger",
      successRate: 98.7,
      totalRuns: 156,
      category: "alerting",
    },
    {
      id: 3,
      name: "Weekly Performance Report",
      description: "Generate and distribute weekly performance reports",
      trigger: "schedule",
      triggerConfig: { schedule: "weekly", day: "monday", time: "09:00" },
      actions: [
        { type: "generate_report", config: { template: "performance", period: "7d" } },
        { type: "email_report", config: { recipients: ["management@company.com"] } },
        { type: "archive_report", config: { location: "/reports/weekly" } },
      ],
      status: "active",
      lastRun: "2024-01-15 09:00:00",
      nextRun: "2024-01-22 09:00:00",
      successRate: 100,
      totalRuns: 12,
      category: "reporting",
    },
    {
      id: 4,
      name: "Backup Configuration",
      description: "Backup device configurations automatically",
      trigger: "schedule",
      triggerConfig: { schedule: "daily", time: "01:00" },
      actions: [
        { type: "config_backup", config: { devices: "all", format: "text" } },
        { type: "store_backup", config: { location: "s3://backups/configs" } },
        { type: "verify_backup", config: { checksum: true } },
      ],
      status: "paused",
      lastRun: "2024-01-19 01:00:00",
      nextRun: "Paused",
      successRate: 92.8,
      totalRuns: 89,
      category: "backup",
    },
    {
      id: 5,
      name: "Capacity Threshold Alert",
      description: "Monitor and alert on capacity thresholds",
      trigger: "threshold",
      triggerConfig: { metric: "cpu_usage", operator: ">", value: 85, duration: "5m" },
      actions: [
        { type: "send_alert", config: { severity: "warning", message: "High CPU usage detected" } },
        { type: "log_event", config: { system: "syslog", facility: "local0" } },
        { type: "auto_scale", config: { enabled: false } },
      ],
      status: "active",
      lastRun: "2024-01-20 15:45:00",
      nextRun: "On trigger",
      successRate: 89.3,
      totalRuns: 234,
      category: "monitoring",
    },
  ])

  const [workflowTemplates, setWorkflowTemplates] = useState([
    {
      id: "device_discovery",
      name: "Device Discovery",
      description: "Automated network device discovery and registration",
      category: "discovery",
      triggers: ["schedule"],
      actions: ["network_scan", "device_register", "notification"],
    },
    {
      id: "alert_response",
      name: "Alert Response",
      description: "Automated response to system alerts",
      category: "alerting",
      triggers: ["alert", "threshold"],
      actions: ["create_ticket", "notification", "escalation"],
    },
    {
      id: "backup_automation",
      name: "Backup Automation",
      description: "Automated configuration and data backup",
      category: "backup",
      triggers: ["schedule"],
      actions: ["config_backup", "store_backup", "verify_backup"],
    },
    {
      id: "report_generation",
      name: "Report Generation",
      description: "Automated report generation and distribution",
      category: "reporting",
      triggers: ["schedule"],
      actions: ["generate_report", "email_report", "archive_report"],
    },
    {
      id: "maintenance_window",
      name: "Maintenance Window",
      description: "Automated maintenance window management",
      category: "maintenance",
      triggers: ["schedule"],
      actions: ["disable_alerts", "notify_users", "enable_alerts"],
    },
  ])

  const [executionHistory, setExecutionHistory] = useState([
    {
      id: 1,
      workflowId: 1,
      startTime: "2024-01-20 02:00:00",
      endTime: "2024-01-20 02:03:45",
      status: "completed",
      duration: "3m 45s",
      actionsExecuted: 3,
      actionsSucceeded: 3,
      actionsFailed: 0,
      output: "Discovered 2 new devices, registered successfully",
    },
    {
      id: 2,
      workflowId: 2,
      startTime: "2024-01-20 14:30:15",
      endTime: "2024-01-20 14:30:32",
      status: "completed",
      duration: "17s",
      actionsExecuted: 3,
      actionsSucceeded: 3,
      actionsFailed: 0,
      output: "Critical alert processed, ticket created, notifications sent",
    },
    {
      id: 3,
      workflowId: 4,
      startTime: "2024-01-19 01:00:00",
      endTime: "2024-01-19 01:02:15",
      status: "failed",
      duration: "2m 15s",
      actionsExecuted: 2,
      actionsSucceeded: 1,
      actionsFailed: 1,
      output: "Backup completed but verification failed",
    },
    {
      id: 4,
      workflowId: 3,
      startTime: "2024-01-15 09:00:00",
      endTime: "2024-01-15 09:01:23",
      status: "completed",
      duration: "1m 23s",
      actionsExecuted: 3,
      actionsSucceeded: 3,
      actionsFailed: 0,
      output: "Weekly performance report generated and distributed",
    },
  ])

  const [isCreateWorkflowDialogOpen, setIsCreateWorkflowDialogOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null)
  const [isViewWorkflowDialogOpen, setIsViewWorkflowDialogOpen] = useState(false)

  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    trigger: "schedule",
    triggerConfig: {},
    actions: [] as any[],
    category: "discovery",
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "running":
        return <Badge className="bg-purple-100 text-purple-800">Running</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case "schedule":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "alert":
        return <Bell className="h-4 w-4 text-red-500" />
      case "threshold":
        return <Activity className="h-4 w-4 text-orange-500" />
      case "manual":
        return <Play className="h-4 w-4 text-green-500" />
      default:
        return <Zap className="h-4 w-4 text-gray-500" />
    }
  }

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      discovery: "bg-blue-100 text-blue-800",
      alerting: "bg-red-100 text-red-800",
      reporting: "bg-green-100 text-green-800",
      backup: "bg-purple-100 text-purple-800",
      monitoring: "bg-orange-100 text-orange-800",
      maintenance: "bg-gray-100 text-gray-800",
    }
    return (
      <Badge className={categoryColors[category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"}>
        {category}
      </Badge>
    )
  }

  const handleViewWorkflow = (workflow: any) => {
    setSelectedWorkflow(workflow)
    setIsViewWorkflowDialogOpen(true)
  }

  const handleToggleWorkflowStatus = (workflowId: number) => {
    setWorkflows((prev) =>
      prev.map((workflow) =>
        workflow.id === workflowId
          ? { ...workflow, status: workflow.status === "active" ? "paused" : "active" }
          : workflow,
      ),
    )
  }

  const handleRunWorkflow = (workflowId: number) => {
    const workflow = workflows.find((w) => w.id === workflowId)
    if (workflow) {
      const execution = {
        id: executionHistory.length + 1,
        workflowId: workflowId,
        startTime: new Date().toISOString().slice(0, 19).replace("T", " "),
        endTime: new Date(Date.now() + 30000).toISOString().slice(0, 19).replace("T", " "),
        status: "completed",
        duration: "30s",
        actionsExecuted: workflow.actions.length,
        actionsSucceeded: workflow.actions.length,
        actionsFailed: 0,
        output: "Manual execution completed successfully",
      }
      setExecutionHistory([execution, ...executionHistory])
    }
  }

  // Workflow statistics
  const totalWorkflows = workflows.length
  const activeWorkflows = workflows.filter((w) => w.status === "active").length
  const avgSuccessRate = workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length
  const totalExecutions = workflows.reduce((sum, w) => sum + w.totalRuns, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Automation & Workflows</h1>
          <p className="text-muted-foreground">Automate network operations and response procedures</p>
        </div>
        <Dialog open={isCreateWorkflowDialogOpen} onOpenChange={setIsCreateWorkflowDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>Configure a new automation workflow</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              <div className="space-y-4 pr-4">
                <div className="space-y-2">
                  <Label htmlFor="workflowName">Workflow Name</Label>
                  <Input
                    id="workflowName"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    placeholder="e.g., Daily Device Discovery"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workflowDescription">Description</Label>
                  <Textarea
                    id="workflowDescription"
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                    placeholder="Describe what this workflow does"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workflowTrigger">Trigger Type</Label>
                    <Select
                      value={newWorkflow.trigger}
                      onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="schedule">Schedule</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                        <SelectItem value="threshold">Threshold</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workflowCategory">Category</Label>
                    <Select
                      value={newWorkflow.category}
                      onValueChange={(value) => setNewWorkflow({ ...newWorkflow, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discovery">Discovery</SelectItem>
                        <SelectItem value="alerting">Alerting</SelectItem>
                        <SelectItem value="reporting">Reporting</SelectItem>
                        <SelectItem value="backup">Backup</SelectItem>
                        <SelectItem value="monitoring">Monitoring</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newWorkflow.trigger === "schedule" && (
                  <div className="space-y-2">
                    <Label>Schedule Configuration</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="time" placeholder="Time" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Actions</Label>
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Configure the actions this workflow will perform
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Action
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateWorkflowDialogOpen(false)}>
                Cancel
              </Button>
              <Button>Create Workflow</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Automation Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkflows}</div>
            <p className="text-xs text-muted-foreground">{activeWorkflows} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average across all workflows</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions}</div>
            <p className="text-xs text-muted-foreground">All time executions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Executions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                executionHistory.filter((h) => h.startTime.slice(0, 10) === new Date().toISOString().slice(0, 10))
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="w-full">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
          <TabsTrigger value="designer">Workflow Designer</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Management</CardTitle>
              <CardDescription>Manage and monitor automated workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{workflow.name}</div>
                          <div className="text-sm text-muted-foreground">{workflow.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {workflow.actions.length} action(s) • {workflow.totalRuns} runs
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTriggerIcon(workflow.trigger)}
                          <span className="text-sm capitalize">{workflow.trigger}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(workflow.category)}</TableCell>
                      <TableCell>{getStatusBadge(workflow.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{workflow.successRate}%</div>
                          <Progress value={workflow.successRate} className="h-1 w-16" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{workflow.nextRun}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleRunWorkflow(workflow.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleWorkflowStatus(workflow.id)}>
                            {workflow.status === "active" ? (
                              <Square className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleViewWorkflow(workflow)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Templates</CardTitle>
              <CardDescription>Pre-built workflow templates for common automation tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflowTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {getCategoryBadge(template.category)}
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Triggers</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.triggers.map((trigger, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {trigger}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Actions</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.actions.slice(0, 3).map((action, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {action.replace("_", " ")}
                              </Badge>
                            ))}
                            {template.actions.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.actions.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button size="sm" className="w-full">
                          <Plus className="h-4 w-4 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>Recent workflow execution results and logs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Output</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executionHistory.map((execution) => {
                    const workflow = workflows.find((w) => w.id === execution.workflowId)
                    return (
                      <TableRow key={execution.id}>
                        <TableCell>
                          <div className="font-medium">{workflow?.name}</div>
                        </TableCell>
                        <TableCell className="text-sm">{execution.startTime}</TableCell>
                        <TableCell className="text-sm">{execution.duration}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {execution.actionsSucceeded}/{execution.actionsExecuted}
                            {execution.actionsFailed > 0 && (
                              <span className="text-red-600 ml-1">({execution.actionsFailed} failed)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(execution.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm max-w-xs truncate" title={execution.output}>
                            {execution.output}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="designer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Designer</CardTitle>
              <DialogDescription>Visual workflow builder (Coming Soon)</DialogDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center space-y-2">
                  <GitBranch className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">Visual Workflow Designer</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Drag-and-drop workflow builder with visual flow representation. Create complex automation workflows
                    with ease.
                  </p>
                  <Button variant="outline" disabled>
                    <Settings className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Workflow Dialog */}
      <Dialog open={isViewWorkflowDialogOpen} onOpenChange={setIsViewWorkflowDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Workflow Details - {selectedWorkflow?.name}</DialogTitle>
            <DialogDescription>Complete workflow configuration and execution history</DialogDescription>
          </DialogHeader>
          {selectedWorkflow && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Trigger Type</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {getTriggerIcon(selectedWorkflow.trigger)}
                        <span className="text-sm capitalize">{selectedWorkflow.trigger}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <div className="mt-1">{getCategoryBadge(selectedWorkflow.category)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedWorkflow.status)}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Success Rate</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={selectedWorkflow.successRate} className="h-2 flex-1" />
                        <span className="text-sm">{selectedWorkflow.successRate}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Runs</Label>
                      <p className="text-sm mt-1">{selectedWorkflow.totalRuns}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Run</Label>
                      <p className="text-sm mt-1">{selectedWorkflow.lastRun}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedWorkflow.description}</p>
                </div>
              </TabsContent>
              <TabsContent value="actions" className="space-y-4">
                <div className="space-y-3">
                  {selectedWorkflow.actions.map((action: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          Action {index + 1}: {action.type.replace("_", " ")}
                        </span>
                        <Badge variant="outline">{action.type}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Configuration: {JSON.stringify(action.config, null, 2)}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="history" className="space-y-4">
                <div className="space-y-2">
                  {executionHistory
                    .filter((h) => h.workflowId === selectedWorkflow.id)
                    .slice(0, 5)
                    .map((execution) => (
                      <div key={execution.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{execution.startTime}</span>
                          {getStatusBadge(execution.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Duration: {execution.duration} • Actions: {execution.actionsSucceeded}/
                          {execution.actionsExecuted}
                        </div>
                        <div className="text-sm">{execution.output}</div>
                      </div>
                    ))}
                </div>
              </TabsContent>
              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Trigger Configuration</Label>
                    <pre className="text-sm mt-1 p-3 bg-muted rounded-md overflow-auto">
                      {JSON.stringify(selectedWorkflow.triggerConfig, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Next Scheduled Run</Label>
                    <p className="text-sm mt-1">{selectedWorkflow.nextRun}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewWorkflowDialogOpen(false)}>
              Close
            </Button>
            <Button>Edit Workflow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
