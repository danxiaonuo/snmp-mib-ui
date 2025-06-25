import { NextRequest, NextResponse } from 'next/server'

interface ComponentVersion {
  id: string
  name: string
  versions: Array<{
    version: string
    releaseDate: string
    downloadUrl: string
    isLatest: boolean
  }>
}

// GitHub API 获取版本信息
async function fetchGitHubReleases(repo: string): Promise<any[]> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MIB-Web-Monitoring-Installer'
      },
      next: { revalidate: 3600 } // 缓存1小时
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch releases for ${repo}:`, error)
    return []
  }
}

// Docker Hub API 获取版本信息
async function fetchDockerHubTags(repository: string): Promise<any[]> {
  try {
    const response = await fetch(`https://hub.docker.com/v2/repositories/${repository}/tags?page_size=20`, {
      headers: {
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 }
    })
    
    if (!response.ok) {
      throw new Error(`Docker Hub API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error(`Failed to fetch Docker tags for ${repository}:`, error)
    return []
  }
}

// 组件版本映射配置
const COMPONENT_CONFIGS = {
  'node-exporter': {
    type: 'github',
    repo: 'prometheus/node_exporter',
    dockerImage: 'prom/node-exporter'
  },
  'categraf': {
    type: 'github',
    repo: 'flashcatcloud/categraf',
    dockerImage: 'flashcatcloud/categraf'
  },
  'vmagent': {
    type: 'github',
    repo: 'VictoriaMetrics/VictoriaMetrics',
    dockerImage: 'victoriametrics/vmagent'
  },
  'victoriametrics': {
    type: 'github',
    repo: 'VictoriaMetrics/VictoriaMetrics',
    dockerImage: 'victoriametrics/victoria-metrics'
  },
  'grafana': {
    type: 'github',
    repo: 'grafana/grafana',
    dockerImage: 'grafana/grafana'
  },
  'snmp-exporter': {
    type: 'github',
    repo: 'prometheus/snmp_exporter',
    dockerImage: 'prom/snmp-exporter'
  },
  'alertmanager': {
    type: 'github',
    repo: 'prometheus/alertmanager',
    dockerImage: 'prom/alertmanager'
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const component = searchParams.get('component')
    
    if (component && COMPONENT_CONFIGS[component as keyof typeof COMPONENT_CONFIGS]) {
      // 获取单个组件的版本信息
      const config = COMPONENT_CONFIGS[component as keyof typeof COMPONENT_CONFIGS]
      const releases = await fetchGitHubReleases(config.repo)
      
      const versions = releases
        .filter(release => !release.prerelease && !release.draft)
        .slice(0, 10) // 只取最新的10个版本
        .map((release, index) => ({
          version: release.tag_name.replace(/^v/, ''), // 移除v前缀
          releaseDate: release.published_at,
          downloadUrl: release.html_url,
          isLatest: index === 0
        }))
      
      return NextResponse.json({
        id: component,
        name: component,
        versions
      })
    }
    
    // 获取所有组件的版本信息
    const allVersions: ComponentVersion[] = []
    
    for (const [componentId, config] of Object.entries(COMPONENT_CONFIGS)) {
      const releases = await fetchGitHubReleases(config.repo)
      
      const versions = releases
        .filter(release => !release.prerelease && !release.draft)
        .slice(0, 5) // 每个组件取5个最新版本
        .map((release, index) => ({
          version: release.tag_name.replace(/^v/, ''),
          releaseDate: release.published_at,
          downloadUrl: release.html_url,
          isLatest: index === 0
        }))
      
      allVersions.push({
        id: componentId,
        name: componentId,
        versions
      })
    }
    
    return NextResponse.json(allVersions)
    
  } catch (error) {
    console.error('Error fetching component versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch component versions' },
      { status: 500 }
    )
  }
}

// 获取组件兼容性信息
export async function POST(request: NextRequest) {
  try {
    const { components, versions } = await request.json()
    
    // 简单的兼容性检查逻辑
    const compatibility = {
      compatible: true,
      warnings: [] as string[],
      recommendations: [] as string[]
    }
    
    // VictoriaMetrics 和 VMAgent 版本应该匹配
    if (components.includes('victoriametrics') && components.includes('vmagent')) {
      const vmVersion = versions['victoriametrics']
      const vmagentVersion = versions['vmagent']
      
      if (vmVersion !== vmagentVersion) {
        compatibility.warnings.push(
          `VictoriaMetrics (${vmVersion}) 和 VMAgent (${vmagentVersion}) 版本不匹配，建议使用相同版本`
        )
      }
    }
    
    // Grafana 版本兼容性检查
    if (components.includes('grafana')) {
      const grafanaVersion = versions['grafana']
      const majorVersion = parseInt(grafanaVersion.split('.')[0])
      
      if (majorVersion < 9) {
        compatibility.warnings.push(
          `Grafana ${grafanaVersion} 版本较旧，建议升级到 9.0+ 以获得更好的性能和功能`
        )
      }
    }
    
    // 添加一些推荐配置
    if (components.includes('node-exporter') && !components.includes('categraf')) {
      compatibility.recommendations.push(
        '建议同时安装 Categraf 以获得更丰富的监控指标'
      )
    }
    
    if (components.includes('victoriametrics') && !components.includes('alertmanager')) {
      compatibility.recommendations.push(
        '建议安装 Alertmanager 以完善告警功能'
      )
    }
    
    return NextResponse.json(compatibility)
    
  } catch (error) {
    console.error('Error checking compatibility:', error)
    return NextResponse.json(
      { error: 'Failed to check compatibility' },
      { status: 500 }
    )
  }
}