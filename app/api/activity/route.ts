import { NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { activityLogs } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit") ?? "12")
  const entity = searchParams.get("entity") || undefined
  const entityId = searchParams.get("entityId") || undefined
  const action = searchParams.get("action") || undefined

  const conditions = []
  if (entity) conditions.push(eq(activityLogs.entity, entity))
  if (entityId) conditions.push(eq(activityLogs.entityId, entityId))
  if (action) conditions.push(eq(activityLogs.action, action))

  const rows = await db
    .select()
    .from(activityLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(activityLogs.createdAt))
    .limit(Number.isFinite(limit) ? limit : 12)

  const mapped = rows.map((row) => ({
    ...row,
    _id: row.id,
    metadata: row.metadata || {},
  }))

  return NextResponse.json(mapped)
}
