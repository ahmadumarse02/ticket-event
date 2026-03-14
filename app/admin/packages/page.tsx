"use client"

import { useState, useMemo } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, Column } from "@/components/admin/data-table"
import { EmptyState } from "@/components/admin/empty-state"
import { StatusBadge } from "@/components/admin/status-badge"
import { Package, Gift, Ticket, Star, Edit, Trash2, MoreHorizontal, Search, Check, CalendarDays, X } from "lucide-react"
import { useFieldArray, useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
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

const bundleItemSchema = z.object({
  priceTierName: z.string().min(1, "Tier name is required."),
  quantity: z
    .string()
    .min(1, "Quantity is required.")
    .refine(
      (value) => {
        const quantity = Number(value)
        return !Number.isNaN(quantity) && Number.isInteger(quantity) && quantity > 0
      },
      "Quantity must be a positive whole number."
    ),
})

const rawPackageSchema = z
  .object({
    name: z.string().min(1, "Package name is required."),
    description: z.string().optional(),
    type: z.enum(["bundle", "pass", "addon"]),
    status: z.enum(["active", "inactive"]),
    price: z
      .string()
      .min(1, "Price is required.")
      .refine((value) => {
        const price = Number(value)
        return !Number.isNaN(price) && price > 0
      }, "Price must be greater than 0."),
    originalPrice: z
      .string()
      .optional()
      .refine((value) => {
        if (!value) return true
        const original = Number(value)
        return !Number.isNaN(original) && original > 0
      }, "Enter a valid original price."),
    isGlobal: z.boolean(),
    selectedEventIds: z.array(z.string()).default([]),
    maxQuantity: z
      .string()
      .optional()
      .refine((value) => {
        if (!value) return true
        const maxQuantity = Number(value)
        return !Number.isNaN(maxQuantity) && Number.isInteger(maxQuantity) && maxQuantity > 0
      }, "Max per order must be a positive whole number."),
    totalAvailable: z
      .string()
      .optional()
      .refine((value) => {
        if (!value) return true
        const totalAvailable = Number(value)
        return (
          !Number.isNaN(totalAvailable) && Number.isInteger(totalAvailable) && totalAvailable > 0
        )
      }, "Total available must be a positive whole number."),
    bundleItems: z.array(bundleItemSchema).default([]),
    passValidDays: z
      .string()
      .optional()
      .refine((value) => {
        if (!value) return true
        const days = Number(value)
        return !Number.isNaN(days) && Number.isInteger(days) && days > 0
      }, "Pass valid days must be a positive whole number."),
    addonType: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const price = Number(data.price)
    const originalPrice = data.originalPrice ? Number(data.originalPrice) : undefined

    if (typeof originalPrice === "number" && !Number.isNaN(originalPrice) && originalPrice < price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["originalPrice"],
        message: "Original price must be greater than or equal to price.",
      })
    }

    if (!data.isGlobal && data.selectedEventIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selectedEventIds"],
        message: "Select at least one event.",
      })
    }

    if (data.type === "bundle" && data.bundleItems.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bundleItems"],
        message: "Add at least one bundle item.",
      })
    }

    if (data.type === "pass" && !data.passValidDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passValidDays"],
        message: "Enter how many days the pass is valid for.",
      })
    }

    if (data.type === "addon" && !data.addonType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["addonType"],
        message: "Select an add-on type.",
      })
    }
  })

const packageSchema = z.preprocess((raw) => {
  // Clear type-specific fields so hidden inputs don't block submit.
  if (!raw || typeof raw !== "object") return raw
  const record = raw as Record<string, unknown>
  const type = record.type
  const isGlobal = record.isGlobal === true

  const next: Record<string, unknown> = { ...record }

  if (type !== "bundle") next.bundleItems = []
  if (type !== "pass") next.passValidDays = ""
  if (type !== "addon") next.addonType = ""
  if (isGlobal) next.selectedEventIds = []

  return next
}, rawPackageSchema)

type PackageFormValues = z.infer<typeof packageSchema>

const packageDefaults: PackageFormValues = {
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
  bundleItems: [{ priceTierName: "Adult", quantity: "2" }],
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
  const [eventSearch, setEventSearch] = useState("")

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: packageDefaults,
  })

  const { fields: bundleFields, append, remove } = useFieldArray({
    control,
    name: "bundleItems",
  })

  const packageType = watch("type")
  const isGlobal = watch("isGlobal")
  const selectedEventIds = watch("selectedEventIds")

  const filteredEvents = useMemo(() => {
    if (!events) return []
    const q = eventSearch.toLowerCase()
    return events.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.city ?? "").toLowerCase().includes(q)
    )
  }, [events, eventSearch])

  const toggleEventSelection = (eventId: string) => {
    const ids = selectedEventIds || []
    setValue(
      "selectedEventIds",
      ids.includes(eventId) ? ids.filter((id) => id !== eventId) : [...ids, eventId],
      { shouldDirty: true }
    )
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
    reset(packageDefaults)
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

      reset({
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
        bundleItems:
          pkg.bundleItems?.length > 0
            ? pkg.bundleItems.map((item) => ({
                priceTierName: item.priceTierName,
                quantity: item.quantity.toString(),
              }))
            : [{ priceTierName: "Adult", quantity: "2" }],
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

  const onSubmit = handleSubmit(async (values) => {
    try {
      // Resolve event associations
      const hasSelectedEvents = !values.isGlobal && values.selectedEventIds.length > 0
      const eventId = hasSelectedEvents && values.type !== "pass"
        ? values.selectedEventIds[0]
        : undefined
      const includedEventIds = hasSelectedEvents
        ? values.selectedEventIds
        : undefined

      const packageData = {
        name: values.name,
        description: values.description || undefined,
        type: values.type,
        status: values.status,
        price: parseFloat(values.price),
        originalPrice: values.originalPrice ? parseFloat(values.originalPrice) : undefined,
        isGlobal: values.isGlobal,
        eventId,
        includedEventIds,
        maxQuantity: values.maxQuantity ? parseInt(values.maxQuantity) : undefined,
        totalAvailable: values.totalAvailable ? parseInt(values.totalAvailable) : undefined,
        bundleItems:
          values.type === "bundle"
            ? values.bundleItems.map((item) => ({
                priceTierName: item.priceTierName,
                quantity: parseInt(item.quantity),
              }))
            : undefined,
        passValidDays: values.type === "pass" && values.passValidDays
          ? parseInt(values.passValidDays)
          : undefined,
        addonType: values.type === "addon" ? values.addonType : undefined,
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
      reset(packageDefaults)
      setSelectedPackage(null)
    } catch (error) {
      toast.error("Failed to save package")
      console.error("[PackagesPage] Save error:", error)
    }
  })

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

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Family Pack, Season Pass"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe what's included in this package"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Package Type *</Label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
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
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Type-specific options */}
            {packageType === "bundle" && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Bundle Contents
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ priceTierName: "", quantity: "1" })}
                    >
                      Add Item
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bundleFields.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <Input
                          {...register(`bundleItems.${index}.priceTierName`)}
                          placeholder="Ticket type (e.g., Adult)"
                          className="flex-1"
                        />
                        {errors.bundleItems?.[index]?.priceTierName && (
                          <p className="text-xs text-destructive">
                            {errors.bundleItems[index]?.priceTierName?.message}
                          </p>
                        )}
                      </div>
                      <div className="w-20 space-y-1">
                        <Input
                          type="number"
                          {...register(`bundleItems.${index}.quantity`)}
                          placeholder="Qty"
                          className="w-20"
                        />
                        {errors.bundleItems?.[index]?.quantity && (
                          <p className="text-xs text-destructive">
                            {errors.bundleItems[index]?.quantity?.message}
                          </p>
                        )}
                      </div>
                      {bundleFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {packageType === "pass" && (
              <div className="grid gap-2">
                <Label>Pass Valid For (Days)</Label>
                <Input
                  type="number"
                  {...register("passValidDays")}
                  placeholder="e.g., 30, 90, 365"
                />
                {errors.passValidDays && (
                  <p className="text-xs text-destructive">{errors.passValidDays.message}</p>
                )}
              </div>
            )}

            {packageType === "addon" && (
              <div className="grid gap-2">
                <Label>Add-on Type</Label>
                <Controller
                  control={control}
                  name="addonType"
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
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
                  )}
                />
                {errors.addonType && (
                  <p className="text-xs text-destructive">{errors.addonType.message}</p>
                )}
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
                  {...register("price")}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-xs text-destructive">{errors.price.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="originalPrice">Original Price ($)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  {...register("originalPrice")}
                  placeholder="For showing discounts"
                />
                {errors.originalPrice && (
                  <p className="text-xs text-destructive">{errors.originalPrice.message}</p>
                )}
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-4">
              {/* All-events toggle */}
              <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                <Controller
                  control={control}
                  name="isGlobal"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        if (checked) {
                          setValue("selectedEventIds", [], { shouldDirty: true })
                        }
                      }}
                    />
                  )}
                />
                <div>
                  <Label className="cursor-pointer">Available for all events</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isGlobal
                      ? "This package will appear on every event"
                      : "Choose which events this package applies to"}
                  </p>
                </div>
              </div>

              {/* Event picker — shown when not global */}
              {!isGlobal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      Select Events
                    </Label>
                    {(selectedEventIds?.length || 0) > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full gradient-bg text-white">
                        {selectedEventIds.length} selected
                      </span>
                    )}
                  </div>
                  {errors.selectedEventIds &&
                    typeof errors.selectedEventIds === "object" &&
                    "message" in errors.selectedEventIds && (
                      <p className="text-xs text-destructive">
                        {String(errors.selectedEventIds.message)}
                      </p>
                    )}

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
                  {(selectedEventIds?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEventIds.map((id) => {
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
                        const isSelected = selectedEventIds?.includes(ev._id)
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
                    {...register("maxQuantity")}
                    placeholder="Unlimited"
                  />
                  {errors.maxQuantity && (
                    <p className="text-xs text-destructive">{errors.maxQuantity.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Total Available</Label>
                  <Input
                    type="number"
                    {...register("totalAvailable")}
                    placeholder="Unlimited"
                  />
                  {errors.totalAvailable && (
                    <p className="text-xs text-destructive">{errors.totalAvailable.message}</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gradient-bg">
                {isSubmitting ? "Saving..." : selectedPackage ? "Update Package" : "Create Package"}
              </Button>
            </DialogFooter>
          </form>
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
