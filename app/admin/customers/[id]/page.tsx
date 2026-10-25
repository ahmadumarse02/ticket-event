"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Calendar,
  ChevronLeft,
  ClipboardList,
  DollarSign,
  Mail,
  Phone,
  Tag,
  Ticket,
  User,
} from "lucide-react"
import { z } from "zod"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useLiveData } from "@/hooks/use-live-data"
import { apiRequest } from "@/lib/api-client"
import type { MockCustomer, MockTicket, MockTransaction } from "@/lib/mock-data"

type CustomerNote = {
  _id: string
  customerId: string
  body: string
  actorName?: string | null
  createdAt: number
  updatedAt: number
}

type CustomerFollowUp = {
  _id: string
  customerId: string
  title: string
  notes?: string | null
  dueAt: number
  status: "open" | "completed" | "cancelled"
  priority: "low" | "medium" | "high"
  completedAt?: number | null
  createdAt: number
  updatedAt: number
}

const noteSchema = z.object({
  body: z.string().min(1, "Note is required."),
})

type NoteValues = z.infer<typeof noteSchema>

const followUpSchema = z
  .object({
    title: z.string().min(1, "Title is required."),
    dueDate: z.string().min(1, "Due date is required."),
    priority: z.enum(["low", "medium", "high"]),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const timestamp = new Date(data.dueDate).getTime()
    if (Number.isNaN(timestamp)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDate"],
        message: "Enter a valid due date.",
      })
    }
  })

type FollowUpValues = z.infer<typeof followUpSchema>

const formatDateTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)

export default function CustomerProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id

  const { data: customer, isLoading: customerLoading, refresh: refreshCustomer } = useLiveData<MockCustomer>(
    `/api/customers/${customerId}`,
    { enabled: !!customerId, interval: 12000 }
  )

  const { data: transactions = [], isLoading: transactionsLoading, refresh: refreshTransactions } = useLiveData<MockTransaction[]>(
    `/api/transactions?customerId=${customerId}`,
    { enabled: !!customerId, interval: 12000 }
  )

  const { data: tickets = [], refresh: refreshTickets } = useLiveData<MockTicket[]>(
    `/api/tickets?customerId=${customerId}`,
    { enabled: !!customerId, interval: 12000 }
  )

  const { data: notes = [], refresh: refreshNotes } = useLiveData<CustomerNote[]>(
    `/api/customers/${customerId}/notes`,
    { enabled: !!customerId, interval: 12000 }
  )

  const { data: followUps = [], refresh: refreshFollowUps } = useLiveData<CustomerFollowUp[]>(
    `/api/customers/${customerId}/follow-ups`,
    { enabled: !!customerId, interval: 12000 }
  )

  const [tagDraft, setTagDraft] = useState("")
  const [isSavingTags, setIsSavingTags] = useState(false)

  const {
    register: registerNote,
    handleSubmit: handleSubmitNote,
    reset: resetNote,
    formState: { errors: noteErrors, isSubmitting: isSubmittingNote },
  } = useForm<NoteValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { body: "" },
  })

  const {
    register: registerFollowUp,
    control: controlFollowUp,
    handleSubmit: handleSubmitFollowUp,
    reset: resetFollowUp,
    formState: { errors: followUpErrors, isSubmitting: isSubmittingFollowUp },
  } = useForm<FollowUpValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      title: "",
      dueDate: "",
      priority: "medium",
      notes: "",
    },
  })

  const segmentTags = customer?.segmentTags || []

  const metrics = useMemo(() => {
    const orderCount = transactions.length
    const lastPurchase = transactions.length
      ? Math.max(...transactions.map((tx) => tx.createdAt))
      : null
    const checkedInCount = tickets.filter((t) => t.status === "checked_in").length
    const totalTickets = tickets.length
    const checkInRate = totalTickets ? Math.round((checkedInCount / totalTickets) * 100) : 0
    const openFollowUps = followUps.filter((f) => f.status === "open").length

    return {
      orderCount,
      lastPurchase,
      checkedInCount,
      totalTickets,
      checkInRate,
      openFollowUps,
    }
  }, [followUps, tickets, transactions])

  const handleAddTag = async () => {
    const cleaned = tagDraft.trim()
    if (!cleaned || !customer) return
    if (segmentTags.map((t) => t.toLowerCase()).includes(cleaned.toLowerCase())) {
      setTagDraft("")
      return
    }

    setIsSavingTags(true)
    try {
      await apiRequest(`/api/customers/${customer._id}`, {
        method: "PUT",
        body: {
          ...customer,
          segmentTags: [...segmentTags, cleaned],
        },
      })
      setTagDraft("")
      refreshCustomer()
      toast.success("Segment tags updated")
    } catch (error) {
      toast.error("Failed to update tags")
    } finally {
      setIsSavingTags(false)
    }
  }

  const handleRemoveTag = async (tag: string) => {
    if (!customer) return
    setIsSavingTags(true)
    try {
      await apiRequest(`/api/customers/${customer._id}`, {
        method: "PUT",
        body: {
          ...customer,
          segmentTags: segmentTags.filter((t) => t !== tag),
        },
      })
      refreshCustomer()
      toast.success("Segment tags updated")
    } catch (error) {
      toast.error("Failed to update tags")
    } finally {
      setIsSavingTags(false)
    }
  }

  const onSubmitNote = handleSubmitNote(async (values) => {
    if (!customerId) return
    try {
      await apiRequest(`/api/customers/${customerId}/notes`, {
        method: "POST",
        body: { body: values.body },
      })
      resetNote({ body: "" })
      refreshNotes()
      toast.success("Note added")
    } catch (error) {
      toast.error("Failed to add note")
    }
  })

  const deleteNote = async (noteId: string) => {
    try {
      await apiRequest(`/api/customers/${customerId}/notes/${noteId}`, { method: "DELETE" })
      refreshNotes()
      toast.success("Note deleted")
    } catch (error) {
      toast.error("Failed to delete note")
    }
  }

  const onSubmitFollowUp = handleSubmitFollowUp(async (values) => {
    if (!customerId) return
    try {
      await apiRequest(`/api/customers/${customerId}/follow-ups`, {
        method: "POST",
        body: {
          title: values.title,
          notes: values.notes || undefined,
          priority: values.priority,
          dueAt: new Date(values.dueDate).getTime(),
        },
      })
      resetFollowUp({ title: "", dueDate: "", priority: "medium", notes: "" })
      refreshFollowUps()
      toast.success("Reminder added")
    } catch (error) {
      toast.error("Failed to add reminder")
    }
  })

  const markFollowUpComplete = async (followUpId: string) => {
    try {
      await apiRequest(`/api/customers/${customerId}/follow-ups/${followUpId}`, {
        method: "PUT",
        body: { status: "completed" },
      })
      refreshFollowUps()
      toast.success("Reminder completed")
    } catch (error) {
      toast.error("Failed to update reminder")
    }
  }

  const deleteFollowUp = async (followUpId: string) => {
    try {
      await apiRequest(`/api/customers/${customerId}/follow-ups/${followUpId}`, {
        method: "DELETE",
      })
      refreshFollowUps()
      toast.success("Reminder deleted")
    } catch (error) {
      toast.error("Failed to delete reminder")
    }
  }

  if (!customerId || customerLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Card className="glass-card">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <Card className="glass-card">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl gradient-bg">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Customer not found</h1>
            <p className="mt-2 text-muted-foreground">This customer may have been deleted.</p>
          </div>
          <Button onClick={() => router.push("/admin/customers")} className="gradient-bg">
            Back to Customers
          </Button>
        </CardContent>
      </Card>
    )
  }

  const initials = `${customer.firstName?.[0] || ""}${customer.lastName?.[0] || ""}`.toUpperCase()

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/customers")}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Customers
        </Button>
        <Badge variant="secondary" className="capitalize">
          Customer profile
        </Badge>
      </div>

      <Card className="relative overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-amber-500/10" />
        <CardContent className="relative grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="gradient-bg text-white font-semibold">
                  {initials || "CU"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Customer
                </p>
                <h1 className="text-3xl font-bold tracking-tight">
                  {customer.firstName} {customer.lastName}
                </h1>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="break-all">{customer.email}</span>
              </div>
              {customer.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{customer.phone}</span>
                </div>
              ) : null}
              {customer.city || customer.country ? (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    {[customer.city, customer.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span>{segmentTags.length ? `${segmentTags.length} segment tags` : "No segments yet"}</span>
              </div>
            </div>

            {segmentTags.length ? (
              <div className="flex flex-wrap gap-2">
                {segmentTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                      disabled={isSavingTags}
                      aria-label={`Remove ${tag}`}
                    >
                      x
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                placeholder="Add segment tag (e.g., vip)"
                className="max-w-xs"
                disabled={isSavingTags}
              />
              <Button onClick={handleAddTag} disabled={!tagDraft.trim() || isSavingTags} className="gradient-bg">
                {isSavingTags ? "Saving..." : "Add tag"}
              </Button>
            </div>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Total spent
                </span>
                <span className="font-semibold">{formatCurrency(customer.totalSpent || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> Orders
                </span>
                <span className="font-semibold">{metrics.orderCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Ticket className="h-4 w-4" /> Tickets
                </span>
                <span className="font-semibold">{metrics.totalTickets}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Check-in rate</span>
                <span className="font-semibold">{metrics.checkInRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Open reminders</span>
                <span className="font-semibold">{metrics.openFollowUps}</span>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                Last purchase:{" "}
                <span className="font-medium text-foreground">
                  {metrics.lastPurchase ? formatDateTime(metrics.lastPurchase) : "No purchases yet"}
                </span>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Purchase history</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/transactions?customerId=${customer._id}`}>View in transactions</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {transactionsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No purchases yet.</p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 12).map((tx) => (
                  <div
                    key={tx._id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{tx.transactionNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(tx.createdAt)}{" "}
                        {tx.event?.name ? `· ${tx.event.name}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <Badge variant="outline" className="text-xs capitalize">
                        {tx.status.replaceAll("_", " ")}
                      </Badge>
                      <span className="font-semibold">{formatCurrency(tx.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets issued yet.</p>
            ) : (
              <div className="space-y-2">
                {tickets.slice(0, 8).map((ticket) => (
                  <div key={ticket._id} className="rounded-lg border border-border bg-background/40 p-3">
                    <p className="text-xs text-muted-foreground">Ticket</p>
                    <p className="font-medium break-all">{ticket._id}</p>
                    <p className="text-xs text-muted-foreground capitalize">Status: {ticket.status.replaceAll("_", " ")}</p>
                    {ticket.seatSection && ticket.seatRow && ticket.seatNumber ? (
                      <p className="text-xs text-muted-foreground">
                        Seat: {ticket.seatSection} {ticket.seatRow}-{ticket.seatNumber}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">CRM notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmitNote} className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="noteBody">Add a note</Label>
                <Textarea
                  id="noteBody"
                  rows={3}
                  placeholder="Write a quick context note for the team..."
                  {...registerNote("body")}
                />
                {noteErrors.body && (
                  <p className="text-xs text-destructive">{noteErrors.body.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isSubmittingNote} className="gradient-bg">
                {isSubmittingNote ? "Saving..." : "Add note"}
              </Button>
            </form>

            <Separator />

            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.slice(0, 10).map((note) => (
                  <div key={note._id} className="rounded-lg border border-border bg-background/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        {note.actorName ? `${note.actorName} · ` : ""}
                        {formatDateTime(note.createdAt)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteNote(note._id)}
                      >
                        Delete
                      </Button>
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{note.body}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Follow-up reminders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmitFollowUp} className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="followTitle">Title</Label>
                <Input id="followTitle" placeholder="e.g., Send VIP invite" {...registerFollowUp("title")} />
                {followUpErrors.title && (
                  <p className="text-xs text-destructive">{followUpErrors.title.message}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Due date</Label>
                  <Input type="date" {...registerFollowUp("dueDate")} />
                  {followUpErrors.dueDate && (
                    <p className="text-xs text-destructive">{followUpErrors.dueDate.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Controller
                    control={controlFollowUp}
                    name="priority"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes (optional)</Label>
                <Textarea rows={2} placeholder="Optional details..." {...registerFollowUp("notes")} />
              </div>
              <Button type="submit" disabled={isSubmittingFollowUp} className="gradient-bg">
                {isSubmittingFollowUp ? "Saving..." : "Add reminder"}
              </Button>
            </form>

            <Separator />

            {followUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reminders yet.</p>
            ) : (
              <div className="space-y-3">
                {followUps.slice(0, 12).map((reminder) => (
                  <div key={reminder._id} className="rounded-lg border border-border bg-background/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDateTime(reminder.dueAt)} · {reminder.priority.toUpperCase()} ·{" "}
                          {reminder.status.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {reminder.status === "open" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markFollowUpComplete(reminder._id)}
                          >
                            Complete
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteFollowUp(reminder._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {reminder.notes ? (
                      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{reminder.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

