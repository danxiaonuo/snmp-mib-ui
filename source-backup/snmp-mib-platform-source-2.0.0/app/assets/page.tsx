"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Server,
  Router,
  Smartphone,
  Monitor,
  Plus,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  Search,
} from "lucide-react"

export default function AssetsPage() {
  const [assets, setAssets] = useState([
    {
      id: 1,
      name: "Core Switch 01",
      type: "Network Switch",
      category: "Network Equipment",
      model: "Cisco Catalyst 9300",
      serialNumber: "FCW2140L0GH",
      location: "Data Center A - Rack 12",
      status: "Active",
      purchaseDate: "2023-01-15",
      warrantyExpiry: "2026-01-15",
      cost: 15000,
      vendor: "Cisco Systems",
      assignedTo: "Network Team",
      lastMaintenance: "2024-01-10",
      nextMaintenance: "2024-04-10",
      ipAddress: "192.168.1.10",
      macAddress: "00:1B:44:11:3A:B7",
    },
    {
      id: 2,
      name: "Database Server 01",
      type: "Server",
      category: "Computing Equipment",
      model: "Dell PowerEdge R740",
      serialNumber: "BXPGK63",
      location: "Data Center A - Rack 5",
      status: "Active",
      purchaseDate: "2023-03-20",
      warrantyExpiry: "2026-03-20",
      cost: 25000,
      vendor: "Dell Technologies",
      assignedTo: "Database Team",
      lastMaintenance: "2024-01-05",
      nextMaintenance: "2024-04-05",
      ipAddress: "192.168.1.50",
      macAddress: "00:14:22:01:23:45",
    },
    {
      id: 3,
      name: "Edge Router 03",
      type: "Router",
      category: "Network Equipment",
      model: "Juniper MX204",
      serialNumber: "JN118E6AFG",
      location: "Branch Office B",
      status: "Maintenance",
      purchaseDate: "2022-11-10",
      warrantyExpiry: "2025-11-10",
      cost: 35000,
      vendor: "Juniper Networks",
      assignedTo: "Network Team",
      lastMaintenance: "2024-01-18",
      nextMaintenance: "2024-02-18",
      ipAddress: "10.0.1.1",
      macAddress: "00:05:85:12:34:56",
    },
    {
      id: 4,
      name: "Workstation 15",
      type: "Desktop",
      category: "End User Equipment",
      model: "HP EliteDesk 800 G9",
      serialNumber: "8CG3456789",
      location: "Office Floor 3 - Desk 15",
      status: "Active",
      purchaseDate: "2023-06-01",
      warrantyExpiry: "2026-06-01",
      cost: 1200,
      vendor: "HP Inc.",
      assignedTo: "John Smith",
      lastMaintenance: "2023-12-15",
      nextMaintenance: "2024-06-15",
      ipAddress: "192.168.10.15",
      macAddress: "98:90:96:C0:12:34",
    },
  ])

  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "Maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
      case "Retired":
        return <Badge variant="secondary">Retired</Badge>
      case "Disposed":
        return <Badge variant="destructive">Disposed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "server":
        return <Server className="h-4 w-4" />
      case "router":
      case "network switch":
        return <Router className="h-4 w-4" />
      case "desktop":
      case "laptop":
        return <Monitor className="h-4 w-4" />
      case "mobile":
        return <Smartphone className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter
    const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleViewAsset = (asset: any) => {
    setSelectedAsset(asset)
    setIsViewDialogOpen(true)
  }

  const handleEditAsset = (asset: any) => {
    setSelectedAsset(asset)
    setIsEditDialogOpen(true)
  }

  const handleDeleteAsset = (id: number) => {
    setAssets(assets.filter((asset) => asset.id !== id))
  }

  const totalValue = assets.reduce((sum, asset) => sum + asset.cost, 0)
  const activeAssets = assets.filter((asset) => asset.status === "Active").length
  const maintenanceAssets = assets.filter((asset) => asset.status === "Maintenance").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Asset Management</h1>
          <p className="text-muted-foreground">Manage and track all organizational assets</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Asset</DialogTitle>
              <DialogDescription>Enter the details for the new asset</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="asset-name">Asset Name</Label>
                    <Input id="asset-name" placeholder="Core Switch 01" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asset-type">Asset Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="router">Router</SelectItem>
                        <SelectItem value="switch">Network Switch</SelectItem>
                        <SelectItem value="desktop">Desktop</SelectItem>
                        <SelectItem value="laptop">Laptop</SelectItem>
                        <SelectItem value="mobile">Mobile Device</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="network">Network Equipment</SelectItem>
                        <SelectItem value="computing">Computing Equipment</SelectItem>
                        <SelectItem value="storage">Storage Equipment</SelectItem>
                        <SelectItem value="enduser">End User Equipment</SelectItem>
                        <SelectItem value="security">Security Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue="Active">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                        <SelectItem value="Disposed">Disposed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" placeholder="Cisco Catalyst 9300" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serial">Serial Number</Label>
                    <Input id="serial" placeholder="FCW2140L0GH" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor</Label>
                    <Input id="vendor" placeholder="Cisco Systems" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="Data Center A - Rack 12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Additional details about the asset..." rows={3} />
                </div>
              </TabsContent>
              <TabsContent value="technical" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ip-address">IP Address</Label>
                    <Input id="ip-address" placeholder="192.168.1.10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mac-address">MAC Address</Label>
                    <Input id="mac-address" placeholder="00:1B:44:11:3A:B7" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="os">Operating System</Label>
                    <Input id="os" placeholder="Cisco IOS XE 16.12.04" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firmware">Firmware Version</Label>
                    <Input id="firmware" placeholder="16.12.04" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specifications">Technical Specifications</Label>
                  <Textarea id="specifications" placeholder="CPU, Memory, Storage, etc..." rows={4} />
                </div>
              </TabsContent>
              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase-date">Purchase Date</Label>
                    <Input id="purchase-date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Purchase Cost</Label>
                    <Input id="cost" type="number" placeholder="15000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warranty-start">Warranty Start</Label>
                    <Input id="warranty-start" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warranty-end">Warranty End</Label>
                    <Input id="warranty-end" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depreciation">Depreciation Method</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="straight-line">Straight Line</SelectItem>
                        <SelectItem value="declining-balance">Declining Balance</SelectItem>
                        <SelectItem value="sum-of-years">Sum of Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="useful-life">Useful Life (Years)</Label>
                    <Input id="useful-life" type="number" placeholder="5" />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="maintenance" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assigned-to">Assigned To</Label>
                    <Input id="assigned-to" placeholder="Network Team" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance-schedule">Maintenance Schedule</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-maintenance">Last Maintenance</Label>
                    <Input id="last-maintenance" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next-maintenance">Next Maintenance</Label>
                    <Input id="next-maintenance" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-notes">Maintenance Notes</Label>
                  <Textarea id="maintenance-notes" placeholder="Special maintenance requirements..." rows={3} />
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>Create Asset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Asset Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeAssets}</div>
            <p className="text-xs text-muted-foreground">
              {((activeAssets / assets.length) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{maintenanceAssets}</div>
            <p className="text-xs text-muted-foreground">Scheduled maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Asset portfolio value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Inventory</CardTitle>
          <CardDescription>Search and filter your asset inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Retired">Retired</SelectItem>
                <SelectItem value="Disposed">Disposed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Network Equipment">Network Equipment</SelectItem>
                <SelectItem value="Computing Equipment">Computing Equipment</SelectItem>
                <SelectItem value="Storage Equipment">Storage Equipment</SelectItem>
                <SelectItem value="End User Equipment">End User Equipment</SelectItem>
                <SelectItem value="Security Equipment">Security Equipment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(asset.type)}
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm text-muted-foreground">{asset.serialNumber}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{asset.type}</TableCell>
                  <TableCell>{asset.model}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{asset.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(asset.status)}</TableCell>
                  <TableCell>{asset.assignedTo}</TableCell>
                  <TableCell>${asset.cost.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewAsset(asset)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditAsset(asset)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAsset(asset.id)}>
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

      {/* View Asset Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogDescription>Comprehensive asset information</DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Asset Name</Label>
                    <p className="text-sm">{selectedAsset.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="text-sm">{selectedAsset.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm">{selectedAsset.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedAsset.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Model</Label>
                    <p className="text-sm">{selectedAsset.model}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Serial Number</Label>
                    <p className="text-sm">{selectedAsset.serialNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Vendor</Label>
                    <p className="text-sm">{selectedAsset.vendor}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm">{selectedAsset.location}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Assigned To</Label>
                    <p className="text-sm">{selectedAsset.assignedTo}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="technical" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">IP Address</Label>
                    <p className="text-sm">{selectedAsset.ipAddress}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">MAC Address</Label>
                    <p className="text-sm">{selectedAsset.macAddress}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Purchase Date</Label>
                    <p className="text-sm">{selectedAsset.purchaseDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Purchase Cost</Label>
                    <p className="text-sm">${selectedAsset.cost.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Warranty Expiry</Label>
                    <p className="text-sm">{selectedAsset.warrantyExpiry}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="history" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Last Maintenance</Label>
                    <p className="text-sm">{selectedAsset.lastMaintenance}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Next Maintenance</Label>
                    <p className="text-sm">{selectedAsset.nextMaintenance}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Maintenance History</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Routine maintenance completed - {selectedAsset.lastMaintenance}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Firmware updated - 2023-12-01</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>Hardware inspection - 2023-10-15</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false)
                handleEditAsset(selectedAsset)
              }}
            >
              Edit Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update asset information</DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Asset Name</Label>
                    <Input id="edit-name" defaultValue={selectedAsset.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Asset Type</Label>
                    <Select defaultValue={selectedAsset.type}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Server">Server</SelectItem>
                        <SelectItem value="Router">Router</SelectItem>
                        <SelectItem value="Network Switch">Network Switch</SelectItem>
                        <SelectItem value="Desktop">Desktop</SelectItem>
                        <SelectItem value="Laptop">Laptop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select defaultValue={selectedAsset.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                        <SelectItem value="Disposed">Disposed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-location">Location</Label>
                    <Input id="edit-location" defaultValue={selectedAsset.location} />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="technical" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-ip">IP Address</Label>
                    <Input id="edit-ip" defaultValue={selectedAsset.ipAddress} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-mac">MAC Address</Label>
                    <Input id="edit-mac" defaultValue={selectedAsset.macAddress} />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-cost">Purchase Cost</Label>
                    <Input id="edit-cost" type="number" defaultValue={selectedAsset.cost} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-warranty">Warranty Expiry</Label>
                    <Input id="edit-warranty" type="date" defaultValue={selectedAsset.warrantyExpiry} />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="maintenance" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-assigned">Assigned To</Label>
                    <Input id="edit-assigned" defaultValue={selectedAsset.assignedTo} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-next-maintenance">Next Maintenance</Label>
                    <Input id="edit-next-maintenance" type="date" defaultValue={selectedAsset.nextMaintenance} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
