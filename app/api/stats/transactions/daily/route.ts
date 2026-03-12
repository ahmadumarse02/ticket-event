import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { transactions } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

const toNumber = (value: unknown) =>
  value === null || value === undefined ? 0 : Number(value)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get("days") || "7")
  const rows = await db.select().from(transactions)
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  const results: { date: number; revenue: number }[] = []
  const start = now - (days - 1) * dayMs

  for (let i = 0; i < days; i++) {
    const dayStart = new Date(start + i * dayMs)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + dayMs)
    const revenue = rows
      .filter(
        (tx) =>
          tx.status === "completed" &&
          tx.createdAt >= dayStart.getTime() &&
          tx.createdAt < dayEnd.getTime()
      )
      .reduce((sum, tx) => sum + toNumber(tx.total), 0)
    results.push({ date: dayStart.getTime(), revenue })
  }

  return NextResponse.json(results)
}
