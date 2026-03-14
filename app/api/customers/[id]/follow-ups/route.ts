import { NextResponse } from "next/server"
import { and, asc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { customerFollowUps } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { hasAdminRole } from "@/lib/auth-utils"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = (session?.user as { role?: string | string[] | null } | undefined)?.role
  if (!session) return { ok: false as const, status: 401 as const, session: null }
  if (!hasAdminRole(role)) return { ok: false as const, status: 403 as const, session: null }
  return { ok: true as const, status: 200 as const, session }
}

export async function GET(_request: Request, { params }: RouteContext) {
  const authResult = await requireAdmin()
  if (!authResult.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: authResult.status })
  }

  const { id: customerId } = await params
  const rows = await db
    .select()
    .from(customerFollowUps)
    .where(eq(customerFollowUps.customerId, customerId))
    .orderBy(asc(customerFollowUps.dueAt))

  return NextResponse.json(rows.map((row) => ({ ...row, _id: row.id })))
}

export async function POST(request: Request, { params }: RouteContext) {
  const authResult = await requireAdmin()
  if (!authResult.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: authResult.status })
  }

  const { id: customerId } = await params
  const body = await request.json()
  const now = Date.now()

  const title = (body.title || "").toString().trim()
  const dueAt = Number(body.dueAt)
  const priority = (body.priority || "medium").toString()
  const notes = body.notes ? body.notes.toString() : null

  if (!title) {
    return NextResponse.json({ message: "Title is required" }, { status: 400 })
  }

  if (Number.isNaN(dueAt) || dueAt <= 0) {
    return NextResponse.json({ message: "Due date is required" }, { status: 400 })
  }

  if (!["low", "medium", "high"].includes(priority)) {
    return NextResponse.json({ message: "Invalid priority" }, { status: 400 })
  }

  const user = authResult.session.user as { id?: string | null; name?: string | null }
  const followUpId = body.id || `fup_${crypto.randomUUID()}`

  const record = {
    id: followUpId,
    customerId,
    title,
    notes,
    dueAt,
    status: "open",
    priority,
    completedAt: null,
    actorId: user.id ?? null,
    actorName: user.name ?? null,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(customerFollowUps).values(record)

  await logActivity({
    entity: "customer_followup",
    entityId: followUpId,
    action: "created",
    summary: `Added follow-up reminder for customer ${customerId}`,
    metadata: { customerId, dueAt, priority },
    actorId: user.id ?? null,
    actorName: user.name ?? null,
  })

  return NextResponse.json({ ...record, _id: record.id }, { status: 201 })
}

