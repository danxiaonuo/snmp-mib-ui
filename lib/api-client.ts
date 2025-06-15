import { toast } from "@/hooks/use-toast"

interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
}

class ApiClient {
  private baseUrl: string

  constructor() {
    // Use environment variable if available, otherwise fallback to default
    // In container environment, use backend service name
    // In development, use localhost
    if (typeof window === 'undefined') {
      // Server-side rendering
      this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://mib-backend:8080/api/v1"
    } else {
      // Client-side
      this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const config: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      }

      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return { data, success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      console.error("API request failed:", errorMessage)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      return { error: errorMessage, success: false }
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

export const apiClient = new ApiClient()
