"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, ArrowRightLeft, Search } from "lucide-react"

export default function OIDConverterPage() {
  const [numericOid, setNumericOid] = useState("1.3.6.1.2.1.1.1.0")
  const [textualOid, setTextualOid] = useState("iso.org.dod.internet.mgmt.mib-2.system.sysDescr.0")
  const [searchTerm, setSearchTerm] = useState("")

  const commonOids = [
    { numeric: "1.3.6.1.2.1.1.1.0", textual: "iso.org.dod.internet.mgmt.mib-2.system.sysDescr.0", name: "sysDescr" },
    { numeric: "1.3.6.1.2.1.1.3.0", textual: "iso.org.dod.internet.mgmt.mib-2.system.sysUpTime.0", name: "sysUpTime" },
    {
      numeric: "1.3.6.1.2.1.2.2.1.10",
      textual: "iso.org.dod.internet.mgmt.mib-2.interfaces.ifTable.ifEntry.ifInOctets",
      name: "ifInOctets",
    },
    {
      numeric: "1.3.6.1.2.1.2.2.1.16",
      textual: "iso.org.dod.internet.mgmt.mib-2.interfaces.ifTable.ifEntry.ifOutOctets",
      name: "ifOutOctets",
    },
  ]

  const handleConvert = (direction: "toTextual" | "toNumeric") => {
    // Simulate conversion logic
    if (direction === "toTextual") {
      const found = commonOids.find((oid) => oid.numeric === numericOid)
      if (found) {
        setTextualOid(found.textual)
      }
    } else {
      const found = commonOids.find((oid) => oid.textual === textualOid)
      if (found) {
        setNumericOid(found.numeric)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">OID Converter</h1>
        <p className="text-muted-foreground">Convert between numeric and textual OID formats</p>
      </div>

      <Tabs defaultValue="converter" className="w-full">
        <TabsList>
          <TabsTrigger value="converter">Converter</TabsTrigger>
          <TabsTrigger value="browser">OID Browser</TabsTrigger>
        </TabsList>

        <TabsContent value="converter" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Numeric to Textual */}
            <Card>
              <CardHeader>
                <CardTitle>Numeric OID</CardTitle>
                <CardDescription>Enter numeric OID format (e.g., 1.3.6.1.2.1.1.1.0)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numeric-oid">Numeric OID</Label>
                  <Input
                    id="numeric-oid"
                    value={numericOid}
                    onChange={(e) => setNumericOid(e.target.value)}
                    placeholder="1.3.6.1.2.1.1.1.0"
                  />
                </div>
                <Button onClick={() => handleConvert("toTextual")} className="w-full">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Convert to Textual
                </Button>
              </CardContent>
            </Card>

            {/* Textual to Numeric */}
            <Card>
              <CardHeader>
                <CardTitle>Textual OID</CardTitle>
                <CardDescription>Textual OID representation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="textual-oid">Textual OID</Label>
                  <Input
                    id="textual-oid"
                    value={textualOid}
                    onChange={(e) => setTextualOid(e.target.value)}
                    placeholder="iso.org.dod.internet.mgmt.mib-2.system.sysDescr.0"
                  />
                </div>
                <Button onClick={() => handleConvert("toNumeric")} className="w-full">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Convert to Numeric
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Numeric Format</Label>
                  <div className="flex items-center gap-2">
                    <Input value={numericOid} readOnly />
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(numericOid)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Textual Format</Label>
                  <div className="flex items-center gap-2">
                    <Input value={textualOid} readOnly />
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(textualOid)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browser" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common OIDs</CardTitle>
              <CardDescription>Browse frequently used SNMP OIDs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search OIDs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-3">
                  {commonOids.map((oid, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{oid.name}</h4>
                        <Badge variant="outline">Standard</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Numeric:</span>
                          <code className="bg-muted px-2 py-1 rounded">{oid.numeric}</code>
                          <Button variant="ghost" size="sm" onClick={() => setNumericOid(oid.numeric)}>
                            Use
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Textual:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">{oid.textual}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
