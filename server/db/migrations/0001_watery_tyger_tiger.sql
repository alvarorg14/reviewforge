CREATE TABLE "ai_review_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"repository_id" integer NOT NULL,
	"pr_number" integer NOT NULL,
	"requested_by_user_id" integer NOT NULL,
	"status" text NOT NULL,
	"cursor_agent_id" text,
	"summary" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ai_review_runs" ADD CONSTRAINT "ai_review_runs_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_runs" ADD CONSTRAINT "ai_review_runs_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_review_runs_repo_pr_idx" ON "ai_review_runs" USING btree ("repository_id","pr_number");