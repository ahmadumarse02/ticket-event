"use client"

import Link from "next/link"
import { Aperture, CheckCircle2, Compass, Target, Users } from "lucide-react"
import { SiteHeader } from "@/components/public/site-header"
import { SiteFooter } from "@/components/public/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { hasAdminRole } from "@/lib/auth-utils"

export default function AboutPage() {
  const { data: session } = authClient.useSession()
  const role = (session?.user as { role?: string | string[] | null } | undefined)?.role
  const isAdmin = hasAdminRole(role)
  const pillars = [
    {
      icon: Target,
      title: "Purpose-built for live events",
      description:
        "From pop-ups to stadium tours, every workflow is tuned for speed, clarity, and on-site coordination.",
    },
    {
      icon: Users,
      title: "Audience-first experiences",
      description:
        "Mobile tickets, real-time updates, and seamless check-in keep guests focused on the moment.",
    },
    {
      icon: Compass,
      title: "Data that keeps you ahead",
      description:
        "Track demand, sales velocity, and customer trends so you can plan the next release with confidence.",
    },
  ]

  const values = [
    "Real-time inventory updates for every ticket tier.",
    "Secure entry with QR verification and fraud safeguards.",
    "Instant reporting across sales, refunds, and attendance.",
    "Flexible pricing for bundles, passes, and add-ons.",
  ]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/15 via-transparent to-amber-500/10" />
        <div className="absolute -top-20 right-16 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <Aperture className="h-3 w-3 text-primary" />
            Built for modern event teams
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            About <span className="gradient-text">Aurora</span>
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Aurora is a live event platform that unifies ticketing, operations, and analytics.
            We help organizers deliver unforgettable experiences with the confidence that every
            seat, scan, and sale is covered in real time.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-24 space-y-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <Card key={pillar.title} className="card-hover">
              <CardContent className="space-y-3 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg">
                  <pillar.icon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold">{pillar.title}</h2>
                <p className="text-sm text-muted-foreground">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card">
          <CardContent className="grid gap-6 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">What we believe</h2>
              <p className="text-sm text-muted-foreground">
                Great events are crafted by teams that can move fast without losing sight of the
                guest experience. Aurora brings every signal into one place, so you can spend
                more time designing the event and less time chasing spreadsheets.
              </p>
            </div>
            <div className="space-y-3 text-sm">
              {values.map((value) => (
                <div key={value} className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-transparent to-amber-500/20" />
          <CardContent className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Ready to see it in action?</h3>
              <p className="mt-2 text-muted-foreground">
                Explore active events or open the organizer console to start building.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="gradient-bg hover:opacity-90" asChild>
                <Link href="/events">Browse events</Link>
              </Button>
              {isAdmin ? (
                <Button variant="outline" asChild>
                  <Link href="/admin">Organizer console</Link>
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <SiteFooter />
    </div>
  )
}
