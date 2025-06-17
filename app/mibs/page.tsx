"use client"

import { useState } from "react"
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

export default function MIBsPage() {
  // 使用持久化存储
  const [searchTerm, setSearchTerm] = useLocalStorage("mibs-search", "")
  const [uploadFiles, setUploadFiles] = useState<File[]>([])

  // 启用快捷键
  useGlobalShortcuts()
  usePageShortcuts('mibs')

  // 模拟数据获取函数
  const fetchMibs = async () => {
    console.log('刷新MIB列表...')
    await new Promise(resolve => setTimeout(resolve, 800))
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

  const [mibs, setMibs] = useState([
    {
      id: 1,
      name: "SNMPv2-MIB",
      filename: "SNMPv2-MIB.txt",
      size: "45.2 KB",
      uploadDate: "2024-01-15",
      oids: 156,
      status: "active",
    },
    {
      id: 2,
      name: "IF-MIB",
      filename: "IF-MIB.txt",
      size: "78.9 KB",
      uploadDate: "2024-01-14",
      oids: 234,
      status: "active",
    },
    {
      id: 3,
      name: "CISCO-MEMORY-POOL-MIB",
      filename: "CISCO-MEMORY-POOL-MIB.txt",
      size: "23.1 KB",
      uploadDate: "2024-01-13",
      oids: 89,
      status: "active",
    },
  ])

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedMib, setSelectedMib] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const mockOids = [
    { oid: "1.3.6.1.2.1.1.1.0", name: "sysDescr", type: "DisplayString", access: "read-only" },
    { oid: "1.3.6.1.2.1.1.2.0", name: "sysObjectID", type: "OBJECT IDENTIFIER", access: "read-only" },
    { oid: "1.3.6.1.2.1.1.3.0", name: "sysUpTime", type: "TimeTicks", access: "read-only" },
    { oid: "1.3.6.1.2.1.1.4.0", name: "sysContact", type: "DisplayString", access: "read-write" },
    { oid: "1.3.6.1.2.1.1.5.0", name: "sysName", type: "DisplayString", access: "read-write" },
  ]

  const filteredMibs = mibs.filter(
    (mib) =>
      mib.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mib.filename.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewMib = (mib: any) => {
    setSelectedMib(mib)
    setIsViewDialogOpen(true)
  }

  const handleDeleteMib = (id: number) => {
    setMibs(mibs.filter((mib) => mib.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">MIB Management</h1>
          <p className="text-muted-foreground">Manage SNMP MIB files and browse OID definitions</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload MIB
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload MIB File</DialogTitle>
              <DialogDescription>Upload a new MIB file to the system for OID resolution</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mib-file">MIB File</Label>
                <Input id="mib-file" type="file" accept=".txt,.mib" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" placeholder="Brief description of the MIB file..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsUploadDialogOpen(false)}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search MIB files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MIB Files</CardTitle>
          <CardDescription>Uploaded MIB files available for OID resolution</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>OIDs</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMibs.map((mib) => (
                <TableRow key={mib.id}>
                  <TableCell className="font-medium">{mib.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {mib.filename}
                    </div>
                  </TableCell>
                  <TableCell>{mib.size}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{mib.oids}</Badge>
                  </TableCell>
                  <TableCell>{mib.uploadDate}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">{mib.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewMib(mib)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteMib(mib.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View MIB Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>MIB Details: {selectedMib?.name}</DialogTitle>
            <DialogDescription>Browse OID definitions and structure</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Filename:</span> {selectedMib?.filename}
              </div>
              <div>
                <span className="font-medium">Size:</span> {selectedMib?.size}
              </div>
              <div>
                <span className="font-medium">Total OIDs:</span> {selectedMib?.oids}
              </div>
              <div>
                <span className="font-medium">Upload Date:</span> {selectedMib?.uploadDate}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">OID Definitions</h4>
              <div className="border rounded-lg max-h-96 overflow-auto">
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
                    {mockOids.map((oid, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{oid.oid}</TableCell>
                        <TableCell>{oid.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{oid.type}</Badge>
                        </TableCell>
                        <TableCell>{oid.access}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
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
