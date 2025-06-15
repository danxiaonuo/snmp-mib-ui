"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Copy, Download, Upload } from "lucide-react"

interface ConfigTemplate {
  id: string
  name: string
  description: string
  deviceType: string
  category: string
  oidCount: number
  lastModified: string
  isDefault: boolean
  author: string
}

export default function ConfigTemplatesPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<ConfigTemplate[]>([
    {
      id: "1",
      name: "Cisco Router Standard",
      description: "Standard monitoring template for Cisco routers",
      deviceType: "router",
      category: "Network",
      oidCount: 45,
      lastModified: "2024-01-15",
      isDefault: true,
      author: "Evan",
    },
    {
      id: "2",
      name: "Linux Server Basic",
      description: "Basic monitoring for Linux servers",
      deviceType: "server",
      category: "Server",
      oidCount: 32,
      lastModified: "2024-01-14",
      isDefault: false,
      author: "Evan",
    },
    {
      id: "3",
      name: "Switch Interface Monitoring",
      description: "Comprehensive switch interface monitoring",
      deviceType: "switch",
      category: "Network",
      oidCount: 67,
      lastModified: "2024-01-13",
      isDefault: false,
      author: "Evan",
    },
  ])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    deviceType: "",
    category: "",
  })

  const categories = ["all", "Network", "Server", "Security", "Custom"]
  const deviceTypes = ["router", "switch", "server", "firewall", "access_point", "printer"]

  const filteredTemplates = templates.filter(
    (template) => selectedCategory === "all" || template.category === selectedCategory,
  )

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.deviceType || !newTemplate.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const template: ConfigTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description,
      deviceType: newTemplate.deviceType,
      category: newTemplate.category,
      oidCount: 0,
      lastModified: new Date().toISOString().split("T")[0],
      isDefault: false,
      author: "Evan",
    }

    setTemplates([...templates, template])
    setNewTemplate({ name: "", description: "", deviceType: "", category: "" })
    setIsCreateDialogOpen(false)

    toast({
      title: "Success",
      description: "Template created successfully",
    })
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedTemplates = JSON.parse(content)

        if (Array.isArray(importedTemplates)) {
          setTemplates([...templates, ...importedTemplates])
          toast({
            title: "Success",
            description: `Imported ${importedTemplates.length} templates`,
          })
        } else {
          throw new Error("Invalid file format")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import templates. Please check file format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const handleExportTemplates = () => {
    const dataStr = JSON.stringify(templates, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `config-templates-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Templates exported successfully",
    })
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id))
    toast({
      title: "Success",
      description: "Template deleted successfully",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuration Templates</h1>
          <p className="text-muted-foreground">Manage reusable monitoring configuration templates</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    placeholder="My Custom Template"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device-type">Device Type *</Label>
                  <Select
                    value={newTemplate.deviceType}
                    onValueChange={(value) => setNewTemplate({ ...newTemplate, deviceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Template description..."
                  rows={3}
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={newTemplate.category}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((cat) => cat !== "all")
                      .map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>Create Template</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Label>Category:</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                    </div>
                    {template.isDefault && <Badge variant="secondary">Default</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Device Type:</span>
                      <p className="font-medium capitalize">{template.deviceType}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <p className="font-medium">{template.category}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">OIDs:</span>
                      <p className="font-medium">{template.oidCount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Author:</span>
                      <p className="font-medium">{template.author}</p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">Last modified: {template.lastModified}</div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(template, null, 2))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!template.isDefault && (
                      <Button variant="outline" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="import-export" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Templates
                </CardTitle>
                <CardDescription>Import templates from JSON file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="import-file">Select JSON File</Label>
                  <Input id="import-file" type="file" accept=".json" onChange={handleImportFile} />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Supported format: JSON array of template objects</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Templates
                </CardTitle>
                <CardDescription>Export all templates to JSON file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Export all {templates.length} templates as JSON file</p>
                </div>
                <Button onClick={handleExportTemplates} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Templates
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
