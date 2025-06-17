import { NextRequest, NextResponse } from 'next/server'
import { writeFile, appendFile } from 'fs/promises'
import { join } from 'path'

// 日志API端点
export async function POST(request: NextRequest) {
  try {
    const logEntry = await request.json()
    
    // 验证日志条目
    if (!logEntry.message || !logEntry.level || !logEntry.timestamp) {
      return NextResponse.json(
        { error: 'Invalid log entry format' },
        { status: 400 }
      )
    }

    // 格式化日志条目
    const formattedLog = {
      ...logEntry,
      timestamp: new Date(logEntry.timestamp).toISOString(),
      server_timestamp: new Date().toISOString(),
    }

    // 写入日志文件
    const logDir = join(process.cwd(), 'logs')
    const logFile = join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`)
    
    try {
      await appendFile(logFile, JSON.stringify(formattedLog) + '\n')
    } catch (error) {
      // 如果目录不存在，创建目录
      const { mkdir } = await import('fs/promises')
      await mkdir(logDir, { recursive: true })
      await appendFile(logFile, JSON.stringify(formattedLog) + '\n')
    }

    // 如果是错误级别，还可以发送到外部监控服务
    if (formattedLog.level >= 3) { // ERROR level
      // await sendToExternalMonitoring(formattedLog)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to process log entry:', error)
    return NextResponse.json(
      { error: 'Failed to process log entry' },
      { status: 500 }
    )
  }
}

// 获取日志
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const level = searchParams.get('level')
    const limit = parseInt(searchParams.get('limit') || '100')

    const logFile = join(process.cwd(), 'logs', `app-${date}.log`)
    
    try {
      const { readFile } = await import('fs/promises')
      const logContent = await readFile(logFile, 'utf-8')
      
      let logs = logContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line)
          } catch {
            return null
          }
        })
        .filter(Boolean)

      // 按级别过滤
      if (level) {
        const levelNum = parseInt(level)
        logs = logs.filter(log => log.level >= levelNum)
      }

      // 限制数量
      logs = logs.slice(-limit)

      return NextResponse.json({
        success: true,
        data: {
          logs,
          total: logs.length,
          date,
        }
      })
    } catch (error) {
      return NextResponse.json({
        success: true,
        data: {
          logs: [],
          total: 0,
          date,
          message: 'No logs found for this date'
        }
      })
    }
  } catch (error) {
    console.error('Failed to retrieve logs:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve logs' },
      { status: 500 }
    )
  }
}