"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Globe,
  MapPin,
  Aperture,
  Ticket,
  Users,
} from "lucide-react"
import { SiteHeader } from "@/components/public/site-header"
import { SiteFooter } from "@/components/public/site-footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useLiveData } from "@/hooks/use-live-data"
import { cn } from "@/lib/utils"
import type { MockEvent as EventRecord, MockTicket } from "@/lib/mock-data"

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

const formatShortDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString("en-US", {
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
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id

  const { data: event, isLoading: eventLoading } = useLiveData<EventRecord>(
    `/api/events/${eventId}`,
    { enabled: !!eventId, interval: 12000 }
  )

  const { data: tickets = [] } = useLiveData<MockTicket[]>(
    `/api/tickets?eventId=${eventId}`,
    { enabled: !!eventId && !!event?.seatSelectionEnabled, interval: 12000 }
  )

  const { data: latestEvents = [], isLoading: latestLoading } = useLiveData<EventRecord[]>(
    "/api/events?status=published&limit=6",
    { interval: 12000 }
  )

  const [selectedSeat, setSelectedSeat] = useState<{
    section: string
    row: string
    seat: string
  } | null>(null)

  const latestList = useMemo(() => {
    if (!latestEvents) return []
    return latestEvents.filter((item) => item._id !== eventId).slice(0, 4)
  }, [eventId, latestEvents])

  const occupiedSeats = useMemo(() => {
    const occupied = new Set<string>()
    tickets.forEach((ticket) => {
      if (!ticket.seatSection || !ticket.seatRow || !ticket.seatNumber) return
      if (["cancelled", "void"].includes(ticket.status)) return
      occupied.add(`${ticket.seatSection}-${ticket.seatRow}-${ticket.seatNumber}`)
    })
    return occupied
  }, [tickets])

  if (!eventId || eventLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-6 py-20 space-y-8">
          <Skeleton className="h-4 w-32" />
          <Card className="overflow-hidden">
            <div className="h-56 w-full skeleton" />
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-6 py-24">
          <Card className="glass-card text-center">
            <CardContent className="space-y-4 p-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl gradient-bg">
                <Aperture className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Event not found</h1>
                <p className="mt-2 text-muted-foreground">
                  This event might have been moved or is no longer available.
                </p>
              </div>
              <Button asChild className="gradient-bg hover:opacity-90">
                <Link href="/">Back to home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <SiteFooter />
      </div>
    )
  }

  const isOnline = event.type === "online"
  const isFree = event.isFree || event.priceTiers.length === 0
  const minPrice = isFree ? 0 : Math.min(...event.priceTiers.map((tier) => tier.price))
  const maxPrice = isFree ? 0 : Math.max(...event.priceTiers.map((tier) => tier.price))
  const priceLabel = isFree
    ? "Free"
    : minPrice === maxPrice
      ? formatCurrency(minPrice)
      : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`

  const scheduleLabel =
    formatDate(event.startDate) === formatDate(event.endDate)
      ? `${formatDate(event.startDate)} · ${formatTime(event.startDate)} - ${formatTime(
          event.endDate
        )}`
      : `${formatDate(event.startDate)} ${formatTime(event.startDate)} → ${formatDate(
          event.endDate
        )} ${formatTime(event.endDate)}`

  const seatMap = event.seatMap
  const showSeatSelection =
    event.seatSelectionEnabled && !!seatMap && Array.isArray(seatMap.sections)
  const seatMapSections = showSeatSelection ? seatMap?.sections ?? [] : []

  return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-amber-500/10" />
        <div className="absolute -top-24 left-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20 space-y-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowUpRight className="h-4 w-4 rotate-180" />
            Back to home
          </Link>

          <Card className="relative overflow-hidden border-border animate-fade-up">
            {event.imageUrl ? (
              <div className="absolute inset-0">
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="h-full w-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/25 via-transparent to-amber-500/20" />
            )}

            <CardContent className="relative grid gap-10 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {event.type} event
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-emerald-400/40 text-emerald-200 uppercase tracking-wide"
                  >
                    {event.status}
                  </Badge>
                  {event.tags?.length ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {event.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-bg">
                      <Ticket className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Featured event
                      </p>
                      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        {event.name}
                      </h1>
                    </div>
                  </div>
                  {event.description && (
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{scheduleLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <Globe className="h-4 w-4 text-primary" />
                    ) : (
                      <MapPin className="h-4 w-4 text-primary" />
                    )}
                    <span>
                      {isOnline
                        ? event.onlinePlatform || "Online experience"
                        : event.venue || event.city || "Location TBD"}
                    </span>
                  </div>
                </div>
              </div>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base">Tickets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Price range</span>
                    <span className="font-semibold">{priceLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-semibold">
                      {event.capacity ? event.capacity.toLocaleString() : "Unlimited"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Recurrence</span>
                    <span className="font-semibold capitalize">
                      {event.recurrence?.type || "none"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Transfers</span>
                    <span className="font-semibold">
                      {event.transferRules?.enabled ? "Allowed" : "Not allowed"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Resale</span>
                    <span className="font-semibold">
                      {event.resaleRules?.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Waitlist</span>
                    <span className="font-semibold">
                      {event.waitlistEnabled ? "Available" : "Closed"}
                    </span>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Button className="w-full gradient-bg hover:opacity-90">
                      {isFree ? "Register for free" : "Get tickets"}
                    </Button>
                    {event.onlineUrl ? (
                      <Button asChild variant="outline" className="w-full">
                        <a href={event.onlineUrl} target="_blank" rel="noreferrer">
                          Join online
                          <ArrowUpRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tickets include digital QR codes and instant confirmations.
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-24 space-y-12">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Schedule
              </CardTitle>
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
              {event.timezone ? (
                <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                  Timezone: <span className="font-semibold text-foreground">{event.timezone}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {isOnline ? (
                  <Globe className="h-4 w-4 text-primary" />
                ) : (
                  <MapPin className="h-4 w-4 text-primary" />
                )}
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {isOnline ? (
                <>
                  <p className="text-muted-foreground">
                    {event.onlinePlatform || "Online event"}
                  </p>
                  <p className="break-all">
                    {event.onlineUrl || "Online URL will be shared with registered attendees."}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">{event.venue || "Venue TBD"}</p>
                  <p className="text-muted-foreground">
                    {event.address || "Address details will be shared closer to the event."}
                  </p>
                  <p className="text-muted-foreground">
                    {[event.city, event.country].filter(Boolean).join(", ") || "City TBD"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Pricing tiers
              </CardTitle>
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

        {showSeatSelection ? (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Choose your seat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                {seatMapSections.map((section) => (
                  <div key={section.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{section.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {section.rows} rows · {section.seatsPerRow} seats per row
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Select a seat
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: section.rows }).map((_, rowIndex) => {
                        const rowLabel = String.fromCharCode(65 + rowIndex)
                        return (
                          <div key={rowLabel} className="flex items-center gap-2">
                            <span className="w-6 text-xs text-muted-foreground">{rowLabel}</span>
                            <div className="flex flex-wrap gap-1">
                              {Array.from({ length: section.seatsPerRow }).map((_, seatIndex) => {
                                const seatNumber = seatIndex + 1
                                const seatKey = `${section.name}-${rowLabel}-${seatNumber}`
                                const isTaken = occupiedSeats.has(seatKey)
                                const isSelected =
                                  selectedSeat?.section === section.name &&
                                  selectedSeat?.row === rowLabel &&
                                  selectedSeat?.seat === seatNumber.toString()

                                return (
                                  <button
                                    key={seatKey}
                                    type="button"
                                    disabled={isTaken}
                                    onClick={() =>
                                      setSelectedSeat({
                                        section: section.name,
                                        row: rowLabel,
                                        seat: seatNumber.toString(),
                                      })
                                    }
                                    className={cn(
                                      "h-7 w-7 rounded border text-[10px] font-medium transition",
                                      isTaken
                                        ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                                        : "border-border bg-background hover:border-primary/50",
                                      isSelected && "border-primary bg-primary text-primary-foreground"
                                    )}
                                  >
                                    {seatNumber}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedSeat
                    ? `Selected seat: ${selectedSeat.section} Row ${selectedSeat.row} Seat ${selectedSeat.seat}`
                    : "Select a seat to continue."}
                </div>
                <Button
                  className="gradient-bg hover:opacity-90"
                  disabled={!selectedSeat}
                >
                  Continue with selected seat
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">About this experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Join thousands of attendees for a curated experience with live programming,
              premium ticketing, and seamless entry using QR passes.
            </p>
            <p>
              Last updated{" "}
              <span className="text-foreground font-medium">
                {formatShortDate(event.updatedAt)} at {formatTime(event.updatedAt)}
              </span>
            </p>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Latest events</h2>
            <p className="text-sm text-muted-foreground">
              Discover what else is happening right now.
            </p>
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
                <Link key={item._id} href={`/events/${item._id}`}>
                  <Card className="group h-full overflow-hidden border-border card-hover">
                    <CardContent className="relative flex h-full flex-col gap-3 p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="capitalize">
                          {item.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatShortDate(item.startDate)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {item.city || item.onlinePlatform || "Online"}
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
                          <ArrowUpRight className="h-3 w-3" />
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

      <SiteFooter />
    </div>
  )
}
