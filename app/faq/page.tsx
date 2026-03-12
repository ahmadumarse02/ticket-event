"use client"

import { Aperture, HelpCircle, MessageCircle } from "lucide-react"
import Link from "next/link"
import { SiteHeader } from "@/components/public/site-header"
import { SiteFooter } from "@/components/public/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { hasAdminRole } from "@/lib/auth-utils"

export default function FaqPage() {
  const { data: session } = authClient.useSession()
  const role = (session?.user as { role?: string | string[] | null } | undefined)?.role
  const isAdmin = hasAdminRole(role)
  const faqs = [
    {
      question: "How often is event availability updated?",
      answer:
        "Event listings refresh every few seconds, so ticket tiers and capacity always reflect the latest inventory.",
    },
    {
      question: "Can I host both in-person and online events?",
      answer:
        "Yes. TicketPro supports physical venues, online platforms, and hybrid formats with custom ticketing rules.",
    },
    {
      question: "What payment methods are supported?",
      answer:
        "You can accept card, bank transfer, PayPal, cash, and custom payment workflows inside the organizer console.",
    },
    {
      question: "How do refunds work?",
      answer:
        "Refunds can be processed as full or partial adjustments directly from the Transactions view.",
    },
    {
      question: "Is there a limit on ticket tiers?",
      answer:
        "No. You can create as many tiers as you need for age, access level, or VIP experiences.",
    },
    {
      question: "How do I create family accounts?",
      answer:
        "Use the Customers page to create a family record and assign a head of household or members.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/15 via-transparent to-amber-500/10" />
        <div className="absolute -top-20 left-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <Aperture className="h-3 w-3 text-primary" />
            Answers for organizers and attendees
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">FAQ</h1>
          <p className="max-w-2xl text-muted-foreground">
            Quick guidance on how Aurora keeps events running smoothly, from real-time ticket
            inventory to refunds and reporting.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-24 space-y-10">
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.question} className="card-hover">
              <CardHeader className="flex flex-row items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <HelpCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {faq.answer}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card">
          <CardContent className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Need more help?</h2>
              <p className="mt-2 text-muted-foreground">
                Head to the admin console or explore the latest events to see Aurora in action.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="gradient-bg hover:opacity-90" asChild>
                <Link href="/events">Browse events</Link>
              </Button>
              {isAdmin ? (
                <Button variant="outline" asChild>
                  <Link href="/admin">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Organizer console
                  </Link>
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
