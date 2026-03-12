import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { packages } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const rows = await db.select().from(packages).where(eq(packages.id, id))
  if (!rows.length) {
    return NextResponse.json({ message: "Package not found" }, { status: 404 })
  }
  return NextResponse.json({
    ...rows[0],
    _id: rows[0].id,
    price: Number(rows[0].price),
    originalPrice: rows[0].originalPrice ? Number(rows[0].originalPrice) : null,
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
    updatedAt: Date.now(),
  }

  const [updated] = await db
    .update(packages)
    .set(updates)
    .where(eq(packages.id, id))
    .returning()

  if (!updated) {
    return NextResponse.json({ message: "Package not found" }, { status: 404 })
  }

  await logActivity({
    entity: "package",
    entityId: updated.id,
    action: "updated",
    summary: `Updated package "${updated.name}"`,
    metadata: {
      type: updated.type,
      status: updated.status,
    },
  })

  return NextResponse.json({
    ...updated,
    _id: updated.id,
    price: Number(updated.price),
    originalPrice: updated.originalPrice ? Number(updated.originalPrice) : null,
  })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const deleted = await db
    .delete(packages)
    .where(eq(packages.id, id))
    .returning({ id: packages.id, name: packages.name })

  if (!deleted.length) {
    return NextResponse.json({ message: "Package not found" }, { status: 404 })
  }

  await logActivity({
    entity: "package",
    entityId: deleted[0].id,
    action: "deleted",
    summary: `Deleted package "${deleted[0].name}"`,
  })
  return new NextResponse(null, { status: 204 })
}
