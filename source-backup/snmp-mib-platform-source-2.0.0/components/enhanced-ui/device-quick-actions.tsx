"use client"

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EnhancedButton, SmartSearch, StatusCard, LoadingState } from "@/components/ui/enhanced-interactions"
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
  Server,
  Network,
  Monitor,
  Trash2,
  Edit
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/real-api-client"

interface Device {
  id: string
  name: string
  ip: string
  vendor: string
  model: string
  status: 'online' | 'offline' | 'warning'
  lastSeen: string
  snmpVersion: string
  community: string
}

interface DeviceQuickActionsProps {
  devices: Device[]
  onDevicesChange: (devices: Device[]) => void
}

export function DeviceQuickActions({ devices, onDevicesChange }: DeviceQuickActionsProps) {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newDevice, setNewDevice] = useState({
    name: '',
    ip: '',
    vendor: '',
    model: '',
    snmpVersion: 'v2c',
    community: 'public'
  })

  // 过滤设备
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.ip.includes(searchQuery) ||
                         device.vendor.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || device.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // 快速添加设备
  const handleAddDevice = useCallback(async () => {
    setLoading(true)
    try {
      // 调用真实API
      const apiDevice = await apiClient.createDevice({
        name: newDevice.name,
        ip: newDevice.ip,
        vendor: newDevice.vendor,
        model: newDevice.model,
        snmpVersion: newDevice.snmpVersion,
        community: newDevice.community
      })
      
      const device: Device = {
        id: apiDevice.id || `device-${Date.now()}`,
        name: apiDevice.name || newDevice.name,
        ip: apiDevice.ip || newDevice.ip,
        vendor: apiDevice.vendor || newDevice.vendor,
        model: apiDevice.model || newDevice.model,
        status: 'online',
        lastSeen: '刚刚',
        snmpVersion: apiDevice.snmpVersion || newDevice.snmpVersion,
        community: apiDevice.community || newDevice.community
      }
      
      onDevicesChange([...devices, device])
      setNewDevice({
        name: '',
        ip: '',
        vendor: '',
        model: '',
        snmpVersion: 'v2c',
        community: 'public'
      })
      setShowAddDialog(false)
      
      toast({
        title: "设备添加成功",
        description: `设备 ${device.name} 已成功添加到监控列表`,
      })
    } catch (error) {
      toast({
        title: "添加失败",
        description: "设备添加失败，请检查网络连接和设备信息",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [newDevice, devices, onDevicesChange])

  // 批量发现设备
  const handleDiscoverDevices = useCallback(async () => {
    setLoading(true)
    try {
      // 模拟设备发现
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const discoveredDevices: Device[] = [
        {
          id: `discovered-${Date.now()}-1`,
          name: '自动发现-交换机-01',
          ip: '192.168.1.10',
          vendor: 'Cisco',
          model: 'C2960X',
          status: 'online',
          lastSeen: '刚刚',
          snmpVersion: 'v2c',
          community: 'public'
        },
        {
          id: `discovered-${Date.now()}-2`,
          name: '自动发现-路由器-01',
          ip: '192.168.1.1',
          vendor: 'Huawei',
          model: 'AR2200',
          status: 'online',
          lastSeen: '刚刚',
          snmpVersion: 'v2c',
          community: 'public'
        }
      ]
      
      onDevicesChange([...devices, ...discoveredDevices])
      
      toast({
        title: "设备发现完成",
        description: `发现了 ${discoveredDevices.length} 台新设备`,
      })
    } catch (error) {
      toast({
        title: "发现失败",
        description: "设备发现失败，请检查网络配置",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [devices, onDevicesChange])

  // 删除设备
  const handleDeleteDevice = useCallback(async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId)
    if (!device) return

    try {
      onDevicesChange(devices.filter(d => d.id !== deviceId))
      toast({
        title: "设备删除成功",
        description: `设备 ${device.name} 已从监控列表中移除`,
      })
    } catch (error) {
      toast({
        title: "删除失败",
        description: "设备删除失败，请重试",
        variant: "destructive"
      })
    }
  }, [devices, onDevicesChange])

  // 测试设备连接
  const handleTestDevice = useCallback(async (device: Device) => {
    setLoading(true)
    try {
      // 模拟连接测试
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 随机成功/失败
      const success = Math.random() > 0.3
      
      if (success) {
        toast({
          title: "连接测试成功",
          description: `设备 ${device.name} (${device.ip}) 连接正常`,
        })
      } else {
        toast({
          title: "连接测试失败",
          description: `设备 ${device.name} (${device.ip}) 无法连接`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "测试失败",
        description: "连接测试失败，请检查网络配置",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const searchSuggestions = [
    "Cisco设备",
    "华为路由器",
    "H3C交换机",
    "192.168.1.",
    "在线设备",
    "离线设备"
  ]

  return (
    <div className="space-y-6">
      {/* 搜索和过滤器 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <SmartSearch
            placeholder="搜索设备名称、IP 或厂商..."
            onSearch={setSearchQuery}
            suggestions={searchSuggestions}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="online">在线</SelectItem>
              <SelectItem value="offline">离线</SelectItem>
              <SelectItem value="warning">警告</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <EnhancedButton>
                <Plus className="mr-2 h-4 w-4" />
                添加设备
              </EnhancedButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>添加新设备</DialogTitle>
                <DialogDescription>
                  手动添加网络设备到监控列表
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">设备名称</Label>
                    <Input
                      id="name"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="例: 交换机-01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ip">IP 地址</Label>
                    <Input
                      id="ip"
                      value={newDevice.ip}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, ip: e.target.value }))}
                      placeholder="192.168.1.1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor">厂商</Label>
                    <Select value={newDevice.vendor} onValueChange={(value) => setNewDevice(prev => ({ ...prev, vendor: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择厂商" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cisco">Cisco</SelectItem>
                        <SelectItem value="Huawei">华为</SelectItem>
                        <SelectItem value="H3C">H3C</SelectItem>
                        <SelectItem value="Juniper">Juniper</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="model">型号</Label>
                    <Input
                      id="model"
                      value={newDevice.model}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="例: C2960X"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="snmpVersion">SNMP 版本</Label>
                    <Select value={newDevice.snmpVersion} onValueChange={(value) => setNewDevice(prev => ({ ...prev, snmpVersion: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v1">v1</SelectItem>
                        <SelectItem value="v2c">v2c</SelectItem>
                        <SelectItem value="v3">v3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="community">Community</Label>
                    <Input
                      id="community"
                      value={newDevice.community}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, community: e.target.value }))}
                      placeholder="public"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  取消
                </Button>
                <EnhancedButton
                  loading={loading}
                  onClick={handleAddDevice}
                  disabled={!newDevice.name || !newDevice.ip}
                >
                  添加设备
                </EnhancedButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <EnhancedButton
            variant="outline"
            onClick={handleDiscoverDevices}
            loading={loading}
          >
            <Search className="mr-2 h-4 w-4" />
            自动发现
          </EnhancedButton>
        </div>
      </div>

      {/* 设备列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDevices.map((device) => (
          <Card key={device.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{device.name}</CardTitle>
                <Badge variant={
                  device.status === 'online' ? 'default' :
                  device.status === 'warning' ? 'secondary' : 'destructive'
                }>
                  {device.status === 'online' ? '在线' :
                   device.status === 'warning' ? '警告' : '离线'}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                {device.ip}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">厂商:</span>
                  <span>{device.vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">型号:</span>
                  <span>{device.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最后在线:</span>
                  <span>{device.lastSeen}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleTestDevice(device)}
                >
                  <Zap className="mr-1 h-3 w-3" />
                  测试
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log("编辑设备", device.id)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteDevice(device.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 空状态 */}
      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <Server className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">没有找到设备</h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery || filterStatus !== 'all' ? '请尝试其他搜索条件' : '开始添加您的第一台设备'}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <div className="mt-6 flex gap-2 justify-center">
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                添加设备
              </Button>
              <Button variant="outline" onClick={handleDiscoverDevices}>
                <Search className="mr-2 h-4 w-4" />
                自动发现
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}