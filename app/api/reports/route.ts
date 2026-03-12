import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { savedReports } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export async function GET() {
  const rows = await db.select().from(savedReports).orderBy(desc(savedReports.createdAt))
  const mapped = rows.map((row) => ({ ...row, _id: row.id }))
  return NextResponse.json(mapped)
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = Date.now()
  const id = body.id || `rpt_${crypto.randomUUID()}`

  await db.insert(savedReports).values({
    id,
    name: body.name,
    type: body.type,
    filters: body.filters ?? {},
    columns: body.columns ?? [],
    groupBy: body.groupBy ?? null,
    sortBy: body.sortBy ?? null,
    sortOrder: body.sortOrder ?? null,
    chartType: body.chartType ?? null,
    createdAt: now,
    updatedAt: now,
  })

  const rows = await db.select().from(savedReports).where(eq(savedReports.id, id))
  return NextResponse.json({ ...rows[0], _id: rows[0].id }, { status: 201 })
}
