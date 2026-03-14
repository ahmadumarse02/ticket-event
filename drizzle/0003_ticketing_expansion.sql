ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "seat_selection_enabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "seat_map" jsonb;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "transfer_rules" jsonb NOT NULL DEFAULT '{"enabled": true, "maxTransfersPerTicket": 1, "requireRecipientEmail": false}'::jsonb;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "resale_rules" jsonb NOT NULL DEFAULT '{"enabled": false, "maxMarkupPercent": 10}'::jsonb;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "fraud_rules" jsonb NOT NULL DEFAULT '{"enabled": true, "scanWindowMinutes": 10, "maxAttempts": 3}'::jsonb;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "waitlist_enabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "waitlist_capacity" integer;

CREATE TABLE IF NOT EXISTS "tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"customer_id" text,
	"transaction_id" text,
	"status" text NOT NULL,
	"price_tier_name" text,
	"price_paid" numeric(12, 2),
	"qr_payload" text NOT NULL,
	"seat_section" text,
	"seat_row" text,
	"seat_number" text,
	"transfer_count" integer DEFAULT 0 NOT NULL,
	"check_in_count" integer DEFAULT 0 NOT NULL,
	"checked_in_at" bigint,
	"last_check_in_at" bigint,
	"fraud_flag" boolean DEFAULT false NOT NULL,
	"issued_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "ticket_checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"event_id" text NOT NULL,
	"scanner_id" text,
	"status" text NOT NULL,
	"reason" text,
	"device_id" text,
	"location" text,
	"scanned_at" bigint NOT NULL,
	"created_at" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "ticket_transfers" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"from_customer_id" text,
	"to_customer_id" text,
	"status" text NOT NULL,
	"transfer_token" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "waitlist_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"status" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"position" integer,
	"notes" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "resale_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"event_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"status" text NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
