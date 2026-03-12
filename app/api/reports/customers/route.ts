import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { customers, families } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export async function GET() {
  const customerRows = await db.select().from(customers)
  const familyRows = await db.select().from(families)

  const totalCustomers = customerRows.length
  const familyAccounts = familyRows.length
  const individualAccounts = Math.max(totalCustomers - familyAccounts, 0)
  const repeatCustomers = customerRows.filter((c) => (c.totalTickets || 0) > 1).length
  const newCustomers = customerRows.filter(
    (c) => c.createdAt > Date.now() - 30 * 24 * 60 * 60 * 1000
  ).length

  const ageGroups: Record<string, number> = {
    "0-12": 0,
    "13-17": 0,
    "18-25": 0,
    "26-35": 0,
    "36-50": 0,
    "51-65": 0,
    "65+": 0,
    Unknown: 0,
  }

  customerRows.forEach((customer) => {
    const age = customer.age ?? undefined
    if (age === undefined || age === null) {
      ageGroups.Unknown += 1
      return
    }
    if (age <= 12) ageGroups["0-12"] += 1
    else if (age <= 17) ageGroups["13-17"] += 1
    else if (age <= 25) ageGroups["18-25"] += 1
    else if (age <= 35) ageGroups["26-35"] += 1
    else if (age <= 50) ageGroups["36-50"] += 1
    else if (age <= 65) ageGroups["51-65"] += 1
    else ageGroups["65+"] += 1
  })

  const topCustomers = [...customerRows]
    .sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0))
    .slice(0, 5)
    .map((customer) => ({
      ...customer,
      _id: customer.id,
      totalSpent: Number(customer.totalSpent || 0),
    }))

  return NextResponse.json({
    summary: {
      totalCustomers,
      familyAccounts,
      individualAccounts,
      repeatCustomers,
      newCustomers,
    },
    ageGroups,
    topCustomers,
  })
}
