"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Calendar,
  Globe,
  MapPin,
  Search,
  Aperture,
  Ticket,
} from "lucide-react"
import { SiteHeader } from "@/components/public/site-header"
import { SiteFooter } from "@/components/public/site-footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useLiveData } from "@/hooks/use-live-data"
import type { MockEvent as EventRecord } from "@/lib/mock-data"

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)

export default function EventsPage() {
  const { data: events = [], isLoading } = useLiveData<EventRecord[]>(
    "/api/events?status=published",
    { interval: 12000 }
  )

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...events]
      .filter((event) => {
        if (typeFilter !== "all" && event.type !== typeFilter) return false
        const isFree = event.isFree || event.priceTiers.length === 0
        if (priceFilter === "free" && !isFree) return false
        if (priceFilter === "paid" && isFree) return false
        if (!query) return true
        return (
          event.name.toLowerCase().includes(query) ||
          (event.city || "").toLowerCase().includes(query) ||
          (event.venue || "").toLowerCase().includes(query)
        )
      })
      .sort((a, b) => a.startDate - b.startDate)
  }, [events, priceFilter, search, typeFilter])

  const featured = filteredEvents[0]
  const rest = featured ? filteredEvents.slice(1) : filteredEvents

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/15 via-transparent to-amber-500/10" />
        <div className="absolute -top-24 left-16 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              <Aperture className="h-3 w-3 text-primary" />
              Live events updated in real time
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Find your next
              <span className="gradient-text"> unforgettable event</span>
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Browse the latest concerts, workshops, conferences, and community gatherings.
              Tickets are updated instantly as availability changes.
            </p>
          </div>

          <div className="mt-10 grid gap-4 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur md:grid-cols-[1.5fr_1fr_1fr]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by event name, city, or venue"
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All event types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="physical">In-person</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Any price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any price</SelectItem>
                <SelectItem value="free">Free events</SelectItem>
                <SelectItem value="paid">Paid events</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-24 space-y-10">
        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-40" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No events match your filters yet. Try adjusting the search or check back soon.
            </CardContent>
          </Card>
        ) : (
          <>
            {featured && (
              <Card className="relative overflow-hidden border-border">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-amber-500/20" />
                <CardContent className="relative grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {featured.type}
                      </Badge>
                      <Badge variant="outline">{formatDate(featured.startDate)}</Badge>
                      {featured.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-2xl font-semibold">{featured.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {featured.description || "Curated experience with premium access."}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {formatDate(featured.startDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        {featured.type === "online" ? (
                          <Globe className="h-4 w-4 text-primary" />
                        ) : (
                          <MapPin className="h-4 w-4 text-primary" />
                        )}
                        {featured.city || featured.onlinePlatform || "Online"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 rounded-xl border border-border bg-background/70 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Ticket className="h-4 w-4 text-primary" />
                      Starting from
                    </div>
                    <p className="text-2xl font-semibold">
                      {featured.isFree || featured.priceTiers.length === 0
                        ? "Free"
                        : formatCurrency(
                            Math.min(...featured.priceTiers.map((tier) => tier.price))
                          )}
                    </p>
                    <Button className="w-full gradient-bg hover:opacity-90" asChild>
                      <Link href={`/events/${featured._id}`}>View event</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((event) => {
                const isFree = event.isFree || event.priceTiers.length === 0
                const priceLabel = isFree
                  ? "Free"
                  : formatCurrency(
                      Math.min(...event.priceTiers.map((tier) => tier.price))
                    )
                return (
                  <Link key={event._id} href={`/events/${event._id}`}>
                    <Card className="group h-full overflow-hidden border-border card-hover">
                      <CardHeader className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="capitalize">
                            {event.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(event.startDate)}
                          </span>
                        </div>
                        <CardTitle className="text-base">{event.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p className="max-h-10 overflow-hidden">
                          {event.description || "Premium experience with curated programming."}
                        </p>
                        <div className="flex items-center gap-2">
                          {event.type === "online" ? (
                            <Globe className="h-4 w-4 text-primary" />
                          ) : (
                            <MapPin className="h-4 w-4 text-primary" />
                          )}
                          <span>{event.city || event.onlinePlatform || "Online"}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="font-medium text-foreground">{priceLabel}</span>
                          <span className="text-xs text-primary">View details</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
