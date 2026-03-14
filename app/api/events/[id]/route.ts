import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { events } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const rows = await db.select().from(events).where(eq(events.id, id))
  if (!rows.length) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 })
  }
  return NextResponse.json({
    ...rows[0],
    _id: rows[0].id,
    priceTiers: rows[0].priceTiers || [],
    tags: rows[0].tags || [],
    seatSelectionEnabled: rows[0].seatSelectionEnabled ?? false,
    seatMap: rows[0].seatMap ?? null,
    transferRules: rows[0].transferRules ?? { enabled: true, maxTransfersPerTicket: 1, requireRecipientEmail: false },
    resaleRules: rows[0].resaleRules ?? { enabled: false, maxMarkupPercent: 10 },
    fraudRules: rows[0].fraudRules ?? { enabled: true, scanWindowMinutes: 10, maxAttempts: 3 },
    waitlistEnabled: rows[0].waitlistEnabled ?? false,
    waitlistCapacity: rows[0].waitlistCapacity ?? null,
    recurrence: {
      type: rows[0].recurrenceType,
      interval: rows[0].recurrenceInterval ?? undefined,
      endDate: rows[0].recurrenceEndDate ?? undefined,
    },
  })
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params
  const body = await request.json()
  const updates = {
    name: body.name,
    description: body.description ?? null,
    type: body.type,
    status: body.status,
    venue: body.venue ?? null,
    address: body.address ?? null,
    city: body.city ?? null,
    country: body.country ?? null,
    onlineUrl: body.onlineUrl ?? null,
    onlinePlatform: body.onlinePlatform ?? null,
    startDate: body.startDate,
    endDate: body.endDate,
    timezone: body.timezone ?? null,
    recurrenceType: body.recurrence?.type ?? "none",
    recurrenceInterval: body.recurrence?.interval ?? null,
    recurrenceEndDate: body.recurrence?.endDate ?? null,
    capacity: body.capacity ?? null,
    isFree: !!body.isFree,
    priceTiers: body.priceTiers ?? [],
    imageUrl: body.imageUrl ?? null,
    ticketTemplateId: body.ticketTemplateId ?? null,
    tags: body.tags ?? null,
    seatSelectionEnabled: !!body.seatSelectionEnabled,
    seatMap: body.seatMap ?? null,
    transferRules: body.transferRules ?? { enabled: true, maxTransfersPerTicket: 1, requireRecipientEmail: false },
    resaleRules: body.resaleRules ?? { enabled: false, maxMarkupPercent: 10 },
    fraudRules: body.fraudRules ?? { enabled: true, scanWindowMinutes: 10, maxAttempts: 3 },
    waitlistEnabled: !!body.waitlistEnabled,
    waitlistCapacity: body.waitlistCapacity ?? null,
    updatedAt: Date.now(),
  }

  const [updated] = await db.update(events).set(updates).where(eq(events.id, id)).returning()

  if (!updated) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 })
  }

  await logActivity({
    entity: "event",
    entityId: updated.id,
    action: "updated",
    summary: `Updated event "${updated.name}"`,
    metadata: {
      status: updated.status,
      type: updated.type,
    },
  })

  return NextResponse.json({
    ...updated,
    _id: updated.id,
    priceTiers: updated.priceTiers || [],
    tags: updated.tags || [],
    seatSelectionEnabled: updated.seatSelectionEnabled ?? false,
    seatMap: updated.seatMap ?? null,
    transferRules: updated.transferRules ?? { enabled: true, maxTransfersPerTicket: 1, requireRecipientEmail: false },
    resaleRules: updated.resaleRules ?? { enabled: false, maxMarkupPercent: 10 },
    fraudRules: updated.fraudRules ?? { enabled: true, scanWindowMinutes: 10, maxAttempts: 3 },
    waitlistEnabled: updated.waitlistEnabled ?? false,
    waitlistCapacity: updated.waitlistCapacity ?? null,
    recurrence: {
      type: updated.recurrenceType,
      interval: updated.recurrenceInterval ?? undefined,
      endDate: updated.recurrenceEndDate ?? undefined,
    },
  })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const deleted = await db
    .delete(events)
    .where(eq(events.id, id))
    .returning({ id: events.id, name: events.name })

  if (!deleted.length) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 })
  }

  await logActivity({
    entity: "event",
    entityId: deleted[0].id,
    action: "deleted",
    summary: `Deleted event "${deleted[0].name}"`,
  })
  return new NextResponse(null, { status: 204 })
}
