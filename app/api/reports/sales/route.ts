import { NextResponse } from "next/server"
import { and, eq, gte, lte } from "drizzle-orm"
import { db } from "@/lib/db"
import { events, transactions } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

const toNumber = (value: unknown) =>
  value === null || value === undefined ? 0 : Number(value)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const groupBy = (searchParams.get("groupBy") || "day") as
    | "day"
    | "paymentMethod"
    | "event"
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const conditions = []
  if (startDate) conditions.push(gte(transactions.createdAt, Number(startDate)))
  if (endDate) conditions.push(lte(transactions.createdAt, Number(endDate)))

  const rows = await db
    .select({ tx: transactions, event: events })
    .from(transactions)
    .leftJoin(events, eq(transactions.eventId, events.id))
    .where(conditions.length ? and(...conditions) : undefined)

  const completed = rows
    .map((row) => ({
      ...row.tx,
      total: toNumber(row.tx.total),
      eventName: row.event?.name,
    }))
    .filter((tx) => tx.status === "completed")

  const grouped = completed.reduce<Record<string, { revenue: number; transactions: number }>>(
    (acc, tx) => {
      let key = ""
      if (groupBy === "day") {
        key = new Date(tx.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      } else if (groupBy === "paymentMethod") {
        key = tx.paymentMethod.replace("_", " ")
      } else {
        key = tx.eventName || "No event"
      }

      if (!acc[key]) acc[key] = { revenue: 0, transactions: 0 }
      acc[key].revenue += tx.total
      acc[key].transactions += 1
      return acc
    },
    {}
  )

  const groupedData = Object.entries(grouped).map(([label, data]) => ({
    date: groupBy === "day" ? label : undefined,
    method: groupBy === "paymentMethod" ? label : undefined,
    eventName: groupBy === "event" ? label : undefined,
    revenue: data.revenue,
    transactions: data.transactions,
  }))

  const totalRevenue = completed.reduce((sum, tx) => sum + tx.total, 0)
  const totalTickets = completed.reduce(
    (sum, tx) =>
      sum +
      (Array.isArray(tx.items)
        ? tx.items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0)
        : 0),
    0
  )

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalTransactions: completed.length,
      averageOrderValue: completed.length ? totalRevenue / completed.length : 0,
      totalTickets,
    },
    groupedData,
  })
}
