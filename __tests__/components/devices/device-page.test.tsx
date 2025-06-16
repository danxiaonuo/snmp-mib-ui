import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DevicesPage from '@/app/devices/page'
import { generateMockDevice } from '@/tests/utils/test-helpers'

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button data-testid="button" onClick={onClick} {...props}>{children}</button>
  ),
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input data-testid="input" {...props} />,
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }: any) => <div data-testid="select" {...props}>{children}</div>,
  SelectContent: ({ children, ...props }: any) => <div data-testid="select-content" {...props}>{children}</div>,
  SelectItem: ({ children, ...props }: any) => <div data-testid="select-item" {...props}>{children}</div>,
  SelectTrigger: ({ children, ...props }: any) => <div data-testid="select-trigger" {...props}>{children}</div>,
  SelectValue: ({ ...props }: any) => <div data-testid="select-value" {...props} />,
}))

jest.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => <table data-testid="table" {...props}>{children}</table>,
  TableBody: ({ children, ...props }: any) => <tbody data-testid="table-body" {...props}>{children}</tbody>,
  TableCell: ({ children, ...props }: any) => <td data-testid="table-cell" {...props}>{children}</td>,
  TableHead: ({ children, ...props }: any) => <th data-testid="table-head" {...props}>{children}</th>,
  TableHeader: ({ children, ...props }: any) => <thead data-testid="table-header" {...props}>{children}</thead>,
  TableRow: ({ children, ...props }: any) => <tr data-testid="table-row" {...props}>{children}</tr>,
}))

describe('Devices Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders devices page with main sections', () => {
    render(<DevicesPage />)
    
    expect(screen.getByText('设备管理')).toBeInTheDocument()
    expect(screen.getByText('添加设备')).toBeInTheDocument()
    expect(screen.getByText('批量导入')).toBeInTheDocument()
  })

  it('displays devices table with headers', () => {
    render(<DevicesPage />)
    
    expect(screen.getByTestId('table')).toBeInTheDocument()
    expect(screen.getByText('设备名称')).toBeInTheDocument()
    expect(screen.getByText('类型')).toBeInTheDocument()
    expect(screen.getByText('IP地址')).toBeInTheDocument()
    expect(screen.getByText('状态')).toBeInTheDocument()
    expect(screen.getByText('位置')).toBeInTheDocument()
    expect(screen.getByText('型号')).toBeInTheDocument()
    expect(screen.getByText('运行时间')).toBeInTheDocument()
    expect(screen.getByText('最后检查')).toBeInTheDocument()
    expect(screen.getByText('操作')).toBeInTheDocument()
  })

  it('handles search functionality', async () => {
    render(<DevicesPage />)
    
    const searchInput = screen.getByPlaceholderText('搜索设备...')
    fireEvent.change(searchInput, { target: { value: 'switch' } })
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('switch')
    })
  })

  it('handles device type filter', () => {
    render(<DevicesPage />)
    
    const typeFilter = screen.getByDisplayValue('所有类型')
    expect(typeFilter).toBeInTheDocument()
  })

  it('handles device status filter', () => {
    render(<DevicesPage />)
    
    const statusFilter = screen.getByDisplayValue('所有状态')
    expect(statusFilter).toBeInTheDocument()
  })

  it('opens add device dialog when add button is clicked', () => {
    render(<DevicesPage />)
    
    const addButton = screen.getByText('添加设备')
    fireEvent.click(addButton)
    
    expect(screen.getByText('添加新设备')).toBeInTheDocument()
  })

  it('displays device action buttons', () => {
    render(<DevicesPage />)
    
    // Check for action buttons in the table
    const editButtons = screen.getAllByText('编辑')
    const deleteButtons = screen.getAllByText('删除')
    const viewButtons = screen.getAllByText('查看')
    
    expect(editButtons.length).toBeGreaterThan(0)
    expect(deleteButtons.length).toBeGreaterThan(0)
    expect(viewButtons.length).toBeGreaterThan(0)
  })

  it('shows device details when view button is clicked', () => {
    render(<DevicesPage />)
    
    const viewButton = screen.getAllByText('查看')[0]
    fireEvent.click(viewButton)
    
    expect(screen.getByText('设备详情')).toBeInTheDocument()
  })

  it('handles device status badges correctly', () => {
    render(<DevicesPage />)
    
    // Check for status badges
    expect(screen.getByText('在线')).toBeInTheDocument()
    expect(screen.getByText('离线')).toBeInTheDocument()
  })

  it('displays device statistics', () => {
    render(<DevicesPage />)
    
    expect(screen.getByText('总设备数')).toBeInTheDocument()
    expect(screen.getByText('在线设备')).toBeInTheDocument()
    expect(screen.getByText('离线设备')).toBeInTheDocument()
    expect(screen.getByText('告警设备')).toBeInTheDocument()
  })
})