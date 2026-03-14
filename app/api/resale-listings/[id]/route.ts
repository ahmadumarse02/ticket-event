import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { resaleListings, tickets } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params
  const body = await request.json()
  const now = Date.now()

  const rows = await db.select().from(resaleListings).where(eq(resaleListings.id, id))
  if (!rows.length) {
    return NextResponse.json({ message: "Resale listing not found" }, { status: 404 })
  }

  const listing = rows[0]
  const updates: Record<string, unknown> = { updatedAt: now }

  if ("status" in body) updates.status = body.status
  if ("price" in body) updates.price = body.price

  const [updated] = await db
    .update(resaleListings)
    .set(updates)
    .where(eq(resaleListings.id, id))
    .returning()

  if (!updated) {
    return NextResponse.json({ message: "Resale listing not found" }, { status: 404 })
  }

  if (body.status === "sold" && body.buyerId) {
    await db
      .update(tickets)
      .set({ customerId: body.buyerId, updatedAt: now })
      .where(eq(tickets.id, listing.ticketId))
  }

  await logActivity({
    entity: "resale_listing",
    entityId: updated.id,
    action: "updated",
    summary: `Updated resale listing ${updated.id}`,
    metadata: {
      status: updated.status,
    },
  })

  return NextResponse.json({ ...updated, _id: updated.id })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const deleted = await db
    .delete(resaleListings)
    .where(eq(resaleListings.id, id))
    .returning({ id: resaleListings.id })

  if (!deleted.length) {
    return NextResponse.json({ message: "Resale listing not found" }, { status: 404 })
  }

  await logActivity({
    entity: "resale_listing",
    entityId: deleted[0].id,
    action: "deleted",
    summary: `Deleted resale listing ${deleted[0].id}`,
  })

  return new NextResponse(null, { status: 204 })
}
