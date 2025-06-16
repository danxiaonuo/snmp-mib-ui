import { render, screen } from '@testing-library/react'
import DashboardPage from '@/app/page'

// Mock the components that might have external dependencies
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button data-testid="button" {...props}>{children}</button>,
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>,
}))

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, ...props }: any) => <div data-testid="progress" data-value={value} {...props}></div>,
}))

describe('Dashboard Page', () => {
  it('renders dashboard with main sections', () => {
    render(<DashboardPage />)
    
    // Check for main dashboard elements
    expect(screen.getByText('SNMP MIB 监控平台')).toBeInTheDocument()
    expect(screen.getByText('系统概览')).toBeInTheDocument()
    expect(screen.getByText('快速操作')).toBeInTheDocument()
  })

  it('displays system statistics', () => {
    render(<DashboardPage />)
    
    // Check for statistics cards
    expect(screen.getByText('MIB Files')).toBeInTheDocument()
    expect(screen.getByText('Active Devices')).toBeInTheDocument()
    expect(screen.getByText('Alert Rules')).toBeInTheDocument()
    expect(screen.getByText('System Health')).toBeInTheDocument()
  })

  it('shows quick action buttons', () => {
    render(<DashboardPage />)
    
    // Check for action buttons
    expect(screen.getByText('上传 MIB')).toBeInTheDocument()
    expect(screen.getByText('添加设备')).toBeInTheDocument()
    expect(screen.getByText('创建规则')).toBeInTheDocument()
    expect(screen.getByText('系统设置')).toBeInTheDocument()
  })

  it('displays recent activities section', () => {
    render(<DashboardPage />)
    
    expect(screen.getByText('最近活动')).toBeInTheDocument()
    expect(screen.getByText('系统状态')).toBeInTheDocument()
  })
})