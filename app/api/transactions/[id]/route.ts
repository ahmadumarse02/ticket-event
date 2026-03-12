import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { transactions } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params
  const body = await request.json()
  const updates = {
    status: body.status,
    refundedAmount: body.refundedAmount ?? null,
    updatedAt: Date.now(),
  }

  const [updated] = await db
    .update(transactions)
    .set(updates)
    .where(eq(transactions.id, id))
    .returning()

  if (!updated) {
    return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
  }

  return NextResponse.json({ ...updated, _id: updated.id })
}
