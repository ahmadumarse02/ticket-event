import { NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { events, ticketTransfers, tickets } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get("eventId") || undefined
  const status = searchParams.get("status") || undefined

  const conditions = []
  if (status) conditions.push(eq(ticketTransfers.status, status))
  if (eventId) conditions.push(eq(tickets.eventId, eventId))

  const rows = await db
    .select({ transfer: ticketTransfers, ticket: tickets })
    .from(ticketTransfers)
    .leftJoin(tickets, eq(ticketTransfers.ticketId, tickets.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ticketTransfers.createdAt))

  return NextResponse.json(
    rows.map((row) => ({
      ...row.transfer,
      _id: row.transfer.id,
      ticket: row.ticket ? { ...row.ticket, _id: row.ticket.id } : undefined,
    }))
  )
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = Date.now()
  const ticketId = body.ticketId

  if (!ticketId) {
    return NextResponse.json({ message: "Ticket id is required" }, { status: 400 })
  }

  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId))
  if (!ticketRows.length) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
  }

  const ticket = ticketRows[0]
  const eventRows = await db.select().from(events).where(eq(events.id, ticket.eventId))
  const event = eventRows[0]
  const transferRules = event?.transferRules ?? { enabled: true }

  if (!transferRules.enabled) {
    return NextResponse.json({ message: "Transfers are disabled for this event" }, { status: 400 })
  }

  if (ticket.status !== "active") {
    return NextResponse.json({ message: "Ticket is not eligible for transfer" }, { status: 400 })
  }

  if (transferRules.requireRecipientEmail && !body.toCustomerId) {
    return NextResponse.json(
      { message: "Recipient is required for transfer" },
      { status: 400 }
    )
  }

  if (ticket.customerId && body.fromCustomerId && body.fromCustomerId !== ticket.customerId) {
    return NextResponse.json(
      { message: "Transfer owner does not match ticket holder" },
      { status: 400 }
    )
  }

  if (
    transferRules.maxTransfersPerTicket !== undefined &&
    (ticket.transferCount || 0) >= transferRules.maxTransfersPerTicket
  ) {
    return NextResponse.json(
      { message: "Transfer limit reached for this ticket" },
      { status: 400 }
    )
  }

  const record = {
    id: body.id || `xfer_${crypto.randomUUID()}`,
    ticketId,
    fromCustomerId: body.fromCustomerId ?? ticket.customerId ?? null,
    toCustomerId: body.toCustomerId ?? null,
    status: "pending",
    transferToken: `token_${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(ticketTransfers).values(record)

  await logActivity({
    entity: "ticket_transfer",
    entityId: record.id,
    action: "created",
    summary: `Created transfer for ticket ${ticketId}`,
    metadata: {
      eventId: ticket.eventId,
    },
  })

  return NextResponse.json({ ...record, _id: record.id }, { status: 201 })
}
