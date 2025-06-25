"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, FileText, CheckCircle, AlertTriangle, Trash2, RefreshCw } from "lucide-react"

interface MibFile {
  id: string
  name: string
  size: string
  uploadDate: string
  status: "valid" | "invalid" | "pending"
  objects: number
}

export default function MibImportExportPage() {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [mibFiles, setMibFiles] = useState<MibFile[]>([
    {
      id: "1",
      name: "CISCO-MEMORY-POOL-MIB.mib",
      size: "24.5 KB",
      uploadDate: "2024-01-15",
      status: "valid",
      objects: 45,
    },
    {
      id: "2",
      name: "IF-MIB.mib",
      size: "78.2 KB",
      uploadDate: "2024-01-14",
      status: "valid",
      objects: 187,
    },
    {
      id: "3",
      name: "HOST-RESOURCES-MIB.mib",
      size: "102.7 KB",
      uploadDate: "2024-01-13",
      status: "valid",
      objects: 134,
    },
  ])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one MIB file to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Simulate upload process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create new MIB file entries
      const newMibFiles = selectedFiles.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadDate: new Date().toISOString().split("T")[0],
        status: "valid" as const,
        objects: Math.floor(Math.random() * 100) + 20,
      }))

      setMibFiles([...newMibFiles, ...mibFiles])
      setSelectedFiles([])

      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${selectedFiles.length} MIB file(s)`,
      })

      // Reset file input
      const fileInput = document.getElementById("mib-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Export Complete",
        description: "All MIB files have been exported successfully",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your files",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = (id: string) => {
    setMibFiles(mibFiles.filter((file) => file.id !== id))
    toast({
      title: "File Deleted",
      description: "MIB file has been removed from the library",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MIB Import & Export</h1>
        <p className="text-muted-foreground">Manage your MIB file library</p>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList>
          <TabsTrigger value="import">Import MIBs</TabsTrigger>
          <TabsTrigger value="export">Export MIBs</TabsTrigger>
          <TabsTrigger value="library">MIB Library</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload MIB Files
              </CardTitle>
              <CardDescription>Upload MIB files to add to your library</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <Label htmlFor="mib-upload" className="text-lg font-medium block">
                    Drag & drop MIB files or click to browse
                  </Label>
                  <p className="text-sm text-muted-foreground">Supports .mib, .txt, and .my files up to 10MB each</p>
                  <Input
                    id="mib-upload"
                    type="file"
                    multiple
                    accept=".mib,.txt,.my"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button variant="outline" onClick={() => document.getElementById("mib-upload")?.click()}>
                    Select Files
                  </Button>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Selected Files</h4>
                    <Badge>{selectedFiles.length} files</Badge>
                  </div>
                  <div className="border rounded-lg max-h-[200px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File Name</TableHead>
                          <TableHead>Size</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedFiles.map((file, index) => (
                          <TableRow key={index}>
                            <TableCell>{file.name}</TableCell>
                            <TableCell>{(file.size / 1024).toFixed(1)} KB</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0}>
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Uploaded MIB files will be automatically validated and added to your library.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export MIB Files
              </CardTitle>
              <CardDescription>Export your MIB files for backup or sharing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Export All MIB Files</h4>
                    <p className="text-sm text-muted-foreground">
                      Export all {mibFiles.length} MIB files in your library
                    </p>
                  </div>
                  <Button onClick={handleExport} disabled={isExporting}>
                    {isExporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export All
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Export as ZIP Archive</h4>
                    <p className="text-sm text-muted-foreground">Compress all MIB files into a single ZIP file</p>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export as ZIP
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Export Selected MIBs</h4>
                    <p className="text-sm text-muted-foreground">Export only selected MIB files</p>
                  </div>
                  <Button variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Exported MIB files may contain dependencies. Make sure to include all required MIBs.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>MIB Library</CardTitle>
                  <CardDescription>Manage your uploaded MIB files</CardDescription>
                </div>
                <Badge>{mibFiles.length} files</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Objects</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mibFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">{file.name}</TableCell>
                        <TableCell>{file.size}</TableCell>
                        <TableCell>{file.uploadDate}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              file.status === "valid"
                                ? "bg-green-100 text-green-800"
                                : file.status === "invalid"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {file.status === "valid" ? "Valid" : file.status === "invalid" ? "Invalid" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>{file.objects}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(file.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
