import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { ticketTransfers, tickets } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const rows = await db.select().from(ticketTransfers).where(eq(ticketTransfers.id, id))
  if (!rows.length) {
    return NextResponse.json({ message: "Transfer not found" }, { status: 404 })
  }
  return NextResponse.json({ ...rows[0], _id: rows[0].id })
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params
  const body = await request.json()
  const action = body.action as "accept" | "decline" | "cancel"

  const rows = await db.select().from(ticketTransfers).where(eq(ticketTransfers.id, id))
  if (!rows.length) {
    return NextResponse.json({ message: "Transfer not found" }, { status: 404 })
  }

  const transfer = rows[0]
  const now = Date.now()

  if (!action) {
    return NextResponse.json({ message: "Action is required" }, { status: 400 })
  }

  let nextStatus = transfer.status
  if (action === "accept") nextStatus = "accepted"
  if (action === "decline") nextStatus = "declined"
  if (action === "cancel") nextStatus = "cancelled"

  if (action === "accept" && !transfer.toCustomerId) {
    return NextResponse.json(
      { message: "Transfer is missing a recipient" },
      { status: 400 }
    )
  }

  const [updatedTransfer] = await db
    .update(ticketTransfers)
    .set({ status: nextStatus, updatedAt: now })
    .where(eq(ticketTransfers.id, id))
    .returning()

  if (!updatedTransfer) {
    return NextResponse.json({ message: "Transfer not found" }, { status: 404 })
  }

  if (action === "accept" && transfer.toCustomerId) {
    const ticketRows = await db.select().from(tickets).where(eq(tickets.id, transfer.ticketId))
    const ticket = ticketRows[0]
    if (ticket) {
      await db
        .update(tickets)
        .set({
          customerId: transfer.toCustomerId,
          transferCount: (ticket.transferCount || 0) + 1,
          updatedAt: now,
        })
        .where(eq(tickets.id, ticket.id))
    }
  }

  await logActivity({
    entity: "ticket_transfer",
    entityId: updatedTransfer.id,
    action: updatedTransfer.status,
    summary: `Transfer ${updatedTransfer.status} for ticket ${updatedTransfer.ticketId}`,
  })

  return NextResponse.json({ ...updatedTransfer, _id: updatedTransfer.id })
}
