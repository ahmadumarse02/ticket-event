import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { customers, events, tickets, transactions } from "@/lib/db/schema"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

type CheckoutBody = {
  eventId?: string
  customer?: { firstName?: string; lastName?: string; email?: string }
  quantity?: number
  priceTierName?: string | null
  paymentMethod?: "card" | "cash" | "paypal" | "bank_transfer" | "other"
  seat?: { section: string; row: string; seatNumber: string } | null
}

const toNumber = (value: unknown) =>
  value === null || value === undefined ? 0 : Number(value)

const buildTransactionNumber = () => {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `TRX-${year}-${rand}`
}

export async function POST(request: Request) {
  const body = (await request.json()) as CheckoutBody
  const now = Date.now()

  if (!body.eventId) {
    return NextResponse.json({ message: "Event id is required" }, { status: 400 })
  }

  const quantity = body.seat ? 1 : Number(body.quantity || 1)
  if (Number.isNaN(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json({ message: "Invalid quantity" }, { status: 400 })
  }

  const eventRows = await db.select().from(events).where(eq(events.id, body.eventId))
  const event = eventRows[0]
  if (!event) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 })
  }

  const isFree = event.isFree || (event.priceTiers || []).length === 0
  const tierName = isFree ? null : (body.priceTierName || null)

  let unitPrice = 0
  if (!isFree) {
    const tiers = event.priceTiers || []
    const chosen = tierName ? tiers.find((t) => t.name === tierName) : undefined
    if (!chosen) {
      return NextResponse.json({ message: "Ticket type is required" }, { status: 400 })
    }
    unitPrice = Number(chosen.price || 0)
    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      return NextResponse.json({ message: "Invalid ticket price" }, { status: 400 })
    }
  }

  if (body.seat) {
    if (!event.seatSelectionEnabled) {
      return NextResponse.json({ message: "Seat selection is disabled" }, { status: 400 })
    }

    const seat = body.seat
    const existing = await db
      .select({ id: tickets.id, status: tickets.status })
      .from(tickets)
      .where(
        and(
          eq(tickets.eventId, event.id),
          eq(tickets.seatSection, seat.section),
          eq(tickets.seatRow, seat.row),
          eq(tickets.seatNumber, seat.seatNumber)
        )
      )

    const taken = existing.some((row) => !["cancelled", "void"].includes(row.status))
    if (taken) {
      return NextResponse.json({ message: "Seat is already taken" }, { status: 409 })
    }
  }

  const firstName = body.customer?.firstName?.trim() || ""
  const lastName = body.customer?.lastName?.trim() || ""
  const email = (body.customer?.email || "").trim().toLowerCase()

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ message: "Customer details are required" }, { status: 400 })
  }

  const existingCustomerRows = await db.select().from(customers).where(eq(customers.email, email))
  let customerId = existingCustomerRows[0]?.id

  if (!customerId) {
    customerId = `cus_${crypto.randomUUID()}`
    await db.insert(customers).values({
      id: customerId,
      firstName,
      lastName,
      email,
      phone: null,
      dateOfBirth: null,
      age: null,
      address: null,
      city: null,
      country: null,
      postalCode: null,
      notes: null,
      familyId: null,
      relationshipToHead: null,
      totalSpent: "0",
      totalTickets: 0,
      createdAt: now,
      updatedAt: now,
    })
  }

  const subtotal = unitPrice * quantity
  const tax = 0
  const discount = 0
  const total = subtotal - discount + tax

  const transactionId = `tx_${crypto.randomUUID()}`
  const transactionNumber = buildTransactionNumber()
  const paymentMethod = body.paymentMethod || "card"

  await db.insert(transactions).values({
    id: transactionId,
    transactionNumber,
    customerId,
    eventId: event.id,
    type: isFree ? "purchase" : "purchase",
    status: "completed",
    items: [
      {
        type: "ticket",
        name: tierName || "Ticket",
        priceTier: tierName || undefined,
        quantity,
        unitPrice,
        totalPrice: total,
      },
    ],
    subtotal,
    discount,
    tax,
    total,
    refundedAmount: null,
    paymentMethod,
    paymentReference: null,
    notes: null,
    source: "public_checkout",
    createdAt: now,
    updatedAt: now,
  })

  const ticketRecords = Array.from({ length: quantity }).map((_, index) => ({
    id: `tkt_${crypto.randomUUID()}`,
    eventId: event.id,
    customerId,
    transactionId,
    status: "active",
    priceTierName: tierName,
    pricePaid: isFree ? "0" : unitPrice.toFixed(2),
    qrPayload: `QR-${crypto.randomUUID()}`,
    seatSection: body.seat ? body.seat.section : null,
    seatRow: body.seat ? body.seat.row : null,
    seatNumber: body.seat ? body.seat.seatNumber : null,
    transferCount: 0,
    checkInCount: 0,
    checkedInAt: null,
    lastCheckInAt: null,
    fraudFlag: false,
    issuedAt: now + index,
    updatedAt: now,
  }))

  await db.insert(tickets).values(ticketRecords)

  if (existingCustomerRows[0]) {
    const prevSpent = toNumber(existingCustomerRows[0].totalSpent)
    const prevTickets = existingCustomerRows[0].totalTickets || 0
    await db
      .update(customers)
      .set({
        totalSpent: (prevSpent + total).toFixed(2),
        totalTickets: prevTickets + quantity,
        updatedAt: now,
      })
      .where(eq(customers.id, customerId))
  }

  await logActivity({
    entity: "checkout",
    entityId: transactionId,
    action: "created",
    summary: `Checkout created for event "${event.name}"`,
    metadata: {
      eventId: event.id,
      customerId,
      quantity,
      total,
      seat: body.seat ?? null,
    },
  })

  return NextResponse.json({ transactionId, ticketsIssued: quantity }, { status: 201 })
}
