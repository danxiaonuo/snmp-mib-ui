"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Shield, Search, Download, Eye, CheckCircle, XCircle, TrendingUp } from "lucide-react"

export default function VulnerabilitiesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const vulnerabilityStats = [
    {
      title: "Total Vulnerabilities",
      value: "47",
      change: "-12",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      title: "Critical",
      value: "3",
      change: "-1",
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "High",
      value: "8",
      change: "-3",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      title: "Resolved This Month",
      value: "23",
      change: "+15",
      icon: CheckCircle,
      color: "text-green-600",
    },
  ]

  const vulnerabilities = [
    {
      id: "CVE-2024-0001",
      title: "SQL Injection in Web Interface",
      severity: "Critical",
      cvssScore: 9.8,
      affectedDevices: 5,
      status: "Open",
      discovered: "2024-01-15",
      description: "SQL injection vulnerability in the web management interface allows unauthorized data access.",
    },
    {
      id: "CVE-2024-0002",
      title: "Buffer Overflow in SNMP Service",
      severity: "High",
      cvssScore: 8.1,
      affectedDevices: 12,
      status: "In Progress",
      discovered: "2024-01-12",
      description: "Buffer overflow vulnerability in SNMP service could lead to remote code execution.",
    },
    {
      id: "CVE-2024-0003",
      title: "Weak Default Credentials",
      severity: "High",
      cvssScore: 7.5,
      affectedDevices: 8,
      status: "Open",
      discovered: "2024-01-10",
      description: "Default credentials are easily guessable and not enforced to be changed.",
    },
    {
      id: "CVE-2024-0004",
      title: "Cross-Site Scripting (XSS)",
      severity: "Medium",
      cvssScore: 6.1,
      affectedDevices: 3,
      status: "Resolved",
      discovered: "2024-01-08",
      description: "Stored XSS vulnerability in device configuration interface.",
    },
    {
      id: "CVE-2024-0005",
      title: "Information Disclosure",
      severity: "Low",
      cvssScore: 3.7,
      affectedDevices: 15,
      status: "Open",
      discovered: "2024-01-05",
      description: "Sensitive information exposed in error messages and debug logs.",
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "destructive"
      case "High":
        return "default"
      case "Medium":
        return "secondary"
      case "Low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "destructive"
      case "In Progress":
        return "default"
      case "Resolved":
        return "secondary"
      default:
        return "outline"
    }
  }

  const filteredVulnerabilities = vulnerabilities.filter((vuln) => {
    const matchesSearch =
      vuln.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vuln.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === "all" || vuln.severity === severityFilter
    const matchesStatus = statusFilter === "all" || vuln.status === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vulnerability Management</h1>
          <p className="text-muted-foreground">Track and manage security vulnerabilities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Start Scan
          </Button>
        </div>
      </div>

      {/* Vulnerability Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {vulnerabilityStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}>{stat.change}</span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vulnerability Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Vulnerability Trend</CardTitle>
          <CardDescription>Vulnerability discovery and resolution over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Vulnerability trend chart would be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vulnerabilities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vulnerability List</CardTitle>
          <CardDescription>Detailed list of all identified vulnerabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vulnerabilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CVE ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>CVSS Score</TableHead>
                <TableHead>Affected Devices</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Discovered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVulnerabilities.map((vuln) => (
                <TableRow key={vuln.id}>
                  <TableCell className="font-mono text-sm">{vuln.id}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={vuln.title}>
                      {vuln.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(vuln.severity)}>{vuln.severity}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{vuln.cvssScore}</span>
                      <Progress value={vuln.cvssScore * 10} className="w-16" />
                    </div>
                  </TableCell>
                  <TableCell>{vuln.affectedDevices}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(vuln.status)}>{vuln.status}</Badge>
                  </TableCell>
                  <TableCell>{vuln.discovered}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{vuln.title}</DialogTitle>
                          <DialogDescription>{vuln.id}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Severity</Label>
                              <Badge variant={getSeverityColor(vuln.severity)} className="ml-2">
                                {vuln.severity}
                              </Badge>
                            </div>
                            <div>
                              <Label>CVSS Score</Label>
                              <p className="font-medium">{vuln.cvssScore}</p>
                            </div>
                            <div>
                              <Label>Affected Devices</Label>
                              <p className="font-medium">{vuln.affectedDevices}</p>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Badge variant={getStatusColor(vuln.status)} className="ml-2">
                                {vuln.status}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <p className="text-sm text-muted-foreground mt-1">{vuln.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm">Assign</Button>
                            <Button variant="outline" size="sm">
                              Mark as False Positive
                            </Button>
                            <Button variant="outline" size="sm">
                              Request CVE Details
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
    </div>
  )
}
