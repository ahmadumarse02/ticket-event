import { NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { customerNotes } from "@/lib/db/schema"
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
    .from(customerNotes)
    .where(eq(customerNotes.customerId, customerId))
    .orderBy(desc(customerNotes.createdAt))

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
  const noteId = body.id || `note_${crypto.randomUUID()}`
  const noteBody = (body.body || "").toString().trim()

  if (!noteBody) {
    return NextResponse.json({ message: "Note is required" }, { status: 400 })
  }

  const user = authResult.session.user as { id?: string | null; name?: string | null }

  const record = {
    id: noteId,
    customerId,
    body: noteBody,
    actorId: user.id ?? null,
    actorName: user.name ?? null,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(customerNotes).values(record)

  await logActivity({
    entity: "customer_note",
    entityId: noteId,
    action: "created",
    summary: `Added CRM note for customer ${customerId}`,
    metadata: {
      customerId,
    },
    actorId: user.id ?? null,
    actorName: user.name ?? null,
  })

  return NextResponse.json({ ...record, _id: record.id }, { status: 201 })
}

