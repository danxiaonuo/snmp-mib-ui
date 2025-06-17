"use client"

import { useState, useEffect } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { useGlobalShortcuts, usePageShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { AutoRefreshIndicator } from "@/components/enhanced-ui/auto-refresh-indicator"
import { DragDropZone, FileList } from "@/components/enhanced-ui/drag-drop-zone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Trash2, Eye, Download, Search, RefreshCw, Plus } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/real-api-client"

export default function MIBsPage() {
  // 使用持久化存储
  const [searchTerm, setSearchTerm] = useLocalStorage("mibs-search", "")
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedMIB, setSelectedMIB] = useState<any>(null)

  // 启用快捷键
  useGlobalShortcuts()
  usePageShortcuts('mibs')

  // 状态管理
  const [mibs, setMibs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // 真实API数据获取函数
  const fetchMibs = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getMIBs({
        page: currentPage,
        limit: pageSize,
        search: searchTerm
      })
      
      setMibs(response.mibs || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error('Failed to fetch MIBs:', error)
      toast.error('Failed to load MIBs')
      setMibs([])
    } finally {
      setIsLoading(false)
    }
  }

  // 自动刷新
  const {
    isRefreshing,
    lastRefresh,
    retryCount,
    currentInterval,
    manualRefresh,
    pause,
    resume
  } = useAutoRefresh(fetchMibs, {
    interval: 60000, // MIB文件变化较少，60秒刷新一次
    enabled: true
  })

  // 初始加载和依赖更新
  useEffect(() => {
    fetchMibs()
  }, [currentPage, searchTerm])

  // 文件上传处理
  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      try {
        await apiClient.uploadMIB(file)
        toast.success(`MIB file ${file.name} uploaded successfully`)
      } catch (error) {
        console.error('Failed to upload MIB:', error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    fetchMibs() // 刷新列表
  }

  // 删除MIB
  const handleDeleteMIB = async (id: string) => {
    try {
      await apiClient.deleteMIB(id)
      toast.success('MIB deleted successfully')
      fetchMibs()
    } catch (error) {
      console.error('Failed to delete MIB:', error)
      toast.error('Failed to delete MIB')
    }
  }

  // 查看MIB详情
  const handleViewMIB = async (mib: any) => {
    try {
      const fullMIB = await apiClient.getMIB(mib.id)
      setSelectedMIB(fullMIB)
      setIsViewDialogOpen(true)
    } catch (error) {
      console.error('Failed to fetch MIB details:', error)
      toast.error('Failed to load MIB details')
    }
  }

  // 过滤MIBs
  const filteredMibs = mibs.filter((mib: any) => 
    mib.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mib.filename?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 自动刷新指示器 */}
      <AutoRefreshIndicator
        isRefreshing={isRefreshing}
        lastRefresh={lastRefresh}
        retryCount={retryCount}
        currentInterval={currentInterval}
        onManualRefresh={manualRefresh}
        onPause={pause}
        onResume={resume}
      />

      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MIB Management</h1>
        <p className="text-muted-foreground">
          Upload, manage and browse SNMP MIB files
        </p>
      </div>

      {/* 文件上传区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload MIB Files
          </CardTitle>
          <CardDescription>
            Drag and drop MIB files here or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DragDropZone
            onFilesSelected={handleFileUpload}
            acceptedTypes={['.mib', '.txt', '.asn1']}
            maxFiles={10}
            maxSize={10 * 1024 * 1024} // 10MB
          />
          {uploadFiles.length > 0 && (
            <div className="mt-4">
              <FileList files={uploadFiles} onRemove={(index) => {
                setUploadFiles(files => files.filter((_, i) => i !== index))
              }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* MIB列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>MIB Files</CardTitle>
              <CardDescription>
                Total: {total} MIB files
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search MIB files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button variant="outline" onClick={manualRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>OIDs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading MIB files...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredMibs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No MIB files found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMibs.map((mib: any) => (
                    <TableRow key={mib.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{mib.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{mib.filename}</TableCell>
                      <TableCell>{mib.size}</TableCell>
                      <TableCell>{mib.uploadDate}</TableCell>
                      <TableCell>{mib.oids}</TableCell>
                      <TableCell>
                        <Badge variant={mib.status === 'active' ? 'default' : 'secondary'}>
                          {mib.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewMIB(mib)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteMIB(mib.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MIB详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>MIB Details: {selectedMIB?.name}</DialogTitle>
            <DialogDescription>
              View MIB file information and OID structure
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto">
            {selectedMIB && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Filename</Label>
                    <p className="text-sm font-mono">{selectedMIB.filename}</p>
                  </div>
                  <div>
                    <Label>Size</Label>
                    <p className="text-sm">{selectedMIB.size}</p>
                  </div>
                  <div>
                    <Label>Upload Date</Label>
                    <p className="text-sm">{selectedMIB.uploadDate}</p>
                  </div>
                  <div>
                    <Label>Total OIDs</Label>
                    <p className="text-sm">{selectedMIB.oids}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedMIB.description || 'No description available'}
                  </p>
                </div>

                <div>
                  <Label>OID Structure</Label>
                  <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>OID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Access</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedMIB.oidList?.map((oid: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">{oid.oid}</TableCell>
                            <TableCell>{oid.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{oid.type}</Badge>
                            </TableCell>
                            <TableCell>{oid.access}</TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">
                              No OID information available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button>Export OIDs</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}