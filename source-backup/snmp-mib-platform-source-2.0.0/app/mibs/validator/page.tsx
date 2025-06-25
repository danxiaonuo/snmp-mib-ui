"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertTriangle, FileText, Code, RefreshCw } from "lucide-react"

interface ValidationIssue {
  line: number
  message: string
  severity: "error" | "warning" | "info"
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  info: {
    totalObjects: number
    oidCount: number
    syntaxVersion: string
    moduleIdentity: string
  }
}

export default function MIBValidatorPage() {
  const { toast } = useToast()
  const [mibContent, setMibContent] = useState("")
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setMibContent(content)
      toast({
        title: "File Loaded",
        description: `Loaded ${file.name} successfully`,
      })
    }
    reader.readAsText(file)
  }

  const loadSampleMIB = () => {
    const sampleMIB = `-- Sample MIB for demonstration
SAMPLE-MIB DEFINITIONS ::= BEGIN

IMPORTS
    MODULE-IDENTITY, OBJECT-TYPE, Integer32
        FROM SNMPv2-SMI
    MODULE-COMPLIANCE, OBJECT-GROUP
        FROM SNMPv2-CONF;

sampleMIB MODULE-IDENTITY
    LAST-UPDATED "202401150000Z"
    ORGANIZATION "Sample Organization"
    CONTACT-INFO "admin@example.com"
    DESCRIPTION "Sample MIB for testing"
    ::= { 1 3 6 1 4 1 12345 }

sampleObjects OBJECT IDENTIFIER ::= { sampleMIB 1 }

sampleValue OBJECT-TYPE
    SYNTAX Integer32
    MAX-ACCESS read-only
    STATUS current
    DESCRIPTION "Sample integer value"
    ::= { sampleObjects 1 }

END`
    setMibContent(sampleMIB)
    toast({
      title: "Sample Loaded",
      description: "Sample MIB content loaded for testing",
    })
  }

  const handleValidate = async () => {
    if (!mibContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide MIB content to validate",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)

    try {
      // Simulate validation process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock validation results
      const mockResults: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [
          { line: 45, message: "Deprecated syntax used for OBJECT-TYPE", severity: "warning" },
          { line: 78, message: "Missing DESCRIPTION clause", severity: "warning" },
        ],
        info: {
          totalObjects: 156,
          oidCount: 89,
          syntaxVersion: "SMIv2",
          moduleIdentity: "SAMPLE-MIB",
        },
      }

      setValidationResults(mockResults)

      toast({
        title: "Validation Complete",
        description: `Found ${mockResults.warnings.length} warnings, ${mockResults.errors.length} errors`,
      })
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "An error occurred during validation",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MIB Validator</h1>
        <p className="text-muted-foreground">Validate MIB file syntax and structure</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              MIB Content
            </CardTitle>
            <CardDescription>Upload a file or paste MIB content directly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="file-upload" className="sr-only">
                  Upload MIB file
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".mib,.txt"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>
              <Button variant="outline" size="sm" onClick={loadSampleMIB}>
                <Code className="h-4 w-4 mr-2" />
                Load Sample
              </Button>
            </div>

            <Textarea
              placeholder="Paste MIB content here or upload a file..."
              value={mibContent}
              onChange={(e) => setMibContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />

            <Button onClick={handleValidate} disabled={!mibContent.trim() || isValidating} className="w-full">
              {isValidating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validate MIB
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Validation Results
            </CardTitle>
            <CardDescription>Syntax errors, warnings, and information</CardDescription>
          </CardHeader>
          <CardContent>
            {!validationResults ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Upload or paste MIB content to start validation</p>
              </div>
            ) : (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="issues">Issues</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <div className="grid gap-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        MIB validation completed with {validationResults.warnings.length} warnings and{" "}
                        {validationResults.errors.length} errors
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-3">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge
                          className={
                            validationResults.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }
                        >
                          {validationResults.isValid ? "Valid" : "Invalid"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Objects:</span>
                        <span className="font-medium">{validationResults.info.totalObjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OID Count:</span>
                        <span className="font-medium">{validationResults.info.oidCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Syntax Version:</span>
                        <span className="font-medium">{validationResults.info.syntaxVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Module Identity:</span>
                        <span className="font-medium">{validationResults.info.moduleIdentity}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="issues" className="space-y-4">
                  {validationResults.errors.length === 0 && validationResults.warnings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No issues found!</p>
                    </div>
                  ) : (
                    <>
                      {validationResults.errors.map((error, index) => (
                        <Alert key={`error-${index}`} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">Line {error.line}</p>
                                <p className="text-sm">{error.message}</p>
                              </div>
                              <Badge variant="destructive">Error</Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}

                      {validationResults.warnings.map((warning, index) => (
                        <Alert key={`warning-${index}`}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">Line {warning.line}</p>
                                <p className="text-sm">{warning.message}</p>
                              </div>
                              <Badge variant="outline" className="text-yellow-600">
                                Warning
                              </Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Parsed Structure</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-auto">{JSON.stringify(validationResults.info, null, 2)}</pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
