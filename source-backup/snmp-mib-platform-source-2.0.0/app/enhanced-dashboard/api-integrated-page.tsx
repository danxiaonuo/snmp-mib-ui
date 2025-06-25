"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  EnhancedButton, 
  SmartSearch, 
  StatusCard, 
  LoadingState, 
  LiveProgress,
  QuickToolbar 
} from "@/components/ui/enhanced-interactions"
import {
  FileText,
  Settings,
  Server,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Database,
  Zap,
  GitBranch,
  Activity,
  Monitor,
  Bell,
  Plus,
  RefreshCw,
  Filter,
  Search
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

// 使用真实API客户端
import { apiClient } from "@/lib/real-api-client"

export default function APIIntegratedDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // 真实数据状态
  const [deviceCount, setDeviceCount] = useState(0)
  const [alertRuleCount, setAlertRuleCount] = useState(0)
  const [mibCount, setMibCount] = useState(0)
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [devices, setDevices] = useState<any[]>([])

  // 状态数据
  const [stats, setStats] = useState([
    {
      title: "在线设备",
      value: "0",
      change: "加载中...",
      status: "offline" as const,
      onClick: () => window.location.href = "/devices"
    },
    {
      title: "告警规则",
      value: "0",
      change: "加载中...",
      status: "offline" as const,
      onClick: () => window.location.href = "/alert-rules"
    },
    {
      title: "MIB 文件",
      value: "0",
      change: "加载中...",
      status: "offline" as const,
      onClick: () => window.location.href = "/mibs"
    },
    {
      title: "系统状态",
      value: "检查中",
      change: "加载中...",
      status: "warning" as const,
      onClick: () => window.location.href = "/system-health"
    }
  ])

  // 加载真实数据
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 并行加载多个API
      const [devicesResult, mibs, healthResult] = await Promise.allSettled([
        apiClient.getDevices({ limit: 1000 }),
        apiClient.getMIBs({ limit: 1000 }),
        apiClient.getHealthStatus()
      ])

      // 处理设备数据
      if (devicesResult.status === 'fulfilled') {
        const deviceData = devicesResult.value
        setDevices(deviceData.devices || [])
        setDeviceCount(deviceData.total || deviceData.devices?.length || 0)
      }

      // 处理MIB数据
      if (mibs.status === 'fulfilled') {
        const mibData = mibs.value
        setMibCount(mibData.total || mibData.mibs?.length || 0)
      }

      // 处理系统健康数据
      if (healthResult.status === 'fulfilled') {
        setSystemHealth(healthResult.value)
      }

      // 更新统计数据
      updateStats()

    } catch (error) {
      console.error('加载仪表板数据失败:', error)
      setError('加载数据失败，请检查网络连接')
      toast({
        title: "数据加载失败",
        description: "无法从服务器加载数据，请检查网络连接",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 更新统计数据
  const updateStats = () => {
    setStats([
      {
        title: "在线设备",
        value: deviceCount.toString(),
        change: `共 ${deviceCount} 台设备`,
        status: deviceCount > 0 ? "online" as const : "offline" as const,
        onClick: () => window.location.href = "/devices"
      },
      {
        title: "告警规则",
        value: alertRuleCount.toString(),
        change: `${alertRuleCount} 条规则`,
        status: alertRuleCount > 0 ? "online" as const : "warning" as const,
        onClick: () => window.location.href = "/alert-rules"
      },
      {
        title: "MIB 文件",
        value: mibCount.toString(),
        change: `${mibCount} 个文件`,
        status: mibCount > 0 ? "online" as const : "warning" as const,
        onClick: () => window.location.href = "/mibs"
      },
      {
        title: "系统状态",
        value: systemHealth?.status === 'healthy' ? "健康" : "检查中",
        change: systemHealth?.status === 'healthy' ? "正常运行" : "检查中...",
        status: systemHealth?.status === 'healthy' ? "online" as const : "warning" as const,
        onClick: () => window.location.href = "/system-health"
      }
    ])
  }

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadDashboardData()
      toast({
        title: "数据刷新成功",
        description: "仪表板数据已更新",
      })
    } catch (error) {
      toast({
        title: "刷新失败",
        description: "数据刷新失败，请重试",
        variant: "destructive"
      })
    } finally {
      setRefreshing(false)
    }
  }

  // 添加设备（调用真实API）
  const handleAddDevice = async () => {
    try {
      // 这里可以打开设备添加对话框或跳转到设备页面
      window.location.href = "/devices"
    } catch (error) {
      toast({
        title: "操作失败",
        description: "无法打开设备管理页面",
        variant: "destructive"
      })
    }
  }

  // 生成配置（调用真实API）
  const handleGenerateConfig = async () => {
    try {
      window.location.href = "/config-gen"
    } catch (error) {
      toast({
        title: "操作失败",
        description: "无法打开配置生成页面",
        variant: "destructive"
      })
    }
  }

  // 上传MIB（调用真实API）
  const handleUploadMIB = async () => {
    try {
      window.location.href = "/mibs"
    } catch (error) {
      toast({
        title: "操作失败",
        description: "无法打开MIB管理页面",
        variant: "destructive"
      })
    }
  }

  // 初始化数据加载
  useEffect(() => {
    loadDashboardData()
  }, [])

  // 更新统计数据当数据变化时
  useEffect(() => {
    updateStats()
  }, [deviceCount, alertRuleCount, mibCount, systemHealth])

  const quickActions = [
    {
      label: "添加设备",
      icon: Plus,
      onClick: handleAddDevice,
      variant: "default" as const
    },
    {
      label: "生成配置",
      icon: Settings,
      onClick: handleGenerateConfig,
      variant: "secondary" as const
    },
    {
      label: "上传MIB",
      icon: Upload,
      onClick: handleUploadMIB,
      variant: "outline" as const
    },
    {
      label: "刷新数据",
      icon: RefreshCw,
      onClick: handleRefresh,
      disabled: refreshing,
      variant: "ghost" as const
    }
  ]

  const searchSuggestions = [
    "设备管理",
    "配置生成",
    "MIB文件",
    "告警规则",
    "系统监控",
    "网络设备"
  ]

  return (
    <LoadingState loading={loading} error={error} loadingText="加载仪表板数据...">
      <div className="space-y-6">
        {/* 页面标题和快速操作 */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              SNMP 监控控制台
            </h1>
            <p className="text-muted-foreground">
              管理您的网络设备监控和配置
            </p>
          </div>
          
          {/* 智能搜索 */}
          <div className="w-full md:w-96">
            <SmartSearch
              placeholder="搜索功能模块..."
              onSearch={setSearchQuery}
              suggestions={searchSuggestions}
              onFilter={() => console.log("打开高级过滤器")}
            />
          </div>
        </div>

        {/* 快速操作工具栏 */}
        <QuickToolbar actions={quickActions} />

        {/* 状态卡片 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatusCard
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              status={stat.status}
              onClick={stat.onClick}
            />
          ))}
        </div>

        {/* 系统概览 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 实时监控 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                系统状态
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>API服务</span>
                  <Badge variant={systemHealth?.services?.backend === 'running' ? 'default' : 'destructive'}>
                    {systemHealth?.services?.backend === 'running' ? '正常' : '检查中'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>数据库</span>
                  <Badge variant={systemHealth?.services?.database === 'connected' ? 'default' : 'destructive'}>
                    {systemHealth?.services?.database === 'connected' ? '已连接' : '检查中'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>缓存服务</span>
                  <Badge variant={systemHealth?.services?.redis === 'connected' ? 'default' : 'destructive'}>
                    {systemHealth?.services?.redis === 'connected' ? '已连接' : '检查中'}
                  </Badge>
                </div>
              </div>
              <EnhancedButton
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "/system-health"}
              >
                <Monitor className="mr-2 h-4 w-4" />
                查看详细状态
              </EnhancedButton>
            </CardContent>
          </Card>

          {/* 设备概览 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  设备概览
                </span>
                <Badge variant="secondary">{deviceCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {devices.length > 0 ? (
                  devices.slice(0, 3).map((device, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm font-medium">{device.name || `设备-${index + 1}`}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{device.ip}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Server className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">暂无设备</p>
                  </div>
                )}
              </div>
              <EnhancedButton
                variant="ghost"
                className="w-full mt-4"
                onClick={() => window.location.href = "/devices"}
              >
                管理所有设备
              </EnhancedButton>
            </CardContent>
          </Card>

          {/* 快速访问 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                快速访问
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/devices">
                <Button variant="outline" className="w-full justify-start">
                  <Server className="mr-2 h-4 w-4" />
                  设备管理
                </Button>
              </Link>
              <Link href="/config-gen">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  配置生成
                </Button>
              </Link>
              <Link href="/mibs">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  MIB 管理
                </Button>
              </Link>
              <Link href="/alert-rules">
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="mr-2 h-4 w-4" />
                  告警规则
                </Button>
              </Link>
              <Link href="/monitoring-installer">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  组件安装
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </LoadingState>
  )
}