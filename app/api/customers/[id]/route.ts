import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { customers } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const rows = await db.select().from(customers).where(eq(customers.id, id))
  if (!rows.length) {
    return NextResponse.json({ message: "Customer not found" }, { status: 404 })
  }
  return NextResponse.json({
    ...rows[0],
    _id: rows[0].id,
    totalSpent: Number(rows[0].totalSpent || 0),
  })
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params
  const body = await request.json()
  const updates = {
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
    familyId: body.familyId ?? null,
    relationshipToHead: body.relationshipToHead ?? null,
    totalSpent: body.totalSpent ?? 0,
    totalTickets: body.totalTickets ?? 0,
    updatedAt: Date.now(),
  }

  const [updated] = await db
    .update(customers)
    .set(updates)
    .where(eq(customers.id, id))
    .returning()

  if (!updated) {
    return NextResponse.json({ message: "Customer not found" }, { status: 404 })
  }

  return NextResponse.json({
    ...updated,
    _id: updated.id,
    totalSpent: Number(updated.totalSpent || 0),
  })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const deleted = await db
    .delete(customers)
    .where(eq(customers.id, id))
    .returning({ id: customers.id })

  if (!deleted.length) {
    return NextResponse.json({ message: "Customer not found" }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
