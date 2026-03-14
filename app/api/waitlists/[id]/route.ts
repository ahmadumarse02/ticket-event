import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { waitlistEntries } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = { updatedAt: Date.now() }
  if ("status" in body) updates.status = body.status
  if ("notes" in body) updates.notes = body.notes ?? null

  const [updated] = await db
    .update(waitlistEntries)
    .set(updates)
    .where(eq(waitlistEntries.id, id))
    .returning()

  if (!updated) {
    return NextResponse.json({ message: "Waitlist entry not found" }, { status: 404 })
  }

  await logActivity({
    entity: "waitlist",
    entityId: updated.id,
    action: "updated",
    summary: `Updated waitlist entry ${updated.id}`,
    metadata: {
      status: updated.status,
    },
  })

  return NextResponse.json({ ...updated, _id: updated.id })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const deleted = await db
    .delete(waitlistEntries)
    .where(eq(waitlistEntries.id, id))
    .returning({ id: waitlistEntries.id })

  if (!deleted.length) {
    return NextResponse.json({ message: "Waitlist entry not found" }, { status: 404 })
  }

  await logActivity({
    entity: "waitlist",
    entityId: deleted[0].id,
    action: "deleted",
    summary: `Removed waitlist entry ${deleted[0].id}`,
  })

  return new NextResponse(null, { status: 204 })
}
