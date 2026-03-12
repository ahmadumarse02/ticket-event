"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, Column } from "@/components/admin/data-table"
import { EmptyState } from "@/components/admin/empty-state"
import { StatusBadge } from "@/components/admin/status-badge"
import { Calendar, MapPin, Globe, Edit, Trash2, Eye, MoreHorizontal } from "lucide-react"
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

interface EventFormData {
  name: string
  description: string
  type: "physical" | "online"
  status: "draft" | "published" | "cancelled" | "completed"
  venue: string
  address: string
  city: string
  country: string
  onlineUrl: string
  onlinePlatform: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  capacity: string
  isFree: boolean
  priceTiers: PriceTier[]
  recurrenceType: "none" | "daily" | "weekly" | "biweekly" | "monthly" | "custom"
  recurrenceInterval: string
  recurrenceEndDate: string
}

const initialFormData: EventFormData = {
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
  priceTiers: [{ name: "Adult", price: 0 }],
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
  const [formData, setFormData] = useState<EventFormData>(initialFormData)
  const [isSaving, setIsSaving] = useState(false)

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
    setFormData(initialFormData)
    setIsDialogOpen(true)
  }

  const handleEdit = (eventId: string) => {
    const event = events?.find((e) => e._id === eventId)
    if (event) {
      const startDate = new Date(event.startDate)
      const endDate = new Date(event.endDate)
      
      setFormData({
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
        priceTiers: event.priceTiers.length > 0 ? event.priceTiers : [{ name: "Adult", price: 0 }],
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

  const handleSubmit = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in required fields")
      return
    }

    setIsSaving(true)
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime || "00:00"}`).getTime()
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime || "23:59"}`).getTime()

      const eventData = {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        status: formData.status,
        venue: formData.type === "physical" ? formData.venue || undefined : undefined,
        address: formData.type === "physical" ? formData.address || undefined : undefined,
        city: formData.type === "physical" ? formData.city || undefined : undefined,
        country: formData.type === "physical" ? formData.country || undefined : undefined,
        onlineUrl: formData.type === "online" ? formData.onlineUrl || undefined : undefined,
        onlinePlatform: formData.type === "online" ? formData.onlinePlatform || undefined : undefined,
        startDate: startDateTime,
        endDate: endDateTime,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        isFree: formData.isFree,
        priceTiers: formData.isFree ? [] : formData.priceTiers,
        recurrence: {
          type: formData.recurrenceType,
          interval: formData.recurrenceInterval ? parseInt(formData.recurrenceInterval) : undefined,
          endDate: formData.recurrenceEndDate
            ? new Date(formData.recurrenceEndDate).getTime()
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
      setFormData(initialFormData)
      setSelectedEvent(null)
    } catch (error) {
      toast.error("Failed to save event")
      console.error("[EventsPage] Save error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const addPriceTier = () => {
    setFormData({
      ...formData,
      priceTiers: [...formData.priceTiers, { name: "", price: 0 }],
    })
  }

  const removePriceTier = (index: number) => {
    setFormData({
      ...formData,
      priceTiers: formData.priceTiers.filter((_, i) => i !== index),
    })
  }

  const updatePriceTier = (index: number, field: keyof PriceTier, value: string | number) => {
    const newTiers = [...formData.priceTiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    setFormData({ ...formData, priceTiers: newTiers })
  }

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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter event name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your event"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Event Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "physical" | "online") =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">Physical Event</SelectItem>
                        <SelectItem value="online">Online Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "draft" | "published" | "cancelled" | "completed") =>
                        setFormData({ ...formData, status: value })
                      }
                    >
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
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Maximum attendees (leave empty for unlimited)"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-4">
              {formData.type === "physical" ? (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="venue">Venue Name</Label>
                    <Input
                      id="venue"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="Enter venue name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter street address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="onlinePlatform">Platform</Label>
                    <Select
                      value={formData.onlinePlatform}
                      onValueChange={(value) =>
                        setFormData({ ...formData, onlinePlatform: value })
                      }
                    >
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
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="onlineUrl">Event URL</Label>
                    <Input
                      id="onlineUrl"
                      value={formData.onlineUrl}
                      onChange={(e) => setFormData({ ...formData, onlineUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isFree}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isFree: checked })
                    }
                  />
                  <Label>This is a free event</Label>
                </div>
                {!formData.isFree && (
                  <Button variant="outline" onClick={addPriceTier}>
                    Add Price Tier
                  </Button>
                )}
              </div>

              {!formData.isFree && (
                <div className="space-y-4">
                  {formData.priceTiers.map((tier, index) => (
                    <Card key={index}>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          Price Tier {index + 1}
                          {formData.priceTiers.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePriceTier(index)}
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
                            value={tier.name}
                            onChange={(e) => updatePriceTier(index, "name", e.target.value)}
                            placeholder="e.g., Adult, Child"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Min Age</Label>
                          <Input
                            type="number"
                            value={tier.minAge || ""}
                            onChange={(e) =>
                              updatePriceTier(index, "minAge", parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Max Age</Label>
                          <Input
                            type="number"
                            value={tier.maxAge || ""}
                            onChange={(e) =>
                              updatePriceTier(index, "maxAge", parseInt(e.target.value) || 0)
                            }
                            placeholder="99"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Price ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={tier.price}
                            onChange={(e) =>
                              updatePriceTier(index, "price", parseFloat(e.target.value) || 0)
                            }
                            placeholder="0.00"
                          />
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
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Recurring Event</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Recurrence Pattern</Label>
                    <Select
                      value={formData.recurrenceType}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, recurrenceType: value })
                      }
                    >
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
                  </div>
                  {formData.recurrenceType === "custom" && (
                    <div className="grid gap-2">
                      <Label>Every X Days</Label>
                      <Input
                        type="number"
                        value={formData.recurrenceInterval}
                        onChange={(e) =>
                          setFormData({ ...formData, recurrenceInterval: e.target.value })
                        }
                        placeholder="e.g., 3"
                      />
                    </div>
                  )}
                </div>
                {formData.recurrenceType !== "none" && (
                  <div className="grid gap-2 mt-4">
                    <Label>Recurrence End Date</Label>
                    <Input
                      type="date"
                      value={formData.recurrenceEndDate}
                      onChange={(e) =>
                        setFormData({ ...formData, recurrenceEndDate: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="gradient-bg">
              {isSaving ? "Saving..." : selectedEvent ? "Update Event" : "Create Event"}
            </Button>
          </DialogFooter>
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
