"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { History, Download, ArrowLeft, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react"

interface ConfigVersion {
  id: string
  name: string
  version: number
  timestamp: string
  author: string
  changes: string
  status: "active" | "archived" | "rollback"
}

export default function ConfigVersionsPage() {
  const { toast } = useToast()
  const [selectedVersion, setSelectedVersion] = useState<ConfigVersion | null>(null)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [versions, setVersions] = useState<ConfigVersion[]>([
    {
      id: "1",
      name: "router-config.yaml",
      version: 3,
      timestamp: "2024-01-15 14:32:45",
      author: "Evan",
      changes: "Added CPU utilization metrics",
      status: "active",
    },
    {
      id: "2",
      name: "router-config.yaml",
      version: 2,
      timestamp: "2024-01-14 10:15:22",
      author: "Evan",
      changes: "Updated interface metrics",
      status: "archived",
    },
    {
      id: "3",
      name: "router-config.yaml",
      version: 1,
      timestamp: "2024-01-13 09:45:11",
      author: "Evan",
      changes: "Initial configuration",
      status: "archived",
    },
    {
      id: "4",
      name: "switch-config.yaml",
      version: 2,
      timestamp: "2024-01-12 16:22:33",
      author: "Evan",
      changes: "Added port statistics",
      status: "active",
    },
    {
      id: "5",
      name: "switch-config.yaml",
      version: 1,
      timestamp: "2024-01-11 11:05:17",
      author: "Evan",
      changes: "Initial configuration",
      status: "archived",
    },
  ])

  const handleRollback = async (version: ConfigVersion) => {
    setIsRollingBack(true)

    try {
      // Simulate rollback process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update versions
      const updatedVersions = versions.map((v) => {
        if (v.name === version.name && v.status === "active") {
          return { ...v, status: "archived" }
        }
        if (v.id === version.id) {
          return { ...v, status: "active" }
        }
        return v
      })

      setVersions(updatedVersions)

      toast({
        title: "Rollback Complete",
        description: `Successfully rolled back to version ${version.version}`,
      })
    } catch (error) {
      toast({
        title: "Rollback Failed",
        description: "There was an error rolling back to the selected version",
        variant: "destructive",
      })
    } finally {
      setIsRollingBack(false)
    }
  }

  const handleCompare = (version: ConfigVersion) => {
    setSelectedVersion(version)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuration Version Control</h1>
        <p className="text-muted-foreground">Track and manage configuration file versions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History
              </CardTitle>
              <CardDescription>Track changes and roll back to previous versions</CardDescription>
            </div>
            <Badge>{versions.length} versions</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">{version.name}</TableCell>
                    <TableCell>v{version.version}</TableCell>
                    <TableCell>{version.timestamp}</TableCell>
                    <TableCell>{version.author}</TableCell>
                    <TableCell>{version.changes}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          version.status === "active"
                            ? "bg-green-100 text-green-800"
                            : version.status === "rollback"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {version.status.charAt(0).toUpperCase() + version.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompare(version)}
                          disabled={version.status === "active"}
                        >
                          Compare
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRollback(version)}
                          disabled={version.status === "active" || isRollingBack}
                        >
                          {isRollingBack ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Rollback"}
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

      <Dialog open={!!selectedVersion} onOpenChange={(open) => !open && setSelectedVersion(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">
                  {selectedVersion?.name} - v{selectedVersion?.version}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedVersion?.timestamp} by {selectedVersion?.author}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This is a preview feature. Full diff comparison will be available in the next release.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="bg-muted p-2 rounded-t-lg text-sm font-medium">
                  Version {selectedVersion?.version} (Selected)
                </div>
                <div className="border rounded-b-lg p-4 h-[400px] overflow-auto">
                  <pre className="text-sm">
                    {`# Sample configuration
modules:
  router:
    walk:
      - 1.3.6.1.2.1.1
      - 1.3.6.1.2.1.2.2
    metrics:
      - name: sysUpTime
        oid: 1.3.6.1.2.1.1.3.0
        type: gauge
        help: The time since the network management portion of the system was last re-initialized
      - name: ifNumber
        oid: 1.3.6.1.2.1.2.1.0
        type: gauge
        help: The number of network interfaces present on this system`}
                  </pre>
                </div>
              </div>
              <div>
                <div className="bg-muted p-2 rounded-t-lg text-sm font-medium">Current Active Version</div>
                <div className="border rounded-b-lg p-4 h-[400px] overflow-auto">
                  <pre className="text-sm">
                    {`# Sample configuration
modules:
  router:
    walk:
      - 1.3.6.1.2.1.1
      - 1.3.6.1.2.1.2.2
    metrics:
      - name: sysUpTime
        oid: 1.3.6.1.2.1.1.3.0
        type: gauge
        help: The time since the network management portion of the system was last re-initialized
      - name: ifNumber
        oid: 1.3.6.1.2.1.2.1.0
        type: gauge
        help: The number of network interfaces present on this system
      - name: cpuUtilization
        oid: 1.3.6.1.4.1.9.9.109.1.1.1.1.8
        type: gauge
        help: CPU utilization in percentage
        indexes:
          - labelname: cpuIndex
            type: gauge`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedVersion(null)}>
                Close
              </Button>
              <Button onClick={() => handleRollback(selectedVersion!)} disabled={isRollingBack}>
                {isRollingBack ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Rolling Back...
                  </>
                ) : (
                  "Rollback to This Version"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
