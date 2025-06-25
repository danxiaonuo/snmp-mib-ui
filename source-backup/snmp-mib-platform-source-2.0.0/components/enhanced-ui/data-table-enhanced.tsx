"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"
import { VirtualScroll } from "./virtual-scroll"

export interface Column<T> {
  key: keyof T | string
  title: string
  width?: number
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T, index: number) => React.ReactNode
  className?: string
  hidden?: boolean
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  selectable?: boolean
  searchable?: boolean
  filterable?: boolean
  exportable?: boolean
  refreshable?: boolean
  virtualScroll?: boolean
  itemHeight?: number
  containerHeight?: number
  onRowSelect?: (selectedRows: T[]) => void
  onRowClick?: (row: T, index: number) => void
  onRefresh?: () => void
  onExport?: (data: T[]) => void
  className?: string
  emptyMessage?: string
  getRowKey?: (row: T, index: number) => string | number
}

type SortDirection = 'asc' | 'desc' | null

export function DataTableEnhanced<T extends Record<string, any>>({
  data,
  columns: initialColumns,
  loading = false,
  selectable = false,
  searchable = true,
  filterable = true,
  exportable = false,
  refreshable = false,
  virtualScroll = false,
  itemHeight = 50,
  containerHeight = 400,
  onRowSelect,
  onRowClick,
  onRefresh,
  onExport,
  className,
  emptyMessage = "暂无数据",
  getRowKey = (_, index) => index
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())

  // 可见列
  const visibleColumns = useMemo(() => {
    return initialColumns.filter(col => !hiddenColumns.has(col.key as string))
  }, [initialColumns, hiddenColumns])

  // 过滤和搜索数据
  const filteredData = useMemo(() => {
    let result = [...data]

    // 搜索过滤
    if (searchQuery) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // 列过滤
    Object.entries(columnFilters).forEach(([columnKey, filterValue]) => {
      if (filterValue) {
        result = result.filter(row =>
          String(row[columnKey]).toLowerCase().includes(filterValue.toLowerCase())
        )
      }
    })

    return result
  }, [data, searchQuery, columnFilters])

  // 排序数据
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (aValue === bValue) return 0

      const comparison = aValue < bValue ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortColumn, sortDirection])

  // 处理排序
  const handleSort = useCallback((columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => 
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      )
      if (sortDirection === 'desc') {
        setSortColumn(null)
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }, [sortColumn, sortDirection])

  // 处理行选择
  const handleRowSelect = useCallback((rowKey: string | number, selected: boolean) => {
    const newSelected = new Set(selectedRows)
    if (selected) {
      newSelected.add(rowKey)
    } else {
      newSelected.delete(rowKey)
    }
    setSelectedRows(newSelected)

    // 通知父组件
    const selectedData = sortedData.filter((_, index) => 
      newSelected.has(getRowKey(sortedData[index], index))
    )
    onRowSelect?.(selectedData)
  }, [selectedRows, sortedData, getRowKey, onRowSelect])

  // 全选/取消全选
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allKeys = new Set(sortedData.map((row, index) => getRowKey(row, index)))
      setSelectedRows(allKeys)
      onRowSelect?.(sortedData)
    } else {
      setSelectedRows(new Set())
      onRowSelect?.([])
    }
  }, [sortedData, getRowKey, onRowSelect])

  // 切换列可见性
  const toggleColumnVisibility = useCallback((columnKey: string) => {
    const newHidden = new Set(hiddenColumns)
    if (newHidden.has(columnKey)) {
      newHidden.delete(columnKey)
    } else {
      newHidden.add(columnKey)
    }
    setHiddenColumns(newHidden)
  }, [hiddenColumns])

  // 渲染表格行
  const renderRow = useCallback((row: T, index: number) => {
    const rowKey = getRowKey(row, index)
    const isSelected = selectedRows.has(rowKey)

    return (
      <TableRow
        key={rowKey}
        className={cn(
          "cursor-pointer hover:bg-muted/50",
          isSelected && "bg-muted"
        )}
        onClick={() => onRowClick?.(row, index)}
      >
        {selectable && (
          <TableCell className="w-12">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => 
                handleRowSelect(rowKey, checked as boolean)
              }
              onClick={(e) => e.stopPropagation()}
            />
          </TableCell>
        )}
        
        {visibleColumns.map((column) => {
          const value = row[column.key as keyof T]
          return (
            <TableCell
              key={column.key as string}
              className={cn(column.className)}
              style={{ width: column.width }}
            >
              {column.render ? column.render(value, row, index) : String(value || '')}
            </TableCell>
          )
        })}
      </TableRow>
    )
  }, [visibleColumns, selectedRows, selectable, getRowKey, handleRowSelect, onRowClick])

  const isAllSelected = selectedRows.size === sortedData.length && sortedData.length > 0
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < sortedData.length

  return (
    <div className={cn("space-y-4", className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          )}
          
          {filterable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  过滤器
                  {Object.values(columnFilters).some(v => v) && (
                    <Badge variant="secondary" className="ml-2">
                      {Object.values(columnFilters).filter(v => v).length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {initialColumns.filter(col => col.filterable !== false).map((column) => (
                  <div key={column.key as string} className="p-2">
                    <label className="text-sm font-medium">{column.title}</label>
                    <Input
                      placeholder={`过滤 ${column.title}...`}
                      value={columnFilters[column.key as string] || ''}
                      onChange={(e) => setColumnFilters(prev => ({
                        ...prev,
                        [column.key as string]: e.target.value
                      }))}
                      className="mt-1"
                    />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {selectedRows.size > 0 && (
            <Badge variant="secondary">
              已选择 {selectedRows.size} 项
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {refreshable && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          )}
          
          {exportable && (
            <Button variant="outline" size="sm" onClick={() => onExport?.(sortedData)}>
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                列设置
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {initialColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key as string}
                  checked={!hiddenColumns.has(column.key as string)}
                  onCheckedChange={() => toggleColumnVisibility(column.key as string)}
                >
                  {column.title}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 表格 */}
      <div className="border rounded-lg">
        {virtualScroll ? (
          <VirtualScroll
            items={sortedData}
            itemHeight={itemHeight}
            containerHeight={containerHeight}
            renderItem={renderRow}
            getItemKey={getRowKey}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.key as string}
                    className={cn(
                      column.sortable !== false && "cursor-pointer hover:bg-muted/50",
                      column.className
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable !== false && handleSort(column.key as string)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.title}</span>
                      {column.sortable !== false && sortColumn === column.key && (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell 
                    colSpan={visibleColumns.length + (selectable ? 1 : 0)} 
                    className="text-center py-8"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>加载中...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedData.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={visibleColumns.length + (selectable ? 1 : 0)} 
                    className="text-center py-8 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((row, index) => renderRow(row, index))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 分页信息 */}
      {sortedData.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            显示 {sortedData.length} 条记录
            {data.length !== sortedData.length && ` (共 ${data.length} 条)`}
          </div>
          {selectedRows.size > 0 && (
            <div>
              已选择 {selectedRows.size} 项
            </div>
          )}
        </div>
      )}
    </div>
  )
}