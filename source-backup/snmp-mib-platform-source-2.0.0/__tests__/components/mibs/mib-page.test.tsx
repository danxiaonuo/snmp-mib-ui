import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MIBsPage from '@/app/mibs/page'
import { generateMockMib } from '@/tests/utils/test-helpers'

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

jest.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => <table data-testid="table" {...props}>{children}</table>,
  TableBody: ({ children, ...props }: any) => <tbody data-testid="table-body" {...props}>{children}</tbody>,
  TableCell: ({ children, ...props }: any) => <td data-testid="table-cell" {...props}>{children}</td>,
  TableHead: ({ children, ...props }: any) => <th data-testid="table-head" {...props}>{children}</th>,
  TableHeader: ({ children, ...props }: any) => <thead data-testid="table-header" {...props}>{children}</thead>,
  TableRow: ({ children, ...props }: any) => <tr data-testid="table-row" {...props}>{children}</tr>,
}))

describe('MIBs Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders MIBs page with main sections', () => {
    render(<MIBsPage />)
    
    expect(screen.getByText('MIB 文件管理')).toBeInTheDocument()
    expect(screen.getByText('上传 MIB')).toBeInTheDocument()
    expect(screen.getByText('导入/导出')).toBeInTheDocument()
    expect(screen.getByText('OID 浏览器')).toBeInTheDocument()
  })

  it('displays MIB files table', () => {
    render(<MIBsPage />)
    
    expect(screen.getByTestId('table')).toBeInTheDocument()
    expect(screen.getByText('文件名')).toBeInTheDocument()
    expect(screen.getByText('大小')).toBeInTheDocument()
    expect(screen.getByText('上传时间')).toBeInTheDocument()
    expect(screen.getByText('状态')).toBeInTheDocument()
  })

  it('handles search functionality', async () => {
    render(<MIBsPage />)
    
    const searchInput = screen.getByPlaceholderText('搜索 MIB 文件...')
    fireEvent.change(searchInput, { target: { value: 'test-mib' } })
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('test-mib')
    })
  })

  it('opens upload dialog when upload button is clicked', () => {
    render(<MIBsPage />)
    
    const uploadButton = screen.getByText('上传 MIB')
    fireEvent.click(uploadButton)
    
    expect(screen.getByText('上传 MIB 文件')).toBeInTheDocument()
  })

  it('displays action buttons for each MIB file', () => {
    render(<MIBsPage />)
    
    // Check for action buttons in the table
    const viewButtons = screen.getAllByText('查看')
    const deleteButtons = screen.getAllByText('删除')
    
    expect(viewButtons.length).toBeGreaterThan(0)
    expect(deleteButtons.length).toBeGreaterThan(0)
  })

  it('shows MIB file details when view button is clicked', () => {
    render(<MIBsPage />)
    
    const viewButton = screen.getAllByText('查看')[0]
    fireEvent.click(viewButton)
    
    expect(screen.getByText('MIB 详情')).toBeInTheDocument()
  })
})