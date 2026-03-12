import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { ticketTemplates } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const rows = await db
    .select()
    .from(ticketTemplates)
    .where(eq(ticketTemplates.id, id))
  if (!rows.length) {
    return NextResponse.json({ message: "Template not found" }, { status: 404 })
  }
  return NextResponse.json({ ...rows[0], _id: rows[0].id })
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params
  const body = await request.json()
  const updates = {
    name: body.name,
    description: body.description ?? null,
    isDefault: body.isDefault ?? false,
    width: body.width,
    height: body.height,
    backgroundColor: body.backgroundColor,
    elements: body.elements ?? [],
    previewUrl: body.previewUrl ?? null,
    updatedAt: Date.now(),
  }

  const [updated] = await db
    .update(ticketTemplates)
    .set(updates)
    .where(eq(ticketTemplates.id, id))
    .returning()

  if (!updated) {
    return NextResponse.json({ message: "Template not found" }, { status: 404 })
  }

  await logActivity({
    entity: "ticket_template",
    entityId: updated.id,
    action: "updated",
    summary: `Updated ticket template "${updated.name}"`,
    metadata: {
      isDefault: updated.isDefault,
    },
  })

  return NextResponse.json({ ...updated, _id: updated.id })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const deleted = await db
    .delete(ticketTemplates)
    .where(eq(ticketTemplates.id, id))
    .returning({ id: ticketTemplates.id, name: ticketTemplates.name })

  if (!deleted.length) {
    return NextResponse.json({ message: "Template not found" }, { status: 404 })
  }

  await logActivity({
    entity: "ticket_template",
    entityId: deleted[0].id,
    action: "deleted",
    summary: `Deleted ticket template "${deleted[0].name}"`,
  })
  return new NextResponse(null, { status: 204 })
}
