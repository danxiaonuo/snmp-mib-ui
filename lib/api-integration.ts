// API集成层 - 替换所有模拟数据
import { apiClient } from './real-api-client'
import { Device, MIB, AlertRule, MonitoringComponent, DashboardStats } from '@/types'

// 设备管理钩子
export const useDevices = () => {
  const getDevices = async (params?: {
    page?: number
    limit?: number
    search?: string
    type?: string
    status?: string
  }) => {
    try {
      return await apiClient.getDevices(params)
    } catch (error) {
      console.error('获取设备列表失败:', error)
      throw error
    }
  }

  const createDevice = async (device: Omit<Device, 'id'>) => {
    try {
      return await apiClient.createDevice(device)
    } catch (error) {
      console.error('创建设备失败:', error)
      throw error
    }
  }

  const updateDevice = async (id: string, device: Partial<Device>) => {
    try {
      return await apiClient.updateDevice(id, device)
    } catch (error) {
      console.error('更新设备失败:', error)
      throw error
    }
  }

  const deleteDevice = async (id: string) => {
    try {
      await apiClient.deleteDevice(id)
    } catch (error) {
      console.error('删除设备失败:', error)
      throw error
    }
  }

  return {
    getDevices,
    createDevice,
    updateDevice,
    deleteDevice,
  }
}

// MIB管理钩子
export const useMIBs = () => {
  const getMIBs = async (params?: {
    page?: number
    limit?: number
    search?: string
  }) => {
    try {
      return await apiClient.getMIBs(params)
    } catch (error) {
      console.error('获取MIB列表失败:', error)
      throw error
    }
  }

  const uploadMIB = async (file: File) => {
    try {
      return await apiClient.uploadMIB(file)
    } catch (error) {
      console.error('上传MIB失败:', error)
      throw error
    }
  }

  const deleteMIB = async (id: string) => {
    try {
      await apiClient.deleteMIB(id)
    } catch (error) {
      console.error('删除MIB失败:', error)
      throw error
    }
  }

  return {
    getMIBs,
    uploadMIB,
    deleteMIB,
  }
}

// 告警规则管理钩子
export const useAlertRules = () => {
  const getAlertRules = async (params?: {
    page?: number
    limit?: number
    search?: string
    groupId?: string
    status?: string
  }) => {
    try {
      return await apiClient.getAlertRules(params)
    } catch (error) {
      console.error('获取告警规则失败:', error)
      throw error
    }
  }

  const createAlertRule = async (rule: Omit<AlertRule, 'id'>) => {
    try {
      return await apiClient.createAlertRule(rule)
    } catch (error) {
      console.error('创建告警规则失败:', error)
      throw error
    }
  }

  const updateAlertRule = async (id: string, rule: Partial<AlertRule>) => {
    try {
      return await apiClient.updateAlertRule(id, rule)
    } catch (error) {
      console.error('更新告警规则失败:', error)
      throw error
    }
  }

  const deleteAlertRule = async (id: string) => {
    try {
      await apiClient.deleteAlertRule(id)
    } catch (error) {
      console.error('删除告警规则失败:', error)
      throw error
    }
  }

  return {
    getAlertRules,
    createAlertRule,
    updateAlertRule,
    deleteAlertRule,
  }
}

// 监控组件管理钩子
export const useMonitoring = () => {
  const getComponents = async () => {
    try {
      return await apiClient.getMonitoringComponents()
    } catch (error) {
      console.error('获取监控组件失败:', error)
      throw error
    }
  }

  const installComponent = async (componentId: string, config: any) => {
    try {
      return await apiClient.installMonitoringComponent(componentId, config)
    } catch (error) {
      console.error('安装监控组件失败:', error)
      throw error
    }
  }

  const getStatus = async () => {
    try {
      return await apiClient.getMonitoringStatus()
    } catch (error) {
      console.error('获取监控状态失败:', error)
      throw error
    }
  }

  return {
    getComponents,
    installComponent,
    getStatus,
  }
}

// SNMP操作钩子
export const useSNMP = () => {
  const performWalk = async (target: string, oid: string, community: string) => {
    try {
      return await apiClient.performSNMPWalk(target, oid, community)
    } catch (error) {
      console.error('SNMP Walk失败:', error)
      throw error
    }
  }

  const performGet = async (target: string, oid: string, community: string) => {
    try {
      return await apiClient.performSNMPGet(target, oid, community)
    } catch (error) {
      console.error('SNMP Get失败:', error)
      throw error
    }
  }

  return {
    performWalk,
    performGet,
  }
}

// 系统健康检查钩子
export const useHealth = () => {
  const getHealthStatus = async () => {
    try {
      return await apiClient.getHealthStatus()
    } catch (error) {
      console.error('获取系统健康状态失败:', error)
      throw error
    }
  }

  return {
    getHealthStatus,
  }
}

// 仪表板数据钩子
export const useDashboard = () => {
  const getStats = async (): Promise<DashboardStats> => {
    try {
      // 并行获取各种统计数据
      const [devicesResponse, mibsResponse, rulesResponse, healthResponse] = await Promise.all([
        apiClient.getDevices({ limit: 1 }),
        apiClient.getMIBs({ limit: 1 }),
        apiClient.getAlertRules({ limit: 1 }),
        apiClient.getHealthStatus(),
      ])

      // 计算设备统计
      const deviceStats = {
        total: devicesResponse.total,
        online: 0, // 需要从设备列表中计算
        offline: 0,
        warning: 0,
      }

      // 计算MIB统计
      const mibStats = {
        total: mibsResponse.total,
        validated: 0, // 需要从MIB列表中计算
        errors: 0,
      }

      // 计算告警统计
      const alertStats = {
        total: rulesResponse.total,
        firing: 0, // 需要从告警列表中计算
        resolved: 0,
      }

      return {
        devices: deviceStats,
        mibs: mibStats,
        alerts: alertStats,
        system: {
          health: healthResponse.status === 'healthy' ? 'healthy' : 'unhealthy',
          uptime: healthResponse.uptime,
          version: healthResponse.version,
        },
      }
    } catch (error) {
      console.error('获取仪表板统计失败:', error)
      throw error
    }
  }

  return {
    getStats,
  }
}