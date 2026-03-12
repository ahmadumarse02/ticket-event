import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { ticketTemplates } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export async function GET() {
  const rows = await db
    .select()
    .from(ticketTemplates)
    .orderBy(desc(ticketTemplates.createdAt))
  const mapped = rows.map((row) => ({ ...row, _id: row.id }))
  return NextResponse.json(mapped)
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = Date.now()
  const id = body.id || `tt_${crypto.randomUUID()}`

  await db.insert(ticketTemplates).values({
    id,
    name: body.name,
    description: body.description ?? null,
    isDefault: body.isDefault ?? false,
    width: body.width,
    height: body.height,
    backgroundColor: body.backgroundColor,
    elements: body.elements ?? [],
    previewUrl: body.previewUrl ?? null,
    createdAt: now,
    updatedAt: now,
  })

  const rows = await db.select().from(ticketTemplates).where(eq(ticketTemplates.id, id))
  return NextResponse.json({ ...rows[0], _id: rows[0].id }, { status: 201 })
}
