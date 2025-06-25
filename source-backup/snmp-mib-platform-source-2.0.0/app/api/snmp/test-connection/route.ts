import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface SNMPTestRequest {
  host: string
  community: string
  version: string
  port?: number
  timeout?: number
}

interface SNMPTestResult {
  success: boolean
  sysDescr?: string
  sysObjectID?: string
  sysUpTime?: string
  sysName?: string
  sysLocation?: string
  sysContact?: string
  error?: string
  responseTime?: number
  detectedBrand?: string
  recommendedTemplate?: string
}

// 检测服务器品牌
function detectServerBrand(sysDescr: string, sysObjectID: string): { brand: string, template: string } {
  const descr = sysDescr.toLowerCase()
  const oid = sysObjectID || ''
  
  // Dell检测
  if (descr.includes('dell') || descr.includes('poweredge') || descr.includes('idrac') || oid.startsWith('1.3.6.1.4.1.674')) {
    return { brand: 'Dell PowerEdge', template: 'server-dell-idrac' }
  }
  
  // HP检测
  if (descr.includes('hp') || descr.includes('hpe') || descr.includes('proliant') || descr.includes('ilo') || oid.startsWith('1.3.6.1.4.1.232')) {
    return { brand: 'HP/HPE ProLiant', template: 'server-hp-ilo' }
  }
  
  // Lenovo检测
  if (descr.includes('lenovo') || descr.includes('thinksystem') || descr.includes('xcc') || descr.includes('imm') || oid.startsWith('1.3.6.1.4.1.19046')) {
    return { brand: 'Lenovo ThinkSystem', template: 'server-lenovo-xcc' }
  }
  
  // Supermicro检测
  if (descr.includes('supermicro') || descr.includes('super micro') || oid.startsWith('1.3.6.1.4.1.10876')) {
    return { brand: 'Supermicro', template: 'server-supermicro-ipmi' }
  }
  
  // 浪潮检测
  if (descr.includes('inspur') || descr.includes('浪潮') || descr.includes('nf') || oid.startsWith('1.3.6.1.4.1.2011')) {
    return { brand: '浪潮/Inspur', template: 'server-inspur-bmc' }
  }
  
  // Cisco检测
  if (descr.includes('cisco') || descr.includes('catalyst') || oid.startsWith('1.3.6.1.4.1.9')) {
    return { brand: 'Cisco', template: 'cisco-switch-complete' }
  }
  
  // 华为检测
  if (descr.includes('huawei') || descr.includes('vrp') || oid.startsWith('1.3.6.1.4.1.2011')) {
    return { brand: 'Huawei', template: 'huawei-switch-complete' }
  }
  
  // H3C检测
  if (descr.includes('h3c') || descr.includes('comware') || oid.startsWith('1.3.6.1.4.1.25506')) {
    return { brand: 'H3C', template: 'h3c-switch-complete' }
  }
  
  return { brand: 'Generic', template: 'server-universal-snmp' }
}

export async function POST(request: NextRequest) {
  try {
    const body: SNMPTestRequest = await request.json()
    const { host, community, version, port = 161, timeout = 5 } = body

    if (!host || !community) {
      return NextResponse.json(
        { success: false, error: 'Host and community are required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    const result: SNMPTestResult = { success: false }

    try {
      // 构建SNMP命令
      const snmpVersion = version === '1' ? '1' : '2c'
      const baseCmd = `snmpget -v${snmpVersion} -c "${community}" -t ${timeout} -r 1 "${host}:${port}"`
      
      // 获取系统基本信息
      const systemOIDs = [
        '1.3.6.1.2.1.1.1.0', // sysDescr
        '1.3.6.1.2.1.1.2.0', // sysObjectID
        '1.3.6.1.2.1.1.3.0', // sysUpTime
        '1.3.6.1.2.1.1.5.0', // sysName
        '1.3.6.1.2.1.1.6.0', // sysLocation
        '1.3.6.1.2.1.1.4.0'  // sysContact
      ]

      const cmd = `${baseCmd} ${systemOIDs.join(' ')}`
      console.log('Executing SNMP command:', cmd)

      const { stdout, stderr } = await execAsync(cmd)
      
      if (stderr && !stdout) {
        throw new Error(stderr)
      }

      // 解析SNMP响应
      const lines = stdout.split('\n').filter(line => line.trim())
      const values: Record<string, string> = {}

      lines.forEach(line => {
        if (line.includes('1.3.6.1.2.1.1.1.0')) {
          const match = line.match(/STRING: (.+)/)
          if (match) values.sysDescr = match[1].replace(/"/g, '')
        } else if (line.includes('1.3.6.1.2.1.1.2.0')) {
          const match = line.match(/OID: (.+)/)
          if (match) values.sysObjectID = match[1]
        } else if (line.includes('1.3.6.1.2.1.1.3.0')) {
          const match = line.match(/Timeticks: \((\d+)\)/)
          if (match) {
            const ticks = parseInt(match[1])
            const days = Math.floor(ticks / (24 * 60 * 60 * 100))
            const hours = Math.floor((ticks % (24 * 60 * 60 * 100)) / (60 * 60 * 100))
            const minutes = Math.floor((ticks % (60 * 60 * 100)) / (60 * 100))
            values.sysUpTime = `${days}天 ${hours}小时 ${minutes}分钟`
          }
        } else if (line.includes('1.3.6.1.2.1.1.5.0')) {
          const match = line.match(/STRING: (.+)/)
          if (match) values.sysName = match[1].replace(/"/g, '')
        } else if (line.includes('1.3.6.1.2.1.1.6.0')) {
          const match = line.match(/STRING: (.+)/)
          if (match) values.sysLocation = match[1].replace(/"/g, '')
        } else if (line.includes('1.3.6.1.2.1.1.4.0')) {
          const match = line.match(/STRING: (.+)/)
          if (match) values.sysContact = match[1].replace(/"/g, '')
        }
      })

      result.success = true
      result.sysDescr = values.sysDescr
      result.sysObjectID = values.sysObjectID
      result.sysUpTime = values.sysUpTime
      result.sysName = values.sysName
      result.sysLocation = values.sysLocation
      result.sysContact = values.sysContact
      result.responseTime = Date.now() - startTime

      // 检测设备品牌
      if (values.sysDescr) {
        const detection = detectServerBrand(values.sysDescr, values.sysObjectID || '')
        result.detectedBrand = detection.brand
        result.recommendedTemplate = detection.template
      }

    } catch (error) {
      console.error('SNMP Error:', error)
      result.success = false
      result.error = error instanceof Error ? error.message : 'Unknown error occurred'
      result.responseTime = Date.now() - startTime
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Invalid request format' },
      { status: 400 }
    )
  }
}