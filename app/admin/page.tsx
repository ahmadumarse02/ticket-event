"use client"

import { PageHeader } from "@/components/admin/page-header"
import { StatsCard } from "@/components/admin/stats-card"
import { StatusBadge } from "@/components/admin/status-badge"
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  TrendingUp,
  Package,
  DollarSign,
  Ticket,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLiveData } from "@/hooks/use-live-data"

export default function AdminDashboard() {
  const { data: eventStats } = useLiveData<any>("/api/stats/events", { interval: 12000 })
  const { data: customerStats } = useLiveData<any>("/api/stats/customers", { interval: 12000 })
  const { data: transactionStats } = useLiveData<any>("/api/stats/transactions", {
    interval: 12000,
  })
  const { data: packageStats } = useLiveData<any>("/api/stats/packages", { interval: 12000 })
  const { data: recentTransactions } = useLiveData<any>("/api/transactions?limit=5", {
    interval: 12000,
  })
  const { data: upcomingEvents } = useLiveData<any>("/api/events?status=published&limit=5", {
    interval: 12000,
  })
  const { data: dailyStats } = useLiveData<any>("/api/stats/transactions/daily?days=7", {
    interval: 12000,
  })

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)

  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    })

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your event operations at a glance."
        icon={LayoutDashboard}
      />

      {/* Stats Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Net Revenue"
          value={fmt(transactionStats?.netRevenue || 0)}
          change={transactionStats?.completedTransactions
            ? `${transactionStats.completedTransactions} orders`
            : undefined}
          changeType="positive"
          icon={DollarSign}
          accent="emerald"
        />
        <StatsCard
          title="Total Events"
          value={eventStats?.total || 0}
          description={`${eventStats?.upcoming || 0} upcoming`}
          icon={Calendar}
          accent="violet"
        />
        <StatsCard
          title="Customers"
          value={customerStats?.total || 0}
          description={`${customerStats?.families || 0} families`}
          icon={Users}
          accent="cyan"
        />
        <StatsCard
          title="Active Packages"
          value={packageStats?.active || 0}
          description={`${packageStats?.total || 0} total`}
          icon={Package}
          accent="amber"
        />
      </div>

      {/* Stats Row 2 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tickets Sold"
          value={customerStats?.totalTickets || 0}
          icon={Ticket}
          accent="cyan"
        />
        <StatsCard
          title="Avg. Order Value"
          value={fmt(transactionStats?.averageOrderValue || 0)}
          icon={TrendingUp}
          accent="violet"
        />
        <StatsCard
          title="Pending Orders"
          value={transactionStats?.pendingTransactions || 0}
          icon={CreditCard}
          accent="amber"
        />
        <StatsCard
          title="Total Refunded"
          value={fmt(transactionStats?.totalRefunded || 0)}
          description={`${transactionStats?.refundedTransactions || 0} refunded`}
          icon={CreditCard}
          accent="rose"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue chart */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue — Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyStats?.slice(-7).map((day) => {
                const max = Math.max(...(dailyStats?.map(d => d.revenue) || [1])) || 1
                const pct = Math.min((day.revenue / max) * 100, 100)
                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <div className="w-16 text-xs text-muted-foreground tabular-nums">
                      {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full gradient-bg rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-right text-xs font-semibold tabular-nums">{fmt(day.revenue)}</div>
                  </div>
                )
              })}
              {(!dailyStats || dailyStats.length === 0) && (
                <p className="py-8 text-center text-sm text-muted-foreground">No revenue data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment methods */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactionStats?.byPaymentMethod &&
                Object.entries(transactionStats.byPaymentMethod).map(([method, amount]) => {
                  const total = Object.values(transactionStats.byPaymentMethod).reduce((a, b) => a + b, 0)
                  const pct = total > 0 ? (amount / total) * 100 : 0
                  const colors: Record<string, string> = {
                    card: "hsl(var(--chart-1))",
                    cash: "hsl(var(--chart-2))",
                    bank_transfer: "hsl(var(--chart-3))",
                    paypal: "hsl(var(--chart-4))",
                  }
                  return (
                    <div key={method} className="flex items-center gap-3">
                      <div className="w-24 text-xs capitalize text-muted-foreground">{method.replace("_", " ")}</div>
                      <div className="flex-1">
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: colors[method] || "hsl(var(--chart-5))" }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right text-xs font-semibold tabular-nums">{fmt(amount)}</div>
                    </div>
                  )
                })}
              {(!transactionStats?.byPaymentMethod ||
                Object.values(transactionStats.byPaymentMethod).every(v => v === 0)) && (
                <p className="py-8 text-center text-sm text-muted-foreground">No payment data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent Transactions */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
              <CreditCard className="h-4 w-4 text-primary" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px] pr-1">
              <div className="space-y-2">
                {recentTransactions?.map((tx) => (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-white/[0.025]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <CreditCard className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">
                          {tx.customer?.firstName} {tx.customer?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{tx.transactionNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{fmt(tx.total)}</p>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                ))}
                {(!recentTransactions || recentTransactions.length === 0) && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
              <Calendar className="h-4 w-4 text-primary" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px] pr-1">
              <div className="space-y-2">
                {upcomingEvents?.filter(e => e.startDate > Date.now()).map((event) => (
                  <div
                    key={event._id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-white/[0.025]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg">
                        <Calendar className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{event.name}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(event.startDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={event.type} type={event.type === "physical" ? "info" : "success"} />
                      {event.capacity && (
                        <p className="mt-1 text-[10px] text-muted-foreground">Cap: {event.capacity}</p>
                      )}
                    </div>
                  </div>
                ))}
                {(!upcomingEvents || upcomingEvents.filter(e => e.startDate > Date.now()).length === 0) && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No upcoming events</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
