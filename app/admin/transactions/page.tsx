"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, Column } from "@/components/admin/data-table"
import { EmptyState } from "@/components/admin/empty-state"
import { StatusBadge } from "@/components/admin/status-badge"
import { StatsCard } from "@/components/admin/stats-card"
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  Building2,
  Wallet,
  X,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { MockTransaction } from "@/lib/mock-data"
import { useLiveData } from "@/hooks/use-live-data"
import { apiRequest } from "@/lib/api-client"

interface TransactionFilters {
  status: string
  paymentMethod: string
  startDate: string
  endDate: string
  minAmount: string
  maxAmount: string
}

const initialFilters: TransactionFilters = {
  status: "all",
  paymentMethod: "all",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
}

const paymentMethods = [
  { value: "card", label: "Card", icon: CreditCard },
  { value: "cash", label: "Cash", icon: DollarSign },
  { value: "bank_transfer", label: "Bank Transfer", icon: Building2 },
  { value: "paypal", label: "PayPal", icon: Wallet },
  { value: "other", label: "Other", icon: CreditCard },
]

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "partially_refunded", label: "Partially Refunded" },
]

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const transactionsUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.status !== "all") params.set("status", filters.status)
    if (filters.paymentMethod !== "all") params.set("paymentMethod", filters.paymentMethod)
    if (filters.startDate) params.set("startDate", new Date(filters.startDate).getTime().toString())
    if (filters.endDate) params.set("endDate", new Date(filters.endDate).getTime().toString())
    if (filters.minAmount) params.set("minAmount", filters.minAmount)
    if (filters.maxAmount) params.set("maxAmount", filters.maxAmount)
    return `/api/transactions?${params.toString()}`
  }, [filters])

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    refresh: refreshTransactions,
  } = useLiveData<MockTransaction[]>(transactionsUrl, { interval: 12000 })

  const statsUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.startDate) params.set("startDate", new Date(filters.startDate).getTime().toString())
    if (filters.endDate) params.set("endDate", new Date(filters.endDate).getTime().toString())
    return `/api/stats/transactions?${params.toString()}`
  }, [filters.endDate, filters.startDate])

  const { data: transactionStats } = useLiveData<any>(statsUrl, { interval: 12000 })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPaymentMethodIcon = (method: string) => {
    const found = paymentMethods.find((m) => m.value === method)
    return found?.icon || CreditCard
  }

  const handleViewDetails = (transaction: any) => {
    setSelectedTransaction(transaction)
    setIsDetailOpen(true)
  }

  const handleRefund = (transaction: any) => {
    setSelectedTransaction(transaction)
    setRefundAmount(transaction.total.toString())
    setIsRefundDialogOpen(true)
  }

  const processRefund = async () => {
    if (!selectedTransaction || !refundAmount) return

    try {
      const amount = parseFloat(refundAmount)
      const isFullRefund = amount >= selectedTransaction.total

      await apiRequest(`/api/transactions/${selectedTransaction._id}`, {
        method: "PUT",
        body: {
          status: isFullRefund ? "refunded" : "partially_refunded",
          refundedAmount: amount,
        },
      })
      refreshTransactions()

      toast.success(isFullRefund ? "Full refund processed" : "Partial refund processed")
      setIsRefundDialogOpen(false)
      setRefundAmount("")
      setSelectedTransaction(null)
    } catch (error) {
      toast.error("Failed to process refund")
      console.error("[TransactionsPage] Refund error:", error)
    }
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    toast.success("Filters cleared")
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "" && v !== "all")

  const exportToCSV = () => {
    if (!transactions.length) return

    const headers = [
      "Transaction Number",
      "Date",
      "Customer",
      "Event",
      "Amount",
      "Status",
      "Payment Method",
    ]
    
    const rows = transactions.map((t) => [
      t.transactionNumber,
      new Date(t.createdAt).toISOString(),
      t.customer ? `${t.customer.firstName} ${t.customer.lastName}` : "N/A",
      t.event?.name || "N/A",
      t.total,
      t.status,
      t.paymentMethod,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Transactions exported")
  }

  const columns: Column<any>[] = [
    {
      key: "transactionNumber",
      header: "Transaction",
      cell: (t) => (
        <div>
          <p className="font-mono text-sm">{t.transactionNumber}</p>
          <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (t) => (
        <div>
          <p className="font-medium">
            {t.customer ? `${t.customer.firstName} ${t.customer.lastName}` : "N/A"}
          </p>
          <p className="text-sm text-muted-foreground">{t.customer?.email}</p>
        </div>
      ),
    },
    {
      key: "event",
      header: "Event",
      cell: (t) => (
        <p className="text-sm">
          {t.event?.name || <span className="text-muted-foreground">No event</span>}
        </p>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (t) => (
        <div>
          <p className="font-medium">{t.items.length} item(s)</p>
          <p className="text-sm text-muted-foreground">
            {t.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} tickets
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      cell: (t) => {
        const PaymentIcon = getPaymentMethodIcon(t.paymentMethod)
        return (
          <div>
            <p className="font-semibold">{formatCurrency(t.total)}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <PaymentIcon className="h-3 w-3" />
              <span className="capitalize">{t.paymentMethod.replace("_", " ")}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      cell: (t) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(t)}>
            <Eye className="h-4 w-4" />
          </Button>
          {t.status === "completed" && (
            <Button variant="ghost" size="icon" onClick={() => handleRefund(t)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Transactions"
        description="Track all purchases, refunds, and payment history"
        icon={CreditCard}
      >
        <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Transactions</SheetTitle>
              <SheetDescription>
                Apply filters to narrow down your transaction list
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={filters.paymentMethod}
                  onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All methods</SelectItem>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    placeholder="Start date"
                  />
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    placeholder="End date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount Range ($)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                    placeholder="Min"
                  />
                  <Input
                    type="number"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
                <Button
                  onClick={() => setIsFiltersOpen(false)}
                  className="flex-1 gradient-bg"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Button variant="outline" onClick={exportToCSV} disabled={!transactions.length}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(transactionStats?.totalRevenue || 0)}
          description={`${transactionStats?.completedTransactions || 0} completed`}
          icon={DollarSign}
          iconColor="text-green-500"
        />
        <StatsCard
          title="Net Revenue"
          value={formatCurrency(transactionStats?.netRevenue || 0)}
          icon={TrendingUp}
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Avg. Order Value"
          value={formatCurrency(transactionStats?.averageOrderValue || 0)}
          icon={CreditCard}
          iconColor="text-purple-500"
        />
        <StatsCard
          title="Refunded"
          value={formatCurrency(transactionStats?.totalRefunded || 0)}
          description={`${transactionStats?.refundedTransactions || 0} refunds`}
          icon={AlertCircle}
          iconColor="text-orange-500"
        />
      </div>

      {/* Table */}
      {!transactionsLoading && transactions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No transactions yet"
          description="Transactions will appear here when customers make purchases"
        />
      ) : (
        <DataTable
          columns={columns}
          data={transactions || []}
          searchPlaceholder="Search transactions..."
          searchKey="transactionNumber"
          isLoading={transactionsLoading}
        />
      )}

      {/* Transaction Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.transactionNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* Status and Date */}
              <div className="flex items-center justify-between">
                <StatusBadge status={selectedTransaction.status} />
                <span className="text-sm text-muted-foreground">
                  {formatDate(selectedTransaction.createdAt)}
                </span>
              </div>

              <Separator />

              {/* Customer Info */}
              <div>
                <h4 className="font-medium mb-2">Customer</h4>
                <div className="text-sm">
                  <p>
                    {selectedTransaction.customer?.firstName}{" "}
                    {selectedTransaction.customer?.lastName}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedTransaction.customer?.email}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedTransaction.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.priceTier && `${item.priceTier} • `}
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                {selectedTransaction.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-500">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedTransaction.discount)}</span>
                  </div>
                )}
                {selectedTransaction.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedTransaction.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedTransaction.total)}</span>
                </div>
                {selectedTransaction.refundedAmount && (
                  <div className="flex justify-between text-sm text-orange-500">
                    <span>Refunded</span>
                    <span>-{formatCurrency(selectedTransaction.refundedAmount)}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Payment Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Payment Method</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedTransaction.paymentMethod.replace("_", " ")}
                  </p>
                </div>
                {selectedTransaction.paymentReference && (
                  <div className="text-right">
                    <h4 className="font-medium">Reference</h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedTransaction.paymentReference}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
            {selectedTransaction?.status === "completed" && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailOpen(false)
                  handleRefund(selectedTransaction)
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Process Refund
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Enter the amount to refund for this transaction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-sm text-muted-foreground">Transaction Total</p>
              <p className="text-2xl font-bold">
                {formatCurrency(selectedTransaction?.total || 0)}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="refundAmount">Refund Amount ($)</Label>
              <Input
                id="refundAmount"
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={selectedTransaction?.total}
              />
              <p className="text-xs text-muted-foreground">
                Enter the full amount for a complete refund, or a partial amount
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processRefund} variant="destructive">
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
