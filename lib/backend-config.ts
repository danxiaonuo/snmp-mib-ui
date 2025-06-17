// 后端服务配置
export const BACKEND_CONFIG = {
  // 后端API基础URL
  baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8080',
  
  // API版本
  apiVersion: 'v1',
  
  // 超时配置
  timeout: 30000, // 30秒
  
  // 重试配置
  retryAttempts: 3,
  retryDelay: 1000, // 1秒
}

// 获取完整的API URL
export function getApiUrl(endpoint: string): string {
  const baseUrl = BACKEND_CONFIG.baseUrl.replace(/\/$/, '') // 移除末尾斜杠
  const cleanEndpoint = endpoint.replace(/^\//, '') // 移除开头斜杠
  return `${baseUrl}/api/${BACKEND_CONFIG.apiVersion}/${cleanEndpoint}`
}

// 带重试的fetch函数
export async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retries = BACKEND_CONFIG.retryAttempts
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_CONFIG.timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok && retries > 0) {
      console.warn(`Request failed, retrying... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, BACKEND_CONFIG.retryDelay))
      return fetchWithRetry(url, options, retries - 1)
    }
    
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (retries > 0 && (error as Error).name !== 'AbortError') {
      console.warn(`Request failed, retrying... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, BACKEND_CONFIG.retryDelay))
      return fetchWithRetry(url, options, retries - 1)
    }
    
    throw error
  }
}

// 检查后端服务是否可用
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetchWithRetry(getApiUrl('health'), {}, 1)
    return response.ok
  } catch (error) {
    console.warn('Backend health check failed:', error)
    return false
  }
}