import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
// import AdmZip from 'adm-zip'  // 暂时注释，需要安装依赖

// MIB压缩包上传和解析API
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const zipFile = formData.get('zipFile') as File
    
    if (!zipFile) {
      return NextResponse.json(
        { error: 'No zip file provided' },
        { status: 400 }
      )
    }

    // 创建临时目录
    const tempDir = join(process.cwd(), 'temp', 'mib-extract')
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    // 保存压缩包到临时目录
    const zipBuffer = Buffer.from(await zipFile.arrayBuffer())
    const zipPath = join(tempDir, zipFile.name)
    await writeFile(zipPath, zipBuffer)

    let extractedFiles: string[] = []
    let successCount = 0
    let errors: string[] = []

    try {
      // 解压缩文件
      if (zipFile.name.toLowerCase().endsWith('.zip')) {
        // const zip = new AdmZip(zipPath)  // 暂时注释，需要安装依赖
        return NextResponse.json({ 
          error: 'ZIP解析功能需要安装adm-zip依赖' 
        }, { status: 501 })
        const extractPath = join(tempDir, 'extracted')
        zip.extractAllTo(extractPath, true)
        
        // 递归查找所有MIB文件
        extractedFiles = await findMibFiles(extractPath)
      } else {
        // 对于其他格式的压缩包，可以使用其他库处理
        errors.push(`不支持的压缩格式: ${zipFile.name}`)
      }

      // 处理每个MIB文件
      for (const filePath of extractedFiles) {
        try {
          const content = await readFile(filePath, 'utf-8')
          const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown'
          
          // 验证MIB文件格式
          if (await validateMibFile(content)) {
            // 这里应该调用真实的MIB存储API
            // await saveMibToDatabase(fileName, content)
            successCount++
          } else {
            errors.push(`${fileName}: 无效的MIB文件格式`)
          }
        } catch (error) {
          const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown'
          errors.push(`${fileName}: ${error instanceof Error ? error.message : '处理失败'}`)
        }
      }

    } catch (error) {
      errors.push(`压缩包解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    // 清理临时文件
    try {
      const { rm } = await import('fs/promises')
      await rm(tempDir, { recursive: true, force: true })
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp files:', cleanupError)
    }

    return NextResponse.json({
      success: true,
      successCount,
      totalFiles: extractedFiles.length,
      errors,
      message: `成功处理 ${successCount} 个MIB文件${errors.length > 0 ? `，${errors.length} 个文件处理失败` : ''}`
    })

  } catch (error) {
    console.error('Failed to process zip file:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process zip file',
        message: error instanceof Error ? error.message : '压缩包处理失败'
      },
      { status: 500 }
    )
  }
}

// 递归查找MIB文件
async function findMibFiles(dir: string): Promise<string[]> {
  const mibFiles: string[] = []
  
  try {
    const items = await readdir(dir, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = join(dir, item.name)
      
      if (item.isDirectory()) {
        // 递归查找子目录
        const subFiles = await findMibFiles(fullPath)
        mibFiles.push(...subFiles)
      } else if (item.isFile()) {
        // 检查文件扩展名
        const ext = item.name.toLowerCase()
        if (ext.endsWith('.mib') || ext.endsWith('.txt') || ext.endsWith('.my')) {
          mibFiles.push(fullPath)
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
    
    // 检查是否包含基本的MIB结构
    const hasImports = /IMPORTS/i.test(content) || content.includes('FROM')
    
    return hasDefinitions && hasEnd
  } catch (error) {
    return false
  }
}