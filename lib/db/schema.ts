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

export * from "./auth-schema"
