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
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getByText('Quick Upload')).toBeInTheDocument()
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
    expect(screen.getByText('Quick Upload')).toBeInTheDocument()
    expect(screen.getByText('Export Data')).toBeInTheDocument()
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getByText('System Status')).toBeInTheDocument()
  })

  it('displays recent activities section', () => {
    render(<DashboardPage />)
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getByText('System Status')).toBeInTheDocument()
  })
})