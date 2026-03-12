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
