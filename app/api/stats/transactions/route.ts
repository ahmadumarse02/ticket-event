import { NextResponse } from "next/server"
import { and, gte, lte } from "drizzle-orm"
import { db } from "@/lib/db"
import { transactions } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

const toNumber = (value: unknown) =>
  value === null || value === undefined ? 0 : Number(value)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const conditions = []
  if (startDate) conditions.push(gte(transactions.createdAt, Number(startDate)))
  if (endDate) conditions.push(lte(transactions.createdAt, Number(endDate)))

  const rows = await db
    .select()
    .from(transactions)
    .where(conditions.length ? and(...conditions) : undefined)

  const completed = rows.filter((tx) => tx.status === "completed")
  const totalRevenue = completed.reduce((sum, tx) => sum + toNumber(tx.total), 0)
  const totalRefunded = rows.reduce(
    (sum, tx) => sum + toNumber(tx.refundedAmount),
    0
  )

  const byPaymentMethod = completed.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.paymentMethod] = (acc[tx.paymentMethod] || 0) + toNumber(tx.total)
    return acc
  }, {})

  return NextResponse.json({
    totalRevenue,
    netRevenue: totalRevenue - totalRefunded,
    averageOrderValue: completed.length ? totalRevenue / completed.length : 0,
    completedTransactions: completed.length,
    pendingTransactions: rows.filter((tx) => tx.status === "pending").length,
    refundedTransactions: rows.filter((tx) =>
      ["refunded", "partially_refunded"].includes(tx.status)
    ).length,
    totalRefunded,
    byPaymentMethod,
  })
}
