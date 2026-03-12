"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  CreditCard,
  Globe,
  MapPin,
  Shield,
  Aperture,
  Ticket,
  Users,
  Zap,
} from "lucide-react"
import { SiteHeader } from "@/components/public/site-header"
import { SiteFooter } from "@/components/public/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLiveData } from "@/hooks/use-live-data"
import { authClient } from "@/lib/auth-client"
import { hasAdminRole } from "@/lib/auth-utils"
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

export default function Home() {
  const { data: events = [] } = useLiveData<EventRecord[]>(
    "/api/events?status=published&limit=6",
    { interval: 12000 }
  )
  const { data: session } = authClient.useSession()
  const role = (session?.user as { role?: string | string[] | null } | undefined)?.role
  const isAdmin = hasAdminRole(role)

  const upcoming = useMemo(() => {
    return [...events]
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, 3)
  }, [events])

  const features = [
    {
      icon: Zap,
      title: "Instant access",
      description: "Mobile-ready QR codes and lightning-fast checkout built for busy crowds.",
    },
    {
      icon: Shield,
      title: "Secure entry",
      description: "Verified ticket transfers, fraud protection, and real-time capacity controls.",
    },
    {
      icon: CreditCard,
      title: "Flexible payments",
      description: "Support card, bank transfer, and digital wallets with instant receipts.",
    },
    {
      icon: Users,
      title: "Audience insights",
      description: "Track attendee cohorts, repeat visits, and demographics in a single view.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-background to-amber-900/10" />
        <div className="absolute top-1/3 left-1/5 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/6 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                <Aperture className="h-3 w-3 text-primary" />
                Live inventory updates every few seconds
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Tickets for the moments that
                <span className="gradient-text"> move your audience</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Discover experiences designed for community, culture, and connection. Browse
                upcoming events and claim your spot in seconds.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="gradient-bg hover:opacity-90" asChild>
                  <Link href="/events">
                    Explore events
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {isAdmin ? (
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/admin">For organizers</Link>
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Log in</Link>
                  </Button>
                )}
              </div>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Featured line-up</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    New events are landing soon. Check back for the next release.
                  </p>
                ) : (
                  upcoming.map((event) => (
                    <Link
                      key={event._id}
                      href={`/events/${event._id}`}
                      className="block rounded-lg border border-border p-3 transition hover:border-border/60"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{event.name}</p>
                        <Badge variant="secondary" className="capitalize">
                          {event.type}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(event.startDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {event.type === "online" ? (
                            <Globe className="h-3 w-3" />
                          ) : (
                            <MapPin className="h-3 w-3" />
                          )}
                          {event.city || event.onlinePlatform || "Online"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Ticket className="h-3 w-3" />
                          {event.isFree || event.priceTiers.length === 0
                            ? "Free"
                            : formatCurrency(
                                Math.min(...event.priceTiers.map((tier) => tier.price))
                              )}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-20 space-y-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">Designed for fans and organizers alike</h2>
            <p className="mt-4 text-muted-foreground">
              From live music to community workshops, Aurora keeps every moment organized and
              every attendee engaged with real-time updates.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="card-hover">
              <CardContent className="space-y-3 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="relative overflow-hidden border-border">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-transparent to-cyan-600/20" />
          <CardContent className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Ready to build your next event?</h3>
              <p className="mt-2 text-muted-foreground">
                Launch ticketing, manage guests, and track every sale in one place.
              </p>
            </div>
            {isAdmin ? (
              <Button size="lg" className="gradient-bg hover:opacity-90" asChild>
                <Link href="/admin">Open organizer console</Link>
              </Button>
            ) : (
              <Button size="lg" className="gradient-bg hover:opacity-90" asChild>
                <Link href="/register">Create account</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <SiteFooter />
    </div>
  )
}
