import { NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { events, waitlistEntries } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get("eventId") || undefined
  const status = searchParams.get("status") || undefined

  const conditions = []
  if (eventId) conditions.push(eq(waitlistEntries.eventId, eventId))
  if (status) conditions.push(eq(waitlistEntries.status, status))

  const rows = await db
    .select()
    .from(waitlistEntries)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(waitlistEntries.createdAt))

  return NextResponse.json(rows.map((row) => ({ ...row, _id: row.id })))
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = Date.now()
  const eventId = body.eventId
  const customerId = body.customerId
  const quantity = body.quantity ?? 1

  if (!eventId || !customerId) {
    return NextResponse.json({ message: "Event and customer are required" }, { status: 400 })
  }

  const eventRows = await db.select().from(events).where(eq(events.id, eventId))
  const event = eventRows[0]

  if (!event) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 })
  }

  if (!event?.waitlistEnabled) {
    return NextResponse.json({ message: "Waitlist is not enabled" }, { status: 400 })
  }

  const existing = await db
    .select()
    .from(waitlistEntries)
    .where(and(eq(waitlistEntries.eventId, eventId), eq(waitlistEntries.customerId, customerId)))

  if (existing.length) {
    return NextResponse.json({ ...existing[0], _id: existing[0].id })
  }

  const activeEntries = await db
    .select()
    .from(waitlistEntries)
    .where(and(eq(waitlistEntries.eventId, eventId), eq(waitlistEntries.status, "active")))

  if (event.waitlistCapacity && activeEntries.length >= event.waitlistCapacity) {
    return NextResponse.json({ message: "Waitlist is full" }, { status: 400 })
  }

  if (Number.isNaN(Number(quantity)) || Number(quantity) <= 0) {
    return NextResponse.json({ message: "Quantity must be at least 1" }, { status: 400 })
  }

  const record = {
    id: body.id || `wl_${crypto.randomUUID()}`,
    eventId,
    customerId,
    status: "active",
    quantity,
    position: activeEntries.length + 1,
    notes: body.notes ?? null,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(waitlistEntries).values(record)

  await logActivity({
    entity: "waitlist",
    entityId: record.id,
    action: "created",
    summary: `Added customer ${customerId} to waitlist`,
    metadata: {
      eventId,
    },
  })

  return NextResponse.json({ ...record, _id: record.id }, { status: 201 })
}
