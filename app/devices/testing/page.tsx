"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Play, RefreshCw, AlertTriangle, CheckCircle, Terminal, Download, Copy } from "lucide-react"

interface SNMPResult {
  oid: string
  value: string
  type: string
}

export default function SNMPTestingPage() {
  const { toast } = useToast()
  const [target, setTarget] = useState("")
  const [community, setCommunity] = useState("public")
  const [version, setVersion] = useState("2c")
  const [port, setPort] = useState("161")
  const [oid, setOid] = useState("1.3.6.1.2.1.1.1.0")
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  // SNMP Walk state
  const [walkOid, setWalkOid] = useState("1.3.6.1.2.1.1")
  const [isWalking, setIsWalking] = useState(false)
  const [walkResults, setWalkResults] = useState<SNMPResult[]>([])
  const [walkProgress, setWalkProgress] = useState(0)

  // SNMP Set state
  const [setOidValue, setSetOidValue] = useState("1.3.6.1.2.1.1.4.0")
  const [setValue, setSetValue] = useState("")
  const [setType, setSetType] = useState("string")
  const [isSetting, setIsSetting] = useState(false)
  const [setResult, setSetResult] = useState<any>(null)

  const commonOids = [
    { label: "System Description", value: "1.3.6.1.2.1.1.1.0" },
    { label: "System Uptime", value: "1.3.6.1.2.1.1.3.0" },
    { label: "System Contact", value: "1.3.6.1.2.1.1.4.0" },
    { label: "System Name", value: "1.3.6.1.2.1.1.5.0" },
    { label: "System Location", value: "1.3.6.1.2.1.1.6.0" },
    { label: "Interface Count", value: "1.3.6.1.2.1.2.1.0" },
  ]

  const walkOids = [
    { label: "System Info", value: "1.3.6.1.2.1.1" },
    { label: "Interfaces", value: "1.3.6.1.2.1.2" },
    { label: "IP Info", value: "1.3.6.1.2.1.4" },
    { label: "TCP Info", value: "1.3.6.1.2.1.6" },
    { label: "UDP Info", value: "1.3.6.1.2.1.7" },
  ]

  const handleGet = async () => {
    if (!target.trim()) {
      toast({
        title: "Error",
        description: "Please enter a target host",
        variant: "destructive",
      })
      return
    }

    setIsTesting(true)
    setTestResults(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockResults = {
        success: true,
        responseTime: Math.floor(Math.random() * 100) + 20,
        value: "Linux server01 5.4.0-74-generic #83-Ubuntu SMP",
        type: "STRING",
        error: null,
      }

      setTestResults(mockResults)
      toast({
        title: "Test Complete",
        description: "SNMP GET successful",
      })
    } catch (error) {
      setTestResults({
        success: false,
        responseTime: null,
        value: null,
        type: null,
        error: "Connection timed out",
      })
      toast({
        title: "Test Failed",
        description: "Failed to connect to the target device",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

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
    setWalkResults([])
    setWalkProgress(0)

    try {
      // Simulate progressive SNMP walk
      const mockResults: SNMPResult[] = [
        { oid: "1.3.6.1.2.1.1.1.0", value: "Linux server01 5.4.0-74-generic", type: "STRING" },
        { oid: "1.3.6.1.2.1.1.2.0", value: "1.3.6.1.4.1.8072.3.2.10", type: "OID" },
        { oid: "1.3.6.1.2.1.1.3.0", value: "123456789", type: "Timeticks" },
        { oid: "1.3.6.1.2.1.1.4.0", value: "admin@company.com", type: "STRING" },
        { oid: "1.3.6.1.2.1.1.5.0", value: "server01.company.com", type: "STRING" },
        { oid: "1.3.6.1.2.1.1.6.0", value: "Data Center Rack 1", type: "STRING" },
        { oid: "1.3.6.1.2.1.1.7.0", value: "72", type: "INTEGER" },
        { oid: "1.3.6.1.2.1.1.8.0", value: "0", type: "Timeticks" },
      ]

      // Simulate progressive loading
      for (let i = 0; i < mockResults.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        setWalkResults((prev) => [...prev, mockResults[i]])
        setWalkProgress(((i + 1) / mockResults.length) * 100)
      }

      toast({
        title: "SNMP Walk Complete",
        description: `Found ${mockResults.length} OIDs`,
      })
    } catch (error) {
      toast({
        title: "Walk Failed",
        description: "Failed to perform SNMP walk",
        variant: "destructive",
      })
    } finally {
      setIsWalking(false)
    }
  }

  const handleSet = async () => {
    if (!target.trim() || !setValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter target host and value",
        variant: "destructive",
      })
      return
    }

    setIsSetting(true)
    setSetResult(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const mockResult = {
        success: true,
        previousValue: "old-value@company.com",
        newValue: setValue,
        responseTime: Math.floor(Math.random() * 50) + 10,
        error: null,
      }

      setSetResult(mockResult)
      toast({
        title: "SNMP Set Complete",
        description: "Value updated successfully",
      })
    } catch (error) {
      setSetResult({
        success: false,
        previousValue: null,
        newValue: null,
        responseTime: null,
        error: "Write access denied",
      })
      toast({
        title: "Set Failed",
        description: "Failed to set SNMP value",
        variant: "destructive",
      })
    } finally {
      setIsSetting(false)
    }
  }

  const exportWalkResults = () => {
    if (walkResults.length === 0) return

    const csvContent = [
      "OID,Value,Type",
      ...walkResults.map((result) => `"${result.oid}","${result.value}","${result.type}"`),
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
      description: "Walk results exported to CSV",
    })
  }

  const copyOid = (oid: string) => {
    navigator.clipboard.writeText(oid)
    toast({
      title: "Copied",
      description: "OID copied to clipboard",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SNMP Testing</h1>
        <p className="text-muted-foreground">Test SNMP connectivity, retrieve values, and modify settings</p>
      </div>

      <Tabs defaultValue="get" className="w-full">
        <TabsList>
          <TabsTrigger value="get">SNMP Get</TabsTrigger>
          <TabsTrigger value="walk">SNMP Walk</TabsTrigger>
          <TabsTrigger value="set">SNMP Set</TabsTrigger>
        </TabsList>

        {/* SNMP GET Tab */}
        <TabsContent value="get" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>SNMP Get Configuration</CardTitle>
                <CardDescription>Retrieve a single OID value</CardDescription>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SNMP Version</Label>
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
                    <Label>Port</Label>
                    <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="161" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Community String</Label>
                  <Input value={community} onChange={(e) => setCommunity(e.target.value)} placeholder="public" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>OID</Label>
                    <Select value={oid} onValueChange={setOid}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Common OIDs" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonOids.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input value={oid} onChange={(e) => setOid(e.target.value)} placeholder="1.3.6.1.2.1.1.1.0" />
                </div>

                <Button onClick={handleGet} disabled={isTesting || !target.trim() || !oid.trim()} className="w-full">
                  {isTesting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run SNMP Get
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>SNMP response details</CardDescription>
              </CardHeader>
              <CardContent>
                {testResults ? (
                  <div className="space-y-4">
                    <Alert
                      variant={testResults.success ? "default" : "destructive"}
                      className={testResults.success ? "bg-green-50" : undefined}
                    >
                      {testResults.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {testResults.success
                          ? `Successfully retrieved value from ${target}`
                          : `Failed to retrieve value: ${testResults.error}`}
                      </AlertDescription>
                    </Alert>

                    {testResults.success && (
                      <>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Response Time:</span>
                            <Badge variant="outline">{testResults.responseTime} ms</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Value Type:</span>
                            <Badge>{testResults.type}</Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Value:</Label>
                          <div className="bg-muted p-3 rounded-md font-mono text-sm overflow-auto max-h-[200px]">
                            {testResults.value}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Configure SNMP parameters and run a test to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SNMP WALK Tab */}
        <TabsContent value="walk" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>SNMP Walk Configuration</CardTitle>
                <CardDescription>Discover multiple OIDs under a branch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Host *</Label>
                  <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="192.168.1.1" />
                </div>

                <div className="space-y-2">
                  <Label>Community String</Label>
                  <Input value={community} onChange={(e) => setCommunity(e.target.value)} placeholder="public" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Starting OID</Label>
                    <Select value={walkOid} onValueChange={setWalkOid}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Common" />
                      </SelectTrigger>
                      <SelectContent>
                        {walkOids.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input value={walkOid} onChange={(e) => setWalkOid(e.target.value)} placeholder="1.3.6.1.2.1.1" />
                </div>

                <Button onClick={handleWalk} disabled={isWalking || !target.trim()} className="w-full">
                  {isWalking ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Walking... {Math.round(walkProgress)}%
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start SNMP Walk
                    </>
                  )}
                </Button>

                {isWalking && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${walkProgress}%` }}
                    ></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Walk Results</CardTitle>
                      <CardDescription>
                        {walkResults.length > 0 ? `Found ${walkResults.length} OIDs` : "No results yet"}
                      </CardDescription>
                    </div>
                    {walkResults.length > 0 && (
                      <Button variant="outline" size="sm" onClick={exportWalkResults}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {walkResults.length > 0 ? (
                    <div className="border rounded-lg max-h-[400px] overflow-auto">
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
                          {walkResults.map((result, index) => (
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
                                <Button variant="ghost" size="sm" onClick={() => copyOid(result.oid)}>
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
                      <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Configure parameters and start a walk to discover OIDs</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* SNMP SET Tab */}
        <TabsContent value="set" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>SNMP Set Configuration</CardTitle>
                <CardDescription>Modify SNMP values (requires write access)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    SNMP Set operations modify device configuration. Use with caution and ensure you have proper
                    authorization.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Target Host *</Label>
                  <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="192.168.1.1" />
                </div>

                <div className="space-y-2">
                  <Label>Community String (write)</Label>
                  <Input value={community} onChange={(e) => setCommunity(e.target.value)} placeholder="private" />
                </div>

                <div className="space-y-2">
                  <Label>OID to Modify</Label>
                  <Input
                    value={setOidValue}
                    onChange={(e) => setSetOidValue(e.target.value)}
                    placeholder="1.3.6.1.2.1.1.4.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Value Type</Label>
                  <Select value={setType} onValueChange={setSetType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="integer">Integer</SelectItem>
                      <SelectItem value="oid">OID</SelectItem>
                      <SelectItem value="ipaddress">IP Address</SelectItem>
                      <SelectItem value="counter">Counter</SelectItem>
                      <SelectItem value="gauge">Gauge</SelectItem>
                      <SelectItem value="timeticks">Timeticks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>New Value *</Label>
                  <Input value={setValue} onChange={(e) => setSetValue(e.target.value)} placeholder="Enter new value" />
                </div>

                <Button
                  onClick={handleSet}
                  disabled={isSetting || !target.trim() || !setValue.trim()}
                  className="w-full"
                  variant="destructive"
                >
                  {isSetting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Setting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute SNMP Set
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Set Results</CardTitle>
                <CardDescription>SNMP set operation results</CardDescription>
              </CardHeader>
              <CardContent>
                {setResult ? (
                  <div className="space-y-4">
                    <Alert
                      variant={setResult.success ? "default" : "destructive"}
                      className={setResult.success ? "bg-green-50" : undefined}
                    >
                      {setResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      <AlertDescription>
                        {setResult.success
                          ? `Successfully updated value on ${target}`
                          : `Failed to set value: ${setResult.error}`}
                      </AlertDescription>
                    </Alert>

                    {setResult.success && (
                      <>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Response Time:</span>
                            <Badge variant="outline">{setResult.responseTime} ms</Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Previous Value:</Label>
                          <div className="bg-muted p-2 rounded text-sm font-mono">{setResult.previousValue}</div>
                        </div>

                        <div className="space-y-2">
                          <Label>New Value:</Label>
                          <div className="bg-green-50 p-2 rounded text-sm font-mono border border-green-200">
                            {setResult.newValue}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Configure parameters and execute a set operation to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
