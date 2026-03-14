import { NextResponse } from "next/server"
import { and, desc, eq, gte } from "drizzle-orm"
import { db } from "@/lib/db"
import { events, ticketCheckins, tickets } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

const defaultFraudRules = {
  enabled: true,
  scanWindowMinutes: 10,
  maxAttempts: 3,
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get("eventId") || undefined
  const ticketId = searchParams.get("ticketId") || undefined

  const conditions = []
  if (eventId) conditions.push(eq(ticketCheckins.eventId, eventId))
  if (ticketId) conditions.push(eq(ticketCheckins.ticketId, ticketId))

  const rows = await db
    .select()
    .from(ticketCheckins)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ticketCheckins.scannedAt))

  return NextResponse.json(
    rows.map((row) => ({
      ...row,
      _id: row.id,
    }))
  )
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = Date.now()
  const qrPayload = body.qrPayload

  if (!qrPayload) {
    return NextResponse.json({ message: "QR payload is required" }, { status: 400 })
  }

  const ticketRows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.qrPayload, qrPayload))

  if (!ticketRows.length) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
  }

  const ticket = ticketRows[0]
  const eventId = body.eventId || ticket.eventId

  if (eventId !== ticket.eventId) {
    return NextResponse.json(
      { message: "Ticket is not valid for this event" },
      { status: 400 }
    )
  }

  const eventRows = await db.select().from(events).where(eq(events.id, ticket.eventId))
  const event = eventRows[0]
  const fraudRules = event?.fraudRules ?? defaultFraudRules

  const windowStart = now - (fraudRules.scanWindowMinutes || 10) * 60 * 1000
  const recentScans = await db
    .select()
    .from(ticketCheckins)
    .where(
      and(
        eq(ticketCheckins.ticketId, ticket.id),
        gte(ticketCheckins.scannedAt, windowStart)
      )
    )

  const hasSuccess = recentScans.some((scan) => scan.status === "success")
  const tooManyScans =
    fraudRules.enabled &&
    fraudRules.maxAttempts !== undefined &&
    recentScans.length >= fraudRules.maxAttempts

  let status = "success"
  let reason: string | null = null
  let fraudFlag = false

  if (ticket.status !== "active") {
    if (ticket.status === "checked_in") {
      status = "duplicate"
      reason = "Ticket already checked in"
      fraudFlag = true
    } else {
      status = "invalid"
      reason = "Ticket is not active"
    }
  } else if (hasSuccess) {
    status = "duplicate"
    reason = "Ticket already checked in"
    fraudFlag = true
  } else if (tooManyScans) {
    status = "fraud"
    reason = "Too many scan attempts in a short window"
    fraudFlag = true
  }

  const checkinRecord = {
    id: `chk_${crypto.randomUUID()}`,
    ticketId: ticket.id,
    eventId: ticket.eventId,
    scannerId: body.scannerId ?? null,
    status,
    reason,
    deviceId: body.deviceId ?? null,
    location: body.location ?? null,
    scannedAt: now,
    createdAt: now,
  }

  await db.insert(ticketCheckins).values(checkinRecord)

  if (status === "success") {
    await db
      .update(tickets)
      .set({
        status: "checked_in",
        checkInCount: (ticket.checkInCount || 0) + 1,
        checkedInAt: ticket.checkedInAt ?? now,
        lastCheckInAt: now,
        fraudFlag: false,
        updatedAt: now,
      })
      .where(eq(tickets.id, ticket.id))
  } else if (fraudFlag) {
    await db
      .update(tickets)
      .set({
        fraudFlag: true,
        lastCheckInAt: now,
        updatedAt: now,
      })
      .where(eq(tickets.id, ticket.id))
  }

  await logActivity({
    entity: "checkin",
    entityId: checkinRecord.id,
    action: status,
    summary: `Check-in ${status} for ticket ${ticket.id}`,
    metadata: {
      eventId: ticket.eventId,
      reason,
    },
  })

  return NextResponse.json({
    ...checkinRecord,
    _id: checkinRecord.id,
    ticket: {
      ...ticket,
      _id: ticket.id,
    },
  })
}
