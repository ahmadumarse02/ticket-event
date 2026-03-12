import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { events } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export async function GET() {
  const rows = await db.select().from(events)
  const now = Date.now()

  const stats = {
    total: rows.length,
    published: rows.filter((e) => e.status === "published").length,
    draft: rows.filter((e) => e.status === "draft").length,
    upcoming: rows.filter((e) => e.startDate > now && e.status === "published").length,
    physical: rows.filter((e) => e.type === "physical").length,
    online: rows.filter((e) => e.type === "online").length,
  }

  return NextResponse.json(stats)
}
