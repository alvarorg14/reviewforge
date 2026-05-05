ALTER TABLE "ai_review_runs" ADD COLUMN "pr_head_sha" text;--> statement-breakpoint
ALTER TABLE "ai_review_runs" ADD COLUMN "github_check_run_id" bigint;--> statement-breakpoint
ALTER TABLE "ai_review_runs" ADD COLUMN "review_trigger" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "installations" ADD COLUMN "default_auto_review_user_id" integer;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "auto_review_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "auto_review_user_id" integer;--> statement-breakpoint
ALTER TABLE "installations" ADD CONSTRAINT "installations_default_auto_review_user_id_users_id_fk" FOREIGN KEY ("default_auto_review_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_auto_review_user_id_users_id_fk" FOREIGN KEY ("auto_review_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;