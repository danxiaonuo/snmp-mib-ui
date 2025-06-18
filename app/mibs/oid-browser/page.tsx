"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Info, 
  Copy, 
  Download, 
  Filter,
  TreePine as Tree,
  List,
  Star,
  BookOpen,
  Network,
  Database,
  Server,
  Activity,
  Zap,
  Eye,
  Plus
} from "lucide-react"
import { toast } from "sonner"

// 增强的 OID 数据结构
interface EnhancedOID {
  oid: string
  name: string
  type: string
  access: string
  description: string
  status: string
  module: string
  parent?: string
  children?: EnhancedOID[]
  category: string
  importance: number
  isExpanded?: boolean
  isSelected?: boolean
  isBookmarked?: boolean
}

// 模拟的增强 OID 数据
const mockOIDData: EnhancedOID[] = [
  {
    oid: "1",
    name: "iso",
    type: "OBJECT IDENTIFIER",
    access: "not-accessible",
    description: "ISO assigned OIDs",
    status: "current",
    module: "SNMPv2-SMI",
    category: "root",
    importance: 5,
    children: [
      {
        oid: "1.3",
        name: "org",
        type: "OBJECT IDENTIFIER", 
        access: "not-accessible",
        description: "Organizations",
        status: "current",
        module: "SNMPv2-SMI",
        category: "root",
        importance: 5,
        parent: "1",
        children: [
          {
            oid: "1.3.6",
            name: "dod",
            type: "OBJECT IDENTIFIER",
            access: "not-accessible", 
            description: "US Department of Defense",
            status: "current",
            module: "SNMPv2-SMI",
            category: "root",
            importance: 5,
            parent: "1.3",
            children: [
              {
                oid: "1.3.6.1",
                name: "internet",
                type: "OBJECT IDENTIFIER",
                access: "not-accessible",
                description: "Internet",
                status: "current", 
                module: "SNMPv2-SMI",
                category: "root",
                importance: 5,
                parent: "1.3.6",
                children: [
                  {
                    oid: "1.3.6.1.2",
                    name: "mgmt",
                    type: "OBJECT IDENTIFIER",
                    access: "not-accessible",
                    description: "Management",
                    status: "current",
                    module: "SNMPv2-SMI", 
                    category: "management",
                    importance: 5,
                    parent: "1.3.6.1",
                    children: [
                      {
                        oid: "1.3.6.1.2.1",
                        name: "mib-2",
                        type: "OBJECT IDENTIFIER",
                        access: "not-accessible",
                        description: "MIB-II",
                        status: "current",
                        module: "SNMPv2-SMI",
                        category: "management",
                        importance: 5,
                        parent: "1.3.6.1.2",
                        children: [
                          {
                            oid: "1.3.6.1.2.1.1",
                            name: "system",
                            type: "OBJECT IDENTIFIER",
                            access: "not-accessible",
                            description: "System group",
                            status: "current",
                            module: "SNMPv2-MIB",
                            category: "system",
                            importance: 5,
                            parent: "1.3.6.1.2.1",
                            children: [
                              {
                                oid: "1.3.6.1.2.1.1.1.0",
                                name: "sysDescr",
                                type: "DisplayString",
                                access: "read-only",
                                description: "A textual description of the entity including hardware, OS, and networking software",
                                status: "current",
                                module: "SNMPv2-MIB",
                                category: "system",
                                importance: 5,
                                parent: "1.3.6.1.2.1.1"
                              },
                              {
                                oid: "1.3.6.1.2.1.1.2.0",
                                name: "sysObjectID",
                                type: "OBJECT IDENTIFIER",
                                access: "read-only",
                                description: "The vendor's authoritative identification of the network management subsystem",
                                status: "current",
                                module: "SNMPv2-MIB",
                                category: "system",
                                importance: 4,
                                parent: "1.3.6.1.2.1.1"
                              },
                              {
                                oid: "1.3.6.1.2.1.1.3.0",
                                name: "sysUpTime",
                                type: "TimeTicks",
                                access: "read-only",
                                description: "Time since the network management portion of the system was last re-initialized",
                                status: "current",
                                module: "SNMPv2-MIB",
                                category: "system",
                                importance: 5,
                                parent: "1.3.6.1.2.1.1"
                              }
                            ]
                          },
                          {
                            oid: "1.3.6.1.2.1.2",
                            name: "interfaces",
                            type: "OBJECT IDENTIFIER",
                            access: "not-accessible",
                            description: "Interfaces group",
                            status: "current",
                            module: "IF-MIB",
                            category: "network",
                            importance: 5,
                            parent: "1.3.6.1.2.1",
                            children: [
                              {
                                oid: "1.3.6.1.2.1.2.1.0",
                                name: "ifNumber",
                                type: "Integer32",
                                access: "read-only",
                                description: "The number of network interfaces present on this system",
                                status: "current",
                                module: "IF-MIB",
                                category: "network",
                                importance: 4,
                                parent: "1.3.6.1.2.1.2"
                              },
                              {
                                oid: "1.3.6.1.2.1.2.2.1.10",
                                name: "ifInOctets",
                                type: "Counter32",
                                access: "read-only",
                                description: "The total number of octets received on the interface",
                                status: "current",
                                module: "IF-MIB",
                                category: "network",
                                importance: 5,
                                parent: "1.3.6.1.2.1.2"
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]

export default function OIDBrowserPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOID, setSelectedOID] = useState<EnhancedOID | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["1", "1.3", "1.3.6", "1.3.6.1", "1.3.6.1.2", "1.3.6.1.2.1"]))
  const [selectedOIDs, setSelectedOIDs] = useState<Set<string>>(new Set())
  const [bookmarkedOIDs, setBookmarkedOIDs] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterImportance, setFilterImportance] = useState("all")
  const [showOnlySelected, setShowOnlySelected] = useState(false)

  // 扁平化 OID 数据用于搜索和过滤
  const flatOIDs = useMemo(() => {
    const flatten = (nodes: EnhancedOID[]): EnhancedOID[] => {
      let result: EnhancedOID[] = []
      for (const node of nodes) {
        result.push(node)
        if (node.children) {
          result = result.concat(flatten(node.children))
        }
      }
      return result
    }
    return flatten(mockOIDData)
  }, [])

  // 过滤后的 OID 数据
  const filteredOIDs = useMemo(() => {
    return flatOIDs.filter(oid => {
      const matchesSearch = searchTerm === "" || 
        oid.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        oid.oid.includes(searchTerm) ||
        oid.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = filterCategory === "all" || oid.category === filterCategory
      const matchesImportance = filterImportance === "all" || oid.importance.toString() === filterImportance
      const matchesSelected = !showOnlySelected || selectedOIDs.has(oid.oid)
      
      return matchesSearch && matchesCategory && matchesImportance && matchesSelected
    })
  }, [flatOIDs, searchTerm, filterCategory, filterImportance, showOnlySelected, selectedOIDs])

  // 获取分类列表
  const categories = useMemo(() => {
    const cats = Array.from(new Set(flatOIDs.map(oid => oid.category)))
    return cats.sort()
  }, [flatOIDs])

  // 切换节点展开状态
  const toggleExpanded = (oid: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(oid)) {
      newExpanded.delete(oid)
    } else {
      newExpanded.add(oid)
    }
    setExpandedNodes(newExpanded)
  }

  // 选择 OID
  const selectOID = (oid: EnhancedOID) => {
    setSelectedOID(oid)
  }

  // 切换 OID 选中状态
  const toggleOIDSelection = (oid: string) => {
    const newSelected = new Set(selectedOIDs)
    if (newSelected.has(oid)) {
      newSelected.delete(oid)
    } else {
      newSelected.add(oid)
    }
    setSelectedOIDs(newSelected)
  }

  // 切换书签状态
  const toggleBookmark = (oid: string) => {
    const newBookmarked = new Set(bookmarkedOIDs)
    if (newBookmarked.has(oid)) {
      newBookmarked.delete(oid)
    } else {
      newBookmarked.add(oid)
    }
    setBookmarkedOIDs(newBookmarked)
    toast.success(newBookmarked.has(oid) ? "已添加到书签" : "已从书签移除")
  }

  // 复制 OID
  const copyOID = (oid: string) => {
    navigator.clipboard.writeText(oid)
    toast.success("OID 已复制到剪贴板")
  }

  // 渲染树形节点
  const renderTreeNode = (node: EnhancedOID, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.oid)
    const isSelected = selectedOIDs.has(node.oid)
    const isBookmarked = bookmarkedOIDs.has(node.oid)
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.oid} className="select-none">
        <div 
          className={`flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer ${
            selectedOID?.oid === node.oid ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => selectOID(node)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(node.oid)
              }}
              className="p-1 hover:bg-background rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleOIDSelection(node.oid)}
            onClick={(e) => e.stopPropagation()}
          />
          
          <Badge variant="outline" className="font-mono text-xs">
            {node.oid}
          </Badge>
          
          <span className="font-medium">{node.name}</span>
          
          {node.importance >= 4 && (
            <Badge className="bg-red-100 text-red-800 text-xs">重要</Badge>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleBookmark(node.oid)
            }}
            className={`p-1 hover:bg-background rounded ${
              isBookmarked ? 'text-yellow-500' : 'text-muted-foreground'
            }`}
          >
            <Star className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          
          <span className="text-sm text-muted-foreground ml-auto truncate">
            {node.description}
          </span>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'counter32':
      case 'counter64':
        return <Activity className="h-4 w-4 text-blue-600" />
      case 'gauge32':
      case 'integer32':
        return <Zap className="h-4 w-4 text-green-600" />
      case 'displaystring':
        return <BookOpen className="h-4 w-4 text-purple-600" />
      case 'object identifier':
        return <Tree className="h-4 w-4 text-orange-600" />
      default:
        return <Database className="h-4 w-4 text-gray-600" />
    }
  }

  // 获取访问权限颜色
  const getAccessColor = (access: string) => {
    switch (access) {
      case 'read-only': return 'bg-blue-100 text-blue-800'
      case 'read-write': return 'bg-green-100 text-green-800'
      case 'write-only': return 'bg-orange-100 text-orange-800'
      case 'not-accessible': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* 页面标题 */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Tree className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">OID 浏览器</h2>
          </div>
          <p className="text-muted-foreground">
            浏览和探索对象标识符 (OID) 树形结构
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "tree" ? "list" : "tree")}>
            {viewMode === "tree" ? <List className="h-4 w-4 mr-2" /> : <Tree className="h-4 w-4 mr-2" />}
            {viewMode === "tree" ? "列表视图" : "树形视图"}
          </Button>
          <Button variant="outline" size="sm" disabled={selectedOIDs.size === 0}>
            <Download className="h-4 w-4 mr-2" />
            导出选中 ({selectedOIDs.size})
          </Button>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索 OID、名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterImportance} onValueChange={setFilterImportance}>
              <SelectTrigger>
                <SelectValue placeholder="重要性" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部重要性</SelectItem>
                <SelectItem value="5">非常重要 (5)</SelectItem>
                <SelectItem value="4">重要 (4)</SelectItem>
                <SelectItem value="3">一般 (3)</SelectItem>
                <SelectItem value="2">较低 (2)</SelectItem>
                <SelectItem value="1">最低 (1)</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-selected"
                checked={showOnlySelected}
                onCheckedChange={setShowOnlySelected}
              />
              <label htmlFor="show-selected" className="text-sm">
                仅显示已选中
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* OID 树形/列表视图 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>OID {viewMode === "tree" ? "树形结构" : "列表"}</CardTitle>
                  <CardDescription>
                    {viewMode === "tree" ? "导航 OID 层次结构" : "平铺显示所有 OID"}
                    {filteredOIDs.length > 0 && ` (${filteredOIDs.length} 项)`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {viewMode === "tree" ? (
                  <div className="space-y-1">
                    {mockOIDData.map(node => renderTreeNode(node))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredOIDs.map(oid => (
                      <div
                        key={oid.oid}
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                          selectedOID?.oid === oid.oid ? 'bg-accent' : ''
                        }`}
                        onClick={() => selectOID(oid)}
                      >
                        <Checkbox
                          checked={selectedOIDs.has(oid.oid)}
                          onCheckedChange={() => toggleOIDSelection(oid.oid)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {oid.oid}
                            </Badge>
                            <span className="font-medium">{oid.name}</span>
                            {oid.importance >= 4 && (
                              <Badge className="bg-red-100 text-red-800 text-xs">重要</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {oid.description}
                          </p>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleBookmark(oid.oid)
                          }}
                          className={`p-1 hover:bg-background rounded ${
                            bookmarkedOIDs.has(oid.oid) ? 'text-yellow-500' : 'text-muted-foreground'
                          }`}
                        >
                          <Star className={`h-4 w-4 ${bookmarkedOIDs.has(oid.oid) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* OID 详情 */}
        <Card>
          <CardHeader>
            <CardTitle>OID 详情</CardTitle>
            <CardDescription>
              {selectedOID ? "选中 OID 的详细信息" : "选择一个 OID 查看详情"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedOID ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">OID</h4>
                  <div className="flex items-center space-x-2">
                    <code className="text-lg font-mono bg-muted px-2 py-1 rounded">
                      {selectedOID.oid}
                    </code>
                    <Button size="sm" variant="ghost" onClick={() => copyOID(selectedOID.oid)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">名称</h4>
                  <p className="font-medium">{selectedOID.name}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">描述</h4>
                  <p className="text-sm">{selectedOID.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">类型</h4>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(selectedOID.type)}
                      <Badge variant="secondary">{selectedOID.type}</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">访问权限</h4>
                    <Badge className={getAccessColor(selectedOID.access)}>
                      {selectedOID.access}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">状态</h4>
                    <Badge variant="outline">{selectedOID.status}</Badge>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">重要性</h4>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < selectedOID.importance 
                              ? 'text-yellow-500 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">模块</h4>
                  <Badge variant="outline">{selectedOID.module}</Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => toggleOIDSelection(selectedOID.oid)}
                  >
                    {selectedOIDs.has(selectedOID.oid) ? (
                      <>取消选择</>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        添加到选择
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => toggleBookmark(selectedOID.oid)}
                  >
                    <Star className={`h-4 w-4 mr-2 ${bookmarkedOIDs.has(selectedOID.oid) ? 'fill-current text-yellow-500' : ''}`} />
                    {bookmarkedOIDs.has(selectedOID.oid) ? "移除书签" : "添加书签"}
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    查询此 OID
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Tree className="h-12 w-12 mx-auto mb-4" />
                <p>选择一个 OID 查看详细信息</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}