import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { packages } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export async function GET() {
  const rows = await db.select().from(packages)
  const stats = {
    total: rows.length,
    active: rows.filter((p) => p.status === "active").length,
  }
  return NextResponse.json(stats)
}
