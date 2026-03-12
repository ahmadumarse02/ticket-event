"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, Column } from "@/components/admin/data-table"
import { EmptyState } from "@/components/admin/empty-state"
import { StatusBadge } from "@/components/admin/status-badge"
import { Calendar, MapPin, Globe, Edit, Trash2, Eye, MoreHorizontal } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLiveData } from "@/hooks/use-live-data"
import { apiRequest } from "@/lib/api-client"
import type { MockEvent as EventRecord } from "@/lib/mock-data"

interface PriceTier {
  name: string
  minAge?: number
  maxAge?: number
  price: number
}

const priceTierSchema = z.object({
  name: z.string().min(1, "Tier name is required."),
  minAge: z.string().optional(),
  maxAge: z.string().optional(),
  price: z
    .string()
    .min(1, "Price is required.")
    .refine((value) => !Number.isNaN(Number(value)), "Enter a valid price."),
})

const eventSchema = z
  .object({
    name: z.string().min(1, "Event name is required."),
    description: z.string().optional(),
    type: z.enum(["physical", "online"]),
    status: z.enum(["draft", "published", "cancelled", "completed"]),
    venue: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    onlineUrl: z.string().optional(),
    onlinePlatform: z.string().optional(),
    startDate: z.string().min(1, "Start date is required."),
    startTime: z.string().optional(),
    endDate: z.string().min(1, "End date is required."),
    endTime: z.string().optional(),
    capacity: z.string().optional(),
    isFree: z.boolean(),
    priceTiers: z.array(priceTierSchema).default([]),
    recurrenceType: z.enum(["none", "daily", "weekly", "biweekly", "monthly", "custom"]),
    recurrenceInterval: z.string().optional(),
    recurrenceEndDate: z.string().optional(),
  })
  .refine((data) => data.recurrenceType !== "custom" || !!data.recurrenceInterval, {
    path: ["recurrenceInterval"],
    message: "Enter a recurrence interval.",
  })

type EventFormValues = z.infer<typeof eventSchema>

const defaultValues: EventFormValues = {
  name: "",
  description: "",
  type: "physical",
  status: "draft",
  venue: "",
  address: "",
  city: "",
  country: "",
  onlineUrl: "",
  onlinePlatform: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  capacity: "",
  isFree: false,
  priceTiers: [{ name: "Adult", minAge: "", maxAge: "", price: "0" }],
  recurrenceType: "none",
  recurrenceInterval: "",
  recurrenceEndDate: "",
}

export default function EventsPage() {
  const router = useRouter()
  const { data: events = [], isLoading, refresh } = useLiveData<EventRecord[]>(
    "/api/events",
    { interval: 12000 }
  )

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  })

  const { fields: priceTierFields, append, remove } = useFieldArray({
    control,
    name: "priceTiers",
  })

  const eventType = watch("type")
  const isFree = watch("isFree")
  const recurrenceType = watch("recurrenceType")

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleCreate = () => {
    setSelectedEvent(null)
    reset(defaultValues)
    setIsDialogOpen(true)
  }

  const handleEdit = (eventId: string) => {
    const event = events?.find((e) => e._id === eventId)
    if (event) {
      const startDate = new Date(event.startDate)
      const endDate = new Date(event.endDate)
      
      reset({
        name: event.name,
        description: event.description || "",
        type: event.type,
        status: event.status,
        venue: event.venue || "",
        address: event.address || "",
        city: event.city || "",
        country: event.country || "",
        onlineUrl: event.onlineUrl || "",
        onlinePlatform: event.onlinePlatform || "",
        startDate: startDate.toISOString().split("T")[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split("T")[0],
        endTime: endDate.toTimeString().slice(0, 5),
        capacity: event.capacity?.toString() || "",
        isFree: event.isFree,
        priceTiers:
          event.priceTiers.length > 0
            ? event.priceTiers.map((tier) => ({
                name: tier.name,
                minAge: tier.minAge?.toString() || "",
                maxAge: tier.maxAge?.toString() || "",
                price: tier.price.toString(),
              }))
            : [{ name: "Adult", minAge: "", maxAge: "", price: "0" }],
        recurrenceType: event.recurrence?.type || "none",
        recurrenceInterval: event.recurrence?.interval?.toString() || "",
        recurrenceEndDate: event.recurrence?.endDate
          ? new Date(event.recurrence.endDate).toISOString().split("T")[0]
          : "",
      })
      setSelectedEvent(eventId)
      setIsDialogOpen(true)
    }
  }

  const handleDelete = (eventId: string) => {
    setSelectedEvent(eventId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedEvent) {
      try {
        await apiRequest(`/api/events/${selectedEvent}`, { method: "DELETE" })
        refresh()
        toast.success("Event deleted successfully")
      } catch (error) {
        toast.error("Failed to delete event")
        console.error("[EventsPage] Delete error:", error)
      }
    }
    setIsDeleteDialogOpen(false)
    setSelectedEvent(null)
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const startDateTime = new Date(`${values.startDate}T${values.startTime || "00:00"}`).getTime()
      const endDateTime = new Date(`${values.endDate}T${values.endTime || "23:59"}`).getTime()

      const eventData = {
        name: values.name,
        description: values.description || undefined,
        type: values.type,
        status: values.status,
        venue: values.type === "physical" ? values.venue || undefined : undefined,
        address: values.type === "physical" ? values.address || undefined : undefined,
        city: values.type === "physical" ? values.city || undefined : undefined,
        country: values.type === "physical" ? values.country || undefined : undefined,
        onlineUrl: values.type === "online" ? values.onlineUrl || undefined : undefined,
        onlinePlatform: values.type === "online" ? values.onlinePlatform || undefined : undefined,
        startDate: startDateTime,
        endDate: endDateTime,
        capacity: values.capacity ? parseInt(values.capacity) : undefined,
        isFree: values.isFree,
        priceTiers: values.isFree
          ? []
          : values.priceTiers.map((tier) => ({
              name: tier.name,
              minAge: tier.minAge ? parseInt(tier.minAge) : undefined,
              maxAge: tier.maxAge ? parseInt(tier.maxAge) : undefined,
              price: parseFloat(tier.price),
            })),
        recurrence: {
          type: values.recurrenceType,
          interval: values.recurrenceInterval ? parseInt(values.recurrenceInterval) : undefined,
          endDate: values.recurrenceEndDate
            ? new Date(values.recurrenceEndDate).getTime()
            : undefined,
        },
      }

      if (selectedEvent) {
        await apiRequest(`/api/events/${selectedEvent}`, {
          method: "PUT",
          body: eventData,
        })
        refresh()
        toast.success("Event updated successfully")
      } else {
        await apiRequest("/api/events", {
          method: "POST",
          body: eventData,
        })
        refresh()
        toast.success("Event created successfully")
      }

      setIsDialogOpen(false)
      reset(defaultValues)
      setSelectedEvent(null)
    } catch (error) {
      toast.error("Failed to save event")
      console.error("[EventsPage] Save error:", error)
    }
  })

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Event",
      cell: (event) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-bg">
            {event.type === "physical" ? (
              <MapPin className="h-5 w-5 text-white" />
            ) : (
              <Globe className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <p className="font-medium">{event.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{event.type} event</p>
          </div>
        </div>
      ),
    },
    {
      key: "startDate",
      header: "Date",
      sortable: true,
      cell: (event) => (
        <div>
          <p className="font-medium">{formatDate(event.startDate)}</p>
          <p className="text-sm text-muted-foreground">{formatDateTime(event.startDate).split(", ")[1]}</p>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (event) => (
        <div>
          {event.type === "physical" ? (
            <>
              <p className="font-medium">{event.venue || "No venue"}</p>
              <p className="text-sm text-muted-foreground">{event.city || "No city"}</p>
            </>
          ) : (
            <>
              <p className="font-medium">{event.onlinePlatform || "Online"}</p>
              <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                {event.onlineUrl || "No URL"}
              </p>
            </>
          )}
        </div>
      ),
    },
    {
      key: "pricing",
      header: "Pricing",
      cell: (event) => (
        <div>
          {event.isFree ? (
            <StatusBadge status="Free" type="success" />
          ) : (
            <>
              <p className="font-medium">
                {event.priceTiers.length > 0
                  ? `${formatCurrency(Math.min(...event.priceTiers.map((t: PriceTier) => t.price)))} - ${formatCurrency(Math.max(...event.priceTiers.map((t: PriceTier) => t.price)))}`
                  : "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">{event.priceTiers.length} tier(s)</p>
            </>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (event) => <StatusBadge status={event.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (event) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(event._id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/events/${event._id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(event._id)}
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
        title="Events"
        description="Manage your physical and online events"
        icon={Calendar}
        action={{
          label: "Create Event",
          onClick: handleCreate,
        }}
      />

      {!isLoading && events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events yet"
          description="Create your first event to start selling tickets"
          action={{
            label: "Create Event",
            onClick: handleCreate,
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={events || []}
          searchPlaceholder="Search events..."
          searchKey="name"
          isLoading={isLoading}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? "Edit Event" : "Create Event"}</DialogTitle>
            <DialogDescription>
              {selectedEvent
                ? "Update the event details below"
                : "Fill in the details to create a new event"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Event Name *</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Enter event name"
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
                      placeholder="Describe your event"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Event Type</Label>
                      <Controller
                        control={control}
                        name="type"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="physical">Physical Event</SelectItem>
                              <SelectItem value="online">Online Event</SelectItem>
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
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      {...register("capacity")}
                      placeholder="Maximum attendees (leave empty for unlimited)"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-4 mt-4">
                {eventType === "physical" ? (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="venue">Venue Name</Label>
                      <Input
                        id="venue"
                        {...register("venue")}
                        placeholder="Enter venue name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        {...register("address")}
                        placeholder="Enter street address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          {...register("city")}
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          {...register("country")}
                          placeholder="Enter country"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="onlinePlatform">Platform</Label>
                      <Controller
                        control={control}
                        name="onlinePlatform"
                        render={({ field }) => (
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="zoom">Zoom</SelectItem>
                              <SelectItem value="teams">Microsoft Teams</SelectItem>
                              <SelectItem value="meet">Google Meet</SelectItem>
                              <SelectItem value="webex">Webex</SelectItem>
                              <SelectItem value="custom">Custom URL</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="onlineUrl">Event URL</Label>
                      <Input
                        id="onlineUrl"
                        {...register("onlineUrl")}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name="isFree"
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label>This is a free event</Label>
                  </div>
                  {!isFree && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        append({ name: "", minAge: "", maxAge: "", price: "0" })
                      }
                    >
                      Add Price Tier
                    </Button>
                  )}
                </div>

                {!isFree && (
                  <div className="space-y-4">
                    {priceTierFields.map((tier, index) => (
                      <Card key={tier.id}>
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm flex items-center justify-between">
                            Price Tier {index + 1}
                            {priceTierFields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 grid grid-cols-4 gap-4">
                          <div className="grid gap-2">
                            <Label>Tier Name</Label>
                            <Input
                              {...register(`priceTiers.${index}.name`)}
                              placeholder="e.g., Adult, Child"
                            />
                            {errors.priceTiers?.[index]?.name && (
                              <p className="text-xs text-destructive">
                                {errors.priceTiers[index]?.name?.message}
                              </p>
                            )}
                          </div>
                          <div className="grid gap-2">
                            <Label>Min Age</Label>
                            <Input
                              type="number"
                              {...register(`priceTiers.${index}.minAge`)}
                              placeholder="0"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Max Age</Label>
                            <Input
                              type="number"
                              {...register(`priceTiers.${index}.maxAge`)}
                              placeholder="99"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Price ($)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              {...register(`priceTiers.${index}.price`)}
                              placeholder="0.00"
                            />
                            {errors.priceTiers?.[index]?.price && (
                              <p className="text-xs text-destructive">
                                {errors.priceTiers[index]?.price?.message}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input id="startDate" type="date" {...register("startDate")} />
                    {errors.startDate && (
                      <p className="text-xs text-destructive">{errors.startDate.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input id="startTime" type="time" {...register("startTime")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input id="endDate" type="date" {...register("endDate")} />
                    {errors.endDate && (
                      <p className="text-xs text-destructive">{errors.endDate.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input id="endTime" type="time" {...register("endTime")} />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">Recurring Event</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Recurrence Pattern</Label>
                      <Controller
                        control={control}
                        name="recurrenceType"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Recurrence</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="custom">Custom Interval</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {recurrenceType === "custom" && (
                      <div className="grid gap-2">
                        <Label>Every X Days</Label>
                        <Input
                          type="number"
                          {...register("recurrenceInterval")}
                          placeholder="e.g., 3"
                        />
                        {errors.recurrenceInterval && (
                          <p className="text-xs text-destructive">
                            {errors.recurrenceInterval.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {recurrenceType !== "none" && (
                    <div className="grid gap-2 mt-4">
                      <Label>Recurrence End Date</Label>
                      <Input type="date" {...register("recurrenceEndDate")} />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gradient-bg">
                {isSubmitting ? "Saving..." : selectedEvent ? "Update Event" : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
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
