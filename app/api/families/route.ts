import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { customers, families } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export async function GET() {
  const rows = await db.select().from(families).orderBy(desc(families.createdAt))
  const mapped = rows.map((row) => ({ ...row, _id: row.id }))
  return NextResponse.json(mapped)
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = Date.now()
  const id = body.id || `fam_${crypto.randomUUID()}`

  await db.insert(families).values({
    id,
    name: body.name,
    headCustomerId: body.headCustomerId,
    createdAt: now,
    updatedAt: now,
  })

  if (body.headCustomerId) {
    await db
      .update(customers)
      .set({
        familyId: id,
        relationshipToHead: "head",
        updatedAt: now,
      })
      .where(eq(customers.id, body.headCustomerId))
  }

  const rows = await db.select().from(families).where(eq(families.id, id))
  return NextResponse.json({ ...rows[0], _id: rows[0].id }, { status: 201 })
}
