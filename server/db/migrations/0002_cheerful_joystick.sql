ALTER TABLE "repositories" ADD COLUMN "ai_context" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "ai_allow_approve" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "ai_review_style" text DEFAULT 'thorough' NOT NULL;