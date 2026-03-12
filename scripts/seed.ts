import 'dotenv/config'
import { sql } from "drizzle-orm"
import { db } from "../lib/db"
import {
  customers,
  events,
  families,
  packages,
  savedReports,
  ticketTemplates,
  transactions,
} from "../lib/db/schema"
import {
  mockCustomers,
  mockEvents,
  mockFamilies,
  mockPackages,
  mockSavedReports,
  mockTicketTemplates,
  mockTransactions,
} from "../lib/mock-data"

async function seed() {
  console.log("Seeding database...")

  await db.execute(sql`
    TRUNCATE TABLE
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

  console.log("Seed complete.")
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
