import { NextResponse } from "next/server"
import { and, desc, eq, gte, lte } from "drizzle-orm"
import { db } from "@/lib/db"
import { customers, events, transactions } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

const toNumber = (value: unknown) =>
  value === null || value === undefined ? 0 : Number(value)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || undefined
  const paymentMethod = searchParams.get("paymentMethod") || undefined
  const customerId = searchParams.get("customerId") || undefined
  const eventId = searchParams.get("eventId") || undefined
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const minAmount = searchParams.get("minAmount")
  const maxAmount = searchParams.get("maxAmount")
  const limitParam = searchParams.get("limit")

  const conditions = []
  if (status) conditions.push(eq(transactions.status, status))
  if (paymentMethod) conditions.push(eq(transactions.paymentMethod, paymentMethod))
  if (customerId) conditions.push(eq(transactions.customerId, customerId))
  if (eventId) conditions.push(eq(transactions.eventId, eventId))
  if (startDate) conditions.push(gte(transactions.createdAt, Number(startDate)))
  if (endDate) conditions.push(lte(transactions.createdAt, Number(endDate)))
  if (minAmount) conditions.push(gte(transactions.total, minAmount))
  if (maxAmount) conditions.push(lte(transactions.total, maxAmount))

  let query = db
    .select({
      transaction: transactions,
      customer: customers,
      event: events,
    })
    .from(transactions)
    .leftJoin(customers, eq(transactions.customerId, customers.id))
    .leftJoin(events, eq(transactions.eventId, events.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(transactions.createdAt))

  if (limitParam) {
    query = query.limit(Number(limitParam))
  }

  const rows = await query

  const mapped = rows.map((row) => ({
    ...row.transaction,
    _id: row.transaction.id,
    subtotal: toNumber(row.transaction.subtotal),
    discount: toNumber(row.transaction.discount),
    tax: toNumber(row.transaction.tax),
    total: toNumber(row.transaction.total),
    refundedAmount: row.transaction.refundedAmount
      ? toNumber(row.transaction.refundedAmount)
      : undefined,
    customer: row.customer
      ? {
          ...row.customer,
          _id: row.customer.id,
          totalSpent: Number(row.customer.totalSpent || 0),
        }
      : undefined,
    event: row.event ? { ...row.event, _id: row.event.id } : undefined,
  }))

  return NextResponse.json(mapped)
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = Date.now()
  const id = body.id || `tx_${crypto.randomUUID()}`

  await db.insert(transactions).values({
    id,
    transactionNumber: body.transactionNumber,
    customerId: body.customerId ?? null,
    eventId: body.eventId ?? null,
    type: body.type,
    status: body.status,
    items: body.items ?? [],
    subtotal: body.subtotal ?? 0,
    discount: body.discount ?? 0,
    tax: body.tax ?? 0,
    total: body.total ?? 0,
    refundedAmount: body.refundedAmount ?? null,
    paymentMethod: body.paymentMethod,
    paymentReference: body.paymentReference ?? null,
    notes: body.notes ?? null,
    source: body.source ?? null,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ id, _id: id }, { status: 201 })
}
