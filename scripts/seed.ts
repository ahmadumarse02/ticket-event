import 'dotenv/config'
import { sql } from "drizzle-orm"
import { db } from "../lib/db"
import {
  customers,
  events,
  families,
  packages,
  activityLogs,
  savedReports,
  ticketTemplates,
  transactions,
  tickets,
  ticketCheckins,
  ticketTransfers,
  waitlistEntries,
  resaleListings,
} from "../lib/db/schema"
import {
  mockCustomers,
  mockEvents,
  mockFamilies,
  mockPackages,
  mockSavedReports,
  mockTicketTemplates,
  mockTransactions,
  mockTickets,
  mockTicketCheckins,
  mockTicketTransfers,
  mockWaitlistEntries,
  mockResaleListings,
} from "../lib/mock-data"

async function seed() {
  console.log("Seeding database...")

  await db.execute(sql`
    TRUNCATE TABLE
      ticket_checkins,
      ticket_transfers,
      resale_listings,
      waitlist_entries,
      tickets,
      activity_logs,
      transactions,
      packages,
      ticket_templates,
      saved_reports,
      customers,
      families,
      events
    RESTART IDENTITY
  `)

  await db.insert(events).values(
    mockEvents.map((event) => ({
      id: event._id,
      name: event.name,
      description: event.description,
      type: event.type,
      status: event.status,
      venue: event.venue,
      address: event.address,
      city: event.city,
      country: event.country,
      onlineUrl: event.onlineUrl,
      onlinePlatform: event.onlinePlatform,
      startDate: event.startDate,
      endDate: event.endDate,
      timezone: event.timezone,
      recurrenceType: event.recurrence.type,
      recurrenceInterval: event.recurrence.interval,
      recurrenceEndDate: event.recurrence.endDate,
      capacity: event.capacity,
      isFree: event.isFree,
      priceTiers: event.priceTiers,
      tags: event.tags,
      seatSelectionEnabled: event.seatSelectionEnabled ?? false,
      seatMap: event.seatMap ?? null,
      transferRules: event.transferRules ?? { enabled: true, maxTransfersPerTicket: 1 },
      resaleRules: event.resaleRules ?? { enabled: false, maxMarkupPercent: 10 },
      fraudRules: event.fraudRules ?? { enabled: true, scanWindowMinutes: 10, maxAttempts: 3 },
      waitlistEnabled: event.waitlistEnabled ?? false,
      waitlistCapacity: event.waitlistCapacity ?? null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }))
  )

  await db.insert(families).values(
    mockFamilies.map((family) => ({
      id: family._id,
      name: family.name,
      headCustomerId: family.headCustomerId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }))
  )

  await db.insert(customers).values(
    mockCustomers.map((customer) => ({
      id: customer._id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth,
      age: customer.age,
      address: customer.address,
      city: customer.city,
      country: customer.country,
      postalCode: customer.postalCode,
      notes: customer.notes,
      familyId: customer.familyId,
      relationshipToHead: customer.relationshipToHead,
      totalSpent: customer.totalSpent,
      totalTickets: customer.totalTickets,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    }))
  )

  await db.insert(packages).values(
    mockPackages.map((pkg) => ({
      id: pkg._id,
      name: pkg.name,
      description: pkg.description,
      type: pkg.type,
      status: pkg.status,
      bundleItems: pkg.bundleItems,
      includedEventIds: pkg.includedEventIds,
      passValidDays: pkg.passValidDays,
      addonType: pkg.addonType,
      price: pkg.price,
      originalPrice: pkg.originalPrice,
      eventId: pkg.eventId,
      isGlobal: pkg.isGlobal,
      maxQuantity: pkg.maxQuantity,
      totalAvailable: pkg.totalAvailable,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    }))
  )

  await db.insert(ticketTemplates).values(
    mockTicketTemplates.map((template) => ({
      id: template._id,
      name: template.name,
      description: template.description,
      isDefault: template.isDefault,
      width: template.width,
      height: template.height,
      backgroundColor: template.backgroundColor,
      elements: template.elements,
      previewUrl: template.previewUrl,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }))
  )

  await db.insert(transactions).values(
    mockTransactions.map((tx) => ({
      id: tx._id,
      transactionNumber: tx.transactionNumber,
      customerId: tx.customer?._id,
      eventId: tx.event?._id,
      type: tx.type,
      status: tx.status,
      items: tx.items,
      subtotal: tx.subtotal,
      discount: tx.discount,
      tax: tx.tax,
      total: tx.total,
      refundedAmount: tx.refundedAmount,
      paymentMethod: tx.paymentMethod,
      paymentReference: tx.paymentReference,
      notes: tx.notes,
      source: tx.source,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    }))
  )

  await db.insert(tickets).values(
    mockTickets.map((ticket) => ({
      id: ticket._id,
      eventId: ticket.eventId,
      customerId: ticket.customerId ?? null,
      transactionId: ticket.transactionId ?? null,
      status: ticket.status,
      priceTierName: ticket.priceTierName ?? null,
      pricePaid: ticket.pricePaid ?? null,
      qrPayload: ticket.qrPayload,
      seatSection: ticket.seatSection ?? null,
      seatRow: ticket.seatRow ?? null,
      seatNumber: ticket.seatNumber ?? null,
      transferCount: ticket.transferCount,
      checkInCount: ticket.checkInCount,
      fraudFlag: ticket.fraudFlag,
      checkedInAt: ticket.status === "checked_in" ? ticket.updatedAt : null,
      lastCheckInAt: ticket.status === "checked_in" ? ticket.updatedAt : null,
      issuedAt: ticket.issuedAt,
      updatedAt: ticket.updatedAt,
    }))
  )

  await db.insert(ticketCheckins).values(
    mockTicketCheckins.map((checkin) => ({
      id: checkin._id,
      ticketId: checkin.ticketId,
      eventId: checkin.eventId,
      scannerId: checkin.scannerId ?? null,
      status: checkin.status,
      reason: checkin.reason ?? null,
      deviceId: checkin.deviceId ?? null,
      location: checkin.location ?? null,
      scannedAt: checkin.scannedAt,
      createdAt: checkin.createdAt,
    }))
  )

  await db.insert(ticketTransfers).values(
    mockTicketTransfers.map((transfer) => ({
      id: transfer._id,
      ticketId: transfer.ticketId,
      fromCustomerId: transfer.fromCustomerId ?? null,
      toCustomerId: transfer.toCustomerId ?? null,
      status: transfer.status,
      transferToken: transfer.transferToken ?? null,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
    }))
  )

  await db.insert(waitlistEntries).values(
    mockWaitlistEntries.map((entry) => ({
      id: entry._id,
      eventId: entry.eventId,
      customerId: entry.customerId,
      status: entry.status,
      quantity: entry.quantity,
      position: entry.position ?? null,
      notes: null,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }))
  )

  await db.insert(resaleListings).values(
    mockResaleListings.map((listing) => ({
      id: listing._id,
      ticketId: listing.ticketId,
      eventId: listing.eventId,
      sellerId: listing.sellerId,
      price: listing.price,
      status: listing.status,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    }))
  )

  await db.insert(savedReports).values(
    mockSavedReports.map((report) => ({
      id: report._id,
      name: report.name,
      type: report.type,
      filters: {},
      columns: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }))
  )

  const now = Date.now()
  const activitySeed = [
    {
      id: `act_${crypto.randomUUID()}`,
      entity: "event",
      entityId: mockEvents[0]?._id ?? null,
      action: "created",
      summary: `Created event "${mockEvents[0]?.name ?? "Launch Event"}"`,
      metadata: {
        status: mockEvents[0]?.status ?? "draft",
        type: mockEvents[0]?.type ?? "physical",
      },
      createdAt: now - 1000 * 60 * 60 * 2,
    },
    {
      id: `act_${crypto.randomUUID()}`,
      entity: "package",
      entityId: mockPackages[0]?._id ?? null,
      action: "created",
      summary: `Created package "${mockPackages[0]?.name ?? "Starter Pack"}"`,
      metadata: {
        type: mockPackages[0]?.type ?? "bundle",
        status: mockPackages[0]?.status ?? "active",
      },
      createdAt: now - 1000 * 60 * 60,
    },
    {
      id: `act_${crypto.randomUUID()}`,
      entity: "customer",
      entityId: mockCustomers[0]?._id ?? null,
      action: "created",
      summary: `Added customer "${mockCustomers[0]?.firstName ?? "Jordan"} ${mockCustomers[0]?.lastName ?? "Lee"}"`,
      metadata: {
        email: mockCustomers[0]?.email ?? "jordan@example.com",
      },
      createdAt: now - 1000 * 60 * 30,
    },
    {
      id: `act_${crypto.randomUUID()}`,
      entity: "family",
      entityId: mockFamilies[0]?._id ?? null,
      action: "created",
      summary: `Created family "${mockFamilies[0]?.name ?? "Aurora Family"}"`,
      metadata: {
        headCustomerId: mockFamilies[0]?.headCustomerId ?? null,
      },
      createdAt: now - 1000 * 60 * 20,
    },
    {
      id: `act_${crypto.randomUUID()}`,
      entity: "ticket_template",
      entityId: mockTicketTemplates[0]?._id ?? null,
      action: "created",
      summary: `Created ticket template "${mockTicketTemplates[0]?.name ?? "Modern Template"}"`,
      metadata: {
        isDefault: mockTicketTemplates[0]?.isDefault ?? false,
      },
      createdAt: now - 1000 * 60 * 10,
    },
  ]

  await db.insert(activityLogs).values(activitySeed)

  console.log("Seed complete.")
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
