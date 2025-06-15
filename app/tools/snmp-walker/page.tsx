"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Play, Download, Copy, AlertCircle, RefreshCw } from "lucide-react"

interface SNMPResult {
  oid: string
  value: string
  type: string
}

export default function SNMPWalkerPage() {
  const { toast } = useToast()
  const [target, setTarget] = useState("192.168.1.1")
  const [community, setCommunity] = useState("public")
  const [version, setVersion] = useState("2c")
  const [startOid, setStartOid] = useState("1.3.6.1.2.1.1")
  const [port, setPort] = useState("161")
  const [timeout, setTimeout] = useState("5")
  const [isWalking, setIsWalking] = useState(false)
  const [results, setResults] = useState<SNMPResult[]>([])
  const [error, setError] = useState("")

  const handleWalk = async () => {
    if (!target.trim()) {
      toast({
        title: "Error",
        description: "Please enter a target host",
        variant: "destructive",
      })
      return
    }

    setIsWalking(true)
    setError("")
    setResults([])

    try {
      // Simulate SNMP walk
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const mockResults: SNMPResult[] = [
        { oid: "1.3.6.1.2.1.1.1.0", value: "Linux server01 5.4.0-74-generic #83-Ubuntu", type: "STRING" },
        { oid: "1.3.6.1.2.1.1.2.0", value: "1.3.6.1.4.1.8072.3.2.10", type: "OID" },
        { oid: "1.3.6.1.2.1.1.3.0", value: "123456789", type: "Timeticks" },
        { oid: "1.3.6.1.2.1.1.4.0", value: "admin@company.com", type: "STRING" },
        { oid: "1.3.6.1.2.1.1.5.0", value: "server01.company.com", type: "STRING" },
        { oid: "1.3.6.1.2.1.1.6.0", value: "Data Center Rack 1", type: "STRING" },
        { oid: "1.3.6.1.2.1.1.7.0", value: "72", type: "INTEGER" },
        { oid: "1.3.6.1.2.1.1.8.0", value: "0", type: "Timeticks" },
      ]

      setResults(mockResults)
      toast({
        title: "SNMP Walk Complete",
        description: `Found ${mockResults.length} OIDs`,
      })
    } catch (err) {
      const errorMsg = "Failed to perform SNMP walk. Please check your settings and network connectivity."
      setError(errorMsg)
      toast({
        title: "SNMP Walk Failed",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsWalking(false)
    }
  }

  const handleExport = () => {
    if (results.length === 0) {
      toast({
        title: "No Data",
        description: "No results to export",
        variant: "destructive",
      })
      return
    }

    const csvContent = [
      "OID,Value,Type",
      ...results.map((result) => `"${result.oid}","${result.value}","${result.type}"`),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `snmp-walk-${target}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Results exported to CSV file",
    })
  }

  const copyOidToClipboard = (oid: string) => {
    navigator.clipboard.writeText(oid)
    toast({
      title: "Copied",
      description: "OID copied to clipboard",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SNMP Walker</h1>
        <p className="text-muted-foreground">Perform SNMP walks to discover available OIDs and values</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>SNMP Configuration</CardTitle>
            <CardDescription>Configure SNMP walk parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target">Target Host *</Label>
              <Input
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="192.168.1.1 or hostname"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input id="port" value={port} onChange={(e) => setPort(e.target.value)} placeholder="161" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (s)</Label>
                <Input id="timeout" value={timeout} onChange={(e) => setTimeout(e.target.value)} placeholder="5" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">SNMP Version</Label>
              <Select value={version} onValueChange={setVersion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">SNMPv1</SelectItem>
                  <SelectItem value="2c">SNMPv2c</SelectItem>
                  <SelectItem value="3">SNMPv3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="community">Community String</Label>
              <Input
                id="community"
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
                placeholder="public"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-oid">Starting OID</Label>
              <Input
                id="start-oid"
                value={startOid}
                onChange={(e) => setStartOid(e.target.value)}
                placeholder="1.3.6.1.2.1.1"
              />
            </div>

            <Button onClick={handleWalk} disabled={isWalking || !target.trim()} className="w-full">
              {isWalking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Walking...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start SNMP Walk
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Walk Results</CardTitle>
                  <CardDescription>
                    {results.length > 0 ? `Found ${results.length} OIDs` : "No results yet"}
                  </CardDescription>
                </div>
                {results.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {results.length > 0 ? (
                <div className="border rounded-lg max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>OID</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <code className="text-sm bg-muted px-1 rounded">{result.oid}</code>
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={result.value}>
                            {result.value}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyOidToClipboard(result.oid)}
                              title="Copy OID"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure SNMP settings and start a walk to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
