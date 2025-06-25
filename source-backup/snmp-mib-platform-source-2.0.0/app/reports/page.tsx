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
import { Checkbox } from "@/components/ui/checkbox"
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
  FileText,
  Download,
  Eye,
  Calendar,
  Clock,
  Mail,
  Settings,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  FileIcon as FilePdf,
  FileImage,
} from "lucide-react"

export default function ReportsPage() {
  const [reports, setReports] = useState([
    {
      id: 1,
      name: "Network Performance Report",
      type: "performance",
      description: "Weekly network performance analysis",
      schedule: "weekly",
      format: "pdf",
      recipients: ["admin@company.com", "network@company.com"],
      lastGenerated: "2024-01-20 09:00:00",
      nextGeneration: "2024-01-27 09:00:00",
      status: "active",
      template: "network_performance",
      parameters: {
        dateRange: "7d",
        includeGraphs: true,
        includeAlerts: true,
      },
    },
    {
      id: 2,
      name: "Device Availability Report",
      type: "availability",
      description: "Monthly device uptime and availability statistics",
      schedule: "monthly",
      format: "excel",
      recipients: ["management@company.com"],
      lastGenerated: "2024-01-01 08:00:00",
      nextGeneration: "2024-02-01 08:00:00",
      status: "active",
      template: "device_availability",
      parameters: {
        dateRange: "30d",
        includeDowntime: true,
        groupByLocation: true,
      },
    },
    {
      id: 3,
      name: "Alert Summary Report",
      type: "alerts",
      description: "Daily alert summary and response times",
      schedule: "daily",
      format: "html",
      recipients: ["ops@company.com"],
      lastGenerated: "2024-01-20 06:00:00",
      nextGeneration: "2024-01-21 06:00:00",
      status: "active",
      template: "alert_summary",
      parameters: {
        dateRange: "1d",
        includeCriticalOnly: false,
        includeResponseTimes: true,
      },
    },
    {
      id: 4,
      name: "Capacity Planning Report",
      type: "capacity",
      description: "Quarterly capacity analysis and forecasting",
      schedule: "quarterly",
      format: "pdf",
      recipients: ["planning@company.com", "management@company.com"],
      lastGenerated: "2024-01-01 10:00:00",
      nextGeneration: "2024-04-01 10:00:00",
      status: "active",
      template: "capacity_planning",
      parameters: {
        dateRange: "90d",
        includeForecast: true,
        includeRecommendations: true,
      },
    },
    {
      id: 5,
      name: "Security Audit Report",
      type: "security",
      description: "Monthly security events and compliance status",
      schedule: "monthly",
      format: "pdf",
      recipients: ["security@company.com"],
      lastGenerated: "2024-01-01 07:00:00",
      nextGeneration: "2024-02-01 07:00:00",
      status: "paused",
      template: "security_audit",
      parameters: {
        dateRange: "30d",
        includeVulnerabilities: true,
        includeCompliance: true,
      },
    },
  ])

  const [reportHistory, setReportHistory] = useState([
    {
      id: 1,
      reportId: 1,
      generatedAt: "2024-01-20 09:00:00",
      format: "pdf",
      size: "2.3 MB",
      status: "completed",
      downloadUrl: "/reports/network_performance_20240120.pdf",
    },
    {
      id: 2,
      reportId: 2,
      generatedAt: "2024-01-01 08:00:00",
      format: "excel",
      size: "1.8 MB",
      status: "completed",
      downloadUrl: "/reports/device_availability_20240101.xlsx",
    },
    {
      id: 3,
      reportId: 3,
      generatedAt: "2024-01-20 06:00:00",
      format: "html",
      size: "456 KB",
      status: "completed",
      downloadUrl: "/reports/alert_summary_20240120.html",
    },
    {
      id: 4,
      reportId: 1,
      generatedAt: "2024-01-19 09:00:00",
      format: "pdf",
      size: "2.1 MB",
      status: "failed",
      downloadUrl: null,
    },
  ])

  const [templates, setTemplates] = useState([
    {
      id: "network_performance",
      name: "Network Performance",
      description: "Comprehensive network performance analysis",
      category: "performance",
      sections: ["Executive Summary", "Performance Metrics", "Trend Analysis", "Recommendations"],
      parameters: ["dateRange", "includeGraphs", "includeAlerts"],
    },
    {
      id: "device_availability",
      name: "Device Availability",
      description: "Device uptime and availability statistics",
      category: "availability",
      sections: ["Availability Summary", "Device Status", "Downtime Analysis", "SLA Compliance"],
      parameters: ["dateRange", "includeDowntime", "groupByLocation"],
    },
    {
      id: "alert_summary",
      name: "Alert Summary",
      description: "Alert statistics and response analysis",
      category: "alerts",
      sections: ["Alert Overview", "Response Times", "Alert Trends", "Top Issues"],
      parameters: ["dateRange", "includeCriticalOnly", "includeResponseTimes"],
    },
    {
      id: "capacity_planning",
      name: "Capacity Planning",
      description: "Resource utilization and capacity forecasting",
      category: "capacity",
      sections: ["Current Utilization", "Growth Trends", "Capacity Forecast", "Recommendations"],
      parameters: ["dateRange", "includeForecast", "includeRecommendations"],
    },
    {
      id: "security_audit",
      name: "Security Audit",
      description: "Security events and compliance reporting",
      category: "security",
      sections: ["Security Overview", "Threat Analysis", "Compliance Status", "Action Items"],
      parameters: ["dateRange", "includeVulnerabilities", "includeCompliance"],
    },
  ])

  const [isCreateReportDialogOpen, setIsCreateReportDialogOpen] = useState(false)
  const [newReport, setNewReport] = useState({
    name: "",
    type: "",
    description: "",
    schedule: "weekly",
    format: "pdf",
    recipients: "",
    template: "",
    parameters: {} as Record<string, any>,
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
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf":
        return <FilePdf className="h-4 w-4 text-red-500" />
      case "excel":
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />
      case "html":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "csv":
        return <FileText className="h-4 w-4 text-gray-500" />
      default:
        return <FileImage className="h-4 w-4 text-purple-500" />
    }
  }

  const getScheduleBadge = (schedule: string) => {
    const scheduleColors = {
      daily: "bg-blue-100 text-blue-800",
      weekly: "bg-green-100 text-green-800",
      monthly: "bg-purple-100 text-purple-800",
      quarterly: "bg-orange-100 text-orange-800",
      yearly: "bg-red-100 text-red-800",
    }
    return (
      <Badge className={scheduleColors[schedule as keyof typeof scheduleColors] || "bg-gray-100 text-gray-800"}>
        {schedule}
      </Badge>
    )
  }

  const handleCreateReport = () => {
    const report = {
      id: reports.length + 1,
      ...newReport,
      recipients: newReport.recipients.split(",").map((email) => email.trim()),
      lastGenerated: "Never",
      nextGeneration: "TBD",
      status: "active",
    }
    setReports([...reports, report])
    setIsCreateReportDialogOpen(false)
    setNewReport({
      name: "",
      type: "",
      description: "",
      schedule: "weekly",
      format: "pdf",
      recipients: "",
      template: "",
      parameters: {},
    })
  }

  const handleGenerateReport = (reportId: number) => {
    const report = reports.find((r) => r.id === reportId)
    if (report) {
      const historyEntry = {
        id: reportHistory.length + 1,
        reportId: reportId,
        generatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        format: report.format,
        size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
        status: "completed",
        downloadUrl: `/reports/${report.name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}.${report.format}`,
      }
      setReportHistory([historyEntry, ...reportHistory])
    }
  }

  const handleToggleReportStatus = (reportId: number) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId ? { ...report, status: report.status === "active" ? "paused" : "active" } : report,
      ),
    )
  }

  // Report statistics
  const totalReports = reports.length
  const activeReports = reports.filter((r) => r.status === "active").length
  const reportsGeneratedToday = reportHistory.filter((h) => {
    const today = new Date().toISOString().slice(0, 10)
    return h.generatedAt.slice(0, 10) === today
  }).length
  const successRate =
    reportHistory.length > 0
      ? (reportHistory.filter((h) => h.status === "completed").length / reportHistory.length) * 100
      : 100

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Report Center</h1>
          <p className="text-muted-foreground">Automated report generation and distribution</p>
        </div>
        <Dialog open={isCreateReportDialogOpen} onOpenChange={setIsCreateReportDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>Configure a new automated report</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              <div className="space-y-4 pr-4">
                <div className="space-y-2">
                  <Label htmlFor="reportName">Report Name</Label>
                  <Input
                    id="reportName"
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                    placeholder="e.g., Weekly Network Performance Report"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportDescription">Description</Label>
                  <Textarea
                    id="reportDescription"
                    value={newReport.description}
                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                    placeholder="Brief description of the report content"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select
                      value={newReport.type}
                      onValueChange={(value) => setNewReport({ ...newReport, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="availability">Availability</SelectItem>
                        <SelectItem value="alerts">Alerts</SelectItem>
                        <SelectItem value="capacity">Capacity</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportTemplate">Template</Label>
                    <Select
                      value={newReport.template}
                      onValueChange={(value) => setNewReport({ ...newReport, template: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportSchedule">Schedule</Label>
                    <Select
                      value={newReport.schedule}
                      onValueChange={(value) => setNewReport({ ...newReport, schedule: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportFormat">Format</Label>
                    <Select
                      value={newReport.format}
                      onValueChange={(value) => setNewReport({ ...newReport, format: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportRecipients">Recipients</Label>
                  <Input
                    id="reportRecipients"
                    value={newReport.recipients}
                    onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
                    placeholder="email1@company.com, email2@company.com"
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple email addresses with commas</p>
                </div>

                <div className="space-y-3">
                  <Label>Report Parameters</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="includeGraphs" />
                      <Label htmlFor="includeGraphs" className="text-sm">
                        Include graphs and charts
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="includeAlerts" />
                      <Label htmlFor="includeAlerts" className="text-sm">
                        Include alert information
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="includeRecommendations" />
                      <Label htmlFor="includeRecommendations" className="text-sm">
                        Include recommendations
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReport}>Create Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Report Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <p className="text-xs text-muted-foreground">{activeReports} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsGeneratedToday}</div>
            <p className="text-xs text-muted-foreground">Reports completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Generation success</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.filter((r) => r.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Reports pending</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Management</CardTitle>
              <CardDescription>Configure and manage automated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Generated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{report.name}</div>
                          <div className="text-sm text-muted-foreground">{report.description}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {report.recipients.length} recipient(s)
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.type}</Badge>
                      </TableCell>
                      <TableCell>{getScheduleBadge(report.schedule)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFormatIcon(report.format)}
                          <span className="text-sm uppercase">{report.format}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-sm">{report.lastGenerated}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleGenerateReport(report.id)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleReportStatus(report.id)}>
                            {report.status === "active" ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
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
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>Pre-configured report templates for common use cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Sections</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.sections.map((section, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {section}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Use Template
                          </Button>
                        </div>
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
              <CardTitle>Report History</CardTitle>
              <CardDescription>Generated reports and download history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportHistory.map((history) => {
                    const report = reports.find((r) => r.id === history.reportId)
                    return (
                      <TableRow key={history.id}>
                        <TableCell>
                          <div className="font-medium">{report?.name}</div>
                        </TableCell>
                        <TableCell className="text-sm">{history.generatedAt}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFormatIcon(history.format)}
                            <span className="text-sm uppercase">{history.format}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{history.size}</TableCell>
                        <TableCell>{getStatusBadge(history.status)}</TableCell>
                        <TableCell>
                          {history.downloadUrl && history.status === "completed" ? (
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Report Schedule
              </CardTitle>
              <CardDescription>Upcoming report generation schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports
                  .filter((report) => report.status === "active")
                  .sort((a, b) => new Date(a.nextGeneration).getTime() - new Date(b.nextGeneration).getTime())
                  .map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-muted-foreground">{report.description}</div>
                        <div className="flex items-center gap-2">
                          {getScheduleBadge(report.schedule)}
                          <Badge variant="outline">{report.format}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Next Generation</div>
                        <div className="text-sm text-muted-foreground">{report.nextGeneration}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
