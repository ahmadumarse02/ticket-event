"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Calendar,
  ChevronLeft,
  Globe,
  MapPin,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/admin/status-badge"
import { useLiveData } from "@/hooks/use-live-data"
import type { MockEvent as EventRecord } from "@/lib/mock-data"

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

const formatDateTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id

  const { data: event, isLoading: eventLoading } = useLiveData<EventRecord>(
    `/api/events/${eventId}`,
    { enabled: !!eventId, interval: 12000 }
  )
  const { data: latestEvents = [], isLoading: latestLoading } = useLiveData<EventRecord[]>(
    "/api/events?status=published&limit=6",
    { interval: 12000 }
  )

  const latestList = useMemo(() => {
    if (!latestEvents) return []
    return latestEvents.filter((item) => item._id !== eventId).slice(0, 4)
  }, [eventId, latestEvents])

  if (!eventId || eventLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Card className="overflow-hidden">
          <div className="h-48 w-full skeleton" />
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-7 w-2/3" />
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

  if (!event) {
    return (
      <Card className="glass-card">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl gradient-bg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Event not found</h1>
            <p className="mt-2 text-muted-foreground">
              This event might have been deleted or is no longer available.
            </p>
          </div>
          <Button onClick={() => router.push("/admin/events")} className="gradient-bg">
            Back to Events
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isOnline = event.type === "online"
  const isFree = event.isFree || event.priceTiers.length === 0
  const priceRange = isFree
    ? "Free"
    : `${formatCurrency(Math.min(...event.priceTiers.map((tier) => tier.price)))} - ${formatCurrency(
        Math.max(...event.priceTiers.map((tier) => tier.price))
      )}`

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/events")}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Events
        </Button>
        <StatusBadge status={event.status} />
        <Badge variant="secondary" className="capitalize">
          {event.type} event
        </Badge>
      </div>

      <Card className="relative overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-cyan-600/10" />
        <div className="absolute right-8 top-8 h-24 w-24 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-6 left-10 h-24 w-24 rounded-full bg-cyan-500/20 blur-3xl" />

        <CardContent className="relative grid gap-8 p-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-bg">
                <Ticket className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Event detail
                </p>
                <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
              </div>
            </div>
            {event.description && (
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  {formatDate(event.startDate)} • {formatTime(event.startDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Globe className="h-4 w-4 text-primary" />
                ) : (
                  <MapPin className="h-4 w-4 text-primary" />
                )}
                <span>
                  {isOnline
                    ? event.onlinePlatform || "Online"
                    : event.venue || event.city || "Location TBD"}
                </span>
              </div>
            </div>
            {event.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs uppercase tracking-wide">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Quick summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold">{priceRange}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-semibold">
                  {event.capacity ? event.capacity.toLocaleString() : "Unlimited"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">End</span>
                <span className="font-semibold">{formatDateTime(event.endDate)}</span>
              </div>
              <Button className="w-full gradient-bg hover:opacity-90">
                View ticket sales
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Start date</span>
              <span className="font-semibold">{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Start time</span>
              <span className="font-semibold">{formatTime(event.startDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End date</span>
              <span className="font-semibold">{formatDate(event.endDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End time</span>
              <span className="font-semibold">{formatTime(event.endDate)}</span>
            </div>
            <div className="mt-3 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
              Recurrence:{" "}
              <span className="font-semibold text-foreground">
                {event.recurrence?.type || "none"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isOnline ? (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4 text-primary" />
                  <span>{event.onlinePlatform || "Online event"}</span>
                </div>
                <p className="break-all text-sm">
                  {event.onlineUrl || "Online URL will be shared with attendees."}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{event.venue || "Venue TBD"}</span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{event.address || "Address details will be provided."}</p>
                  <p>
                    {[event.city, event.country].filter(Boolean).join(", ") || "City TBD"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Pricing tiers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isFree ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">
                This event is free to attend.
              </div>
            ) : (
              event.priceTiers.map((tier) => (
                <div key={tier.name} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{tier.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tier.minAge || tier.maxAge
                        ? `Ages ${tier.minAge || 0}-${tier.maxAge || 99}`
                        : "All ages"}
                    </p>
                  </div>
                  <span className="font-semibold">{formatCurrency(tier.price)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Audience & notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Ticket types, sales channels, and attendee notes can be managed from the Tickets
            section once this event is live.
          </p>
          <p>
            Last updated:{" "}
            <span className="text-foreground font-medium">
              {formatDateTime(event.updatedAt)}
            </span>
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Latest events</h2>
            <p className="text-sm text-muted-foreground">
              Freshly published experiences for your audience.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/events">View all</Link>
          </Button>
        </div>

        {latestLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-32" />
            ))}
          </div>
        ) : latestList.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No other published events yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {latestList.map((item) => (
              <Link key={item._id} href={`/admin/events/${item._id}`}>
                <Card className="group h-full overflow-hidden border-border card-hover">
                  <CardContent className="relative flex h-full flex-col gap-3 p-4">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.startDate)} · {formatTime(item.startDate)}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {item.isFree || item.priceTiers.length === 0
                          ? "Free"
                          : formatCurrency(
                              Math.min(...item.priceTiers.map((tier) => tier.price))
                            )}
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary">
                        View
                        <ChevronLeft className="h-3 w-3 rotate-180" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
