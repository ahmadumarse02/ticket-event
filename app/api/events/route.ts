import { NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { events } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || undefined
  const type = searchParams.get("type") || undefined
  const limitParam = searchParams.get("limit")

  const conditions = []
  if (status) conditions.push(eq(events.status, status))
  if (type) conditions.push(eq(events.type, type))

  const query = db
    .select()
    .from(events)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(events.startDate))

  const rows = limitParam
    ? await query.limit(Number(limitParam))
    : await query

  const mapped = rows.map((row) => ({
    ...row,
    _id: row.id,
    priceTiers: row.priceTiers || [],
    tags: row.tags || [],
    recurrence: {
      type: row.recurrenceType,
      interval: row.recurrenceInterval ?? undefined,
      endDate: row.recurrenceEndDate ?? undefined,
    },
  }))

  return NextResponse.json(mapped)
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = Date.now()
  const id = body.id || `evt_${crypto.randomUUID()}`

  const record = {
    id,
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
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(events).values(record)
  const created = await db.select().from(events).where(eq(events.id, id))

  await logActivity({
    entity: "event",
    entityId: id,
    action: "created",
    summary: `Created event "${record.name}"`,
    metadata: {
      status: record.status,
      type: record.type,
    },
  })

  return NextResponse.json(
    {
      ...created[0],
      _id: created[0].id,
      priceTiers: created[0].priceTiers || [],
      tags: created[0].tags || [],
      recurrence: {
        type: created[0].recurrenceType,
        interval: created[0].recurrenceInterval ?? undefined,
        endDate: created[0].recurrenceEndDate ?? undefined,
      },
    },
    { status: 201 }
  )
}
