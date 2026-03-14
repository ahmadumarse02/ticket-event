import { sql } from "drizzle-orm"
import {
  bigint,
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
} from "drizzle-orm/pg-core"

export type PriceTier = {
  name: string
  minAge?: number
  maxAge?: number
  price: number
}

export type SeatMapSection = {
  id: string
  name: string
  rows: number
  seatsPerRow: number
  rowLabelPrefix?: string
  seatLabelStart?: number
}

export type SeatMap = {
  label: string
  sections: SeatMapSection[]
}

export type TransferRules = {
  enabled: boolean
  maxTransfersPerTicket?: number
  requireRecipientEmail?: boolean
}

export type ResaleRules = {
  enabled: boolean
  maxMarkupPercent?: number
  minPrice?: number
  maxPrice?: number
  windowStart?: number
  windowEnd?: number
  feePercent?: number
}

export type FraudRules = {
  enabled: boolean
  scanWindowMinutes: number
  maxAttempts: number
}

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  status: text("status").notNull(),
  venue: text("venue"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  onlineUrl: text("online_url"),
  onlinePlatform: text("online_platform"),
  startDate: bigint("start_date", { mode: "number" }).notNull(),
  endDate: bigint("end_date", { mode: "number" }).notNull(),
  timezone: text("timezone"),
  recurrenceType: text("recurrence_type").notNull().default("none"),
  recurrenceInterval: integer("recurrence_interval"),
  recurrenceEndDate: bigint("recurrence_end_date", { mode: "number" }),
  capacity: integer("capacity"),
  isFree: boolean("is_free").notNull().default(false),
  priceTiers: jsonb("price_tiers").$type<PriceTier[]>().notNull().default(sql`'[]'::jsonb`),
  imageUrl: text("image_url"),
  ticketTemplateId: text("ticket_template_id"),
  tags: text("tags").array(),
  seatSelectionEnabled: boolean("seat_selection_enabled").notNull().default(false),
  seatMap: jsonb("seat_map").$type<SeatMap | null>(),
  transferRules: jsonb("transfer_rules")
    .$type<TransferRules>()
    .notNull()
    .default(sql`'{"enabled": true, "maxTransfersPerTicket": 1, "requireRecipientEmail": false}'::jsonb`),
  resaleRules: jsonb("resale_rules")
    .$type<ResaleRules>()
    .notNull()
    .default(sql`'{"enabled": false, "maxMarkupPercent": 10}'::jsonb`),
  fraudRules: jsonb("fraud_rules")
    .$type<FraudRules>()
    .notNull()
    .default(sql`'{"enabled": true, "scanWindowMinutes": 10, "maxAttempts": 3}'::jsonb`),
  waitlistEnabled: boolean("waitlist_enabled").notNull().default(false),
  waitlistCapacity: integer("waitlist_capacity"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
})

export const families = pgTable("families", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  headCustomerId: text("head_customer_id").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
})

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  dateOfBirth: bigint("date_of_birth", { mode: "number" }),
  age: integer("age"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  postalCode: text("postal_code"),
  notes: text("notes"),
  familyId: text("family_id"),
  relationshipToHead: text("relationship_to_head"),
  totalSpent: numeric("total_spent", { precision: 12, scale: 2 }).notNull().default("0"),
  totalTickets: integer("total_tickets").notNull().default(0),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
})

export const packages = pgTable("packages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  status: text("status").notNull(),
  bundleItems: jsonb("bundle_items"),
  includedEventIds: text("included_event_ids").array(),
  passValidDays: integer("pass_valid_days"),
  addonType: text("addon_type"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 12, scale: 2 }),
  eventId: text("event_id"),
  isGlobal: boolean("is_global").notNull().default(false),
  maxQuantity: integer("max_quantity"),
  totalAvailable: integer("total_available"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
})

export const ticketTemplates = pgTable("ticket_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  backgroundColor: text("background_color").notNull(),
  elements: jsonb("elements").notNull().default(sql`'[]'::jsonb`),
  previewUrl: text("preview_url"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
})

export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  customerId: text("customer_id"),
  transactionId: text("transaction_id"),
  status: text("status").notNull(),
  priceTierName: text("price_tier_name"),
  pricePaid: numeric("price_paid", { precision: 12, scale: 2 }),
  qrPayload: text("qr_payload").notNull(),
  seatSection: text("seat_section"),
  seatRow: text("seat_row"),
  seatNumber: text("seat_number"),
  transferCount: integer("transfer_count").notNull().default(0),
  checkInCount: integer("check_in_count").notNull().default(0),
  checkedInAt: bigint("checked_in_at", { mode: "number" }),
  lastCheckInAt: bigint("last_check_in_at", { mode: "number" }),
  fraudFlag: boolean("fraud_flag").notNull().default(false),
  issuedAt: bigint("issued_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
})

export const ticketCheckins = pgTable("ticket_checkins", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id").notNull(),
  eventId: text("event_id").notNull(),
  scannerId: text("scanner_id"),
  status: text("status").notNull(),
  reason: text("reason"),
  deviceId: text("device_id"),
  location: text("location"),
  scannedAt: bigint("scanned_at", { mode: "number" }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
})

export const ticketTransfers = pgTable("ticket_transfers", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id").notNull(),
  fromCustomerId: text("from_customer_id"),
  toCustomerId: text("to_customer_id"),
  status: text("status").notNull(),
  transferToken: text("transfer_token"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
})

export const waitlistEntries = pgTable("waitlist_entries", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  customerId: text("customer_id").notNull(),
  status: text("status").notNull(),
  quantity: integer("quantity").notNull().default(1),
  position: integer("position"),
  notes: text("notes"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
})

export const resaleListings = pgTable("resale_listings", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id").notNull(),
  eventId: text("event_id").notNull(),
  sellerId: text("seller_id").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
})

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  transactionNumber: text("transaction_number").notNull(),
  customerId: text("customer_id"),
  eventId: text("event_id"),
  type: text("type").notNull(),
  status: text("status").notNull(),
  items: jsonb("items").notNull().default(sql`'[]'::jsonb`),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  refundedAmount: numeric("refunded_amount", { precision: 12, scale: 2 }),
  paymentMethod: text("payment_method").notNull(),
  paymentReference: text("payment_reference"),
  notes: text("notes"),
  source: text("source"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
})

export const savedReports = pgTable("saved_reports", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  filters: jsonb("filters").notNull().default(sql`'{}'::jsonb`),
  columns: jsonb("columns").notNull().default(sql`'[]'::jsonb`),
  groupBy: text("group_by"),
  sortBy: text("sort_by"),
  sortOrder: text("sort_order"),
  chartType: text("chart_type"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
})

export const activityLogs = pgTable("activity_logs", {
  id: text("id").primaryKey(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  action: text("action").notNull(),
  summary: text("summary").notNull(),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  actorId: text("actor_id"),
  actorName: text("actor_name"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
})

export * from "./auth-schema"
