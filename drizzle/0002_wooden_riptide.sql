CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"action" text NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_id" text,
	"actor_name" text,
	"created_at" bigint NOT NULL
);
