import { NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { tickets } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

const toNumber = (value: unknown) =>
  value === null || value === undefined ? null : Number(value)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get("eventId") || undefined
  const customerId = searchParams.get("customerId") || undefined
  const status = searchParams.get("status") || undefined

  const conditions = []
  if (eventId) conditions.push(eq(tickets.eventId, eventId))
  if (customerId) conditions.push(eq(tickets.customerId, customerId))
  if (status) conditions.push(eq(tickets.status, status))

  const rows = await db
    .select()
    .from(tickets)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(tickets.issuedAt))

  const mapped = rows.map((row) => ({
    ...row,
    _id: row.id,
    pricePaid: toNumber(row.pricePaid),
  }))

  return NextResponse.json(mapped)
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = Date.now()
  const id = body.id || `tkt_${crypto.randomUUID()}`
  const qrPayload = body.qrPayload || `QR-${crypto.randomUUID()}`

  if (!body.eventId) {
    return NextResponse.json({ message: "Event id is required" }, { status: 400 })
  }

  const record = {
    id,
    eventId: body.eventId,
    customerId: body.customerId ?? null,
    transactionId: body.transactionId ?? null,
    status: body.status ?? "active",
    priceTierName: body.priceTierName ?? null,
    pricePaid: body.pricePaid ?? null,
    qrPayload,
    seatSection: body.seatSection ?? null,
    seatRow: body.seatRow ?? null,
    seatNumber: body.seatNumber ?? null,
    transferCount: body.transferCount ?? 0,
    checkInCount: body.checkInCount ?? 0,
    checkedInAt: body.checkedInAt ?? null,
    lastCheckInAt: body.lastCheckInAt ?? null,
    fraudFlag: body.fraudFlag ?? false,
    issuedAt: body.issuedAt ?? now,
    updatedAt: now,
  }

  await db.insert(tickets).values(record)

  await logActivity({
    entity: "ticket",
    entityId: id,
    action: "created",
    summary: `Issued ticket ${id} for event ${record.eventId}`,
    metadata: {
      eventId: record.eventId,
      status: record.status,
    },
  })

  return NextResponse.json(
    {
      ...record,
      _id: id,
      pricePaid: toNumber(record.pricePaid),
    },
    { status: 201 }
  )
}
