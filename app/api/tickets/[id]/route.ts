import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { tickets } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

const toNumber = (value: unknown) =>
  value === null || value === undefined ? null : Number(value)

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const rows = await db.select().from(tickets).where(eq(tickets.id, id))
  if (!rows.length) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
  }
  return NextResponse.json({
    ...rows[0],
    _id: rows[0].id,
    pricePaid: toNumber(rows[0].pricePaid),
  })
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params
  const body = await request.json()
  const updates: Record<string, unknown> = { updatedAt: Date.now() }

  if ("customerId" in body) updates.customerId = body.customerId ?? null
  if ("transactionId" in body) updates.transactionId = body.transactionId ?? null
  if ("status" in body) updates.status = body.status
  if ("priceTierName" in body) updates.priceTierName = body.priceTierName ?? null
  if ("pricePaid" in body) updates.pricePaid = body.pricePaid ?? null
  if ("qrPayload" in body) updates.qrPayload = body.qrPayload
  if ("seatSection" in body) updates.seatSection = body.seatSection ?? null
  if ("seatRow" in body) updates.seatRow = body.seatRow ?? null
  if ("seatNumber" in body) updates.seatNumber = body.seatNumber ?? null
  if ("transferCount" in body) updates.transferCount = body.transferCount ?? 0
  if ("checkInCount" in body) updates.checkInCount = body.checkInCount ?? 0
  if ("checkedInAt" in body) updates.checkedInAt = body.checkedInAt ?? null
  if ("lastCheckInAt" in body) updates.lastCheckInAt = body.lastCheckInAt ?? null
  if ("fraudFlag" in body) updates.fraudFlag = body.fraudFlag ?? false

  const [updated] = await db
    .update(tickets)
    .set(updates)
    .where(eq(tickets.id, id))
    .returning()

  if (!updated) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
  }

  await logActivity({
    entity: "ticket",
    entityId: updated.id,
    action: "updated",
    summary: `Updated ticket ${updated.id}`,
    metadata: {
      status: updated.status,
    },
  })

  return NextResponse.json({
    ...updated,
    _id: updated.id,
    pricePaid: toNumber(updated.pricePaid),
  })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const deleted = await db
    .delete(tickets)
    .where(eq(tickets.id, id))
    .returning({ id: tickets.id })

  if (!deleted.length) {
    return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
  }

  await logActivity({
    entity: "ticket",
    entityId: deleted[0].id,
    action: "deleted",
    summary: `Deleted ticket ${deleted[0].id}`,
  })

  return new NextResponse(null, { status: 204 })
}
