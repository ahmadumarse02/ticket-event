CREATE TABLE IF NOT EXISTS "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"date_of_birth" bigint,
	"age" integer,
	"address" text,
	"city" text,
	"country" text,
	"postal_code" text,
	"notes" text,
	"family_id" text,
	"relationship_to_head" text,
	"total_spent" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_tickets" integer DEFAULT 0 NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"venue" text,
	"address" text,
	"city" text,
	"country" text,
	"online_url" text,
	"online_platform" text,
	"start_date" bigint NOT NULL,
	"end_date" bigint NOT NULL,
	"timezone" text,
	"recurrence_type" text DEFAULT 'none' NOT NULL,
	"recurrence_interval" integer,
	"recurrence_end_date" bigint,
	"capacity" integer,
	"is_free" boolean DEFAULT false NOT NULL,
	"price_tiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_url" text,
	"ticket_template_id" text,
	"tags" text[],
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "families" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"head_customer_id" text NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "packages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"bundle_items" jsonb,
	"included_event_ids" text[],
	"pass_valid_days" integer,
	"addon_type" text,
	"price" numeric(12, 2) NOT NULL,
	"original_price" numeric(12, 2),
	"event_id" text,
	"is_global" boolean DEFAULT false NOT NULL,
	"max_quantity" integer,
	"total_available" integer,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"columns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"group_by" text,
	"sort_by" text,
	"sort_order" text,
	"chart_type" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ticket_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"background_color" text NOT NULL,
	"elements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preview_url" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_number" text NOT NULL,
	"customer_id" text,
	"event_id" text,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"refunded_amount" numeric(12, 2),
	"payment_method" text NOT NULL,
	"payment_reference" text,
	"notes" text,
	"source" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
