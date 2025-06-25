import { GET } from '@/app/api/health/route'
import { NextRequest } from 'next/server'

// Mock database and external dependencies
jest.mock('@/lib/database', () => ({
  testConnection: jest.fn(),
}))

jest.mock('@/lib/redis', () => ({
  ping: jest.fn(),
}))

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns healthy status when all services are up', async () => {
    const { testConnection } = require('@/lib/database')
    const { ping } = require('@/lib/redis')
    
    testConnection.mockResolvedValue(true)
    ping.mockResolvedValue('PONG')

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.services.database).toBe('healthy')
    expect(data.services.redis).toBe('healthy')
  })

  it('returns unhealthy status when database is down', async () => {
    const { testConnection } = require('@/lib/database')
    const { ping } = require('@/lib/redis')
    
    testConnection.mockRejectedValue(new Error('Connection failed'))
    ping.mockResolvedValue('PONG')

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('unhealthy')
    expect(data.services.database).toBe('unhealthy')
    expect(data.services.redis).toBe('healthy')
  })

  it('includes system information in response', async () => {
    const { testConnection } = require('@/lib/database')
    const { ping } = require('@/lib/redis')
    
    testConnection.mockResolvedValue(true)
    ping.mockResolvedValue('PONG')

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('uptime')
    expect(data).toHaveProperty('environment')
  })
})