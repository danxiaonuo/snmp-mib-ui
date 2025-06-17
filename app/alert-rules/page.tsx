"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/real-api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Plus, Search, Filter, Download, Upload, Settings, Play, Pause, Copy, Edit, Trash2, Eye, Code, Save, RefreshCw, Bell, Target, Users, Tag, Layers, GitBranch, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle, Activity, Zap, Shield, BarChart3, PieChart, LineChart, Rocket } from "lucide-react"
import { toast } from "sonner"

import { AlertRuleDeploymentFlow } from './components/AlertRuleDeploymentFlow'

export default function AlertRulesPage() {
  // 状态管理
  const [alertRules, setAlertRules] = useState([])
  const [templates, setTemplates] = useState([])
  const [deviceGroups, setDeviceGroups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // UI状态
  const [activeTab, setActiveTab] = useState("rules")
  const [selectedRules, setSelectedRules] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showRuleEditor, setShowRuleEditor] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)
  const [showDeploymentFlow, setShowDeploymentFlow] = useState(false)

  // 真实API数据获取函数
  const fetchAlertRules = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getAlertRules({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter
      })
      
      setAlertRules(response.rules || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error('Failed to fetch alert rules:', error)
      toast.error('Failed to load alert rules')
      setAlertRules([])
    } finally {
      setIsLoading(false)
    }
  }

  // 获取模板和设备组
  const fetchTemplatesAndGroups = async () => {
    try {
      // 这里可以添加获取模板和设备组的API调用
      // const templatesResponse = await apiClient.getAlertTemplates()
      // const groupsResponse = await apiClient.getDeviceGroups()
      // setTemplates(templatesResponse.templates || [])
      // setDeviceGroups(groupsResponse.groups || [])
    } catch (error) {
      console.error('Failed to fetch templates and groups:', error)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchAlertRules()
    fetchTemplatesAndGroups()
  }, [currentPage, searchTerm, statusFilter])

  // 创建告警规则
  const handleCreateRule = async (ruleData: any) => {
    try {
      await apiClient.createAlertRule(ruleData)
      toast.success('Alert rule created successfully')
      setShowRuleEditor(false)
      setEditingRule(null)
      fetchAlertRules()
    } catch (error) {
      console.error('Failed to create alert rule:', error)
      toast.error('Failed to create alert rule')
    }
  }

  // 更新告警规则
  const handleUpdateRule = async (ruleData: any) => {
    try {
      await apiClient.updateAlertRule(editingRule.id, ruleData)
      toast.success('Alert rule updated successfully')
      setShowRuleEditor(false)
      setEditingRule(null)
      fetchAlertRules()
    } catch (error) {
      console.error('Failed to update alert rule:', error)
      toast.error('Failed to update alert rule')
    }
  }

  // 删除告警规则
  const handleDeleteRule = async (id: string) => {
    try {
      await apiClient.deleteAlertRule(id)
      toast.success('Alert rule deleted successfully')
      fetchAlertRules()
    } catch (error) {
      console.error('Failed to delete alert rule:', error)
      toast.error('Failed to delete alert rule')
    }
  }

  // 编辑规则
  const handleEditRule = (rule: any) => {
    setEditingRule(rule)
    setShowRuleEditor(true)
  }

  // 过滤规则
  const filteredRules = alertRules.filter((rule: any) => {
    const matchesSearch = rule.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSeverity = severityFilter === 'all' || rule.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || rule.status === statusFilter
    
    return matchesSearch && matchesSeverity && matchesStatus
  })

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "firing":
        return <Badge variant="destructive">Firing</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // 获取严重性徽章
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "info":
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alert Rules</h1>
          <p className="text-muted-foreground">
            Manage monitoring alert rules and templates
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowDeploymentFlow(true)}>
            <Rocket className="mr-2 h-4 w-4" />
            Deploy Rules
          </Button>
          <Button onClick={() => setShowRuleEditor(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="groups">Device Groups</TabsTrigger>
        </TabsList>

        {/* 告警规则标签页 */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Alert Rules</CardTitle>
                  <CardDescription>
                    Total: {total} rules
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rules..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="firing">Firing</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={fetchAlertRules} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Device Group</TableHead>
                      <TableHead>Last Triggered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Loading alert rules...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredRules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No alert rules found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRules.map((rule: any) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <Checkbox />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{rule.name}</div>
                              <div className="text-sm text-muted-foreground">{rule.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getSeverityBadge(rule.severity)}</TableCell>
                          <TableCell>{getStatusBadge(rule.status)}</TableCell>
                          <TableCell>{rule.deviceGroup}</TableCell>
                          <TableCell>{rule.lastTriggered || 'Never'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteRule(rule.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 模板标签页 */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rule Templates</CardTitle>
              <CardDescription>
                Pre-configured alert rule templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Templates will be loaded from API</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 设备组标签页 */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Groups</CardTitle>
              <CardDescription>
                Manage device groups for alert rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Device groups will be loaded from API</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 规则编辑器对话框 */}
      <Dialog open={showRuleEditor} onOpenChange={setShowRuleEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure alert rule parameters and conditions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rule Name</Label>
                <Input 
                  defaultValue={editingRule?.name} 
                  placeholder="Enter rule name" 
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Severity</Label>
                <Select defaultValue={editingRule?.severity || "warning"}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Input 
                defaultValue={editingRule?.description} 
                placeholder="Enter rule description" 
                className="mt-1" 
              />
            </div>
            
            <div>
              <Label>PromQL Expression</Label>
              <Textarea
                defaultValue={editingRule?.promql}
                placeholder="Enter PromQL query expression..."
                rows={3}
                className="mt-1 font-mono"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Threshold</Label>
                <Input 
                  type="number" 
                  defaultValue={editingRule?.threshold} 
                  placeholder="80" 
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Duration</Label>
                <Input 
                  defaultValue={editingRule?.duration || "5m"} 
                  placeholder="5m" 
                  className="mt-1" 
                />
              </div>
            </div>
            
            <div>
              <Label>Tags</Label>
              <Input 
                placeholder="Enter tags, separated by commas" 
                className="mt-1" 
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowRuleEditor(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingRule) {
                handleUpdateRule({})
              } else {
                handleCreateRule({})
              }
            }}>
              <Save className="mr-2 h-4 w-4" />
              {editingRule ? "Update Rule" : "Create Rule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 部署流程对话框 */}
      {showDeploymentFlow && (
        <AlertRuleDeploymentFlow
          onClose={() => setShowDeploymentFlow(false)}
          selectedRules={selectedRules}
        />
      )}
    </div>
  )
}