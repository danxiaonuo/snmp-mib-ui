"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Users,
  Shield,
  Key,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
} from "lucide-react"

export default function AccessControlPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const accessStats = [
    {
      title: "Total Users",
      value: "247",
      change: "+12",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Sessions",
      value: "89",
      change: "+5",
      icon: Shield,
      color: "text-green-600",
    },
    {
      title: "Failed Logins (24h)",
      value: "23",
      change: "-8",
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "Privileged Accounts",
      value: "15",
      change: "0",
      icon: Key,
      color: "text-orange-600",
    },
  ]

  const users = [
    {
      id: 1,
      username: "admin",
      email: "admin@company.com",
      fullName: "System Administrator",
      role: "Administrator",
      status: "Active",
      lastLogin: "2024-01-15 14:30",
      mfaEnabled: true,
      permissions: ["Full Access", "User Management", "System Configuration"],
    },
    {
      id: 2,
      username: "jdoe",
      email: "john.doe@company.com",
      fullName: "John Doe",
      role: "Network Engineer",
      status: "Active",
      lastLogin: "2024-01-15 09:15",
      mfaEnabled: true,
      permissions: ["Device Management", "Monitoring", "Reports"],
    },
    {
      id: 3,
      username: "msmith",
      email: "mary.smith@company.com",
      fullName: "Mary Smith",
      role: "Security Analyst",
      status: "Active",
      lastLogin: "2024-01-14 16:45",
      mfaEnabled: false,
      permissions: ["Security Dashboard", "Vulnerability Management", "Compliance"],
    },
    {
      id: 4,
      username: "bwilson",
      email: "bob.wilson@company.com",
      fullName: "Bob Wilson",
      role: "Operator",
      status: "Inactive",
      lastLogin: "2024-01-10 11:20",
      mfaEnabled: true,
      permissions: ["Read Only", "Basic Monitoring"],
    },
    {
      id: 5,
      username: "sjohnson",
      email: "sarah.johnson@company.com",
      fullName: "Sarah Johnson",
      role: "Manager",
      status: "Active",
      lastLogin: "2024-01-15 13:00",
      mfaEnabled: true,
      permissions: ["Team Management", "Reports", "Analytics"],
    },
  ]

  const roles = [
    {
      name: "Administrator",
      description: "Full system access and user management",
      userCount: 3,
      permissions: ["Full Access", "User Management", "System Configuration", "Security Settings", "Audit Logs"],
    },
    {
      name: "Network Engineer",
      description: "Network device management and monitoring",
      userCount: 45,
      permissions: [
        "Device Management",
        "Network Monitoring",
        "Configuration Management",
        "Troubleshooting",
        "Reports",
      ],
    },
    {
      name: "Security Analyst",
      description: "Security monitoring and vulnerability management",
      userCount: 12,
      permissions: [
        "Security Dashboard",
        "Vulnerability Management",
        "Compliance Monitoring",
        "Incident Response",
        "Security Reports",
      ],
    },
    {
      name: "Manager",
      description: "Team management and reporting access",
      userCount: 8,
      permissions: ["Team Management", "Reports", "Analytics", "Dashboard Access", "User Oversight"],
    },
    {
      name: "Operator",
      description: "Basic monitoring and read-only access",
      userCount: 179,
      permissions: ["Read Only Access", "Basic Monitoring", "View Reports", "Dashboard Access"],
    },
  ]

  const accessLogs = [
    {
      id: 1,
      user: "admin",
      action: "Login",
      resource: "System",
      timestamp: "2024-01-15 14:30:15",
      ipAddress: "192.168.1.100",
      status: "Success",
      details: "Successful login with MFA",
    },
    {
      id: 2,
      user: "jdoe",
      action: "Device Access",
      resource: "Router-001",
      timestamp: "2024-01-15 14:25:30",
      ipAddress: "192.168.1.105",
      status: "Success",
      details: "Configuration change applied",
    },
    {
      id: 3,
      user: "unknown",
      action: "Login Attempt",
      resource: "System",
      timestamp: "2024-01-15 14:20:45",
      ipAddress: "203.0.113.50",
      status: "Failed",
      details: "Invalid credentials",
    },
    {
      id: 4,
      user: "msmith",
      action: "Report Access",
      resource: "Security Dashboard",
      timestamp: "2024-01-15 14:15:20",
      ipAddress: "192.168.1.110",
      status: "Success",
      details: "Vulnerability report generated",
    },
    {
      id: 5,
      user: "bwilson",
      action: "Login Attempt",
      resource: "System",
      timestamp: "2024-01-15 14:10:10",
      ipAddress: "192.168.1.115",
      status: "Failed",
      details: "Account disabled",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "default"
      case "Inactive":
        return "secondary"
      case "Locked":
        return "destructive"
      case "Success":
        return "default"
      case "Failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Administrator":
        return "destructive"
      case "Manager":
        return "default"
      case "Network Engineer":
        return "secondary"
      case "Security Analyst":
        return "outline"
      case "Operator":
        return "outline"
      default:
        return "outline"
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Access Control</h1>
          <p className="text-muted-foreground">Manage user access, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Access Control Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accessStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}>{stat.change}</span>{" "}
                from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and access permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Network Engineer">Network Engineer</SelectItem>
                    <SelectItem value="Security Analyst">Security Analyst</SelectItem>
                    <SelectItem value="Operator">Operator</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>MFA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="text-xs text-muted-foreground">@{user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleColor(user.role)}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(user.status)}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{user.lastLogin}</TableCell>
                      <TableCell>
                        {user.mfaEnabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{user.fullName}</DialogTitle>
                                <DialogDescription>User details and permissions</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Username</Label>
                                    <p className="text-sm">{user.username}</p>
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <p className="text-sm">{user.email}</p>
                                  </div>
                                  <div>
                                    <Label>Role</Label>
                                    <Badge variant={getRoleColor(user.role)}>{user.role}</Badge>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <Badge variant={getStatusColor(user.status)}>{user.status}</Badge>
                                  </div>
                                </div>
                                <div>
                                  <Label>Permissions</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {user.permissions.map((permission, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {permission}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch checked={user.mfaEnabled} />
                                  <Label>Multi-Factor Authentication</Label>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm">Edit User</Button>
                                  <Button variant="outline" size="sm">
                                    Reset Password
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    {user.status === "Active" ? "Disable" : "Enable"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
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

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Manage user roles and their associated permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {roles.map((role, index) => (
                  <Card key={index} className="border">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                          <CardDescription>{role.description}</CardDescription>
                        </div>
                        <Badge variant="secondary">{role.userCount} users</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Permissions</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {role.permissions.map((permission, permIndex) => (
                            <Badge key={permIndex} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Role
                        </Button>
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4 mr-2" />
                          View Users
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Access Logs</CardTitle>
              <CardDescription>Monitor user access and system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search access logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="text-sm">{log.timestamp}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(log.status)}>{log.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={log.details}>
                          {log.details}
                        </div>
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
