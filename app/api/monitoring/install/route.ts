import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

interface InstallRequest {
  action: 'install' | 'uninstall' | 'restart' | 'status'
  components: string[]
  configs?: Record<string, string>
}

interface ServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'error' | 'unknown'
  containerId?: string
  ports?: string[]
  uptime?: string
  health?: 'healthy' | 'unhealthy' | 'unknown'
}

// 检查 Docker 是否可用
async function checkDockerAvailable(): Promise<boolean> {
  try {
    await execAsync('docker --version')
    return true
  } catch (error) {
    return false
  }
}

// 检查 Docker Compose 是否可用
async function checkDockerComposeAvailable(): Promise<boolean> {
  try {
    await execAsync('docker-compose --version')
    return true
  } catch (error) {
    try {
      await execAsync('docker compose version')
      return true
    } catch (error) {
      return false
    }
  }
}

// 获取服务状态
async function getServiceStatus(serviceName: string): Promise<ServiceStatus> {
  try {
    // 检查容器是否运行
    const { stdout } = await execAsync(`docker ps --filter "name=${serviceName}" --format "{{.ID}}|{{.Status}}|{{.Ports}}"`)
    
    if (stdout.trim()) {
      const [containerId, status, ports] = stdout.trim().split('|')
      
      // 解析运行时间
      const uptimeMatch = status.match(/Up ([^,]+)/)
      const uptime = uptimeMatch ? uptimeMatch[1] : 'unknown'
      
      // 解析端口
      const portList = ports ? ports.split(',').map(p => p.trim()).filter(p => p) : []
      
      // 检查健康状态（如果容器支持健康检查）
      let health: 'healthy' | 'unhealthy' | 'unknown' = 'unknown'
      try {
        const { stdout: healthOutput } = await execAsync(`docker inspect --format='{{.State.Health.Status}}' ${containerId}`)
        const healthStatus = healthOutput.trim()
        if (healthStatus === 'healthy') health = 'healthy'
        else if (healthStatus === 'unhealthy') health = 'unhealthy'
      } catch (error) {
        // 容器可能没有健康检查
      }
      
      return {
        name: serviceName,
        status: 'running',
        containerId,
        ports: portList,
        uptime,
        health
      }
    } else {
      // 检查是否存在但未运行的容器
      const { stdout: stoppedOutput } = await execAsync(`docker ps -a --filter "name=${serviceName}" --format "{{.ID}}|{{.Status}}"`)
      
      if (stoppedOutput.trim()) {
        const [containerId, status] = stoppedOutput.trim().split('|')
        return {
          name: serviceName,
          status: status.includes('Exited') ? 'stopped' : 'error',
          containerId
        }
      }
      
      return {
        name: serviceName,
        status: 'stopped'
      }
    }
  } catch (error) {
    console.error(`Error checking status for ${serviceName}:`, error)
    return {
      name: serviceName,
      status: 'error'
    }
  }
}

// 创建工作目录和配置文件
async function createWorkingDirectory(configs: Record<string, string>): Promise<string> {
  const workDir = path.join(process.cwd(), 'monitoring-install', Date.now().toString())
  
  try {
    await fs.mkdir(workDir, { recursive: true })
    
    // 写入配置文件
    for (const [filename, content] of Object.entries(configs)) {
      const filePath = path.join(workDir, filename)
      
      // 确保目录存在
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })
      
      await fs.writeFile(filePath, content, 'utf8')
      
      // 如果是脚本文件，添加执行权限
      if (filename.endsWith('.sh')) {
        await execAsync(`chmod +x "${filePath}"`)
      }
    }
    
    return workDir
  } catch (error) {
    console.error('Error creating working directory:', error)
    throw new Error('Failed to create working directory')
  }
}

// 安装组件
async function installComponents(components: string[], workDir: string): Promise<{ success: boolean; output: string; errors: string[] }> {
  const errors: string[] = []
  let output = ''
  
  try {
    // 创建监控网络
    try {
      await execAsync('docker network create monitoring')
      output += 'Created monitoring network\n'
    } catch (error) {
      // 网络可能已存在
      output += 'Monitoring network already exists\n'
    }
    
    // 按顺序安装组件
    const installOrder = [
      'victoriametrics',  // 先安装存储
      'node-exporter',    // 然后安装采集器
      'categraf',
      'vmagent',          // 再安装代理
      'alertmanager',     // 安装告警
      'snmp-exporter',
      'grafana'           // 最后安装可视化
    ]
    
    const sortedComponents = components.sort((a, b) => {
      const aIndex = installOrder.indexOf(a)
      const bIndex = installOrder.indexOf(b)
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    })
    
    for (const component of sortedComponents) {
      try {
        const composeFile = `docker-compose.${component}.yml`
        const composePath = path.join(workDir, composeFile)
        
        // 检查配置文件是否存在
        try {
          await fs.access(composePath)
        } catch (error) {
          errors.push(`Configuration file not found for ${component}: ${composeFile}`)
          continue
        }
        
        output += `Installing ${component}...\n`
        
        // 使用 docker-compose 启动服务
        const { stdout, stderr } = await execAsync(
          `cd "${workDir}" && docker-compose -f "${composeFile}" up -d`,
          { timeout: 120000 } // 2分钟超时
        )
        
        output += stdout
        if (stderr) {
          output += `Warning: ${stderr}\n`
        }
        
        // 等待服务启动
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // 检查服务状态
        const status = await getServiceStatus(component)
        if (status.status === 'running') {
          output += `✓ ${component} started successfully\n`
        } else {
          errors.push(`Failed to start ${component}: ${status.status}`)
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        errors.push(`Error installing ${component}: ${errorMsg}`)
        output += `✗ Failed to install ${component}: ${errorMsg}\n`
      }
    }
    
    return {
      success: errors.length === 0,
      output,
      errors
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      output,
      errors: [...errors, errorMsg]
    }
  }
}

// 卸载组件
async function uninstallComponents(components: string[]): Promise<{ success: boolean; output: string; errors: string[] }> {
  const errors: string[] = []
  let output = ''
  
  try {
    for (const component of components) {
      try {
        output += `Uninstalling ${component}...\n`
        
        // 停止并删除容器
        const { stdout, stderr } = await execAsync(`docker stop ${component} && docker rm ${component}`)
        
        output += stdout
        if (stderr && !stderr.includes('No such container')) {
          output += `Warning: ${stderr}\n`
        }
        
        output += `✓ ${component} uninstalled successfully\n`
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        if (!errorMsg.includes('No such container')) {
          errors.push(`Error uninstalling ${component}: ${errorMsg}`)
          output += `✗ Failed to uninstall ${component}: ${errorMsg}\n`
        } else {
          output += `✓ ${component} was not running\n`
        }
      }
    }
    
    return {
      success: errors.length === 0,
      output,
      errors
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      output,
      errors: [...errors, errorMsg]
    }
  }
}

// 重启组件
async function restartComponents(components: string[]): Promise<{ success: boolean; output: string; errors: string[] }> {
  const errors: string[] = []
  let output = ''
  
  try {
    for (const component of components) {
      try {
        output += `Restarting ${component}...\n`
        
        const { stdout, stderr } = await execAsync(`docker restart ${component}`)
        
        output += stdout
        if (stderr) {
          output += `Warning: ${stderr}\n`
        }
        
        // 等待服务重启
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // 检查服务状态
        const status = await getServiceStatus(component)
        if (status.status === 'running') {
          output += `✓ ${component} restarted successfully\n`
        } else {
          errors.push(`Failed to restart ${component}: ${status.status}`)
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        errors.push(`Error restarting ${component}: ${errorMsg}`)
        output += `✗ Failed to restart ${component}: ${errorMsg}\n`
      }
    }
    
    return {
      success: errors.length === 0,
      output,
      errors
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      output,
      errors: [...errors, errorMsg]
    }
  }
}

// 获取所有组件状态
async function getAllComponentsStatus(components: string[]): Promise<ServiceStatus[]> {
  const statuses: ServiceStatus[] = []
  
  for (const component of components) {
    const status = await getServiceStatus(component)
    statuses.push(status)
  }
  
  return statuses
}

export async function POST(request: NextRequest) {
  try {
    const { action, components, configs }: InstallRequest = await request.json()
    
    if (!components || !Array.isArray(components) || components.length === 0) {
      return NextResponse.json(
        { error: '请选择至少一个组件' },
        { status: 400 }
      )
    }
    
    // 检查 Docker 环境
    const dockerAvailable = await checkDockerAvailable()
    if (!dockerAvailable) {
      return NextResponse.json(
        { error: 'Docker 未安装或不可用，请先安装 Docker' },
        { status: 400 }
      )
    }
    
    const dockerComposeAvailable = await checkDockerComposeAvailable()
    if (!dockerComposeAvailable && action === 'install') {
      return NextResponse.json(
        { error: 'Docker Compose 未安装或不可用，请先安装 Docker Compose' },
        { status: 400 }
      )
    }
    
    switch (action) {
      case 'install': {
        if (!configs) {
          return NextResponse.json(
            { error: '安装时必须提供配置文件' },
            { status: 400 }
          )
        }
        
        const workDir = await createWorkingDirectory(configs)
        const result = await installComponents(components, workDir)
        
        return NextResponse.json({
          success: result.success,
          output: result.output,
          errors: result.errors,
          workDir
        })
      }
      
      case 'uninstall': {
        const result = await uninstallComponents(components)
        
        return NextResponse.json({
          success: result.success,
          output: result.output,
          errors: result.errors
        })
      }
      
      case 'restart': {
        const result = await restartComponents(components)
        
        return NextResponse.json({
          success: result.success,
          output: result.output,
          errors: result.errors
        })
      }
      
      case 'status': {
        const statuses = await getAllComponentsStatus(components)
        
        return NextResponse.json({
          success: true,
          statuses
        })
      }
      
      default:
        return NextResponse.json(
          { error: '不支持的操作' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Error in install API:', error)
    return NextResponse.json(
      { error: '操作失败，请检查服务器日志' },
      { status: 500 }
    )
  }
}

// 获取系统信息
export async function GET(request: NextRequest) {
  try {
    const dockerAvailable = await checkDockerAvailable()
    const dockerComposeAvailable = await checkDockerComposeAvailable()
    
    let dockerVersion = 'Not available'
    let dockerComposeVersion = 'Not available'
    
    if (dockerAvailable) {
      try {
        const { stdout } = await execAsync('docker --version')
        dockerVersion = stdout.trim()
      } catch (error) {
        // Ignore
      }
    }
    
    if (dockerComposeAvailable) {
      try {
        const { stdout } = await execAsync('docker-compose --version')
        dockerComposeVersion = stdout.trim()
      } catch (error) {
        try {
          const { stdout } = await execAsync('docker compose version')
          dockerComposeVersion = stdout.trim()
        } catch (error) {
          // Ignore
        }
      }
    }
    
    // 获取运行中的监控容器
    let runningContainers: string[] = []
    try {
      const { stdout } = await execAsync('docker ps --filter "network=monitoring" --format "{{.Names}}"')
      runningContainers = stdout.trim().split('\n').filter(name => name)
    } catch (error) {
      // Ignore
    }
    
    return NextResponse.json({
      docker: {
        available: dockerAvailable,
        version: dockerVersion
      },
      dockerCompose: {
        available: dockerComposeAvailable,
        version: dockerComposeVersion
      },
      runningContainers,
      ready: dockerAvailable && dockerComposeAvailable
    })
    
  } catch (error) {
    console.error('Error getting system info:', error)
    return NextResponse.json(
      { error: '获取系统信息失败' },
      { status: 500 }
    )
  }
}