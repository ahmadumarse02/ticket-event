"use client"

import { useState, useMemo } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, Column } from "@/components/admin/data-table"
import { EmptyState } from "@/components/admin/empty-state"
import { StatusBadge } from "@/components/admin/status-badge"
import { Package, Gift, Ticket, Star, Edit, Trash2, MoreHorizontal, Search, Check, CalendarDays, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MockPackage, MockEvent } from "@/lib/mock-data"
import { useLiveData } from "@/hooks/use-live-data"
import { apiRequest } from "@/lib/api-client"

interface BundleItem {
  priceTierName: string
  quantity: number
}

interface PackageFormData {
  name: string
  description: string
  type: "bundle" | "pass" | "addon"
  status: "active" | "inactive"
  price: string
  originalPrice: string
  isGlobal: boolean
  selectedEventIds: string[]
  maxQuantity: string
  totalAvailable: string
  bundleItems: BundleItem[]
  passValidDays: string
  addonType: string
}

const initialFormData: PackageFormData = {
  name: "",
  description: "",
  type: "bundle",
  status: "active",
  price: "",
  originalPrice: "",
  isGlobal: true,
  selectedEventIds: [],
  maxQuantity: "",
  totalAvailable: "",
  bundleItems: [{ priceTierName: "Adult", quantity: 2 }],
  passValidDays: "",
  addonType: "",
}

const addonTypes = [
  "VIP Upgrade",
  "Parking",
  "Meal",
  "Merchandise",
  "Early Access",
  "Meet & Greet",
  "Priority Seating",
  "Photo Package",
  "Other",
]

export default function PackagesPage() {
  const {
    data: packages = [],
    isLoading: packagesLoading,
    refresh: refreshPackages,
  } = useLiveData<MockPackage[]>("/api/packages", { interval: 12000 })

  const { data: events = [] } = useLiveData<MockEvent[]>("/api/events", {
    interval: 12000,
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [formData, setFormData] = useState<PackageFormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [eventSearch, setEventSearch] = useState("")

  const filteredEvents = useMemo(() => {
    if (!events) return []
    const q = eventSearch.toLowerCase()
    return events.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.city ?? "").toLowerCase().includes(q)
    )
  }, [events, eventSearch])

  const toggleEventSelection = (eventId: string) => {
    const ids = formData.selectedEventIds
    setFormData({
      ...formData,
      selectedEventIds: ids.includes(eventId)
        ? ids.filter(id => id !== eventId)
        : [...ids, eventId],
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bundle":
        return Gift
      case "pass":
        return Ticket
      case "addon":
        return Star
      default:
        return Package
    }
  }

  const handleCreate = () => {
    setSelectedPackage(null)
    setFormData(initialFormData)
    setEventSearch("")
    setIsDialogOpen(true)
  }

  const handleEdit = (packageId: string) => {
    const pkg = packages?.find((p) => p._id === packageId)
    if (pkg) {
      // Build pre-selected event IDs from both eventId and includedEventIds
      const existingEventIds: string[] = []
      if (pkg.includedEventIds && pkg.includedEventIds.length > 0) {
        existingEventIds.push(...pkg.includedEventIds)
      } else if (pkg.eventId) {
        existingEventIds.push(pkg.eventId)
      }

      setFormData({
        name: pkg.name,
        description: pkg.description || "",
        type: pkg.type,
        status: pkg.status,
        price: pkg.price.toString(),
        originalPrice: pkg.originalPrice?.toString() || "",
        isGlobal: pkg.isGlobal,
        selectedEventIds: existingEventIds,
        maxQuantity: pkg.maxQuantity?.toString() || "",
        totalAvailable: pkg.totalAvailable?.toString() || "",
        bundleItems: pkg.bundleItems || [{ priceTierName: "Adult", quantity: 2 }],
        passValidDays: pkg.passValidDays?.toString() || "",
        addonType: pkg.addonType || "",
      })
      setEventSearch("")
      setSelectedPackage(packageId)
      setIsDialogOpen(true)
    }
  }

  const handleDelete = (packageId: string) => {
    setSelectedPackage(packageId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedPackage) {
      try {
        await apiRequest(`/api/packages/${selectedPackage}`, { method: "DELETE" })
        refreshPackages()
        toast.success("Package deleted successfully")
      } catch (error) {
        toast.error("Failed to delete package")
        console.error("[PackagesPage] Delete error:", error)
      }
    }
    setIsDeleteDialogOpen(false)
    setSelectedPackage(null)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Please fill in required fields")
      return
    }

    setIsLoading(true)
    try {
      // Resolve event associations
      const hasSelectedEvents = !formData.isGlobal && formData.selectedEventIds.length > 0
      const eventId = hasSelectedEvents && formData.type !== "pass"
        ? formData.selectedEventIds[0]
        : undefined
      const includedEventIds = hasSelectedEvents
        ? formData.selectedEventIds
        : undefined

      const packageData = {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        status: formData.status,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        isGlobal: formData.isGlobal,
        eventId,
        includedEventIds,
        maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : undefined,
        totalAvailable: formData.totalAvailable ? parseInt(formData.totalAvailable) : undefined,
        bundleItems: formData.type === "bundle" ? formData.bundleItems : undefined,
        passValidDays: formData.type === "pass" && formData.passValidDays
          ? parseInt(formData.passValidDays)
          : undefined,
        addonType: formData.type === "addon" ? formData.addonType : undefined,
      }

      if (selectedPackage) {
        await apiRequest(`/api/packages/${selectedPackage}`, {
          method: "PUT",
          body: packageData,
        })
        refreshPackages()
        toast.success("Package updated successfully")
      } else {
        await apiRequest("/api/packages", {
          method: "POST",
          body: packageData,
        })
        refreshPackages()
        toast.success("Package created successfully")
      }

      setIsDialogOpen(false)
      setFormData(initialFormData)
      setSelectedPackage(null)
    } catch (error) {
      toast.error("Failed to save package")
      console.error("[PackagesPage] Save error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addBundleItem = () => {
    setFormData({
      ...formData,
      bundleItems: [...formData.bundleItems, { priceTierName: "", quantity: 1 }],
    })
  }

  const removeBundleItem = (index: number) => {
    setFormData({
      ...formData,
      bundleItems: formData.bundleItems.filter((_, i) => i !== index),
    })
  }

  const updateBundleItem = (index: number, field: keyof BundleItem, value: string | number) => {
    const newItems = [...formData.bundleItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, bundleItems: newItems })
  }

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Package",
      cell: (pkg) => {
        const Icon = getTypeIcon(pkg.type)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-bg">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium">{pkg.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{pkg.type}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: "description",
      header: "Description",
      cell: (pkg) => (
        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
          {pkg.description || "No description"}
        </p>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      cell: (pkg) => (
        <div>
          <p className="font-medium">{formatCurrency(pkg.price)}</p>
          {pkg.originalPrice && pkg.originalPrice > pkg.price && (
            <p className="text-sm text-muted-foreground line-through">
              {formatCurrency(pkg.originalPrice)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "availability",
      header: "Availability",
      cell: (pkg) => {
        // Gather linked event names
        const linkedIds: string[] = []
        if (pkg.includedEventIds?.length) linkedIds.push(...pkg.includedEventIds)
        else if (pkg.eventId) linkedIds.push(pkg.eventId)
        const linkedNames = linkedIds
          .map((id: string) => events?.find(e => e._id === id)?.name)
          .filter(Boolean) as string[]

        return (
          <div>
            {pkg.isGlobal ? (
              <StatusBadge status="All Events" type="info" />
            ) : linkedNames.length > 0 ? (
              <div className="space-y-1">
                {linkedNames.slice(0, 2).map((name: string) => (
                  <p key={name} className="text-xs font-medium truncate max-w-[160px]">{name}</p>
                ))}
                {linkedNames.length > 2 && (
                  <p className="text-xs text-muted-foreground">+{linkedNames.length - 2} more</p>
                )}
              </div>
            ) : (
              <StatusBadge status="No events" type="default" />
            )}
            {pkg.totalAvailable && (
              <p className="text-xs text-muted-foreground mt-1">
                {pkg.totalAvailable} available
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (pkg) => <StatusBadge status={pkg.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (pkg) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(pkg._id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(pkg._id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Packages"
        description="Manage ticket bundles, event passes, and add-ons"
        icon={Package}
        action={{
          label: "Create Package",
          onClick: handleCreate,
        }}
      />

      {!packagesLoading && packages.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No packages yet"
          description="Create your first package to offer bundles, passes, or add-ons"
          action={{
            label: "Create Package",
            onClick: handleCreate,
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={packages || []}
          searchPlaceholder="Search packages..."
          searchKey="name"
          isLoading={packagesLoading}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPackage ? "Edit Package" : "Create Package"}</DialogTitle>
            <DialogDescription>
              {selectedPackage
                ? "Update the package details below"
                : "Fill in the details to create a new package"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Family Pack, Season Pass"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what's included in this package"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Package Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "bundle" | "pass" | "addon") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bundle">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Ticket Bundle
                        </div>
                      </SelectItem>
                      <SelectItem value="pass">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4" />
                          Event Pass
                        </div>
                      </SelectItem>
                      <SelectItem value="addon">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Add-on
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Type-specific options */}
            {formData.type === "bundle" && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Bundle Contents
                    <Button variant="outline" size="sm" onClick={addBundleItem}>
                      Add Item
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.bundleItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Input
                        value={item.priceTierName}
                        onChange={(e) =>
                          updateBundleItem(index, "priceTierName", e.target.value)
                        }
                        placeholder="Ticket type (e.g., Adult)"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateBundleItem(index, "quantity", parseInt(e.target.value) || 1)
                        }
                        placeholder="Qty"
                        className="w-20"
                      />
                      {formData.bundleItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBundleItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {formData.type === "pass" && (
              <div className="grid gap-2">
                <Label>Pass Valid For (Days)</Label>
                <Input
                  type="number"
                  value={formData.passValidDays}
                  onChange={(e) => setFormData({ ...formData, passValidDays: e.target.value })}
                  placeholder="e.g., 30, 90, 365"
                />
              </div>
            )}

            {formData.type === "addon" && (
              <div className="grid gap-2">
                <Label>Add-on Type</Label>
                <Select
                  value={formData.addonType}
                  onValueChange={(value) => setFormData({ ...formData, addonType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select add-on type" />
                  </SelectTrigger>
                  <SelectContent>
                    {addonTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="originalPrice">Original Price ($)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  placeholder="For showing discounts"
                />
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-4">
              {/* All-events toggle */}
              <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                <Switch
                  checked={formData.isGlobal}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isGlobal: checked, selectedEventIds: [] })
                  }
                />
                <div>
                  <Label className="cursor-pointer">Available for all events</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formData.isGlobal
                      ? "This package will appear on every event"
                      : "Choose which events this package applies to"}
                  </p>
                </div>
              </div>

              {/* Event picker — shown when not global */}
              {!formData.isGlobal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      Select Events
                    </Label>
                    {formData.selectedEventIds.length > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full gradient-bg text-white">
                        {formData.selectedEventIds.length} selected
                      </span>
                    )}
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      className="w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Search events by name or city..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                    />
                  </div>

                  {/* Selected chips */}
                  {formData.selectedEventIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.selectedEventIds.map((id) => {
                        const ev = events?.find(e => e._id === id)
                        return ev ? (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                          >
                            {ev.name}
                            <button
                              type="button"
                              onClick={() => toggleEventSelection(id)}
                              className="hover:text-destructive ml-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ) : null
                      })}
                    </div>
                  )}

                  {/* Event list */}
                  <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                    {filteredEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {eventSearch ? "No events match your search" : "No events found"}
                      </p>
                    ) : (
                      filteredEvents.map((ev) => {
                        const isSelected = formData.selectedEventIds.includes(ev._id)
                        const startDate = new Date(ev.startDate).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })
                        return (
                          <button
                            key={ev._id}
                            type="button"
                            onClick={() => toggleEventSelection(ev._id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 ${
                              isSelected ? "bg-primary/5" : ""
                            }`}
                          >
                            <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? "gradient-bg border-transparent"
                                : "border-input bg-background"
                            }`}>
                              {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{ev.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {startDate}{ev.city ? ` · ${ev.city}` : ""}
                              </p>
                            </div>
                            <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                              ev.status === "published"
                                ? "bg-green-100 text-green-700"
                                : ev.status === "draft"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {ev.status}
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Max Per Order</Label>
                  <Input
                    type="number"
                    value={formData.maxQuantity}
                    onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
                    placeholder="Unlimited"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Total Available</Label>
                  <Input
                    type="number"
                    value={formData.totalAvailable}
                    onChange={(e) =>
                      setFormData({ ...formData, totalAvailable: e.target.value })
                    }
                    placeholder="Unlimited"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="gradient-bg">
              {isLoading ? "Saving..." : selectedPackage ? "Update Package" : "Create Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this package? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
