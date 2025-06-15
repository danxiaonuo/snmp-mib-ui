"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Filter, Plus, Edit, Trash2, Package, Server, Router, HardDrive } from "lucide-react"

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

  const inventory = [
    {
      id: 1,
      name: "Dell PowerEdge R740",
      category: "Server",
      location: "Rack A1",
      status: "Active",
      serialNumber: "SN123456",
      purchaseDate: "2023-01-15",
      warranty: "2026-01-15",
    },
    {
      id: 2,
      name: "Cisco Catalyst 9300",
      category: "Switch",
      location: "Rack B2",
      status: "Active",
      serialNumber: "SN789012",
      purchaseDate: "2023-03-20",
      warranty: "2026-03-20",
    },
    {
      id: 3,
      name: "HP ProLiant DL380",
      category: "Server",
      location: "Rack A2",
      status: "Maintenance",
      serialNumber: "SN345678",
      purchaseDate: "2022-11-10",
      warranty: "2025-11-10",
    },
    {
      id: 4,
      name: "Fortinet FortiGate 100F",
      category: "Firewall",
      location: "Rack C1",
      status: "Active",
      serialNumber: "SN901234",
      purchaseDate: "2023-05-05",
      warranty: "2026-05-05",
    },
    {
      id: 5,
      name: "NetApp FAS2750",
      category: "Storage",
      location: "Rack B1",
      status: "Retired",
      serialNumber: "SN567890",
      purchaseDate: "2021-08-15",
      warranty: "2024-08-15",
    },
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      Active: "default",
      Maintenance: "secondary",
      Retired: "destructive",
    } as const
    return <Badge variant={variants[status as keyof typeof variants] || "default"}>{status}</Badge>
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Server":
        return <Server className="h-4 w-4" />
      case "Switch":
      case "Router":
        return <Router className="h-4 w-4" />
      case "Storage":
        return <HardDrive className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">IT Asset Inventory</h1>
          <p className="text-muted-foreground mt-2">Manage and track all IT assets and equipment</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Asset</DialogTitle>
              <DialogDescription>Enter the details for the new IT asset</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="switch">Switch</SelectItem>
                    <SelectItem value="router">Router</SelectItem>
                    <SelectItem value="firewall">Firewall</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input id="location" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serial" className="text-right">
                  Serial Number
                </Label>
                <Input id="serial" className="col-span-3" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Add Asset</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">+12 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">198</div>
            <p className="text-xs text-muted-foreground">80% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Maintenance</CardTitle>
            <Router className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">9% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warranty Expiring</CardTitle>
            <HardDrive className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Within 90 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Inventory</CardTitle>
          <CardDescription>Complete list of IT assets and equipment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="server">Servers</SelectItem>
                <SelectItem value="switch">Switches</SelectItem>
                <SelectItem value="router">Routers</SelectItem>
                <SelectItem value="firewall">Firewalls</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Warranty</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(asset.category)}
                      <span className="font-medium">{asset.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{asset.category}</TableCell>
                  <TableCell>{asset.location}</TableCell>
                  <TableCell>{getStatusBadge(asset.status)}</TableCell>
                  <TableCell className="font-mono text-sm">{asset.serialNumber}</TableCell>
                  <TableCell>{asset.warranty}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
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
    </div>
  )
}
