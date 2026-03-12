import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { packages } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

export async function GET() {
  const rows = await db.select().from(packages).orderBy(desc(packages.createdAt))
  const mapped = rows.map((row) => ({
    ...row,
    _id: row.id,
    price: Number(row.price),
    originalPrice: row.originalPrice ? Number(row.originalPrice) : null,
  }))
  return NextResponse.json(mapped)
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = Date.now()
  const id = body.id || `pkg_${crypto.randomUUID()}`

  await db.insert(packages).values({
    id,
    name: body.name,
    description: body.description ?? null,
    type: body.type,
    status: body.status,
    bundleItems: body.bundleItems ?? null,
    includedEventIds: body.includedEventIds ?? null,
    passValidDays: body.passValidDays ?? null,
    addonType: body.addonType ?? null,
    price: body.price,
    originalPrice: body.originalPrice ?? null,
    eventId: body.eventId ?? null,
    isGlobal: body.isGlobal ?? false,
    maxQuantity: body.maxQuantity ?? null,
    totalAvailable: body.totalAvailable ?? null,
    createdAt: now,
    updatedAt: now,
  })

  const rows = await db.select().from(packages).where(eq(packages.id, id))

  await logActivity({
    entity: "package",
    entityId: id,
    action: "created",
    summary: `Created package "${body.name}"`,
    metadata: {
      type: body.type,
      status: body.status,
    },
  })

  return NextResponse.json(
    {
      ...rows[0],
      _id: rows[0].id,
      price: Number(rows[0].price),
      originalPrice: rows[0].originalPrice ? Number(rows[0].originalPrice) : null,
    },
    { status: 201 }
  )
}
