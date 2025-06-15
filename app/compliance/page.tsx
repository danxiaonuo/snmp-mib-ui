"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Shield, XCircle, FileText, Download, Search, Calendar, Eye, Settings } from "lucide-react"

export default function CompliancePage() {
  const [searchTerm, setSearchTerm] = useState("")

  const complianceOverview = [
    {
      title: "Overall Compliance",
      value: "87%",
      change: "+3%",
      icon: Shield,
      color: "text-green-600",
    },
    {
      title: "Active Frameworks",
      value: "6",
      change: "+1",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Failed Controls",
      value: "12",
      change: "-5",
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "Upcoming Audits",
      value: "3",
      change: "0",
      icon: Calendar,
      color: "text-orange-600",
    },
  ]

  const complianceFrameworks = [
    {
      name: "ISO 27001",
      description: "Information Security Management",
      compliance: 92,
      totalControls: 114,
      passedControls: 105,
      failedControls: 9,
      status: "Active",
      lastAudit: "2024-01-10",
      nextAudit: "2024-07-10",
    },
    {
      name: "NIST Cybersecurity Framework",
      description: "Cybersecurity Risk Management",
      compliance: 88,
      totalControls: 98,
      passedControls: 86,
      failedControls: 12,
      status: "Active",
      lastAudit: "2024-01-05",
      nextAudit: "2024-07-05",
    },
    {
      name: "SOC 2 Type II",
      description: "Service Organization Controls",
      compliance: 95,
      totalControls: 67,
      passedControls: 64,
      failedControls: 3,
      status: "Active",
      lastAudit: "2023-12-15",
      nextAudit: "2024-06-15",
    },
    {
      name: "GDPR",
      description: "General Data Protection Regulation",
      compliance: 78,
      totalControls: 45,
      passedControls: 35,
      failedControls: 10,
      status: "Needs Attention",
      lastAudit: "2023-11-20",
      nextAudit: "2024-05-20",
    },
    {
      name: "HIPAA",
      description: "Health Insurance Portability",
      compliance: 85,
      totalControls: 52,
      passedControls: 44,
      failedControls: 8,
      status: "Active",
      lastAudit: "2024-01-08",
      nextAudit: "2024-07-08",
    },
    {
      name: "PCI DSS",
      description: "Payment Card Industry Data Security",
      compliance: 91,
      totalControls: 78,
      passedControls: 71,
      failedControls: 7,
      status: "Active",
      lastAudit: "2023-12-20",
      nextAudit: "2024-06-20",
    },
  ]

  const failedControls = [
    {
      framework: "ISO 27001",
      control: "A.9.2.1",
      title: "User registration and de-registration",
      description: "Formal user registration and de-registration process not fully implemented",
      severity: "Medium",
      dueDate: "2024-02-15",
      assignee: "IT Security Team",
    },
    {
      framework: "NIST CSF",
      control: "PR.AC-1",
      title: "Identity and Access Management",
      description: "Multi-factor authentication not enforced for all privileged accounts",
      severity: "High",
      dueDate: "2024-02-01",
      assignee: "System Administrator",
    },
    {
      framework: "GDPR",
      control: "Art. 32",
      title: "Security of processing",
      description: "Data encryption at rest not implemented for all sensitive data",
      severity: "High",
      dueDate: "2024-01-30",
      assignee: "Data Protection Officer",
    },
    {
      framework: "SOC 2",
      control: "CC6.1",
      title: "Logical and Physical Access Controls",
      description: "Access review process not performed quarterly as required",
      severity: "Medium",
      dueDate: "2024-02-10",
      assignee: "Compliance Team",
    },
  ]

  const upcomingAudits = [
    {
      framework: "ISO 27001",
      type: "Internal Audit",
      date: "2024-02-15",
      auditor: "Internal Audit Team",
      scope: "Information Security Controls",
      status: "Scheduled",
    },
    {
      framework: "SOC 2",
      type: "External Audit",
      date: "2024-03-01",
      auditor: "Ernst & Young",
      scope: "Security and Availability",
      status: "Preparing",
    },
    {
      framework: "PCI DSS",
      type: "Compliance Assessment",
      date: "2024-03-15",
      auditor: "QSA Firm",
      scope: "Payment Processing Environment",
      status: "Scheduled",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "default"
      case "Needs Attention":
        return "destructive"
      case "Scheduled":
        return "secondary"
      case "Preparing":
        return "default"
      default:
        return "outline"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "destructive"
      case "Medium":
        return "default"
      case "Low":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance Management</h1>
          <p className="text-muted-foreground">Monitor compliance with security frameworks and regulations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure Frameworks
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {complianceOverview.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={metric.change.startsWith("+") ? "text-green-600" : "text-red-600"}>
                  {metric.change}
                </span>{" "}
                from last quarter
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="frameworks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="frameworks">Compliance Frameworks</TabsTrigger>
          <TabsTrigger value="controls">Failed Controls</TabsTrigger>
          <TabsTrigger value="audits">Upcoming Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="frameworks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Frameworks</CardTitle>
              <CardDescription>Overview of all active compliance frameworks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {complianceFrameworks.map((framework, index) => (
                  <Card key={index} className="border">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{framework.name}</CardTitle>
                          <CardDescription>{framework.description}</CardDescription>
                        </div>
                        <Badge variant={getStatusColor(framework.status)}>{framework.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Compliance Rate</span>
                          <span className="font-medium">{framework.compliance}%</span>
                        </div>
                        <Progress value={framework.compliance} />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Controls</p>
                          <p className="font-medium">{framework.totalControls}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Passed</p>
                          <p className="font-medium text-green-600">{framework.passedControls}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Failed</p>
                          <p className="font-medium text-red-600">{framework.failedControls}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Last Audit</p>
                          <p className="font-medium">{framework.lastAudit}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Next Audit</p>
                          <p className="font-medium">{framework.nextAudit}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Controls</CardTitle>
              <CardDescription>Controls that require immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search failed controls..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Framework</TableHead>
                    <TableHead>Control</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedControls.map((control, index) => (
                    <TableRow key={index}>
                      <TableCell>{control.framework}</TableCell>
                      <TableCell className="font-mono">{control.control}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={control.title}>
                          {control.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(control.severity)}>{control.severity}</Badge>
                      </TableCell>
                      <TableCell>{control.dueDate}</TableCell>
                      <TableCell>{control.assignee}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{control.title}</DialogTitle>
                              <DialogDescription>
                                {control.framework} - {control.control}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Description</p>
                                <p className="text-sm">{control.description}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Severity</p>
                                  <Badge variant={getSeverityColor(control.severity)}>{control.severity}</Badge>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Due Date</p>
                                  <p className="text-sm font-medium">{control.dueDate}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm">Create Remediation Plan</Button>
                                <Button variant="outline" size="sm">
                                  Assign to Team
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Audits</CardTitle>
              <CardDescription>Scheduled compliance audits and assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Framework</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Auditor</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAudits.map((audit, index) => (
                    <TableRow key={index}>
                      <TableCell>{audit.framework}</TableCell>
                      <TableCell>{audit.type}</TableCell>
                      <TableCell>{audit.date}</TableCell>
                      <TableCell>{audit.auditor}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={audit.scope}>
                          {audit.scope}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(audit.status)}>{audit.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Prepare
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
