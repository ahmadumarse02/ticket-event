import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { customers, families } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export async function GET() {
  const customerRows = await db.select().from(customers)
  const familyRows = await db.select().from(families)

  const stats = {
    total: customerRows.length,
    families: familyRows.length,
    totalSpent: customerRows.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0),
    totalTickets: customerRows.reduce((sum, c) => sum + (c.totalTickets || 0), 0),
  }

  return NextResponse.json(stats)
}
