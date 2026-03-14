import { NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { customers } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const familyId = searchParams.get("familyId") || undefined

  const rows = await db
    .select()
    .from(customers)
    .where(familyId ? eq(customers.familyId, familyId) : undefined)
    .orderBy(desc(customers.createdAt))

  const mapped = rows.map((row) => ({
    ...row,
    _id: row.id,
    totalSpent: Number(row.totalSpent || 0),
    segmentTags: row.segmentTags || [],
  }))

  return NextResponse.json(mapped)
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = Date.now()
  const id = body.id || `cus_${crypto.randomUUID()}`

  await db.insert(customers).values({
    id,
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone ?? null,
    dateOfBirth: body.dateOfBirth ?? null,
    age: body.age ?? null,
    address: body.address ?? null,
    city: body.city ?? null,
    country: body.country ?? null,
    postalCode: body.postalCode ?? null,
    notes: body.notes ?? null,
    segmentTags: body.segmentTags ?? [],
    familyId: body.familyId ?? null,
    relationshipToHead: body.relationshipToHead ?? null,
    totalSpent: body.totalSpent ?? 0,
    totalTickets: body.totalTickets ?? 0,
    createdAt: now,
    updatedAt: now,
  })

  const rows = await db.select().from(customers).where(eq(customers.id, id))

  await logActivity({
    entity: "customer",
    entityId: id,
    action: "created",
    summary: `Added customer "${body.firstName} ${body.lastName}"`,
    metadata: {
      email: body.email,
    },
  })

  return NextResponse.json(
    {
      ...rows[0],
      _id: rows[0].id,
      totalSpent: Number(rows[0].totalSpent || 0),
      segmentTags: rows[0].segmentTags || [],
    },
    { status: 201 }
  )
}
