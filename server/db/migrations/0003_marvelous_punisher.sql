ALTER TABLE "users" ADD COLUMN "cursor_api_key_encrypted" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cursor_api_key_updated_at" timestamp with time zone;