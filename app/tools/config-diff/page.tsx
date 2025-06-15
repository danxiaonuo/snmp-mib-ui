"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { GitCompare, Download, RefreshCw, CheckCircle, AlertTriangle, Copy } from "lucide-react"

interface DiffResult {
  type: "added" | "removed" | "modified" | "unchanged"
  line: number
  content: string
  oldContent?: string
}

export default function ConfigDiffPage() {
  const { toast } = useToast()
  const [config1, setConfig1] = useState("")
  const [config2, setConfig2] = useState("")
  const [diffResults, setDiffResults] = useState<DiffResult[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const [diffFormat, setDiffFormat] = useState("side-by-side")

  const sampleConfigs = {
    prometheus1: `# Prometheus SNMP Exporter Config v1
modules:
  default:
    walk:
      - 1.3.6.1.2.1.1.1.0  # sysDescr
      - 1.3.6.1.2.1.1.3.0  # sysUpTime
      - 1.3.6.1.2.1.2.1.0  # ifNumber
    metrics:
      - name: sysDescr
        oid: 1.3.6.1.2.1.1.1.0
        type: DisplayString
      - name: sysUpTime
        oid: 1.3.6.1.2.1.1.3.0
        type: gauge`,
    prometheus2: `# Prometheus SNMP Exporter Config v2
modules:
  default:
    walk:
      - 1.3.6.1.2.1.1.1.0  # sysDescr
      - 1.3.6.1.2.1.1.3.0  # sysUpTime
      - 1.3.6.1.2.1.2.1.0  # ifNumber
      - 1.3.6.1.2.1.1.5.0  # sysName
    metrics:
      - name: sysDescr
        oid: 1.3.6.1.2.1.1.1.0
        type: DisplayString
      - name: sysUpTime
        oid: 1.3.6.1.2.1.1.3.0
        type: counter
      - name: sysName
        oid: 1.3.6.1.2.1.1.5.0
        type: DisplayString`,
  }

  const loadSampleConfig = (configKey: string, target: "config1" | "config2") => {
    const config = sampleConfigs[configKey as keyof typeof sampleConfigs]
    if (target === "config1") {
      setConfig1(config)
    } else {
      setConfig2(config)
    }
    toast({
      title: "Sample Loaded",
      description: `Sample configuration loaded into ${target === "config1" ? "left" : "right"} panel`,
    })
  }

  const performDiff = async () => {
    if (!config1.trim() || !config2.trim()) {
      toast({
        title: "Error",
        description: "Please provide both configurations to compare",
        variant: "destructive",
      })
      return
    }

    setIsComparing(true)
    setDiffResults([])

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simple diff algorithm simulation
      const lines1 = config1.split("\n")
      const lines2 = config2.split("\n")
      const results: DiffResult[] = []

      const maxLines = Math.max(lines1.length, lines2.length)

      for (let i = 0; i < maxLines; i++) {
        const line1 = lines1[i] || ""
        const line2 = lines2[i] || ""

        if (line1 === line2) {
          results.push({
            type: "unchanged",
            line: i + 1,
            content: line1,
          })
        } else if (!line1 && line2) {
          results.push({
            type: "added",
            line: i + 1,
            content: line2,
          })
        } else if (line1 && !line2) {
          results.push({
            type: "removed",
            line: i + 1,
            content: line1,
          })
        } else {
          results.push({
            type: "modified",
            line: i + 1,
            content: line2,
            oldContent: line1,
          })
        }
      }

      setDiffResults(results)

      const changes = results.filter((r) => r.type !== "unchanged").length
      toast({
        title: "Comparison Complete",
        description: `Found ${changes} differences between configurations`,
      })
    } catch (error) {
      toast({
        title: "Comparison Failed",
        description: "Failed to compare configurations",
        variant: "destructive",
      })
    } finally {
      setIsComparing(false)
    }
  }

  const exportDiff = () => {
    if (diffResults.length === 0) return

    const diffText = diffResults
      .map((result) => {
        const prefix = {
          added: "+ ",
          removed: "- ",
          modified: "~ ",
          unchanged: "  ",
        }[result.type]

        return `${prefix}${result.content}`
      })
      .join("\n")

    const blob = new Blob([diffText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `config-diff-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Diff results exported successfully",
    })
  }

  const copyDiff = () => {
    if (diffResults.length === 0) return

    const diffText = diffResults
      .map((result) => {
        const prefix = {
          added: "+ ",
          removed: "- ",
          modified: "~ ",
          unchanged: "  ",
        }[result.type]

        return `${prefix}${result.content}`
      })
      .join("\n")

    navigator.clipboard.writeText(diffText)
    toast({
      title: "Copied",
      description: "Diff results copied to clipboard",
    })
  }

  const getDiffStats = () => {
    const stats = {
      added: diffResults.filter((r) => r.type === "added").length,
      removed: diffResults.filter((r) => r.type === "removed").length,
      modified: diffResults.filter((r) => r.type === "modified").length,
      unchanged: diffResults.filter((r) => r.type === "unchanged").length,
    }
    return stats
  }

  const stats = getDiffStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuration Diff</h1>
        <p className="text-muted-foreground">Compare two configuration files to identify differences</p>
      </div>

      {/* Configuration Input */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Configuration 1 (Original)</CardTitle>
                <CardDescription>Paste or upload the first configuration</CardDescription>
              </div>
              <Select onValueChange={(value) => loadSampleConfig(value, "config1")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Load Sample" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prometheus1">Prometheus v1</SelectItem>
                  <SelectItem value="prometheus2">Prometheus v2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config1}
              onChange={(e) => setConfig1(e.target.value)}
              placeholder="Paste your first configuration here..."
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              {config1.split("\n").length} lines, {config1.length} characters
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Configuration 2 (Modified)</CardTitle>
                <CardDescription>Paste or upload the second configuration</CardDescription>
              </div>
              <Select onValueChange={(value) => loadSampleConfig(value, "config2")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Load Sample" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prometheus1">Prometheus v1</SelectItem>
                  <SelectItem value="prometheus2">Prometheus v2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config2}
              onChange={(e) => setConfig2(e.target.value)}
              placeholder="Paste your second configuration here..."
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              {config2.split("\n").length} lines, {config2.length} characters
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compare Button */}
      <div className="flex justify-center">
        <Button
          onClick={performDiff}
          disabled={isComparing || !config1.trim() || !config2.trim()}
          size="lg"
          className="px-8"
        >
          {isComparing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Comparing...
            </>
          ) : (
            <>
              <GitCompare className="h-4 w-4 mr-2" />
              Compare Configurations
            </>
          )}
        </Button>
      </div>

      {/* Diff Results */}
      {diffResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Comparison Results</CardTitle>
                <CardDescription>Differences between the two configurations</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyDiff}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={exportDiff}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="flex items-center gap-4">
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {stats.added} Added
              </Badge>
              <Badge className="bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {stats.removed} Removed
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800">
                <RefreshCw className="h-3 w-3 mr-1" />
                {stats.modified} Modified
              </Badge>
              <Badge variant="outline">{stats.unchanged} Unchanged</Badge>
            </div>

            {/* Diff Display */}
            <div className="border rounded-lg bg-muted/30 max-h-[500px] overflow-auto">
              <div className="p-4 font-mono text-sm space-y-1">
                {diffResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 px-2 py-1 rounded ${
                      result.type === "added"
                        ? "bg-green-50 border-l-2 border-green-500"
                        : result.type === "removed"
                          ? "bg-red-50 border-l-2 border-red-500"
                          : result.type === "modified"
                            ? "bg-yellow-50 border-l-2 border-yellow-500"
                            : ""
                    }`}
                  >
                    <span className="text-muted-foreground text-xs w-8 flex-shrink-0">{result.line}</span>
                    <span
                      className={`flex-1 ${
                        result.type === "added"
                          ? "text-green-800"
                          : result.type === "removed"
                            ? "text-red-800"
                            : result.type === "modified"
                              ? "text-yellow-800"
                              : "text-muted-foreground"
                      }`}
                    >
                      {result.type === "added" && "+ "}
                      {result.type === "removed" && "- "}
                      {result.type === "modified" && "~ "}
                      {result.content || " "}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {stats.added + stats.removed + stats.modified === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>The configurations are identical - no differences found.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
