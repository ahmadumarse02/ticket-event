import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { customerNotes } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { hasAdminRole } from "@/lib/auth-utils"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string; noteId: string }> }

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

  const { id: customerId, noteId } = await params
  const body = await request.json()
  const noteBody = (body.body || "").toString().trim()
  if (!noteBody) {
    return NextResponse.json({ message: "Note is required" }, { status: 400 })
  }

  const now = Date.now()
  const [updated] = await db
    .update(customerNotes)
    .set({ body: noteBody, updatedAt: now })
    .where(and(eq(customerNotes.id, noteId), eq(customerNotes.customerId, customerId)))
    .returning()

  if (!updated) {
    return NextResponse.json({ message: "Note not found" }, { status: 404 })
  }

  const user = authResult.session.user as { id?: string | null; name?: string | null }

  await logActivity({
    entity: "customer_note",
    entityId: updated.id,
    action: "updated",
    summary: `Updated CRM note for customer ${customerId}`,
    metadata: { customerId },
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

  const { id: customerId, noteId } = await params
  const deleted = await db
    .delete(customerNotes)
    .where(and(eq(customerNotes.id, noteId), eq(customerNotes.customerId, customerId)))
    .returning({ id: customerNotes.id })

  if (!deleted.length) {
    return NextResponse.json({ message: "Note not found" }, { status: 404 })
  }

  const user = authResult.session.user as { id?: string | null; name?: string | null }

  await logActivity({
    entity: "customer_note",
    entityId: deleted[0].id,
    action: "deleted",
    summary: `Deleted CRM note for customer ${customerId}`,
    metadata: { customerId },
    actorId: user.id ?? null,
    actorName: user.name ?? null,
  })

  return new NextResponse(null, { status: 204 })
}

