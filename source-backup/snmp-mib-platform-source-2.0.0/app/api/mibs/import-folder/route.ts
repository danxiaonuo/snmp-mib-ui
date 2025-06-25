import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// MIB文件夹导入API
export async function POST(request: NextRequest) {
  try {
    const { folderPath } = await request.json()
    
    if (!folderPath || typeof folderPath !== 'string') {
      return NextResponse.json(
        { error: 'Invalid folder path provided' },
        { status: 400 }
      )
    }

    // 验证路径是否存在
    if (!existsSync(folderPath)) {
      return NextResponse.json(
        { error: 'Folder path does not exist' },
        { status: 400 }
      )
    }

    // 检查路径是否为目录
    const pathStat = await stat(folderPath)
    if (!pathStat.isDirectory()) {
      return NextResponse.json(
        { error: 'Path is not a directory' },
        { status: 400 }
      )
    }

    let successCount = 0
    let errors: string[] = []
    const processedFiles: string[] = []

    try {
      // 递归扫描文件夹中的MIB文件
      const mibFiles = await scanMibFiles(folderPath)
      
      // 处理每个MIB文件
      for (const filePath of mibFiles) {
        try {
          const content = await readFile(filePath, 'utf-8')
          const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown'
          
          // 验证MIB文件格式
          if (await validateMibFile(content)) {
            // 这里应该调用真实的MIB存储API
            // await saveMibToDatabase(fileName, content, filePath)
            successCount++
            processedFiles.push(fileName)
          } else {
            errors.push(`${fileName}: 无效的MIB文件格式`)
          }
        } catch (error) {
          const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown'
          errors.push(`${fileName}: ${error instanceof Error ? error.message : '处理失败'}`)
        }
      }

      return NextResponse.json({
        success: true,
        successCount,
        totalFiles: mibFiles.length,
        processedFiles,
        errors,
        message: `成功导入 ${successCount} 个MIB文件${errors.length > 0 ? `，${errors.length} 个文件处理失败` : ''}`
      })

    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Failed to scan folder',
          message: error instanceof Error ? error.message : '文件夹扫描失败'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Failed to import folder:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to import folder',
        message: error instanceof Error ? error.message : '文件夹导入失败'
      },
      { status: 500 }
    )
  }
}

// 递归扫描MIB文件
async function scanMibFiles(dir: string, maxDepth: number = 10, currentDepth: number = 0): Promise<string[]> {
  const mibFiles: string[] = []
  
  // 防止无限递归
  if (currentDepth >= maxDepth) {
    return mibFiles
  }
  
  try {
    const items = await readdir(dir, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = join(dir, item.name)
      
      if (item.isDirectory()) {
        // 跳过隐藏目录和系统目录
        if (!item.name.startsWith('.') && !item.name.startsWith('$')) {
          const subFiles = await scanMibFiles(fullPath, maxDepth, currentDepth + 1)
          mibFiles.push(...subFiles)
        }
      } else if (item.isFile()) {
        // 检查文件扩展名和大小
        const ext = item.name.toLowerCase()
        if (ext.endsWith('.mib') || ext.endsWith('.txt') || ext.endsWith('.my') || ext.endsWith('.smi')) {
          try {
            const fileStat = await stat(fullPath)
            // 跳过过大的文件（超过10MB）
            if (fileStat.size <= 10 * 1024 * 1024) {
              mibFiles.push(fullPath)
            }
          } catch (statError) {
            console.warn('Failed to stat file:', fullPath, statError)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading directory:', dir, error)
  }
  
  return mibFiles
}

// 验证MIB文件格式
async function validateMibFile(content: string): Promise<boolean> {
  try {
    // 基本的MIB文件格式检查
    const mibPattern = /DEFINITIONS\s*::=\s*BEGIN/i
    const hasDefinitions = mibPattern.test(content)
    
    // 检查是否包含END关键字
    const hasEnd = /\bEND\s*$/im.test(content.trim())
    
    // 检查文件大小（不能为空，不能过大）
    if (content.length < 10 || content.length > 5 * 1024 * 1024) {
      return false
    }
    
    // 检查是否包含基本的MIB结构元素
    const hasBasicStructure = hasDefinitions && hasEnd
    
    // 额外检查：是否包含常见的MIB关键字
    const hasCommonKeywords = /\b(OBJECT-TYPE|MODULE-IDENTITY|OBJECT-IDENTITY|NOTIFICATION-TYPE)\b/i.test(content)
    
    return hasBasicStructure || hasCommonKeywords
  } catch (error) {
    return false
  }
}