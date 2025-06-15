"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Settings,
  Search,
  Edit,
  Trash2,
  Eye,
  Lock,
  Unlock,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"

interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: string
  status: "active" | "inactive" | "locked" | "pending"
  lastLogin: string
  createdAt: string
  permissions: string[]
  avatar?: string
  department: string
  phone: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const users: User[] = [
    {
      id: "1",
      username: "admin",
      email: "admin@company.com",
      fullName: "System Administrator",
      role: "Administrator",
      status: "active",
      lastLogin: "2024-01-27 15:30:00",
      createdAt: "2023-01-15 09:00:00",
      permissions: ["all"],
      department: "IT",
      phone: "+1-555-0101",
    },
    {
      id: "2",
      username: "john.doe",
      email: "john.doe@company.com",
      fullName: "John Doe",
      role: "Network Engineer",
      status: "active",
      lastLogin: "2024-01-27 14:45:00",
      createdAt: "2023-03-20 10:30:00",
      permissions: ["devices.read", "devices.write", "alerts.read", "topology.read"],
      department: "Network Operations",
      phone: "+1-555-0102",
    },
    {
      id: "3",
      username: "jane.smith",
      email: "jane.smith@company.com",
      fullName: "Jane Smith",
      role: "Security Analyst",
      status: "active",
      lastLogin: "2024-01-27 13:20:00",
      createdAt: "2023-05-10 14:15:00",
      permissions: ["alerts.read", "alerts.write", "security.read", "security.write"],
      department: "Security",
      phone: "+1-555-0103",
    },
    {
      id: "4",
      username: "mike.wilson",
      email: "mike.wilson@company.com",
      fullName: "Mike Wilson",
      role: "Operator",
      status: "inactive",
      lastLogin: "2024-01-25 16:00:00",
      createdAt: "2023-08-05 11:45:00",
      permissions: ["devices.read", "alerts.read"],
      department: "Operations",
      phone: "+1-555-0104",
    },
    {
      id: "5",
      username: "sarah.brown",
      email: "sarah.brown@company.com",
      fullName: "Sarah Brown",
      role: "Viewer",
      status: "locked",
      lastLogin: "2024-01-20 09:30:00",
      createdAt: "2023-11-12 08:20:00",
      permissions: ["devices.read", "topology.read"],
      department: "Management",
      phone: "+1-555-0105",
    },
    {
      id: "6",
      username: "new.user",
      email: "new.user@company.com",
      fullName: "New User",
      role: "Operator",
      status: "pending",
      lastLogin: "Never",
      createdAt: "2024-01-27 12:00:00",
      permissions: [],
      department: "Operations",
      phone: "+1-555-0106",
    },
  ]

  const roles: Role[] = [
    {
      id: "admin",
      name: "Administrator",
      description: "Full system access and management capabilities",
      permissions: ["all"],
      userCount: 1,
    },
    {
      id: "engineer",
      name: "Network Engineer",
      description: "Device management and configuration access",
      permissions: ["devices.read", "devices.write", "alerts.read", "alerts.write", "topology.read", "config.write"],
      userCount: 1,
    },
    {
      id: "analyst",
      name: "Security Analyst",
      description: "Security monitoring and alert management",
      permissions: ["alerts.read", "alerts.write", "security.read", "security.write", "reports.read"],
      userCount: 1,
    },
    {
      id: "operator",
      name: "Operator",
      description: "Basic monitoring and alert acknowledgment",
      permissions: ["devices.read", "alerts.read", "alerts.acknowledge"],
      userCount: 2,
    },
    {
      id: "viewer",
      name: "Viewer",
      description: "Read-only access to dashboards and reports",
      permissions: ["devices.read", "topology.read", "reports.read"],
      userCount: 1,
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "locked":
        return <Badge variant="destructive">Locked</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <Clock className="h-4 w-4 text-gray-500" />
      case "locked":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
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

  const userStats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    locked: users.filter((u) => u.status === "locked").length,
    pending: users.filter((u) => u.status === "pending").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Username
                  </Label>
                  <Input id="username" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input id="email" type="email" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fullName" className="text-right">
                    Full Name
                  </Label>
                  <Input id="fullName" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Create User</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.locked}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              <CardDescription>Manage user accounts and access</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {user.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.status)}
                          {getStatusBadge(user.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.lastLogin}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.status === "locked" ? (
                            <Button variant="ghost" size="sm">
                              <Unlock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm">
                              <Lock className="h-4 w-4" />
                            </Button>
                          )}
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

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Manage user roles and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5" />
                        <div>
                          <h4 className="font-medium">{role.name}</h4>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{role.userCount} users</Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Permissions:</span>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {role.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Currently logged in users and their sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Login Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter((user) => user.status === "active")
                    .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {user.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">192.168.1.{Math.floor(Math.random() * 254) + 1}</TableCell>
                        <TableCell>New York, US</TableCell>
                        <TableCell>Chrome on Windows</TableCell>
                        <TableCell>{user.lastLogin}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <XCircle className="h-4 w-4" />
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

      {/* User Detail Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {selectedUser.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {selectedUser.fullName}
              </DialogTitle>
              <DialogDescription>User account details and permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <p className="text-sm mt-1">{selectedUser.username}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm mt-1">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedUser.role}</Badge>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department</Label>
                  <p className="text-sm mt-1">{selectedUser.department}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm mt-1">{selectedUser.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Created</Label>
                  <p className="text-sm mt-1">{selectedUser.createdAt}</p>
                </div>
                <div>
                  <Label>Last Login</Label>
                  <p className="text-sm mt-1">{selectedUser.lastLogin}</p>
                </div>
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedUser.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Button>
              <Button variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
              {selectedUser.status === "locked" ? (
                <Button>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock
                </Button>
              ) : (
                <Button variant="destructive">
                  <Lock className="h-4 w-4 mr-2" />
                  Lock Account
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
