import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Common test utilities
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  })
}

export const mockApiError = (message: string, status = 500) => {
  return Promise.reject(new Error(message))
}

// Mock data generators
export const generateMockDevice = (overrides = {}) => ({
  id: 'device-1',
  name: 'Test Device',
  type: 'switch',
  ip: '192.168.1.1',
  status: 'online',
  location: 'Test Location',
  model: 'Test Model',
  uptime: '1d 2h 30m',
  lastSeen: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const generateMockMib = (overrides = {}) => ({
  id: 'mib-1',
  name: 'TEST-MIB',
  filename: 'test-mib.mib',
  size: '1.2 KB',
  uploadDate: '2024-01-01',
  status: 'validated',
  description: 'Test MIB file',
  ...overrides,
})

export const generateMockAlertRule = (overrides = {}) => ({
  id: 'rule-1',
  name: 'Test Alert Rule',
  description: 'Test alert rule description',
  expression: 'up == 0',
  duration: '5m',
  severity: 'warning',
  status: 'active',
  groupId: 'group-1',
  deviceGroupId: 'device-group-1',
  ...overrides,
})