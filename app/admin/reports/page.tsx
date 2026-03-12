"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { StatsCard } from "@/components/admin/stats-card"
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Download,
  Save,
  PieChart,
  LineChart,
  BarChart,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MockSavedReport } from "@/lib/mock-data"
import { useLiveData } from "@/hooks/use-live-data"
import { apiRequest } from "@/lib/api-client"

type ReportType = "sales" | "customers" | "events"
type ChartType = "bar" | "line" | "pie" | "area"
type GroupBy = "day" | "paymentMethod" | "event"

interface ReportFilters {
  startDate: string
  endDate: string
  groupBy: GroupBy
}

const initialFilters: ReportFilters = {
  startDate: "",
  endDate: "",
  groupBy: "day",
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>("sales")
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [reportName, setReportName] = useState("")

  const salesUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.startDate) {
      params.set("startDate", new Date(filters.startDate).getTime().toString())
    }
    if (filters.endDate) {
      params.set("endDate", new Date(filters.endDate).getTime().toString())
    }
    params.set("groupBy", filters.groupBy)
    return `/api/reports/sales?${params.toString()}`
  }, [filters.endDate, filters.groupBy, filters.startDate])

  const { data: salesReport } = useLiveData<any>(salesUrl, { interval: 12000 })
  const { data: customerReport } = useLiveData<any>("/api/reports/customers", {
    interval: 12000,
  })
  const {
    data: savedReports = [],
    refresh: refreshReports,
  } = useLiveData<MockSavedReport[]>("/api/reports", { interval: 15000 })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleSaveReport = async () => {
    if (!reportName) {
      toast.error("Please enter a report name")
      return
    }

    try {
      await apiRequest("/api/reports", {
        method: "POST",
        body: {
          name: reportName,
          type: activeTab,
          filters: {
            dateRange:
              filters.startDate && filters.endDate
                ? {
                    start: new Date(filters.startDate).getTime(),
                    end: new Date(filters.endDate).getTime(),
                  }
                : undefined,
          },
          columns: [],
          groupBy: filters.groupBy,
        },
      })
      refreshReports()
      toast.success("Report saved successfully")
      setIsSaveDialogOpen(false)
      setReportName("")
    } catch (error) {
      toast.error("Failed to save report")
      console.error("[ReportsPage] Save error:", error)
    }
  }

  const exportReport = (type: string) => {
    let data: any[] = []
    let headers: string[] = []

    if (type === "sales" && salesReport) {
      headers = ["Date", "Revenue", "Transactions"]
      data = salesReport.groupedData.map((d: any) => [
        d.date || d.method || d.eventName,
        d.revenue,
        d.transactions,
      ])
    } else if (type === "customers" && customerReport) {
      headers = ["Customer", "Total Spent"]
      data = customerReport.topCustomers.map((c: any) => [
        `${c.firstName} ${c.lastName}`,
        c.totalSpent,
      ])
    }

    const csv = [headers, ...data].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${type}-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Report exported")
  }

  const ageLabels = ["0-12", "13-17", "18-25", "26-35", "36-50", "51-65", "65+", "Unknown"]
  const ageColors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-cyan-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-gray-500",
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Generate and analyze sales, customer, and event reports"
        icon={BarChart3}
      >
        <Button variant="outline" onClick={() => exportReport(activeTab)}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button onClick={() => setIsSaveDialogOpen(true)} className="gradient-bg">
          <Save className="mr-2 h-4 w-4" />
          Save Report
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Group By</Label>
              <Select
                value={filters.groupBy}
                onValueChange={(value: GroupBy) => setFilters({ ...filters, groupBy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="paymentMethod">Payment Method</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportType)}>
        <TabsList>
          <TabsTrigger value="sales" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Sales Report
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <Users className="h-4 w-4" />
            Customer Report
          </TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-6 mt-6">
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(salesReport?.summary?.totalRevenue || 0)}
              icon={DollarSign}
              iconColor="text-green-500"
            />
            <StatsCard
              title="Total Orders"
              value={salesReport?.summary?.totalTransactions || 0}
              icon={BarChart3}
              iconColor="text-blue-500"
            />
            <StatsCard
              title="Avg. Order Value"
              value={formatCurrency(salesReport?.summary?.averageOrderValue || 0)}
              icon={TrendingUp}
              iconColor="text-purple-500"
            />
            <StatsCard
              title="Total Tickets"
              value={salesReport?.summary?.totalTickets || 0}
              icon={Calendar}
              iconColor="text-cyan-500"
            />
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {salesReport?.groupedData && salesReport.groupedData.length > 0 ? (
                <div className="space-y-4">
                  {salesReport.groupedData.map((item: any, index: number) => {
                    const maxRevenue = Math.max(
                      ...salesReport.groupedData.map((d: any) => d.revenue)
                    )
                    const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0

                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-32 text-sm text-muted-foreground truncate">
                          {item.date || item.method || item.eventName}
                        </div>
                        <div className="flex-1">
                          <div className="h-3 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full gradient-bg rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-28 text-right">
                          <p className="font-medium">{formatCurrency(item.revenue)}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.transactions} orders
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No data available for the selected filters
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {filters.groupBy === "day"
                        ? "Date"
                        : filters.groupBy === "paymentMethod"
                          ? "Payment Method"
                          : "Event"}
                    </TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Avg. Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReport?.groupedData?.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {item.date || item.method || item.eventName}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                      <TableCell className="text-right">{item.transactions}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          item.transactions > 0 ? item.revenue / item.transactions : 0
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!salesReport?.groupedData || salesReport.groupedData.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Report */}
        <TabsContent value="customers" className="space-y-6 mt-6">
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              title="Total Customers"
              value={customerReport?.summary?.totalCustomers || 0}
              icon={Users}
              iconColor="text-blue-500"
            />
            <StatsCard
              title="Family Accounts"
              value={customerReport?.summary?.familyAccounts || 0}
              icon={Users}
              iconColor="text-purple-500"
            />
            <StatsCard
              title="Individual"
              value={customerReport?.summary?.individualAccounts || 0}
              icon={Users}
              iconColor="text-cyan-500"
            />
            <StatsCard
              title="Repeat Customers"
              value={customerReport?.summary?.repeatCustomers || 0}
              icon={Users}
              iconColor="text-green-500"
            />
            <StatsCard
              title="New Customers"
              value={customerReport?.summary?.newCustomers || 0}
              icon={Users}
              iconColor="text-orange-500"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Age Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {customerReport?.ageGroups ? (
                  <div className="space-y-4">
                    {ageLabels.map((label, index) => {
                      const count =
                        customerReport.ageGroups[
                          label as keyof typeof customerReport.ageGroups
                        ] || 0
                      const total = Object.values(customerReport.ageGroups).reduce(
                        (a, b) => a + b,
                        0
                      )
                      const percentage = total > 0 ? (count / total) * 100 : 0

                      return (
                        <div key={label} className="flex items-center gap-4">
                          <div className="w-20 text-sm text-muted-foreground">{label}</div>
                          <div className="flex-1">
                            <div className="h-3 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${ageColors[index]}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-16 text-right">
                            <p className="font-medium">{count}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Customers by Spending</CardTitle>
              </CardHeader>
              <CardContent>
                {customerReport?.topCustomers && customerReport.topCustomers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Total Spent</TableHead>
                        <TableHead className="text-right">Tickets</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerReport.topCustomers.map((customer: any) => (
                        <TableRow key={customer._id}>
                          <TableCell>
                            <p className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {customer.email}
                            </p>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(customer.totalSpent)}
                          </TableCell>
                          <TableCell className="text-right">
                            {customer.totalTickets}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No customer data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Saved Reports */}
      {savedReports && savedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedReports.map((report) => (
                <div
                  key={report._id}
                  className="rounded-lg border p-4 hover:border-primary/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      {report.type === "sales" && (
                        <DollarSign className="h-5 w-5 text-green-500" />
                      )}
                      {report.type === "customers" && (
                        <Users className="h-5 w-5 text-blue-500" />
                      )}
                      {report.type === "events" && (
                        <Calendar className="h-5 w-5 text-purple-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {report.type} report
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Report Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Report</DialogTitle>
            <DialogDescription>
              Save this report configuration for quick access later
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g., Monthly Sales Report"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReport} className="gradient-bg">
              Save Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
