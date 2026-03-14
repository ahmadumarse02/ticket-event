import { NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { events, resaleListings, tickets } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

const toNumber = (value: unknown) =>
  value === null || value === undefined ? null : Number(value)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get("eventId") || undefined
  const status = searchParams.get("status") || undefined

  const conditions = []
  if (eventId) conditions.push(eq(resaleListings.eventId, eventId))
  if (status) conditions.push(eq(resaleListings.status, status))

  const rows = await db
    .select()
    .from(resaleListings)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(resaleListings.createdAt))

  return NextResponse.json(
    rows.map((row) => ({
      ...row,
      _id: row.id,
      price: toNumber(row.price),
    }))
  )
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = Date.now()
  const ticketId = body.ticketId
  const eventId = body.eventId
  const sellerId = body.sellerId
  const price = Number(body.price)

  if (!ticketId || !eventId || !sellerId) {
    return NextResponse.json(
      { message: "Ticket, event, and seller are required" },
      { status: 400 }
    )
  }

  if (Number.isNaN(price) || price <= 0) {
    return NextResponse.json({ message: "Enter a valid resale price" }, { status: 400 })
  }

  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId))
  if (!ticketRows.length) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
  }

  const ticket = ticketRows[0]
  if (ticket.eventId !== eventId) {
    return NextResponse.json({ message: "Ticket does not match event" }, { status: 400 })
  }

  if (ticket.status !== "active") {
    return NextResponse.json({ message: "Ticket is not eligible for resale" }, { status: 400 })
  }

  if (ticket.customerId && ticket.customerId !== sellerId) {
    return NextResponse.json(
      { message: "Seller does not own this ticket" },
      { status: 400 }
    )
  }

  const eventRows = await db.select().from(events).where(eq(events.id, eventId))
  const event = eventRows[0]
  if (!event) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 })
  }
  const resaleRules = event?.resaleRules ?? { enabled: false }

  if (!resaleRules.enabled) {
    return NextResponse.json({ message: "Resale is disabled for this event" }, { status: 400 })
  }

  if (resaleRules.windowStart && now < resaleRules.windowStart) {
    return NextResponse.json({ message: "Resale window has not opened yet" }, { status: 400 })
  }

  if (resaleRules.windowEnd && now > resaleRules.windowEnd) {
    return NextResponse.json({ message: "Resale window has closed" }, { status: 400 })
  }

  if (resaleRules.minPrice && price < resaleRules.minPrice) {
    return NextResponse.json({ message: "Price is below the minimum allowed" }, { status: 400 })
  }

  if (resaleRules.maxPrice && price > resaleRules.maxPrice) {
    return NextResponse.json({ message: "Price exceeds the maximum allowed" }, { status: 400 })
  }

  const paid = ticket.pricePaid ? Number(ticket.pricePaid) : null
  if (paid && resaleRules.maxMarkupPercent) {
    const maxPrice = paid * (1 + resaleRules.maxMarkupPercent / 100)
    if (price > maxPrice) {
      return NextResponse.json({ message: "Price exceeds markup limit" }, { status: 400 })
    }
  }

  const record = {
    id: body.id || `res_${crypto.randomUUID()}`,
    ticketId,
    eventId,
    sellerId,
    price,
    status: "active",
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(resaleListings).values(record)

  await logActivity({
    entity: "resale_listing",
    entityId: record.id,
    action: "created",
    summary: `Listed ticket ${ticketId} for resale`,
    metadata: {
      eventId,
      price,
    },
  })

  return NextResponse.json({ ...record, _id: record.id }, { status: 201 })
}
