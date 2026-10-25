import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { customerFollowUps } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { hasAdminRole } from "@/lib/auth-utils"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string; followUpId: string }> }

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = (session?.user as { role?: string | string[] | null } | undefined)?.role
  if (!session) return { ok: false as const, status: 401 as const, session: null }
  if (!hasAdminRole(role)) return { ok: false as const, status: 403 as const, session: null }
  return { ok: true as const, status: 200 as const, session }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const authResult = await requireAdmin()
  if (!authResult.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: authResult.status })
  }

  const { id: customerId, followUpId } = await params
  const body = await request.json()
  const now = Date.now()

  const updates: Record<string, unknown> = { updatedAt: now }
  if ("title" in body) {
    const title = (body.title || "").toString().trim()
    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 })
    }
    updates.title = title
  }
  if ("notes" in body) updates.notes = body.notes ? body.notes.toString() : null
  if ("dueAt" in body) {
    const dueAt = Number(body.dueAt)
    if (Number.isNaN(dueAt) || dueAt <= 0) {
      return NextResponse.json({ message: "Due date is required" }, { status: 400 })
    }
    updates.dueAt = dueAt
  }
  if ("priority" in body) {
    const priority = (body.priority || "").toString()
    if (!["low", "medium", "high"].includes(priority)) {
      return NextResponse.json({ message: "Invalid priority" }, { status: 400 })
    }
    updates.priority = priority
  }
  if ("status" in body) {
    const status = (body.status || "").toString()
    if (!["open", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 })
    }
    updates.status = status
    if (status === "completed") updates.completedAt = now
    if (status !== "completed") updates.completedAt = null
  }

  const [updated] = await db
    .update(customerFollowUps)
    .set(updates)
    .where(and(eq(customerFollowUps.id, followUpId), eq(customerFollowUps.customerId, customerId)))
    .returning()

  if (!updated) {
    return NextResponse.json({ message: "Follow-up not found" }, { status: 404 })
  }

  const user = authResult.session.user as { id?: string | null; name?: string | null }

  await logActivity({
    entity: "customer_followup",
    entityId: updated.id,
    action: "updated",
    summary: `Updated follow-up reminder for customer ${customerId}`,
    metadata: { customerId, status: updated.status },
    actorId: user.id ?? null,
    actorName: user.name ?? null,
  })

  return NextResponse.json({ ...updated, _id: updated.id })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const authResult = await requireAdmin()
  if (!authResult.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: authResult.status })
  }

  const { id: customerId, followUpId } = await params
  const deleted = await db
    .delete(customerFollowUps)
    .where(and(eq(customerFollowUps.id, followUpId), eq(customerFollowUps.customerId, customerId)))
    .returning({ id: customerFollowUps.id })

  if (!deleted.length) {
    return NextResponse.json({ message: "Follow-up not found" }, { status: 404 })
  }

  const user = authResult.session.user as { id?: string | null; name?: string | null }

  await logActivity({
    entity: "customer_followup",
    entityId: deleted[0].id,
    action: "deleted",
    summary: `Deleted follow-up reminder for customer ${customerId}`,
    metadata: { customerId },
    actorId: user.id ?? null,
    actorName: user.name ?? null,
  })

  return new NextResponse(null, { status: 204 })
}

